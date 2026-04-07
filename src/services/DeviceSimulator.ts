// This service pretends to be a device that sometimes fails and otherwise emits telemetry.

import { Context, Effect, Layer } from "effect"
import type { Telemetry } from "../domain/Telemetry.js"
import { DeviceOfflineError } from "../errors/TelemetryError.js"

export class DeviceSimulator extends Context.Tag("DeviceSimulator")<
  DeviceSimulator,
  {
    readonly readTelemetry: (deviceId: string) => Effect.Effect<Telemetry, DeviceOfflineError>
  }
>() {}

export const DeviceSimulatorLive = Layer.succeed(
  DeviceSimulator,
  DeviceSimulator.of({
    readTelemetry: (deviceId: string) =>
      Effect.gen(function* () {
        const roll = Math.random()

        if (roll < 0.2) {
          return yield* Effect.fail(new DeviceOfflineError(deviceId))
        }

        return {
          deviceId,
          temperatureF: 65 + Math.round(Math.random() * 20),
          flowRateGpm: Math.round((0.5 + Math.random() * 3) * 10) / 10,
          batteryPercent: 40 + Math.round(Math.random() * 60),
          timestamp: Date.now()
        }
      })
  })
)