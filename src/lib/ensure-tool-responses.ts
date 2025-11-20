import { v4 as uuidv4 } from "uuid";
import type { Message, ToolMessage } from "@langchain/langgraph-sdk";

// Tool calls sometimes arrive without the follow-up tool response; create a placeholder response
export function ensureToolCallsHaveResponses(messages: Message[]): Message[] {
  const newMessages: ToolMessage[] = [];

  // Build a map of tool_call_id -> ToolMessage for quick lookup
  const toolMessageMap = new Map<string, ToolMessage>();
  messages.forEach((message) => {
    if (message.type === "tool" && message.tool_call_id) {
      toolMessageMap.set(message.tool_call_id, message);
    }
  });

  messages.forEach((message) => {
    if (message.type !== "ai" || !message.tool_calls || message.tool_calls.length === 0) {
      return;
    }

    // Check each tool call individually to see if it has a response
    message.tool_calls.forEach((toolCall) => {
      const toolCallId = toolCall.id ?? "";

      // Skip if this tool call already has a response
      if (toolMessageMap.has(toolCallId)) {
        return;
      }

      // Create a placeholder response for this specific tool call
      newMessages.push({
        type: "tool" as const,
        tool_call_id: toolCallId,
        id: `placeholder-tool-response-${uuidv4()}`,
        name: toolCall.name,
        content: "Handled tool call.",
      });
    });
  });

  return newMessages;
}
