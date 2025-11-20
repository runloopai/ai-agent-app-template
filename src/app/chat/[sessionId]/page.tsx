"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { SessionStatus } from "@/components/SessionStatus";
import type { Session } from "@/types/session";

export default function ChatPage() {
  const router = useRouter();
  const params = useParams<{ sessionId?: string }>();
  const sessionId = useMemo(() => params?.sessionId ?? "", [params]);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShuttingDown, setIsShuttingDown] = useState(false);

  const fetchSession = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/runloop/session/${sessionId}`);
      if (!response.ok) {
        throw new Error("Session not found");
      }

      const data = await response.json();
      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load session");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const shutdownSession = useCallback(async () => {
    if (!session) return;
    setIsShuttingDown(true);
    try {
      await fetch("/api/runloop/shutdown-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId: session.sessionId }),
      });
      setSession({ ...session, status: "shutdown" });
    } catch (err) {
      console.error("Failed to shutdown session", err);
    } finally {
      setIsShuttingDown(false);
    }
  }, [session]);

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 30_000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (session?.status === "running") {
        const payload = JSON.stringify({ sessionId: session.sessionId });
        navigator.sendBeacon(
          "/api/runloop/shutdown-session",
          new Blob([payload], { type: "application/json" }),
        );
        event.preventDefault();
        event.returnValue =
          "Closing this tab will shutdown your devbox session.";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [session]);

  if (!sessionId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
        <div className="rounded-xl border border-neutral-200 bg-white px-6 py-4 text-sm text-neutral-700 shadow-sm">
          Missing session id.
        </div>
      </main>
    );
  }

  if (isLoading && !session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
        <div className="rounded-xl border border-neutral-200 bg-white px-6 py-4 text-sm text-neutral-700 shadow-sm">
          Loading session...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
        <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700 shadow-sm">
          <p>{error}</p>
          <button
            type="button"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white shadow-sm"
            onClick={() => router.push("/")}
          >
            Back to landing
          </button>
        </div>
      </main>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-neutral-50 px-6 py-10">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <SessionStatus status={session.status} />
          <p className="text-xs text-neutral-600">
            Session {session.sessionId} · Devbox {session.devboxId}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-700">
          <div className="rounded-full bg-white px-3 py-1 shadow-sm">
            Repo: {session.repoOwner}/{session.repoName}
          </div>
          <div className="rounded-full bg-white px-3 py-1 shadow-sm">
            Tunnel: {session.tunnelUrl}
          </div>
          <button
            type="button"
            disabled={isShuttingDown || session.status !== "running"}
            onClick={shutdownSession}
            className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
          >
            {isShuttingDown ? "Shutting down..." : "Shutdown session"}
          </button>
        </div>
      </div>

      <div className="flex min-h-[70vh] flex-col">
        <ChatInterface session={session} />
      </div>
    </main>
  );
}
