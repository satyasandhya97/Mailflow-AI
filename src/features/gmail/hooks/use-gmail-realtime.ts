"use client";

import { useEffect, useRef } from "react";

import { GMAIL_WS_PATH } from "@/features/gmail/lib/gmail-realtime.constants";
import { api } from "@/trpc/react";

const BASE_RECONNECT_MS = 1_000;
const MAX_RECONNECT_MS = 30_000;

function buildGmailWebSocketUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_GMAIL_WS_URL;
  if (fromEnv) {
    return fromEnv;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

  if (process.env.NEXT_PUBLIC_GMAIL_WS_SAME_ORIGIN === "true") {
    return `${protocol}//${window.location.host}${GMAIL_WS_PATH}`;
  }

  const wsPort = process.env.NEXT_PUBLIC_GMAIL_WS_PORT ?? "3001";
  return `${protocol}//${window.location.hostname}:${wsPort}${GMAIL_WS_PATH}`;
}

export function useGmailRealtime(enabled: boolean) {
  const utils = api.useUtils();
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let ws: WebSocket | null = null;
    let disposed = false;

    const invalidateGmailQueries = () => {
      void utils.gmail.searchEmails.invalidate();
      void utils.gmail.listSent.invalidate();
      void utils.gmail.listStarred.invalidate();
      void utils.gmail.listDrafts.invalidate();
      void utils.gmail.getDraftCount.invalidate();
      void utils.gmail.listLabels.invalidate();
      void utils.gmail.listByLabel.invalidate();
    };

    const scheduleReconnect = () => {
      if (disposed) return;

      const attempt = reconnectAttemptRef.current;
      const delay = Math.min(BASE_RECONNECT_MS * 2 ** attempt, MAX_RECONNECT_MS);
      reconnectAttemptRef.current = attempt + 1;

      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, delay);
    };

    const connect = () => {
      if (disposed) return;

      ws = new WebSocket(buildGmailWebSocketUrl());

      ws.onopen = () => {
        reconnectAttemptRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(String(event.data)) as { type?: string };
          if (payload.type === "gmail.inbox.updated") {
            invalidateGmailQueries();
          }
        } catch {
          // Ignore malformed frames.
        }
      };

      ws.onclose = () => {
        if (!disposed) {
          scheduleReconnect();
        }
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      ws?.close();
    };
  }, [enabled, utils]);
}
