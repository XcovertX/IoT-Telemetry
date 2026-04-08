import { Context, Effect, Layer, Console } from "effect"
import type { Telemetry } from "../domain/Telemetry.js"

/**
 * Service contract for publishing telemetry to Azure.
 *
 * Right now this is just a mock implementation.
 * Later, swap the live layer for a real Azure IoT Hub implementation
 * without changing the rest of the application.
 */
export class AzurePublisher extends Context.Tag("AzurePublisher")<
  AzurePublisher,
  {
    readonly publishTelemetry: (telemetry: Telemetry) => Effect.Effect<void>
  }
>() {}

/**
 * Mock Azure implementation.
 *
 * For now, this just logs the telemetry payload so we can prove that:
 * - the service is wired correctly
 * - publishing is happening at the right place in the workflow
 * - the app is ready for a real Azure adapter later
 */
export const AzurePublisherMockLive = Layer.succeed(
  AzurePublisher,
  AzurePublisher.of({
    publishTelemetry: (telemetry) =>
      Console.log(
        `[AZURE MOCK] Publishing telemetry for ${telemetry.deviceId}: ${JSON.stringify(
          telemetry
        )}`
      )
  })
)