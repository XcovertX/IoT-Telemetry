import { Context, Effect, Layer, Ref } from "effect"
import { AppConfig } from "../config/AppConfig.js"

export type DeviceStatus = {
  readonly deviceId: string
  readonly status: "online" | "offline" | "degraded"
  readonly lastSeenAt?: number
  readonly lastError?: string
  readonly consecutiveFailures: number
}

export class DeviceStatusRepository extends Context.Tag("DeviceStatusRepository")<
  DeviceStatusRepository,
  {
    readonly markOnline: (deviceId: string, timestamp: number) => Effect.Effect<void>
    readonly markFailure: (deviceId: string, error: string) => Effect.Effect<void>
    readonly get: (deviceId: string) => Effect.Effect<DeviceStatus | undefined>
    readonly getAll: () => Effect.Effect<ReadonlyArray<DeviceStatus>>
  }
>() {}

export const DeviceStatusRepositoryLive = Layer.effect(
  DeviceStatusRepository,
  Effect.gen(function* () {
    const config = yield* AppConfig
    const store = yield* Ref.make(new Map<string, DeviceStatus>())

    return DeviceStatusRepository.of({
      markOnline: (deviceId, timestamp) =>
        Ref.update(store, (map) => {
          const next = new Map(map)

          next.set(deviceId, {
            deviceId,
            status: "online",
            lastSeenAt: timestamp,
            lastError: undefined,
            consecutiveFailures: 0
          })

          return next
        }),

      markFailure: (deviceId, error) =>
        Ref.update(store, (map) => {
          const next = new Map(map)
          const existing = next.get(deviceId)
          const failures = (existing?.consecutiveFailures ?? 0) + 1

          next.set(deviceId, {
            deviceId,
            status: failures >= config.offlineAfterFailures ? "offline" : "degraded",
            lastSeenAt: existing?.lastSeenAt,
            lastError: error,
            consecutiveFailures: failures
          })

          return next
        }),

      get: (deviceId) =>
        Effect.map(Ref.get(store), (map) => map.get(deviceId)),

      getAll: () =>
        Effect.map(Ref.get(store), (map) => Array.from(map.values()))
    })
  })
)