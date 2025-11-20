import { useMemo, useState } from "react";
import type { Message } from "@langchain/langgraph-sdk";
import { useStream } from "@langchain/langgraph-sdk/react";
import { ensureToolCallsHaveResponses } from "@/lib/ensure-tool-responses";
import type {
  ThreadConfig,
  ThreadState,
  ThreadSubmission,
} from "@/types/thread";

type LangGraphState = { messages: Message[]; context?: Record<string, unknown> };

const useTypedStream = useStream<
  LangGraphState,
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      context?: Record<string, unknown>;
    };
  }
>;

export interface UseLangGraphThreadResult extends ThreadState {
  submit: (submission: ThreadSubmission) => void;
  stop: () => void;
  startNewThread: () => void;
}

export function useLangGraphThread(
  config: ThreadConfig,
): UseLangGraphThreadResult {
  const [localThreadId, setLocalThreadId] = useState<string | null>(
    config.threadId ?? null,
  );

  const stream = useTypedStream({
    apiUrl: config.apiUrl,
    apiKey: config.apiKey ?? undefined,
    assistantId: config.assistantId,
    threadId: localThreadId,
    fetchStateHistory: true,
    onThreadId: (id) => setLocalThreadId(id),
  });

  const submit = (submission: ThreadSubmission) => {
    const content: Message["content"] =
      typeof submission.content === "string"
        ? [{ type: "text" as const, text: submission.content }]
        : submission.content;

    const newHumanMessage: Message = {
      id: crypto.randomUUID(),
      type: "human",
      content,
    };

    const toolMessages = ensureToolCallsHaveResponses(stream.messages ?? []);
    const context =
      submission.context && Object.keys(submission.context).length > 0
        ? submission.context
        : undefined;

    stream.submit(
      { messages: [...toolMessages, newHumanMessage], context },
      {
        streamMode: ["values"],
        streamSubgraphs: true,
        streamResumable: true,
        optimisticValues: (prev) => ({
          ...prev,
          ...(context ? { context } : {}),
          messages: [
            ...(prev?.messages ?? []),
            ...toolMessages,
            newHumanMessage,
          ],
        }),
      },
    );
  };

  const startNewThread = () => {
    setLocalThreadId(null);
  };

  const state: ThreadState = useMemo(
    () => ({
      threadId: localThreadId,
      messages: stream.messages ?? [],
      isStreaming: stream.isLoading,
      error:
        stream.error instanceof Error
          ? stream.error.message
          : typeof stream.error === "string"
            ? stream.error
            : undefined,
    }),
    [localThreadId, stream.error, stream.isLoading, stream.messages],
  );

  return {
    ...state,
    submit,
    stop: stream.stop,
    startNewThread,
  };
}
