import { Layer } from "effect"
import { DeviceSimulatorLive } from "../services/DeviceSimulator.js"
import { TelemetryProcessorLive } from "../services/TelemetryProcessor.js"
import { TelemetryRepositoryLive } from "../services/TelemetryRepository.js"
import { AlertServiceLive } from "../services/AlertService.js"
import { DeviceStatusRepositoryLive } from "../services/DeviceStatusRepository.js"
import { ApiServerLive } from "../services/ApiServer.js"

/**
 * Shared singleton-style infrastructure layers.
 *
 * Important:
 * Reuse these exact layer values so Effect can memoize them
 * and allocate them only once across the whole dependency graph.
 */
const SharedTelemetryRepositoryLive = TelemetryRepositoryLive
const SharedDeviceStatusRepositoryLive = DeviceStatusRepositoryLive
const SharedAlertServiceLive = AlertServiceLive

// First, build the dependencies TelemetryProcessor needs
const ProcessorDepsLive = Layer.mergeAll(
  SharedTelemetryRepositoryLive,
  SharedAlertServiceLive
)

// Then provide those deps into TelemetryProcessorLive
const WiredTelemetryProcessorLive = Layer.provide(
  TelemetryProcessorLive,
  ProcessorDepsLive
)


// Dependencies required to build the API server
const ApiDepsLive = Layer.mergeAll(
  SharedTelemetryRepositoryLive,
  SharedDeviceStatusRepositoryLive
)

// Wire API dependencies into the API layer
const WiredApiServerLive = Layer.provide(
  ApiServerLive,
  ApiDepsLive
)

// Merge the independent services into the app layer
export const LiveServices = Layer.mergeAll(
  DeviceSimulatorLive,
  SharedTelemetryRepositoryLive,
  SharedDeviceStatusRepositoryLive,
  SharedAlertServiceLive,
  WiredTelemetryProcessorLive,
  WiredApiServerLive
)