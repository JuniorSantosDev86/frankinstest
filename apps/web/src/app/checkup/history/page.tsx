"use client";

import { useReducer, useEffect } from "react";
import { getMockSession } from "@/lib/auth/mockSession";
import { listCheckupRuns, getCheckupRunsSummary, ApiError } from "@/lib/checkup/checkupApi";
import type { CheckupRunsPage, CheckupRunsSummary } from "@/lib/checkup/checkupTypes";
import CommandCenterPanel from "./components/CommandCenterPanel";
import CheckupHistoryList from "./components/CheckupHistoryList";

// ── State shape ────────────────────────────────────────────────────────────

interface PageState {
  page: number;
  refreshKey: number;
  summary: CheckupRunsSummary | null;
  summaryLoading: boolean;
  summaryError: string | null;
  runsPage: CheckupRunsPage | null;
  listLoading: boolean;
  listError: string | null;
}

type PageAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_DONE"; summary: CheckupRunsSummary | null; summaryError: string | null; runsPage: CheckupRunsPage | null; listError: string | null }
  | { type: "REFRESH" }
  | { type: "SET_PAGE"; page: number };

function reducer(state: PageState, action: PageAction): PageState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, summaryLoading: true, listLoading: true, summaryError: null, listError: null };
    case "FETCH_DONE":
      return {
        ...state,
        summaryLoading: false,
        listLoading: false,
        summary: action.summary ?? state.summary,
        summaryError: action.summaryError,
        runsPage: action.runsPage ?? state.runsPage,
        listError: action.listError,
      };
    case "REFRESH":
      return { ...state, refreshKey: state.refreshKey + 1 };
    case "SET_PAGE":
      return { ...state, page: action.page };
    default:
      return state;
  }
}

const initialState: PageState = {
  page: 0,
  refreshKey: 0,
  summary: null,
  summaryLoading: true,
  summaryError: null,
  runsPage: null,
  listLoading: true,
  listError: null,
};

// ── Component ──────────────────────────────────────────────────────────────

export default function CheckupHistoryPage() {
  const orgId = getMockSession().activeOrganization.id;
  const pageSize = 20;

  const [state, dispatch] = useReducer(reducer, initialState);
  const { page, refreshKey, summary, summaryLoading, summaryError, runsPage, listLoading, listError } = state;

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "FETCH_START" });

    Promise.allSettled([
      getCheckupRunsSummary(),
      listCheckupRuns(orgId, page, pageSize),
    ]).then(([summaryResult, listResult]) => {
      if (cancelled) return;
      dispatch({
        type: "FETCH_DONE",
        summary: summaryResult.status === "fulfilled" ? summaryResult.value : null,
        summaryError: summaryResult.status === "rejected"
          ? (summaryResult.reason instanceof ApiError ? summaryResult.reason.message : "Erro ao carregar resumo. Tente novamente.")
          : null,
        runsPage: listResult.status === "fulfilled" ? listResult.value : null,
        listError: listResult.status === "rejected"
          ? (listResult.reason instanceof ApiError ? listResult.reason.message : "Erro ao carregar histórico. Tente novamente.")
          : null,
      });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, refreshKey]);

  function handleRefresh() {
    dispatch({ type: "REFRESH" });
  }

  function handlePageChange(newPage: number) {
    dispatch({ type: "SET_PAGE", page: newPage });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Histórico de Check-ups</h1>
          <p className="text-sm text-gray-500 mt-1">
            Todas as execuções de Check-up da sua organização.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={summaryLoading || listLoading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className={`w-4 h-4 ${summaryLoading || listLoading ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Atualizar
        </button>
      </div>

      {/* Command Center — topo da página */}
      <CommandCenterPanel
        data={summary}
        loading={summaryLoading}
        error={summaryError}
        onRetry={handleRefresh}
      />

      {/* Lista de histórico */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">
          Execuções anteriores
        </h2>
        <CheckupHistoryList
          data={runsPage}
          loading={listLoading}
          error={listError}
          page={page}
          onPageChange={handlePageChange}
          onRetry={handleRefresh}
        />
      </div>
    </div>
  );
}
