"use client";

import { FormEvent, useMemo, useState } from "react";

import type { ProductModule } from "@/lib/business-understanding/types";
import {
  bugPriorities,
  bugSeverities,
  bugStatuses,
  type BugPriority,
  type BugReport,
  type BugReportInput,
  type BugSeverity,
  type BugStatus,
} from "@/lib/bugs/types";
import {
  createBugReport,
  demoBugReports,
  getBugReportSummary,
  listBugReportsByProject,
  updateBugReport,
  validateBugReportInput,
} from "@/lib/bugs/bugService";
import type { Project } from "@/lib/projects/types";
import {
  demoTestCases,
  demoTestCycles,
  demoTestExecutions,
  demoTestSuites,
  listExecutionsByProject,
} from "@/lib/test-design/testDesignService";
import type { TestCase, TestCycle, TestExecution, TestSuite } from "@/lib/test-design/types";

export const bugReportStorageKey = "frankintest.block06.bugReports";
const testExecutionStorageKey = "frankintest.block05.testExecutions";
const testCycleStorageKey = "frankintest.block05.testCycles";
const testSuiteStorageKey = "frankintest.block05.testSuites";
const testCaseStorageKey = "frankintest.block04.testCases";

const severityLabels: Record<BugSeverity, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

const priorityLabels: Record<BugPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

const statusLabels: Record<BugStatus, string> = {
  draft: "Rascunho",
  open: "Aberto",
  in_progress: "Em andamento",
  retest: "Reteste",
  resolved: "Resolvido",
  closed: "Fechado",
  rejected: "Rejeitado",
};

const severityBadgeClasses: Record<BugSeverity, string> = {
  low: "bg-slate-100 text-slate-700 ring-slate-900/10",
  medium: "bg-sky-50 text-sky-800 ring-sky-900/15",
  high: "bg-amber-50 text-amber-900 ring-amber-900/15",
  critical: "bg-rose-50 text-rose-800 ring-rose-900/15",
};

const statusBadgeClasses: Record<BugStatus, string> = {
  draft: "bg-slate-100 text-slate-700 ring-slate-900/10",
  open: "bg-rose-50 text-rose-800 ring-rose-900/15",
  in_progress: "bg-amber-50 text-amber-900 ring-amber-900/15",
  retest: "bg-violet-50 text-violet-800 ring-violet-900/15",
  resolved: "bg-emerald-50 text-emerald-800 ring-emerald-900/15",
  closed: "bg-teal-50 text-teal-800 ring-teal-900/15",
  rejected: "bg-slate-200 text-slate-800 ring-slate-900/10",
};

type BugReportFormState = {
  projectId: string;
  moduleId: string;
  executionId: string;
  title: string;
  description: string;
  stepsToReproduce: string;
  actualResult: string;
  expectedResult: string;
  severity: BugSeverity;
  priority: BugPriority;
  status: BugStatus;
  environment: string;
  createdBy: string;
};

type BugReportSectionProps = {
  projects: Project[];
  modules: ProductModule[];
};

const emptyBugForm: BugReportFormState = {
  projectId: "",
  moduleId: "",
  executionId: "",
  title: "",
  description: "",
  stepsToReproduce: "",
  actualResult: "",
  expectedResult: "",
  severity: "medium",
  priority: "medium",
  status: "draft",
  environment: "",
  createdBy: "",
};

export function BugReportSection({ projects, modules }: BugReportSectionProps) {
  const [testCases] = useState<TestCase[]>(() => {
    if (typeof window === "undefined") {
      return demoTestCases;
    }

    const storedTestCases = window.localStorage.getItem(testCaseStorageKey);

    return storedTestCases ? (JSON.parse(storedTestCases) as TestCase[]) : demoTestCases;
  });
  const [testSuites] = useState<TestSuite[]>(() => {
    if (typeof window === "undefined") {
      return demoTestSuites;
    }

    const storedTestSuites = window.localStorage.getItem(testSuiteStorageKey);

    return storedTestSuites ? (JSON.parse(storedTestSuites) as TestSuite[]) : demoTestSuites;
  });
  const [testCycles] = useState<TestCycle[]>(() => {
    if (typeof window === "undefined") {
      return demoTestCycles;
    }

    const storedTestCycles = window.localStorage.getItem(testCycleStorageKey);

    return storedTestCycles ? (JSON.parse(storedTestCycles) as TestCycle[]) : demoTestCycles;
  });
  const [testExecutions] = useState<TestExecution[]>(() => {
    if (typeof window === "undefined") {
      return demoTestExecutions;
    }

    const storedTestExecutions = window.localStorage.getItem(testExecutionStorageKey);

    return storedTestExecutions
      ? (JSON.parse(storedTestExecutions) as TestExecution[])
      : demoTestExecutions;
  });
  const [bugReports, setBugReports] = useState<BugReport[]>(() => {
    if (typeof window === "undefined") {
      return demoBugReports;
    }

    const storedBugReports = window.localStorage.getItem(bugReportStorageKey);

    return storedBugReports ? (JSON.parse(storedBugReports) as BugReport[]) : demoBugReports;
  });
  const [selectedProjectId, setSelectedProjectId] = useState(() => projects[0]?.id ?? "");
  const activeProjectId = selectedProjectId || projects[0]?.id || "";
  const projectModules = useMemo(
    () => modules.filter((module) => module.projectId === activeProjectId),
    [activeProjectId, modules],
  );
  const projectExecutions = useMemo(
    () => listExecutionsByProject(activeProjectId, testExecutions),
    [activeProjectId, testExecutions],
  );
  const [formState, setFormState] = useState<BugReportFormState>({
    ...emptyBugForm,
    projectId: activeProjectId,
    moduleId: projectModules[0]?.id ?? "",
  });
  const [editingBugId, setEditingBugId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState(false);
  const selectedProject = projects.find((project) => project.id === activeProjectId);
  const projectBugs = useMemo(
    () => listBugReportsByProject(activeProjectId, bugReports),
    [activeProjectId, bugReports],
  );
  const summary = useMemo(
    () => getBugReportSummary(activeProjectId, bugReports),
    [activeProjectId, bugReports],
  );
  const linkedExecution = projectExecutions.find(
    (execution) => execution.id === formState.executionId,
  );

  function persistBugReports(nextBugReports: BugReport[]) {
    setBugReports(nextBugReports);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(bugReportStorageKey, JSON.stringify(nextBugReports));
    }
  }

  function resetForm(projectId = activeProjectId) {
    const firstModule = modules.find((module) => module.projectId === projectId);

    setFormState({
      ...emptyBugForm,
      projectId,
      moduleId: firstModule?.id ?? "",
    });
    setEditingBugId(null);
    setValidationError(false);
  }

  function handleProjectChange(projectId: string) {
    setSelectedProjectId(projectId);
    resetForm(projectId);
  }

  function toBugReportInput(): BugReportInput {
    return {
      projectId: activeProjectId,
      moduleId: formState.moduleId,
      executionId: formState.executionId,
      title: formState.title,
      description: formState.description,
      stepsToReproduce: formState.stepsToReproduce
        .split("\n")
        .map((step) => step.trim())
        .filter(Boolean),
      actualResult: formState.actualResult,
      expectedResult: formState.expectedResult,
      severity: formState.severity,
      priority: formState.priority,
      status: formState.status,
      environment: formState.environment,
      createdBy: formState.createdBy,
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = toBugReportInput();
    const linkedModule = projectModules.find((module) => module.id === input.moduleId);

    if (validateBugReportInput(input).length > 0 || !linkedModule) {
      setValidationError(true);
      return;
    }

    if (editingBugId) {
      persistBugReports(
        bugReports.map((bugReport) =>
          bugReport.id === editingBugId ? updateBugReport(bugReport, input) : bugReport,
        ),
      );
    } else {
      persistBugReports([createBugReport(input), ...bugReports]);
    }

    resetForm(activeProjectId);
  }

  function startEditingBug(bugReport: BugReport) {
    setSelectedProjectId(bugReport.projectId);
    setEditingBugId(bugReport.id);
    setValidationError(false);
    setFormState({
      projectId: bugReport.projectId,
      moduleId: bugReport.moduleId,
      executionId: bugReport.executionId,
      title: bugReport.title,
      description: bugReport.description,
      stepsToReproduce: bugReport.stepsToReproduce.join("\n"),
      actualResult: bugReport.actualResult,
      expectedResult: bugReport.expectedResult,
      severity: bugReport.severity,
      priority: bugReport.priority,
      status: bugReport.status,
      environment: bugReport.environment,
      createdBy: bugReport.createdBy,
    });
  }

  function getModuleName(moduleId: string) {
    return modules.find((module) => module.id === moduleId)?.name ?? "Módulo não encontrado";
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
      id="bugs"
      className="rounded-[1.5rem] border border-slate-900/10 bg-white/90 p-6 shadow-xl shadow-slate-900/5 md:p-8"
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.26em] text-teal-700">
            Camada de defeitos
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Bugs e defeitos
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Documente defeitos locais vinculando Projeto -&gt; Módulo -&gt; Bug e,
            quando aplicável, Projeto -&gt; Módulo -&gt; Execução -&gt; Bug.
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
          Projeto -&gt; Módulo -&gt; Bug
        </p>
        <p className="rounded-2xl border border-slate-900/10 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
          Projeto -&gt; Módulo -&gt; Execução -&gt; Bug
        </p>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <p className="rounded-2xl border border-slate-900/10 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700 lg:col-span-2">
          Persistência local de demonstração via localStorage: {bugReportStorageKey}.
        </p>
        <p className="rounded-2xl border border-amber-900/15 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-950">
          Evidências ainda não são anexadas neste bloco.
        </p>
      </div>
      <p className="mt-3 rounded-2xl border border-sky-900/15 bg-sky-50 px-4 py-3 text-sm font-semibold leading-6 text-sky-950">
        Bugs ainda não geram relatórios automaticamente.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total" value={summary.totalBugs} />
        <SummaryCard label="Abertos" value={summary.openBugs} />
        <SummaryCard label="Críticos" value={summary.criticalBugs} />
        <SummaryCard label="Com execução" value={summary.linkedToExecutionBugs} />
        <SummaryCard label="Rascunhos" value={summary.draftBugs} />
        <SummaryCard label="Em andamento" value={summary.inProgressBugs} />
        <SummaryCard label="Reteste" value={summary.retestBugs} />
        <SummaryCard label="Resolvidos" value={summary.resolvedBugs} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form
          className="rounded-2xl border border-slate-900/10 bg-slate-50 p-5"
          onSubmit={handleSubmit}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-700">
                {editingBugId ? "Editar bug" : "Novo bug"}
              </p>
              <h3 className="mt-2 text-xl font-black text-slate-950">
                {selectedProject?.name ?? "Projeto local"}
              </h3>
            </div>
            {editingBugId ? (
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
              Módulo afetado
              <select
                className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                value={formState.moduleId}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, moduleId: event.target.value }))
                }
              >
                {projectModules.length === 0 ? (
                  <option value="">Nenhum módulo disponível</option>
                ) : (
                  projectModules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.name}
                    </option>
                  ))
                )}
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

            {linkedExecution?.status === "failed" ? (
              <p className="rounded-xl border border-rose-900/15 bg-rose-50 px-3 py-2 text-xs font-black text-rose-800">
                Falha vinculada: esta execução é uma boa candidata para documentação de bug.
              </p>
            ) : null}
            {linkedExecution?.status === "blocked" ? (
              <p className="rounded-xl border border-amber-900/15 bg-amber-50 px-3 py-2 text-xs font-black text-amber-900">
                Bloqueio vinculado: registre o impedimento sem alterar a execução automaticamente.
              </p>
            ) : null}

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
            <TextArea
              label="Passos para reproduzir"
              value={formState.stepsToReproduce}
              onChange={(value) =>
                setFormState((current) => ({ ...current, stepsToReproduce: value }))
              }
              placeholder="Um passo por linha"
            />
            <TextArea
              label="Resultado atual"
              value={formState.actualResult}
              onChange={(value) =>
                setFormState((current) => ({ ...current, actualResult: value }))
              }
            />
            <TextArea
              label="Resultado esperado"
              value={formState.expectedResult}
              onChange={(value) =>
                setFormState((current) => ({ ...current, expectedResult: value }))
              }
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <SelectInput
                label="Severidade"
                value={formState.severity}
                options={bugSeverities}
                labels={severityLabels}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, severity: value as BugSeverity }))
                }
              />
              <SelectInput
                label="Prioridade"
                value={formState.priority}
                options={bugPriorities}
                labels={priorityLabels}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, priority: value as BugPriority }))
                }
              />
              <SelectInput
                label="Status"
                value={formState.status}
                options={bugStatuses}
                labels={statusLabels}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, status: value as BugStatus }))
                }
              />
            </div>

            <TextInput
              label="Ambiente"
              value={formState.environment}
              onChange={(value) => setFormState((current) => ({ ...current, environment: value }))}
            />
            <TextInput
              label="Criado por"
              value={formState.createdBy}
              onChange={(value) => setFormState((current) => ({ ...current, createdBy: value }))}
            />

            {validationError ? (
              <p className="rounded-xl border border-rose-900/15 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800">
                Revise os campos obrigatórios antes de salvar o bug.
              </p>
            ) : null}

            <button
              type="submit"
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={projectModules.length === 0}
            >
              {editingBugId ? "Salvar edição" : "Criar bug"}
            </button>
          </div>
        </form>

        <section className="grid gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-700">
              Resumo de bugs
            </p>
            <h3 className="mt-2 text-2xl font-black text-slate-950">
              {projectBugs.length} bugs vinculados ao projeto
            </h3>
          </div>

          {projectBugs.length === 0 ? (
            <div className="rounded-2xl border border-slate-900/10 bg-white p-5 text-sm font-semibold text-slate-600">
              Nenhum bug local cadastrado para este projeto.
            </div>
          ) : (
            projectBugs.map((bugReport) => (
              <article
                key={bugReport.id}
                className="rounded-2xl border border-slate-900/10 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="text-lg font-black text-slate-950">{bugReport.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {bugReport.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-xl border border-slate-900/10 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 transition hover:border-teal-700/40 hover:text-teal-800"
                    onClick={() => startEditingBug(bugReport)}
                  >
                    Editar bug
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge
                    label={`Severidade: ${severityLabels[bugReport.severity]}`}
                    className={severityBadgeClasses[bugReport.severity]}
                  />
                  <Badge
                    label={`Prioridade: ${priorityLabels[bugReport.priority]}`}
                    className={severityBadgeClasses[bugReport.priority]}
                  />
                  <Badge
                    label={`Status: ${statusLabels[bugReport.status]}`}
                    className={statusBadgeClasses[bugReport.status]}
                  />
                </div>

                <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  <InfoItem label="Módulo afetado" value={getModuleName(bugReport.moduleId)} />
                  <InfoItem
                    label="Execução vinculada"
                    value={bugReport.executionId ? getExecutionLabel(bugReport.executionId) : "Sem execução vinculada"}
                  />
                  <InfoItem label="Ambiente" value={bugReport.environment} />
                  <InfoItem label="Criado por" value={bugReport.createdBy || "Não informado"} />
                  <InfoItem label="Resultado atual" value={bugReport.actualResult} />
                  <InfoItem label="Resultado esperado" value={bugReport.expectedResult} />
                </dl>

                <div className="mt-4 rounded-xl border border-slate-900/10 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Passos para reproduzir
                  </p>
                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
                    {bugReport.stepsToReproduce.map((step) => (
                      <li key={`${bugReport.id}-${step}`}>{step}</li>
                    ))}
                  </ol>
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
