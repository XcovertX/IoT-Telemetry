import { Layer } from "effect"
import { DeviceSimulatorLive } from "../services/DeviceSimulator.js"
import { TelemetryProcessorLive } from "../services/TelemetryProcessor.js"
import { TelemetryRepositoryLive } from "../services/TelemetryRepository.js"
import { AlertServiceLive } from "../services/AlertService.js"

// First, build the dependencies TelemetryProcessor needs
const ProcessorDepsLive = Layer.mergeAll(
  TelemetryRepositoryLive,
  AlertServiceLive
)

// Then provide those deps into TelemetryProcessorLive
const WiredTelemetryProcessorLive = Layer.provide(
  TelemetryProcessorLive,
  ProcessorDepsLive
)

// Finally merge the independent services into the app layer
export const LiveServices = Layer.mergeAll(
  DeviceSimulatorLive,
  ProcessorDepsLive,
  WiredTelemetryProcessorLive
)