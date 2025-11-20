export type SessionStatus = "provisioning" | "running" | "shutdown" | "error";

export interface Session {
  sessionId: string;
  devboxId: string;
  tunnelUrl: string;
  repoOwner: string;
  repoName: string;
  status: SessionStatus;
  createdAt: string;
  lastActivity: string;
  errorMessage?: string;
}

export interface CreateSessionRequest {
  sessionId: string;
  repoUrl: string;
  githubToken?: string;
}

export interface CreateSessionResponse {
  tunnelUrl: string;
  devboxId: string;
  sessionId: string;
  status: SessionStatus;
}

export interface ShutdownSessionRequest {
  sessionId: string;
}
