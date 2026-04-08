import { Context, Effect, Layer } from "effect"
import Fastify from "fastify"
import { DeviceStatusRepository } from "./DeviceStatusRepository.js"
import { TelemetryRepository } from "./TelemetryRepository.js"
import { AppConfig } from "../config/AppConfig.js"

export class ApiServer extends Context.Tag("ApiServer")<
  ApiServer,
  {
    readonly start: () => Effect.Effect<void, Error>
  }
>() {}

export const ApiServerLive = Layer.effect(
  ApiServer,
  Effect.gen(function* () {
    const statusRepo = yield* DeviceStatusRepository
    const telemetryRepo = yield* TelemetryRepository
    const config = yield* AppConfig

    return ApiServer.of({
      start: () =>
        Effect.tryPromise({
          try: async () => {
            const app = Fastify({ logger: false })

            app.get("/devices", async () => {
              return await Effect.runPromise(statusRepo.getAll())
            })

            app.get("/devices/:id", async (request, reply) => {
              const { id } = request.params as { id: string }
              const device = await Effect.runPromise(statusRepo.get(id))

              if (!device) {
                reply.code(404)
                return { error: `Device ${id} not found` }
              }

              return device
            })

            app.get("/telemetry/:id", async (request, reply) => {
              const { id } = request.params as { id: string }
              const telemetry = await Effect.runPromise(telemetryRepo.get(id))

              if (!telemetry) {
                reply.code(404)
                return { error: `Telemetry for device ${id} not found` }
              }

              return telemetry
            })

            app.get("/fleet-summary", async () => {
              const statuses = await Effect.runPromise(statusRepo.getAll())

              return {
                total: statuses.length,
                online: statuses.filter((s) => s.status === "online").length,
                degraded: statuses.filter((s) => s.status === "degraded").length,
                offline: statuses.filter((s) => s.status === "offline").length
              }
            })

            await app.listen({
              host: "0.0.0.0",
              port: config.apiPort
            })
          },
          catch: (error) =>
            error instanceof Error ? error : new Error(String(error))
        })
    })
  })
)