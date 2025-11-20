import type { Message } from "@langchain/langgraph-sdk";

export type ThreadProvider = "langgraph";

export interface ThreadConfig {
  provider: ThreadProvider;
  apiUrl: string;
  assistantId: string;
  apiKey?: string;
  threadId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ThreadState {
  threadId: string | null;
  messages: Message[];
  isStreaming: boolean;
  error?: string;
}

export interface ThreadSubmission {
  content: string | Message["content"];
  context?: Record<string, unknown>;
}

export type ThreadMessage = Message;
