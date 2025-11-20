"use client";

import { useMemo, useState } from "react";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList } from "@/components/chat/MessageList";
import { useLangGraphThread } from "@/hooks/use-langgraph-thread";
import { getDefaultLangGraphAssistantId } from "@/lib/langgraph-config";
import type { Session } from "@/types/session";

interface ChatInterfaceProps {
  session: Session;
}

export function ChatInterface({ session }: ChatInterfaceProps) {
  const [input, setInput] = useState<string>("");
  const [localError, setLocalError] = useState<string | null>(null);

  const apiUrl = useMemo(() => {
    if (!session.tunnelUrl) return "";
    const normalized = session.tunnelUrl.endsWith("/")
      ? session.tunnelUrl.slice(0, -1)
      : session.tunnelUrl;
    return normalized;
  }, [session.tunnelUrl]);

  const assistantId = useMemo(
    () => getDefaultLangGraphAssistantId(),
    [],
  );

  const thread = useLangGraphThread({
    provider: "langgraph",
    apiUrl,
    assistantId,
  });

  const handleSend = () => {
    if (!input.trim()) return;
    if (!apiUrl) {
      setLocalError("Missing tunnel URL for this session.");
      return;
    }

    setLocalError(null);
    thread.submit({ content: input.trim() });
    setInput("");
  };

  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-neutral-200 bg-gradient-to-b from-slate-50 to-white p-4 shadow-md">
      <div className="flex items-center justify-between gap-3 rounded-xl bg-white/60 p-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Session
          </p>
          <p className="font-semibold text-neutral-900">
            {session.sessionId}
          </p>
          <p className="text-sm text-neutral-600">
            {session.repoOwner}/{session.repoName}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right text-sm text-neutral-600">
          <p className="truncate text-blue-600" title={session.tunnelUrl}>
            Tunnel: {session.tunnelUrl || "pending"}
          </p>
          <p className="text-neutral-500">
            Assistant: <span className="font-semibold">{assistantId}</span>
          </p>
          <p className="text-neutral-500">
            Thread:{" "}
            <span className="font-semibold">
              {thread.threadId ?? "new thread"}
            </span>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={thread.startNewThread}
              className="rounded-md border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50"
            >
              New thread
            </button>
            <button
              type="button"
              onClick={thread.stop}
              disabled={!thread.isStreaming}
              className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-neutral-400 disabled:border-neutral-200"
            >
              Stop
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white/70 p-3 text-sm text-neutral-600">
        Connected to devbox {session.devboxId} for {session.repoOwner}/
        {session.repoName}. Messages stream via LangGraph using the tunnel for
        this session.
      </div>

      <MessageList
        messages={thread.messages}
        isStreaming={thread.isStreaming}
      />

      {localError || thread.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {localError || thread.error}
        </div>
      ) : null}

      <MessageInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={session.status !== "running" || !apiUrl}
        placeholder="Chat with the agent. Tool calls will stream inline."
      />
    </div>
  );
}
