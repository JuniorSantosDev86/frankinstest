"use client";

import { useEffect, useState } from "react";

type ApiStatus = "checking" | "online" | "offline";

export function ApiStatusBadge() {
  const [status, setStatus] = useState<ApiStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    fetch("http://localhost:8080/api/health", { signal: AbortSignal.timeout(3000) })
      .then((res) => {
        if (!cancelled) setStatus(res.ok ? "online" : "offline");
      })
      .catch(() => {
        if (!cancelled) setStatus("offline");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const label: Record<ApiStatus, string> = {
    checking: "Verificando API...",
    online: "API online",
    offline: "API offline",
  };

  const dot: Record<ApiStatus, string> = {
    checking: "bg-slate-400 animate-pulse",
    online: "bg-emerald-500",
    offline: "bg-rose-500",
  };

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
      <span className={`h-2 w-2 rounded-full ${dot[status]}`} />
      {label[status]}
    </span>
  );
}
