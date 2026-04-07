import { Console, Effect, Schedule, Duration } from "effect"
import { DeviceSimulator } from "./services/DeviceSimulator.js"
import { TelemetryProcessor } from "./services/TelemetryProcessor.js"
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

const program = Effect.gen(function* () {
  yield* Console.log("Starting multi-device polling system...")

  yield* pollAllDevicesOnce.pipe(
    // repeat polling at regular intervals (every 3 seconds)
    Effect.repeat(
      Schedule.spaced(Duration.seconds(3))
    )
  )
}).pipe(
// provide live implementations of services
  Effect.provide(LiveServices)
)

// run the program
Effect.runPromise(program)