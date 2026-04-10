import "dotenv/config"
import { Console, Duration, Effect, Schedule } from "effect"
import { AppConfig } from "./config/AppConfig.js"
import { DeviceSimulator } from "./services/DeviceSimulator.js"
import { TelemetryProcessor } from "./services/TelemetryProcessor.js"
import { DeviceStatusRepository } from "./services/DeviceStatusRepository.js"
import { ApiServer } from "./services/ApiServer.js"
import { AzurePublisher } from "./services/AzurePublisher.js"
import { LiveServices } from "./layers/LiveServices.js"
import { AzurePublishError } from "./errors/AzureError.js"
import {
  DeviceOfflineError,
  TelemetryValidationError
} from "./errors/TelemetryError.js"

const deviceIds = [
  "device-001",
  "device-002",
  "device-003",
  "device-004"
]

const pollDevice = (deviceId: string) =>
  Effect.gen(function* () {
    const simulator = yield* DeviceSimulator
    const processor = yield* TelemetryProcessor
    const statusRepo = yield* DeviceStatusRepository
    const azurePublisher = yield* AzurePublisher

    const telemetry = yield* simulator.readTelemetry(deviceId)
    yield* processor.process(telemetry)
    yield* azurePublisher.publishTelemetry(telemetry)
    yield* statusRepo.markOnline(deviceId, telemetry.timestamp)
  }).pipe(
    Effect.retry(Schedule.recurs(2)),
    Effect.catchTag("DeviceOfflineError", (error) =>
      Effect.gen(function* () {
        const statusRepo = yield* DeviceStatusRepository
        yield* statusRepo.markFailure(deviceId, error.message)
        yield* Console.log(`[WARN] ${error.message}`)
      })
    ),
    Effect.catchTag("TelemetryValidationError", (error) =>
      Effect.gen(function* () {
        const statusRepo = yield* DeviceStatusRepository
        yield* statusRepo.markFailure(deviceId, error.message)
        yield* Console.log(`[WARN] ${error.message}`)
      })
    ),
    Effect.catchTag("AzurePublishError", (error) =>
    Effect.gen(function* () {
        const statusRepo = yield* DeviceStatusRepository
        yield* statusRepo.markFailure(deviceId, error.message)
        yield* Console.log(`[WARN] Azure publish failed for ${deviceId}: ${error.message}`)
      })
    )
  )

const pollAllDevicesOnce = Effect.forEach(
  deviceIds,
  (deviceId) => pollDevice(deviceId),
  { concurrency: "unbounded" }
)

const logFleetSummary = Effect.gen(function* () {
  const statusRepo = yield* DeviceStatusRepository
  const statuses = yield* statusRepo.getAll()

  const online = statuses.filter((s) => s.status === "online").length
  const degraded = statuses.filter((s) => s.status === "degraded").length
  const offline = statuses.filter((s) => s.status === "offline").length

  yield* Console.log(
    `[FLEET] online=${online} degraded=${degraded} offline=${offline}`
  )
})

const program = Effect.gen(function* () {
  const config = yield* AppConfig
  const api = yield* ApiServer

  const pollingLoop = pollAllDevicesOnce.pipe(
    Effect.repeat(
      Schedule.spaced(Duration.seconds(config.pollIntervalSeconds))
    )
  )

  const summaryLoop = logFleetSummary.pipe(
    Effect.repeat(
      Schedule.spaced(Duration.seconds(config.fleetSummaryIntervalSeconds))
    )
  )

  const apiLoop = Effect.gen(function* () {
    yield* Console.log(`Starting API server on http://localhost:${config.apiPort}`)
    yield* api.start()
  })

  yield* Console.log("Starting telemetry + lifecycle + API + Azure mock system...")

  yield* Effect.all(
    [pollingLoop, summaryLoop, apiLoop],
    { concurrency: "unbounded" }
  )
}).pipe(
  Effect.provide(LiveServices)
)

Effect.runPromise(program)