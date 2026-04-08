import { Layer } from "effect"
import { AppConfigLive } from "../config/AppConfig.js"
import { DeviceSimulatorLive } from "../services/DeviceSimulator.js"
import { TelemetryRepositoryLive } from "../services/TelemetryRepository.js"
import { AlertServiceLive } from "../services/AlertService.js"
import { TelemetryProcessorLive } from "../services/TelemetryProcessor.js"
import { DeviceStatusRepositoryLive } from "../services/DeviceStatusRepository.js"
import { ApiServerLive } from "../services/ApiServer.js"
import { AzurePublisherMockLive } from "../services/AzurePublisher.js"
import { DeviceCommandServiceMockLive } from "../services/DeviceCommandService.js"

/**
 * Shared singleton-style layers
 */
const SharedAppConfigLive = AppConfigLive
const SharedTelemetryRepositoryLive = TelemetryRepositoryLive
const SharedAzurePublisherLive = AzurePublisherMockLive
const SharedDeviceCommandServiceLive = DeviceCommandServiceMockLive

/**
 * Services that depend on config
 */
const SharedAlertServiceLive = Layer.provide(
  AlertServiceLive,
  SharedAppConfigLive
)

const SharedDeviceStatusRepositoryLive = Layer.provide(
  DeviceStatusRepositoryLive,
  SharedAppConfigLive
)

/**
 * TelemetryProcessor depends on:
 * - TelemetryRepository
 * - AlertService
 */
const ProcessorDepsLive = Layer.mergeAll(
  SharedTelemetryRepositoryLive,
  SharedAlertServiceLive
)

const WiredTelemetryProcessorLive = Layer.provide(
  TelemetryProcessorLive,
  ProcessorDepsLive
)

/**
 * ApiServer depends on:
 * - DeviceStatusRepository
 * - TelemetryRepository
 * - DeviceCommandService
 * - AppConfig
 */
const ApiDepsLive = Layer.mergeAll(
  SharedDeviceStatusRepositoryLive,
  SharedTelemetryRepositoryLive,
  SharedDeviceCommandServiceLive,
  SharedAppConfigLive
)

const WiredApiServerLive = Layer.provide(
  ApiServerLive,
  ApiDepsLive
)

export const LiveServices = Layer.mergeAll(
  DeviceSimulatorLive,
  SharedAppConfigLive,
  SharedTelemetryRepositoryLive,
  SharedDeviceStatusRepositoryLive,
  SharedAlertServiceLive,
  SharedAzurePublisherLive,
  SharedDeviceCommandServiceLive,
  WiredTelemetryProcessorLive,
  WiredApiServerLive
)