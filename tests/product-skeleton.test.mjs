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
const mockSession = loadTsModule("src/lib/auth/mockSession");
const access = loadTsModule("src/lib/workspace/access");
const projectTypesModule = loadTsModule("src/lib/projects/types");
const projectService = loadTsModule("src/lib/projects/projectService");

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

test("language selector is visible in the application shell", () => {
  assert.match(pageSource, /<select/);
  assert.match(pageSource, /supportedLocales\.map/);
  assert.match(pageSource, /aria-label=\{t\.languageSelector\.ariaLabel\}/);
});

test("default locale is pt-BR", () => {
  assert.match(i18nSource, /defaultLocale = "pt-BR"/);
  assert.match(pageSource, /useState<Locale>\(defaultLocale\)/);
});
