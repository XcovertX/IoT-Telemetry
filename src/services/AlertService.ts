import { Context, Effect, Layer, Console } from "effect"
import type { Telemetry } from "../domain/Telemetry.js"
import { AppConfig } from "../config/AppConfig.js"

/**
 * Alert service evaluates telemetry and triggers alerts.
 */
export class AlertService extends Context.Tag("AlertService")<
  AlertService,
  {
    readonly evaluate: (telemetry: Telemetry) => Effect.Effect<void>
  }
>() {}

/**
 * Build alert service from config so thresholds are runtime-configurable.
 */
export const AlertServiceLive = Layer.effect(
  AlertService,
  Effect.gen(function* () {
    const config = yield* AppConfig

    return AlertService.of({
      evaluate: (telemetry) =>
        Effect.gen(function* () {
          if (telemetry.temperatureF > config.highTemperatureThreshold) {
            yield* Console.log(
              `[ALERT] High temperature on ${telemetry.deviceId}: ${telemetry.temperatureF}`
            )
          }

          if (telemetry.batteryPercent < config.lowBatteryThreshold) {
            yield* Console.log(
              `[ALERT] Low battery on ${telemetry.deviceId}: ${telemetry.batteryPercent}%`
            )
          }

          if (telemetry.flowRateGpm === 0) {
            yield* Console.log(
              `[ALERT] No flow detected on ${telemetry.deviceId}`
            )
          }
        })
    })
  })
)