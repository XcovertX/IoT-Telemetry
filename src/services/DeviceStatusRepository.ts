import { Context, Effect, Layer, Ref } from "effect"

// Represents the health/lifecycle state of a device.
export type DeviceStatus = {
  readonly deviceId: string
  readonly status: "online" | "offline" | "degraded"
  readonly lastSeenAt?: number
  readonly lastError?: string
  readonly consecutiveFailures: number
}

// Service contract for storing and reading device status.
export class DeviceStatusRepository extends Context.Tag("DeviceStatusRepository")<
  DeviceStatusRepository,
  {

    // Mark a successful poll
    readonly markOnline: (deviceId: string, timestamp: number) => Effect.Effect<void>

    // Mark a failed poll
    readonly markFailure: (deviceId: string, error: string) => Effect.Effect<void>

    // Get one device's current status
    readonly get: (deviceId: string) => Effect.Effect<DeviceStatus | undefined>

    // Get all device statuses
    readonly getAll: () => Effect.Effect<ReadonlyArray<DeviceStatus>>
  }
>() {}

// Build the repository with a Ref-backed in-memory store.
export const DeviceStatusRepositoryLive = Layer.effect(
  DeviceStatusRepository,
  Effect.gen(function* () {
    // Shared mutable state managed safely by Effect.
    const store = yield* Ref.make(new Map<string, DeviceStatus>())

    return DeviceStatusRepository.of({
      markOnline: (deviceId, timestamp) =>
        Ref.update(store, (map) => {
          const next = new Map(map)
          const existing = next.get(deviceId)

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
            status: failures >= 3 ? "offline" : "degraded",
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