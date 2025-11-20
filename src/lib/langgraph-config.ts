export function getDefaultLangGraphAssistantId(): string {
  return process.env.NEXT_PUBLIC_LANGGRAPH_ASSISTANT_ID ?? "agent";
}
