import { Context, Effect, Layer, Ref } from "effect"

export type CommandHistoryEntry = {
  readonly deviceId: string
  readonly command: string
  readonly timestamp: number
  readonly status: "accepted"
}

/**
 * Stores command history in memory.
 */
export class CommandHistoryRepository extends Context.Tag("CommandHistoryRepository")<
  CommandHistoryRepository,
  {
    readonly add: (entry: CommandHistoryEntry) => Effect.Effect<void>
    readonly getAll: () => Effect.Effect<ReadonlyArray<CommandHistoryEntry>>
    readonly getByDeviceId: (deviceId: string) => Effect.Effect<ReadonlyArray<CommandHistoryEntry>>
  }
>() {}

export const CommandHistoryRepositoryLive = Layer.effect(
  CommandHistoryRepository,
  Effect.gen(function* () {
    const store = yield* Ref.make<ReadonlyArray<CommandHistoryEntry>>([])

    return CommandHistoryRepository.of({
      add: (entry) =>
        Ref.update(store, (entries) => [entry, ...entries]),

      getAll: () => Ref.get(store),

      getByDeviceId: (deviceId) =>
        Effect.map(
          Ref.get(store),
          (entries) => entries.filter((entry) => entry.deviceId === deviceId)
        )
    })
  })
)