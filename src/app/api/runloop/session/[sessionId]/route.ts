import { NextResponse } from "next/server";
import { getRunloopClient } from "@/lib/runloop-client";
import { getSession, updateSessionStatus } from "@/lib/session-manager";
import type { SessionStatus } from "@/types/session";

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

export async function GET(
  _req: Request,
  { params }: { params: { sessionId: string } },
) {
  const session = getSession(params.sessionId);

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  try {
    if (session.devboxId) {
      const client = getRunloopClient();
      const devbox = await client.devboxes.retrieve(session.devboxId);
      const derivedStatus = mapRunloopStatus(
        (devbox as DevboxStatusPayload).status,
      );

      if (derivedStatus && derivedStatus !== session.status) {
        const updated = updateSessionStatus(session.sessionId, derivedStatus);
        if (updated) {
          return NextResponse.json(updated);
        }
      }
    }
  } catch (error) {
    console.error("Failed to refresh devbox status", error);
  }

  return NextResponse.json(session);
}
