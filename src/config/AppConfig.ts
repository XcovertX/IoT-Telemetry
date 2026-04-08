import { Config, Context, Effect, Layer } from "effect"

/**
 * Strongly typed application config shape.
 */
export type AppConfigShape = {
  readonly pollIntervalSeconds: number
  readonly fleetSummaryIntervalSeconds: number
  readonly offlineAfterFailures: number
  readonly highTemperatureThreshold: number
  readonly lowBatteryThreshold: number
  readonly apiPort: number
  readonly azureMode: "mock" | "real"
}

/**
 * Service tag so the rest of the app can depend on config
 * the same way it depends on any other Effect service.
 */
export class AppConfig extends Context.Tag("AppConfig")<
  AppConfig,
  AppConfigShape
>() {}

/**
 * Read config from environment variables.
 *
 * Effect's default config provider already reads from env vars,
 * so these names will map directly to process.env keys.
 */
const appConfigEffect = Effect.gen(function* () {
  const pollIntervalSeconds = yield* Config.integer("POLL_INTERVAL_SECONDS").pipe(
    Config.withDefault(3)
  )

  const fleetSummaryIntervalSeconds = yield* Config.integer("FLEET_SUMMARY_INTERVAL_SECONDS").pipe(
    Config.withDefault(10)
  )

  const offlineAfterFailures = yield* Config.integer("OFFLINE_AFTER_FAILURES").pipe(
    Config.withDefault(3)
  )

  const highTemperatureThreshold = yield* Config.integer("HIGH_TEMPERATURE_THRESHOLD").pipe(
    Config.withDefault(120)
  )

  const lowBatteryThreshold = yield* Config.integer("LOW_BATTERY_THRESHOLD").pipe(
    Config.withDefault(25)
  )

  const apiPort = yield* Config.integer("API_PORT").pipe(
    Config.withDefault(3000)
  )

  const azureMode = yield* Config.literal("mock", "real")("AZURE_MODE").pipe(
    Config.withDefault("mock")
  )

  return AppConfig.of({
    pollIntervalSeconds,
    fleetSummaryIntervalSeconds,
    offlineAfterFailures,
    highTemperatureThreshold,
    lowBatteryThreshold,
    apiPort,
    azureMode
  })
})

/**
 * Live layer for config.
 *
 * Because config is loaded effectfully, we use Layer.effect.
 */
export const AppConfigLive = Layer.effect(
  AppConfig,
  appConfigEffect
)