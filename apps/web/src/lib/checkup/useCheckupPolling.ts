import { useCallback, useEffect, useRef, useState } from "react";
import { getCheckupRun } from "./checkupApi";
import type { CheckupRunStatusResponse } from "./checkupTypes";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

interface PollingState {
  status: CheckupRunStatusResponse | null;
  error: string | null;
  timedOut: boolean;
}

export function useCheckupPolling(aiRunId: string | null) {
  const [state, setState] = useState<PollingState>({ status: null, error: null, timedOut: false });
  const startedAt = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!aiRunId) return;
    startedAt.current = Date.now();

    async function poll() {
      if (Date.now() - startedAt.current > POLL_TIMEOUT_MS) {
        stopPolling();
        setState((s) => ({ ...s, timedOut: true, error: "Tempo limite excedido. Atualize a página para verificar o status." }));
        return;
      }
      try {
        const result = await getCheckupRun(aiRunId!);
        setState({ status: result, error: null, timedOut: false });
        if (result.status === "completed" || result.status === "failed") {
          stopPolling();
        }
      } catch {
        setState((s) => ({ ...s, error: "Erro ao consultar o status. Tentando novamente..." }));
      }
    }

    poll(); // immediate first call
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return stopPolling;
  }, [aiRunId, stopPolling]);

  return state;
}
