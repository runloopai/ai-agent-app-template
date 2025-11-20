"use client";

import { SessionStatus } from "@/components/SessionStatus";
import type { Session } from "@/types/session";

interface AdminSessionTableProps {
  sessions: Session[];
}

export function AdminSessionTable({ sessions }: AdminSessionTableProps) {
  if (!sessions.length) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-600">
        No active sessions.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-neutral-200 text-sm">
        <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-3">Session</th>
            <th className="px-4 py-3">Repository</th>
            <th className="px-4 py-3">Devbox</th>
            <th className="px-4 py-3">Tunnel</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3">Last Activity</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {sessions.map((session) => (
            <tr key={session.sessionId} className="hover:bg-neutral-50/80">
              <td className="px-4 py-3 font-mono text-xs text-neutral-800">
                {session.sessionId}
              </td>
              <td className="px-4 py-3">
                <div className="font-semibold text-neutral-900">
                  {session.repoOwner}/{session.repoName}
                </div>
              </td>
              <td className="px-4 py-3 text-neutral-700">
                {session.devboxId}
              </td>
              <td className="px-4 py-3 text-blue-700" title={session.tunnelUrl}>
                {session.tunnelUrl}
              </td>
              <td className="px-4 py-3">
                <SessionStatus status={session.status} />
              </td>
              <td className="px-4 py-3 text-neutral-600">
                {new Date(session.createdAt).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-neutral-600">
                {new Date(session.lastActivity).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
