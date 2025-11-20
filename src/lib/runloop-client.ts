import {Runloop, type RunloopAPI} from "@runloop/api-client";

let client: RunloopAPI | null = null;

export function getRunloopClient() {
  if (client) {
    return client;
  }

  if (!process.env.RUNLOOP_API_KEY) {
    throw new Error("RUNLOOP_API_KEY is not set");
  }

  client = new Runloop({ bearerToken: process.env.RUNLOOP_API_KEY, baseURL: process.env.RUNLOOP_BASE_URL ?? "https://api.runloop.ai" });
  return client;
}
