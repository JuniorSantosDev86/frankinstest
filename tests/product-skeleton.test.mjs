import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const pageSource = readFileSync("src/app/page.tsx", "utf8");
const i18nSource = readFileSync("src/app/i18n.ts", "utf8");
const currentStatus = readFileSync("docs/CURRENT_STATUS.md", "utf8");
const productSource = `${pageSource}\n${i18nSource}`;

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

test("language selector is visible in the application shell", () => {
  assert.match(pageSource, /<select/);
  assert.match(pageSource, /supportedLocales\.map/);
  assert.match(pageSource, /aria-label=\{t\.languageSelector\.ariaLabel\}/);
});

test("default locale is pt-BR", () => {
  assert.match(i18nSource, /defaultLocale = "pt-BR"/);
  assert.match(pageSource, /useState<Locale>\(defaultLocale\)/);
});

test("current status records Block 01 completion", () => {
  assert.match(currentStatus, /Block 01/);
  assert.match(currentStatus, /Completion notes/);
  assert.match(currentStatus, /Recommended Next Block/);
  assert.match(currentStatus, /Block 02/);
});
