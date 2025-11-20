"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { parseGithubUrl } from "@/lib/github-parser";

export default function LandingPage() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existing = window.localStorage.getItem("runloop-session-id");
    if (existing) {
      setSessionId(existing);
    } else {
      const generated = crypto.randomUUID();
      window.localStorage.setItem("runloop-session-id", generated);
      setSessionId(generated);
    }
  }, []);

  const repoDetails = useMemo(() => parseGithubUrl(repoUrl), [repoUrl]);

  const regenerateSessionId = () => {
    const next = crypto.randomUUID();
    setSessionId(next);
    window.localStorage.setItem("runloop-session-id", next);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!repoUrl) return;

    const activeSessionId = sessionId || crypto.randomUUID();
    setSessionId(activeSessionId);
    window.localStorage.setItem("runloop-session-id", activeSessionId);

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/runloop/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: activeSessionId,
          repoUrl,
          githubToken: githubToken || undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to start session");
      }

      const data = await response.json();
      router.push(`/chat/${data.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-14">
      <div className="space-y-4">
        <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
          Runloop Devbox Chat
        </span>
        <h1 className="text-4xl font-bold text-neutral-900 sm:text-5xl">
          Spin up an isolated agent per browser session.
        </h1>
        <p className="max-w-2xl text-lg text-neutral-600">
          Point us at a GitHub repo, and we will provision a fresh Runloop
          devbox, mount your agent, and open a tunnel for live chat.
        </p>
        <div className="flex items-center gap-4 text-sm text-neutral-600">
          <div className="rounded-lg bg-neutral-100 px-3 py-2">
            Session ID:{" "}
            <span className="font-mono font-semibold text-neutral-900">
              {sessionId || "initializing..."}
            </span>
          </div>
          <button
            type="button"
            onClick={regenerateSessionId}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50"
          >
            New session ID
          </button>
          {repoDetails ? (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">
              Parsed repo: {repoDetails.repoOwner}/{repoDetails.repoName}
            </div>
          ) : null}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-lg"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-sm font-semibold text-neutral-800">
              GitHub repository URL
            </label>
            <input
              type="url"
              required
              placeholder="https://github.com/org/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="mt-2 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-2 text-sm text-neutral-500">
              We will parse the owner/name and mount it into your devbox.
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-neutral-800">
              GitHub token (optional)
            </label>
            <input
              type="password"
              placeholder="Token for private repos"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              className="mt-2 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-2 text-xs text-neutral-500">
              Only used to clone the repository inside the devbox.
            </p>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-neutral-600">
            A unique devbox will be created for this browser session and shut
            down when you close the tab.
          </div>
          <button
            type="submit"
            disabled={isLoading || !repoUrl}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {isLoading ? "Provisioning..." : "Start Session"}
          </button>
        </div>
      </form>
    </main>
  );
}
