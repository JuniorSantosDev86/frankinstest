"use client";

import { useState } from "react";
import { generateRecommendations, saveRecommendationAsArtifact } from "@/lib/toolrecommendations/toolRecommendationsApi";
import type { ToolRecommendationResult } from "@/lib/toolrecommendations/toolRecommendationsTypes";
import Link from "next/link";

type PanelState = "idle" | "loading" | "loaded" | "error" | "saving" | "saved" | "save-error";

interface Props {
  reportId: string;
}

const PRIORITY_LABEL: Record<string, string> = {
  PRIMARY: "Principal",
  SECONDARY: "Alternativa",
};

const PRIORITY_COLOR: Record<string, string> = {
  PRIMARY: "bg-blue-100 text-blue-700",
  SECONDARY: "bg-gray-100 text-gray-600",
};

export default function ToolRecommendationPanel({ reportId }: Props) {
  const [state, setState] = useState<PanelState>("idle");
  const [result, setResult] = useState<ToolRecommendationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleGenerate() {
    setState("loading");
    setErrorMsg(null);
    try {
      const data = await generateRecommendations(reportId);
      setResult(data);
      setState("loaded");
    } catch {
      setErrorMsg("Erro ao gerar recomendações. Tente novamente.");
      setState("error");
    }
  }

  async function handleSave() {
    setState("saving");
    setErrorMsg(null);
    try {
      await saveRecommendationAsArtifact(reportId);
      setState("saved");
    } catch {
      setErrorMsg("Erro ao salvar artefato. Tente novamente.");
      setState("save-error");
    }
  }

  return (
    <div className="border border-gray-200 rounded-md p-4 mb-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Recomendações de ferramentas</h2>

      {(state === "idle" || state === "error") && (
        <>
          {state === "error" && errorMsg && (
            <p className="text-xs text-red-600 mb-2">{errorMsg}</p>
          )}
          <button
            onClick={handleGenerate}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Gerar recomendações de ferramentas
          </button>
        </>
      )}

      {state === "loading" && (
        <p className="text-sm text-gray-500">Carregando recomendações...</p>
      )}

      {(state === "loaded" || state === "saving" || state === "saved" || state === "save-error") && result && (
        <>
          {result.categories.length === 0 ? (
            <p className="text-sm text-gray-500">
              Nenhuma recomendação de ferramenta identificada para este relatório.
            </p>
          ) : (
            <div className="space-y-4 mb-3">
              {result.categories.map((cat) => (
                <div key={cat.categoryCode} className="border border-gray-100 rounded p-3">
                  <h3 className="text-sm font-medium text-gray-800 mb-1">{cat.categoryLabel}</h3>
                  <p className="text-xs text-gray-600 mb-2">{cat.justification}</p>

                  <div className="space-y-2 mb-3">
                    {cat.tools.map((tool) => (
                      <div key={tool.name} className="flex items-start gap-2">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium shrink-0 ${PRIORITY_COLOR[tool.priority] ?? "bg-gray-100 text-gray-600"}`}>
                          {PRIORITY_LABEL[tool.priority] ?? tool.priority}
                        </span>
                        <div>
                          <a
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 hover:underline"
                          >
                            {tool.name}
                          </a>
                          <p className="text-xs text-gray-500">{tool.rationale}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {cat.nextSteps.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">Próximos passos:</p>
                      <ol className="list-decimal list-inside space-y-0.5">
                        {cat.nextSteps.map((step, i) => (
                          <li key={i} className="text-xs text-gray-600">{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {state === "save-error" && errorMsg && (
            <p className="text-xs text-red-600 mb-2">{errorMsg}</p>
          )}

          {state === "saved" ? (
            <p className="text-xs text-green-700">
              Artefato salvo no Workspace.{" "}
              <Link href="/workspace/artifacts" className="underline hover:text-green-900">
                Ver artefatos
              </Link>
            </p>
          ) : (
            <button
              onClick={handleSave}
              disabled={state === "saving"}
              className="px-3 py-1.5 bg-gray-700 text-white text-sm rounded hover:bg-gray-800 disabled:opacity-50"
            >
              {state === "saving" ? "Salvando..." : "Salvar como artefato"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
