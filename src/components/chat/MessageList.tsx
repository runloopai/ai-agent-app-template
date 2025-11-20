"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types/chat";

interface MessageListProps {
  messages: ChatMessage[];
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto rounded-lg border border-neutral-200 bg-white/70 p-4 shadow-sm">
      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-3xl rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-50 text-neutral-900 border border-neutral-200"
              }`}
            >
              <div className="font-semibold capitalize text-xs opacity-70">
                {message.role}
              </div>
              <div className="whitespace-pre-wrap">
                {message.content || (message.isStreaming ? "…" : "")}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
