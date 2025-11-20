import { RunloopClient } from "@runloop/api-client";

let client: RunloopClient | null = null;

export function getRunloopClient() {
  if (client) {
    return client;
  }

  if (!process.env.RUNLOOP_API_KEY) {
    throw new Error("RUNLOOP_API_KEY is not set");
  }

  client = new RunloopClient({ apiKey: process.env.RUNLOOP_API_KEY });
  return client;
}
