import { Layer } from "effect"
import { DeviceSimulatorLive } from "../services/DeviceSimulator.js"
import { TelemetryProcessorLive } from "../services/TelemetryProcessor.js"

export const LiveServices = Layer.mergeAll(
  DeviceSimulatorLive,
  TelemetryProcessorLive
)