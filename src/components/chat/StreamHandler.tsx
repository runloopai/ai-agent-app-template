const decoder = new TextDecoder();

export async function streamResponse(
  response: Response,
  onChunk: (text: string) => void,
) {
  const reader = response.body?.getReader();
  if (!reader) return;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) {
      const text = decoder.decode(value, { stream: true });
      if (text) {
        onChunk(text);
      }
    }
  }
}
