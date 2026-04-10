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
import { CommandHistoryRepositoryLive } from "../services/CommandHistoryRepository.js"
import { AzurePublisherIoTHubLive } from "../services/AzurePublisher.js"

const SharedAzurePublisherLive = AzurePublisherIoTHubLive
const SharedAppConfigLive = AppConfigLive
const SharedTelemetryRepositoryLive = TelemetryRepositoryLive
const SharedCommandHistoryRepositoryLive = CommandHistoryRepositoryLive


const SharedAlertServiceLive = Layer.provide(
  AlertServiceLive,
  SharedAppConfigLive
)

const SharedDeviceStatusRepositoryLive = Layer.provide(
  DeviceStatusRepositoryLive,
  SharedAppConfigLive
)

const SharedDeviceCommandServiceLive = Layer.provide(
  DeviceCommandServiceMockLive,
  Layer.mergeAll(
    SharedDeviceStatusRepositoryLive,
    SharedCommandHistoryRepositoryLive
  )
)

const ProcessorDepsLive = Layer.mergeAll(
  SharedTelemetryRepositoryLive,
  SharedAlertServiceLive
)

const WiredTelemetryProcessorLive = Layer.provide(
  TelemetryProcessorLive,
  ProcessorDepsLive
)

const ApiDepsLive = Layer.mergeAll(
  SharedDeviceStatusRepositoryLive,
  SharedTelemetryRepositoryLive,
  SharedDeviceCommandServiceLive,
  SharedCommandHistoryRepositoryLive,
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
  SharedCommandHistoryRepositoryLive,
  SharedDeviceCommandServiceLive,
  WiredTelemetryProcessorLive,
  WiredApiServerLive
)