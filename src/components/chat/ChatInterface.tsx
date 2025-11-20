"use client";

import { useMemo, useState } from "react";
import { streamResponse } from "@/components/chat/StreamHandler";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList } from "@/components/chat/MessageList";
import type { ChatMessage } from "@/types/chat";
import type { Session } from "@/types/session";

interface ChatInterfaceProps {
  session: Session;
}

export function ChatInterface({ session }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "session-info",
      role: "assistant",
      content: `You are connected to devbox ${session.devboxId} for ${session.repoOwner}/${session.repoName}.`,
      createdAt: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agentEndpoint = useMemo(() => {
    if (!session.tunnelUrl) return null;
    const normalized = session.tunnelUrl.endsWith("/")
      ? session.tunnelUrl.slice(0, -1)
      : session.tunnelUrl;
    return `${normalized}/chat`;
  }, [session.tunnelUrl]);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!agentEndpoint) {
      setError("Missing tunnel URL for this session.");
      return;
    }

    setError(null);
    setIsSending(true);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };

    const assistantMessageId = crypto.randomUUID();
    const streamingMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, streamingMessage]);
    setInput("");

    try {
      const response = await fetch(agentEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to reach agent tunnel");
      }

      await streamResponse(response, (chunk) => {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  content: `${message.content}${chunk}`,
                }
              : message,
          ),
        );
      });

      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessageId
            ? { ...message, isStreaming: false }
            : message,
        ),
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Unable to deliver your message.",
      );
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                content: "Agent did not respond.",
                isStreaming: false,
              }
            : message,
        ),
      );
    } finally {
      setIsSending(false);
    }
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
        <div className="text-right text-sm text-neutral-600">
          <p>
            Devbox: <span className="font-semibold">{session.devboxId}</span>
          </p>
          <p className="truncate text-blue-600" title={session.tunnelUrl}>
            Tunnel: {session.tunnelUrl}
          </p>
        </div>
      </div>

      <MessageList messages={messages} />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <MessageInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={isSending || session.status !== "running"}
      />
    </div>
  );
}
