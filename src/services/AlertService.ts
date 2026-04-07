import { Context, Effect, Layer, Console } from "effect"
import type { Telemetry } from "../domain/Telemetry.js"

// Alert service evaluates telemetry and triggers alerts
export class AlertService extends Context.Tag("AlertService")<
  AlertService,
  {
    readonly evaluate: (telemetry: Telemetry) => Effect.Effect<void>
  }
>() {}

export const AlertServiceLive = Layer.succeed(
  AlertService,
  AlertService.of({
    evaluate: (telemetry) =>
      Effect.gen(function* () {
        // High temperature alert
        if (telemetry.temperatureF > 120) {
          yield* Console.log(
            `[ALERT] High temperature on ${telemetry.deviceId}: ${telemetry.temperatureF}`
          )
        }

        // Low battery alert
        if (telemetry.batteryPercent < 25) {
          yield* Console.log(
            `[ALERT] Low battery on ${telemetry.deviceId}: ${telemetry.batteryPercent}%`
          )
        }

        // No flow alert
        if (telemetry.flowRateGpm === 0) {
          yield* Console.log(
            `[ALERT] No flow detected on ${telemetry.deviceId}`
          )
        }
      })
  })
)