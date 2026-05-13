"use client";

import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";

import {
  demoBugReports,
  listBugReportsByProject,
} from "@/lib/bugs/bugService";
import type { BugReport } from "@/lib/bugs/types";
import { demoEvidence, listEvidenceByProject } from "@/lib/evidence/evidenceService";
import type { Evidence } from "@/lib/evidence/types";
import type { Project } from "@/lib/projects/types";
import {
  buildReportSnapshot,
  createReport,
  demoReports,
  getReportSummary,
  listReportsByProject,
  updateReport,
  validateReportInput,
} from "@/lib/reports/reportService";
import {
  reportScopes,
  reportStatuses,
  reportTypes,
  type Report,
  type ReportInput,
  type ReportScope,
  type ReportStatus,
  type ReportType,
} from "@/lib/reports/types";
import {
  demoTestCycles,
  demoTestExecutions,
  listExecutionsByProject,
  listTestCyclesByProject,
} from "@/lib/test-design/testDesignService";
import type { TestCycle, TestExecution } from "@/lib/test-design/types";

export const reportStorageKey = "frankintest.block07.reports";
const testCycleStorageKey = "frankintest.block05.testCycles";
const testExecutionStorageKey = "frankintest.block05.testExecutions";
const bugReportStorageKey = "frankintest.block06.bugReports";
const evidenceStorageKey = "frankintest.block06.evidence";

const reportTypeLabels: Record<ReportType, string> = {
  qa_status: "Relatório de status QA",
  execution_summary: "Resumo de execução",
  bug_summary: "Resumo de bugs",
  evidence_summary: "Resumo de evidências",
  release_review: "Revisão de release",
  stakeholder_update: "Atualização para stakeholders",
};

const statusLabels: Record<ReportStatus, string> = {
  draft: "Rascunho",
  ready: "Pronto",
  needs_review: "Precisa revisão",
  archived: "Arquivado",
};

const scopeLabels: Record<ReportScope, string> = {
  project: "Projeto",
  cycle: "Ciclo",
  bug: "Bug",
  evidence: "Evidência",
  mixed: "Misto",
};

const typeBadgeClasses: Record<ReportType, string> = {
  qa_status: "bg-teal-50 text-teal-800 ring-teal-900/15",
  execution_summary: "bg-sky-50 text-sky-800 ring-sky-900/15",
  bug_summary: "bg-rose-50 text-rose-800 ring-rose-900/15",
  evidence_summary: "bg-emerald-50 text-emerald-800 ring-emerald-900/15",
  release_review: "bg-amber-50 text-amber-900 ring-amber-900/15",
  stakeholder_update: "bg-violet-50 text-violet-800 ring-violet-900/15",
};

const statusBadgeClasses: Record<ReportStatus, string> = {
  draft: "bg-slate-100 text-slate-700 ring-slate-900/10",
  ready: "bg-emerald-50 text-emerald-800 ring-emerald-900/15",
  needs_review: "bg-amber-50 text-amber-900 ring-amber-900/15",
  archived: "bg-slate-200 text-slate-800 ring-slate-900/10",
};

const scopeBadgeClasses: Record<ReportScope, string> = {
  project: "bg-slate-100 text-slate-800 ring-slate-900/10",
  cycle: "bg-sky-50 text-sky-800 ring-sky-900/15",
  bug: "bg-rose-50 text-rose-800 ring-rose-900/15",
  evidence: "bg-emerald-50 text-emerald-800 ring-emerald-900/15",
  mixed: "bg-violet-50 text-violet-800 ring-violet-900/15",
};

type ReportFormState = {
  projectId: string;
  title: string;
  description: string;
  reportType: ReportType;
  status: ReportStatus;
  scope: ReportScope;
  linkedCycleIds: string[];
  linkedExecutionIds: string[];
  linkedBugReportIds: string[];
  linkedEvidenceIds: string[];
  summary: string;
  risks: string;
  recommendations: string;
  conclusion: string;
  createdBy: string;
};

type ReportSectionProps = {
  projects: Project[];
};

const emptyReportForm: ReportFormState = {
  projectId: "",
  title: "",
  description: "",
  reportType: "qa_status",
  status: "draft",
  scope: "project",
  linkedCycleIds: [],
  linkedExecutionIds: [],
  linkedBugReportIds: [],
  linkedEvidenceIds: [],
  summary: "",
  risks: "",
  recommendations: "",
  conclusion: "",
  createdBy: "",
};

function linesToList(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function ReportSection({ projects }: ReportSectionProps) {
  const [testCycles, setTestCycles] = useState<TestCycle[]>(demoTestCycles);
  const [testExecutions, setTestExecutions] = useState<TestExecution[]>(demoTestExecutions);
  const [bugReports, setBugReports] = useState<BugReport[]>(demoBugReports);
  const [evidence, setEvidence] = useState<Evidence[]>(demoEvidence);
  const [reports, setReports] = useState<Report[]>(demoReports);
  const [hasLoadedLocalReports, setHasLoadedLocalReports] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(() => projects[0]?.id ?? "");
  const activeProjectId = selectedProjectId || projects[0]?.id || "";
  const [formState, setFormState] = useState<ReportFormState>({
    ...emptyReportForm,
    projectId: activeProjectId,
  });
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedCycles = window.localStorage.getItem(testCycleStorageKey);
      const storedExecutions = window.localStorage.getItem(testExecutionStorageKey);
      const storedBugReports = window.localStorage.getItem(bugReportStorageKey);
      const storedEvidence = window.localStorage.getItem(evidenceStorageKey);
      const storedReports = window.localStorage.getItem(reportStorageKey);

      if (storedCycles) {
        setTestCycles(JSON.parse(storedCycles) as TestCycle[]);
      }

      if (storedExecutions) {
        setTestExecutions(JSON.parse(storedExecutions) as TestExecution[]);
      }

      if (storedBugReports) {
        setBugReports(JSON.parse(storedBugReports) as BugReport[]);
      }

      if (storedEvidence) {
        setEvidence(JSON.parse(storedEvidence) as Evidence[]);
      }

      if (storedReports) {
        setReports(JSON.parse(storedReports) as Report[]);
      }

      setHasLoadedLocalReports(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasLoadedLocalReports) {
      return;
    }

    window.localStorage.setItem(reportStorageKey, JSON.stringify(reports));
  }, [hasLoadedLocalReports, reports]);

  const projectCycles = useMemo(
    () => listTestCyclesByProject(activeProjectId, testCycles),
    [activeProjectId, testCycles],
  );
  const projectExecutions = useMemo(
    () => listExecutionsByProject(activeProjectId, testExecutions),
    [activeProjectId, testExecutions],
  );
  const projectBugReports = useMemo(
    () => listBugReportsByProject(activeProjectId, bugReports),
    [activeProjectId, bugReports],
  );
  const projectEvidence = useMemo(
    () => listEvidenceByProject(activeProjectId, evidence),
    [activeProjectId, evidence],
  );
  const projectReports = useMemo(
    () => listReportsByProject(activeProjectId, reports),
    [activeProjectId, reports],
  );
  const summary = useMemo(
    () => getReportSummary(activeProjectId, reports),
    [activeProjectId, reports],
  );
  const selectedProject = projects.find((project) => project.id === activeProjectId);

  function persistReports(nextReports: Report[]) {
    setReports(nextReports);
  }

  function resetForm(projectId = activeProjectId) {
    setFormState({
      ...emptyReportForm,
      projectId,
    });
    setEditingReportId(null);
    setValidationError(false);
  }

  function handleProjectChange(projectId: string) {
    setSelectedProjectId(projectId);
    resetForm(projectId);
  }

  function toReportInput(): ReportInput {
    return {
      projectId: activeProjectId,
      title: formState.title,
      description: formState.description,
      reportType: formState.reportType,
      status: formState.status,
      scope: formState.scope,
      linkedCycleIds: formState.linkedCycleIds,
      linkedExecutionIds: formState.linkedExecutionIds,
      linkedBugReportIds: formState.linkedBugReportIds,
      linkedEvidenceIds: formState.linkedEvidenceIds,
      summary: formState.summary,
      risks: linesToList(formState.risks),
      recommendations: linesToList(formState.recommendations),
      conclusion: formState.conclusion,
      createdBy: formState.createdBy,
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = toReportInput();
    const cycleLinksAreValid = input.linkedCycleIds?.every((id) =>
      projectCycles.some((cycle) => cycle.id === id),
    );
    const executionLinksAreValid = input.linkedExecutionIds?.every((id) =>
      projectExecutions.some((execution) => execution.id === id),
    );
    const bugLinksAreValid = input.linkedBugReportIds?.every((id) =>
      projectBugReports.some((bugReport) => bugReport.id === id),
    );
    const evidenceLinksAreValid = input.linkedEvidenceIds?.every((id) =>
      projectEvidence.some((item) => item.id === id),
    );

    if (
      validateReportInput(input).length > 0 ||
      !cycleLinksAreValid ||
      !executionLinksAreValid ||
      !bugLinksAreValid ||
      !evidenceLinksAreValid
    ) {
      setValidationError(true);
      return;
    }

    if (editingReportId) {
      persistReports(
        reports.map((report) =>
          report.id === editingReportId ? updateReport(report, input) : report,
        ),
      );
    } else {
      persistReports([createReport(input), ...reports]);
    }

    resetForm(activeProjectId);
  }

  function startEditingReport(report: Report) {
    setSelectedProjectId(report.projectId);
    setEditingReportId(report.id);
    setValidationError(false);
    setFormState({
      projectId: report.projectId,
      title: report.title,
      description: report.description,
      reportType: report.reportType,
      status: report.status,
      scope: report.scope,
      linkedCycleIds: report.linkedCycleIds,
      linkedExecutionIds: report.linkedExecutionIds,
      linkedBugReportIds: report.linkedBugReportIds,
      linkedEvidenceIds: report.linkedEvidenceIds,
      summary: report.summary,
      risks: report.risks.join("\n"),
      recommendations: report.recommendations.join("\n"),
      conclusion: report.conclusion,
      createdBy: report.createdBy,
    });
  }

  function fillSnapshotSummary() {
    const snapshot = buildReportSnapshot(
      activeProjectId,
      reports,
      projects,
      testCycles,
      testExecutions,
      bugReports,
      evidence,
    );
    const projectName = snapshot.project?.name ?? "Projeto selecionado";

    setFormState((current) => ({
      ...current,
      summary: `${projectName}: ${snapshot.totalCycles} ciclos, ${snapshot.totalExecutions} execuções, ${snapshot.totalBugs} bugs e ${snapshot.totalEvidence} evidências registradas localmente.`,
      conclusion: `Snapshot local indica ${snapshot.openBugs} bugs abertos, ${snapshot.criticalBugs} bugs críticos e ${snapshot.attachedEvidence} evidências anexadas para revisão manual.`,
    }));
  }

  function updateLinkedIds(field: keyof Pick<
    ReportFormState,
    "linkedCycleIds" | "linkedExecutionIds" | "linkedBugReportIds" | "linkedEvidenceIds"
  >, id: string) {
    setFormState((current) => ({
      ...current,
      [field]: toggleId(current[field], id),
    }));
  }

  return (
    <section
      id="reports"
      className="rounded-[1.5rem] border border-slate-900/10 bg-white/90 p-6 shadow-xl shadow-slate-900/5 md:p-8"
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.26em] text-teal-700">
            Relatórios
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Relatórios estruturados de QA
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Consolide status do projeto, execuções, bugs e evidências em artefatos locais
            determinísticos. Projeto -&gt; Execuções -&gt; Bugs -&gt; Evidências -&gt; Relatório.
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

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1.2fr]">
        <p className="rounded-2xl border border-teal-800/15 bg-teal-50 px-4 py-3 text-sm font-black text-teal-900">
          Projeto -&gt; Execuções -&gt; Bugs -&gt; Evidências -&gt; Relatório
        </p>
        <p className="rounded-2xl border border-slate-900/10 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
          Persistência local de demonstração via localStorage: {reportStorageKey}. Este bloco não
          gera PDF, download ou exportação real.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {[
          ["Total", summary.totalReports],
          ["Prontos", summary.readyReports],
          ["Rascunhos", summary.draftReports],
          ["Revisão", summary.reportsNeedingReview],
          ["Com bugs", summary.linkedBugReports],
          ["Com evidências", summary.linkedEvidenceReports],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-slate-900/10 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              {label}
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form
          className="rounded-2xl border border-slate-900/10 bg-slate-50 p-5"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-950">
                {editingReportId ? "Editar relatório" : "Novo relatório"}
              </h3>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                Este relatório é estruturado localmente; geração com IA será adicionada depois.
              </p>
            </div>
            <button
              type="button"
              className="rounded-xl border border-teal-900/15 bg-white px-3 py-2 text-xs font-black text-teal-800 transition hover:border-teal-700"
              onClick={fillSnapshotSummary}
            >
              Preencher resumo com snapshot local
            </button>
          </div>

          {validationError ? (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800">
              Revise os campos obrigatórios e os vínculos do projeto antes de salvar.
            </p>
          ) : null}

          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Título
              <input
                className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                value={formState.title}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, title: event.target.value }))
                }
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Descrição
              <textarea
                className="min-h-20 rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                value={formState.description}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, description: event.target.value }))
                }
              />
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Tipo de relatório
                <select
                  className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                  value={formState.reportType}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      reportType: event.target.value as ReportType,
                    }))
                  }
                >
                  {reportTypes.map((reportType) => (
                    <option key={reportType} value={reportType}>
                      {reportTypeLabels[reportType]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Status
                <select
                  className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                  value={formState.status}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      status: event.target.value as ReportStatus,
                    }))
                  }
                >
                  {reportStatuses.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Escopo
                <select
                  className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                  value={formState.scope}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      scope: event.target.value as ReportScope,
                    }))
                  }
                >
                  {reportScopes.map((scope) => (
                    <option key={scope} value={scope}>
                      {scopeLabels[scope]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Checklist
                title="Ciclos vinculados"
                items={projectCycles.map((cycle) => ({ id: cycle.id, label: cycle.name }))}
                selectedIds={formState.linkedCycleIds}
                onToggle={(id) => updateLinkedIds("linkedCycleIds", id)}
              />
              <Checklist
                title="Execuções vinculadas"
                items={projectExecutions.map((execution) => ({
                  id: execution.id,
                  label: `${execution.status} · ${execution.testCaseId}`,
                }))}
                selectedIds={formState.linkedExecutionIds}
                onToggle={(id) => updateLinkedIds("linkedExecutionIds", id)}
              />
              <Checklist
                title="Bugs vinculados"
                items={projectBugReports.map((bugReport) => ({
                  id: bugReport.id,
                  label: bugReport.title,
                }))}
                selectedIds={formState.linkedBugReportIds}
                onToggle={(id) => updateLinkedIds("linkedBugReportIds", id)}
              />
              <Checklist
                title="Evidências vinculadas"
                items={projectEvidence.map((item) => ({ id: item.id, label: item.title }))}
                selectedIds={formState.linkedEvidenceIds}
                onToggle={(id) => updateLinkedIds("linkedEvidenceIds", id)}
              />
            </div>

            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Sumário
              <textarea
                className="min-h-24 rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                value={formState.summary}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, summary: event.target.value }))
                }
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Riscos
                <textarea
                  className="min-h-28 rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                  value={formState.risks}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, risks: event.target.value }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Recomendações
                <textarea
                  className="min-h-28 rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                  value={formState.recommendations}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      recommendations: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Conclusão
              <textarea
                className="min-h-24 rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                value={formState.conclusion}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, conclusion: event.target.value }))
                }
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Criado por
              <input
                className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                value={formState.createdBy}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, createdBy: event.target.value }))
                }
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-teal-800"
              >
                {editingReportId ? "Atualizar relatório" : "Criar relatório"}
              </button>
              {editingReportId ? (
                <button
                  type="button"
                  className="rounded-xl border border-slate-900/10 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-slate-400"
                  onClick={() => resetForm(activeProjectId)}
                >
                  Cancelar edição
                </button>
              ) : null}
            </div>
          </div>
        </form>

        <div className="grid content-start gap-4">
          <div className="rounded-2xl border border-slate-900/10 bg-slate-950 p-5 text-white">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-200">
              Resumo de relatórios
            </p>
            <h3 className="mt-2 text-2xl font-black">{selectedProject?.name ?? "Projeto"}</h3>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
              Tipos: {summary.qaStatusReports} status QA, {summary.executionSummaryReports}{" "}
              execução, {summary.bugSummaryReports} bugs, {summary.evidenceSummaryReports}{" "}
              evidências, {summary.releaseReviewReports} revisão de release,{" "}
              {summary.stakeholderUpdateReports} stakeholders.
            </p>
          </div>

          {projectReports.length === 0 ? (
            <article className="rounded-2xl border border-dashed border-slate-300 bg-white p-5">
              <h3 className="text-lg font-black text-slate-950">Nenhum relatório local</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Crie o primeiro relatório estruturado para este projeto.
              </p>
            </article>
          ) : (
            projectReports.map((report) => (
              <article
                key={report.id}
                className="rounded-2xl border border-slate-900/10 bg-white p-5 shadow-sm shadow-slate-200/60"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-950">{report.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{report.description}</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-xl border border-slate-900/10 px-3 py-2 text-xs font-black text-slate-700 transition hover:border-teal-700 hover:text-teal-800"
                    onClick={() => startEditingReport(report)}
                  >
                    Editar relatório
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge className={typeBadgeClasses[report.reportType]}>
                    {reportTypeLabels[report.reportType]}
                  </Badge>
                  <Badge className={statusBadgeClasses[report.status]}>
                    {statusLabels[report.status]}
                  </Badge>
                  <Badge className={scopeBadgeClasses[report.scope]}>
                    Escopo: {scopeLabels[report.scope]}
                  </Badge>
                </div>

                <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-700">
                  <TextBlock label="Sumário" value={report.summary} />
                  <ListBlock label="Riscos" values={report.risks} emptyLabel="Sem riscos listados" />
                  <ListBlock
                    label="Recomendações"
                    values={report.recommendations}
                    emptyLabel="Sem recomendações listadas"
                  />
                  <TextBlock label="Conclusão" value={report.conclusion} />
                </div>

                <div className="mt-4 grid gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500 sm:grid-cols-2 xl:grid-cols-4">
                  <p>Ciclos vinculados: {report.linkedCycleIds.length}</p>
                  <p>Execuções vinculadas: {report.linkedExecutionIds.length}</p>
                  <p>Bugs vinculados: {report.linkedBugReportIds.length}</p>
                  <p>Evidências vinculadas: {report.linkedEvidenceIds.length}</p>
                </div>
                <p className="mt-3 text-xs font-bold text-slate-500">
                  Criado por: {report.createdBy || "Não informado"}
                </p>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function Badge({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${className}`}>
      {children}
    </span>
  );
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-700">{value}</p>
    </div>
  );
}

function ListBlock({
  label,
  values,
  emptyLabel,
}: {
  label: string;
  values: string[];
  emptyLabel: string;
}) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      {values.length === 0 ? (
        <p className="mt-1 font-medium text-slate-500">{emptyLabel}</p>
      ) : (
        <ul className="mt-1 grid gap-1">
          {values.map((value) => (
            <li key={value} className="rounded-xl bg-slate-50 px-3 py-2 font-medium text-slate-700">
              {value}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Checklist({
  title,
  items,
  selectedIds,
  onToggle,
}: {
  title: string;
  items: Array<{ id: string; label: string }>;
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <fieldset className="rounded-2xl border border-slate-900/10 bg-white p-4">
      <legend className="px-1 text-sm font-black text-slate-800">{title}</legend>
      <div className="mt-3 grid max-h-44 gap-2 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="text-sm font-semibold text-slate-500">Nenhum item disponível.</p>
        ) : (
          items.map((item) => (
            <label
              key={item.id}
              className="flex items-start gap-2 rounded-xl border border-slate-900/10 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
            >
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-teal-700"
                checked={selectedIds.includes(item.id)}
                onChange={() => onToggle(item.id)}
              />
              <span>{item.label}</span>
            </label>
          ))
        )}
      </div>
    </fieldset>
  );
}
