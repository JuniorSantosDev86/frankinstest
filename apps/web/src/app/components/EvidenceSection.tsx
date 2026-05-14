"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  demoBugReports,
  listBugReportsByProject,
} from "@/lib/bugs/bugService";
import type { BugReport } from "@/lib/bugs/types";
import {
  createEvidence,
  demoEvidence,
  getEvidenceSummary,
  listEvidenceByProject,
  updateEvidence,
  validateEvidenceInput,
} from "@/lib/evidence/evidenceService";
import {
  evidenceSources,
  evidenceStatuses,
  evidenceTypes,
  type Evidence,
  type EvidenceInput,
  type EvidenceSource,
  type EvidenceStatus,
  type EvidenceType,
} from "@/lib/evidence/types";
import type { Project } from "@/lib/projects/types";
import {
  demoTestCases,
  demoTestCycles,
  demoTestExecutions,
  demoTestSuites,
  listExecutionsByProject,
} from "@/lib/test-design/testDesignService";
import type { TestCase, TestCycle, TestExecution, TestSuite } from "@/lib/test-design/types";

export const evidenceStorageKey = "frankintest.block06.evidence";
const bugReportStorageKey = "frankintest.block06.bugReports";
const testExecutionStorageKey = "frankintest.block05.testExecutions";
const testCycleStorageKey = "frankintest.block05.testCycles";
const testSuiteStorageKey = "frankintest.block05.testSuites";
const testCaseStorageKey = "frankintest.block04.testCases";

const evidenceTypeLabels: Record<EvidenceType, string> = {
  screenshot: "Print",
  video: "Vídeo",
  log: "Log",
  document: "Documento",
  url: "URL",
  note: "Nota",
};

const sourceLabels: Record<EvidenceSource, string> = {
  manual: "Manual",
  execution: "Execução",
  bug_report: "Bug report",
  imported: "Importado",
};

const statusLabels: Record<EvidenceStatus, string> = {
  draft: "Rascunho",
  attached: "Anexada",
  needs_review: "Precisa revisão",
  archived: "Arquivada",
};

const typeBadgeClasses: Record<EvidenceType, string> = {
  screenshot: "bg-sky-50 text-sky-800 ring-sky-900/15",
  video: "bg-violet-50 text-violet-800 ring-violet-900/15",
  log: "bg-amber-50 text-amber-900 ring-amber-900/15",
  document: "bg-slate-100 text-slate-700 ring-slate-900/10",
  url: "bg-teal-50 text-teal-800 ring-teal-900/15",
  note: "bg-emerald-50 text-emerald-800 ring-emerald-900/15",
};

const statusBadgeClasses: Record<EvidenceStatus, string> = {
  draft: "bg-slate-100 text-slate-700 ring-slate-900/10",
  attached: "bg-emerald-50 text-emerald-800 ring-emerald-900/15",
  needs_review: "bg-amber-50 text-amber-900 ring-amber-900/15",
  archived: "bg-slate-200 text-slate-800 ring-slate-900/10",
};

type EvidenceFormState = {
  projectId: string;
  bugReportId: string;
  executionId: string;
  title: string;
  description: string;
  evidenceType: EvidenceType;
  source: EvidenceSource;
  reference: string;
  status: EvidenceStatus;
  capturedBy: string;
  capturedAt: string;
};

type EvidenceSectionProps = {
  projects: Project[];
};

const emptyEvidenceForm: EvidenceFormState = {
  projectId: "",
  bugReportId: "",
  executionId: "",
  title: "",
  description: "",
  evidenceType: "note",
  source: "manual",
  reference: "",
  status: "draft",
  capturedBy: "",
  capturedAt: "",
};

export function EvidenceSection({ projects }: EvidenceSectionProps) {
  const [testCases, setTestCases] = useState<TestCase[]>(demoTestCases);
  const [testSuites, setTestSuites] = useState<TestSuite[]>(demoTestSuites);
  const [testCycles, setTestCycles] = useState<TestCycle[]>(demoTestCycles);
  const [testExecutions, setTestExecutions] = useState<TestExecution[]>(demoTestExecutions);
  const [bugReports, setBugReports] = useState<BugReport[]>(demoBugReports);
  const [evidence, setEvidence] = useState<Evidence[]>(demoEvidence);
  const [hasLoadedLocalEvidence, setHasLoadedLocalEvidence] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(() => projects[0]?.id ?? "");
  const activeProjectId = selectedProjectId || projects[0]?.id || "";
  const [formState, setFormState] = useState<EvidenceFormState>({
    ...emptyEvidenceForm,
    projectId: activeProjectId,
  });
  const [editingEvidenceId, setEditingEvidenceId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedTestCases = window.localStorage.getItem(testCaseStorageKey);
      const storedTestSuites = window.localStorage.getItem(testSuiteStorageKey);
      const storedTestCycles = window.localStorage.getItem(testCycleStorageKey);
      const storedTestExecutions = window.localStorage.getItem(testExecutionStorageKey);
      const storedBugReports = window.localStorage.getItem(bugReportStorageKey);
      const storedEvidence = window.localStorage.getItem(evidenceStorageKey);

      if (storedTestCases) {
        setTestCases(JSON.parse(storedTestCases) as TestCase[]);
      }

      if (storedTestSuites) {
        setTestSuites(JSON.parse(storedTestSuites) as TestSuite[]);
      }

      if (storedTestCycles) {
        setTestCycles(JSON.parse(storedTestCycles) as TestCycle[]);
      }

      if (storedTestExecutions) {
        setTestExecutions(JSON.parse(storedTestExecutions) as TestExecution[]);
      }

      if (storedBugReports) {
        setBugReports(JSON.parse(storedBugReports) as BugReport[]);
      }

      if (storedEvidence) {
        setEvidence(JSON.parse(storedEvidence) as Evidence[]);
      }

      setHasLoadedLocalEvidence(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const projectBugReports = useMemo(
    () => listBugReportsByProject(activeProjectId, bugReports),
    [activeProjectId, bugReports],
  );
  const projectExecutions = useMemo(
    () => listExecutionsByProject(activeProjectId, testExecutions),
    [activeProjectId, testExecutions],
  );
  const projectEvidence = useMemo(
    () => listEvidenceByProject(activeProjectId, evidence),
    [activeProjectId, evidence],
  );
  const summary = useMemo(
    () => getEvidenceSummary(activeProjectId, evidence),
    [activeProjectId, evidence],
  );
  const selectedProject = projects.find((project) => project.id === activeProjectId);

  function persistEvidence(nextEvidence: Evidence[]) {
    setEvidence(nextEvidence);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(evidenceStorageKey, JSON.stringify(nextEvidence));
    }
  }

  function resetForm(projectId = activeProjectId) {
    setFormState({
      ...emptyEvidenceForm,
      projectId,
    });
    setEditingEvidenceId(null);
    setValidationError(false);
  }

  function handleProjectChange(projectId: string) {
    setSelectedProjectId(projectId);
    resetForm(projectId);
  }

  function toEvidenceInput(): EvidenceInput {
    return {
      projectId: activeProjectId,
      bugReportId: formState.bugReportId,
      executionId: formState.executionId,
      title: formState.title,
      description: formState.description,
      evidenceType: formState.evidenceType,
      source: formState.source,
      reference: formState.reference,
      status: formState.status,
      capturedBy: formState.capturedBy,
      capturedAt: formState.capturedAt,
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = toEvidenceInput();
    const bugBelongsToProject =
      input.bugReportId?.trim().length === 0 ||
      projectBugReports.some((bugReport) => bugReport.id === input.bugReportId);
    const executionBelongsToProject =
      input.executionId?.trim().length === 0 ||
      projectExecutions.some((execution) => execution.id === input.executionId);

    if (
      validateEvidenceInput(input).length > 0 ||
      !bugBelongsToProject ||
      !executionBelongsToProject
    ) {
      setValidationError(true);
      return;
    }

    if (editingEvidenceId) {
      persistEvidence(
        evidence.map((item) =>
          item.id === editingEvidenceId ? updateEvidence(item, input) : item,
        ),
      );
    } else {
      persistEvidence([createEvidence(input), ...evidence]);
    }

    resetForm(activeProjectId);
  }

  function startEditingEvidence(item: Evidence) {
    setSelectedProjectId(item.projectId);
    setEditingEvidenceId(item.id);
    setValidationError(false);
    setFormState({
      projectId: item.projectId,
      bugReportId: item.bugReportId,
      executionId: item.executionId,
      title: item.title,
      description: item.description,
      evidenceType: item.evidenceType,
      source: item.source,
      reference: item.reference,
      status: item.status,
      capturedBy: item.capturedBy,
      capturedAt: item.capturedAt,
    });
  }

  function getBugTitle(bugReportId: string) {
    return bugReports.find((bugReport) => bugReport.id === bugReportId)?.title ?? "Sem bug vinculado";
  }

  function getExecutionLabel(executionId: string) {
    const execution = testExecutions.find((item) => item.id === executionId);

    if (!execution) {
      return "Sem execução vinculada";
    }

    const testCase = testCases.find((item) => item.id === execution.testCaseId);
    const testSuite = testSuites.find((item) => item.id === execution.testSuiteId);
    const testCycle = testCycles.find((item) => item.id === execution.cycleId);

    return `${testCycle?.name ?? "Ciclo"} / ${testSuite?.name ?? "Suíte"} / ${
      testCase?.title ?? execution.id
    }`;
  }

  return (
    <section
      id="evidence"
      className="rounded-[1.5rem] border border-slate-900/10 bg-white/90 p-6 shadow-xl shadow-slate-900/5 md:p-8"
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.26em] text-teal-700">
            Centro de evidências
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Evidências
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Registre evidências estruturadas como metadados e referências locais, mantendo o fluxo
            Projeto -&gt; Bug -&gt; Evidência e Projeto -&gt; Execução -&gt; Evidência.
          </p>
        </div>

        <label className="grid min-w-64 gap-2 text-sm font-bold text-slate-700">
          Projeto em análise
          <select
            className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
            value={activeProjectId}
            onChange={(event) => handleProjectChange(event.target.value)}
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr]">
        <p className="rounded-2xl border border-teal-800/15 bg-teal-50 px-4 py-3 text-sm font-black text-teal-900">
          Projeto -&gt; Bug -&gt; Evidência
        </p>
        <p className="rounded-2xl border border-slate-900/10 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
          Projeto -&gt; Execução -&gt; Evidência
        </p>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <p className="rounded-2xl border border-slate-900/10 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700 lg:col-span-2">
          Persistência local de demonstração via localStorage: {evidenceStorageKey}.
        </p>
        <p className="rounded-2xl border border-amber-900/15 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-950">
          Este bloco registra apenas metadados/referências; upload real de arquivos será implementado depois.
        </p>
      </div>
      <p className="mt-3 rounded-2xl border border-sky-900/15 bg-sky-50 px-4 py-3 text-sm font-semibold leading-6 text-sky-950">
        Evidências ainda não geram relatórios automaticamente.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total" value={summary.totalEvidence} />
        <SummaryCard label="Prints" value={summary.screenshotEvidence} />
        <SummaryCard label="Logs" value={summary.logEvidence} />
        <SummaryCard label="Notas" value={summary.noteEvidence} />
        <SummaryCard label="Anexadas" value={summary.attachedEvidence} />
        <SummaryCard label="Revisão" value={summary.evidenceNeedingReview} />
        <SummaryCard label="Com bug" value={summary.linkedToBugEvidence} />
        <SummaryCard label="Com execução" value={summary.linkedToExecutionEvidence} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form
          className="rounded-2xl border border-slate-900/10 bg-slate-50 p-5"
          onSubmit={handleSubmit}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-700">
                {editingEvidenceId ? "Editar evidência" : "Nova evidência"}
              </p>
              <h3 className="mt-2 text-xl font-black text-slate-950">
                {selectedProject?.name ?? "Projeto local"}
              </h3>
            </div>
            {editingEvidenceId ? (
              <button
                type="button"
                className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 text-xs font-black text-slate-700"
                onClick={() => resetForm(activeProjectId)}
              >
                Cancelar edição
              </button>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Bug vinculado
              <select
                className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                value={formState.bugReportId}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, bugReportId: event.target.value }))
                }
              >
                <option value="">Sem bug vinculado</option>
                {projectBugReports.map((bugReport) => (
                  <option key={bugReport.id} value={bugReport.id}>
                    {bugReport.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Execução vinculada
              <select
                className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                value={formState.executionId}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, executionId: event.target.value }))
                }
              >
                <option value="">Sem execução vinculada</option>
                {projectExecutions.map((execution) => (
                  <option key={execution.id} value={execution.id}>
                    {getExecutionLabel(execution.id)} ({execution.status})
                  </option>
                ))}
              </select>
            </label>

            <TextInput
              label="Título"
              value={formState.title}
              onChange={(value) => setFormState((current) => ({ ...current, title: value }))}
            />
            <TextArea
              label="Descrição"
              value={formState.description}
              onChange={(value) => setFormState((current) => ({ ...current, description: value }))}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <SelectInput
                label="Tipo de evidência"
                value={formState.evidenceType}
                options={evidenceTypes}
                labels={evidenceTypeLabels}
                onChange={(value) =>
                  setFormState((current) => ({
                    ...current,
                    evidenceType: value as EvidenceType,
                  }))
                }
              />
              <SelectInput
                label="Origem"
                value={formState.source}
                options={evidenceSources}
                labels={sourceLabels}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, source: value as EvidenceSource }))
                }
              />
              <SelectInput
                label="Status"
                value={formState.status}
                options={evidenceStatuses}
                labels={statusLabels}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, status: value as EvidenceStatus }))
                }
              />
            </div>

            <TextArea
              label="Referência"
              value={formState.reference}
              onChange={(value) => setFormState((current) => ({ ...current, reference: value }))}
              placeholder="URL, caminho local, trecho de log ou nota curta"
            />
            <TextInput
              label="Capturado por"
              value={formState.capturedBy}
              onChange={(value) => setFormState((current) => ({ ...current, capturedBy: value }))}
            />
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Capturado em
              <input
                type="date"
                className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                value={formState.capturedAt}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, capturedAt: event.target.value }))
                }
              />
            </label>

            {validationError ? (
              <p className="rounded-xl border border-rose-900/15 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800">
                Revise os campos obrigatórios e vincule ao menos um bug ou uma execução.
              </p>
            ) : null}

            <button
              type="submit"
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-teal-800"
            >
              {editingEvidenceId ? "Salvar edição" : "Criar evidência"}
            </button>
          </div>
        </form>

        <section className="grid gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-700">
              Resumo de evidências
            </p>
            <h3 className="mt-2 text-2xl font-black text-slate-950">
              {projectEvidence.length} evidências vinculadas ao projeto
            </h3>
          </div>

          {!hasLoadedLocalEvidence ? (
            <p className="sr-only">Carregando persistência local de evidências</p>
          ) : null}

          {projectEvidence.length === 0 ? (
            <div className="rounded-2xl border border-slate-900/10 bg-white p-5 text-sm font-semibold text-slate-600">
              Nenhuma evidência local cadastrada para este projeto.
            </div>
          ) : (
            projectEvidence.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-900/10 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="text-lg font-black text-slate-950">{item.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-xl border border-slate-900/10 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 transition hover:border-teal-700/40 hover:text-teal-800"
                    onClick={() => startEditingEvidence(item)}
                  >
                    Editar evidência
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge
                    label={`Tipo: ${evidenceTypeLabels[item.evidenceType]}`}
                    className={typeBadgeClasses[item.evidenceType]}
                  />
                  <Badge
                    label={`Origem: ${sourceLabels[item.source]}`}
                    className="bg-slate-100 text-slate-700 ring-slate-900/10"
                  />
                  <Badge
                    label={`Status: ${statusLabels[item.status]}`}
                    className={statusBadgeClasses[item.status]}
                  />
                </div>

                <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  <InfoItem
                    label="Bug vinculado"
                    value={item.bugReportId ? getBugTitle(item.bugReportId) : "Sem bug vinculado"}
                  />
                  <InfoItem
                    label="Execução vinculada"
                    value={
                      item.executionId ? getExecutionLabel(item.executionId) : "Sem execução vinculada"
                    }
                  />
                  <InfoItem label="Capturado por" value={item.capturedBy || "Não informado"} />
                  <InfoItem label="Capturado em" value={item.capturedAt || "Não informado"} />
                </dl>

                <div className="mt-4 rounded-xl border border-slate-900/10 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Referência
                  </p>
                  <p className="mt-2 break-words text-sm leading-6 text-slate-700">
                    {item.reference}
                  </p>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-900/10 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      <input
        className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      <textarea
        className="min-h-24 rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectInput<T extends string>({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      <select
        className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option]}
          </option>
        ))}
      </select>
    </label>
  );
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${className}`}>
      {label}
    </span>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-900/10 bg-slate-50 p-3">
      <dt className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</dt>
      <dd className="mt-1 leading-6 text-slate-700">{value}</dd>
    </div>
  );
}
