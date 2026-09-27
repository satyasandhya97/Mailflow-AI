import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
} from "ai";

const STREAM_CHUNK_MS = 16;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  for (const char of text) {
    chunks.push(char);
  }
  return chunks;
}

export function mockStreamResponse(message: string) {
  const textId = generateId();

  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: async ({ writer }) => {
        writer.write({ type: "text-start", id: textId });

        for (const delta of chunkText(message)) {
          writer.write({ type: "text-delta", id: textId, delta });
          await new Promise((resolve) => setTimeout(resolve, STREAM_CHUNK_MS));
        }

        writer.write({ type: "text-end", id: textId });
      },
    }),
  });
}
