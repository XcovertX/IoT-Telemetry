import { Data } from "effect"

export class AzurePublishError extends Data.TaggedError("AzurePublishError")<{
  readonly message: string
}> {}