"use client";

import { FormEvent, useMemo, useState } from "react";

import type { BusinessRule, ProductModule, Requirement } from "@/lib/business-understanding/types";
import type { Project } from "@/lib/projects/types";
import {
  createTestSuite,
  demoTestCases,
  demoTestScenarios,
  demoTestSuites,
  getTestSuiteSummary,
  listTestCasesByProject,
  listTestSuitesByProject,
  listTestSuitesByTestCase,
  updateTestSuite,
  validateTestSuiteInput,
} from "@/lib/test-design/testDesignService";
import {
  testSuitePriorities,
  testSuiteStatuses,
  testSuiteTypes,
  type TestCase,
  type TestScenario,
  type TestSuite,
  type TestSuiteInput,
  type TestSuitePriority,
  type TestSuiteStatus,
  type TestSuiteType,
} from "@/lib/test-design/types";

export const testSuiteStorageKey = "frankintest.block05.testSuites";
const testCaseStorageKey = "frankintest.block04.testCases";
const scenarioStorageKey = "frankintest.block04.scenarios";

const suiteTypeLabels: Record<TestSuiteType, string> = {
  smoke: "Smoke",
  regression: "Regressão",
  release: "Release",
  feature: "Funcional",
  exploratory: "Exploratório",
  api: "API",
  mobile: "Mobile",
  security: "Segurança",
  accessibility: "Acessibilidade",
  performance: "Performance",
};

const priorityLabels: Record<TestSuitePriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

const statusLabels: Record<TestSuiteStatus, string> = {
  draft: "Rascunho",
  ready: "Pronta",
  needs_review: "Precisa revisão",
  archived: "Arquivada",
};

type TestSuiteFormState = {
  projectId: string;
  name: string;
  description: string;
  suiteType: TestSuiteType;
  status: TestSuiteStatus;
  priority: TestSuitePriority;
  testCaseIds: string[];
  owner: string;
};

const emptySuiteForm: TestSuiteFormState = {
  projectId: "",
  name: "",
  description: "",
  suiteType: "feature",
  status: "draft",
  priority: "medium",
  testCaseIds: [],
  owner: "",
};

type TestSuiteSectionProps = {
  projects: Project[];
  modules: ProductModule[];
  requirements: Requirement[];
  businessRules: BusinessRule[];
};

export function TestSuiteSection({
  projects,
  modules,
  requirements,
  businessRules,
}: TestSuiteSectionProps) {
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
  const [testSuites, setTestSuites] = useState<TestSuite[]>(() => {
    if (typeof window === "undefined") {
      return demoTestSuites;
    }

    const storedTestSuites = window.localStorage.getItem(testSuiteStorageKey);

    return storedTestSuites ? (JSON.parse(storedTestSuites) as TestSuite[]) : demoTestSuites;
  });
  const [selectedProjectId, setSelectedProjectId] = useState(() => projects[0]?.id ?? "");
  const activeProjectId = selectedProjectId || projects[0]?.id || "";
  const [formState, setFormState] = useState<TestSuiteFormState>({
    ...emptySuiteForm,
    projectId: activeProjectId,
    testCaseIds: listTestCasesByProject(activeProjectId, demoTestCases)
      .slice(0, 1)
      .map((testCase) => testCase.id),
  });
  const [editingSuiteId, setEditingSuiteId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState(false);

  const projectTestCases = useMemo(
    () => listTestCasesByProject(activeProjectId, testCases),
    [activeProjectId, testCases],
  );
  const projectSuites = useMemo(
    () => listTestSuitesByProject(activeProjectId, testSuites),
    [activeProjectId, testSuites],
  );
  const summary = useMemo(
    () => getTestSuiteSummary(activeProjectId, testSuites),
    [activeProjectId, testSuites],
  );
  const selectedProject = projects.find((project) => project.id === activeProjectId);

  function persistTestSuites(nextTestSuites: TestSuite[]) {
    setTestSuites(nextTestSuites);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(testSuiteStorageKey, JSON.stringify(nextTestSuites));
    }
  }

  function resetForm(projectId = activeProjectId) {
    const firstProjectTestCase = listTestCasesByProject(projectId, testCases)[0];

    setFormState({
      ...emptySuiteForm,
      projectId,
      testCaseIds: firstProjectTestCase ? [firstProjectTestCase.id] : [],
    });
    setEditingSuiteId(null);
    setValidationError(false);
  }

  function handleProjectChange(projectId: string) {
    setSelectedProjectId(projectId);
    resetForm(projectId);
  }

  function toggleTestCase(testCaseId: string) {
    setFormState((current) => {
      const isSelected = current.testCaseIds.includes(testCaseId);

      return {
        ...current,
        testCaseIds: isSelected
          ? current.testCaseIds.filter((item) => item !== testCaseId)
          : [...current.testCaseIds, testCaseId],
      };
    });
  }

  function toTestSuiteInput(): TestSuiteInput {
    return {
      ...formState,
      projectId: activeProjectId,
      testCaseIds: formState.testCaseIds.filter((testCaseId) =>
        projectTestCases.some((testCase) => testCase.id === testCaseId),
      ),
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = toTestSuiteInput();

    if (validateTestSuiteInput(input).length > 0) {
      setValidationError(true);
      return;
    }

    if (editingSuiteId) {
      persistTestSuites(
        testSuites.map((testSuite) =>
          testSuite.id === editingSuiteId ? updateTestSuite(testSuite, input) : testSuite,
        ),
      );
    } else {
      persistTestSuites([createTestSuite(input), ...testSuites]);
    }

    resetForm(activeProjectId);
  }

  function startEditingSuite(testSuite: TestSuite) {
    setSelectedProjectId(testSuite.projectId);
    setEditingSuiteId(testSuite.id);
    setValidationError(false);
    setFormState({
      projectId: testSuite.projectId,
      name: testSuite.name,
      description: testSuite.description,
      suiteType: testSuite.suiteType,
      status: testSuite.status,
      priority: testSuite.priority,
      testCaseIds: testSuite.testCaseIds,
      owner: testSuite.owner,
    });
  }

  function getLinkedTestCases(testSuite: TestSuite) {
    return testCases.filter((testCase) => testSuite.testCaseIds.includes(testCase.id));
  }

  return (
    <section
      id="test-suites"
      className="rounded-[1.5rem] border border-slate-900/10 bg-white/90 p-6 shadow-xl shadow-slate-900/5 md:p-8"
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.26em] text-teal-700">
            Desenho de testes
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Suítes de teste
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Visualize, crie e edite suítes determinísticas vinculadas aos casos de teste do projeto.
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
          Projeto -&gt; Suíte de teste -&gt; Casos de teste
        </p>
        <p className="rounded-2xl border border-slate-900/10 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
          Projeto -&gt; Módulo -&gt; Requisito -&gt; Regra de negócio -&gt; Cenário de teste -&gt; Caso de teste -&gt; Suíte de teste
        </p>
      </div>
      <p className="mt-3 rounded-2xl border border-slate-900/10 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
        Persistência local de demonstração via localStorage: {testSuiteStorageKey}. Sem banco real,
        ciclos de teste, execução, bugs, evidências, relatórios, IA real ou cobrança neste bloco.
      </p>

      <section className="mt-6 rounded-2xl border border-slate-900/10 bg-slate-50 p-5">
        <div>
          <h3 className="text-xl font-black tracking-tight text-slate-950">
            Resumo de suítes
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {selectedProject?.name ?? "Nenhum projeto selecionado"}
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <SummaryMetric label="Total" value={summary.totalSuites} />
          <SummaryMetric label="Prontas" value={summary.readySuites} />
          <SummaryMetric label="A revisar" value={summary.suitesNeedingReview} />
          <SummaryMetric label="Críticas" value={summary.criticalSuites} />
          <SummaryMetric label="Arquivadas" value={summary.archivedSuites} />
          <SummaryMetric label="Casos vinculados" value={summary.totalLinkedTestCases} />
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-2xl border border-slate-900/10 bg-white p-5">
          <h3 className="text-xl font-black tracking-tight text-slate-950">
            {editingSuiteId ? "Editar suíte" : "Nova suíte"}
          </h3>

          <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Nome
              <input
                className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                placeholder="Ex.: Smoke - Fluxo principal"
                value={formState.name}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Descrição
              <textarea
                className="min-h-24 rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                placeholder="Objetivo da suíte e contexto de uso dentro do projeto."
                value={formState.description}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, description: event.target.value }))
                }
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <SuiteSelect
                label="Tipo de suíte"
                value={formState.suiteType}
                options={testSuiteTypes}
                labels={suiteTypeLabels}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, suiteType: value as TestSuiteType }))
                }
              />
              <SuiteSelect
                label="Status"
                value={formState.status}
                options={testSuiteStatuses}
                labels={statusLabels}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, status: value as TestSuiteStatus }))
                }
              />
              <SuiteSelect
                label="Prioridade"
                value={formState.priority}
                options={testSuitePriorities}
                labels={priorityLabels}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, priority: value as TestSuitePriority }))
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
            </div>

            <fieldset className="rounded-2xl border border-slate-900/10 bg-slate-50 p-4">
              <legend className="px-1 text-sm font-black text-slate-800">
                Selecionar casos de teste
              </legend>
              <div className="mt-3 grid gap-3">
                {projectTestCases.length === 0 ? (
                  <p className="text-sm font-semibold text-slate-600">
                    Nenhum caso de teste disponível para este projeto.
                  </p>
                ) : (
                  projectTestCases.map((testCase) => (
                    <label
                      key={testCase.id}
                      className="flex gap-3 rounded-xl border border-slate-900/10 bg-white p-3 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={formState.testCaseIds.includes(testCase.id)}
                        onChange={() => toggleTestCase(testCase.id)}
                      />
                      <span>
                        <span className="block font-black text-slate-950">{testCase.title}</span>
                        <span className="mt-1 block text-xs font-semibold text-slate-500">
                          {testCase.id}
                        </span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </fieldset>

            {validationError ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
                Informe nome, projeto e ao menos um caso de teste vinculado para salvar a suíte.
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-teal-800"
              >
                {editingSuiteId ? "Salvar alterações" : "Criar suíte"}
              </button>
              {editingSuiteId ? (
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
          {projectSuites.length === 0 ? (
            <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
              <h3 className="text-xl font-black text-slate-950">
                Nenhuma suíte neste projeto
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Crie uma suíte para agrupar casos de teste em um recorte determinístico.
              </p>
            </section>
          ) : (
            projectSuites.map((testSuite) => {
              const linkedCases = getLinkedTestCases(testSuite);
              const firstLinkedCase = linkedCases[0];
              const linkedScenario = scenarios.find(
                (scenario) => scenario.id === firstLinkedCase?.scenarioId,
              );
              const linkedModule = modules.find((module) => module.id === firstLinkedCase?.moduleId);
              const linkedRequirement = requirements.find(
                (requirement) => requirement.id === firstLinkedCase?.requirementId,
              );
              const linkedRule = businessRules.find(
                (rule) => rule.id === firstLinkedCase?.businessRuleId,
              );
              const suitesForFirstCase = firstLinkedCase
                ? listTestSuitesByTestCase(firstLinkedCase.id, testSuites).length
                : 0;

              return (
                <article
                  key={testSuite.id}
                  className="rounded-2xl border border-slate-900/10 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-xl font-black tracking-tight text-slate-950">
                        {testSuite.name}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {testSuite.description || "Sem descrição informada."}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="w-fit rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-700 hover:border-slate-300"
                      onClick={() => startEditingSuite(testSuite)}
                    >
                      Editar suíte
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge label={suiteTypeLabels[testSuite.suiteType]} />
                    <Badge label={statusLabels[testSuite.status]} />
                    <Badge label={priorityLabels[testSuite.priority]} />
                    <Badge label={`Responsável: ${testSuite.owner || "Não definido"}`} />
                    <Badge label={`Casos vinculados: ${linkedCases.length}`} />
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <Meta label="Criada em" value={formatDate(testSuite.createdAt)} />
                    <Meta label="Atualizada em" value={formatDate(testSuite.updatedAt)} />
                    <Meta
                      label="Projeto"
                      value={selectedProject?.name ?? testSuite.projectId}
                    />
                    <Meta
                      label="Caso em outras suítes"
                      value={firstLinkedCase ? String(suitesForFirstCase) : "0"}
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-900/10 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                      Casos vinculados
                    </p>
                    <ul className="mt-3 grid gap-2">
                      {linkedCases.map((testCase) => (
                        <li key={testCase.id} className="text-sm font-semibold text-slate-700">
                          {testCase.title}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 rounded-2xl border border-teal-800/15 bg-teal-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-teal-800">
                      Rastreabilidade de exemplo
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-teal-950">
                      Projeto: {selectedProject?.name ?? testSuite.projectId} | Módulo:{" "}
                      {linkedModule?.name ?? "N/A"} | Requisito:{" "}
                      {linkedRequirement?.title ?? "N/A"} | Regra de negócio:{" "}
                      {linkedRule?.title ?? "N/A"} | Cenário de teste:{" "}
                      {linkedScenario?.title ?? "N/A"} | Caso de teste:{" "}
                      {firstLinkedCase?.title ?? "N/A"} | Suíte de teste: {testSuite.name}
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

function SuiteSelect<T extends string>({
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
