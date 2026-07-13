"use client";

import { useEffect, useRef, useState } from "react";

import { apiBaseUrl } from "@/lib/apiClient";
import type { KpiSnapshotResponse } from "@/lib/types";

interface UseKpiSocketOptions {
  enabled?: boolean;
  initialPayload?: KpiSnapshotResponse | null;
}

type SocketStatus = "idle" | "connecting" | "reconnecting" | "open" | "closed" | "error";

function buildWebSocketUrl(pathname: string) {
  const url = new URL(apiBaseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = pathname;
  url.search = "";
  return url.toString();
}

export function useKpiSocket(options: UseKpiSocketOptions = {}) {
  const { enabled = true, initialPayload = null } = options;
  const [data, setData] = useState<KpiSnapshotResponse | null>(initialPayload);
  const [history, setHistory] = useState<Record<string, number[]>>(() =>
    Object.fromEntries(
      (initialPayload?.metrics ?? []).map((metric) => [metric.name, [metric.value]]),
    ),
  );
  const [status, setStatus] = useState<SocketStatus>(enabled ? "connecting" : "idle");
  const [error, setError] = useState<string | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let disposed = false;

    const cleanupSocket = () => {
      if (socketRef.current) {
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onerror = null;
        socketRef.current.onclose = null;
        socketRef.current.close();
        socketRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (disposed) {
        return;
      }

      const backoff = Math.min(30_000, 1_000 * 2 ** reconnectAttempts.current);
      reconnectAttempts.current += 1;
      setStatus("reconnecting");

      reconnectTimer.current = setTimeout(() => {
        connect();
      }, backoff);
    };

    const connect = () => {
      cleanupSocket();
      setStatus(reconnectAttempts.current > 0 ? "reconnecting" : "connecting");

      const socket = new WebSocket(buildWebSocketUrl("/api/kpis/ws/kpis"));
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttempts.current = 0;
        setStatus("open");
        setError(null);
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as KpiSnapshotResponse;
          setData(payload);
          setHistory((current) => {
            const next = { ...current };

            for (const metric of payload.metrics) {
              next[metric.name] = [...(next[metric.name] ?? []), metric.value].slice(-12);
            }

            return next;
          });
        } catch {
          setError("Received an unreadable live KPI update.");
        }
      };

      socket.onerror = () => {
        setStatus("error");
        setError("Live KPI connection interrupted.");
      };

      socket.onclose = () => {
        if (disposed) {
          setStatus("closed");
          return;
        }

        scheduleReconnect();
      };
    };

    connect();

    return () => {
      disposed = true;

      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }

      cleanupSocket();
    };
  }, [enabled]);

  return {
    data: data ?? initialPayload,
    error,
    history,
    status: enabled ? status : "idle",
    isConnected: enabled && status === "open",
  };
}
