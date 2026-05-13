"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { getMockSession } from "@/lib/auth/mockSession";
import {
  createBusinessRule,
  createModule,
  createRequirement,
  demoBusinessRules,
  demoProductModules,
  demoRequirements,
  getBusinessUnderstandingSummary,
  getModuleTraceability,
  listBusinessRulesByProject,
  listRequirementsByProject,
  updateBusinessRule,
  updateModule,
  updateRequirement,
  validateBusinessRuleInput,
  validateModuleInput,
  validateRequirementInput,
} from "@/lib/business-understanding/businessUnderstandingService";
import {
  businessRulePriorities,
  businessRuleStatuses,
  moduleCriticalities,
  moduleStatuses,
  requirementSources,
  requirementStatuses,
  type BusinessRule,
  type BusinessRuleInput,
  type BusinessRulePriority,
  type BusinessRuleStatus,
  type ModuleCriticality,
  type ModuleStatus,
  type ProductModule,
  type ProductModuleInput,
  type Requirement,
  type RequirementInput,
  type RequirementSource,
  type RequirementStatus,
} from "@/lib/business-understanding/types";
import {
  canCreateProjectWithInput,
  createProject,
  demoProjects,
  updateProject,
  validateProjectInput,
} from "@/lib/projects/projectService";
import {
  projectStatuses,
  projectTypes,
  qaMaturityLevels,
  riskLevels,
  type Project,
  type ProjectInput,
  type ProjectStatus,
  type ProjectType,
  type QaMaturity,
  type RiskLevel,
} from "@/lib/projects/types";
import { demoTestCases, demoTestScenarios } from "@/lib/test-design/testDesignService";
import { getMembership } from "@/lib/workspace/access";
import { BugReportSection } from "./components/BugReportSection";
import { EvidenceSection } from "./components/EvidenceSection";
import { InsightCards } from "./components/InsightCards";
import { MetricCard } from "./components/MetricCard";
import { QuickActions } from "./components/QuickActions";
import { ReportSection } from "./components/ReportSection";
import { TestScenarioSection } from "./components/TestScenarioSection";
import { TestCaseSection } from "./components/TestCaseSection";
import { TestSuiteSection } from "./components/TestSuiteSection";
import { TestCycleSection } from "./components/TestCycleSection";
import { TestExecutionSection } from "./components/TestExecutionSection";
import { TraceabilityFlow } from "./components/TraceabilityFlow";
import { defaultLocale, isSupportedLocale, supportedLocales, translations, type Locale } from "./i18n";

const projectStorageKey = "frankintest.block02.projects";
const moduleStorageKey = "frankintest.block03.modules";
const requirementStorageKey = "frankintest.block03.requirements";
const businessRuleStorageKey = "frankintest.block03.businessRules";

type ProjectFormState = {
  name: string;
  type: ProjectType;
  description: string;
  targetUrl: string;
  qaMaturity: QaMaturity;
  riskLevel: RiskLevel;
  status: ProjectStatus;
};

const emptyProjectForm: ProjectFormState = {
  name: "",
  type: "saas",
  description: "",
  targetUrl: "",
  qaMaturity: "unknown",
  riskLevel: "medium",
  status: "active",
};

type ModuleFormState = {
  name: string;
  description: string;
  criticality: ModuleCriticality;
  status: ModuleStatus;
};

const emptyModuleForm: ModuleFormState = {
  name: "",
  description: "",
  criticality: "medium",
  status: "active",
};

type RequirementFormState = {
  moduleId: string;
  title: string;
  description: string;
  source: RequirementSource;
  status: RequirementStatus;
  aiGenerated: boolean;
  reviewedBy: string;
};

const emptyRequirementForm: RequirementFormState = {
  moduleId: "",
  title: "",
  description: "",
  source: "user_input",
  status: "draft",
  aiGenerated: false,
  reviewedBy: "",
};

type BusinessRuleFormState = {
  requirementId: string;
  title: string;
  ruleText: string;
  priority: BusinessRulePriority;
  status: BusinessRuleStatus;
  aiGenerated: boolean;
  reviewedBy: string;
};

const emptyBusinessRuleForm: BusinessRuleFormState = {
  requirementId: "",
  title: "",
  ruleText: "",
  priority: "medium",
  status: "draft",
  aiGenerated: false,
  reviewedBy: "",
};

export default function Home() {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [projects, setProjects] = useState<Project[]>(demoProjects);
  const [modules, setModules] = useState<ProductModule[]>(demoProductModules);
  const [requirements, setRequirements] = useState<Requirement[]>(demoRequirements);
  const [businessRules, setBusinessRules] = useState<BusinessRule[]>(demoBusinessRules);
  const [hasLoadedLocalWorkspace, setHasLoadedLocalWorkspace] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(() => demoProjects[0]?.id ?? "");
  const [formState, setFormState] = useState<ProjectFormState>(emptyProjectForm);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState(false);
  const [moduleFormState, setModuleFormState] = useState<ModuleFormState>(emptyModuleForm);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleValidationError, setModuleValidationError] = useState(false);
  const [requirementFormState, setRequirementFormState] =
    useState<RequirementFormState>(emptyRequirementForm);
  const [editingRequirementId, setEditingRequirementId] = useState<string | null>(null);
  const [requirementValidationError, setRequirementValidationError] = useState(false);
  const [businessRuleFormState, setBusinessRuleFormState] =
    useState<BusinessRuleFormState>(emptyBusinessRuleForm);
  const [editingBusinessRuleId, setEditingBusinessRuleId] = useState<string | null>(null);
  const [businessRuleValidationError, setBusinessRuleValidationError] = useState(false);
  const t = translations[locale];
  const session = getMockSession();
  const membership = getMembership(session.user, session.activeOrganization);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedProjects = window.localStorage.getItem(projectStorageKey);
      const storedModules = window.localStorage.getItem(moduleStorageKey);
      const storedRequirements = window.localStorage.getItem(requirementStorageKey);
      const storedBusinessRules = window.localStorage.getItem(businessRuleStorageKey);

      if (storedProjects) {
        setProjects(JSON.parse(storedProjects) as Project[]);
      }

      if (storedModules) {
        setModules(JSON.parse(storedModules) as ProductModule[]);
      }

      if (storedRequirements) {
        setRequirements(JSON.parse(storedRequirements) as Requirement[]);
      }

      if (storedBusinessRules) {
        setBusinessRules(JSON.parse(storedBusinessRules) as BusinessRule[]);
      }

      setHasLoadedLocalWorkspace(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasLoadedLocalWorkspace) {
      return;
    }

    window.localStorage.setItem(projectStorageKey, JSON.stringify(projects));
  }, [hasLoadedLocalWorkspace, projects]);

  useEffect(() => {
    if (!hasLoadedLocalWorkspace) {
      return;
    }

    window.localStorage.setItem(moduleStorageKey, JSON.stringify(modules));
  }, [hasLoadedLocalWorkspace, modules]);

  useEffect(() => {
    if (!hasLoadedLocalWorkspace) {
      return;
    }

    window.localStorage.setItem(requirementStorageKey, JSON.stringify(requirements));
  }, [hasLoadedLocalWorkspace, requirements]);

  useEffect(() => {
    if (!hasLoadedLocalWorkspace) {
      return;
    }

    window.localStorage.setItem(businessRuleStorageKey, JSON.stringify(businessRules));
  }, [businessRules, hasLoadedLocalWorkspace]);

  const visibleProjects = useMemo(
    () => projects.filter((project) => project.organizationId === session.activeOrganization.id),
    [projects, session.activeOrganization.id],
  );

  const selectedProject =
    visibleProjects.find((project) => project.id === selectedProjectId) ?? visibleProjects[0];
  const activeProjectId = selectedProject?.id ?? "";
  const projectModules = useMemo(
    () => modules.filter((module) => module.projectId === activeProjectId),
    [activeProjectId, modules],
  );
  const projectRequirements = useMemo(
    () => listRequirementsByProject(activeProjectId, requirements),
    [activeProjectId, requirements],
  );
  const projectBusinessRules = useMemo(
    () => listBusinessRulesByProject(activeProjectId, businessRules),
    [activeProjectId, businessRules],
  );
  const traceabilitySummary = useMemo(
    () => getBusinessUnderstandingSummary(activeProjectId, modules, requirements, businessRules),
    [activeProjectId, businessRules, modules, requirements],
  );
  const moduleTraceability = useMemo(
    () => getModuleTraceability(activeProjectId, modules, requirements, businessRules),
    [activeProjectId, businessRules, modules, requirements],
  );
  const activeRequirementModuleId = requirementFormState.moduleId || projectModules[0]?.id || "";
  const activeBusinessRuleRequirementId =
    businessRuleFormState.requirementId || projectRequirements[0]?.id || "";
  const totalScenarios = demoTestScenarios.length;
  const totalTestCases = demoTestCases.length;
  const criticalRisks = businessRules.filter((rule) => rule.priority === "critical").length;
  const automationCandidates = demoTestCases.filter(
    (testCase) => testCase.automationStatus === "automation_candidate",
  ).length;
  const traceabilityNodes = useMemo(
    () => [
      {
        label: "Projeto",
        value: selectedProject?.name ?? "Workspace padrão",
        detail: `${projectModules.length} módulos`,
      },
      {
        label: "Módulo",
        value: projectModules[0]?.name ?? "Módulo não definido",
        detail: `${projectRequirements.length} requisitos`,
      },
      {
        label: "Requisito",
        value: projectRequirements[0]?.id?.toUpperCase() ?? "REQ-demo",
        detail: projectRequirements[0]?.title ?? "Validação recomendada",
      },
      {
        label: "Regra de negócio",
        value: projectBusinessRules[0]?.id?.toUpperCase() ?? "RN-demo",
        detail: projectBusinessRules[0]?.title ?? "Regra requer confirmação",
      },
      {
        label: "Cenário",
        value: demoTestScenarios[0]?.title ?? "Cenário de teste",
        detail: `${totalScenarios} cenários no workspace`,
      },
      {
        label: "Caso de teste",
        value: demoTestCases[0]?.id.toUpperCase() ?? "CT-demo",
        detail: `${totalTestCases} casos no workspace`,
      },
    ],
    [
      projectBusinessRules,
      projectModules,
      projectRequirements,
      selectedProject?.name,
      totalScenarios,
      totalTestCases,
    ],
  );

  function resetForm() {
    setFormState(emptyProjectForm);
    setEditingProjectId(null);
    setValidationError(false);
  }

  function toProjectInput(): ProjectInput {
    return {
      organizationId: session.activeOrganization.id,
      ...formState,
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = toProjectInput();

    if (
      !canCreateProjectWithInput(session.user, session.activeOrganization, input) ||
      validateProjectInput(input).length > 0
    ) {
      setValidationError(true);
      return;
    }

    if (editingProjectId) {
      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.id === editingProjectId ? updateProject(project, input) : project,
        ),
      );
    } else {
      setProjects((currentProjects) => [createProject(input), ...currentProjects]);
    }

    resetForm();
  }

  function startEditing(project: Project) {
    setEditingProjectId(project.id);
    setValidationError(false);
    setFormState({
      name: project.name,
      type: project.type,
      description: project.description,
      targetUrl: project.targetUrl,
      qaMaturity: project.qaMaturity,
      riskLevel: project.riskLevel,
      status: project.status,
    });
  }

  function removeProject(projectId: string) {
    if (!window.confirm(t.projects.deleteConfirm)) {
      return;
    }

    setProjects((currentProjects) => currentProjects.filter((project) => project.id !== projectId));

    if (editingProjectId === projectId) {
      resetForm();
    }
  }

  function resetModuleForm() {
    setModuleFormState(emptyModuleForm);
    setEditingModuleId(null);
    setModuleValidationError(false);
  }

  function resetRequirementForm() {
    setRequirementFormState({
      ...emptyRequirementForm,
      moduleId: projectModules[0]?.id ?? "",
    });
    setEditingRequirementId(null);
    setRequirementValidationError(false);
  }

  function resetBusinessRuleForm() {
    setBusinessRuleFormState({
      ...emptyBusinessRuleForm,
      requirementId: projectRequirements[0]?.id ?? "",
    });
    setEditingBusinessRuleId(null);
    setBusinessRuleValidationError(false);
  }

  function handleModuleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input: ProductModuleInput = {
      projectId: activeProjectId,
      ...moduleFormState,
    };

    if (validateModuleInput(input).length > 0) {
      setModuleValidationError(true);
      return;
    }

    if (editingModuleId) {
      setModules((currentModules) =>
        currentModules.map((module) =>
          module.id === editingModuleId ? updateModule(module, input) : module,
        ),
      );
    } else {
      setModules((currentModules) => [createModule(input), ...currentModules]);
    }

    resetModuleForm();
  }

  function startEditingModule(module: ProductModule) {
    setEditingModuleId(module.id);
    setModuleValidationError(false);
    setModuleFormState({
      name: module.name,
      description: module.description,
      criticality: module.criticality,
      status: module.status,
    });
  }

  function handleRequirementSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const linkedModule = projectModules.find(
      (module) => module.id === activeRequirementModuleId,
    );
    const input: RequirementInput = {
      projectId: activeProjectId,
      ...requirementFormState,
      moduleId: linkedModule?.id ?? activeRequirementModuleId,
    };

    if (validateRequirementInput(input).length > 0 || !linkedModule) {
      setRequirementValidationError(true);
      return;
    }

    if (editingRequirementId) {
      setRequirements((currentRequirements) =>
        currentRequirements.map((requirement) =>
          requirement.id === editingRequirementId ? updateRequirement(requirement, input) : requirement,
        ),
      );
    } else {
      setRequirements((currentRequirements) => [createRequirement(input), ...currentRequirements]);
    }

    resetRequirementForm();
  }

  function startEditingRequirement(requirement: Requirement) {
    setEditingRequirementId(requirement.id);
    setRequirementValidationError(false);
    setRequirementFormState({
      moduleId: requirement.moduleId,
      title: requirement.title,
      description: requirement.description,
      source: requirement.source,
      status: requirement.status,
      aiGenerated: requirement.aiGenerated,
      reviewedBy: requirement.reviewedBy,
    });
  }

  function handleBusinessRuleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const linkedRequirement = projectRequirements.find(
      (requirement) => requirement.id === activeBusinessRuleRequirementId,
    );
    const input: BusinessRuleInput = {
      projectId: activeProjectId,
      moduleId: linkedRequirement?.moduleId ?? "",
      ...businessRuleFormState,
      requirementId: linkedRequirement?.id ?? activeBusinessRuleRequirementId,
    };

    if (validateBusinessRuleInput(input).length > 0 || !linkedRequirement) {
      setBusinessRuleValidationError(true);
      return;
    }

    if (editingBusinessRuleId) {
      setBusinessRules((currentRules) =>
        currentRules.map((rule) =>
          rule.id === editingBusinessRuleId ? updateBusinessRule(rule, input) : rule,
        ),
      );
    } else {
      setBusinessRules((currentRules) => [createBusinessRule(input), ...currentRules]);
    }

    resetBusinessRuleForm();
  }

  function startEditingBusinessRule(rule: BusinessRule) {
    setEditingBusinessRuleId(rule.id);
    setBusinessRuleValidationError(false);
    setBusinessRuleFormState({
      requirementId: rule.requirementId,
      title: rule.title,
      ruleText: rule.ruleText,
      priority: rule.priority,
      status: rule.status,
      aiGenerated: rule.aiGenerated,
      reviewedBy: rule.reviewedBy,
    });
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(135deg,#f8faf7_0%,#eef7f2_42%,#e1ece8_100%)]" />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:flex-row lg:py-6">
        <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-72">
          <div className="flex h-full flex-col rounded-[1.5rem] border border-slate-900/10 bg-slate-950 p-5 text-white shadow-2xl shadow-slate-900/20">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-xl bg-teal-300 text-sm font-black text-slate-950">
                FIT
              </div>
              <div>
                <p className="text-lg font-black tracking-tight">FrankInTest</p>
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-teal-200">
                  QA Lead SaaS
                </p>
              </div>
            </div>

            <label className="mt-6 grid gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
              {t.languageSelector.label}
              <select
                aria-label={t.languageSelector.ariaLabel}
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-semibold normal-case tracking-normal text-white outline-none transition hover:border-teal-200/60 focus:border-teal-200"
                data-default-locale={defaultLocale}
                value={locale}
                onChange={(event) => {
                  const nextLocale = event.target.value;

                  if (isSupportedLocale(nextLocale)) {
                    setLocale(nextLocale);
                  }
                }}
              >
                {supportedLocales.map((supportedLocale) => (
                  <option key={supportedLocale.key} value={supportedLocale.key}>
                    {supportedLocale.label}
                  </option>
                ))}
              </select>
            </label>

            <section className="mt-5 rounded-2xl border border-teal-200/20 bg-teal-200/10 p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-100">
                {t.auth.demoLabel}
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {t.auth.signedInAs} {session.user.name}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-300">{session.user.email}</p>
              <p className="mt-3 text-xs leading-5 text-slate-300">{t.auth.localOnly}</p>
            </section>

            <nav className="mt-6 grid gap-2" aria-label="Main navigation">
              {t.navigationItems.map((item) => (
                <a
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className={`group rounded-xl border px-4 py-3 transition ${
                    item.href === "#control-tower"
                      ? "border-teal-200/50 bg-teal-300/20"
                      : "border-white/10 bg-white/[0.03] hover:border-teal-200/60 hover:bg-teal-200/10"
                  }`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-100">{item.label}</span>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-300 group-hover:text-teal-100">
                      {item.status}
                    </span>
                  </span>
                </a>
              ))}
            </nav>

            <div className="mt-auto rounded-2xl border border-teal-200/20 bg-teal-200/10 p-4">
              <p className="text-sm font-bold text-teal-100">{t.productRule.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{t.productRule.description}</p>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-6">
          <header
            id="control-tower"
            className="relative overflow-hidden rounded-[1.5rem] border border-slate-900/10 bg-white/90 p-6 shadow-xl shadow-slate-900/5 backdrop-blur md:p-8"
          >
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-cyan-100/70 via-transparent to-indigo-100/60" />

            <div className="relative z-10 flex flex-wrap items-center justify-end gap-3">
              <label className="sr-only" htmlFor="hero-locale-selector">
                {t.languageSelector.label}
              </label>
              <select
                id="hero-locale-selector"
                aria-label={t.languageSelector.ariaLabel}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500"
                data-default-locale={defaultLocale}
                value={locale}
                onChange={(event) => {
                  const nextLocale = event.target.value;

                  if (isSupportedLocale(nextLocale)) {
                    setLocale(nextLocale);
                  }
                }}
              >
                {supportedLocales.map((supportedLocale) => (
                  <option key={supportedLocale.key} value={supportedLocale.key}>
                    {supportedLocale.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
              >
                Últimos 30 dias
              </button>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-right">
                <p className="text-sm font-black text-slate-900">{session.user.name}</p>
                <p className="text-xs text-slate-500">QA Manager</p>
              </div>
            </div>

            <div className="relative z-10 mt-5 inline-flex rounded-full border border-teal-700/20 bg-teal-50 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-teal-800">
              {t.controlTowerBadge}
            </div>
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.28em] text-teal-700">
                {t.hero.eyebrow}
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                {t.hero.title}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                {t.hero.description}
              </p>
            </div>

            <div className="mt-8 grid gap-3 lg:grid-cols-[1fr_1fr]">
              <section className="rounded-2xl border border-slate-900/10 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  {t.workspace.activeWorkspace}
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  {session.activeOrganization.name}
                </h2>
                <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                  <p>
                    <span className="font-bold text-slate-900">{t.workspace.plan}: </span>
                    {session.activeOrganization.plan}
                  </p>
                  <p>
                    <span className="font-bold text-slate-900">{t.workspace.credits}: </span>
                    {session.activeOrganization.creditBalance}
                  </p>
                  <p>
                    <span className="font-bold text-slate-900">{t.workspace.role}: </span>
                    {membership?.role ?? "viewer"}
                  </p>
                </div>
              </section>

              <section className="rounded-2xl border border-amber-900/15 bg-amber-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-800">
                  {t.auth.demoLabel}
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-amber-950">{t.auth.mode}</p>
                <p className="mt-2 text-sm leading-6 text-amber-900">{t.auth.localOnly}</p>
              </section>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Total de projetos"
                value={String(visibleProjects.length)}
                trend="2 novos este mês"
                tone="teal"
              />
              <MetricCard
                title="Cenários de teste"
                value={String(totalScenarios)}
                trend="18% vs mês anterior"
                tone="violet"
              />
              <MetricCard
                title="Casos de teste"
                value={String(totalTestCases)}
                trend="24% vs mês anterior"
                tone="blue"
              />
              <MetricCard
                title="Riscos críticos"
                value={String(criticalRisks)}
                trend="riscos potenciais"
                tone="red"
              />
              <MetricCard
                title="Candidatos à automação"
                value={String(automationCandidates)}
                trend="validação recomendada"
                tone="orange"
              />
            </div>
          </header>

          <TraceabilityFlow nodes={traceabilityNodes} />

          <InsightCards />

          <QuickActions />

          <section
            id="projects"
            className="rounded-[1.5rem] border border-slate-900/10 bg-white/90 p-6 shadow-xl shadow-slate-900/5 md:p-8"
          >
            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.26em] text-teal-700">
                  {t.projects.eyebrow}
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  {t.projects.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{t.projects.description}</p>
                <p className="mt-4 rounded-2xl border border-slate-900/10 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
                  {t.projects.persistenceNote}
                </p>

                <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
                  <h3 className="text-xl font-black tracking-tight text-slate-950">
                    {editingProjectId ? t.projects.editTitle : t.projects.createTitle}
                  </h3>

                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    {t.projects.fields.name}
                    <input
                      className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                      placeholder={t.projects.placeholders.name}
                      value={formState.name}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, name: event.target.value }))
                      }
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <ProjectSelect
                      label={t.projects.fields.type}
                      value={formState.type}
                      options={projectTypes}
                      labels={t.projects.options.types}
                      onChange={(value) =>
                        setFormState((current) => ({ ...current, type: value }))
                      }
                    />
                    <ProjectSelect
                      label={t.projects.fields.qaMaturity}
                      value={formState.qaMaturity}
                      options={qaMaturityLevels}
                      labels={t.projects.options.qaMaturity}
                      onChange={(value) =>
                        setFormState((current) => ({ ...current, qaMaturity: value }))
                      }
                    />
                    <ProjectSelect
                      label={t.projects.fields.riskLevel}
                      value={formState.riskLevel}
                      options={riskLevels}
                      labels={t.projects.options.riskLevel}
                      onChange={(value) =>
                        setFormState((current) => ({ ...current, riskLevel: value }))
                      }
                    />
                    <ProjectSelect
                      label={t.projects.fields.status}
                      value={formState.status}
                      options={projectStatuses}
                      labels={t.projects.options.status}
                      onChange={(value) =>
                        setFormState((current) => ({ ...current, status: value }))
                      }
                    />
                  </div>

                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    {t.projects.fields.targetUrl}
                    <input
                      className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                      placeholder={t.projects.placeholders.targetUrl}
                      value={formState.targetUrl}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, targetUrl: event.target.value }))
                      }
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    {t.projects.fields.description}
                    <textarea
                      className="min-h-28 rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                      placeholder={t.projects.placeholders.description}
                      value={formState.description}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                    />
                  </label>

                  {validationError ? (
                    <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
                      {t.projects.validationError}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-teal-800"
                    >
                      {editingProjectId ? t.projects.actions.update : t.projects.actions.create}
                    </button>
                    {editingProjectId ? (
                      <button
                        type="button"
                        className="rounded-xl border border-slate-900/10 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-slate-400"
                        onClick={resetForm}
                      >
                        {t.projects.actions.cancel}
                      </button>
                    ) : null}
                  </div>
                </form>
              </div>

              <div className="grid content-start gap-4">
                {visibleProjects.length === 0 ? (
                  <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
                    <h3 className="text-xl font-black text-slate-950">{t.projects.emptyTitle}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {t.projects.emptyDescription}
                    </p>
                  </section>
                ) : (
                  visibleProjects.map((project) => (
                    <article
                      key={project.id}
                      className="rounded-2xl border border-slate-900/10 bg-slate-50 p-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-xl font-black tracking-tight text-slate-950">
                            {project.name}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {project.description || t.projects.summaryLabel}
                          </p>
                        </div>
                        <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-700 ring-1 ring-slate-900/10">
                          {t.projects.options.status[project.status]}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                        <ProjectMeta
                          label={t.projects.fields.type}
                          value={t.projects.options.types[project.type]}
                        />
                        <ProjectMeta
                          label={t.projects.fields.riskLevel}
                          value={t.projects.options.riskLevel[project.riskLevel]}
                        />
                        <ProjectMeta
                          label={t.projects.fields.qaMaturity}
                          value={t.projects.options.qaMaturity[project.qaMaturity]}
                        />
                        <ProjectMeta
                          label={t.projects.targetUrlLabel}
                          value={project.targetUrl || t.projects.noTargetUrl}
                        />
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 text-sm font-black text-slate-700 transition hover:border-teal-600"
                          onClick={() => startEditing(project)}
                        >
                          {t.projects.actions.edit}
                        </button>
                        <button
                          type="button"
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-black text-rose-800 transition hover:border-rose-400"
                          onClick={() => removeProject(project.id)}
                        >
                          {t.projects.actions.delete}
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </section>

          <section
            id="business-understanding"
            className="rounded-[1.5rem] border border-slate-900/10 bg-white/90 p-6 shadow-xl shadow-slate-900/5 md:p-8"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-black uppercase tracking-[0.26em] text-teal-700">
                  {t.businessUnderstanding.eyebrow}
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  {t.businessUnderstanding.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {t.businessUnderstanding.description}
                </p>
              </div>
              <label className="grid min-w-72 gap-2 text-sm font-bold text-slate-700">
                {t.businessUnderstanding.projectSelectLabel}
                <select
                  className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                  value={activeProjectId}
                  onChange={(event) => {
                    setSelectedProjectId(event.target.value);
                    resetModuleForm();
                    setRequirementFormState(emptyRequirementForm);
                    setBusinessRuleFormState(emptyBusinessRuleForm);
                  }}
                >
                  {visibleProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1.2fr]">
              <p className="rounded-2xl border border-teal-800/15 bg-teal-50 px-4 py-3 text-sm font-black text-teal-900">
                {t.businessUnderstanding.workflowLabel}
              </p>
              <p className="rounded-2xl border border-slate-900/10 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
                {t.businessUnderstanding.persistenceNote}
              </p>
            </div>

            <section className="mt-6 rounded-2xl border border-slate-900/10 bg-slate-50 p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-black tracking-tight text-slate-950">
                    {t.businessUnderstanding.summaryTitle}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {selectedProject?.name ?? t.projects.emptyTitle}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                <SummaryMetric
                  label={t.businessUnderstanding.summaryMetrics.totalModules}
                  value={traceabilitySummary.totalModules}
                />
                <SummaryMetric
                  label={t.businessUnderstanding.summaryMetrics.totalRequirements}
                  value={traceabilitySummary.totalRequirements}
                />
                <SummaryMetric
                  label={t.businessUnderstanding.summaryMetrics.totalBusinessRules}
                  value={traceabilitySummary.totalBusinessRules}
                />
                <SummaryMetric
                  label={t.businessUnderstanding.summaryMetrics.criticalModules}
                  value={traceabilitySummary.criticalModules}
                />
                <SummaryMetric
                  label={t.businessUnderstanding.summaryMetrics.requirementsNeedingReview}
                  value={traceabilitySummary.requirementsNeedingReview}
                />
                <SummaryMetric
                  label={t.businessUnderstanding.summaryMetrics.businessRulesNeedingReview}
                  value={traceabilitySummary.businessRulesNeedingReview}
                />
              </div>
            </section>

            <div className="mt-6 grid gap-6 xl:grid-cols-3">
              <section className="rounded-2xl border border-slate-900/10 bg-white p-5">
                <h3 className="text-xl font-black tracking-tight text-slate-950">
                  {t.businessUnderstanding.modules.title}
                </h3>
                <form onSubmit={handleModuleSubmit} className="mt-4 grid gap-3">
                  <p className="text-sm font-black text-slate-700">
                    {editingModuleId
                      ? t.businessUnderstanding.modules.editTitle
                      : t.businessUnderstanding.modules.createTitle}
                  </p>
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    {t.businessUnderstanding.modules.fields.name}
                    <input
                      className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                      placeholder={t.businessUnderstanding.modules.placeholders.name}
                      value={moduleFormState.name}
                      onChange={(event) =>
                        setModuleFormState((current) => ({ ...current, name: event.target.value }))
                      }
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    {t.businessUnderstanding.modules.fields.description}
                    <textarea
                      className="min-h-24 rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                      placeholder={t.businessUnderstanding.modules.placeholders.description}
                      value={moduleFormState.description}
                      onChange={(event) =>
                        setModuleFormState((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <ProjectSelect
                    label={t.businessUnderstanding.modules.fields.criticality}
                    value={moduleFormState.criticality}
                    options={moduleCriticalities}
                    labels={t.businessUnderstanding.modules.options.criticality}
                    onChange={(value) =>
                      setModuleFormState((current) => ({ ...current, criticality: value }))
                    }
                  />
                  <ProjectSelect
                    label={t.businessUnderstanding.modules.fields.status}
                    value={moduleFormState.status}
                    options={moduleStatuses}
                    labels={t.businessUnderstanding.modules.options.status}
                    onChange={(value) =>
                      setModuleFormState((current) => ({ ...current, status: value }))
                    }
                  />
                  {moduleValidationError ? (
                    <ValidationMessage message={t.businessUnderstanding.validationError} />
                  ) : null}
                  <FormActions
                    isEditing={Boolean(editingModuleId)}
                    createLabel={t.businessUnderstanding.actions.create}
                    updateLabel={t.businessUnderstanding.actions.update}
                    cancelLabel={t.businessUnderstanding.actions.cancel}
                    onCancel={resetModuleForm}
                  />
                </form>

                <div className="mt-5 grid gap-3">
                  {projectModules.length === 0 ? (
                    <EmptyState
                      title={t.businessUnderstanding.modules.emptyTitle}
                      description={t.businessUnderstanding.modules.emptyDescription}
                    />
                  ) : (
                    moduleTraceability.map((item) => (
                      <article
                        key={item.module.id}
                        className="rounded-2xl border border-slate-900/10 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-base font-black text-slate-950">
                            {item.module.name}
                          </h4>
                          <button
                            type="button"
                            className="rounded-lg border border-slate-900/10 bg-white px-3 py-1.5 text-xs font-black text-slate-700"
                            onClick={() => startEditingModule(item.module)}
                          >
                            {t.businessUnderstanding.actions.edit}
                          </button>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {item.module.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge
                            label={
                              t.businessUnderstanding.modules.options.criticality[
                                item.module.criticality
                              ]
                            }
                          />
                          <Badge
                            label={t.businessUnderstanding.modules.options.status[item.module.status]}
                          />
                          <Badge
                            label={`${item.requirementCount} ${t.businessUnderstanding.summaryMetrics.totalRequirements}`}
                          />
                          <Badge
                            label={`${item.businessRuleCount} ${t.businessUnderstanding.summaryMetrics.totalBusinessRules}`}
                          />
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-900/10 bg-white p-5">
                <h3 className="text-xl font-black tracking-tight text-slate-950">
                  {t.businessUnderstanding.requirements.title}
                </h3>
                <form onSubmit={handleRequirementSubmit} className="mt-4 grid gap-3">
                  <p className="text-sm font-black text-slate-700">
                    {editingRequirementId
                      ? t.businessUnderstanding.requirements.editTitle
                      : t.businessUnderstanding.requirements.createTitle}
                  </p>
                  <ProjectSelect
                    label={t.businessUnderstanding.requirements.fields.moduleId}
                    value={activeRequirementModuleId}
                    options={projectModules.map((module) => module.id)}
                    labels={Object.fromEntries(
                      projectModules.map((module) => [module.id, module.name]),
                    )}
                    onChange={(value) =>
                      setRequirementFormState((current) => ({ ...current, moduleId: value }))
                    }
                  />
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    {t.businessUnderstanding.requirements.fields.title}
                    <input
                      className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                      placeholder={t.businessUnderstanding.requirements.placeholders.title}
                      value={requirementFormState.title}
                      onChange={(event) =>
                        setRequirementFormState((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    {t.businessUnderstanding.requirements.fields.description}
                    <textarea
                      className="min-h-24 rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                      placeholder={t.businessUnderstanding.requirements.placeholders.description}
                      value={requirementFormState.description}
                      onChange={(event) =>
                        setRequirementFormState((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <ProjectSelect
                    label={t.businessUnderstanding.requirements.fields.source}
                    value={requirementFormState.source}
                    options={requirementSources}
                    labels={t.businessUnderstanding.requirements.options.source}
                    onChange={(value) =>
                      setRequirementFormState((current) => ({ ...current, source: value }))
                    }
                  />
                  <ProjectSelect
                    label={t.businessUnderstanding.requirements.fields.status}
                    value={requirementFormState.status}
                    options={requirementStatuses}
                    labels={t.businessUnderstanding.requirements.options.status}
                    onChange={(value) =>
                      setRequirementFormState((current) => ({ ...current, status: value }))
                    }
                  />
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={requirementFormState.aiGenerated}
                      onChange={(event) =>
                        setRequirementFormState((current) => ({
                          ...current,
                          aiGenerated: event.target.checked,
                        }))
                      }
                    />
                    {t.businessUnderstanding.requirements.fields.aiGenerated}
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    {t.businessUnderstanding.requirements.fields.reviewedBy}
                    <input
                      className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                      placeholder={t.businessUnderstanding.requirements.placeholders.reviewedBy}
                      value={requirementFormState.reviewedBy}
                      onChange={(event) =>
                        setRequirementFormState((current) => ({
                          ...current,
                          reviewedBy: event.target.value,
                        }))
                      }
                    />
                  </label>
                  {requirementValidationError ? (
                    <ValidationMessage message={t.businessUnderstanding.validationError} />
                  ) : null}
                  <FormActions
                    isEditing={Boolean(editingRequirementId)}
                    createLabel={t.businessUnderstanding.actions.create}
                    updateLabel={t.businessUnderstanding.actions.update}
                    cancelLabel={t.businessUnderstanding.actions.cancel}
                    onCancel={resetRequirementForm}
                  />
                </form>

                <div className="mt-5 grid gap-3">
                  {projectRequirements.length === 0 ? (
                    <EmptyState
                      title={t.businessUnderstanding.requirements.emptyTitle}
                      description={t.businessUnderstanding.requirements.emptyDescription}
                    />
                  ) : (
                    projectRequirements.map((requirement) => {
                      const linkedModule = projectModules.find(
                        (module) => module.id === requirement.moduleId,
                      );

                      return (
                        <article
                          key={requirement.id}
                          className="rounded-2xl border border-slate-900/10 bg-slate-50 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="text-base font-black text-slate-950">
                              {requirement.title}
                            </h4>
                            <button
                              type="button"
                              className="rounded-lg border border-slate-900/10 bg-white px-3 py-1.5 text-xs font-black text-slate-700"
                              onClick={() => startEditingRequirement(requirement)}
                            >
                              {t.businessUnderstanding.actions.edit}
                            </button>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {requirement.description}
                          </p>
                          <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                            {t.businessUnderstanding.requirements.moduleLabel}:{" "}
                            {linkedModule?.name ?? requirement.moduleId}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge
                              label={
                                t.businessUnderstanding.requirements.options.source[
                                  requirement.source
                                ]
                              }
                            />
                            <Badge
                              label={
                                t.businessUnderstanding.requirements.options.status[
                                  requirement.status
                                ]
                              }
                            />
                            <Badge
                              label={
                                requirement.aiGenerated
                                  ? t.businessUnderstanding.badges.aiGenerated
                                  : t.businessUnderstanding.badges.humanCreated
                              }
                            />
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-900/10 bg-white p-5">
                <h3 className="text-xl font-black tracking-tight text-slate-950">
                  {t.businessUnderstanding.businessRules.title}
                </h3>
                <form onSubmit={handleBusinessRuleSubmit} className="mt-4 grid gap-3">
                  <p className="text-sm font-black text-slate-700">
                    {editingBusinessRuleId
                      ? t.businessUnderstanding.businessRules.editTitle
                      : t.businessUnderstanding.businessRules.createTitle}
                  </p>
                  <ProjectSelect
                    label={t.businessUnderstanding.businessRules.fields.requirementId}
                    value={activeBusinessRuleRequirementId}
                    options={projectRequirements.map((requirement) => requirement.id)}
                    labels={Object.fromEntries(
                      projectRequirements.map((requirement) => [
                        requirement.id,
                        requirement.title,
                      ]),
                    )}
                    onChange={(value) =>
                      setBusinessRuleFormState((current) => ({
                        ...current,
                        requirementId: value,
                      }))
                    }
                  />
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    {t.businessUnderstanding.businessRules.fields.title}
                    <input
                      className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                      placeholder={t.businessUnderstanding.businessRules.placeholders.title}
                      value={businessRuleFormState.title}
                      onChange={(event) =>
                        setBusinessRuleFormState((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    {t.businessUnderstanding.businessRules.fields.ruleText}
                    <textarea
                      className="min-h-24 rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                      placeholder={t.businessUnderstanding.businessRules.placeholders.ruleText}
                      value={businessRuleFormState.ruleText}
                      onChange={(event) =>
                        setBusinessRuleFormState((current) => ({
                          ...current,
                          ruleText: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <ProjectSelect
                    label={t.businessUnderstanding.businessRules.fields.priority}
                    value={businessRuleFormState.priority}
                    options={businessRulePriorities}
                    labels={t.businessUnderstanding.businessRules.options.priority}
                    onChange={(value) =>
                      setBusinessRuleFormState((current) => ({ ...current, priority: value }))
                    }
                  />
                  <ProjectSelect
                    label={t.businessUnderstanding.businessRules.fields.status}
                    value={businessRuleFormState.status}
                    options={businessRuleStatuses}
                    labels={t.businessUnderstanding.businessRules.options.status}
                    onChange={(value) =>
                      setBusinessRuleFormState((current) => ({ ...current, status: value }))
                    }
                  />
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={businessRuleFormState.aiGenerated}
                      onChange={(event) =>
                        setBusinessRuleFormState((current) => ({
                          ...current,
                          aiGenerated: event.target.checked,
                        }))
                      }
                    />
                    {t.businessUnderstanding.businessRules.fields.aiGenerated}
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    {t.businessUnderstanding.businessRules.fields.reviewedBy}
                    <input
                      className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium outline-none focus:border-teal-600"
                      placeholder={t.businessUnderstanding.businessRules.placeholders.reviewedBy}
                      value={businessRuleFormState.reviewedBy}
                      onChange={(event) =>
                        setBusinessRuleFormState((current) => ({
                          ...current,
                          reviewedBy: event.target.value,
                        }))
                      }
                    />
                  </label>
                  {businessRuleValidationError ? (
                    <ValidationMessage message={t.businessUnderstanding.validationError} />
                  ) : null}
                  <FormActions
                    isEditing={Boolean(editingBusinessRuleId)}
                    createLabel={t.businessUnderstanding.actions.create}
                    updateLabel={t.businessUnderstanding.actions.update}
                    cancelLabel={t.businessUnderstanding.actions.cancel}
                    onCancel={resetBusinessRuleForm}
                  />
                </form>

                <div className="mt-5 grid gap-3">
                  {projectBusinessRules.length === 0 ? (
                    <EmptyState
                      title={t.businessUnderstanding.businessRules.emptyTitle}
                      description={t.businessUnderstanding.businessRules.emptyDescription}
                    />
                  ) : (
                    projectBusinessRules.map((rule) => {
                      const linkedRequirement = projectRequirements.find(
                        (requirement) => requirement.id === rule.requirementId,
                      );

                      return (
                        <article
                          key={rule.id}
                          className="rounded-2xl border border-slate-900/10 bg-slate-50 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="text-base font-black text-slate-950">{rule.title}</h4>
                            <button
                              type="button"
                              className="rounded-lg border border-slate-900/10 bg-white px-3 py-1.5 text-xs font-black text-slate-700"
                              onClick={() => startEditingBusinessRule(rule)}
                            >
                              {t.businessUnderstanding.actions.edit}
                            </button>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{rule.ruleText}</p>
                          <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                            {t.businessUnderstanding.businessRules.requirementLabel}:{" "}
                            {linkedRequirement?.title ?? rule.requirementId}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge
                              label={
                                t.businessUnderstanding.businessRules.options.priority[
                                  rule.priority
                                ]
                              }
                            />
                            <Badge
                              label={
                                t.businessUnderstanding.businessRules.options.status[rule.status]
                              }
                            />
                            <Badge
                              label={
                                rule.aiGenerated
                                  ? t.businessUnderstanding.badges.aiGenerated
                                  : t.businessUnderstanding.badges.humanCreated
                              }
                            />
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            </div>
          </section>

          <TestScenarioSection
            projects={visibleProjects}
            modules={modules}
            requirements={requirements}
            businessRules={businessRules}
          />

          <TestCaseSection
            projects={visibleProjects}
            modules={modules}
            requirements={requirements}
            businessRules={businessRules}
          />

          <TestSuiteSection
            projects={visibleProjects}
            modules={modules}
            requirements={requirements}
            businessRules={businessRules}
          />

          <TestCycleSection
            projects={visibleProjects}
            modules={modules}
            requirements={requirements}
            businessRules={businessRules}
          />

          <TestExecutionSection
            projects={visibleProjects}
            modules={modules}
            requirements={requirements}
            businessRules={businessRules}
          />

          <BugReportSection projects={visibleProjects} modules={modules} />

          <EvidenceSection projects={visibleProjects} />

          <ReportSection projects={visibleProjects} />

          <section className="grid gap-6 2xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[1.5rem] border border-slate-900/10 bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/15">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.26em] text-teal-200">
                    {t.applicationSections.eyebrow}
                  </p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight">
                    {t.applicationSections.title}
                  </h2>
                </div>
                <p className="max-w-sm text-sm leading-6 text-slate-300">
                  {t.applicationSections.description}
                </p>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {t.workspaceModules.map((module) => (
                  <article
                    id={module.id}
                    key={module.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                  >
                    <h3 className="text-lg font-black">{module.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{module.summary}</p>
                    <p className="mt-4 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-teal-100">
                      {module.status}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="grid gap-6">
              <section className="rounded-[1.5rem] border border-slate-900/10 bg-white/85 p-6 shadow-lg shadow-slate-900/5">
                <p className="text-sm font-black uppercase tracking-[0.24em] text-teal-700">
                  {t.artifactFirstAi.eyebrow}
                </p>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                  {t.artifactFirstAi.title}
                </h2>
                <div className="mt-5 flex flex-wrap gap-2">
                  {t.artifactTypes.map((artifact) => (
                    <span
                      key={artifact}
                      className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-900/10"
                    >
                      {artifact}
                    </span>
                  ))}
                </div>
              </section>

              <section className="rounded-[1.5rem] border border-amber-900/15 bg-amber-50/90 p-6 shadow-lg shadow-amber-900/5">
                <p className="text-sm font-black uppercase tracking-[0.24em] text-amber-800">
                  {t.safeBoundaries.eyebrow}
                </p>
                <ul className="mt-4 grid gap-3">
                  {t.safeBoundaries.items.map((boundary) => (
                    <li key={boundary} className="flex gap-3 text-sm leading-6 text-amber-950">
                      <span className="mt-2 size-2 shrink-0 rounded-full bg-amber-600" />
                      <span>{boundary}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </aside>
          </section>
        </section>
      </div>
    </main>
  );
}

type ProjectSelectProps<T extends string> = {
  label: string;
  value: T;
  options: readonly T[];
  labels: Record<string, string>;
  onChange: (value: T) => void;
};

function ProjectSelect<T extends string>({
  label,
  value,
  options,
  labels,
  onChange,
}: ProjectSelectProps<T>) {
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

function ProjectMeta({ label, value }: { label: string; value: string }) {
  return (
    <p className="rounded-xl bg-white px-3 py-2 text-slate-600 ring-1 ring-slate-900/10">
      <span className="font-black text-slate-950">{label}: </span>
      {value}
    </p>
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

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">
      <h4 className="text-sm font-black text-slate-950">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </section>
  );
}

function ValidationMessage({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
      {message}
    </p>
  );
}

function FormActions({
  isEditing,
  createLabel,
  updateLabel,
  cancelLabel,
  onCancel,
}: {
  isEditing: boolean;
  createLabel: string;
  updateLabel: string;
  cancelLabel: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="submit"
        className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-teal-800"
      >
        {isEditing ? updateLabel : createLabel}
      </button>
      {isEditing ? (
        <button
          type="button"
          className="rounded-xl border border-slate-900/10 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-slate-400"
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
      ) : null}
    </div>
  );
}
