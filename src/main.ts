import { Console, Effect, Schedule, Duration } from "effect"
import { DeviceSimulator } from "./services/DeviceSimulator.js"
import { TelemetryProcessor } from "./services/TelemetryProcessor.js"
import { ApiServer } from "./services/ApiServer.js"
import { DeviceStatusRepository } from "./services/DeviceStatusRepository.js"
import { AzurePublisher } from "./services/AzurePublisher.js"
import { LiveServices } from "./layers/LiveServices.js"
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
    
    // Local processing first
    yield* processor.process(telemetry)
    // Then publish to Azure
    yield* azurePublisher.publishTelemetry(telemetry).pipe(
      // Treat cloud publish as transient/retriable
      Effect.retry(Schedule.recurs(2))
    )
    // Successful end-to-end poll
    yield* statusRepo.markOnline(deviceId, telemetry.timestamp)
  }).pipe(
    Effect.retry(Schedule.recurs(2)),
    Effect.catchTag("DeviceOfflineError", (error: DeviceOfflineError) =>
      Effect.gen(function* () {
        const statusRepo = yield* DeviceStatusRepository
        yield* statusRepo.markFailure(deviceId, error.message)
        yield* Console.log(`[WARN] ${error.message}`)
      })
    ),
    Effect.catchTag("TelemetryValidationError", (error: TelemetryValidationError) =>
      Effect.gen(function* () {
        const statusRepo = yield* DeviceStatusRepository
        yield* statusRepo.markFailure(deviceId, error.message)
        yield* Console.log(`[WARN] ${error.message}`)
      })
    ),
    Effect.catchAll((error) =>
      Effect.gen(function* () {
        const statusRepo = yield* DeviceStatusRepository
        const errorMessage = typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error)
        yield* statusRepo.markFailure(deviceId, errorMessage)
        yield* Console.log(`[WARN] Azure publish failed for ${deviceId}: ${errorMessage}`)
      })
    )
  )

// polls devices concurrently rather than one-by-one
const pollAllDevicesOnce = Effect.forEach(
  deviceIds,
  (deviceId) => pollDevice(deviceId),
  { concurrency: "unbounded" }
)

// Periodically print a fleet summary so you can see health changes.
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

const pollingLoop = pollAllDevicesOnce.pipe(
  Effect.repeat(Schedule.spaced(Duration.seconds(3)))
)

const summaryLoop = logFleetSummary.pipe(
  Effect.repeat(Schedule.spaced(Duration.seconds(10)))
)

// Start HTTP API server
const apiLoop = Effect.gen(function* () {
  const api = yield* ApiServer
  yield* Console.log("Starting API server on http://localhost:3000")
  yield* api.start()
})

const program = Effect.gen(function* () {
  yield* Console.log("Starting Telemetry + Lifecycleg system...")

  // Run polling and summary loops concurrently
  yield* Effect.all(
    [pollingLoop, summaryLoop, apiLoop],
    { concurrency: "unbounded" }
  )
}).pipe(
// provide live implementations of services
  Effect.provide(LiveServices)
)

// run the program
Effect.runPromise(program)