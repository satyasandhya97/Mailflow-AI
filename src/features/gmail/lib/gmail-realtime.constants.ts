export const GMAIL_WS_PATH = "/api/ws/gmail";

export type GmailRealtimeEvent =
  | { type: "gmail.inbox.updated"; at: string }
  | { type: "gmail.connected"; at: string };
