import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const moduleCache = new Map();

function loadTsModule(relativePath) {
  const normalizedPath = relativePath.endsWith(".ts") ? relativePath : `${relativePath}.ts`;

  if (moduleCache.has(normalizedPath)) {
    return moduleCache.get(normalizedPath).exports;
  }

  const source = readFileSync(normalizedPath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const compiledModule = { exports: {} };
  moduleCache.set(normalizedPath, compiledModule);

  const localRequire = (specifier) => {
    if (specifier.startsWith("@/")) {
      return loadTsModule(path.join("src", specifier.slice(2)));
    }

    if (specifier.startsWith(".")) {
      return loadTsModule(path.join(path.dirname(normalizedPath), specifier));
    }

    return require(specifier);
  };

  const execute = new Function("exports", "require", "module", output);
  execute(compiledModule.exports, localRequire, compiledModule);

  return compiledModule.exports;
}

const pageSource = readFileSync("src/app/page.tsx", "utf8");
const i18nSource = readFileSync("src/app/i18n.ts", "utf8");
const testScenarioSectionSource = readFileSync(
  "src/app/components/TestScenarioSection.tsx",
  "utf8",
);
const testCaseSectionSource = readFileSync("src/app/components/TestCaseSection.tsx", "utf8");
const testSuiteSectionSource = readFileSync("src/app/components/TestSuiteSection.tsx", "utf8");
const testCycleSectionSource = readFileSync("src/app/components/TestCycleSection.tsx", "utf8");
const testExecutionSectionSource = readFileSync(
  "src/app/components/TestExecutionSection.tsx",
  "utf8",
);
const bugReportSectionSource = readFileSync("src/app/components/BugReportSection.tsx", "utf8");
const evidenceSectionSource = readFileSync("src/app/components/EvidenceSection.tsx", "utf8");
const reportSectionSource = readFileSync("src/app/components/ReportSection.tsx", "utf8");
const aiUsageSectionSource = readFileSync("src/app/components/AiUsageSection.tsx", "utf8");
const metricCardSource = readFileSync("src/app/components/MetricCard.tsx", "utf8");
const traceabilityFlowSource = readFileSync("src/app/components/TraceabilityFlow.tsx", "utf8");
const insightCardsSource = readFileSync("src/app/components/InsightCards.tsx", "utf8");
const quickActionsSource = readFileSync("src/app/components/QuickActions.tsx", "utf8");
const workspaceDashboardSource = readFileSync(
  "src/app/components/WorkspaceDashboard.tsx",
  "utf8",
);
const workspaceNavigationSource = readFileSync("src/app/workspaceNavigation.ts", "utf8");
const productSource = `${pageSource}\n${i18nSource}\n${testScenarioSectionSource}\n${testCaseSectionSource}\n${testSuiteSectionSource}\n${testCycleSectionSource}\n${testExecutionSectionSource}\n${bugReportSectionSource}\n${evidenceSectionSource}\n${reportSectionSource}\n${aiUsageSectionSource}\n${metricCardSource}\n${traceabilityFlowSource}\n${insightCardsSource}\n${quickActionsSource}\n${workspaceDashboardSource}\n${workspaceNavigationSource}`;
const projectTypesSource = readFileSync("src/lib/projects/types.ts", "utf8");
const projectServiceSource = readFileSync("src/lib/projects/projectService.ts", "utf8");
const businessTypesSource = readFileSync("src/lib/business-understanding/types.ts", "utf8");
const businessServiceSource = readFileSync(
  "src/lib/business-understanding/businessUnderstandingService.ts",
  "utf8",
);
const testDesignTypesSource = readFileSync("src/lib/test-design/types.ts", "utf8");
const testDesignServiceSource = readFileSync("src/lib/test-design/testDesignService.ts", "utf8");
const bugTypesSource = readFileSync("src/lib/bugs/types.ts", "utf8");
const bugServiceSource = readFileSync("src/lib/bugs/bugService.ts", "utf8");
const evidenceTypesSource = readFileSync("src/lib/evidence/types.ts", "utf8");
const evidenceServiceSource = readFileSync("src/lib/evidence/evidenceService.ts", "utf8");
const reportTypesSource = readFileSync("src/lib/reports/types.ts", "utf8");
const reportServiceSource = readFileSync("src/lib/reports/reportService.ts", "utf8");
const aiUsageTypesSource = readFileSync("src/lib/ai-usage/types.ts", "utf8");
const aiUsageServiceSource = readFileSync("src/lib/ai-usage/aiUsageService.ts", "utf8");
const mockSession = loadTsModule("src/lib/auth/mockSession");
const access = loadTsModule("src/lib/workspace/access");
const projectTypesModule = loadTsModule("src/lib/projects/types");
const projectService = loadTsModule("src/lib/projects/projectService");
const businessTypes = loadTsModule("src/lib/business-understanding/types");
const businessService = loadTsModule("src/lib/business-understanding/businessUnderstandingService");
const testDesignTypes = loadTsModule("src/lib/test-design/types");
const testDesignService = loadTsModule("src/lib/test-design/testDesignService");
const bugTypes = loadTsModule("src/lib/bugs/types");
const bugService = loadTsModule("src/lib/bugs/bugService");
const evidenceTypes = loadTsModule("src/lib/evidence/types");
const evidenceService = loadTsModule("src/lib/evidence/evidenceService");
const reportTypesModule = loadTsModule("src/lib/reports/types");
const reportService = loadTsModule("src/lib/reports/reportService");
const aiUsageTypes = loadTsModule("src/lib/ai-usage/types");
const aiUsageService = loadTsModule("src/lib/ai-usage/aiUsageService");
const workspaceNavigation = loadTsModule("src/app/workspaceNavigation");

test("FrankInTest shell exposes the required navigation sections", () => {
  [
    "Control Tower",
    "Projetos",
    "QA Workspace",
    "Cenários de teste",
    "Casos de teste",
    "Suítes de teste",
    "Ciclos de teste",
    "Execução de testes",
    "Bugs e defeitos",
    "Evidências",
    "Check-up",
    "Relatórios",
    "FrankInDrift",
    "Configurações",
  ].forEach((section) => {
    assert.match(productSource, new RegExp(section));
  });
});

test("premium dashboard copy and Control Tower shell are present", () => {
  [
    "Control Tower",
    "Um workspace para transformar artefatos de produto em artefatos de QA.",
    "Organize requisitos, riscos, execuções, bugs, evidências, relatórios e ações",
    "Assistido por IA",
    "Projetos ativos",
    "Execuções",
    "Bugs abertos",
    "Evidências",
    "Créditos de IA",
    "Domain overview cards",
  ].forEach((copy) => {
    assert.match(productSource, new RegExp(copy));
  });
});

test("UI architecture groups the workspace into a dashboard and detail area", () => {
  [
    "SidebarNav",
    "TopBar",
    "DashboardOverview",
    "ControlTowerCard",
    "TraceabilityFlow",
    "DomainOverviewGrid",
    "DomainOverviewCard",
    "WorkspaceDetailArea",
    "workspaceDetailTabs",
  ].forEach((componentName) => {
    assert.match(workspaceDashboardSource, new RegExp(componentName));
  });
});

test("sidebar navigation includes expected QA workspace items", () => {
  [
    "Visão geral",
    "Control Tower",
    "Produto",
    "Projetos",
    "Módulos",
    "Requisitos",
    "Regras de negócio",
    "QA Design",
    "Cenários de teste",
    "Casos de teste",
    "Suítes de teste",
    "Execução",
    "Ciclos de teste",
    "Execução de testes",
    "Qualidade",
    "Bugs e defeitos",
    "Evidências",
    "Relatórios",
    "IA",
    "IA e créditos",
    "Assistência de design de testes",
    "Configurações",
  ].forEach((item) => {
    assert.match(productSource, new RegExp(item));
  });
});

test("IA produz artefatos estruturados de QA", () => {
  [
    "Requisito",
    "Regra de negócio",
    "Cenário de teste",
    "Caso de teste",
    "Relatório de bug",
    "Resumo de evidência",
    "Item de risco",
    "Relatório de prontidão de release",
    "Achado de drift",
    "Recomendação de automação",
    "Recomendação de integração",
  ].forEach((artifact) => {
    assert.match(productSource, new RegExp(artifact));
  });
});

test("product copy keeps safe analysis boundaries", () => {
  assert.match(productSource, /[Aa]ssistido por IA/);
  assert.match(productSource, /riscos potenciais/i);
  assert.match(productSource, /[Vv]alidação recomendada/);
  assert.match(productSource, /exigem confirmação/i);

  [
    "Fully tested",
    "Guaranteed secure",
    "All bugs found",
    "Complete vulnerability scan",
    "totally tested",
    "guaranteed secure",
    "all bugs found",
    "complete vulnerability scan",
    "totalmente testado",
    "segurança garantida",
    "todos os bugs encontrados",
    "varredura completa de vulnerabilidades",
    "pronto para release sem validação",
    "release garantido",
    "qualidade garantida",
    "vulnerabilidades garantidamente encontradas",
    "IA garante segurança",
  ].forEach((unsafeClaim) => {
    assert.doesNotMatch(productSource, new RegExp(unsafeClaim, "i"));
  });
});

test("MetricCard remains a deterministic presentational component", () => {
  assert.match(metricCardSource, /export function MetricCard/);
  assert.match(metricCardSource, /\{value\}/);
  assert.doesNotMatch(metricCardSource, /localStorage/);
  assert.doesNotMatch(metricCardSource, /Date\.now/);
  assert.doesNotMatch(metricCardSource, /Math\.random/);
  assert.doesNotMatch(metricCardSource, /suppressHydrationWarning/);
});

test("dashboard metrics use deterministic first-render workspace state", () => {
  assert.match(pageSource, /useState<Project\[\]>\(demoProjects\)/);
  assert.match(pageSource, /useState<ProductModule\[\]>\(demoProductModules\)/);
  assert.match(pageSource, /hasLoadedLocalWorkspace/);
  assert.match(pageSource, /window\.localStorage\.getItem\(projectStorageKey\)/);
  assert.match(pageSource, /if \(!hasLoadedLocalWorkspace\)/);
  assert.doesNotMatch(pageSource, /Date\.now\(\)/);
  assert.doesNotMatch(pageSource, /Math\.random\(\)/);
});

test("i18n usa somente pt-BR durante o MVP", () => {
  assert.match(i18nSource, /defaultLocale = "pt-BR"/);
  assert.match(i18nSource, /"pt-BR"/);
  assert.doesNotMatch(i18nSource, /key: "en"/);
  assert.doesNotMatch(i18nSource, /key: "es"/);
});

test("pt-BR remains the default locale", () => {
  assert.match(i18nSource, /defaultLocale = "pt-BR"/);
});

test("supported project types match the product data model", () => {
  assert.deepEqual(projectTypesModule.projectTypes, [
    "landing_page",
    "saas",
    "mobile_app",
    "api",
    "erp",
    "ecommerce",
    "internal_system",
    "other",
  ]);

  [
    "landing_page",
    "saas",
    "mobile_app",
    "api",
    "erp",
    "ecommerce",
    "internal_system",
    "other",
  ].forEach((projectType) => {
    assert.match(projectTypesSource, new RegExp(projectType));
  });
});

test("default demo user session and personal workspace exist", () => {
  const session = mockSession.getMockSession();

  assert.equal(session.authMode, "local-demo");
  assert.equal(session.user.id, "user_demo_qa_lead");
  assert.equal(session.activeOrganization.id, "org_demo_personal");
  assert.equal(session.activeOrganization.slug, "workspace-pessoal");
  assert.equal(session.activeOrganization.plan, "demo");
  assert.ok(session.activeOrganization.creditBalance >= 0);
});

test("access checks allow the demo user into their organization and project", () => {
  const session = mockSession.getMockSession();
  const project = projectService.demoProjects[0];

  assert.equal(access.canAccessOrganization(session.user, session.activeOrganization), true);
  assert.equal(access.canCreateProject(session.user, session.activeOrganization), true);
  assert.equal(access.canAccessProject(session.user, project, session.activeOrganization), true);
  assert.equal(access.canManageProject(session.user, project, session.activeOrganization), true);
});

test("access checks prevent unrelated organization and project access", () => {
  const session = mockSession.getMockSession();
  const unrelatedOrganization = {
    ...session.activeOrganization,
    id: "org_unrelated",
    memberships: [],
  };
  const unrelatedProject = {
    ...projectService.demoProjects[0],
    id: "project_unrelated",
    organizationId: "org_unrelated",
  };

  assert.equal(access.canAccessOrganization(session.user, unrelatedOrganization), false);
  assert.equal(access.canCreateProject(session.user, unrelatedOrganization), false);
  assert.equal(access.canAccessProject(session.user, unrelatedProject, unrelatedOrganization), false);
  assert.equal(access.canManageProject(session.user, unrelatedProject, unrelatedOrganization), false);
});

test("project creation rules validate names and supported values", () => {
  const session = mockSession.getMockSession();
  const input = {
    organizationId: session.activeOrganization.id,
    name: "Checkout API",
    type: "api",
    description: "Critical API validation scope.",
    targetUrl: "https://api.example.com",
    qaMaturity: "structured",
    riskLevel: "high",
    status: "active",
  };

  assert.equal(projectService.validateProjectInput(input).length, 0);
  assert.equal(projectService.canCreateProjectWithInput(session.user, session.activeOrganization, input), true);

  const project = projectService.createProject(input, new Date("2026-05-11T12:00:00.000Z"));
  assert.equal(project.name, "Checkout API");
  assert.equal(project.type, "api");
  assert.equal(project.organizationId, session.activeOrganization.id);
  assert.equal(project.createdAt, "2026-05-11T12:00:00.000Z");
});

test("project type validation rejects unsupported project types", () => {
  const invalidInput = {
    organizationId: "org_demo_personal",
    name: "Invalid type",
    type: "generic_chatbot",
    qaMaturity: "unknown",
    riskLevel: "medium",
    status: "active",
  };

  assert.equal(projectService.isProjectType("landing_page"), true);
  assert.equal(projectService.isProjectType("generic_chatbot"), false);
  assert.deepEqual(projectService.validateProjectInput(invalidInput), ["invalid_project_type"]);
  assert.match(projectServiceSource, /invalid_project_type/);
});

test("product module model values match Block 03 scope", () => {
  assert.deepEqual(businessTypes.moduleCriticalities, ["low", "medium", "high", "critical"]);
  assert.deepEqual(businessTypes.moduleStatuses, ["active", "deprecated", "planned"]);
  assert.match(businessTypesSource, /ProductModule/);
  assert.match(businessServiceSource, /demoProductModules/);
});

test("module input validation accepts supported values and rejects invalid values", () => {
  const validInput = {
    projectId: "project_demo_saas",
    name: "Billing readiness",
    description: "Future billing boundary checks.",
    criticality: "high",
    status: "planned",
  };

  assert.deepEqual(businessService.validateModuleInput(validInput), []);
  assert.equal(businessService.isModuleCriticality("critical"), true);
  assert.equal(businessService.isModuleStatus("deprecated"), true);
  assert.deepEqual(
    businessService.validateModuleInput({
      ...validInput,
      name: "",
      criticality: "urgent",
      status: "unknown",
    }),
    ["module_name_required", "invalid_module_criticality", "invalid_module_status"],
  );

  const productModule = businessService.createModule(
    validInput,
    new Date("2026-05-12T10:00:00.000Z"),
  );
  assert.equal(productModule.projectId, "project_demo_saas");
  assert.equal(productModule.createdAt, "2026-05-12T10:00:00.000Z");
});

test("requirement model values match Block 03 scope", () => {
  assert.deepEqual(businessTypes.requirementSources, [
    "user_input",
    "documentation",
    "stakeholder",
    "ai_draft",
    "imported",
  ]);
  assert.deepEqual(businessTypes.requirementStatuses, [
    "draft",
    "active",
    "needs_review",
    "archived",
  ]);
  assert.match(businessTypesSource, /Requirement/);
  assert.match(businessServiceSource, /demoRequirements/);
});

test("requirement input validation accepts supported values and rejects invalid values", () => {
  const validInput = {
    projectId: "project_demo_saas",
    moduleId: "module_demo_saas_auth",
    title: "Workspace access is scoped",
    description: "Users should only access projects inside their workspace.",
    source: "user_input",
    status: "active",
    aiGenerated: false,
    reviewedBy: "user_demo_qa_lead",
  };

  assert.deepEqual(businessService.validateRequirementInput(validInput), []);
  assert.equal(businessService.isRequirementSource("ai_draft"), true);
  assert.equal(businessService.isRequirementStatus("needs_review"), true);
  assert.deepEqual(
    businessService.validateRequirementInput({
      ...validInput,
      moduleId: "",
      title: "",
      source: "chat",
      status: "done",
    }),
    [
      "requirement_module_required",
      "requirement_title_required",
      "invalid_requirement_source",
      "invalid_requirement_status",
    ],
  );

  const requirement = businessService.createRequirement(
    validInput,
    new Date("2026-05-12T10:05:00.000Z"),
  );
  assert.equal(requirement.moduleId, "module_demo_saas_auth");
  assert.equal(requirement.aiGenerated, false);
});

test("business rule model values match Block 03 scope", () => {
  assert.deepEqual(businessTypes.businessRulePriorities, ["low", "medium", "high", "critical"]);
  assert.deepEqual(businessTypes.businessRuleStatuses, [
    "draft",
    "active",
    "needs_review",
    "archived",
  ]);
  assert.match(businessTypesSource, /BusinessRule/);
  assert.match(businessServiceSource, /demoBusinessRules/);
});

test("business rule input validation accepts supported values and rejects invalid values", () => {
  const validInput = {
    projectId: "project_demo_saas",
    moduleId: "module_demo_saas_auth",
    requirementId: "requirement_demo_saas_session",
    title: "Membership is required",
    ruleText: "A user must have membership before viewing workspace projects.",
    priority: "critical",
    status: "active",
    aiGenerated: false,
    reviewedBy: "user_demo_qa_lead",
  };

  assert.deepEqual(businessService.validateBusinessRuleInput(validInput), []);
  assert.equal(businessService.isBusinessRulePriority("critical"), true);
  assert.equal(businessService.isBusinessRuleStatus("archived"), true);
  assert.deepEqual(
    businessService.validateBusinessRuleInput({
      ...validInput,
      requirementId: "",
      title: "",
      ruleText: "",
      priority: "urgent",
      status: "done",
    }),
    [
      "business_rule_requirement_required",
      "business_rule_title_required",
      "business_rule_text_required",
      "invalid_business_rule_priority",
      "invalid_business_rule_status",
    ],
  );

  const rule = businessService.createBusinessRule(
    validInput,
    new Date("2026-05-12T10:10:00.000Z"),
  );
  assert.equal(rule.priority, "critical");
  assert.equal(rule.requirementId, "requirement_demo_saas_session");
});

test("business understanding listing helpers filter by project, module, and requirement", () => {
  assert.deepEqual(
    businessService
      .listModulesByProject("project_demo_saas")
      .map((module) => module.id)
      .sort(),
    ["module_demo_saas_auth", "module_demo_saas_dashboard"],
  );
  assert.deepEqual(
    businessService
      .listRequirementsByModule("module_demo_saas_auth")
      .map((requirement) => requirement.id),
    ["requirement_demo_saas_session"],
  );
  assert.deepEqual(
    businessService
      .listBusinessRulesByRequirement("requirement_demo_saas_session")
      .map((rule) => rule.id),
    ["rule_demo_saas_workspace_boundary"],
  );
});

test("traceability summary counts modules, requirements, rules, and review flags", () => {
  const summary = businessService.getBusinessUnderstandingSummary("project_demo_saas");

  assert.deepEqual(summary, {
    totalModules: 2,
    totalRequirements: 2,
    totalBusinessRules: 2,
    criticalModules: 1,
    requirementsNeedingReview: 0,
    businessRulesNeedingReview: 0,
  });

  assert.equal(businessService.countRequirementsByModule("module_demo_saas_auth"), 1);
  assert.equal(
    businessService.countBusinessRulesByRequirement("requirement_demo_saas_session"),
    1,
  );
  assert.equal(
    businessService.getRequirementTraceability("requirement_demo_saas_session").businessRuleCount,
    1,
  );
  assert.equal(businessService.getModuleTraceability("project_demo_saas").length, 2);
});

test("test scenario model values match Block 04A scope", () => {
  assert.deepEqual(testDesignTypes.scenarioTypes, [
    "positive",
    "negative",
    "edge_case",
    "regression",
    "exploratory",
    "security",
    "accessibility",
    "performance",
    "integration",
  ]);
  assert.deepEqual(testDesignTypes.scenarioPriorities, ["low", "medium", "high", "critical"]);
  assert.deepEqual(testDesignTypes.scenarioStatuses, [
    "draft",
    "ready",
    "needs_review",
    "archived",
  ]);
  assert.deepEqual(testDesignTypes.testLevels, [
    "unit",
    "integration",
    "api",
    "e2e",
    "system",
    "acceptance",
    "exploratory",
  ]);
  assert.match(testDesignTypesSource, /TestScenario/);
  assert.match(testDesignServiceSource, /demoTestScenarios/);
});

test("test scenario input validation accepts supported values and rejects invalid values", () => {
  const validInput = {
    projectId: "project_demo_saas",
    moduleId: "module_demo_saas_auth",
    requirementId: "requirement_demo_saas_session",
    businessRuleId: "rule_demo_saas_workspace_boundary",
    title: "Workspace boundary regression",
    description: "Users should not access projects from another workspace.",
    scenarioType: "regression",
    priority: "critical",
    status: "ready",
    testLevel: "integration",
    aiGenerated: false,
    reviewedBy: "user_demo_qa_lead",
  };

  assert.deepEqual(testDesignService.validateTestScenarioInput(validInput), []);
  assert.equal(testDesignService.isScenarioType("edge_case"), true);
  assert.equal(testDesignService.isScenarioType("edge"), false);
  assert.equal(testDesignService.isScenarioPriority("critical"), true);
  assert.equal(testDesignService.isScenarioStatus("needs_review"), true);
  assert.equal(testDesignService.isTestLevel("e2e"), true);
  assert.deepEqual(
    testDesignService.validateTestScenarioInput({
      ...validInput,
      projectId: "",
      moduleId: "",
      requirementId: "",
      businessRuleId: "",
      title: "",
      scenarioType: "smoke",
      priority: "urgent",
      status: "done",
      testLevel: "browser",
    }),
    [
      "scenario_project_required",
      "scenario_module_required",
      "scenario_requirement_required",
      "scenario_business_rule_required",
      "scenario_title_required",
      "invalid_scenario_type",
      "invalid_scenario_priority",
      "invalid_scenario_status",
      "invalid_test_level",
    ],
  );

  const scenario = testDesignService.createTestScenario(
    validInput,
    new Date("2026-05-12T12:00:00.000Z"),
  );
  assert.equal(scenario.id, "scenario_1778587200000");
  assert.equal(scenario.businessRuleId, "rule_demo_saas_workspace_boundary");
  assert.equal(scenario.createdAt, "2026-05-12T12:00:00.000Z");
});

test("test scenario listing helpers filter by project, module, requirement, and business rule", () => {
  assert.deepEqual(
    testDesignService
      .listScenariosByProject("project_demo_landing")
      .map((scenario) => scenario.id)
      .sort(),
    [
      "scenario_demo_landing_invalid_email",
      "scenario_demo_landing_mobile_cta_small_screen",
      "scenario_demo_landing_valid_email",
    ],
  );
  assert.deepEqual(
    testDesignService
      .listScenariosByModule("module_demo_landing_conversion")
      .map((scenario) => scenario.id)
      .sort(),
    ["scenario_demo_landing_invalid_email", "scenario_demo_landing_valid_email"],
  );
  assert.deepEqual(
    testDesignService
      .listScenariosByRequirement("requirement_demo_saas_session")
      .map((scenario) => scenario.id),
    ["scenario_demo_saas_workspace_boundary_regression"],
  );
  assert.deepEqual(
    testDesignService
      .listScenariosByBusinessRule("rule_demo_landing_email")
      .map((scenario) => scenario.scenarioType)
      .sort(),
    ["negative", "positive"],
  );
});

test("test scenario counts and design summary are deterministic", () => {
  assert.equal(testDesignService.countScenariosByBusinessRule("rule_demo_landing_email"), 2);

  assert.deepEqual(testDesignService.getScenarioDesignSummary("project_demo_landing"), {
    totalScenarios: 3,
    readyScenarios: 2,
    scenariosNeedingReview: 1,
    criticalScenarios: 0,
    aiGeneratedScenarios: 1,
    scenariosByType: {
      positive: 1,
      negative: 1,
      edge_case: 1,
      regression: 0,
      exploratory: 0,
      security: 0,
      accessibility: 0,
      performance: 0,
      integration: 0,
    },
  });

  assert.deepEqual(testDesignService.getScenarioDesignSummary("project_demo_saas"), {
    totalScenarios: 1,
    readyScenarios: 1,
    scenariosNeedingReview: 0,
    criticalScenarios: 1,
    aiGeneratedScenarios: 0,
    scenariosByType: {
      positive: 0,
      negative: 0,
      edge_case: 0,
      regression: 1,
      exploratory: 0,
      security: 0,
      accessibility: 0,
      performance: 0,
      integration: 0,
    },
  });
});

test("test scenario traceability connects project, module, requirement, rule, and scenario", () => {
  const ruleTraceability = testDesignService.getBusinessRuleScenarioTraceability(
    "rule_demo_landing_email",
  );

  assert.equal(ruleTraceability.businessRule.id, "rule_demo_landing_email");
  assert.equal(ruleTraceability.scenarioCount, 2);
  assert.deepEqual(
    ruleTraceability.scenarios.map((scenario) => scenario.businessRuleId),
    ["rule_demo_landing_email", "rule_demo_landing_email"],
  );

  const scenarioTraceability = testDesignService.getScenarioTraceability(
    "scenario_demo_saas_workspace_boundary_regression",
  );

  assert.equal(scenarioTraceability.project.id, "project_demo_saas");
  assert.equal(scenarioTraceability.module.id, "module_demo_saas_auth");
  assert.equal(scenarioTraceability.requirement.id, "requirement_demo_saas_session");
  assert.equal(scenarioTraceability.businessRule.id, "rule_demo_saas_workspace_boundary");
  assert.equal(
    scenarioTraceability.scenario.id,
    "scenario_demo_saas_workspace_boundary_regression",
  );

  assert.deepEqual(testDesignService.getScenarioTraceability("scenario_missing"), {
    project: null,
    module: null,
    requirement: null,
    businessRule: null,
    scenario: null,
  });
});

test("test case model values match Block 04C scope", () => {
  assert.deepEqual(testDesignTypes.testCasePriorities, ["low", "medium", "high", "critical"]);
  assert.deepEqual(testDesignTypes.testCaseStatuses, [
    "draft",
    "ready",
    "needs_review",
    "archived",
  ]);
  assert.deepEqual(testDesignTypes.testCaseAutomationStatuses, [
    "not_automated",
    "automation_candidate",
    "automated",
    "not_applicable",
  ]);
  assert.match(testDesignTypesSource, /TestCase/);
  assert.match(testDesignServiceSource, /demoTestCases/);
});

test("test case input validation accepts supported values and rejects invalid values", () => {
  const validInput = {
    projectId: "project_demo_saas",
    moduleId: "module_demo_saas_auth",
    requirementId: "requirement_demo_saas_session",
    businessRuleId: "rule_demo_saas_workspace_boundary",
    scenarioId: "scenario_demo_saas_workspace_boundary_regression",
    title: "Workspace boundary regression case",
    objective: "Confirm that unrelated workspace projects are not visible.",
    precondition: "Demo user session exists.",
    steps: ["Load demo session", "Check access to unrelated project"],
    expectedResult: "Access is denied and unrelated project data is not returned.",
    priority: "critical",
    status: "ready",
    testLevel: "integration",
    automationStatus: "automated",
    aiGenerated: false,
    reviewedBy: "user_demo_qa_lead",
  };

  assert.deepEqual(testDesignService.validateTestCaseInput(validInput), []);
  assert.equal(testDesignService.isTestCasePriority("critical"), true);
  assert.equal(testDesignService.isTestCasePriority("urgent"), false);
  assert.equal(testDesignService.isTestCaseStatus("needs_review"), true);
  assert.equal(testDesignService.isTestCaseAutomationStatus("automation_candidate"), true);
  assert.deepEqual(
    testDesignService.validateTestCaseInput({
      ...validInput,
      projectId: "",
      moduleId: "",
      requirementId: "",
      businessRuleId: "",
      scenarioId: "",
      title: "",
      objective: "",
      steps: ["x"],
      expectedResult: "",
      priority: "urgent",
      status: "done",
      testLevel: "browser",
      automationStatus: "robot_ready",
    }),
    [
      "test_case_project_required",
      "test_case_module_required",
      "test_case_requirement_required",
      "test_case_business_rule_required",
      "test_case_scenario_required",
      "test_case_title_required",
      "test_case_objective_required",
      "test_case_step_required",
      "test_case_expected_result_required",
      "invalid_test_case_priority",
      "invalid_test_case_status",
      "invalid_test_level",
      "invalid_test_case_automation_status",
    ],
  );
  assert.deepEqual(
    testDesignService.validateTestCaseInput({ ...validInput, steps: [] }),
    ["test_case_steps_required"],
  );

  const testCase = testDesignService.createTestCase(
    validInput,
    new Date("2026-05-12T12:05:00.000Z"),
  );
  assert.equal(testCase.id, "test_case_1778587500000");
  assert.equal(testCase.scenarioId, "scenario_demo_saas_workspace_boundary_regression");
  assert.deepEqual(testCase.steps, ["Load demo session", "Check access to unrelated project"]);
  assert.equal(testCase.createdAt, "2026-05-12T12:05:00.000Z");
});

test("test case listing helpers filter by project, module, requirement, rule, and scenario", () => {
  assert.deepEqual(
    testDesignService
      .listTestCasesByProject("project_demo_landing")
      .map((testCase) => testCase.id)
      .sort(),
    [
      "test_case_demo_landing_invalid_email_rejected",
      "test_case_demo_landing_mobile_cta_narrow_screen",
      "test_case_demo_landing_valid_email_submission",
    ],
  );
  assert.deepEqual(
    testDesignService
      .listTestCasesByModule("module_demo_landing_conversion")
      .map((testCase) => testCase.id)
      .sort(),
    [
      "test_case_demo_landing_invalid_email_rejected",
      "test_case_demo_landing_valid_email_submission",
    ],
  );
  assert.deepEqual(
    testDesignService
      .listTestCasesByRequirement("requirement_demo_saas_session")
      .map((testCase) => testCase.id),
    ["test_case_demo_saas_workspace_boundary_regression"],
  );
  assert.deepEqual(
    testDesignService
      .listTestCasesByBusinessRule("rule_demo_landing_email")
      .map((testCase) => testCase.scenarioId)
      .sort(),
    ["scenario_demo_landing_invalid_email", "scenario_demo_landing_valid_email"],
  );
  assert.deepEqual(
    testDesignService
      .listTestCasesByScenario("scenario_demo_landing_mobile_cta_small_screen")
      .map((testCase) => testCase.id),
    ["test_case_demo_landing_mobile_cta_narrow_screen"],
  );
});

test("test case counts and design summary are deterministic", () => {
  assert.equal(
    testDesignService.countTestCasesByScenario("scenario_demo_landing_valid_email"),
    1,
  );

  assert.deepEqual(testDesignService.getTestCaseDesignSummary("project_demo_landing"), {
    totalTestCases: 3,
    readyTestCases: 2,
    testCasesNeedingReview: 1,
    criticalTestCases: 0,
    automationCandidates: 1,
    automatedTestCases: 0,
    aiGeneratedTestCases: 1,
    testCasesByAutomationStatus: {
      not_automated: 1,
      automation_candidate: 1,
      automated: 0,
      not_applicable: 1,
    },
  });

  assert.deepEqual(testDesignService.getTestCaseDesignSummary("project_demo_saas"), {
    totalTestCases: 1,
    readyTestCases: 1,
    testCasesNeedingReview: 0,
    criticalTestCases: 1,
    automationCandidates: 0,
    automatedTestCases: 1,
    aiGeneratedTestCases: 0,
    testCasesByAutomationStatus: {
      not_automated: 0,
      automation_candidate: 0,
      automated: 1,
      not_applicable: 0,
    },
  });
});

test("test case traceability connects project, module, requirement, rule, scenario, and test case", () => {
  const scenarioTraceability = testDesignService.getScenarioTestCaseTraceability(
    "scenario_demo_landing_valid_email",
  );

  assert.equal(scenarioTraceability.scenario.id, "scenario_demo_landing_valid_email");
  assert.equal(scenarioTraceability.testCaseCount, 1);
  assert.equal(
    scenarioTraceability.testCases[0].id,
    "test_case_demo_landing_valid_email_submission",
  );

  const testCaseTraceability = testDesignService.getTestCaseTraceability(
    "test_case_demo_saas_workspace_boundary_regression",
  );

  assert.equal(testCaseTraceability.project.id, "project_demo_saas");
  assert.equal(testCaseTraceability.module.id, "module_demo_saas_auth");
  assert.equal(testCaseTraceability.requirement.id, "requirement_demo_saas_session");
  assert.equal(testCaseTraceability.businessRule.id, "rule_demo_saas_workspace_boundary");
  assert.equal(
    testCaseTraceability.scenario.id,
    "scenario_demo_saas_workspace_boundary_regression",
  );
  assert.equal(
    testCaseTraceability.testCase.id,
    "test_case_demo_saas_workspace_boundary_regression",
  );

  assert.deepEqual(testDesignService.getTestCaseTraceability("test_case_missing"), {
    project: null,
    module: null,
    requirement: null,
    businessRule: null,
    scenario: null,
    testCase: null,
  });
});

test("test suite model values match Block 05A scope", () => {
  assert.deepEqual(testDesignTypes.testSuiteTypes, [
    "smoke",
    "regression",
    "release",
    "feature",
    "exploratory",
    "api",
    "mobile",
    "security",
    "accessibility",
    "performance",
  ]);
  assert.deepEqual(testDesignTypes.testSuiteStatuses, [
    "draft",
    "ready",
    "needs_review",
    "archived",
  ]);
  assert.deepEqual(testDesignTypes.testSuitePriorities, [
    "low",
    "medium",
    "high",
    "critical",
  ]);
  assert.match(testDesignTypesSource, /TestSuite/);
  assert.match(testDesignServiceSource, /demoTestSuites/);
});

test("test suite input validation accepts supported values and rejects invalid values", () => {
  const validInput = {
    projectId: "project_demo_landing",
    name: "Smoke - Landing page",
    description: "Suite curta para validar captura de lead.",
    suiteType: "smoke",
    status: "ready",
    priority: "high",
    testCaseIds: [
      "test_case_demo_landing_valid_email_submission",
      "test_case_demo_landing_invalid_email_rejected",
    ],
    owner: "user_demo_qa_lead",
  };

  assert.deepEqual(testDesignService.validateTestSuiteInput(validInput), []);
  assert.equal(testDesignService.isTestSuiteType("release"), true);
  assert.equal(testDesignService.isTestSuiteType("cycle"), false);
  assert.equal(testDesignService.isTestSuiteStatus("needs_review"), true);
  assert.equal(testDesignService.isTestSuitePriority("critical"), true);
  assert.deepEqual(
    testDesignService.validateTestSuiteInput({
      ...validInput,
      projectId: "",
      name: "",
      suiteType: "cycle",
      status: "done",
      priority: "urgent",
      testCaseIds: ["x"],
    }),
    [
      "test_suite_project_required",
      "test_suite_name_required",
      "invalid_test_suite_type",
      "invalid_test_suite_status",
      "invalid_test_suite_priority",
      "test_suite_test_case_id_required",
    ],
  );
  assert.deepEqual(
    testDesignService.validateTestSuiteInput({ ...validInput, testCaseIds: [] }),
    ["test_suite_test_cases_required"],
  );

  const testSuite = testDesignService.createTestSuite(
    validInput,
    new Date("2026-05-12T12:10:00.000Z"),
  );
  assert.equal(testSuite.id, "test_suite_1778587800000");
  assert.equal(testSuite.suiteType, "smoke");
  assert.deepEqual(testSuite.testCaseIds, validInput.testCaseIds);
  assert.equal(testSuite.createdAt, "2026-05-12T12:10:00.000Z");
});

test("test suite listing helpers filter by project, type, and test case", () => {
  assert.deepEqual(
    testDesignService
      .listTestSuitesByProject("project_demo_landing")
      .map((testSuite) => testSuite.id)
      .sort(),
    [
      "test_suite_demo_landing_mobile_feature",
      "test_suite_demo_landing_release_main_flow",
      "test_suite_demo_landing_smoke",
    ],
  );
  assert.deepEqual(
    testDesignService
      .listTestSuitesByType("project_demo_landing", "release")
      .map((testSuite) => testSuite.id),
    ["test_suite_demo_landing_release_main_flow"],
  );
  assert.deepEqual(
    testDesignService
      .listTestSuitesByTestCase("test_case_demo_landing_mobile_cta_narrow_screen")
      .map((testSuite) => testSuite.suiteType)
      .sort(),
    ["feature", "release"],
  );
});

test("test suite counts and summary are deterministic", () => {
  assert.equal(testDesignService.countTestSuitesByProject("project_demo_landing"), 3);
  assert.equal(
    testDesignService.countTestSuitesByTestCase(
      "test_case_demo_landing_valid_email_submission",
    ),
    2,
  );

  assert.deepEqual(testDesignService.getTestSuiteSummary("project_demo_landing"), {
    totalSuites: 3,
    readySuites: 1,
    suitesNeedingReview: 1,
    criticalSuites: 1,
    archivedSuites: 0,
    totalLinkedTestCases: 3,
    suitesByType: {
      smoke: 1,
      regression: 0,
      release: 1,
      feature: 1,
      exploratory: 0,
      api: 0,
      mobile: 0,
      security: 0,
      accessibility: 0,
      performance: 0,
    },
  });

  assert.deepEqual(testDesignService.getTestSuiteSummary("project_demo_saas"), {
    totalSuites: 1,
    readySuites: 1,
    suitesNeedingReview: 0,
    criticalSuites: 1,
    archivedSuites: 0,
    totalLinkedTestCases: 1,
    suitesByType: {
      smoke: 0,
      regression: 1,
      release: 0,
      feature: 0,
      exploratory: 0,
      api: 0,
      mobile: 0,
      security: 0,
      accessibility: 0,
      performance: 0,
    },
  });
});

test("test suite traceability connects project, suite, and linked test cases", () => {
  const suiteTraceability = testDesignService.getTestSuiteTraceability(
    "test_suite_demo_landing_smoke",
  );

  assert.equal(suiteTraceability.project.id, "project_demo_landing");
  assert.equal(suiteTraceability.testSuite.id, "test_suite_demo_landing_smoke");
  assert.deepEqual(
    suiteTraceability.testCases.map((testCase) => testCase.id),
    [
      "test_case_demo_landing_valid_email_submission",
      "test_case_demo_landing_invalid_email_rejected",
    ],
  );
  assert.deepEqual(
    suiteTraceability.testCaseTraceability.map((traceability) => traceability.businessRule.id),
    ["rule_demo_landing_email", "rule_demo_landing_email"],
  );

  const testCaseSuiteTraceability = testDesignService.getTestCaseSuiteTraceability(
    "test_case_demo_landing_mobile_cta_narrow_screen",
  );

  assert.equal(testCaseSuiteTraceability.project.id, "project_demo_landing");
  assert.equal(testCaseSuiteTraceability.module.id, "module_demo_landing_responsive");
  assert.equal(testCaseSuiteTraceability.requirement.id, "requirement_demo_landing_mobile");
  assert.equal(testCaseSuiteTraceability.businessRule.id, "rule_demo_landing_mobile_cta");
  assert.equal(
    testCaseSuiteTraceability.scenario.id,
    "scenario_demo_landing_mobile_cta_small_screen",
  );
  assert.equal(
    testCaseSuiteTraceability.testCase.id,
    "test_case_demo_landing_mobile_cta_narrow_screen",
  );
  assert.equal(testCaseSuiteTraceability.suiteCount, 2);
  assert.deepEqual(
    testCaseSuiteTraceability.testSuites.map((testSuite) => testSuite.id).sort(),
    ["test_suite_demo_landing_mobile_feature", "test_suite_demo_landing_release_main_flow"],
  );

  assert.deepEqual(testDesignService.getTestSuiteTraceability("test_suite_missing"), {
    project: null,
    testSuite: null,
    testCases: [],
    testCaseTraceability: [],
  });
});

test("test cycle model values match Block 05C scope", () => {
  assert.deepEqual(testDesignTypes.testCycleStatuses, [
    "draft",
    "planned",
    "active",
    "completed",
    "archived",
  ]);
  assert.deepEqual(testDesignTypes.testCyclePriorities, [
    "low",
    "medium",
    "high",
    "critical",
  ]);
  assert.match(testDesignTypesSource, /TestCycle/);
  assert.match(testDesignServiceSource, /demoTestCycles/);
});

test("test cycle input validation accepts supported values and rejects invalid values", () => {
  const validInput = {
    projectId: "project_demo_landing",
    name: "Ciclo smoke - Landing page",
    objective: "Planejar o recorte smoke da landing page.",
    status: "planned",
    priority: "high",
    testSuiteIds: ["test_suite_demo_landing_smoke"],
    owner: "user_demo_qa_lead",
    plannedStartAt: "2026-05-15",
    plannedEndAt: "2026-05-16",
  };

  assert.deepEqual(testDesignService.validateTestCycleInput(validInput), []);
  assert.equal(testDesignService.isTestCycleStatus("planned"), true);
  assert.equal(testDesignService.isTestCycleStatus("ready"), false);
  assert.equal(testDesignService.isTestCyclePriority("critical"), true);
  assert.equal(testDesignService.isTestCyclePriority("urgent"), false);
  assert.deepEqual(
    testDesignService.validateTestCycleInput({
      ...validInput,
      projectId: "",
      name: "",
      objective: "",
      status: "ready",
      priority: "urgent",
      testSuiteIds: ["x"],
      plannedStartAt: "invalid-date",
      plannedEndAt: "2026-05-14",
    }),
    [
      "test_cycle_project_required",
      "test_cycle_name_required",
      "test_cycle_objective_required",
      "invalid_test_cycle_status",
      "invalid_test_cycle_priority",
      "test_cycle_test_suite_id_required",
      "invalid_test_cycle_planned_start",
    ],
  );
  assert.deepEqual(
    testDesignService.validateTestCycleInput({ ...validInput, testSuiteIds: [] }),
    ["test_cycle_test_suites_required"],
  );
  assert.deepEqual(
    testDesignService.validateTestCycleInput({
      ...validInput,
      plannedStartAt: "2026-05-20",
      plannedEndAt: "2026-05-19",
    }),
    ["test_cycle_planned_end_before_start"],
  );

  const testCycle = testDesignService.createTestCycle(
    validInput,
    new Date("2026-05-12T12:15:00.000Z"),
  );
  assert.equal(testCycle.id, "test_cycle_1778588100000");
  assert.equal(testCycle.status, "planned");
  assert.deepEqual(testCycle.testSuiteIds, validInput.testSuiteIds);
  assert.equal(testCycle.createdAt, "2026-05-12T12:15:00.000Z");
});

test("test cycle listing helpers filter by project, status, and suite", () => {
  assert.deepEqual(
    testDesignService
      .listTestCyclesByProject("project_demo_landing")
      .map((testCycle) => testCycle.id)
      .sort(),
    [
      "test_cycle_demo_landing_mobile_draft",
      "test_cycle_demo_landing_release_completed",
      "test_cycle_demo_landing_smoke_planned",
    ],
  );
  assert.deepEqual(
    testDesignService
      .listTestCyclesByStatus("project_demo_landing", "planned")
      .map((testCycle) => testCycle.id),
    ["test_cycle_demo_landing_smoke_planned"],
  );
  assert.deepEqual(
    testDesignService
      .listTestCyclesBySuite("test_suite_demo_landing_smoke")
      .map((testCycle) => testCycle.status)
      .sort(),
    ["completed", "planned"],
  );
});

test("test cycle counts and summary are deterministic", () => {
  assert.equal(testDesignService.countTestCyclesByProject("project_demo_landing"), 3);
  assert.equal(testDesignService.countTestCyclesBySuite("test_suite_demo_landing_smoke"), 2);

  assert.deepEqual(testDesignService.getTestCycleSummary("project_demo_landing"), {
    totalCycles: 3,
    draftCycles: 1,
    plannedCycles: 1,
    activeCycles: 0,
    completedCycles: 1,
    archivedCycles: 0,
    criticalCycles: 1,
    totalLinkedSuites: 3,
    cyclesByStatus: {
      draft: 1,
      planned: 1,
      active: 0,
      completed: 1,
      archived: 0,
    },
  });

  assert.deepEqual(testDesignService.getTestCycleSummary("project_demo_saas"), {
    totalCycles: 1,
    draftCycles: 0,
    plannedCycles: 0,
    activeCycles: 1,
    completedCycles: 0,
    archivedCycles: 0,
    criticalCycles: 1,
    totalLinkedSuites: 1,
    cyclesByStatus: {
      draft: 0,
      planned: 0,
      active: 1,
      completed: 0,
      archived: 0,
    },
  });
});

test("test cycle traceability connects project, cycle, suites, and cases", () => {
  const cycleTraceability = testDesignService.getTestCycleTraceability(
    "test_cycle_demo_landing_release_completed",
  );

  assert.equal(cycleTraceability.project.id, "project_demo_landing");
  assert.equal(cycleTraceability.testCycle.id, "test_cycle_demo_landing_release_completed");
  assert.deepEqual(
    cycleTraceability.testSuites.map((testSuite) => testSuite.id).sort(),
    ["test_suite_demo_landing_release_main_flow", "test_suite_demo_landing_smoke"],
  );
  assert.equal(cycleTraceability.testSuiteTraceability.length, 2);
  assert.equal(
    cycleTraceability.testSuiteTraceability[0].testCaseTraceability[0].project.id,
    "project_demo_landing",
  );

  const suiteCycleTraceability = testDesignService.getTestSuiteCycleTraceability(
    "test_suite_demo_landing_smoke",
  );

  assert.equal(suiteCycleTraceability.project.id, "project_demo_landing");
  assert.equal(suiteCycleTraceability.testSuite.id, "test_suite_demo_landing_smoke");
  assert.equal(suiteCycleTraceability.cycleCount, 2);
  assert.deepEqual(
    suiteCycleTraceability.testCycles.map((testCycle) => testCycle.id).sort(),
    ["test_cycle_demo_landing_release_completed", "test_cycle_demo_landing_smoke_planned"],
  );

  assert.deepEqual(testDesignService.getTestCycleTraceability("test_cycle_missing"), {
    project: null,
    testCycle: null,
    testSuites: [],
    testSuiteTraceability: [],
  });
});

test("test execution model values match Block 05E scope", () => {
  assert.deepEqual(testDesignTypes.testExecutionStatuses, [
    "not_run",
    "passed",
    "failed",
    "blocked",
    "skipped",
  ]);
  assert.match(testDesignTypesSource, /TestExecution/);
  assert.match(testDesignServiceSource, /demoTestExecutions/);
  assert.deepEqual(
    testDesignService.demoTestExecutions.map((testExecution) => testExecution.status).sort(),
    ["blocked", "failed", "not_run", "passed", "skipped"],
  );
});

test("test execution input validation accepts supported values and business rules", () => {
  const validInput = {
    projectId: "project_demo_landing",
    cycleId: "test_cycle_demo_landing_release_completed",
    testSuiteId: "test_suite_demo_landing_smoke",
    testCaseId: "test_case_demo_landing_valid_email_submission",
    status: "passed",
    notes: "Fluxo validado sem divergências visíveis.",
    executedBy: "user_demo_qa_lead",
    executedAt: "2026-05-09",
  };

  assert.deepEqual(testDesignService.validateTestExecutionInput(validInput), []);
  assert.equal(testDesignService.isTestExecutionStatus("passed"), true);
  assert.equal(testDesignService.isTestExecutionStatus("ready"), false);
  assert.deepEqual(
    testDesignService.validateTestExecutionInput({
      projectId: "",
      cycleId: "",
      testSuiteId: "",
      testCaseId: "",
      status: "ready",
      executedAt: "invalid-date",
    }),
    [
      "test_execution_project_required",
      "test_execution_cycle_required",
      "test_execution_suite_required",
      "test_execution_case_required",
      "invalid_test_execution_status",
      "invalid_test_execution_executed_at",
      "test_execution_executed_by_required",
    ],
  );
  assert.deepEqual(
    testDesignService.validateTestExecutionInput({
      ...validInput,
      status: "failed",
      notes: "",
    }),
    ["test_execution_notes_required"],
  );
  assert.deepEqual(
    testDesignService.validateTestExecutionInput({
      ...validInput,
      status: "blocked",
      notes: "x",
    }),
    ["test_execution_notes_required"],
  );
  assert.deepEqual(
    testDesignService.validateTestExecutionInput({
      ...validInput,
      status: "not_run",
      executedAt: "",
      executedBy: "",
      notes: "",
    }),
    [],
  );

  const testExecution = testDesignService.createTestExecution(
    validInput,
    new Date("2026-05-12T12:20:00.000Z"),
  );
  assert.equal(testExecution.id, "test_execution_1778588400000");
  assert.equal(testExecution.status, "passed");
  assert.equal(testExecution.createdAt, "2026-05-12T12:20:00.000Z");

  const updatedExecution = testDesignService.updateTestExecution(testExecution, {
    status: "skipped",
    notes: "Pulado fora do escopo deste ciclo.",
  });
  assert.equal(updatedExecution.status, "skipped");
  assert.equal(updatedExecution.notes, "Pulado fora do escopo deste ciclo.");
});

test("test execution listing helpers filter by project, cycle, suite, test case, and status", () => {
  assert.deepEqual(
    testDesignService
      .listExecutionsByProject("project_demo_landing")
      .map((testExecution) => testExecution.id)
      .sort(),
    [
      "test_execution_demo_landing_mobile_skipped",
      "test_execution_demo_landing_release_invalid_email_failed",
      "test_execution_demo_landing_release_valid_email_passed",
      "test_execution_demo_landing_smoke_valid_email_not_run",
    ],
  );
  assert.deepEqual(
    testDesignService
      .listExecutionsByCycle("test_cycle_demo_landing_release_completed")
      .map((testExecution) => testExecution.status)
      .sort(),
    ["failed", "passed", "skipped"],
  );
  assert.deepEqual(
    testDesignService
      .listExecutionsBySuite("test_suite_demo_landing_smoke")
      .map((testExecution) => testExecution.status)
      .sort(),
    ["failed", "not_run", "passed"],
  );
  assert.deepEqual(
    testDesignService
      .listExecutionsByTestCase("test_case_demo_landing_valid_email_submission")
      .map((testExecution) => testExecution.status)
      .sort(),
    ["not_run", "passed"],
  );
  assert.deepEqual(
    testDesignService
      .listExecutionsByStatus("project_demo_landing", "failed")
      .map((testExecution) => testExecution.id),
    ["test_execution_demo_landing_release_invalid_email_failed"],
  );
});

test("test execution counts and summaries are deterministic", () => {
  assert.equal(
    testDesignService.countExecutionsByCycle("test_cycle_demo_landing_release_completed"),
    3,
  );
  assert.equal(
    testDesignService.countExecutionsByTestCase(
      "test_case_demo_landing_valid_email_submission",
    ),
    2,
  );

  assert.deepEqual(testDesignService.getTestExecutionSummary("project_demo_landing"), {
    totalExecutions: 4,
    notRunExecutions: 1,
    passedExecutions: 1,
    failedExecutions: 1,
    blockedExecutions: 0,
    skippedExecutions: 1,
    executedExecutions: 3,
    completionRate: 75,
    passRate: 33,
    executionsByStatus: {
      not_run: 1,
      passed: 1,
      failed: 1,
      blocked: 0,
      skipped: 1,
    },
  });

  assert.deepEqual(
    testDesignService.getTestCycleExecutionSummary("test_cycle_demo_landing_release_completed"),
    {
      totalExecutions: 3,
      notRunExecutions: 0,
      passedExecutions: 1,
      failedExecutions: 1,
      blockedExecutions: 0,
      skippedExecutions: 1,
      completionRate: 100,
      passRate: 33,
    },
  );

  assert.deepEqual(testDesignService.getTestExecutionSummary("project_without_executions"), {
    totalExecutions: 0,
    notRunExecutions: 0,
    passedExecutions: 0,
    failedExecutions: 0,
    blockedExecutions: 0,
    skippedExecutions: 0,
    executedExecutions: 0,
    completionRate: 0,
    passRate: 0,
    executionsByStatus: {
      not_run: 0,
      passed: 0,
      failed: 0,
      blocked: 0,
      skipped: 0,
    },
  });
});

test("test execution traceability connects project, cycle, suite, case, and deeper artifacts", () => {
  const executionTraceability = testDesignService.getTestExecutionTraceability(
    "test_execution_demo_landing_release_invalid_email_failed",
  );

  assert.equal(executionTraceability.project.id, "project_demo_landing");
  assert.equal(executionTraceability.module.id, "module_demo_landing_conversion");
  assert.equal(executionTraceability.requirement.id, "requirement_demo_landing_form");
  assert.equal(executionTraceability.businessRule.id, "rule_demo_landing_email");
  assert.equal(executionTraceability.scenario.id, "scenario_demo_landing_invalid_email");
  assert.equal(
    executionTraceability.testCase.id,
    "test_case_demo_landing_invalid_email_rejected",
  );
  assert.equal(executionTraceability.testSuite.id, "test_suite_demo_landing_smoke");
  assert.equal(
    executionTraceability.testCycle.id,
    "test_cycle_demo_landing_release_completed",
  );
  assert.equal(
    executionTraceability.testExecution.id,
    "test_execution_demo_landing_release_invalid_email_failed",
  );

  const caseExecutionTraceability = testDesignService.getTestCaseExecutionTraceability(
    "test_case_demo_landing_valid_email_submission",
  );
  assert.equal(caseExecutionTraceability.executionCount, 2);
  assert.deepEqual(
    caseExecutionTraceability.testCycles.map((testCycle) => testCycle.id).sort(),
    ["test_cycle_demo_landing_release_completed", "test_cycle_demo_landing_smoke_planned"],
  );

  const cycleExecutionTraceability = testDesignService.getCycleExecutionTraceability(
    "test_cycle_demo_landing_release_completed",
  );
  assert.equal(cycleExecutionTraceability.project.id, "project_demo_landing");
  assert.equal(cycleExecutionTraceability.testExecutionTraceability.length, 3);
  assert.deepEqual(
    cycleExecutionTraceability.testExecutions.map((testExecution) => testExecution.status).sort(),
    ["failed", "passed", "skipped"],
  );

  assert.deepEqual(testDesignService.getTestExecutionTraceability("test_execution_missing"), {
    project: null,
    module: null,
    requirement: null,
    businessRule: null,
    scenario: null,
    testCase: null,
    testSuite: null,
    testCycle: null,
    testExecution: null,
  });
});

test("test scenario UI source exists and exposes the pt-BR section", () => {
  assert.match(pageSource, /TestScenarioSection/);
  assert.match(testScenarioSectionSource, /Cenários de teste/);
  assert.match(testScenarioSectionSource, /Projeto em análise/);
  assert.match(testScenarioSectionSource, /Resumo de cenários/);
  assert.match(testScenarioSectionSource, /Novo cenário/);
  assert.match(testScenarioSectionSource, /Editar cenário/);
});

test("test scenario UI uses local demo persistence and service helpers", () => {
  assert.match(testScenarioSectionSource, /frankintest\.block04\.scenarios/);
  assert.match(testScenarioSectionSource, /demoTestScenarios/);
  assert.match(testScenarioSectionSource, /validateTestScenarioInput/);
  assert.match(testScenarioSectionSource, /createTestScenario/);
  assert.match(testScenarioSectionSource, /updateTestScenario/);
  assert.match(testScenarioSectionSource, /getScenarioDesignSummary/);
  assert.match(testScenarioSectionSource, /listScenariosByProject/);
});

test("test scenario UI preserves project module requirement rule traceability flow", () => {
  [
    "Projeto -&gt; Módulo -&gt; Requisito -&gt; Regra de negócio -&gt; Cenário de teste",
    "Módulo",
    "Requisito",
    "Regra de negócio",
    "Cenário de teste",
    "Tipo de cenário",
    "Prioridade",
    "Status",
    "Nível de teste",
    "Rascunho assistido por IA",
    "Revisado por",
  ].forEach((copy) => {
    assert.match(testScenarioSectionSource, new RegExp(copy));
  });
});

test("test case UI source exists and exposes the pt-BR section", () => {
  assert.match(pageSource, /TestCaseSection/);
  assert.match(testCaseSectionSource, /Casos de teste/);
  assert.match(testCaseSectionSource, /Projeto em análise/);
  assert.match(testCaseSectionSource, /Resumo de casos/);
  assert.match(testCaseSectionSource, /Novo caso de teste/);
  assert.match(testCaseSectionSource, /Editar caso de teste/);
});

test("test case UI uses local demo persistence and service helpers", () => {
  assert.match(testCaseSectionSource, /frankintest\.block04\.testCases/);
  assert.match(testCaseSectionSource, /frankintest\.block04\.scenarios/);
  assert.match(testCaseSectionSource, /demoTestCases/);
  assert.match(testCaseSectionSource, /demoTestScenarios/);
  assert.match(testCaseSectionSource, /validateTestCaseInput/);
  assert.match(testCaseSectionSource, /createTestCase/);
  assert.match(testCaseSectionSource, /updateTestCase/);
  assert.match(testCaseSectionSource, /getTestCaseDesignSummary/);
  assert.match(testCaseSectionSource, /listTestCasesByProject/);
});

test("test case UI preserves full traceability labels", () => {
  [
    "Projeto -&gt; Módulo -&gt; Requisito -&gt; Regra de negócio -&gt; Cenário de teste -&gt; Caso de teste",
    "Projeto",
    "Módulo",
    "Requisito",
    "Regra de negócio",
    "Cenário de teste",
    "Caso de teste",
    "Objetivo",
    "Pré-condição",
    "Resultado esperado",
    "Prioridade",
    "Status de automação",
    "Rascunho assistido por IA",
    "Revisado por",
  ].forEach((copy) => {
    assert.match(testCaseSectionSource, new RegExp(copy));
  });
});

test("test case UI includes simple textarea and ordered-list steps behavior", () => {
  assert.match(testCaseSectionSource, /stepsText/);
  assert.match(testCaseSectionSource, /\.split\("\\n"\)/);
  assert.match(testCaseSectionSource, /\.filter\(Boolean\)/);
  assert.match(testCaseSectionSource, /Um passo por linha/);
});

test("test suite UI source exists and exposes the pt-BR section", () => {
  assert.match(pageSource, /TestSuiteSection/);
  assert.match(testSuiteSectionSource, /Suítes de teste/);
  assert.match(testSuiteSectionSource, /Projeto em análise/);
  assert.match(testSuiteSectionSource, /Resumo de suítes/);
  assert.match(testSuiteSectionSource, /Nova suíte/);
  assert.match(testSuiteSectionSource, /Editar suíte/);
});

test("test suite UI uses local demo persistence and service helpers", () => {
  assert.match(testSuiteSectionSource, /frankintest\.block05\.testSuites/);
  assert.match(testSuiteSectionSource, /demoTestSuites/);
  assert.match(testSuiteSectionSource, /validateTestSuiteInput/);
  assert.match(testSuiteSectionSource, /createTestSuite/);
  assert.match(testSuiteSectionSource, /updateTestSuite/);
  assert.match(testSuiteSectionSource, /getTestSuiteSummary/);
  assert.match(testSuiteSectionSource, /listTestSuitesByProject/);
  assert.match(testSuiteSectionSource, /listTestSuitesByTestCase/);
});

test("test suite UI includes multi-select checkboxes for linked test cases", () => {
  assert.match(testSuiteSectionSource, /Selecionar casos de teste/);
  assert.match(testSuiteSectionSource, /type="checkbox"/);
  assert.match(testSuiteSectionSource, /checked=\{formState\.testCaseIds\.includes\(testCase\.id\)\}/);
  assert.match(testSuiteSectionSource, /toggleTestCase/);
  assert.match(testSuiteSectionSource, /validateTestSuiteInput\(input\)/);
  assert.match(testSuiteSectionSource, /ao menos um caso de teste vinculado/);
});

test("test suite UI preserves relationship labels and suite metadata", () => {
  [
    "Projeto -&gt; Suíte de teste -&gt; Casos de teste",
    "Projeto",
    "Módulo",
    "Requisito",
    "Regra de negócio",
    "Cenário de teste",
    "Caso de teste",
    "Suíte de teste",
    "Casos vinculados",
    "Tipo de suíte",
    "Prioridade",
    "Status",
    "Responsável",
    "Smoke",
    "Regressão",
    "Release",
    "Funcional",
    "Exploratório",
    "API",
    "Mobile",
    "Segurança",
    "Acessibilidade",
    "Performance",
  ].forEach((copy) => {
    assert.match(testSuiteSectionSource, new RegExp(copy));
  });
});

test("test cycle UI source exists and exposes the pt-BR section", () => {
  assert.match(pageSource, /TestCycleSection/);
  assert.match(testCycleSectionSource, /Ciclos de teste/);
  assert.match(testCycleSectionSource, /Projeto em análise/);
  assert.match(testCycleSectionSource, /Resumo de ciclos/);
  assert.match(testCycleSectionSource, /Novo ciclo/);
  assert.match(testCycleSectionSource, /Editar ciclo/);
});

test("test cycle UI uses local demo persistence and service helpers", () => {
  assert.match(testCycleSectionSource, /frankintest\.block05\.testCycles/);
  assert.match(testCycleSectionSource, /frankintest\.block05\.testSuites/);
  assert.match(testCycleSectionSource, /demoTestCycles/);
  assert.match(testCycleSectionSource, /demoTestSuites/);
  assert.match(testCycleSectionSource, /validateTestCycleInput/);
  assert.match(testCycleSectionSource, /createTestCycle/);
  assert.match(testCycleSectionSource, /updateTestCycle/);
  assert.match(testCycleSectionSource, /getTestCycleSummary/);
  assert.match(testCycleSectionSource, /listTestCyclesByProject/);
  assert.match(testCycleSectionSource, /listTestCyclesBySuite/);
});

test("test cycle UI includes multi-select checkboxes for linked test suites", () => {
  assert.match(testCycleSectionSource, /Selecionar suítes de teste/);
  assert.match(testCycleSectionSource, /type="checkbox"/);
  assert.match(testCycleSectionSource, /checked=\{formState\.testSuiteIds\.includes\(testSuite\.id\)\}/);
  assert.match(testCycleSectionSource, /toggleTestSuite/);
  assert.match(testCycleSectionSource, /validateTestCycleInput\(input\)/);
  assert.match(testCycleSectionSource, /ao menos uma suíte de teste vinculada/);
});

test("test cycle UI preserves relationship labels and cycle metadata", () => {
  [
    "Projeto -&gt; Ciclo de teste -&gt; Suítes de teste",
    "Projeto",
    "Módulo",
    "Requisito",
    "Regra de negócio",
    "Cenário de teste",
    "Caso de teste",
    "Suíte de teste",
    "Ciclo de teste",
    "Suítes vinculadas",
    "Objetivo",
    "Prioridade",
    "Status",
    "Responsável",
    "Início planejado",
    "Fim planejado",
    "Rascunho",
    "Planejado",
    "Ativo",
    "Concluído",
    "Arquivado",
    "Este ciclo ainda não executa testes; execução será adicionada em bloco posterior.",
  ].forEach((copy) => {
    assert.match(testCycleSectionSource, new RegExp(copy));
  });
});

test("test execution UI source exists and exposes the pt-BR section", () => {
  assert.match(pageSource, /TestExecutionSection/);
  assert.match(testExecutionSectionSource, /Execução de testes/);
  assert.match(testExecutionSectionSource, /Projeto em análise/);
  assert.match(testExecutionSectionSource, /Ciclo em execução/);
  assert.match(testExecutionSectionSource, /Resumo de execução/);
  assert.match(testExecutionSectionSource, /Casos do ciclo/);
});

test("test execution UI uses local demo persistence and service helpers", () => {
  assert.match(testExecutionSectionSource, /frankintest\.block05\.testExecutions/);
  assert.match(testExecutionSectionSource, /frankintest\.block05\.testCycles/);
  assert.match(testExecutionSectionSource, /frankintest\.block05\.testSuites/);
  assert.match(testExecutionSectionSource, /frankintest\.block04\.testCases/);
  assert.match(testExecutionSectionSource, /demoTestExecutions/);
  assert.match(testExecutionSectionSource, /validateTestExecutionInput/);
  assert.match(testExecutionSectionSource, /createTestExecution/);
  assert.match(testExecutionSectionSource, /updateTestExecution/);
  assert.match(testExecutionSectionSource, /getTestExecutionSummary/);
  assert.match(testExecutionSectionSource, /getTestCycleExecutionSummary/);
  assert.match(testExecutionSectionSource, /listExecutionsByCycle/);
});

test("test execution UI includes status labels and local update controls", () => {
  [
    "Não executado",
    "Aprovado",
    "Falhou",
    "Bloqueado",
    "Pulado",
    "Status da execução",
    "Notas da execução",
    "Executado por",
    "Executado em",
    "Atualizar execução",
    "Preparar execuções do ciclo",
  ].forEach((copy) => {
    assert.match(testExecutionSectionSource, new RegExp(copy));
  });
  assert.match(testExecutionSectionSource, /type="date"/);
  assert.match(testExecutionSectionSource, /textarea/);
});

test("test execution UI preserves relationship labels and scope limitations", () => {
  [
    "Projeto -&gt; Ciclo de teste -&gt; Suíte de teste -&gt; Caso de teste -&gt; Execução",
    "Projeto",
    "Ciclo de teste",
    "Suíte de teste",
    "Caso de teste",
    "Execução",
    "Módulo",
    "Requisito",
    "Regra de negócio",
    "Cenário de teste",
    "Falhas ainda não geram bugs automaticamente; isso será adicionado no bloco de bugs.",
    "Evidências ainda não são anexadas neste bloco.",
    "Persistência local de demonstração via localStorage",
  ].forEach((copy) => {
    assert.match(testExecutionSectionSource, new RegExp(copy));
  });
});

test("bug report model values match Block 06A scope", () => {
  assert.deepEqual(bugTypes.bugSeverities, ["low", "medium", "high", "critical"]);
  assert.deepEqual(bugTypes.bugPriorities, ["low", "medium", "high", "critical"]);
  assert.deepEqual(bugTypes.bugStatuses, [
    "draft",
    "open",
    "in_progress",
    "retest",
    "resolved",
    "closed",
    "rejected",
  ]);
  assert.match(bugTypesSource, /BugReport/);
  assert.match(bugServiceSource, /demoBugReports/);
});

test("bug report input validation accepts supported values and rejects invalid values", () => {
  const validInput = {
    projectId: "project_demo_landing",
    moduleId: "module_demo_landing_conversion",
    executionId: "test_execution_demo_landing_release_invalid_email_failed",
    title: "Invalid email accepted",
    description: "Lead form accepts invalid email format.",
    stepsToReproduce: ["Open landing page", "Submit invalid email"],
    actualResult: "Submission is accepted.",
    expectedResult: "Submission is blocked with validation feedback.",
    severity: "high",
    priority: "critical",
    status: "open",
    environment: "Chrome staging",
    createdBy: "user_demo_qa_lead",
  };

  assert.deepEqual(bugService.validateBugReportInput(validInput), []);
  assert.equal(bugService.isBugSeverity("critical"), true);
  assert.equal(bugService.isBugSeverity("urgent"), false);
  assert.equal(bugService.isBugPriority("high"), true);
  assert.equal(bugService.isBugStatus("retest"), true);
  assert.deepEqual(
    bugService.validateBugReportInput({
      ...validInput,
      projectId: "",
      moduleId: "",
      title: "",
      description: "",
      stepsToReproduce: ["x"],
      actualResult: "",
      expectedResult: "",
      severity: "urgent",
      priority: "later",
      status: "blocked",
      environment: "",
      createdBy: "x",
    }),
    [
      "bug_project_required",
      "bug_module_required",
      "bug_title_required",
      "bug_description_required",
      "bug_step_required",
      "bug_actual_result_required",
      "bug_expected_result_required",
      "invalid_bug_severity",
      "invalid_bug_priority",
      "invalid_bug_status",
      "bug_environment_required",
      "bug_created_by_required",
    ],
  );
  assert.deepEqual(bugService.validateBugReportInput({ ...validInput, stepsToReproduce: [] }), [
    "bug_steps_required",
  ]);

  const bugReport = bugService.createBugReport(
    validInput,
    new Date("2026-05-13T12:00:00.000Z"),
  );
  assert.equal(bugReport.id, "bug_report_1778673600000");
  assert.equal(bugReport.executionId, validInput.executionId);
  assert.deepEqual(bugReport.stepsToReproduce, ["Open landing page", "Submit invalid email"]);
  assert.equal(bugReport.createdAt, "2026-05-13T12:00:00.000Z");
});

test("bug report listing and counting helpers filter deterministic demo bugs", () => {
  assert.deepEqual(
    bugService
      .listBugReportsByProject("project_demo_landing")
      .map((bugReport) => bugReport.id)
      .sort(),
    [
      "bug_demo_landing_invalid_email_open",
      "bug_demo_landing_mobile_cta_draft",
      "bug_demo_landing_validation_feedback_retest",
    ],
  );
  assert.deepEqual(
    bugService
      .listBugReportsByModule("module_demo_landing_conversion")
      .map((bugReport) => bugReport.id)
      .sort(),
    ["bug_demo_landing_invalid_email_open", "bug_demo_landing_validation_feedback_retest"],
  );
  assert.deepEqual(
    bugService
      .listBugReportsByExecution("test_execution_demo_landing_release_invalid_email_failed")
      .map((bugReport) => bugReport.status)
      .sort(),
    ["open", "retest"],
  );
  assert.deepEqual(
    bugService
      .listBugReportsByStatus("project_demo_landing", "draft")
      .map((bugReport) => bugReport.id),
    ["bug_demo_landing_mobile_cta_draft"],
  );
  assert.deepEqual(
    bugService
      .listBugReportsBySeverity("project_demo_saas", "critical")
      .map((bugReport) => bugReport.id),
    ["bug_demo_saas_environment_blocked_open"],
  );
  assert.equal(bugService.countBugReportsByProject("project_demo_landing"), 3);
  assert.equal(
    bugService.countBugReportsByExecution(
      "test_execution_demo_landing_release_invalid_email_failed",
    ),
    2,
  );
});

test("bug report summary counts status, severity, and execution linkage", () => {
  assert.deepEqual(bugService.getBugReportSummary("project_demo_landing"), {
    totalBugs: 3,
    draftBugs: 1,
    openBugs: 1,
    inProgressBugs: 0,
    retestBugs: 1,
    resolvedBugs: 0,
    closedBugs: 0,
    rejectedBugs: 0,
    criticalBugs: 0,
    highBugs: 1,
    linkedToExecutionBugs: 2,
    bugsByStatus: {
      draft: 1,
      open: 1,
      in_progress: 0,
      retest: 1,
      resolved: 0,
      closed: 0,
      rejected: 0,
    },
    bugsBySeverity: {
      low: 0,
      medium: 2,
      high: 1,
      critical: 0,
    },
  });
});

test("bug report traceability connects module and execution context", () => {
  const bugTraceability = bugService.getBugReportTraceability(
    "bug_demo_landing_invalid_email_open",
  );

  assert.equal(bugTraceability.project.id, "project_demo_landing");
  assert.equal(bugTraceability.module.id, "module_demo_landing_conversion");
  assert.equal(
    bugTraceability.execution.id,
    "test_execution_demo_landing_release_invalid_email_failed",
  );
  assert.equal(
    bugTraceability.testCase.id,
    "test_case_demo_landing_invalid_email_rejected",
  );
  assert.equal(bugTraceability.testSuite.id, "test_suite_demo_landing_smoke");
  assert.equal(bugTraceability.testCycle.id, "test_cycle_demo_landing_release_completed");
  assert.equal(bugTraceability.requirement.id, "requirement_demo_landing_form");
  assert.equal(bugTraceability.businessRule.id, "rule_demo_landing_email");
  assert.equal(bugTraceability.scenario.id, "scenario_demo_landing_invalid_email");

  assert.deepEqual(bugService.getBugReportTraceability("bug_missing"), {
    project: null,
    module: null,
    requirement: null,
    businessRule: null,
    scenario: null,
    testCase: null,
    testSuite: null,
    testCycle: null,
    execution: null,
    bugReport: null,
  });
});

test("execution and module bug traceability helpers expose linked bugs", () => {
  const executionTraceability = bugService.getExecutionBugTraceability(
    "test_execution_demo_landing_release_invalid_email_failed",
  );
  assert.equal(executionTraceability.execution.status, "failed");
  assert.equal(executionTraceability.bugCount, 2);
  assert.deepEqual(
    executionTraceability.bugReports.map((bugReport) => bugReport.id).sort(),
    ["bug_demo_landing_invalid_email_open", "bug_demo_landing_validation_feedback_retest"],
  );

  const moduleTraceability = bugService.getModuleBugTraceability(
    "module_demo_landing_conversion",
  );
  assert.equal(moduleTraceability.project.id, "project_demo_landing");
  assert.equal(moduleTraceability.module.id, "module_demo_landing_conversion");
  assert.equal(moduleTraceability.bugCount, 2);
});

test("bug report UI source exists and exposes the pt-BR section", () => {
  assert.match(pageSource, /BugReportSection/);
  assert.match(bugReportSectionSource, /Bugs e defeitos/);
  assert.match(bugReportSectionSource, /Projeto em análise/);
  assert.match(bugReportSectionSource, /Resumo de bugs/);
  assert.match(bugReportSectionSource, /Novo bug/);
  assert.match(bugReportSectionSource, /Editar bug/);
});

test("bug report UI uses local persistence and bug service helpers", () => {
  assert.match(bugReportSectionSource, /frankintest\.block06\.bugReports/);
  assert.match(bugReportSectionSource, /frankintest\.block05\.testExecutions/);
  assert.match(bugReportSectionSource, /demoBugReports/);
  assert.match(bugReportSectionSource, /validateBugReportInput/);
  assert.match(bugReportSectionSource, /createBugReport/);
  assert.match(bugReportSectionSource, /updateBugReport/);
  assert.match(bugReportSectionSource, /getBugReportSummary/);
  assert.match(bugReportSectionSource, /listBugReportsByProject/);
});

test("bug report UI includes steps textarea and ordered list behavior", () => {
  assert.match(bugReportSectionSource, /Passos para reproduzir/);
  assert.match(bugReportSectionSource, /textarea/);
  assert.match(bugReportSectionSource, /\.split\("\\n"\)/);
  assert.match(bugReportSectionSource, /\.filter\(Boolean\)/);
  assert.match(bugReportSectionSource, /<ol/);
  assert.match(bugReportSectionSource, /stepsToReproduce\.map/);
});

test("bug report UI preserves relationship labels and scope limitations", () => {
  [
    "Projeto -&gt; Módulo -&gt; Bug",
    "Projeto -&gt; Módulo -&gt; Execução -&gt; Bug",
    "Projeto",
    "Módulo",
    "Execução",
    "Bug",
    "Módulo afetado",
    "Execução vinculada",
    "Sem execução vinculada",
    "Falha vinculada",
    "Bloqueio vinculado",
    "Resultado atual",
    "Resultado esperado",
    "Severidade",
    "Prioridade",
    "Status",
    "Ambiente",
    "Criado por",
    "Persistência local de demonstração via localStorage",
    "Evidências ainda não são anexadas neste bloco.",
    "Bugs ainda não geram relatórios automaticamente.",
  ].forEach((copy) => {
    assert.match(bugReportSectionSource, new RegExp(copy));
  });
});

test("bug report navigation points to the local MVP section", () => {
  assert.match(i18nSource, /label: "Bugs e defeitos", href: "#bugs", status: "MVP local"/);
  assert.match(bugReportSectionSource, /id="bugs"/);
});

test("evidence model values match Block 06C scope", () => {
  assert.deepEqual(evidenceTypes.evidenceTypes, [
    "screenshot",
    "video",
    "log",
    "document",
    "url",
    "note",
  ]);
  assert.deepEqual(evidenceTypes.evidenceSources, [
    "manual",
    "execution",
    "bug_report",
    "imported",
  ]);
  assert.deepEqual(evidenceTypes.evidenceStatuses, [
    "draft",
    "attached",
    "needs_review",
    "archived",
  ]);
  assert.match(evidenceTypesSource, /Evidence/);
  assert.match(evidenceServiceSource, /demoEvidence/);
});

test("evidence input validation accepts supported values and rejects invalid values", () => {
  const validInput = {
    projectId: "project_demo_landing",
    bugReportId: "bug_demo_landing_invalid_email_open",
    executionId: "test_execution_demo_landing_release_invalid_email_failed",
    title: "Invalid email screenshot",
    description: "Reference showing invalid email accepted.",
    evidenceType: "screenshot",
    source: "bug_report",
    reference: "local reference path",
    status: "attached",
    capturedBy: "user_demo_qa_lead",
    capturedAt: "2026-05-13",
  };

  assert.deepEqual(evidenceService.validateEvidenceInput(validInput), []);
  assert.equal(evidenceService.isEvidenceType("screenshot"), true);
  assert.equal(evidenceService.isEvidenceType("image"), false);
  assert.equal(evidenceService.isEvidenceSource("execution"), true);
  assert.equal(evidenceService.isEvidenceStatus("needs_review"), true);
  assert.deepEqual(
    evidenceService.validateEvidenceInput({
      ...validInput,
      projectId: "",
      bugReportId: "",
      executionId: "",
      title: "",
      description: "",
      evidenceType: "image",
      source: "scanner",
      reference: "",
      status: "published",
      capturedBy: "x",
      capturedAt: "not-a-date",
    }),
    [
      "evidence_project_required",
      "evidence_link_required",
      "evidence_title_required",
      "evidence_description_required",
      "invalid_evidence_type",
      "invalid_evidence_source",
      "evidence_reference_required",
      "invalid_evidence_status",
      "evidence_captured_by_required",
      "invalid_evidence_captured_at",
    ],
  );

  const evidence = evidenceService.createEvidence(
    validInput,
    new Date("2026-05-13T13:00:00.000Z"),
  );
  assert.equal(evidence.id, "evidence_1778677200000");
  assert.equal(evidence.bugReportId, validInput.bugReportId);
  assert.equal(evidence.executionId, validInput.executionId);
  assert.equal(evidence.createdAt, "2026-05-13T13:00:00.000Z");
});

test("evidence listing and counting helpers filter deterministic demo evidence", () => {
  assert.deepEqual(
    evidenceService
      .listEvidenceByProject("project_demo_landing")
      .map((item) => item.id)
      .sort(),
    [
      "evidence_demo_execution_cycle_url",
      "evidence_demo_invalid_email_screenshot",
      "evidence_demo_mobile_viewport_note",
    ],
  );
  assert.deepEqual(
    evidenceService
      .listEvidenceByBugReport("bug_demo_landing_invalid_email_open")
      .map((item) => item.evidenceType),
    ["screenshot"],
  );
  assert.deepEqual(
    evidenceService
      .listEvidenceByExecution("test_execution_demo_saas_auth_boundary_blocked")
      .map((item) => item.id),
    ["evidence_demo_environment_unavailable_log"],
  );
  assert.deepEqual(
    evidenceService
      .listEvidenceByType("project_demo_landing", "note")
      .map((item) => item.id),
    ["evidence_demo_mobile_viewport_note"],
  );
  assert.deepEqual(
    evidenceService
      .listEvidenceByStatus("project_demo_landing", "needs_review")
      .map((item) => item.id),
    ["evidence_demo_execution_cycle_url"],
  );
  assert.equal(evidenceService.countEvidenceByProject("project_demo_landing"), 3);
  assert.equal(
    evidenceService.countEvidenceByBugReport("bug_demo_landing_invalid_email_open"),
    1,
  );
  assert.equal(
    evidenceService.countEvidenceByExecution(
      "test_execution_demo_landing_release_invalid_email_failed",
    ),
    1,
  );
});

test("evidence summary counts type, status, and linkage", () => {
  assert.deepEqual(evidenceService.getEvidenceSummary("project_demo_landing"), {
    totalEvidence: 3,
    screenshotEvidence: 1,
    videoEvidence: 0,
    logEvidence: 0,
    documentEvidence: 0,
    urlEvidence: 1,
    noteEvidence: 1,
    attachedEvidence: 1,
    evidenceNeedingReview: 1,
    linkedToBugEvidence: 2,
    linkedToExecutionEvidence: 2,
    evidenceByType: {
      screenshot: 1,
      video: 0,
      log: 0,
      document: 0,
      url: 1,
      note: 1,
    },
    evidenceByStatus: {
      draft: 1,
      attached: 1,
      needs_review: 1,
      archived: 0,
    },
  });
});

test("evidence traceability connects bug and execution context", () => {
  const traceability = evidenceService.getEvidenceTraceability(
    "evidence_demo_invalid_email_screenshot",
  );

  assert.equal(traceability.project.id, "project_demo_landing");
  assert.equal(traceability.module.id, "module_demo_landing_conversion");
  assert.equal(traceability.bugReport.id, "bug_demo_landing_invalid_email_open");
  assert.equal(
    traceability.execution.id,
    "test_execution_demo_landing_release_invalid_email_failed",
  );
  assert.equal(traceability.testCase.id, "test_case_demo_landing_invalid_email_rejected");
  assert.equal(traceability.testSuite.id, "test_suite_demo_landing_smoke");
  assert.equal(traceability.testCycle.id, "test_cycle_demo_landing_release_completed");
  assert.equal(traceability.requirement.id, "requirement_demo_landing_form");
  assert.equal(traceability.businessRule.id, "rule_demo_landing_email");
  assert.equal(traceability.scenario.id, "scenario_demo_landing_invalid_email");

  assert.deepEqual(evidenceService.getEvidenceTraceability("evidence_missing"), {
    project: null,
    module: null,
    requirement: null,
    businessRule: null,
    scenario: null,
    testCase: null,
    testSuite: null,
    testCycle: null,
    execution: null,
    bugReport: null,
    evidence: null,
  });
});

test("bug and execution evidence traceability helpers expose linked evidence", () => {
  const bugTraceability = evidenceService.getBugEvidenceTraceability(
    "bug_demo_landing_invalid_email_open",
  );
  assert.equal(bugTraceability.bugReport.id, "bug_demo_landing_invalid_email_open");
  assert.equal(bugTraceability.evidenceCount, 1);
  assert.equal(bugTraceability.evidence[0].id, "evidence_demo_invalid_email_screenshot");

  const executionTraceability = evidenceService.getExecutionEvidenceTraceability(
    "test_execution_demo_landing_release_invalid_email_failed",
  );
  assert.equal(executionTraceability.execution.status, "failed");
  assert.equal(executionTraceability.evidenceCount, 1);
  assert.equal(executionTraceability.evidence[0].evidenceType, "screenshot");
});

test("evidence UI source exists and exposes the pt-BR section", () => {
  assert.match(pageSource, /EvidenceSection/);
  assert.match(evidenceSectionSource, /Evidências/);
  assert.match(evidenceSectionSource, /Projeto em análise/);
  assert.match(evidenceSectionSource, /Resumo de evidências/);
  assert.match(evidenceSectionSource, /Nova evidência/);
  assert.match(evidenceSectionSource, /Editar evidência/);
});

test("evidence UI uses local persistence and evidence service helpers", () => {
  assert.match(evidenceSectionSource, /frankintest\.block06\.evidence/);
  assert.match(evidenceSectionSource, /frankintest\.block06\.bugReports/);
  assert.match(evidenceSectionSource, /frankintest\.block05\.testExecutions/);
  assert.match(evidenceSectionSource, /demoEvidence/);
  assert.match(evidenceSectionSource, /validateEvidenceInput/);
  assert.match(evidenceSectionSource, /createEvidence/);
  assert.match(evidenceSectionSource, /updateEvidence/);
  assert.match(evidenceSectionSource, /getEvidenceSummary/);
  assert.match(evidenceSectionSource, /listEvidenceByProject/);
});

test("evidence UI preserves relationship labels and scope limitations", () => {
  [
    "Projeto -&gt; Bug -&gt; Evidência",
    "Projeto -&gt; Execução -&gt; Evidência",
    "Projeto",
    "Bug",
    "Execução",
    "Evidência",
    "Bug vinculado",
    "Execução vinculada",
    "Sem bug vinculado",
    "Sem execução vinculada",
    "Tipo de evidência",
    "Origem",
    "Referência",
    "Status",
    "Capturado por",
    "Capturado em",
    "Print",
    "Vídeo",
    "Log",
    "Documento",
    "URL",
    "Nota",
    "Manual",
    "Execução",
    "Bug report",
    "Importado",
    "Persistência local de demonstração via localStorage",
    "Este bloco registra apenas metadados/referências; upload real de arquivos será implementado depois.",
    "Evidências ainda não geram relatórios automaticamente.",
  ].forEach((copy) => {
    assert.match(evidenceSectionSource, new RegExp(copy));
  });
});

test("evidence navigation points to the local MVP section", () => {
  assert.match(i18nSource, /label: "Evidências", href: "#evidence", status: "MVP local"/);
  assert.match(evidenceSectionSource, /id="evidence"/);
});

test("report type, status, and scope values match Block 07", () => {
  assert.deepEqual(reportTypesModule.reportTypes, [
    "qa_status",
    "execution_summary",
    "bug_summary",
    "evidence_summary",
    "release_review",
    "stakeholder_update",
  ]);
  assert.deepEqual(reportTypesModule.reportStatuses, [
    "draft",
    "ready",
    "needs_review",
    "archived",
  ]);
  assert.deepEqual(reportTypesModule.reportScopes, [
    "project",
    "cycle",
    "bug",
    "evidence",
    "mixed",
  ]);

  assert.match(reportTypesSource, /Report/);
  assert.match(reportTypesSource, /ReportInput/);
  assert.match(reportTypesSource, /ReportSummary/);
  assert.match(reportServiceSource, /demoReports/);
});

test("report validation accepts complete input and rejects unsupported values", () => {
  const validInput = {
    projectId: "project_demo_landing",
    title: "Relatório local",
    description: "Descrição local",
    reportType: "qa_status",
    status: "draft",
    scope: "project",
    linkedCycleIds: [],
    linkedExecutionIds: [],
    linkedBugReportIds: [],
    linkedEvidenceIds: [],
    summary: "Sumário local",
    risks: ["Risco local"],
    recommendations: ["Recomendação local"],
    conclusion: "Conclusão local",
    createdBy: "QA",
  };

  assert.equal(reportService.isReportType("qa_status"), true);
  assert.equal(reportService.isReportStatus("ready"), true);
  assert.equal(reportService.isReportScope("mixed"), true);
  assert.deepEqual(reportService.validateReportInput(validInput), []);

  assert.deepEqual(reportService.validateReportInput({ ...validInput, projectId: "" }), [
    "report_project_required",
  ]);
  assert.match(
    reportService
      .validateReportInput({
        ...validInput,
        title: "A",
        description: "B",
        reportType: "unsupported",
        status: "unsupported",
        scope: "unsupported",
        summary: "C",
        conclusion: "D",
        createdBy: "Q",
        risks: ["x"],
        recommendations: ["y"],
      })
      .join(","),
    /report_title_required/,
  );
  assert.match(
    reportService
      .validateReportInput({
        ...validInput,
        reportType: "unsupported",
        status: "unsupported",
        scope: "unsupported",
      })
      .join(","),
    /invalid_report_type,invalid_report_status,invalid_report_scope/,
  );
  assert.match(
    reportService.validateReportInput({ ...validInput, risks: ["x"] }).join(","),
    /report_risk_required/,
  );
  assert.match(
    reportService.validateReportInput({ ...validInput, recommendations: ["y"] }).join(","),
    /report_recommendation_required/,
  );
});

test("report service lists reports by project, type, status, and links", () => {
  assert.deepEqual(
    reportService.listReportsByProject("project_demo_landing").map((report) => report.id),
    [
      "report_demo_landing_qa_status",
      "report_demo_landing_execution_summary",
      "report_demo_landing_bug_summary",
      "report_demo_landing_evidence_summary",
    ],
  );
  assert.deepEqual(
    reportService
      .listReportsByType("project_demo_landing", "execution_summary")
      .map((report) => report.id),
    ["report_demo_landing_execution_summary"],
  );
  assert.deepEqual(
    reportService.listReportsByStatus("project_demo_landing", "ready").map((report) => report.id),
    ["report_demo_landing_qa_status", "report_demo_landing_evidence_summary"],
  );
  assert.deepEqual(
    reportService
      .listReportsByCycle("test_cycle_demo_landing_release_completed")
      .map((report) => report.id),
    [
      "report_demo_landing_qa_status",
      "report_demo_landing_execution_summary",
      "report_demo_landing_bug_summary",
      "report_demo_landing_evidence_summary",
    ],
  );
  assert.deepEqual(
    reportService
      .listReportsByExecution("test_execution_demo_landing_release_valid_email_passed")
      .map((report) => report.id),
    [
      "report_demo_landing_qa_status",
      "report_demo_landing_execution_summary",
      "report_demo_landing_evidence_summary",
    ],
  );
  assert.deepEqual(
    reportService
      .listReportsByBugReport("bug_demo_landing_mobile_cta_draft")
      .map((report) => report.id),
    ["report_demo_landing_bug_summary"],
  );
  assert.deepEqual(
    reportService
      .listReportsByEvidence("evidence_demo_mobile_viewport_note")
      .map((report) => report.id),
    ["report_demo_landing_bug_summary"],
  );
});

test("report create, update, and count helpers are deterministic with injected dates", () => {
  const now = new Date("2026-05-13T14:00:00.000Z");
  const input = {
    projectId: "project_demo_landing",
    title: "Relatório criado",
    description: "Descrição criada",
    reportType: "stakeholder_update",
    status: "draft",
    scope: "mixed",
    linkedCycleIds: ["test_cycle_demo_landing_release_completed"],
    linkedExecutionIds: ["test_execution_demo_landing_release_valid_email_passed"],
    linkedBugReportIds: ["bug_demo_landing_invalid_email_open"],
    linkedEvidenceIds: ["evidence_demo_invalid_email_screenshot"],
    summary: "Sumário criado",
    risks: ["Risco criado"],
    recommendations: ["Recomendação criada"],
    conclusion: "Conclusão criada",
    createdBy: "QA",
  };
  const created = reportService.createReport(input, now);
  const updated = reportService.updateReport(
    created,
    { status: "ready", title: "Relatório atualizado" },
    new Date("2026-05-13T15:00:00.000Z"),
  );

  assert.equal(created.id, "report_1778680800000");
  assert.equal(created.createdAt, "2026-05-13T14:00:00.000Z");
  assert.equal(updated.status, "ready");
  assert.equal(updated.title, "Relatório atualizado");
  assert.equal(updated.updatedAt, "2026-05-13T15:00:00.000Z");
  assert.equal(reportService.countReportsByProject("project_demo_landing"), 4);
  assert.equal(reportService.countReportsByType("project_demo_landing", "qa_status"), 1);
});

test("report summary counts status, type, and linkage", () => {
  assert.deepEqual(reportService.getReportSummary("project_demo_landing"), {
    totalReports: 4,
    draftReports: 1,
    readyReports: 2,
    reportsNeedingReview: 1,
    archivedReports: 0,
    qaStatusReports: 1,
    executionSummaryReports: 1,
    bugSummaryReports: 1,
    evidenceSummaryReports: 1,
    releaseReviewReports: 0,
    stakeholderUpdateReports: 0,
    linkedCycleReports: 4,
    linkedExecutionReports: 4,
    linkedBugReports: 4,
    linkedEvidenceReports: 4,
    reportsByType: {
      qa_status: 1,
      execution_summary: 1,
      bug_summary: 1,
      evidence_summary: 1,
      release_review: 0,
      stakeholder_update: 0,
    },
    reportsByStatus: {
      draft: 1,
      ready: 2,
      needs_review: 1,
      archived: 0,
    },
  });
});

test("buildReportSnapshot returns deterministic local project metrics", () => {
  assert.deepEqual(reportService.buildReportSnapshot("project_demo_landing"), {
    project: projectService.demoProjects.find((project) => project.id === "project_demo_landing"),
    executionSummary: {
      totalExecutions: 4,
      passedExecutions: 1,
      failedExecutions: 1,
      blockedExecutions: 0,
      skippedExecutions: 1,
      notRunExecutions: 1,
    },
    bugSummary: {
      totalBugs: 3,
      openBugs: 1,
      criticalBugs: 0,
    },
    evidenceSummary: {
      totalEvidence: 3,
      attachedEvidence: 1,
      evidenceNeedingReview: 1,
    },
    totalCycles: 3,
    totalExecutions: 4,
    totalBugs: 3,
    totalEvidence: 3,
    openBugs: 1,
    criticalBugs: 0,
    attachedEvidence: 1,
    reportsCount: 4,
  });
});

test("report traceability connects project, cycles, executions, bugs, evidence, and report", () => {
  const traceability = reportService.getReportTraceability("report_demo_landing_qa_status");

  assert.equal(traceability.project.id, "project_demo_landing");
  assert.equal(traceability.report.id, "report_demo_landing_qa_status");
  assert.equal(traceability.testCycles.length, 2);
  assert.equal(traceability.testExecutions.length, 3);
  assert.equal(traceability.bugReports.length, 2);
  assert.equal(traceability.evidence.length, 2);

  const projectTraceability = reportService.getProjectReportTraceability("project_demo_landing");
  assert.equal(projectTraceability.project.id, "project_demo_landing");
  assert.equal(projectTraceability.reportCount, 4);

  const bugTraceability = reportService.getBugReportReportTraceability(
    "bug_demo_landing_invalid_email_open",
  );
  assert.equal(bugTraceability.bugReport.id, "bug_demo_landing_invalid_email_open");
  assert.equal(bugTraceability.reportCount, 4);

  const evidenceTraceability = reportService.getEvidenceReportTraceability(
    "evidence_demo_invalid_email_screenshot",
  );
  assert.equal(evidenceTraceability.evidence.id, "evidence_demo_invalid_email_screenshot");
  assert.equal(evidenceTraceability.reportCount, 3);
});

test("report UI source exists and exposes the pt-BR section", () => {
  assert.match(pageSource, /ReportSection/);
  assert.match(reportSectionSource, /Relatórios/);
  assert.match(reportSectionSource, /Projeto em análise/);
  assert.match(reportSectionSource, /Resumo de relatórios/);
  assert.match(reportSectionSource, /Novo relatório/);
  assert.match(reportSectionSource, /Editar relatório/);
});

test("report UI uses local persistence and report service helpers", () => {
  assert.match(reportSectionSource, /frankintest\.block07\.reports/);
  assert.match(reportSectionSource, /frankintest\.block05\.testCycles/);
  assert.match(reportSectionSource, /frankintest\.block05\.testExecutions/);
  assert.match(reportSectionSource, /frankintest\.block06\.bugReports/);
  assert.match(reportSectionSource, /frankintest\.block06\.evidence/);
  assert.match(reportSectionSource, /demoReports/);
  assert.match(reportSectionSource, /validateReportInput/);
  assert.match(reportSectionSource, /createReport/);
  assert.match(reportSectionSource, /updateReport/);
  assert.match(reportSectionSource, /getReportSummary/);
  assert.match(reportSectionSource, /listReportsByProject/);
  assert.match(reportSectionSource, /buildReportSnapshot/);
});

test("report UI preserves relationship labels and scope limitations", () => {
  [
    "Projeto -&gt; Execuções -&gt; Bugs -&gt; Evidências -&gt; Relatório",
    "Projeto",
    "Execuções",
    "Bugs",
    "Evidências",
    "Relatório",
    "Tipo de relatório",
    "Escopo",
    "Status",
    "Ciclos vinculados",
    "Execuções vinculadas",
    "Bugs vinculados",
    "Evidências vinculadas",
    "Sumário",
    "Riscos",
    "Recomendações",
    "Conclusão",
    "Criado por",
    "Preencher resumo com snapshot local",
    "Relatório de status QA",
    "Resumo de execução",
    "Resumo de bugs",
    "Resumo de evidências",
    "Revisão de release",
    "Atualização para stakeholders",
    "Persistência local de demonstração via localStorage",
    "Este bloco não",
    "gera PDF, download ou exportação real",
    "Este relatório é estruturado localmente; geração com IA será adicionada depois.",
  ].forEach((copy) => {
    assert.match(reportSectionSource, new RegExp(copy));
  });
});

test("report UI keeps first render deterministic and loads localStorage after mount", () => {
  assert.match(reportSectionSource, /useState<Report\[\]>\(demoReports\)/);
  assert.match(reportSectionSource, /hasLoadedLocalReports/);
  assert.match(reportSectionSource, /useEffect\(\(\) =>/);
  assert.match(reportSectionSource, /window\.localStorage\.getItem\(reportStorageKey\)/);
  assert.match(reportSectionSource, /if \(!hasLoadedLocalReports\)/);
  assert.doesNotMatch(reportSectionSource, /Date\.now/);
  assert.doesNotMatch(reportSectionSource, /Math\.random/);
  assert.doesNotMatch(reportSectionSource, /suppressHydrationWarning/);
});

test("report navigation points to the local MVP section", () => {
  assert.match(i18nSource, /label: "Relatórios", href: "#reports", status: "MVP local"/);
  assert.match(reportSectionSource, /id="reports"/);
});

test("AI usage model values are explicit and future provider values are metadata only", () => {
  assert.deepEqual(aiUsageTypes.aiFeatures, [
    "vulnerability_checkup",
    "test_case_generation",
    "bug_summary",
    "report_assist",
    "drift_analysis",
    "business_rule_analysis",
    "automation_suggestion",
    "requirement_review",
  ]);
  assert.deepEqual(aiUsageTypes.aiInputArtifactTypes, [
    "project",
    "module",
    "requirement",
    "business_rule",
    "scenario",
    "test_case",
    "suite",
    "cycle",
    "execution",
    "bug",
    "evidence",
    "report",
    "url",
    "mixed",
  ]);
  assert.deepEqual(aiUsageTypes.aiRunStatuses, [
    "estimated",
    "queued",
    "running",
    "completed",
    "failed",
    "cancelled",
  ]);
  assert.deepEqual(aiUsageTypes.aiProviders, ["mock", "openai", "anthropic", "google", "other"]);
  assert.deepEqual(aiUsageTypes.aiCreditTransactionTypes, [
    "grant",
    "reserve",
    "charge",
    "refund",
    "adjustment",
  ]);
  assert.deepEqual(aiUsageTypes.aiCreditTransactionStatuses, [
    "pending",
    "completed",
    "cancelled",
  ]);

  assert.equal(aiUsageService.isAiFeature("report_assist"), true);
  assert.equal(aiUsageService.isAiFeature("chat"), false);
  assert.equal(aiUsageService.isAiInputArtifactType("business_rule"), true);
  assert.equal(aiUsageService.isAiRunStatus("completed"), true);
  assert.equal(aiUsageService.isAiProvider("mock"), true);
  assert.equal(aiUsageService.isAiCreditTransactionType("reserve"), true);
  assert.equal(aiUsageService.isAiCreditTransactionStatus("pending"), true);
  assert.match(aiUsageTypesSource, /AiRun/);
  assert.match(aiUsageTypesSource, /AiCreditBalance/);
  assert.match(aiUsageTypesSource, /AiCreditTransaction/);
});

test("AI run validation keeps AI attached to structured artifacts", () => {
  const validInput = {
    projectId: "project_demo_landing",
    feature: "automation_suggestion",
    inputArtifactType: "test_case",
    inputArtifactIds: ["test_case_demo_landing_valid_email_submission"],
    promptSummary: "Sugerir automacao candidata para caso de teste.",
    requestedBy: "QA",
  };

  assert.deepEqual(aiUsageService.validateAiRunInput(validInput), []);
  assert.deepEqual(aiUsageService.validateAiRunInput({ ...validInput, projectId: "" }), [
    "ai_run_project_required",
  ]);
  assert.deepEqual(
    aiUsageService.validateAiRunInput({ ...validInput, inputArtifactIds: [] }),
    ["ai_run_artifact_required"],
  );
  assert.deepEqual(
    aiUsageService.validateAiRunInput({
      ...validInput,
      inputArtifactType: "project",
      inputArtifactIds: [],
    }),
    [],
  );
  assert.deepEqual(
    aiUsageService.validateAiRunInput({ ...validInput, promptSummary: "x" }),
    ["ai_run_prompt_summary_required"],
  );
  assert.deepEqual(
    aiUsageService.validateAiRunInput({ ...validInput, requestedBy: "x" }),
    ["ai_run_requested_by_required"],
  );
});

test("AI estimate validation and credit calculation are deterministic", () => {
  const validInput = {
    feature: "test_case_generation",
    inputText: "12345678",
    artifactCount: 2,
  };

  assert.deepEqual(aiUsageService.validateAiRunEstimateInput(validInput), []);
  assert.deepEqual(aiUsageService.validateAiRunEstimateInput({ ...validInput, inputText: "x" }), [
    "ai_estimate_input_text_required",
  ]);
  assert.deepEqual(
    aiUsageService.validateAiRunEstimateInput({ ...validInput, artifactCount: -1 }),
    ["ai_estimate_artifact_count_invalid"],
  );
  assert.deepEqual(aiUsageService.estimateAiRunCredits(validInput), {
    estimatedInputTokens: 242,
    estimatedOutputTokens: 128,
    estimatedTotalTokens: 370,
    estimatedCredits: 1,
    pricingNote:
      "Estimativa local deterministica para demonstracao; nao usa tokenizer real, provider real ou cobranca real.",
  });
  assert.deepEqual(aiUsageService.createAiRunEstimate(validInput), {
    estimatedInputTokens: 242,
    estimatedOutputTokens: 128,
    estimatedTotalTokens: 370,
    estimatedCredits: 1,
    pricingNote:
      "Estimativa local deterministica para demonstracao; nao usa tokenizer real, provider real ou cobranca real.",
  });
});

test("AI credit balance and enough-credit helpers use the local balance formula", () => {
  const balance = {
    projectId: "project_custom",
    includedCredits: 10,
    purchasedCredits: 5,
    usedCredits: 4,
    reservedCredits: 3,
    availableCredits: 999,
    updatedAt: "2026-05-13T16:00:00.000Z",
  };

  assert.equal(aiUsageService.calculateAvailableCredits(balance), 8);
  assert.deepEqual(aiUsageService.getAiCreditBalance("project_demo_landing"), {
    projectId: "project_demo_landing",
    includedCredits: 50,
    purchasedCredits: 20,
    reservedCredits: 2,
    usedCredits: 6,
    availableCredits: 62,
    updatedAt: "2026-05-13T16:00:00.000Z",
  });
  assert.equal(aiUsageService.hasEnoughCredits("project_demo_landing", 62), true);
  assert.equal(aiUsageService.hasEnoughCredits("project_demo_landing", 63), false);
  assert.equal(aiUsageService.hasEnoughCredits("project_missing", 1), false);
});

test("AI usage listing helpers filter runs and transactions deterministically", () => {
  assert.deepEqual(
    aiUsageService.listAiRunsByProject("project_demo_landing").map((aiRun) => aiRun.id),
    [
      "ai_run_demo_landing_vulnerability_checkup",
      "ai_run_demo_landing_test_case_generation",
      "ai_run_demo_landing_report_assist",
      "ai_run_demo_landing_automation_estimate",
    ],
  );
  assert.deepEqual(
    aiUsageService
      .listAiRunsByFeature("project_demo_landing", "report_assist")
      .map((aiRun) => aiRun.id),
    ["ai_run_demo_landing_report_assist"],
  );
  assert.deepEqual(
    aiUsageService
      .listAiRunsByStatus("project_demo_landing", "completed")
      .map((aiRun) => aiRun.id),
    [
      "ai_run_demo_landing_vulnerability_checkup",
      "ai_run_demo_landing_test_case_generation",
      "ai_run_demo_landing_report_assist",
    ],
  );
  assert.equal(aiUsageService.listAiCreditTransactionsByProject("project_demo_landing").length, 5);
  assert.deepEqual(
    aiUsageService
      .listAiCreditTransactionsByRun("ai_run_demo_landing_vulnerability_checkup")
      .map((transaction) => transaction.transactionType),
    ["grant", "charge"],
  );
});

test("AI run and credit transaction create helpers use injected dates", () => {
  const now = new Date("2026-05-13T17:00:00.000Z");
  const aiRun = aiUsageService.createAiRun(
    {
      projectId: "project_demo_landing",
      feature: "automation_suggestion",
      inputArtifactType: "test_case",
      inputArtifactIds: [" test_case_demo_landing_valid_email_submission "],
      promptSummary: "Sugerir automacao candidata para caso de teste.",
      requestedBy: " QA ",
    },
    now,
  );

  assert.equal(aiRun.id, "ai_run_1778691600000");
  assert.equal(aiRun.provider, "mock");
  assert.equal(aiRun.model, "mock-local-estimator");
  assert.equal(aiRun.status, "estimated");
  assert.deepEqual(aiRun.inputArtifactIds, ["test_case_demo_landing_valid_email_submission"]);
  assert.equal(aiRun.promptSummary, "Sugerir automacao candidata para caso de teste.");
  assert.equal(aiRun.requestedBy, "QA");
  assert.equal(aiRun.createdAt, "2026-05-13T17:00:00.000Z");
  assert.equal(aiRun.chargedCredits, 0);

  const reserve = aiUsageService.reserveAiCredits(
    "project_demo_landing",
    aiRun.id,
    2,
    "Reserva local",
    now,
  );
  const charge = aiUsageService.chargeAiCredits(
    "project_demo_landing",
    aiRun.id,
    2,
    "Cobranca local",
    now,
  );
  const refund = aiUsageService.refundAiCredits(
    "project_demo_landing",
    aiRun.id,
    1,
    "Estorno local",
    now,
  );

  assert.deepEqual(
    [reserve.transactionType, reserve.status, charge.transactionType, charge.status],
    ["reserve", "pending", "charge", "completed"],
  );
  assert.deepEqual([refund.transactionType, refund.status, refund.credits], [
    "refund",
    "completed",
    1,
  ]);
  assert.equal(reserve.id, "ai_credit_transaction_reserve_1778691600000");
  assert.equal(charge.createdAt, "2026-05-13T17:00:00.000Z");
});

test("AI mock run lifecycle helpers update runs with injected dates", () => {
  const aiRun = aiUsageService.demoAiRuns.find(
    (run) => run.id === "ai_run_demo_landing_automation_estimate",
  );
  const now = new Date("2026-05-13T18:00:00.000Z");

  const queuedRun = aiUsageService.updateAiRunStatus(aiRun, { status: "queued" }, now);
  const completedRun = aiUsageService.completeMockAiRun(aiRun, 720, 288, 2, now);
  const failedRun = aiUsageService.failMockAiRun(aiRun, "Falha mock", now);
  const cancelledRun = aiUsageService.cancelMockAiRun(aiRun, now);

  assert.equal(queuedRun.status, "queued");
  assert.equal(queuedRun.updatedAt, "2026-05-13T18:00:00.000Z");
  assert.equal(completedRun.status, "completed");
  assert.equal(completedRun.actualInputTokens, 720);
  assert.equal(completedRun.actualOutputTokens, 288);
  assert.equal(completedRun.chargedCredits, 2);
  assert.equal(completedRun.completedAt, "2026-05-13T18:00:00.000Z");
  assert.equal(failedRun.status, "failed");
  assert.equal(failedRun.errorMessage, "Falha mock");
  assert.equal(cancelledRun.status, "cancelled");
  assert.equal(cancelledRun.completedAt, "2026-05-13T18:00:00.000Z");
  assert.equal(aiRun.status, "estimated");
  assert.equal(aiRun.chargedCredits, 0);
});

test("AI credit balance transaction helper applies local reserve charge and refund", () => {
  const now = new Date("2026-05-13T18:30:00.000Z");
  const balance = {
    projectId: "project_demo_landing",
    includedCredits: 10,
    purchasedCredits: 5,
    usedCredits: 2,
    reservedCredits: 1,
    availableCredits: 12,
    updatedAt: "2026-05-13T16:00:00.000Z",
  };

  const reserve = aiUsageService.createMockAiRunReservation(
    "project_demo_landing",
    "ai_run_local",
    3,
    now,
  );
  const reservedBalance = aiUsageService.applyCreditTransactionToBalance(balance, reserve, now);
  const charge = aiUsageService.createMockAiRunCharge(
    "project_demo_landing",
    "ai_run_local",
    2,
    now,
  );
  const chargedBalance = aiUsageService.applyCreditTransactionToBalance(
    reservedBalance,
    charge,
    now,
  );
  const refund = aiUsageService.createMockAiRunRefund(
    "project_demo_landing",
    "ai_run_local",
    1,
    now,
  );
  const refundedBalance = aiUsageService.applyCreditTransactionToBalance(
    chargedBalance,
    refund,
    now,
  );

  assert.equal(reserve.transactionType, "reserve");
  assert.equal(reserve.status, "pending");
  assert.equal(reservedBalance.reservedCredits, 4);
  assert.equal(reservedBalance.availableCredits, 9);
  assert.equal(charge.transactionType, "charge");
  assert.equal(chargedBalance.usedCredits, 4);
  assert.equal(chargedBalance.reservedCredits, 2);
  assert.equal(chargedBalance.availableCredits, 9);
  assert.equal(refund.transactionType, "refund");
  assert.equal(refundedBalance.usedCredits, 3);
  assert.equal(refundedBalance.availableCredits, 10);
  assert.equal(balance.reservedCredits, 1);
  assert.equal(balance.usedCredits, 2);
});

test("AI usage summary includes runs, credits, balances, and transactions", () => {
  assert.deepEqual(aiUsageService.getAiUsageSummary("project_demo_landing"), {
    totalRuns: 4,
    estimatedRuns: 1,
    queuedRuns: 0,
    runningRuns: 0,
    completedRuns: 3,
    failedRuns: 0,
    cancelledRuns: 0,
    totalEstimatedCredits: 8,
    totalChargedCredits: 6,
    includedCredits: 50,
    purchasedCredits: 20,
    usedCredits: 6,
    reservedCredits: 2,
    availableCredits: 62,
    runsByFeature: {
      vulnerability_checkup: 1,
      test_case_generation: 1,
      bug_summary: 0,
      report_assist: 1,
      drift_analysis: 0,
      business_rule_analysis: 0,
      automation_suggestion: 1,
      requirement_review: 0,
    },
    runsByStatus: {
      estimated: 1,
      queued: 0,
      running: 0,
      completed: 3,
      failed: 0,
      cancelled: 0,
    },
    transactionsCount: 5,
  });
});

test("AI usage traceability connects project, AI run, artifact ids, and credit transactions", () => {
  const traceability = aiUsageService.getAiRunTraceability(
    "ai_run_demo_landing_test_case_generation",
  );

  assert.equal(traceability.project.id, "project_demo_landing");
  assert.equal(traceability.aiRun.id, "ai_run_demo_landing_test_case_generation");
  assert.equal(traceability.artifactType, "business_rule");
  assert.deepEqual(traceability.relatedArtifactIds, ["rule_demo_landing_email"]);
  assert.equal(traceability.transactions.length, 1);

  const projectTraceability =
    aiUsageService.getProjectAiUsageTraceability("project_demo_landing");

  assert.equal(projectTraceability.project.id, "project_demo_landing");
  assert.equal(projectTraceability.runCount, 4);
  assert.equal(projectTraceability.transactionCount, 5);
  assert.equal(projectTraceability.aiRunTraceability.length, 4);
});

test("AI usage and credit UI is mounted with local pt-BR sections", () => {
  assert.match(pageSource, /AiUsageSection/);
  assert.match(pageSource, /<AiUsageSection projects=\{visibleProjects\}/);
  assert.match(i18nSource, /IA e créditos/);
  assert.match(i18nSource, /href: "#ai-usage"/);
  assert.match(i18nSource, /status: "MVP local"/);
  assert.match(aiUsageSectionSource, /export function AiUsageSection/);
  assert.match(aiUsageSectionSource, /id="ai-usage"/);

  [
    "Uso de IA e créditos",
    "Projeto em análise",
    "Saldo de créditos",
    "Créditos disponíveis",
    "Créditos incluídos",
    "Créditos comprados",
    "Créditos usados",
    "Créditos reservados",
    "Resumo de uso",
    "Histórico de runs de IA",
    "Histórico de transações",
    "Estimativa de créditos",
    "Simulador local de run mock",
    "Estimar créditos",
    "Criar run mock",
    "Reservar créditos",
    "Marcar como concluído no mock",
    "Marcar como falhou no mock",
    "Cancelar run mock",
    "Reembolsar créditos",
  ].forEach((copy) => {
    assert.match(aiUsageSectionSource, new RegExp(copy));
  });
});

test("AI usage UI uses foundation helpers, demo data, and localStorage keys", () => {
  [
    "frankintest.block08.aiRuns",
    "frankintest.block08.aiCreditBalances",
    "frankintest.block08.aiCreditTransactions",
    "demoAiRuns",
    "demoAiCreditBalances",
    "demoAiCreditTransactions",
    "estimateAiRunCredits",
    "createAiRun",
    "getAiUsageSummary",
    "getAiCreditBalance",
    "hasEnoughCredits",
    "reserveAiCredits",
    "chargeAiCredits",
    "refundAiCredits",
    "validateAiRunInput",
  ].forEach((sourceText) => {
    assert.match(aiUsageSectionSource, new RegExp(sourceText));
  });
});

test("AI usage UI states local mock limitations and avoids provider/billing implementation", () => {
  [
    "não chama IA real",
    "não gera artefatos automaticamente",
    "não executa provider real",
    "Estimativa local",
    "mock local",
    "requer confirmação",
    "Provider mock",
    "Sem billing real",
    "Sem pagamento real",
    "Sem API key",
  ].forEach((copy) => {
    assert.match(aiUsageSectionSource, new RegExp(copy));
  });

  [
    ["OPENAI", "API", "KEY"].join("_"),
    ["ANTHROPIC", "API", "KEY"].join("_"),
    ["GOOGLE", "API", "KEY"].join("_"),
    ["process", "env"].join("."),
    ["fetch", "("].join(""),
    "OpenAI",
    "Anthropic",
    "Gemini",
  ].forEach((forbiddenSource) => {
    assert.doesNotMatch(aiUsageSectionSource, new RegExp(forbiddenSource.replace("(", "\\(")));
  });
});

test("AI usage UI keeps first render deterministic and loads localStorage after mount", () => {
  assert.match(aiUsageSectionSource, /useState<AiRun\[\]>\(demoAiRuns\)/);
  assert.match(aiUsageSectionSource, /useState<AiCreditBalance\[\]>\(demoAiCreditBalances\)/);
  assert.match(
    aiUsageSectionSource,
    /useState<AiCreditTransaction\[\]>\(\s*demoAiCreditTransactions\s*\)/,
  );
  assert.match(aiUsageSectionSource, /hasLoadedLocalAiUsage/);
  assert.match(aiUsageSectionSource, /window\.localStorage\.getItem\(aiRunsStorageKey\)/);
  assert.match(
    aiUsageSectionSource,
    /window\.localStorage\.getItem\(aiCreditBalancesStorageKey\)/,
  );
  assert.match(
    aiUsageSectionSource,
    /window\.localStorage\.getItem\(aiCreditTransactionsStorageKey\)/,
  );
  assert.match(aiUsageSectionSource, /if \(!hasLoadedLocalAiUsage\)/);
  assert.doesNotMatch(aiUsageSectionSource, /suppressHydrationWarning/);
  assert.doesNotMatch(aiUsageSectionSource, /Date\.now/);
  assert.doesNotMatch(aiUsageSectionSource, /Math\.random/);
});

test("AI usage service has no real provider calls, API keys, env vars, or fetch calls", () => {
  assert.match(aiUsageServiceSource, /provider: "mock"/);
  assert.match(aiUsageServiceSource, /AI_MOCK_PROVIDER/);
  [
    ["OPENAI", "API", "KEY"].join("_"),
    ["ANTHROPIC", "API", "KEY"].join("_"),
    ["GOOGLE", "API", "KEY"].join("_"),
    ["process", "env"].join("."),
    ["fetch", "("].join(""),
    "OpenAI",
    "Anthropic",
    "Gemini",
  ].forEach((forbiddenSource) => {
    assert.doesNotMatch(aiUsageServiceSource, new RegExp(forbiddenSource.replace("(", "\\(")));
  });
});

test("dashboard traceability, domain overview, and quick actions sections are present as UI-only cards", () => {
  [
    "Fluxo de rastreabilidade",
    "Projeto → requisito → execução → evidência",
    "Fluxo local MVP",
    "Design de Testes",
    "Bugs & Evidências",
    "IA e Créditos",
    "Ações rápidas",
    "Atalhos para as principais ações do dia a dia.",
  ].forEach((copy) => {
    assert.match(productSource, new RegExp(copy));
  });
});

test("workspace detail area groups existing CRUD sections by product domain", () => {
  [
    'id: "produto"',
    'id: "qa-design"',
    'id: "execucao"',
    'id: "qualidade"',
    'id: "relatorios"',
    'id: "ia-creditos"',
  ].forEach((tabId) => {
    assert.match(workspaceDashboardSource, new RegExp(tabId));
  });

  [
    /activeDetailTab === "qa-design"[\s\S]*<TestScenarioSection/,
    /activeDetailTab === "qa-design"[\s\S]*<TestCaseSection/,
    /activeDetailTab === "qa-design"[\s\S]*<TestSuiteSection/,
    /activeDetailTab === "execucao"[\s\S]*<TestCycleSection/,
    /activeDetailTab === "execucao"[\s\S]*<TestExecutionSection/,
    /activeDetailTab === "qualidade"[\s\S]*<BugReportSection/,
    /activeDetailTab === "qualidade"[\s\S]*<EvidenceSection/,
    /activeDetailTab === "relatorios"[\s\S]*<ReportSection/,
    /activeDetailTab === "ia-creditos"[\s\S]*<AiUsageSection/,
  ].forEach((pattern) => {
    assert.match(pageSource, pattern);
  });
});

test("workspace navigation registry maps enabled sidebar items to active domains", () => {
  const enabledTargets = workspaceNavigation.enabledWorkspaceNavigationTargets;

  assert.ok(enabledTargets.length >= 14);
  assert.equal(enabledTargets.some((target) => target.disabled), false);

  [
    ["#control-tower", "control-tower", "control-tower"],
    ["#workspace-produto-projetos", "produto", "projects"],
    ["#workspace-produto-modulos", "produto", "business-understanding"],
    ["#workspace-produto-requisitos", "produto", "business-understanding"],
    ["#workspace-produto-regras", "produto", "business-understanding"],
    ["#workspace-qa-design-cenarios", "qa-design", "test-scenarios"],
    ["#workspace-qa-design-casos", "qa-design", "test-cases"],
    ["#workspace-qa-design-suites", "qa-design", "test-suites"],
    ["#workspace-execucao-ciclos", "execucao", "test-cycles"],
    ["#workspace-execucao-testes", "execucao", "test-executions"],
    ["#workspace-qualidade-bugs", "qualidade", "bugs"],
    ["#workspace-qualidade-evidencias", "qualidade", "evidence"],
    ["#workspace-relatorios", "relatorios", "reports"],
    ["#workspace-ia-creditos", "ia-creditos", "ai-usage"],
  ].forEach(([hash, domainId, sectionId]) => {
    const state = workspaceNavigation.resolveWorkspaceNavigation(hash);

    assert.equal(state.activeHash, hash);
    assert.equal(state.activeDomainId, domainId);
    assert.equal(state.activeSectionId, sectionId);
    assert.equal(state.fallbackUsed, false);
  });
});

test("workspace navigation excludes disabled and future targets from active hash behavior", () => {
  const disabledTargets = workspaceNavigation.workspaceNavigationTargets.filter(
    (target) => target.disabled,
  );

  assert.ok(disabledTargets.some((target) => target.label === "Configurações"));
  assert.ok(disabledTargets.some((target) => target.label === "Assistência de design de testes"));

  disabledTargets.forEach((target) => {
    assert.equal(
      workspaceNavigation.enabledWorkspaceNavigationTargets.some(
        (enabledTarget) => enabledTarget.hash === target.hash,
      ),
      false,
    );
    assert.equal(
      workspaceNavigation.resolveWorkspaceNavigation(target.hash).activeHash,
      workspaceNavigation.defaultWorkspaceHash,
    );
  });
});

test("workspace navigation falls back for missing, invalid, disabled, and obsolete hashes", () => {
  ["", "workspace-configuracoes", "#workspace-configuracoes", "#nao-existe"].forEach((hash) => {
    const state = workspaceNavigation.resolveWorkspaceNavigation(hash);

    assert.equal(state.activeHash, workspaceNavigation.defaultWorkspaceHash);
    assert.equal(state.activeDomainId, "control-tower");
    assert.equal(state.activeSectionId, "control-tower");
    assert.equal(state.fallbackUsed, true);
  });
});

test("workspace UI wires enabled sidebar selection to active visible detail area", () => {
  assert.match(workspaceDashboardSource, /onNavigate\(item\.hash\)/);
  assert.match(pageSource, /setActiveWorkspaceNavigation\(nextNavigation\)/);
  assert.match(pageSource, /activeWorkspaceNavigation\.activeDomainId === "control-tower"/);
  assert.match(pageSource, /activeDetailTab === "qa-design"[\s\S]*<TestScenarioSection/);
  assert.match(pageSource, /activeDetailTab === "execucao"[\s\S]*<TestCycleSection/);
  assert.match(pageSource, /activeDetailTab === "qualidade"[\s\S]*<BugReportSection/);
  assert.match(pageSource, /activeDetailTab === "relatorios"[\s\S]*<ReportSection/);
  assert.match(pageSource, /activeDetailTab === "ia-creditos"[\s\S]*<AiUsageSection/);
});

test("workspace navigation keeps hash, tab clicks, and focus mechanics synchronized", () => {
  assert.match(pageSource, /window\.history\.pushState/);
  assert.match(pageSource, /window\.history\.replaceState/);
  assert.match(pageSource, /window\.addEventListener\("hashchange"/);
  assert.match(pageSource, /getWorkspaceNavigationTargetForDomain\(tabId\)/);
  assert.match(pageSource, /target\.scrollIntoView/);
  assert.match(pageSource, /target\.focus\(\{ preventScroll: true \}\)/);
  assert.match(workspaceDashboardSource, /aria-current=\{activeHash === item\.hash \? "page" : undefined\}/);
  assert.match(workspaceDashboardSource, /aria-disabled=\{item\.disabled \? "true" : undefined\}/);
});

test("test case navigation points to the local MVP section", () => {
  assert.match(workspaceNavigationSource, /label: "Casos de teste"[\s\S]*hash: "#workspace-qa-design-casos"/);
  assert.match(testCaseSectionSource, /id="test-cases"/);
});

test("test suite navigation points to the local MVP section", () => {
  assert.match(workspaceNavigationSource, /label: "Suítes de teste"[\s\S]*hash: "#workspace-qa-design-suites"/);
  assert.match(testSuiteSectionSource, /id="test-suites"/);
});

test("test execution navigation points to the local MVP section", () => {
  assert.match(
    workspaceNavigationSource,
    /label: "Execução de testes"[\s\S]*hash: "#workspace-execucao-testes"/,
  );
  assert.match(testExecutionSectionSource, /id="test-executions"/);
});

test("interface usa somente pt-BR sem seletor de idioma", () => {
  assert.doesNotMatch(workspaceDashboardSource, /locales\.map/);
  assert.doesNotMatch(pageSource, /localeAriaLabel/);
  assert.doesNotMatch(pageSource, /supportedLocales/);
});

test("default locale é pt-BR e getTranslations retorna pt-BR", () => {
  assert.match(i18nSource, /defaultLocale = "pt-BR"/);
  assert.match(i18nSource, /getTranslations/);
  assert.match(pageSource, /getTranslations\(\)/);
});
