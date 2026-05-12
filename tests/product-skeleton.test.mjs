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
const productSource = `${pageSource}\n${i18nSource}`;
const projectTypesSource = readFileSync("src/lib/projects/types.ts", "utf8");
const projectServiceSource = readFileSync("src/lib/projects/projectService.ts", "utf8");
const businessTypesSource = readFileSync("src/lib/business-understanding/types.ts", "utf8");
const businessServiceSource = readFileSync(
  "src/lib/business-understanding/businessUnderstandingService.ts",
  "utf8",
);
const mockSession = loadTsModule("src/lib/auth/mockSession");
const access = loadTsModule("src/lib/workspace/access");
const projectTypesModule = loadTsModule("src/lib/projects/types");
const projectService = loadTsModule("src/lib/projects/projectService");
const businessTypes = loadTsModule("src/lib/business-understanding/types");
const businessService = loadTsModule("src/lib/business-understanding/businessUnderstandingService");

test("FrankInTest shell exposes the required navigation sections", () => {
  [
    "Control Tower",
    "Projects",
    "QA Workspace",
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

  const module = businessService.createModule(validInput, new Date("2026-05-12T10:00:00.000Z"));
  assert.equal(module.projectId, "project_demo_saas");
  assert.equal(module.createdAt, "2026-05-12T10:00:00.000Z");
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

test("language selector is visible in the application shell", () => {
  assert.match(pageSource, /<select/);
  assert.match(pageSource, /supportedLocales\.map/);
  assert.match(pageSource, /aria-label=\{t\.languageSelector\.ariaLabel\}/);
});

test("default locale is pt-BR", () => {
  assert.match(i18nSource, /defaultLocale = "pt-BR"/);
  assert.match(pageSource, /useState<Locale>\(defaultLocale\)/);
});
