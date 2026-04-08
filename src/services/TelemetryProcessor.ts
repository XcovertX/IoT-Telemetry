import { Context, Effect, Layer, Console } from "effect"
import type { Telemetry } from "../domain/Telemetry.js"
import { TelemetryValidationError } from "../errors/TelemetryError.js"
import { TelemetryRepository } from "./TelemetryRepository.js"
import { AlertService } from "./AlertService.js"

/**
 * Processes telemetry through the pipeline
 */
export class TelemetryProcessor extends Context.Tag("TelemetryProcessor")<
  TelemetryProcessor,
  {
    readonly process: (
      telemetry: Telemetry
    ) => Effect.Effect<void, TelemetryValidationError>
  }
>() {}

/**
 * Build the service from its dependencies.
 * Because this implementation depends on TelemetryRepository and AlertService,
 * we use Layer.effect instead of Layer.succeed.
 */
export const TelemetryProcessorLive = Layer.effect(
  TelemetryProcessor,
  Effect.gen(function* () {
    // Resolve dependencies once when constructing the service
    const repo = yield* TelemetryRepository
    const alerts = yield* AlertService

    return TelemetryProcessor.of({
      process: (telemetry) =>
        Effect.gen(function* () {
          // Validate telemetry
          if (telemetry.temperatureF < 32 || telemetry.temperatureF > 180) {
            return yield* Effect.fail(
              new TelemetryValidationError(
                `Temperature out of range for ${telemetry.deviceId}`
              )
            )
          }

          if (telemetry.flowRateGpm < 0) {
            return yield* Effect.fail(
              new TelemetryValidationError(
                `Negative flow rate for ${telemetry.deviceId}`
              )
            )
          }

          // Log structured telemetry
          yield* Console.log(
            JSON.stringify({
              level: "info",
              msg: "processed telemetry",
              ...telemetry
            })
          )

          // Save to repository
          yield* repo.save(telemetry)

          // Evaluate alerts
          yield* alerts.evaluate(telemetry)
        })
    })
  })
)