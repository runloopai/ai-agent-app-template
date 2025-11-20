import { NextResponse } from "next/server";
import { getRunloopClient } from "@/lib/runloop-client";
import { parseGithubUrl } from "@/lib/github-parser";
import {
  touchSession,
  updateSessionStatus,
  upsertSession,
} from "@/lib/session-manager";
import type {
  CreateSessionRequest,
  CreateSessionResponse,
  Session,
} from "@/types/session";

export async function POST(req: Request) {
  const body = (await req.json()) as CreateSessionRequest;
  const { sessionId, repoUrl, githubToken } = body;

  if (!sessionId || !repoUrl) {
    return NextResponse.json(
      { error: "sessionId and repoUrl are required" },
      { status: 400 },
    );
  }

  const parsedRepo = parseGithubUrl(repoUrl);
  if (!parsedRepo) {
    return NextResponse.json(
      { error: "Invalid GitHub repository URL" },
      { status: 400 },
    );
  }

  const {
    repoOwner,
    repoName,
  } = parsedRepo;

  const port = Number(process.env.RUNLOOP_DEFAULT_PORT || 2024);
  const agentId = process.env.RUNLOOP_DEFAULT_AGENT_ID;
  const defaultGithubToken = process.env.GITHUB_TOKEN;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const runCommand =
    process.env.RUNLOOP_DEFAULT_COMMAND ||
    "cd /home/user/agent && npm start";

  if (!agentId) {
    return NextResponse.json(
      { error: "RUNLOOP_DEFAULT_AGENT_ID is not set" },
      { status: 500 },
    );
  }

  if (!anthropicKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set" },
      { status: 500 },
    );
  }

  const githubSecret = githubToken || defaultGithubToken;
  const createdAt = new Date().toISOString();

  const baseSession: Session = {
    sessionId,
    devboxId: "",
    tunnelUrl: "",
    repoOwner,
    repoName,
    status: "provisioning",
    createdAt,
    lastActivity: createdAt,
  };

  upsertSession(baseSession);

  try {
    const client = getRunloopClient();
    const devbox = await client.devboxes.createAndAwaitRunning({
      code_mounts: [
        {
          repo_name: repoName,
          repo_owner: repoOwner,
          token: githubSecret || undefined,
        },
      ],
      snapshot_id: process.env.RUNLOOP_SNAPSHOT_ID || undefined,
      mounts: process.env.RUNLOOP_SNAPSHOT_ID ? [
        {
          type: "agent_mount",
          agent_id: agentId,
          agent_name: null,
          agent_path: "/home/user/agent",
        },
      ] : null,
      environment_variables:{
        ANTHROPIC_API_KEY: anthropicKey,
        ...(githubSecret ? { GH_TOKEN: githubSecret } : {}),
      },
      launch_parameters: {
        available_ports: [port],
      },
      metadata: {
        from: "runloopAgentTemplate"
      }
    });

    const devboxId = devbox.id;

    await client.devboxes.executeAsync(devboxId, {
      command: runCommand,
    });

    const tunnel = await client.devboxes.createTunnel(devboxId, {
      port,
    });

    const tunnelUrl = tunnel.url;

    const session: Session = {
      ...baseSession,
        devboxId,
      tunnelUrl,
      status: "running",
      lastActivity: new Date().toISOString(),
    };

    upsertSession(session);

    const response: CreateSessionResponse = {
      sessionId,
      devboxId,
      tunnelUrl,
      status: session.status,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to create session", error);
    updateSessionStatus(
      sessionId,
      "error",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 },
    );
  } finally {
    touchSession(sessionId);
  }
}
