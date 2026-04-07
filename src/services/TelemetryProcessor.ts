import { Context, Effect, Layer, Console } from "effect"
import type { Telemetry } from "../domain/Telemetry.js"
import { TelemetryValidationError } from "../errors/TelemetryError.js"


// service definition for processing telemetry data
// Context.Tag creates a dependency that defines what the service does
// consumers request this service with: const processor = yield* TelemetryProcessor
export class TelemetryProcessor extends Context.Tag("TelemetryProcessor")<
  TelemetryProcessor,
  {
    readonly process: (
      telemetry: Telemetry
    ) => Effect.Effect<void, TelemetryValidationError>
  }
>() {}

export const TelemetryProcessorLive = Layer.succeed(
  TelemetryProcessor,
  TelemetryProcessor.of({
    process: (telemetry) =>
      Effect.gen(function* () {
        // validation, check that telemetry values are within expected ranges
        if (telemetry.temperatureF < 32 || telemetry.temperatureF > 180) {
          return yield* Effect.fail(
            new TelemetryValidationError("temperature out of expected range")
          )
        }
        // validation, check that telemetry values are within expected ranges
        if (telemetry.flowRateGpm < 0) {
          return yield* Effect.fail(
            new TelemetryValidationError("flow rate cannot be negative")
          )
        }

        // log the processed telemetry data
        yield* Console.log(
          JSON.stringify({
            level: "info",
            msg: "processed telemetry",
            deviceId: telemetry.deviceId,
            temperatureF: telemetry.temperatureF,
            flowRateGpm: telemetry.flowRateGpm,
            batteryPercent: telemetry.batteryPercent,
            timestamp: telemetry.timestamp
          })
        )
      })
  })
)