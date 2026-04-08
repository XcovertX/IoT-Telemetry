import { Console, Effect, Schedule, Duration } from "effect"
import { DeviceSimulator } from "./services/DeviceSimulator.js"
import { TelemetryProcessor } from "./services/TelemetryProcessor.js"
import { LiveServices } from "./layers/LiveServices.js"
import { DeviceStatusRepository } from "./services/DeviceStatusRepository.js"
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

    const telemetry = yield* simulator.readTelemetry(deviceId)
    yield* processor.process(telemetry)
  }).pipe(
    // retry policy: retry up to 2 times on failure
    Effect.retry(Schedule.recurs(2)), 
    // handle specific error cases
    Effect.catchTags({
      DeviceOfflineError: (error: DeviceOfflineError) =>
        Console.log(`[WARN] ${error.message}`),
      TelemetryValidationError: (error: TelemetryValidationError) =>
        Console.log(`[WARN] ${error.message}`)
    })
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

const program = Effect.gen(function* () {
  yield* Console.log("Starting Telemetry + Lifecycleg system...")

  // Run polling and summary loops concurrently
  yield* Effect.all(
    [pollingLoop, summaryLoop],
    { concurrency: "unbounded" }
  )
}).pipe(
// provide live implementations of services
  Effect.provide(LiveServices)
)

// run the program
Effect.runPromise(program)