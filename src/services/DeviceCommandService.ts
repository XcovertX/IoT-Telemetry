import { Context, Effect, Layer, Console } from "effect"

/**
 * Supported device commands for now.
 * We only implement reboot as a mock command.
 */
export type DeviceCommand = "reboot"

/**
 * Service contract for sending commands to devices.
 */
export class DeviceCommandService extends Context.Tag("DeviceCommandService")<
  DeviceCommandService,
  {
    readonly sendCommand: (
      deviceId: string,
      command: DeviceCommand
    ) => Effect.Effect<void>
  }
>() {}

/**
 * Mock command implementation.
 *
 * Later this could become:
 * - Azure direct methods
 * - MQTT command publish
 * - REST call to edge gateway
 */
export const DeviceCommandServiceMockLive = Layer.succeed(
  DeviceCommandService,
  DeviceCommandService.of({
    sendCommand: (deviceId, command) =>
      Console.log(`[COMMAND MOCK] Sending '${command}' to ${deviceId}`)
  })
)