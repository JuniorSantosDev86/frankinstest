"use client";

import { FormEvent, useMemo, useState } from "react";

import type { BusinessRule, ProductModule, Requirement } from "@/lib/business-understanding/types";
import type { Project } from "@/lib/projects/types";
import {
  createTestCycle,
  demoTestCases,
  demoTestCycles,
  demoTestScenarios,
  demoTestSuites,
  getTestCycleSummary,
  listTestCyclesByProject,
  listTestCyclesBySuite,
  listTestSuitesByProject,
  updateTestCycle,
  validateTestCycleInput,
} from "@/lib/test-design/testDesignService";
import {
  testCyclePriorities,
  testCycleStatuses,
  type TestCase,
  type TestCycle,
  type TestCycleInput,
  type TestCyclePriority,
  type TestCycleStatus,
  type TestScenario,
  type TestSuite,
} from "@/lib/test-design/types";

export const testCycleStorageKey = "frankintest.block05.testCycles";
const testSuiteStorageKey = "frankintest.block05.testSuites";
const testCaseStorageKey = "frankintest.block04.testCases";
const scenarioStorageKey = "frankintest.block04.scenarios";

const statusLabels: Record<TestCycleStatus, string> = {
  draft: "Rascunho",
  planned: "Planejado",
  active: "Ativo",
  completed: "Concluído",
  archived: "Arquivado",
};

const priorityLabels: Record<TestCyclePriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

type TestCycleFormState = {
  projectId: string;
  name: string;
  objective: string;
  status: TestCycleStatus;
  priority: TestCyclePriority;
  testSuiteIds: string[];
  owner: string;
  plannedStartAt: string;
  plannedEndAt: string;
};

const emptyCycleForm: TestCycleFormState = {
  projectId: "",
  name: "",
  objective: "",
  status: "draft",
  priority: "medium",
  testSuiteIds: [],
  owner: "",
  plannedStartAt: "",
  plannedEndAt: "",
};

type TestCycleSectionProps = {
  projects: Project[];
  modules: ProductModule[];
  requirements: Requirement[];
  businessRules: BusinessRule[];
};

export function TestCycleSection({
  projects,
  modules,
  requirements,
  businessRules,
}: TestCycleSectionProps) {
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
  const [testCycles, setTestCycles] = useState<TestCycle[]>(() => {
    if (typeof window === "undefined") {
      return demoTestCycles;
    }

    const storedTestCycles = window.localStorage.getItem(testCycleStorageKey);

    return storedTestCycles ? (JSON.parse(storedTestCycles) as TestCycle[]) : demoTestCycles;
  });
  const [selectedProjectId, setSelectedProjectId] = useState(() => projects[0]?.id ?? "");
  const activeProjectId = selectedProjectId || projects[0]?.id || "";
  const [formState, setFormState] = useState<TestCycleFormState>({
    ...emptyCycleForm,
    projectId: activeProjectId,
    testSuiteIds: listTestSuitesByProject(activeProjectId, demoTestSuites)
      .slice(0, 1)
      .map((testSuite) => testSuite.id),
  });
  const [editingCycleId, setEditingCycleId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState(false);

  const projectSuites = useMemo(
    () => listTestSuitesByProject(activeProjectId, testSuites),
    [activeProjectId, testSuites],
  );
  const projectCycles = useMemo(
    () => listTestCyclesByProject(activeProjectId, testCycles),
    [activeProjectId, testCycles],
  );
  const summary = useMemo(
    () => getTestCycleSummary(activeProjectId, testCycles),
    [activeProjectId, testCycles],
  );
  const selectedProject = projects.find((project) => project.id === activeProjectId);

  function persistTestCycles(nextTestCycles: TestCycle[]) {
    setTestCycles(nextTestCycles);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(testCycleStorageKey, JSON.stringify(nextTestCycles));
    }
  }

  function resetForm(projectId = activeProjectId) {
    const firstProjectSuite = listTestSuitesByProject(projectId, testSuites)[0];

    setFormState({
      ...emptyCycleForm,
      projectId,
      testSuiteIds: firstProjectSuite ? [firstProjectSuite.id] : [],
    });
    setEditingCycleId(null);
    setValidationError(false);
  }

  function handleProjectChange(projectId: string) {
    setSelectedProjectId(projectId);
    resetForm(projectId);
  }

  function toggleTestSuite(testSuiteId: string) {
    setFormState((current) => {
      const isSelected = current.testSuiteIds.includes(testSuiteId);

      return {
        ...current,
        testSuiteIds: isSelected
          ? current.testSuiteIds.filter((item) => item !== testSuiteId)
          : [...current.testSuiteIds, testSuiteId],
      };
    });
  }

  function toTestCycleInput(): TestCycleInput {
    return {
      ...formState,
      projectId: activeProjectId,
      testSuiteIds: formState.testSuiteIds.filter((testSuiteId) =>
        projectSuites.some((testSuite) => testSuite.id === testSuiteId),
      ),
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = toTestCycleInput();

    if (validateTestCycleInput(input).length > 0) {
      setValidationError(true);
      return;
    }

    if (editingCycleId) {
      persistTestCycles(
        testCycles.map((testCycle) =>
          testCycle.id === editingCycleId ? updateTestCycle(testCycle, input) : testCycle,
        ),
      );
    } else {
      persistTestCycles([createTestCycle(input), ...testCycles]);
    }

    resetForm(activeProjectId);
  }

  function startEditingCycle(testCycle: TestCycle) {
    setSelectedProjectId(testCycle.projectId);
    setEditingCycleId(testCycle.id);
    setValidationError(false);
    setFormState({
      projectId: testCycle.projectId,
      name: testCycle.name,
      objective: testCycle.objective,
      status: testCycle.status,
      priority: testCycle.priority,
      testSuiteIds: testCycle.testSuiteIds,
      owner: testCycle.owner,
      plannedStartAt: testCycle.plannedStartAt,
      plannedEndAt: testCycle.plannedEndAt,
    });
  }

  function getLinkedSuites(testCycle: TestCycle) {
    return testSuites.filter((testSuite) => testCycle.testSuiteIds.includes(testSuite.id));
  }

  return (
    <section
      id="test-cycles"
      className="rounded-[1.5rem] border border-slate-900/10 bg-white/90 p-6 shadow-xl shadow-slate-900/5 md:p-8"
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.26em] text-teal-700">
            Planejamento de execução
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Ciclos de teste
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Planeje grupos de execução vinculando suítes de teste ao projeto, sem registrar
            resultado de execução neste bloco.
          </p>
        </div>

        <label className="grid min-w-72 gap-2 text-sm font-bold text-slate-700">
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
          Projeto -&gt; Ciclo de teste -&gt; Suítes de teste
        </p>
        <p className="rounded-2xl border border-slate-900/10 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
          Projeto -&gt; Módulo -&gt; Requisito -&gt; Regra de negócio -&gt; Cenário de teste -&gt; Caso de teste -&gt; Suíte de teste -&gt; Ciclo de teste
        </p>
      </div>
      <p className="mt-3 rounded-2xl border border-slate-900/10 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
        Persistência local de demonstração via localStorage: {testCycleStorageKey}. Este ciclo ainda não executa testes; execução será adicionada em bloco posterior.
      </p>

      <section className="mt-6 rounded-2xl border border-slate-900/10 bg-slate-50 p-5">
        <div>
          <h3 className="text-xl font-black tracking-tight text-slate-950">
            Resumo de ciclos
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {selectedProject?.name ?? "Nenhum projeto selecionado"}
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <SummaryMetric label="Total" value={summary.totalCycles} />
          <SummaryMetric label="Rascunhos" value={summary.draftCycles} />
          <SummaryMetric label="Planejados" value={summary.plannedCycles} />
          <SummaryMetric label="Ativos" value={summary.activeCycles} />
          <SummaryMetric label="Concluídos" value={summary.completedCycles} />
          <SummaryMetric label="Suítes vinculadas" value={summary.totalLinkedSuites} />
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-2xl border border-slate-900/10 bg-white p-5">
          <h3 className="text-xl font-black tracking-tight text-slate-950">
            {editingCycleId ? "Editar ciclo" : "Novo ciclo"}
          </h3>

          <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Nome
              <input
                className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                placeholder="Ex.: Ciclo smoke - Landing page"
                value={formState.name}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Objetivo
              <textarea
                className="min-h-24 rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                placeholder="Objetivo do ciclo e recorte planejado de execução."
                value={formState.objective}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, objective: event.target.value }))
                }
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <CycleSelect
                label="Status"
                value={formState.status}
                options={testCycleStatuses}
                labels={statusLabels}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, status: value as TestCycleStatus }))
                }
              />
              <CycleSelect
                label="Prioridade"
                value={formState.priority}
                options={testCyclePriorities}
                labels={priorityLabels}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, priority: value as TestCyclePriority }))
                }
              />
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Responsável
                <input
                  className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                  placeholder="Nome ou ID do responsável"
                  value={formState.owner}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, owner: event.target.value }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Início planejado
                <input
                  type="date"
                  className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                  value={formState.plannedStartAt}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, plannedStartAt: event.target.value }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Fim planejado
                <input
                  type="date"
                  className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                  value={formState.plannedEndAt}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, plannedEndAt: event.target.value }))
                  }
                />
              </label>
            </div>

            <fieldset className="rounded-2xl border border-slate-900/10 bg-slate-50 p-4">
              <legend className="px-1 text-sm font-black text-slate-800">
                Selecionar suítes de teste
              </legend>
              <div className="mt-3 grid gap-3">
                {projectSuites.length === 0 ? (
                  <p className="text-sm font-semibold text-slate-600">
                    Nenhuma suíte de teste disponível para este projeto.
                  </p>
                ) : (
                  projectSuites.map((testSuite) => (
                    <label
                      key={testSuite.id}
                      className="flex gap-3 rounded-xl border border-slate-900/10 bg-white p-3 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={formState.testSuiteIds.includes(testSuite.id)}
                        onChange={() => toggleTestSuite(testSuite.id)}
                      />
                      <span>
                        <span className="block font-black text-slate-950">{testSuite.name}</span>
                        <span className="mt-1 block text-xs font-semibold text-slate-500">
                          {testSuite.id}
                        </span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </fieldset>

            {validationError ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
                Informe projeto, nome, objetivo e ao menos uma suíte de teste vinculada. As datas
                devem ser válidas e o fim não pode ser anterior ao início.
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-teal-800"
              >
                {editingCycleId ? "Salvar alterações" : "Criar ciclo"}
              </button>
              {editingCycleId ? (
                <button
                  type="button"
                  className="rounded-xl border border-slate-900/10 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-slate-400"
                  onClick={() => resetForm(activeProjectId)}
                >
                  Cancelar edição
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="grid content-start gap-4">
          {projectCycles.length === 0 ? (
            <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
              <h3 className="text-xl font-black text-slate-950">
                Nenhum ciclo neste projeto
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Crie um ciclo para planejar quais suítes serão executadas em um recorte futuro.
              </p>
            </section>
          ) : (
            projectCycles.map((testCycle) => {
              const linkedSuites = getLinkedSuites(testCycle);
              const firstSuite = linkedSuites[0];
              const firstCase = testCases.find((testCase) =>
                firstSuite?.testCaseIds.includes(testCase.id),
              );
              const linkedScenario = scenarios.find((scenario) => scenario.id === firstCase?.scenarioId);
              const linkedModule = modules.find((module) => module.id === firstCase?.moduleId);
              const linkedRequirement = requirements.find(
                (requirement) => requirement.id === firstCase?.requirementId,
              );
              const linkedRule = businessRules.find(
                (rule) => rule.id === firstCase?.businessRuleId,
              );
              const cyclesForFirstSuite = firstSuite
                ? listTestCyclesBySuite(firstSuite.id, testCycles).length
                : 0;

              return (
                <article
                  key={testCycle.id}
                  className="rounded-2xl border border-slate-900/10 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-xl font-black tracking-tight text-slate-950">
                        {testCycle.name}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {testCycle.objective}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="w-fit rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-700 hover:border-slate-300"
                      onClick={() => startEditingCycle(testCycle)}
                    >
                      Editar ciclo
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge label={statusLabels[testCycle.status]} />
                    <Badge label={priorityLabels[testCycle.priority]} />
                    <Badge label={`Responsável: ${testCycle.owner || "Não definido"}`} />
                    <Badge label={`Suítes vinculadas: ${linkedSuites.length}`} />
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <Meta label="Início planejado" value={formatOptionalDate(testCycle.plannedStartAt)} />
                    <Meta label="Fim planejado" value={formatOptionalDate(testCycle.plannedEndAt)} />
                    <Meta label="Projeto" value={selectedProject?.name ?? testCycle.projectId} />
                    <Meta label="Ciclos da primeira suíte" value={String(cyclesForFirstSuite)} />
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-900/10 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                      Suítes vinculadas
                    </p>
                    <ul className="mt-3 grid gap-2">
                      {linkedSuites.map((testSuite) => (
                        <li key={testSuite.id} className="text-sm font-semibold text-slate-700">
                          {testSuite.name}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 rounded-2xl border border-teal-800/15 bg-teal-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-teal-800">
                      Rastreabilidade de exemplo
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-teal-950">
                      Projeto: {selectedProject?.name ?? testCycle.projectId} | Módulo:{" "}
                      {linkedModule?.name ?? "N/A"} | Requisito:{" "}
                      {linkedRequirement?.title ?? "N/A"} | Regra de negócio:{" "}
                      {linkedRule?.title ?? "N/A"} | Cenário de teste:{" "}
                      {linkedScenario?.title ?? "N/A"} | Caso de teste:{" "}
                      {firstCase?.title ?? "N/A"} | Suíte de teste:{" "}
                      {firstSuite?.name ?? "N/A"} | Ciclo de teste: {testCycle.name}
                    </p>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </section>
  );
}

function CycleSelect<T extends string>({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  labels: Record<string, string>;
  onChange: (value: T) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      <select
        className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
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

function SummaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-slate-900/10 bg-white p-4">
      <p className="text-3xl font-black tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
    </article>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-900/10">
      {label}
    </span>
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
