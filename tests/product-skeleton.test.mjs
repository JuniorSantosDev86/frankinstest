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
const productSource = `${pageSource}\n${i18nSource}\n${testScenarioSectionSource}\n${testCaseSectionSource}`;
const projectTypesSource = readFileSync("src/lib/projects/types.ts", "utf8");
const projectServiceSource = readFileSync("src/lib/projects/projectService.ts", "utf8");
const businessTypesSource = readFileSync("src/lib/business-understanding/types.ts", "utf8");
const businessServiceSource = readFileSync(
  "src/lib/business-understanding/businessUnderstandingService.ts",
  "utf8",
);
const testDesignTypesSource = readFileSync("src/lib/test-design/types.ts", "utf8");
const testDesignServiceSource = readFileSync("src/lib/test-design/testDesignService.ts", "utf8");
const mockSession = loadTsModule("src/lib/auth/mockSession");
const access = loadTsModule("src/lib/workspace/access");
const projectTypesModule = loadTsModule("src/lib/projects/types");
const projectService = loadTsModule("src/lib/projects/projectService");
const businessTypes = loadTsModule("src/lib/business-understanding/types");
const businessService = loadTsModule("src/lib/business-understanding/businessUnderstandingService");
const testDesignTypes = loadTsModule("src/lib/test-design/types");
const testDesignService = loadTsModule("src/lib/test-design/testDesignService");

test("FrankInTest shell exposes the required navigation sections", () => {
  [
    "Control Tower",
    "Projects",
    "QA Workspace",
    "Cenários de teste",
    "Casos de teste",
    "Check-up",
    "Reports",
    "FrankInDrift",
    "Settings",
  ].forEach((section) => {
    assert.match(productSource, new RegExp(section));
  });
});

test("AI-assisted output is framed as structured QA artifacts", () => {
  [
    "Requirement",
    "Business rule",
    "Test scenario",
    "Test case",
    "Bug report",
    "Evidence summary",
    "Risk item",
    "Release readiness report",
    "Drift finding",
    "Automation recommendation",
    "Integration recommendation",
  ].forEach((artifact) => {
    assert.match(productSource, new RegExp(artifact));
  });
});

test("product copy keeps safe analysis boundaries", () => {
  assert.match(productSource, /AI-assisted/);
  assert.match(productSource, /Potential risks/);
  assert.match(productSource, /Recommended validation/);
  assert.match(productSource, /require confirmation/i);

  ["Fully tested", "Guaranteed secure", "All bugs found", "Complete vulnerability scan"].forEach(
    (unsafeClaim) => {
      assert.doesNotMatch(productSource, new RegExp(unsafeClaim, "i"));
    },
  );
});

test("i18n foundation exposes the three supported locales", () => {
  ['key: "pt-BR"', 'key: "en"', 'key: "es"'].forEach((localeKey) => {
    assert.match(i18nSource, new RegExp(localeKey));
  });

  ["Português (BR)", "English", "Español"].forEach((localeLabel) => {
    assert.ok(i18nSource.includes(localeLabel));
  });
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
  assert.match(testCaseSectionSource, /<ol/);
  assert.match(testCaseSectionSource, /testCase\.steps\.map/);
});

test("test case navigation points to the local MVP section", () => {
  assert.match(i18nSource, /label: "Casos de teste", href: "#test-cases", status: "MVP local"/);
  assert.match(testCaseSectionSource, /id="test-cases"/);
});

test("language selector is visible in the application shell", () => {
  assert.match(pageSource, /<select/);
  assert.match(pageSource, /supportedLocales\.map/);
  assert.match(pageSource, /aria-label=\{t\.languageSelector\.ariaLabel\}/);
});

test("default locale is pt-BR", () => {
  assert.match(i18nSource, /defaultLocale = "pt-BR"/);
  assert.match(pageSource, /useState<Locale>\(defaultLocale\)/);
});
