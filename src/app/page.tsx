"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { getMockSession } from "@/lib/auth/mockSession";
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
import { getMembership } from "@/lib/workspace/access";
import { defaultLocale, isSupportedLocale, supportedLocales, translations, type Locale } from "./i18n";

const projectStorageKey = "frankintest.block02.projects";

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

export default function Home() {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [projects, setProjects] = useState<Project[]>(() => {
    if (typeof window === "undefined") {
      return demoProjects;
    }

    const storedProjects = window.localStorage.getItem(projectStorageKey);

    return storedProjects ? (JSON.parse(storedProjects) as Project[]) : demoProjects;
  });
  const [formState, setFormState] = useState<ProjectFormState>(emptyProjectForm);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState(false);
  const t = translations[locale];
  const session = getMockSession();
  const membership = getMembership(session.user, session.activeOrganization);

  useEffect(() => {
    window.localStorage.setItem(projectStorageKey, JSON.stringify(projects));
  }, [projects]);

  const visibleProjects = useMemo(
    () => projects.filter((project) => project.organizationId === session.activeOrganization.id),
    [projects, session.activeOrganization.id],
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
                  key={item.href}
                  href={item.href}
                  className="group rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-teal-200/60 hover:bg-teal-200/10"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{item.label}</span>
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
            <div className="absolute right-6 top-6 hidden rounded-full border border-teal-700/20 bg-teal-50 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-teal-800 md:block">
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
              {t.qualitySignals.map((signal) => (
                <article
                  key={signal.label}
                  className="rounded-2xl border border-slate-900/10 bg-slate-50 p-4"
                >
                  <div className={`h-1.5 w-16 rounded-full bg-gradient-to-r ${signal.tone}`} />
                  <p className="mt-5 text-3xl font-black tracking-tight text-slate-950">
                    {signal.value}
                  </p>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                    {signal.label}
                  </p>
                </article>
              ))}
            </div>
          </header>

          <section className="grid gap-6 xl:grid-cols-3">
            {t.pillarCards.map((pillar) => (
              <article
                key={pillar.title}
                className="rounded-[1.5rem] border border-slate-900/10 bg-white/85 p-6 shadow-lg shadow-slate-900/5 backdrop-blur"
              >
                <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-700">
                  {pillar.eyebrow}
                </p>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                  {pillar.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{pillar.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {pillar.artifacts.map((artifact) => (
                    <span
                      key={artifact}
                      className="rounded-full border border-slate-900/10 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700"
                    >
                      {artifact}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </section>

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
  labels: Record<T, string>;
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
