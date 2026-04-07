import { Context, Effect, Layer } from "effect"
import type { Telemetry } from "../domain/Telemetry.js"
import { DeviceOfflineError } from "../errors/TelemetryError.js"

// This service pretends to be a device that sometimes fails and otherwise emits telemetry.

// context.Tag creates a context tag for the DeviceSimulator service
// use with const simulator = yield* DeviceSimulator
// Effect provides the implementation through a Layer
export class DeviceSimulator extends Context.Tag("DeviceSimulator")<
  DeviceSimulator,
  {
    // readTelemetry is an async operation that simulates reading telemetry data from a device
    // success with Telemetry
    // failure with DeviceOfflineError
    readonly readTelemetry: (deviceId: string) => Effect.Effect<Telemetry, DeviceOfflineError>
  }
>() {}
// Live implementation of service
// Layer.succeed wires a concrete implementation to the DeviceSimulator tag.
// this is dependency injection via Layers
export const DeviceSimulatorLive = Layer.succeed(
  DeviceSimulator,
  DeviceSimulator.of({
    // simulate reading telemetry data from a device
    // uses Effect.gen for sequential, readable async logic
    readTelemetry: (deviceId: string) =>
      Effect.gen(function* () {
        const roll = Math.random() // random number between 0 and 1


        // 20% chance the device is offline
        if (roll < 0.2) {
          return yield* Effect.fail(new DeviceOfflineError(deviceId))
        }

        return {
          deviceId,

          // Simulated temperature between ~65–85°F
          temperatureF: 65 + Math.round(Math.random() * 20),

          // Simulated flow rate between ~0.5–3.5 GPM
          flowRateGpm: Math.round((0.5 + Math.random() * 3) * 10) / 10,

          // Simulated battery percentage between 40–100%
          batteryPercent: 40 + Math.round(Math.random() * 60),

          // Timestamp of when the telemetry was read
          timestamp: Date.now()
        }
      })
  })
)