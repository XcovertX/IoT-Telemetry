import { Context, Effect, Layer } from "effect"
import type { Telemetry } from "../domain/Telemetry.js"

/**
 * Repository service definition.
 * This acts like a database (but in-memory for now).
 */
export class TelemetryRepository extends Context.Tag("TelemetryRepository")<
  TelemetryRepository,
  {
    // Store latest telemetry for a device
    readonly save: (telemetry: Telemetry) => Effect.Effect<void>

    // Get latest telemetry for a device
    readonly get: (deviceId: string) => Effect.Effect<Telemetry | undefined>
  }
>() {}


// In-memory implementation using a Map
export const TelemetryRepositoryLive = Layer.succeed(
  TelemetryRepository,
  TelemetryRepository.of({
    // internal state (private to the service)
    save: (telemetry) =>
      Effect.sync(() => {
        store.set(telemetry.deviceId, telemetry)
      }),

    get: (deviceId) =>
      Effect.sync(() => {
        return store.get(deviceId)
      })
  })
)


// Shared in-memory store
const store = new Map<string, Telemetry>()