import { Context, Effect, Layer, Console } from "effect"
import { DeviceStatusRepository } from "./DeviceStatusRepository.js"
import { CommandHistoryRepository } from "./CommandHistoryRepository.js"

export type DeviceCommand = "reboot"

export class DeviceCommandService extends Context.Tag("DeviceCommandService")<
  DeviceCommandService,
  {
    readonly sendCommand: (
      deviceId: string,
      command: DeviceCommand
    ) => Effect.Effect<void>
  }
>() {}

export const DeviceCommandServiceMockLive = Layer.effect(
  DeviceCommandService,
  Effect.gen(function* () {
    const statusRepo = yield* DeviceStatusRepository
    const historyRepo = yield* CommandHistoryRepository

    return DeviceCommandService.of({
      sendCommand: (deviceId, command) =>
        Effect.gen(function* () {
          const timestamp = Date.now()

          yield* Console.log(`[COMMAND MOCK] Sending '${command}' to ${deviceId}`)

          // Record the command so the effect is visible in the API
          yield* historyRepo.add({
            deviceId,
            command,
            timestamp,
            status: "accepted"
          })

          // Update device status so the effect is visible immediately
          if (command === "reboot") {
            yield* statusRepo.markDegraded(deviceId, "reboot requested")
          }
        })
    })
  })
)