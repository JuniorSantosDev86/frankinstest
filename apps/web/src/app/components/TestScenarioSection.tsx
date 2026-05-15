"use client";

import { FormEvent, useMemo, useState } from "react";

import type { BusinessRule, ProductModule, Requirement } from "@/lib/business-understanding/types";
import type { Project } from "@/lib/projects/types";
import { AiGenerationModal } from "./AiGenerationModal";
import {
  createTestScenario,
  demoTestCases,
  demoTestScenarios,
  getScenarioDesignSummary,
  listScenariosByProject,
  updateTestScenario,
  validateTestScenarioInput,
} from "@/lib/test-design/testDesignService";
import {
  scenarioPriorities,
  scenarioStatuses,
  scenarioTypes,
  testLevels,
  type ScenarioPriority,
  type ScenarioStatus,
  type ScenarioType,
  type TestLevel,
  type TestScenario,
  type TestScenarioInput,
} from "@/lib/test-design/types";

export const scenarioStorageKey = "frankintest.block04.scenarios";
const testCaseStorageKey = "frankintest.block04.testCases";

const scenarioTypeLabels: Record<ScenarioType, string> = {
  positive: "Positivo",
  negative: "Negativo",
  edge_case: "Caso de borda",
  regression: "Regressão",
  exploratory: "Exploratório",
  security: "Segurança",
  accessibility: "Acessibilidade",
  performance: "Performance",
  integration: "Integração",
};

const priorityLabels: Record<ScenarioPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

const statusLabels: Record<ScenarioStatus, string> = {
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

type ScenarioFormState = {
  projectId: string;
  moduleId: string;
  requirementId: string;
  businessRuleId: string;
  title: string;
  description: string;
  scenarioType: ScenarioType;
  priority: ScenarioPriority;
  status: ScenarioStatus;
  testLevel: TestLevel;
  aiGenerated: boolean;
  reviewedBy: string;
};

const emptyScenarioForm: ScenarioFormState = {
  projectId: "",
  moduleId: "",
  requirementId: "",
  businessRuleId: "",
  title: "",
  description: "",
  scenarioType: "positive",
  priority: "medium",
  status: "draft",
  testLevel: "acceptance",
  aiGenerated: false,
  reviewedBy: "",
};

type TestScenarioSectionProps = {
  projects: Project[];
  modules: ProductModule[];
  requirements: Requirement[];
  businessRules: BusinessRule[];
};

export function TestScenarioSection({
  projects,
  modules,
  requirements,
  businessRules,
}: TestScenarioSectionProps) {
  const [testCases] = useState(() => {
    if (typeof window === "undefined") {
      return demoTestCases;
    }

    const storedTestCases = window.localStorage.getItem(testCaseStorageKey);

    return storedTestCases ? JSON.parse(storedTestCases) : demoTestCases;
  });
  const [scenarios, setScenarios] = useState<TestScenario[]>(() => {
    if (typeof window === "undefined") {
      return demoTestScenarios;
    }

    const storedScenarios = window.localStorage.getItem(scenarioStorageKey);

    return storedScenarios ? (JSON.parse(storedScenarios) as TestScenario[]) : demoTestScenarios;
  });
  const [selectedProjectId, setSelectedProjectId] = useState(() => projects[0]?.id ?? "");
  const activeProjectId = selectedProjectId || projects[0]?.id || "";
  const [formState, setFormState] = useState<ScenarioFormState>({
    ...emptyScenarioForm,
    projectId: activeProjectId,
  });
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
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
  const projectScenarios = useMemo(
    () => listScenariosByProject(activeProjectId, scenarios),
    [activeProjectId, scenarios],
  );
  const summary = useMemo(
    () => getScenarioDesignSummary(activeProjectId, scenarios),
    [activeProjectId, scenarios],
  );
  const selectedProject = projects.find((project) => project.id === activeProjectId);

  function persistScenarios(nextScenarios: TestScenario[]) {
    setScenarios(nextScenarios);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(scenarioStorageKey, JSON.stringify(nextScenarios));
    }
  }

  function resetForm(projectId = activeProjectId) {
    const firstModule = modules.find((module) => module.projectId === projectId);
    const firstRequirement = requirements.find(
      (requirement) => requirement.moduleId === firstModule?.id,
    );
    const firstRule = businessRules.find((rule) => rule.requirementId === firstRequirement?.id);

    setFormState({
      ...emptyScenarioForm,
      projectId,
      moduleId: firstModule?.id ?? "",
      requirementId: firstRequirement?.id ?? "",
      businessRuleId: firstRule?.id ?? "",
    });
    setEditingScenarioId(null);
    setValidationError(false);
  }

  function handleProjectChange(projectId: string) {
    setSelectedProjectId(projectId);
    resetForm(projectId);
  }

  function handleModuleChange(moduleId: string) {
    const firstRequirement = requirements.find((requirement) => requirement.moduleId === moduleId);
    const firstRule = businessRules.find((rule) => rule.requirementId === firstRequirement?.id);

    setFormState((current) => ({
      ...current,
      moduleId,
      requirementId: firstRequirement?.id ?? "",
      businessRuleId: firstRule?.id ?? "",
    }));
  }

  function handleRequirementChange(requirementId: string) {
    const linkedRequirement = requirements.find((requirement) => requirement.id === requirementId);
    const firstRule = businessRules.find((rule) => rule.requirementId === requirementId);

    setFormState((current) => ({
      ...current,
      moduleId: linkedRequirement?.moduleId ?? current.moduleId,
      requirementId,
      businessRuleId: firstRule?.id ?? "",
    }));
  }

  function handleBusinessRuleChange(businessRuleId: string) {
    const linkedRule = businessRules.find((rule) => rule.id === businessRuleId);

    setFormState((current) => ({
      ...current,
      moduleId: linkedRule?.moduleId ?? current.moduleId,
      requirementId: linkedRule?.requirementId ?? current.requirementId,
      businessRuleId,
    }));
  }

  function toScenarioInput(): TestScenarioInput {
    const linkedRule = requirementBusinessRules.find((rule) => rule.id === activeBusinessRuleId);
    const linkedRequirement = moduleRequirements.find(
      (requirement) => requirement.id === (linkedRule?.requirementId ?? activeRequirementId),
    );
    const linkedModule = projectModules.find(
      (module) => module.id === (linkedRule?.moduleId ?? linkedRequirement?.moduleId ?? activeModuleId),
    );

    return {
      ...formState,
      projectId: activeProjectId,
      moduleId: linkedModule?.id ?? activeModuleId,
      requirementId: linkedRequirement?.id ?? activeRequirementId,
      businessRuleId: linkedRule?.id ?? activeBusinessRuleId,
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = toScenarioInput();

    if (validateTestScenarioInput(input).length > 0) {
      setValidationError(true);
      return;
    }

    if (editingScenarioId) {
      persistScenarios(
        scenarios.map((scenario) =>
          scenario.id === editingScenarioId ? updateTestScenario(scenario, input) : scenario,
        ),
      );
    } else {
      persistScenarios([createTestScenario(input), ...scenarios]);
    }

    resetForm(activeProjectId);
  }

  function handleAiOutputAccepted(output: string, aiRunId: string) {
    const linkedRule = requirementBusinessRules.find((rule) => rule.id === activeBusinessRuleId);
    const linkedRequirement = moduleRequirements.find(
      (req) => req.id === (linkedRule?.requirementId ?? activeRequirementId),
    );
    const linkedModule = projectModules.find(
      (mod) => mod.id === (linkedRule?.moduleId ?? linkedRequirement?.moduleId ?? activeModuleId),
    );

    const input: TestScenarioInput = {
      projectId: activeProjectId,
      moduleId: linkedModule?.id ?? activeModuleId,
      requirementId: linkedRequirement?.id ?? activeRequirementId,
      businessRuleId: linkedRule?.id ?? activeBusinessRuleId,
      title: `[IA] Cenários para: ${linkedRule?.title ?? activeBusinessRuleId}`,
      description: output,
      scenarioType: "positive",
      priority: "medium",
      status: "draft",
      testLevel: "acceptance",
      aiGenerated: true,
      reviewedBy: "",
    };

    if (validateTestScenarioInput(input).length === 0) {
      persistScenarios([createTestScenario(input), ...scenarios]);
    }

    void aiRunId;
  }

  function startEditingScenario(scenario: TestScenario) {
    setSelectedProjectId(scenario.projectId);
    setEditingScenarioId(scenario.id);
    setValidationError(false);
    setFormState({
      projectId: scenario.projectId,
      moduleId: scenario.moduleId,
      requirementId: scenario.requirementId,
      businessRuleId: scenario.businessRuleId,
      title: scenario.title,
      description: scenario.description,
      scenarioType: scenario.scenarioType,
      priority: scenario.priority,
      status: scenario.status,
      testLevel: scenario.testLevel,
      aiGenerated: scenario.aiGenerated,
      reviewedBy: scenario.reviewedBy,
    });
  }

  return (
    <section
      id="test-scenarios"
      className="rounded-[1.5rem] border border-slate-900/10 bg-white/90 p-6 shadow-xl shadow-slate-900/5 md:p-8"
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.26em] text-teal-700">
            Desenho de testes
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Cenários de teste
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Visualize, crie e edite cenários determinísticos ligados a regras de negócio.
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
          Projeto -&gt; Módulo -&gt; Requisito -&gt; Regra de negócio -&gt; Cenário de teste
        </p>
        <p className="rounded-2xl border border-slate-900/10 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
          Persistência local de demonstração via localStorage: {scenarioStorageKey}. Sem banco real,
          IA real, casos de teste ou ciclos de execução neste bloco.
        </p>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-900/10 bg-slate-50 p-5">
        <div>
          <h3 className="text-xl font-black tracking-tight text-slate-950">
            Resumo de cenários
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {selectedProject?.name ?? "Nenhum projeto selecionado"}
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryMetric label="Total" value={summary.totalScenarios} />
          <SummaryMetric label="Prontos" value={summary.readyScenarios} />
          <SummaryMetric label="A revisar" value={summary.scenariosNeedingReview} />
          <SummaryMetric label="Críticos" value={summary.criticalScenarios} />
          <SummaryMetric label="Assistidos por IA" value={summary.aiGeneratedScenarios} />
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-2xl border border-slate-900/10 bg-white p-5">
          <h3 className="text-xl font-black tracking-tight text-slate-950">
            {editingScenarioId ? "Editar cenário" : "Novo cenário"}
          </h3>

          <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
            <ScenarioSelect
              label="Módulo"
              value={activeModuleId}
              options={projectModules.map((module) => module.id)}
              labels={Object.fromEntries(projectModules.map((module) => [module.id, module.name]))}
              onChange={handleModuleChange}
            />
            <ScenarioSelect
              label="Requisito"
              value={activeRequirementId}
              options={moduleRequirements.map((requirement) => requirement.id)}
              labels={Object.fromEntries(
                moduleRequirements.map((requirement) => [requirement.id, requirement.title]),
              )}
              onChange={handleRequirementChange}
            />
            <ScenarioSelect
              label="Regra de negócio"
              value={activeBusinessRuleId}
              options={requirementBusinessRules.map((rule) => rule.id)}
              labels={Object.fromEntries(
                requirementBusinessRules.map((rule) => [rule.id, rule.title]),
              )}
              onChange={handleBusinessRuleChange}
            />

            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Título
              <input
                className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                placeholder="Ex.: Validação do fluxo principal"
                value={formState.title}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, title: event.target.value }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Descrição
              <textarea
                className="min-h-24 rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                placeholder="Objetivo, condição de negócio e comportamento esperado."
                value={formState.description}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, description: event.target.value }))
                }
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <ScenarioSelect
                label="Tipo de cenário"
                value={formState.scenarioType}
                options={scenarioTypes}
                labels={scenarioTypeLabels}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, scenarioType: value as ScenarioType }))
                }
              />
              <ScenarioSelect
                label="Prioridade"
                value={formState.priority}
                options={scenarioPriorities}
                labels={priorityLabels}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, priority: value as ScenarioPriority }))
                }
              />
              <ScenarioSelect
                label="Status"
                value={formState.status}
                options={scenarioStatuses}
                labels={statusLabels}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, status: value as ScenarioStatus }))
                }
              />
              <ScenarioSelect
                label="Nível de teste"
                value={formState.testLevel}
                options={testLevels}
                labels={testLevelLabels}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, testLevel: value as TestLevel }))
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
                Revise a cadeia de rastreabilidade e os campos obrigatórios do cenário.
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-teal-800"
              >
                {editingScenarioId ? "Salvar alterações" : "Criar cenário"}
              </button>
              {!editingScenarioId && activeBusinessRuleId ? (
                <button
                  type="button"
                  className="rounded-xl border border-teal-700/30 bg-teal-50 px-4 py-2 text-sm font-black text-teal-800 transition hover:bg-teal-100"
                  onClick={() => setAiModalOpen(true)}
                >
                  Gerar cenários com IA
                </button>
              ) : null}
              {editingScenarioId ? (
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
          {projectScenarios.length === 0 ? (
            <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
              <h3 className="text-xl font-black text-slate-950">
                Nenhum cenário neste projeto
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Crie um cenário ligado a uma regra de negócio para iniciar o desenho de testes.
              </p>
            </section>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-bold">Cenário</th>
                      <th className="px-4 py-3 font-bold">Módulo</th>
                      <th className="px-4 py-3 font-bold">Requisito/Regra</th>
                      <th className="px-4 py-3 font-bold">Prioridade</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 font-bold">Casos</th>
                      <th className="px-4 py-3 font-bold">Automação</th>
                      <th className="px-4 py-3 font-bold">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectScenarios.map((scenario) => {
                      const linkedModule = modules.find((module) => module.id === scenario.moduleId);
                      const linkedRequirement = requirements.find(
                        (requirement) => requirement.id === scenario.requirementId,
                      );
                      const linkedRule = businessRules.find(
                        (rule) => rule.id === scenario.businessRuleId,
                      );
                      const linkedCases = testCases.filter(
                        (testCase: { scenarioId: string; automationStatus: string }) =>
                          testCase.scenarioId === scenario.id,
                      );
                      const automationCount = linkedCases.filter(
                        (testCase: { automationStatus: string }) =>
                          testCase.automationStatus === "automation_candidate" ||
                          testCase.automationStatus === "automated",
                      ).length;

                      return (
                        <tr key={scenario.id} className="border-t border-slate-100 align-top">
                          <td className="px-4 py-4">
                            <p className="font-bold text-slate-900">{scenario.title}</p>
                            <p className="mt-1 max-w-xs text-xs text-slate-500">
                              {scenario.description || "Sem descrição informada."}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-slate-600">
                            {linkedModule?.name ?? scenario.moduleId}
                          </td>
                          <td className="px-4 py-4 text-slate-600">
                            <p>{linkedRequirement?.id.toUpperCase() ?? scenario.requirementId}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {linkedRule?.title ?? scenario.businessRuleId}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <Badge label={priorityLabels[scenario.priority]} />
                          </td>
                          <td className="px-4 py-4">
                            <Badge label={statusLabels[scenario.status]} />
                          </td>
                          <td className="px-4 py-4 text-slate-600">{linkedCases.length}</td>
                          <td className="px-4 py-4 text-slate-600">
                            {automationCount}/{linkedCases.length || 0} com potencial
                          </td>
                          <td className="px-4 py-4">
                            <button
                              type="button"
                              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-700 hover:border-slate-300"
                              onClick={() => startEditingScenario(scenario)}
                            >
                              Editar cenário
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

      {aiModalOpen && activeBusinessRuleId ? (
        <AiGenerationModal
          isOpen={aiModalOpen}
          mode="scenarios"
          projectId={activeProjectId}
          businessRuleId={activeBusinessRuleId}
          businessRuleTitle={
            requirementBusinessRules.find((r) => r.id === activeBusinessRuleId)?.title ??
            activeBusinessRuleId
          }
          onClose={() => setAiModalOpen(false)}
          onAccept={handleAiOutputAccepted}
        />
      ) : null}
    </section>
  );
}

function ScenarioSelect<T extends string>({
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

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-900/10">
      {label}
    </span>
  );
}

