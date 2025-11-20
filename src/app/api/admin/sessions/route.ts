import { NextResponse } from "next/server";
import { getRunloopClient } from "@/lib/runloop-client";
import { getSessions, updateSessionStatus } from "@/lib/session-manager";
import type { Session, SessionStatus } from "@/types/session";

type DevboxStatusPayload = { status?: string };

function mapRunloopStatus(status?: string): SessionStatus | null {
  switch (status) {
    case "running":
      return "running";
    case "provisioning":
    case "initializing":
    case "resuming":
      return "provisioning";
    case "shutdown":
    case "suspending":
    case "suspended":
      return "shutdown";
    case "failure":
      return "error";
    default:
      return null;
  }
}

export async function GET() {
  const sessions = getSessions();
  const client = sessions.length ? getRunloopClient() : null;

  const hydrated: Session[] = await Promise.all(
    sessions.map(async (session) => {
      if (!client || !session.devboxId) return session;

      try {
        const devbox = await client.devboxes.retrieve(session.devboxId);
        const derivedStatus = mapRunloopStatus(
          (devbox as DevboxStatusPayload).status,
        );

        if (derivedStatus && derivedStatus !== session.status) {
          const updated =
            updateSessionStatus(session.sessionId, derivedStatus) || session;
          return updated;
        }
      } catch (error) {
        console.error("Failed to hydrate session", error);
      }

      return session;
    }),
  );

  return NextResponse.json({
    sessions: hydrated,
    total: hydrated.length,
  });
}
