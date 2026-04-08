import { Layer } from "effect"
import { DeviceSimulatorLive } from "../services/DeviceSimulator.js"
import { TelemetryProcessorLive } from "../services/TelemetryProcessor.js"
import { TelemetryRepositoryLive } from "../services/TelemetryRepository.js"
import { AlertServiceLive } from "../services/AlertService.js"
import { DeviceStatusRepositoryLive } from "../services/DeviceStatusRepository.js"
import { ApiServerLive } from "../services/ApiServer.js"

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


// Dependencies required to build the API server
const ApiDepsLive = Layer.mergeAll(
  TelemetryRepositoryLive,
  DeviceStatusRepositoryLive
)

// Wire API dependencies into the API layer
const WiredApiServerLive = Layer.provide(
  ApiServerLive,
  ApiDepsLive
)

// Merge the independent services into the app layer
export const LiveServices = Layer.mergeAll(
  DeviceSimulatorLive,
  ProcessorDepsLive,
  WiredTelemetryProcessorLive,
  DeviceStatusRepositoryLive,
WiredApiServerLive
)