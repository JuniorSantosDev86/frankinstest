"use client";

import { FormEvent, useMemo, useState } from "react";

import type { BusinessRule, ProductModule, Requirement } from "@/lib/business-understanding/types";
import type { Project } from "@/lib/projects/types";
import {
  createTestExecution,
  demoTestCases,
  demoTestCycles,
  demoTestExecutions,
  demoTestScenarios,
  demoTestSuites,
  getTestCycleExecutionSummary,
  getTestExecutionSummary,
  listExecutionsByCycle,
  listTestCyclesByProject,
  updateTestExecution,
  validateTestExecutionInput,
} from "@/lib/test-design/testDesignService";
import {
  testExecutionStatuses,
  type TestCase,
  type TestCycle,
  type TestExecution,
  type TestExecutionInput,
  type TestExecutionStatus,
  type TestScenario,
  type TestSuite,
} from "@/lib/test-design/types";

export const testExecutionStorageKey = "frankintest.block05.testExecutions";
const testCycleStorageKey = "frankintest.block05.testCycles";
const testSuiteStorageKey = "frankintest.block05.testSuites";
const testCaseStorageKey = "frankintest.block04.testCases";
const scenarioStorageKey = "frankintest.block04.scenarios";

const statusLabels: Record<TestExecutionStatus, string> = {
  not_run: "Não executado",
  passed: "Aprovado",
  failed: "Falhou",
  blocked: "Bloqueado",
  skipped: "Pulado",
};

const statusBadgeClasses: Record<TestExecutionStatus, string> = {
  not_run: "bg-slate-100 text-slate-700 ring-slate-900/10",
  passed: "bg-emerald-50 text-emerald-800 ring-emerald-900/15",
  failed: "bg-rose-50 text-rose-800 ring-rose-900/15",
  blocked: "bg-amber-50 text-amber-900 ring-amber-900/15",
  skipped: "bg-sky-50 text-sky-800 ring-sky-900/15",
};

type ExecutionFormState = {
  status: TestExecutionStatus;
  notes: string;
  executedBy: string;
  executedAt: string;
};

type TestExecutionSectionProps = {
  projects: Project[];
  modules: ProductModule[];
  requirements: Requirement[];
  businessRules: BusinessRule[];
};

export function TestExecutionSection({
  projects,
  modules,
  requirements,
  businessRules,
}: TestExecutionSectionProps) {
  const [scenarios] = useState<TestScenario[]>(() => {
    if (typeof window === "undefined") {
      return demoTestScenarios;
    }

    const storedScenarios = window.localStorage.getItem(scenarioStorageKey);

    return storedScenarios ? (JSON.parse(storedScenarios) as TestScenario[]) : demoTestScenarios;
  });
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
  const [testExecutions, setTestExecutions] = useState<TestExecution[]>(() => {
    if (typeof window === "undefined") {
      return demoTestExecutions;
    }

    const storedTestExecutions = window.localStorage.getItem(testExecutionStorageKey);

    return storedTestExecutions
      ? (JSON.parse(storedTestExecutions) as TestExecution[])
      : demoTestExecutions;
  });
  const [selectedProjectId, setSelectedProjectId] = useState(() => projects[0]?.id ?? "");
  const activeProjectId = selectedProjectId || projects[0]?.id || "";
  const projectCycles = useMemo(
    () => listTestCyclesByProject(activeProjectId, testCycles),
    [activeProjectId, testCycles],
  );
  const [selectedCycleId, setSelectedCycleId] = useState(() => projectCycles[0]?.id ?? "");
  const activeCycleId =
    projectCycles.some((testCycle) => testCycle.id === selectedCycleId)
      ? selectedCycleId
      : projectCycles[0]?.id ?? "";
  const selectedProject = projects.find((project) => project.id === activeProjectId);
  const selectedCycle = projectCycles.find((testCycle) => testCycle.id === activeCycleId);
  const cycleExecutions = useMemo(
    () => listExecutionsByCycle(activeCycleId, testExecutions),
    [activeCycleId, testExecutions],
  );
  const projectSummary = useMemo(
    () => getTestExecutionSummary(activeProjectId, testExecutions),
    [activeProjectId, testExecutions],
  );
  const cycleSummary = useMemo(
    () => getTestCycleExecutionSummary(activeCycleId, testExecutions),
    [activeCycleId, testExecutions],
  );
  const [formsByExecutionId, setFormsByExecutionId] = useState<
    Record<string, ExecutionFormState>
  >({});
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});
  const missingExecutionInputs = useMemo(
    () => getMissingExecutionInputs(selectedCycle, testSuites, testCases, testExecutions),
    [selectedCycle, testCases, testExecutions, testSuites],
  );

  function persistTestExecutions(nextExecutions: TestExecution[]) {
    setTestExecutions(nextExecutions);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(testExecutionStorageKey, JSON.stringify(nextExecutions));
    }
  }

  function handleProjectChange(projectId: string) {
    const nextProjectCycles = listTestCyclesByProject(projectId, testCycles);

    setSelectedProjectId(projectId);
    setSelectedCycleId(nextProjectCycles[0]?.id ?? "");
    setValidationErrors({});
  }

  function updateForm(testExecution: TestExecution, updates: Partial<ExecutionFormState>) {
    setFormsByExecutionId((current) => ({
      ...current,
      [testExecution.id]: {
        ...getInitialFormState(testExecution),
        ...current[testExecution.id],
        ...updates,
      },
    }));
  }

  function getFormState(testExecution: TestExecution): ExecutionFormState {
    return formsByExecutionId[testExecution.id] ?? getInitialFormState(testExecution);
  }

  function handleExecutionSubmit(
    event: FormEvent<HTMLFormElement>,
    testExecution: TestExecution,
  ) {
    event.preventDefault();
    const formState = getFormState(testExecution);
    const input: TestExecutionInput = {
      projectId: testExecution.projectId,
      cycleId: testExecution.cycleId,
      testSuiteId: testExecution.testSuiteId,
      testCaseId: testExecution.testCaseId,
      ...formState,
    };

    if (validateTestExecutionInput(input).length > 0) {
      setValidationErrors((current) => ({ ...current, [testExecution.id]: true }));
      return;
    }

    persistTestExecutions(
      testExecutions.map((currentExecution) =>
        currentExecution.id === testExecution.id
          ? updateTestExecution(currentExecution, input)
          : currentExecution,
      ),
    );
    setValidationErrors((current) => ({ ...current, [testExecution.id]: false }));
  }

  function prepareCycleExecutions() {
    if (!selectedCycle || missingExecutionInputs.length === 0) {
      return;
    }

    const createdExecutions = missingExecutionInputs.map((input, index) =>
      createTestExecution(input, new Date(Date.now() + index)),
    );

    persistTestExecutions([...createdExecutions, ...testExecutions]);
  }

  return (
    <section
      id="test-executions"
      className="rounded-[1.5rem] border border-slate-900/10 bg-white/90 p-6 shadow-xl shadow-slate-900/5 md:p-8"
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.26em] text-teal-700">
            Execução determinística
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Execução de testes
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Registre o status de cada caso de teste dentro de um ciclo, mantendo o fluxo local
            Projeto -&gt; Ciclo de teste -&gt; Suíte de teste -&gt; Caso de teste -&gt; Execução.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
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

          <label className="grid min-w-64 gap-2 text-sm font-bold text-slate-700">
            Ciclo em execução
            <select
              className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
              value={activeCycleId}
              onChange={(event) => setSelectedCycleId(event.target.value)}
            >
              {projectCycles.length === 0 ? (
                <option value="">Nenhum ciclo disponível</option>
              ) : (
                projectCycles.map((testCycle) => (
                  <option key={testCycle.id} value={testCycle.id}>
                    {testCycle.name}
                  </option>
                ))
              )}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1.2fr]">
        <p className="rounded-2xl border border-teal-800/15 bg-teal-50 px-4 py-3 text-sm font-black text-teal-900">
          Projeto -&gt; Ciclo de teste -&gt; Suíte de teste -&gt; Caso de teste -&gt; Execução
        </p>
        <p className="rounded-2xl border border-slate-900/10 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
          Projeto -&gt; Módulo -&gt; Requisito -&gt; Regra de negócio -&gt; Cenário de teste -&gt; Caso de teste -&gt; Suíte de teste -&gt; Ciclo de teste -&gt; Execução
        </p>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <p className="rounded-2xl border border-slate-900/10 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700 lg:col-span-2">
          Persistência local de demonstração via localStorage: {testExecutionStorageKey}.
        </p>
        <button
          type="button"
          className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={!selectedCycle || missingExecutionInputs.length === 0}
          onClick={prepareCycleExecutions}
        >
          Preparar execuções do ciclo
        </button>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <p className="rounded-2xl border border-amber-900/15 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-950">
          Falhas ainda não geram bugs automaticamente; isso será adicionado no bloco de bugs.
        </p>
        <p className="rounded-2xl border border-sky-900/15 bg-sky-50 px-4 py-3 text-sm font-semibold leading-6 text-sky-950">
          Evidências ainda não são anexadas neste bloco.
        </p>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <SummaryPanel
          title="Resumo de execução do projeto"
          subtitle={selectedProject?.name ?? "Nenhum projeto selecionado"}
          total={projectSummary.totalExecutions}
          notRun={projectSummary.notRunExecutions}
          passed={projectSummary.passedExecutions}
          failed={projectSummary.failedExecutions}
          blocked={projectSummary.blockedExecutions}
          skipped={projectSummary.skippedExecutions}
          completionRate={projectSummary.completionRate}
          passRate={projectSummary.passRate}
        />
        <SummaryPanel
          title="Resumo de execução do ciclo"
          subtitle={selectedCycle?.name ?? "Nenhum ciclo selecionado"}
          total={cycleSummary.totalExecutions}
          notRun={cycleSummary.notRunExecutions}
          passed={cycleSummary.passedExecutions}
          failed={cycleSummary.failedExecutions}
          blocked={cycleSummary.blockedExecutions}
          skipped={cycleSummary.skippedExecutions}
          completionRate={cycleSummary.completionRate}
          passRate={cycleSummary.passRate}
        />
      </div>

      <section className="mt-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-950">Casos do ciclo</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {missingExecutionInputs.length} combinação(ões) de suíte e caso ainda sem execução
              local neste ciclo.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4">
          {cycleExecutions.length === 0 ? (
            <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
              <h4 className="text-lg font-black text-slate-950">
                Nenhuma execução registrada neste ciclo
              </h4>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use “Preparar execuções do ciclo” para criar registros locais não executados para
                as combinações de suíte e caso vinculadas ao ciclo selecionado.
              </p>
            </section>
          ) : (
            cycleExecutions.map((testExecution) => {
              const formState = getFormState(testExecution);
              const linkedSuite = testSuites.find(
                (testSuite) => testSuite.id === testExecution.testSuiteId,
              );
              const linkedCase = testCases.find(
                (testCase) => testCase.id === testExecution.testCaseId,
              );
              const linkedScenario = scenarios.find(
                (scenario) => scenario.id === linkedCase?.scenarioId,
              );
              const linkedModule = modules.find((module) => module.id === linkedCase?.moduleId);
              const linkedRequirement = requirements.find(
                (requirement) => requirement.id === linkedCase?.requirementId,
              );
              const linkedRule = businessRules.find(
                (rule) => rule.id === linkedCase?.businessRuleId,
              );

              return (
                <article
                  key={testExecution.id}
                  className="rounded-2xl border border-slate-900/10 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h4 className="text-lg font-black tracking-tight text-slate-950">
                        {linkedCase?.title ?? testExecution.testCaseId}
                      </h4>
                      <p className="mt-2 text-sm font-semibold text-slate-600">
                        Suíte de teste: {linkedSuite?.name ?? testExecution.testSuiteId}
                      </p>
                    </div>
                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-black ring-1 ${
                        statusBadgeClasses[testExecution.status]
                      }`}
                    >
                      {statusLabels[testExecution.status]}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                    <Meta label="Status da execução" value={statusLabels[testExecution.status]} />
                    <Meta label="Executado por" value={testExecution.executedBy || "Não definido"} />
                    <Meta label="Executado em" value={formatOptionalDate(testExecution.executedAt)} />
                  </div>

                  <p className="mt-4 rounded-2xl border border-slate-900/10 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                    <span className="font-black text-slate-950">Notas da execução: </span>
                    {testExecution.notes || "Sem notas registradas."}
                  </p>

                  <div className="mt-4 rounded-2xl border border-teal-800/15 bg-teal-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-teal-800">
                      Contexto de rastreabilidade
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-teal-950">
                      Projeto: {selectedProject?.name ?? testExecution.projectId} | Módulo:{" "}
                      {linkedModule?.name ?? "N/A"} | Requisito:{" "}
                      {linkedRequirement?.title ?? "N/A"} | Regra de negócio:{" "}
                      {linkedRule?.title ?? "N/A"} | Cenário de teste:{" "}
                      {linkedScenario?.title ?? "N/A"} | Caso de teste:{" "}
                      {linkedCase?.title ?? "N/A"} | Suíte de teste:{" "}
                      {linkedSuite?.name ?? "N/A"} | Ciclo de teste:{" "}
                      {selectedCycle?.name ?? testExecution.cycleId} | Execução:{" "}
                      {statusLabels[testExecution.status]}
                    </p>
                  </div>

                  <form
                    className="mt-5 grid gap-3 rounded-2xl border border-slate-900/10 bg-slate-50 p-4"
                    onSubmit={(event) => handleExecutionSubmit(event, testExecution)}
                  >
                    <div className="grid gap-3 md:grid-cols-3">
                      <ExecutionSelect
                        label="Status da execução"
                        value={formState.status}
                        onChange={(value) =>
                          updateForm(testExecution, { status: value as TestExecutionStatus })
                        }
                      />
                      <label className="grid gap-2 text-sm font-bold text-slate-700">
                        Executado por
                        <input
                          className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                          placeholder="Nome ou ID"
                          value={formState.executedBy}
                          onChange={(event) =>
                            updateForm(testExecution, { executedBy: event.target.value })
                          }
                        />
                      </label>
                      <label className="grid gap-2 text-sm font-bold text-slate-700">
                        Executado em
                        <input
                          type="date"
                          className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                          value={formState.executedAt}
                          onChange={(event) =>
                            updateForm(testExecution, { executedAt: event.target.value })
                          }
                        />
                      </label>
                    </div>

                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Notas da execução
                      <textarea
                        className="min-h-24 rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                        placeholder="Resumo objetivo da execução local."
                        value={formState.notes}
                        onChange={(event) =>
                          updateForm(testExecution, { notes: event.target.value })
                        }
                      />
                    </label>

                    {validationErrors[testExecution.id] ? (
                      <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
                        Para status executados, informe Executado por e Executado em. Para Falhou
                        ou Bloqueado, registre uma nota com pelo menos 2 caracteres.
                      </p>
                    ) : null}

                    <button
                      type="submit"
                      className="w-fit rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-teal-800"
                    >
                      Atualizar execução
                    </button>
                  </form>
                </article>
              );
            })
          )}
        </div>
      </section>
    </section>
  );
}

function getMissingExecutionInputs(
  selectedCycle: TestCycle | undefined,
  testSuites: TestSuite[],
  testCases: TestCase[],
  testExecutions: TestExecution[],
): TestExecutionInput[] {
  if (!selectedCycle) {
    return [];
  }

  const inputs: TestExecutionInput[] = [];

  selectedCycle.testSuiteIds.forEach((testSuiteId) => {
    const linkedSuite = testSuites.find((testSuite) => testSuite.id === testSuiteId);

    linkedSuite?.testCaseIds.forEach((testCaseId) => {
      const linkedCase = testCases.find((testCase) => testCase.id === testCaseId);
      const alreadyExists = testExecutions.some(
        (testExecution) =>
          testExecution.cycleId === selectedCycle.id &&
          testExecution.testSuiteId === testSuiteId &&
          testExecution.testCaseId === testCaseId,
      );

      if (linkedCase && !alreadyExists) {
        inputs.push({
          projectId: selectedCycle.projectId,
          cycleId: selectedCycle.id,
          testSuiteId,
          testCaseId,
          status: "not_run",
          notes: "Execução ainda não iniciada.",
          executedBy: "",
          executedAt: "",
        });
      }
    });
  });

  return inputs;
}

function getInitialFormState(testExecution: TestExecution): ExecutionFormState {
  return {
    status: testExecution.status,
    notes: testExecution.notes,
    executedBy: testExecution.executedBy,
    executedAt: testExecution.executedAt,
  };
}

function SummaryPanel({
  title,
  subtitle,
  total,
  notRun,
  passed,
  failed,
  blocked,
  skipped,
  completionRate,
  passRate,
}: {
  title: string;
  subtitle: string;
  total: number;
  notRun: number;
  passed: number;
  failed: number;
  blocked: number;
  skipped: number;
  completionRate: number;
  passRate: number;
}) {
  return (
    <section className="rounded-2xl border border-slate-900/10 bg-slate-50 p-5">
      <div>
        <h3 className="text-xl font-black tracking-tight text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{subtitle}</p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric label="Total" value={total} />
        <SummaryMetric label="Não executado" value={notRun} />
        <SummaryMetric label="Aprovado" value={passed} />
        <SummaryMetric label="Falhou" value={failed} />
        <SummaryMetric label="Bloqueado" value={blocked} />
        <SummaryMetric label="Pulado" value={skipped} />
        <SummaryMetric label="Conclusão" value={`${completionRate}%`} />
        <SummaryMetric label="Taxa de aprovação" value={`${passRate}%`} />
      </div>
    </section>
  );
}

function SummaryMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <article className="rounded-2xl border border-slate-900/10 bg-white p-4">
      <p className="text-2xl font-black tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
    </article>
  );
}

function ExecutionSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: TestExecutionStatus;
  onChange: (value: TestExecutionStatus) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      <select
        className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
        value={value}
        onChange={(event) => onChange(event.target.value as TestExecutionStatus)}
      >
        {testExecutionStatuses.map((status) => (
          <option key={status} value={status}>
            {statusLabels[status]}
          </option>
        ))}
      </select>
    </label>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <p className="rounded-xl bg-slate-50 px-3 py-2 text-slate-600 ring-1 ring-slate-900/10">
      <span className="font-black text-slate-950">{label}: </span>
      {value}
    </p>
  );
}

function formatOptionalDate(value: string) {
  if (!value) {
    return "Não definido";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
