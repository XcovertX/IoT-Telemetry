import { Context, Effect, Layer, Ref } from "effect"
import type { Telemetry } from "../domain/Telemetry.js"

/**
 * Repository service definition.
 *
 * This acts like an in-memory database for latest telemetry.
 */
export class TelemetryRepository extends Context.Tag("TelemetryRepository")<
  TelemetryRepository,
  {
    /**
     * Store latest telemetry for a device
     */
    readonly save: (telemetry: Telemetry) => Effect.Effect<void>

    /**
     * Get latest telemetry for one device
     */
    readonly get: (deviceId: string) => Effect.Effect<Telemetry | undefined>

    /**
     * Get latest telemetry for all devices
     */
    readonly getAll: () => Effect.Effect<ReadonlyArray<Telemetry>>
  }
>() {}

export const TelemetryRepositoryLive = Layer.effect(
  TelemetryRepository,
  Effect.gen(function* () {
    const store = yield* Ref.make(new Map<string, Telemetry>())

    return TelemetryRepository.of({
      save: (telemetry) =>
        Ref.update(store, (map) => {
          const next = new Map(map)
          next.set(telemetry.deviceId, telemetry)
          return next
        }),

      get: (deviceId) =>
        Effect.map(Ref.get(store), (map) => map.get(deviceId)),

      getAll: () =>
        Effect.map(Ref.get(store), (map) => Array.from(map.values()))
    })
  })
)