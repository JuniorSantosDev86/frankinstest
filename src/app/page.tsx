"use client";

import { useState } from "react";

import { defaultLocale, isSupportedLocale, supportedLocales, translations, type Locale } from "./i18n";

export default function Home() {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const t = translations[locale];

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_32rem),radial-gradient(circle_at_80%_10%,rgba(14,116,144,0.16),transparent_28rem),linear-gradient(135deg,#f8faf7_0%,#ecf4ef_45%,#dfece8_100%)]" />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:flex-row lg:py-6">
        <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-72">
          <div className="flex h-full flex-col rounded-[2rem] border border-slate-900/10 bg-slate-950 p-5 text-white shadow-2xl shadow-slate-900/20">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-teal-300 text-sm font-black text-slate-950">
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
                className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-semibold normal-case tracking-normal text-white outline-none transition hover:border-teal-200/60 focus:border-teal-200"
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

            <nav className="mt-6 grid gap-2" aria-label="Main navigation">
              {t.navigationItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-teal-200/60 hover:bg-teal-200/10"
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

            <div className="mt-auto rounded-3xl border border-teal-200/20 bg-teal-200/10 p-4">
              <p className="text-sm font-bold text-teal-100">{t.productRule.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{t.productRule.description}</p>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-6">
          <header
            id="control-tower"
            className="relative overflow-hidden rounded-[2rem] border border-slate-900/10 bg-white/85 p-6 shadow-xl shadow-slate-900/5 backdrop-blur md:p-8"
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

            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {t.qualitySignals.map((signal) => (
                <article
                  key={signal.label}
                  className="rounded-3xl border border-slate-900/10 bg-slate-50 p-4"
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
                className="rounded-[2rem] border border-slate-900/10 bg-white/80 p-6 shadow-lg shadow-slate-900/5 backdrop-blur"
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

          <section className="grid gap-6 2xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[2rem] border border-slate-900/10 bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/15">
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
                    className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
                  >
                    <h3 className="text-lg font-black">{module.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{module.summary}</p>
                    <p className="mt-4 rounded-2xl bg-white/10 px-3 py-2 text-xs font-bold text-teal-100">
                      {module.status}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="grid gap-6">
              <section className="rounded-[2rem] border border-slate-900/10 bg-white/85 p-6 shadow-lg shadow-slate-900/5">
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

              <section className="rounded-[2rem] border border-amber-900/15 bg-amber-50/90 p-6 shadow-lg shadow-amber-900/5">
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
