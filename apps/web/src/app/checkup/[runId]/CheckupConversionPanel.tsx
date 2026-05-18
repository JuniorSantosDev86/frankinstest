"use client";

import { useState } from "react";
import { getDevToken } from "@/lib/auth/getDevToken";
import { getMockSession } from "@/lib/auth/mockSession";
import { previewConversion, confirmConversion } from "@/lib/conversion/conversionApi";
import type {
  ConversionSelectedItem,
  ConversionPreviewItem,
  ConversionConfirmItem,
  ConversionResult,
} from "@/lib/conversion/conversionTypes";
import { SECTION_LABELS, ARTIFACT_TYPE_LABELS } from "@/lib/conversion/conversionTypes";

type CheckupReportSection = {
  sectionKey: string;
  label: string;
  items: Array<{ title: string; description?: string }>;
};

interface CheckupConversionPanelProps {
  reportId: string;
  sections: CheckupReportSection[];
}

type PanelStep = "select" | "preview" | "done";

export default function CheckupConversionPanel({
  reportId,
  sections,
}: CheckupConversionPanelProps) {
  const [step, setStep] = useState<PanelStep>("select");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewItems, setPreviewItems] = useState<ConversionPreviewItem[]>([]);
  const [intentMap, setIntentMap] = useState<Record<string, "CREATE_NEW" | "SKIP">>({});
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmDisabled, setConfirmDisabled] = useState(false);

  const itemKey = (section: string, index: number) => `${section}:${index}`;

  function toggleItem(section: string, index: number) {
    const key = itemKey(section, index);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handlePreview() {
    setErrorMsg(null);
    if (selected.size === 0) return;

    const selectedItems: ConversionSelectedItem[] = Array.from(selected).map((key) => {
      const [section, idx] = key.split(":");
      return { sourceSection: section, sourceItemIndex: parseInt(idx, 10) };
    });

    setLoading(true);
    try {
      const token = getDevToken() ?? "";
      const orgId = getMockSession().activeOrganization.id;
      const preview = await previewConversion(reportId, orgId, token, selectedItems);

      // Default intent: SKIP for already converted, CREATE_NEW for new
      const defaults: Record<string, "CREATE_NEW" | "SKIP"> = {};
      for (const item of preview.items) {
        const key = itemKey(item.sourceSection, item.sourceItemIndex);
        defaults[key] = item.alreadyConverted ? "SKIP" : "CREATE_NEW";
      }
      setPreviewItems(preview.items);
      setIntentMap(defaults);
      setStep("preview");
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Erro ao pré-visualizar artefatos.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setErrorMsg(null);
    setConfirmDisabled(true);
    setLoading(true);

    const items: ConversionConfirmItem[] = previewItems.map((pi) => ({
      sourceSection: pi.sourceSection,
      sourceItemIndex: pi.sourceItemIndex,
      intent: intentMap[itemKey(pi.sourceSection, pi.sourceItemIndex)] ?? "CREATE_NEW",
    }));

    try {
      const token = getDevToken() ?? "";
      const orgId = getMockSession().activeOrganization.id;
      const res = await confirmConversion(reportId, orgId, token, items);
      setResult(res);
      setStep("done");
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Erro ao confirmar conversão.");
      setConfirmDisabled(false);
    } finally {
      setLoading(false);
    }
  }

  function toggleIntent(section: string, index: number) {
    const key = itemKey(section, index);
    setIntentMap((prev) => ({
      ...prev,
      [key]: prev[key] === "CREATE_NEW" ? "SKIP" : "CREATE_NEW",
    }));
  }

  if (sections.every((s) => s.items.length === 0)) return null;

  return (
    <div className="border border-indigo-200 rounded-lg p-5 mt-6 bg-indigo-50">
      <h2 className="text-base font-semibold text-indigo-900 mb-1">
        Converter itens em artefatos do Workspace
      </h2>
      <p className="text-sm text-indigo-700 mb-4">
        Selecione os itens do relatório que deseja promover para o Workspace como artefatos
        versionados e rastreáveis.
      </p>

      {/* ── STEP: SELECT ── */}
      {step === "select" && (
        <>
          {sections.map((sec) =>
            sec.items.length === 0 ? null : (
              <div key={sec.sectionKey} className="mb-4">
                <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wide mb-2">
                  {SECTION_LABELS[sec.sectionKey] ?? sec.label}
                </p>
                <div className="space-y-2">
                  {sec.items.map((item, i) => {
                    const key = itemKey(sec.sectionKey, i);
                    const checked = selected.has(key);
                    return (
                      <label
                        key={key}
                        className="flex items-start gap-2 cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleItem(sec.sectionKey, i)}
                          className="mt-0.5 accent-indigo-600"
                        />
                        <span className={checked ? "text-indigo-900 font-medium" : "text-gray-700"}>
                          {item.title}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )
          )}

          {errorMsg && (
            <p className="text-sm text-red-600 mb-3">{errorMsg}</p>
          )}

          <button
            onClick={handlePreview}
            disabled={selected.size === 0 || loading}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium
                       hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Carregando pré-visualização..." : `Pré-visualizar artefatos (${selected.size} selecionado${selected.size !== 1 ? "s" : ""})`}
          </button>
        </>
      )}

      {/* ── STEP: PREVIEW ── */}
      {step === "preview" && (
        <>
          <p className="text-sm text-indigo-800 mb-3 font-medium">
            Etapa 2 de 3 — Revise os artefatos a serem criados
          </p>
          <div className="space-y-3 mb-4">
            {previewItems.map((pi) => {
              const key = itemKey(pi.sourceSection, pi.sourceItemIndex);
              const intent = intentMap[key] ?? "CREATE_NEW";
              return (
                <div
                  key={key}
                  className={`border rounded-md p-3 text-sm ${
                    intent === "SKIP"
                      ? "border-gray-200 bg-white opacity-60"
                      : "border-indigo-300 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-800">{pi.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {ARTIFACT_TYPE_LABELS[pi.artifactType]} ·{" "}
                        <span className="text-gray-400">
                          {SECTION_LABELS[pi.sourceSection] ?? pi.sourceSection}
                        </span>
                      </p>
                      {pi.alreadyConverted && (
                        <p className="text-xs text-amber-700 mt-1">
                          ⚠️ Este item já foi convertido anteriormente. Por padrão, será pulado.
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleIntent(pi.sourceSection, pi.sourceItemIndex)}
                      className={`shrink-0 text-xs px-2 py-1 rounded border font-medium ${
                        intent === "CREATE_NEW"
                          ? "border-indigo-400 text-indigo-700 bg-indigo-50"
                          : "border-gray-300 text-gray-500 bg-gray-50"
                      }`}
                    >
                      {intent === "CREATE_NEW" ? "Criar" : "Pular"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {errorMsg && (
            <p className="text-sm text-red-600 mb-3">{errorMsg}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { setStep("select"); setErrorMsg(null); }}
              className="flex-1 border border-gray-300 text-gray-600 px-4 py-2 rounded-md text-sm hover:bg-gray-50"
            >
              Voltar
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirmDisabled || loading || previewItems.every((pi) => (intentMap[itemKey(pi.sourceSection, pi.sourceItemIndex)] ?? "CREATE_NEW") === "SKIP")}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium
                         hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Confirmando..." : "Confirmar conversão"}
            </button>
          </div>
        </>
      )}

      {/* ── STEP: DONE ── */}
      {step === "done" && result && (
        <div className="text-center py-4">
          <p className="text-2xl mb-2">✅</p>
          <p className="font-medium text-indigo-900 mb-1">
            {result.createdArtifacts.length} artefato{result.createdArtifacts.length !== 1 ? "s" : ""} criado{result.createdArtifacts.length !== 1 ? "s" : ""} no Workspace
          </p>
          {result.skippedCount > 0 && (
            <p className="text-sm text-gray-500 mb-3">
              {result.skippedCount} item{result.skippedCount !== 1 ? "ns" : ""} pulado{result.skippedCount !== 1 ? "s" : ""}.
            </p>
          )}
          <div className="space-y-1 text-left mt-3">
            {result.createdArtifacts.map((a) => (
              <p key={a.artifactId} className="text-sm text-gray-700">
                • {ARTIFACT_TYPE_LABELS[a.artifactType]} criado a partir de:{" "}
                <span className="text-gray-500">
                  {SECTION_LABELS[a.sourceSection] ?? a.sourceSection}
                </span>
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
