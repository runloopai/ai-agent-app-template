import { NextResponse } from "next/server";
import { getRunloopClient } from "@/lib/runloop-client";
import { removeSession } from "@/lib/session-manager";
import type { ShutdownSessionRequest } from "@/types/session";

export async function POST(req: Request) {
  const body = (await req.json()) as ShutdownSessionRequest;
  const { sessionId } = body;

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 },
    );
  }

  const session = removeSession(sessionId);

  if (!session) {
    return NextResponse.json(
      { error: "Session not found" },
      { status: 404 },
    );
  }

  try {
    if (session?.devboxId) {
      const client = getRunloopClient();
      await client.devboxes.shutdown(session.devboxId);
    }
  } catch (error) {
    console.error("Failed to shutdown devbox", error);
    return NextResponse.json(
      { error: "Failed to shutdown session" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
