import { Config, Context, Effect, Layer, Console } from "effect"
import { Client, Message } from "azure-iot-device"
import { Mqtt } from "azure-iot-device-mqtt"
import type { Telemetry } from "../domain/Telemetry.js"
import { AzurePublishError } from "../errors/AzureError.js"

export class AzurePublisher extends Context.Tag("AzurePublisher")<
  AzurePublisher,
  {
    readonly publishTelemetry: (
      telemetry: Telemetry
    ) => Effect.Effect<void, AzurePublishError>
  }
>() {}

/**
 * Mock implementation
 */
export const AzurePublisherMockLive = Layer.succeed(
  AzurePublisher,
  AzurePublisher.of({
    publishTelemetry: (telemetry) =>
      Console.log(
        `[AZURE MOCK] Publishing telemetry for ${telemetry.deviceId}: ${JSON.stringify(
          telemetry
        )}`
      ).pipe(
        Effect.mapError(
          (error: unknown) =>
            new AzurePublishError({
              message: error instanceof Error ? error.message : String(error)
            })
        )
      )
  })
)

/**
 * Real Azure IoT Hub implementation
 */
export const AzurePublisherIoTHubLive = Layer.effect(
  AzurePublisher,
  Effect.gen(function* () {
    const connectionString = yield* Config.string(
      "AZURE_IOT_DEVICE_CONNECTION_STRING"
    )

    const client = Client.fromConnectionString(connectionString, Mqtt)

    yield* Effect.tryPromise({
      try: () => client.open(),
      catch: (error) =>
        new AzurePublishError({
          message:
            error instanceof Error ? error.message : String(error)
        })
    })

    return AzurePublisher.of({
      publishTelemetry: (telemetry) =>
        Effect.tryPromise({
          try: async () => {
            const message = new Message(JSON.stringify(telemetry))
            message.contentType = "application/json"
            message.contentEncoding = "utf-8"
            await client.sendEvent(message)
          },
          catch: (error) =>
            new AzurePublishError({
              message:
                error instanceof Error ? error.message : String(error)
            })
        })
    })
  })
)