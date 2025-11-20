import { v4 as uuidv4 } from "uuid";
import type { Message, ToolMessage } from "@langchain/langgraph-sdk";

// Tool calls sometimes arrive without the follow-up tool response; create a placeholder response
export function ensureToolCallsHaveResponses(messages: Message[]): Message[] {
  const newMessages: ToolMessage[] = [];

  messages.forEach((message, index) => {
    if (message.type !== "ai" || message.tool_calls?.length === 0) {
      return;
    }

    const followingMessage = messages[index + 1];
    if (followingMessage && followingMessage.type === "tool") {
      return;
    }

    newMessages.push(
      ...(message.tool_calls?.map((toolCall) => ({
        type: "tool" as const,
        tool_call_id: toolCall.id ?? "",
        id: `placeholder-tool-response-${uuidv4()}`,
        name: toolCall.name,
        content: "Handled tool call.",
      })) ?? []),
    );
  });

  return newMessages;
}
