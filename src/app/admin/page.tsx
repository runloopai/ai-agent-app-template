"use client";

import { useEffect, useState } from "react";
import { AdminSessionTable } from "@/components/AdminSessionTable";
import type { Session } from "@/types/session";

export default function AdminPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchSessions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/sessions");
      if (!response.ok) {
        throw new Error("Failed to load sessions");
      }
      const data = await response.json();
      setSessions(data.sessions || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 10_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-14">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-neutral-500">
            Admin Dashboard
          </p>
          <h1 className="text-3xl font-bold text-neutral-900">
            Live Runloop Sessions
          </h1>
          <p className="text-neutral-600">
            No authentication for this proof of concept. Auto-refreshes every 10
            seconds.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 px-4 py-3 text-center">
            <div className="text-xs uppercase text-blue-700">Active</div>
            <div className="text-2xl font-semibold text-blue-900">
              {sessions.length}
            </div>
          </div>
          <button
            type="button"
            onClick={fetchSessions}
            className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading && !sessions.length ? (
        <div className="rounded-xl border border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-600 shadow-sm">
          Loading sessions...
        </div>
      ) : (
        <AdminSessionTable sessions={sessions} />
      )}

      {lastUpdated ? (
        <p className="text-right text-xs text-neutral-500">
          Last updated {lastUpdated.toLocaleTimeString()}
        </p>
      ) : null}
    </main>
  );
}
