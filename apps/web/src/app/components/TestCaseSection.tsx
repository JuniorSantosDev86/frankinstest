"use client";

import { FormEvent, useMemo, useState } from "react";

import type { BusinessRule, ProductModule, Requirement } from "@/lib/business-understanding/types";
import type { Project } from "@/lib/projects/types";
import { AiGenerationModal } from "./AiGenerationModal";
import type { GeneratedQaArtifact } from "@/lib/ai-assistance/types";
import {
  createTestCase,
  demoTestCases,
  demoTestScenarios,
  getTestCaseDesignSummary,
  listTestCasesByProject,
  updateTestCase,
  validateTestCaseInput,
} from "@/lib/test-design/testDesignService";
import {
  testCaseAutomationStatuses,
  testCasePriorities,
  testCaseStatuses,
  testLevels,
  type TestCase,
  type TestCaseAutomationStatus,
  type TestCaseInput,
  type TestCasePriority,
  type TestCaseStatus,
  type TestLevel,
  type TestScenario,
} from "@/lib/test-design/types";

export const testCaseStorageKey = "frankintest.block04.testCases";
const scenarioStorageKey = "frankintest.block04.scenarios";

const priorityLabels: Record<TestCasePriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

const statusLabels: Record<TestCaseStatus, string> = {
  draft: "Rascunho",
  ready: "Pronto",
  needs_review: "Precisa revisão",
  archived: "Arquivado",
};

const testLevelLabels: Record<TestLevel, string> = {
  unit: "Unidade",
  integration: "Integração",
  api: "API",
  e2e: "E2E",
  system: "Sistema",
  acceptance: "Aceitação",
  exploratory: "Exploratório",
};

const automationStatusLabels: Record<TestCaseAutomationStatus, string> = {
  not_automated: "Não automatizado",
  automation_candidate: "Candidato à automação",
  automated: "Automatizado",
  not_applicable: "Não aplicável",
};

type TestCaseFormState = {
  projectId: string;
  moduleId: string;
  requirementId: string;
  businessRuleId: string;
  scenarioId: string;
  title: string;
  objective: string;
  precondition: string;
  stepsText: string;
  expectedResult: string;
  priority: TestCasePriority;
  status: TestCaseStatus;
  testLevel: TestLevel;
  automationStatus: TestCaseAutomationStatus;
  aiGenerated: boolean;
  reviewedBy: string;
};

const emptyTestCaseForm: TestCaseFormState = {
  projectId: "",
  moduleId: "",
  requirementId: "",
  businessRuleId: "",
  scenarioId: "",
  title: "",
  objective: "",
  precondition: "",
  stepsText: "",
  expectedResult: "",
  priority: "medium",
  status: "draft",
  testLevel: "acceptance",
  automationStatus: "not_automated",
  aiGenerated: false,
  reviewedBy: "",
};

type TestCaseSectionProps = {
  projects: Project[];
  modules: ProductModule[];
  requirements: Requirement[];
  businessRules: BusinessRule[];
};

export function TestCaseSection({
  projects,
  modules,
  requirements,
  businessRules,
}: TestCaseSectionProps) {
  const [scenarios] = useState<TestScenario[]>(() => {
    if (typeof window === "undefined") {
      return demoTestScenarios;
    }

    const storedScenarios = window.localStorage.getItem(scenarioStorageKey);

    return storedScenarios ? (JSON.parse(storedScenarios) as TestScenario[]) : demoTestScenarios;
  });
  const [testCases, setTestCases] = useState<TestCase[]>(() => {
    if (typeof window === "undefined") {
      return demoTestCases;
    }

    const storedTestCases = window.localStorage.getItem(testCaseStorageKey);

    return storedTestCases ? (JSON.parse(storedTestCases) as TestCase[]) : demoTestCases;
  });
  const [selectedProjectId, setSelectedProjectId] = useState(() => projects[0]?.id ?? "");
  const activeProjectId = selectedProjectId || projects[0]?.id || "";
  const [formState, setFormState] = useState<TestCaseFormState>({
    ...emptyTestCaseForm,
    projectId: activeProjectId,
  });
  const [editingTestCaseId, setEditingTestCaseId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const projectModules = useMemo(
    () => modules.filter((module) => module.projectId === activeProjectId),
    [activeProjectId, modules],
  );
  const activeModuleId = formState.moduleId || projectModules[0]?.id || "";
  const moduleRequirements = useMemo(
    () => requirements.filter((requirement) => requirement.moduleId === activeModuleId),
    [activeModuleId, requirements],
  );
  const activeRequirementId = formState.requirementId || moduleRequirements[0]?.id || "";
  const requirementBusinessRules = useMemo(
    () => businessRules.filter((rule) => rule.requirementId === activeRequirementId),
    [activeRequirementId, businessRules],
  );
  const activeBusinessRuleId = formState.businessRuleId || requirementBusinessRules[0]?.id || "";
  const businessRuleScenarios = useMemo(
    () => scenarios.filter((scenario) => scenario.businessRuleId === activeBusinessRuleId),
    [activeBusinessRuleId, scenarios],
  );
  const activeScenarioId = formState.scenarioId || businessRuleScenarios[0]?.id || "";
  const projectTestCases = useMemo(
    () => listTestCasesByProject(activeProjectId, testCases),
    [activeProjectId, testCases],
  );
  const summary = useMemo(
    () => getTestCaseDesignSummary(activeProjectId, testCases),
    [activeProjectId, testCases],
  );
  const selectedProject = projects.find((project) => project.id === activeProjectId);

  function persistTestCases(nextTestCases: TestCase[]) {
    setTestCases(nextTestCases);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(testCaseStorageKey, JSON.stringify(nextTestCases));
    }
  }

  function getFirstChain(projectId: string) {
    const firstModule = modules.find((module) => module.projectId === projectId);
    const firstRequirement = requirements.find(
      (requirement) => requirement.moduleId === firstModule?.id,
    );
    const firstRule = businessRules.find((rule) => rule.requirementId === firstRequirement?.id);
    const firstScenario = scenarios.find((scenario) => scenario.businessRuleId === firstRule?.id);

    return { firstModule, firstRequirement, firstRule, firstScenario };
  }

  function resetForm(projectId = activeProjectId) {
    const { firstModule, firstRequirement, firstRule, firstScenario } = getFirstChain(projectId);

    setFormState({
      ...emptyTestCaseForm,
      projectId,
      moduleId: firstModule?.id ?? "",
      requirementId: firstRequirement?.id ?? "",
      businessRuleId: firstRule?.id ?? "",
      scenarioId: firstScenario?.id ?? "",
    });
    setEditingTestCaseId(null);
    setValidationError(false);
  }

  function handleProjectChange(projectId: string) {
    setSelectedProjectId(projectId);
    resetForm(projectId);
  }

  function handleModuleChange(moduleId: string) {
    const firstRequirement = requirements.find((requirement) => requirement.moduleId === moduleId);
    const firstRule = businessRules.find((rule) => rule.requirementId === firstRequirement?.id);
    const firstScenario = scenarios.find((scenario) => scenario.businessRuleId === firstRule?.id);

    setFormState((current) => ({
      ...current,
      moduleId,
      requirementId: firstRequirement?.id ?? "",
      businessRuleId: firstRule?.id ?? "",
      scenarioId: firstScenario?.id ?? "",
    }));
  }

  function handleRequirementChange(requirementId: string) {
    const linkedRequirement = requirements.find((requirement) => requirement.id === requirementId);
    const firstRule = businessRules.find((rule) => rule.requirementId === requirementId);
    const firstScenario = scenarios.find((scenario) => scenario.businessRuleId === firstRule?.id);

    setFormState((current) => ({
      ...current,
      moduleId: linkedRequirement?.moduleId ?? current.moduleId,
      requirementId,
      businessRuleId: firstRule?.id ?? "",
      scenarioId: firstScenario?.id ?? "",
    }));
  }

  function handleBusinessRuleChange(businessRuleId: string) {
    const linkedRule = businessRules.find((rule) => rule.id === businessRuleId);
    const firstScenario = scenarios.find((scenario) => scenario.businessRuleId === businessRuleId);

    setFormState((current) => ({
      ...current,
      moduleId: linkedRule?.moduleId ?? current.moduleId,
      requirementId: linkedRule?.requirementId ?? current.requirementId,
      businessRuleId,
      scenarioId: firstScenario?.id ?? "",
    }));
  }

  function handleScenarioChange(scenarioId: string) {
    const linkedScenario = scenarios.find((scenario) => scenario.id === scenarioId);

    setFormState((current) => ({
      ...current,
      moduleId: linkedScenario?.moduleId ?? current.moduleId,
      requirementId: linkedScenario?.requirementId ?? current.requirementId,
      businessRuleId: linkedScenario?.businessRuleId ?? current.businessRuleId,
      scenarioId,
    }));
  }

  function handleAiOutputAccepted(artifacts: GeneratedQaArtifact[], aiRunId: string) {
    const linkedScenario = scenarios.find((s) => s.id === activeScenarioId);

    const newCases = artifacts.map((artifact) => {
      const input: TestCaseInput = {
        projectId: activeProjectId,
        moduleId: linkedScenario?.moduleId ?? activeModuleId,
        requirementId: linkedScenario?.requirementId ?? activeRequirementId,
        businessRuleId: linkedScenario?.businessRuleId ?? activeBusinessRuleId,
        scenarioId: activeScenarioId,
        title: artifact.title,
        objective: artifact.description ?? "",
        precondition: "",
        steps: [],
        expectedResult: "",
        priority: "medium",
        status: "draft",
        testLevel: "acceptance",
        automationStatus: "not_automated",
        aiGenerated: true,
        reviewedBy: "",
      };
      return createTestCase(input);
    });

    if (newCases.length > 0) {
      persistTestCases([...newCases, ...testCases]);
    }
    void aiRunId;
  }

  function toTestCaseInput(): TestCaseInput {
    const linkedScenario = scenarios.find((scenario) => scenario.id === activeScenarioId);
    const steps = formState.stepsText
      .split("\n")
      .map((step) => step.trim())
      .filter(Boolean);

    return {
      ...formState,
      projectId: activeProjectId,
      moduleId: linkedScenario?.moduleId ?? activeModuleId,
      requirementId: linkedScenario?.requirementId ?? activeRequirementId,
      businessRuleId: linkedScenario?.businessRuleId ?? activeBusinessRuleId,
      scenarioId: linkedScenario?.id ?? activeScenarioId,
      steps,
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = toTestCaseInput();

    if (validateTestCaseInput(input).length > 0) {
      setValidationError(true);
      return;
    }

    if (editingTestCaseId) {
      persistTestCases(
        testCases.map((testCase) =>
          testCase.id === editingTestCaseId ? updateTestCase(testCase, input) : testCase,
        ),
      );
    } else {
      persistTestCases([createTestCase(input), ...testCases]);
    }

    resetForm(activeProjectId);
  }

  function startEditingTestCase(testCase: TestCase) {
    setSelectedProjectId(testCase.projectId);
    setEditingTestCaseId(testCase.id);
    setValidationError(false);
    setFormState({
      projectId: testCase.projectId,
      moduleId: testCase.moduleId,
      requirementId: testCase.requirementId,
      businessRuleId: testCase.businessRuleId,
      scenarioId: testCase.scenarioId,
      title: testCase.title,
      objective: testCase.objective,
      precondition: testCase.precondition,
      stepsText: testCase.steps.join("\n"),
      expectedResult: testCase.expectedResult,
      priority: testCase.priority,
      status: testCase.status,
      testLevel: testCase.testLevel,
      automationStatus: testCase.automationStatus,
      aiGenerated: testCase.aiGenerated,
      reviewedBy: testCase.reviewedBy,
    });
  }

  return (
    <section
      id="test-cases"
      className="rounded-[1.5rem] border border-slate-900/10 bg-white/90 p-6 shadow-xl shadow-slate-900/5 md:p-8"
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.26em] text-teal-700">
            Desenho de testes
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Casos de teste
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Visualize, crie e edite casos determinísticos ligados a cenários de teste.
          </p>
          {activeScenarioId && (
            <button
              type="button"
              onClick={() => setAiModalOpen(true)}
              className="mt-4 rounded-xl border border-teal-700/30 bg-teal-50 px-4 py-2 text-sm font-black text-teal-800 transition hover:bg-teal-100"
            >
              Gerar casos com IA
            </button>
          )}
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
          Projeto -&gt; Módulo -&gt; Requisito -&gt; Regra de negócio -&gt; Cenário de teste -&gt; Caso de teste
        </p>
        <p className="rounded-2xl border border-slate-900/10 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
          Persistência local de demonstração via localStorage: {testCaseStorageKey}. Sem banco real,
          execução de testes, bugs, evidências ou relatórios neste bloco.
        </p>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-900/10 bg-slate-50 p-5">
        <div>
          <h3 className="text-xl font-black tracking-tight text-slate-950">
            Resumo de casos
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {selectedProject?.name ?? "Nenhum projeto selecionado"}
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <SummaryMetric label="Total" value={summary.totalTestCases} />
          <SummaryMetric label="Prontos" value={summary.readyTestCases} />
          <SummaryMetric label="A revisar" value={summary.testCasesNeedingReview} />
          <SummaryMetric label="Críticos" value={summary.criticalTestCases} />
          <SummaryMetric label="Candidatos" value={summary.automationCandidates} />
          <SummaryMetric label="Automatizados" value={summary.automatedTestCases} />
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-2xl border border-slate-900/10 bg-white p-5">
          <h3 className="text-xl font-black tracking-tight text-slate-950">
            {editingTestCaseId ? "Editar caso de teste" : "Novo caso de teste"}
          </h3>

          <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
            <TestCaseSelect
              label="Módulo"
              value={activeModuleId}
              options={projectModules.map((module) => module.id)}
              labels={Object.fromEntries(projectModules.map((module) => [module.id, module.name]))}
              onChange={handleModuleChange}
            />
            <TestCaseSelect
              label="Requisito"
              value={activeRequirementId}
              options={moduleRequirements.map((requirement) => requirement.id)}
              labels={Object.fromEntries(
                moduleRequirements.map((requirement) => [requirement.id, requirement.title]),
              )}
              onChange={handleRequirementChange}
            />
            <TestCaseSelect
              label="Regra de negócio"
              value={activeBusinessRuleId}
              options={requirementBusinessRules.map((rule) => rule.id)}
              labels={Object.fromEntries(
                requirementBusinessRules.map((rule) => [rule.id, rule.title]),
              )}
              onChange={handleBusinessRuleChange}
            />
            <TestCaseSelect
              label="Cenário de teste"
              value={activeScenarioId}
              options={businessRuleScenarios.map((scenario) => scenario.id)}
              labels={Object.fromEntries(
                businessRuleScenarios.map((scenario) => [scenario.id, scenario.title]),
              )}
              onChange={handleScenarioChange}
            />

            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Título
              <input
                className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                placeholder="Ex.: Validar envio com dados obrigatórios"
                value={formState.title}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, title: event.target.value }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Objetivo
              <textarea
                className="min-h-20 rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                placeholder="O que este caso deve confirmar."
                value={formState.objective}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, objective: event.target.value }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Pré-condição
              <textarea
                className="min-h-20 rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                placeholder="Contexto necessário antes da execução manual futura."
                value={formState.precondition}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, precondition: event.target.value }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Passos
              <textarea
                className="min-h-32 rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                placeholder={"Um passo por linha\nEx.: Acessar a página\nPreencher o formulário"}
                value={formState.stepsText}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, stepsText: event.target.value }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Resultado esperado
              <textarea
                className="min-h-24 rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                placeholder="Comportamento esperado após executar os passos."
                value={formState.expectedResult}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, expectedResult: event.target.value }))
                }
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <TestCaseSelect
                label="Prioridade"
                value={formState.priority}
                options={testCasePriorities}
                labels={priorityLabels}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, priority: value as TestCasePriority }))
                }
              />
              <TestCaseSelect
                label="Status"
                value={formState.status}
                options={testCaseStatuses}
                labels={statusLabels}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, status: value as TestCaseStatus }))
                }
              />
              <TestCaseSelect
                label="Nível de teste"
                value={formState.testLevel}
                options={testLevels}
                labels={testLevelLabels}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, testLevel: value as TestLevel }))
                }
              />
              <TestCaseSelect
                label="Status de automação"
                value={formState.automationStatus}
                options={testCaseAutomationStatuses}
                labels={automationStatusLabels}
                onChange={(value) =>
                  setFormState((current) => ({
                    ...current,
                    automationStatus: value as TestCaseAutomationStatus,
                  }))
                }
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={formState.aiGenerated}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, aiGenerated: event.target.checked }))
                }
              />
              Rascunho assistido por IA
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Revisado por
              <input
                className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                placeholder="Nome ou ID do revisor humano"
                value={formState.reviewedBy}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, reviewedBy: event.target.value }))
                }
              />
            </label>

            {validationError ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
                Revise a cadeia de rastreabilidade, os passos e os campos obrigatórios do caso.
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-teal-800"
              >
                {editingTestCaseId ? "Salvar alterações" : "Criar caso"}
              </button>
              {editingTestCaseId ? (
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
          {projectTestCases.length === 0 ? (
            <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
              <h3 className="text-xl font-black text-slate-950">
                Nenhum caso neste projeto
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Crie um caso ligado a um cenário de teste para detalhar o desenho manual.
              </p>
            </section>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-bold">Caso de teste</th>
                      <th className="px-4 py-3 font-bold">Objetivo</th>
                      <th className="px-4 py-3 font-bold">Prioridade</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 font-bold">Nível</th>
                      <th className="px-4 py-3 font-bold">Automação</th>
                      <th className="px-4 py-3 font-bold">Rastreabilidade</th>
                      <th className="px-4 py-3 font-bold">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectTestCases.map((testCase) => {
                      const linkedRequirement = requirements.find(
                        (requirement) => requirement.id === testCase.requirementId,
                      );
                      const linkedScenario = scenarios.find(
                        (scenario) => scenario.id === testCase.scenarioId,
                      );

                      return (
                        <tr key={testCase.id} className="border-t border-slate-100 align-top">
                          <td className="px-4 py-4">
                            <p className="font-bold text-slate-900">{testCase.id.toUpperCase()}</p>
                            <p className="mt-1 text-xs text-slate-500">{testCase.title}</p>
                          </td>
                          <td className="px-4 py-4 text-slate-600">{testCase.objective}</td>
                          <td className="px-4 py-4">
                            <Badge label={priorityLabels[testCase.priority]} />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1">
                              <Badge label={statusLabels[testCase.status]} />
                              {testCase.aiGenerated && (
                                <>
                                  <Badge label="rascunho" variant="draft" />
                                  <Badge label="assistido por IA" variant="ai" />
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Badge label={testLevelLabels[testCase.testLevel]} />
                          </td>
                          <td className="px-4 py-4">
                            <Badge label={automationStatusLabels[testCase.automationStatus]} />
                          </td>
                          <td className="px-4 py-4 text-xs text-slate-600">
                            <p>{linkedRequirement?.id.toUpperCase() ?? testCase.requirementId}</p>
                            <p className="mt-1 text-slate-500">
                              {linkedScenario?.title ?? testCase.scenarioId}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <button
                              type="button"
                              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-700 hover:border-slate-300"
                              onClick={() => startEditingTestCase(testCase)}
                            >
                              Editar caso de teste
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {aiModalOpen && activeScenarioId ? (
        <AiGenerationModal
          isOpen={aiModalOpen}
          mode="test-cases"
          projectId={activeProjectId}
          scenarioId={activeScenarioId}
          scenarioTitle={
            scenarios.find((s) => s.id === activeScenarioId)?.title ?? activeScenarioId
          }
          onClose={() => setAiModalOpen(false)}
          onAccept={handleAiOutputAccepted}
        />
      ) : null}
    </section>
  );
}

function TestCaseSelect<T extends string>({
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
        {options.length === 0 ? <option value="">Sem vínculo disponível</option> : null}
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

function Badge({ label, variant }: { label: string; variant?: "default" | "draft" | "ai" }) {
  const cls =
    variant === "draft"
      ? "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-700 ring-1 ring-amber-300/40"
      : variant === "ai"
        ? "rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700 ring-1 ring-teal-300/40"
        : "rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-900/10";
  return <span className={cls}>{label}</span>;
}

