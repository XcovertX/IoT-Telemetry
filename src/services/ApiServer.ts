import { Context, Effect, Layer } from "effect"
import Fastify from "fastify"
import { DeviceStatusRepository } from "./DeviceStatusRepository.js"
import { TelemetryRepository } from "./TelemetryRepository.js"


// Service contract for the API server.
export class ApiServer extends Context.Tag("ApiServer")<
  ApiServer,
  {
    readonly start: () => Effect.Effect<void, Error>
  }
>() {}

/**
 * Live API server implementation.
 *
 * This service depends on:
 * - DeviceStatusRepository
 * - TelemetryRepository
 *
 * Build it with Layer.effect.
 */
export const ApiServerLive = Layer.effect(
  ApiServer,
  Effect.gen(function* () {
    const statusRepo = yield* DeviceStatusRepository
    const telemetryRepo = yield* TelemetryRepository

    return ApiServer.of({
      start: () =>
        Effect.tryPromise({
          try: async () => {
            const app = Fastify({ logger: false })

            /**
             * Get all known device statuses
             */
            app.get("/devices", async () => {
              const devices = await Effect.runPromise(statusRepo.getAll())
              return devices
            })

            /**
             * Get one device status by ID
             */
            app.get("/devices/:id", async (request, reply) => {
              const { id } = request.params as { id: string }
              const device = await Effect.runPromise(statusRepo.get(id))

              if (!device) {
                reply.code(404)
                return { error: `Device ${id} not found` }
              }

              return device
            })

            /**
             * Get latest telemetry for one device
             */
            app.get("/telemetry/:id", async (request, reply) => {
              const { id } = request.params as { id: string }
              const telemetry = await Effect.runPromise(telemetryRepo.get(id))

              if (!telemetry) {
                reply.code(404)
                return { error: `Telemetry for device ${id} not found` }
              }

              return telemetry
            })

            /**
             * Get a summary view of fleet health
             */
            app.get("/fleet-summary", async () => {
              const statuses = await Effect.runPromise(statusRepo.getAll())

              const summary = {
                total: statuses.length,
                online: statuses.filter((s) => s.status === "online").length,
                degraded: statuses.filter((s) => s.status === "degraded").length,
                offline: statuses.filter((s) => s.status === "offline").length
              }

              return summary
            })

            await app.listen({
              host: "0.0.0.0",
              port: 3000
            })
          },
          catch: (error) =>
            error instanceof Error ? error : new Error(String(error))
        })
    })
  })
)