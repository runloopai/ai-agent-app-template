"use client";

import { useCallback } from "react";

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder,
}: MessageInputProps) {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        onSend();
      }
    },
    [onSend],
  );

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
      <textarea
        className="w-full resize-none rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        rows={3}
        placeholder={placeholder || "Ask the agent something..."}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-neutral-500">
          Press Enter to send or Shift+Enter for a new line
        </p>
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          Send
        </button>
      </div>
    </div>
  );
}
