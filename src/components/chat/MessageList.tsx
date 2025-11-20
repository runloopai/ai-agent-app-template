"use client";

import { useEffect, useRef } from "react";
import type { ThreadMessage } from "@/types/thread";

interface MessageListProps {
  messages: ThreadMessage[];
  isStreaming?: boolean;
}

function formatContent(content: ThreadMessage["content"]): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof block === "string") return block;
        if (block && typeof block === "object" && "text" in block) {
          return String(block.text ?? "");
        }
        return JSON.stringify(block);
      })
      .filter(Boolean)
      .join("\n\n");
  }
  if (content && typeof content === "object" && "text" in content) {
    return String((content as { text?: unknown }).text ?? "");
  }
  return JSON.stringify(content);
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  return (
    <div className="flex-1 overflow-y-auto rounded-lg border border-neutral-200 bg-white/70 p-4 shadow-sm">
      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === "human" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-3xl rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                message.type === "human"
                  ? "bg-blue-600 text-white"
                  : message.type === "tool"
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border border-neutral-200 bg-neutral-50 text-neutral-900"
              }`}
            >
              <div className="font-semibold capitalize text-xs opacity-70">
                {message.type}
              </div>
              <div className="whitespace-pre-wrap">
                {formatContent(message.content)}
              </div>
              {message.type === "ai" && message.tool_calls?.length ? (
                <div className="mt-2 space-y-1 rounded-md bg-white/60 p-2 text-xs text-neutral-700">
                  <p className="font-semibold text-neutral-800">Tool calls</p>
                  {message.tool_calls.map((call) => (
                    <div
                      key={call.id ?? call.name}
                      className="rounded border border-neutral-200 bg-white px-2 py-1"
                  >
                    <p className="font-semibold">{call.name}</p>
                    <pre className="whitespace-pre-wrap text-[11px] text-neutral-600">
                        {JSON.stringify(
                          "args" in call
                            ? call.args
                            : "input" in (call as Record<string, unknown>)
                              ? (call as Record<string, unknown>).input
                              : {},
                          null,
                          2,
                        )}
                    </pre>
                  </div>
                ))}
              </div>
              ) : null}
              {message.type === "tool" && message.name ? (
                <p className="mt-1 text-xs text-neutral-500">
                  Responding to: {message.name}
                </p>
              ) : null}
              {isStreaming &&
              messages[messages.length - 1]?.id === message.id ? (
                <p className="mt-1 text-xs text-neutral-500">Streaming...</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
