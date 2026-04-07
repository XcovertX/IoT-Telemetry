export class TelemetryValidationError extends Error {
  readonly _tag = "TelemetryValidationError"

  constructor(message: string) {
    super(message)
    this.name = "TelemetryValidationError"
  }
}

export class DeviceOfflineError extends Error {
  readonly _tag = "DeviceOfflineError"

  constructor(deviceId: string) {
    super(`Device ${deviceId} is offline`)
    this.name = "DeviceOfflineError"
  }
}