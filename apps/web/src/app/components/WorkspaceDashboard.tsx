"use client";

import type { ReactNode } from "react";

import { MetricCard } from "./MetricCard";
import { TraceabilityFlow, type TraceabilityNode } from "./TraceabilityFlow";
import { ApiStatusBadge } from "./ApiStatusBadge";

type SidebarGroup = {
  title: string;
  items: {
    label: string;
    href: string;
    status?: string;
    disabled?: boolean;
  }[];
};

type TopBarProject = {
  id: string;
  name: string;
};

type DashboardOverviewProps = {
  activeProjectName: string;
  projectCount: number;
  executionCount: number;
  openBugCount: number;
  evidenceCount: number;
  aiCredits: number;
  scenarioCount: number;
  testCaseCount: number;
  suiteCount: number;
  activeCycleCount: number;
  criticalBugCount: number;
  reportCount: number;
  aiRunsCount: number;
  traceabilityNodes: TraceabilityNode[];
};

type WorkspaceDetailTab = {
  id: string;
  label: string;
  description: string;
};

type WorkspaceDetailAreaProps = {
  activeTab: string;
  tabs: WorkspaceDetailTab[];
  children: ReactNode;
  onChange: (tabId: string) => void;
};

const sidebarGroups: SidebarGroup[] = [
  {
    title: "Visão geral",
    items: [{ label: "Control Tower", href: "#control-tower", status: "Ativo" }],
  },
  {
    title: "Produto",
    items: [
      { label: "Projetos", href: "#workspace-produto-projetos" },
      { label: "Módulos", href: "#workspace-produto-modulos" },
      { label: "Requisitos", href: "#workspace-produto-requisitos" },
      { label: "Regras de negócio", href: "#workspace-produto-regras" },
    ],
  },
  {
    title: "QA Design",
    items: [
      { label: "Cenários de teste", href: "#workspace-qa-design-cenarios" },
      { label: "Casos de teste", href: "#workspace-qa-design-casos" },
      { label: "Suítes de teste", href: "#workspace-qa-design-suites" },
    ],
  },
  {
    title: "Execução",
    items: [
      { label: "Ciclos de teste", href: "#workspace-execucao-ciclos" },
      { label: "Execução de testes", href: "#workspace-execucao-testes" },
    ],
  },
  {
    title: "Qualidade",
    items: [
      { label: "Bugs e defeitos", href: "#workspace-qualidade-bugs" },
      { label: "Evidências", href: "#workspace-qualidade-evidencias" },
      { label: "Relatórios", href: "#workspace-relatorios" },
    ],
  },
  {
    title: "IA",
    items: [
      { label: "IA e créditos", href: "#workspace-ia-creditos" },
      {
        label: "Assistência de design de testes",
        href: "#workspace-ia-design-em-breve",
        status: "Em breve",
        disabled: true,
      },
    ],
  },
  {
    title: "Configurações",
    items: [{ label: "Configurações", href: "#workspace-configuracoes" }],
  },
];

export const workspaceDetailTabs: WorkspaceDetailTab[] = [
  {
    id: "produto",
    label: "Produto",
    description: "Projetos, módulos, requisitos e regras de negócio.",
  },
  {
    id: "qa-design",
    label: "QA Design",
    description: "Cenários, casos e suítes de teste.",
  },
  {
    id: "execucao",
    label: "Execução",
    description: "Ciclos e atualização de execução.",
  },
  {
    id: "qualidade",
    label: "Qualidade",
    description: "Bugs, defeitos e evidências.",
  },
  {
    id: "relatorios",
    label: "Relatórios",
    description: "Relatórios determinísticos do workspace.",
  },
  {
    id: "ia-creditos",
    label: "IA e Créditos",
    description: "Uso local/mock, estimativas e créditos sem provider real.",
  },
];

export function AppShell({
  children,
  topBar,
}: {
  children: ReactNode;
  topBar: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <SidebarNav />
        <section className="min-w-0 flex-1">
          {topBar}
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}

function SidebarNav() {
  return (
    <aside className="border-slate-800 bg-slate-950 text-white lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:border-r">
      <div className="flex h-full flex-col gap-5 p-5">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-cyan-300 text-sm font-black text-slate-950">
            F
          </div>
          <div>
            <p className="text-lg font-black tracking-tight">FrankInTest</p>
            <p className="text-xs font-semibold text-slate-400">QA Lead Workspace</p>
          </div>
        </div>

        <nav className="grid gap-5 overflow-y-auto pr-1" aria-label="Navegação principal">
          {sidebarGroups.map((group) => (
            <section key={group.title} className="border-t border-white/10 pt-4 first:border-t-0">
              <p className="text-[0.7rem] font-black uppercase tracking-[0.18em] text-slate-400">
                {group.title}
              </p>
              <div className="mt-2 grid gap-1">
                {group.items.map((item) => (
                  <a
                    key={item.href}
                    aria-disabled={item.disabled ? "true" : undefined}
                    href={item.href}
                    className={`group flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-cyan-300 ${
                      item.href === "#control-tower"
                        ? "border-cyan-300/40 bg-cyan-300/15 text-white"
                        : item.disabled
                          ? "border-transparent text-slate-500"
                          : "border-transparent text-slate-200 hover:border-white/10 hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="size-1.5 rounded-full bg-cyan-300 opacity-70" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.status ? (
                      <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] font-bold text-slate-300">
                        {item.status}
                      </span>
                    ) : null}
                  </a>
                ))}
              </div>
            </section>
          ))}
        </nav>

        <div className="mt-auto grid gap-3 border-t border-white/10 pt-4">
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-xs font-semibold text-slate-400">Ambiente</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge> MVP local </StatusBadge>
              <StatusBadge> Mock data </StatusBadge>
            </div>
            <p className="mt-2 text-xs text-slate-500">v0.9.0 - Mock Data</p>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-sm font-black">QA Lead</p>
            <p className="text-xs text-slate-400">Administrador</p>
          </section>
        </div>
      </div>
    </aside>
  );
}

export function TopBar({
  activeProjectName,
  activeProjectId,
  projects,
  userName,
  onProjectChange,
}: {
  activeProjectName: string;
  activeProjectId: string;
  projects: readonly TopBarProject[];
  userName: string;
  onProjectChange: (projectId: string) => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <label className="grid gap-1 text-xs font-semibold text-slate-500 lg:w-72">
          Projeto atual
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-cyan-500"
            value={activeProjectId}
            onChange={(event) => onProjectChange(event.target.value)}
          >
            {projects.length > 0 ? (
              projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))
            ) : (
              <option value="">{activeProjectName}</option>
            )}
          </select>
        </label>

        <label className="relative flex-1">
          <span className="sr-only">Buscar</span>
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-500"
            placeholder="Buscar artefatos, execução, bugs..."
            readOnly
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <ApiStatusBadge />
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-800">
            {userName}
          </div>
        </div>
      </div>
    </header>
  );
}

export function DashboardOverview(props: DashboardOverviewProps) {
  return (
    <>
      <section
        id="control-tower"
        className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70 md:p-8"
      >
        <div className="absolute right-6 top-6 hidden h-28 w-28 rounded-[2rem] border border-cyan-100 bg-cyan-50 lg:block" />
        <div className="relative max-w-4xl">
          <StatusBadge tone="violet">Assistido por IA</StatusBadge>
          <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
            Um workspace para transformar artefatos de produto em artefatos de QA.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
            Organize requisitos, riscos, execuções, bugs, evidências, relatórios e ações
            assistidas por IA em um fluxo integrado, rastreável e orientado à qualidade.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="KPIs do workspace">
        <MetricCard
          title="Projetos ativos"
          value={String(props.projectCount)}
          trend="MVP local"
          tone="teal"
        />
        <MetricCard
          title="Execuções"
          value={String(props.executionCount)}
          trend="mock local"
          tone="blue"
        />
        <MetricCard
          title="Bugs abertos"
          value={String(props.openBugCount)}
          trend="riscos potenciais"
          tone="red"
        />
        <MetricCard
          title="Evidências"
          value={String(props.evidenceCount)}
          trend="prova do teste"
          tone="orange"
        />
        <MetricCard
          title="Créditos de IA"
          value={String(props.aiCredits)}
          trend="sem provider real"
          tone="violet"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <ControlTowerCard
          openBugCount={props.openBugCount}
          criticalBugCount={props.criticalBugCount}
          executionCount={props.executionCount}
        />
        <TraceabilityFlow nodes={props.traceabilityNodes} />
      </section>

      <DomainOverviewGrid {...props} />
    </>
  );
}

function ControlTowerCard({
  executionCount,
  openBugCount,
  criticalBugCount,
}: {
  executionCount: number;
  openBugCount: number;
  criticalBugCount: number;
}) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-950">Control Tower</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Resumo de saúde, cobertura, execução e próximas ações do workspace.
          </p>
        </div>
        <StatusBadge tone="teal">Saúde geral</StatusBadge>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-[0.8fr_1.2fr]">
        <div className="grid place-items-center rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <div className="grid size-28 place-items-center rounded-full border-[10px] border-emerald-400 bg-white">
            <div className="text-center">
              <p className="text-3xl font-black text-emerald-700">82</p>
              <p className="text-xs font-bold text-emerald-700">Boa</p>
            </div>
          </div>
        </div>
        <div className="grid gap-3 text-sm">
          <SummaryLine label="Cobertura de requisitos" value="78%" tone="teal" />
          <SummaryLine label="Execuções aprovadas" value="84%" tone="teal" />
          <SummaryLine label="Execuções registradas" value={String(executionCount)} />
          <SummaryLine label="Bugs abertos" value={String(openBugCount)} tone="rose" />
          <SummaryLine label="Bugs críticos" value={String(criticalBugCount)} tone="rose" />
        </div>
      </div>

      <div className="mt-6 border-t border-slate-200 pt-4">
        <p className="text-sm font-black text-slate-950">Próximas ações críticas</p>
        <ul className="mt-3 grid gap-2 text-sm text-slate-700">
          <li className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2">
            Corrigir bugs críticos com validação recomendada.
          </li>
          <li className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
            Revisar regras de negócio com risco alto.
          </li>
          <li className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            Registrar evidências nas execuções recentes.
          </li>
        </ul>
      </div>
    </article>
  );
}

function DomainOverviewGrid(props: DashboardOverviewProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3" aria-label="Domain overview cards">
      <DomainOverviewCard
        title="Design de Testes"
        description="Visão geral dos artefatos de design de testes."
        cta="Ir para QA Design"
        href="#workspace-qa-design-cenarios"
        badge="MVP local"
        metrics={[
          { label: "Cenários de teste", value: props.scenarioCount, progress: 78, tone: "teal" },
          { label: "Casos de teste", value: props.testCaseCount, progress: 82, tone: "blue" },
          { label: "Suítes de teste", value: props.suiteCount, progress: 68, tone: "violet" },
        ]}
      />
      <DomainOverviewCard
        title="Execução"
        description="Acompanhe ciclos e execuções em andamento."
        cta="Ir para Execução"
        href="#workspace-execucao-ciclos"
        badge="Mock"
        metrics={[
          { label: "Ciclos ativos", value: props.activeCycleCount, progress: 56, tone: "blue" },
          { label: "Execuções recentes", value: props.executionCount, progress: 72, tone: "teal" },
          { label: "Bloqueios", value: 20, progress: 22, tone: "orange" },
        ]}
      />
      <DomainOverviewCard
        title="Bugs & Evidências"
        description="Qualidade do produto e registro de evidências."
        cta="Ir para Qualidade"
        href="#workspace-qualidade-bugs"
        metrics={[
          { label: "Bugs abertos", value: props.openBugCount, progress: 45, tone: "rose" },
          { label: "Bugs críticos", value: props.criticalBugCount, progress: 18, tone: "rose" },
          { label: "Evidências", value: props.evidenceCount, progress: 86, tone: "orange" },
        ]}
      />
      <DomainOverviewCard
        title="Relatórios"
        description="Relatórios gerenciais e qualidade de comunicação."
        cta="Ver relatórios"
        href="#workspace-relatorios"
        badge="Mock"
        metrics={[
          { label: "Relatórios recentes", value: props.reportCount, progress: 64, tone: "blue" },
          { label: "Prontos", value: 2, progress: 50, tone: "teal" },
          { label: "Rascunhos", value: 1, progress: 32, tone: "orange" },
        ]}
      />
      <DomainOverviewCard
        title="IA e Créditos"
        description="Uso de IA e estimativas de créditos."
        cta="Gerenciar IA e créditos"
        href="#workspace-ia-creditos"
        badge="Assistido por IA"
        metrics={[
          { label: "Créditos disponíveis", value: props.aiCredits, progress: 68, tone: "violet" },
          { label: "Execuções de IA", value: props.aiRunsCount, progress: 42, tone: "violet" },
          { label: "Sem billing real", value: 0, progress: 0, tone: "orange" },
        ]}
      />
      <QuickActionsCard />
    </section>
  );
}

function DomainOverviewCard({
  title,
  description,
  metrics,
  cta,
  href,
  badge,
}: {
  title: string;
  description: string;
  metrics: { label: string; value: number; progress: number; tone: ProgressTone }[];
  cta: string;
  href: string;
  badge?: string;
}) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-950">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        {badge ? <StatusBadge tone={badge.includes("IA") ? "violet" : "slate"}>{badge}</StatusBadge> : null}
      </div>
      <div className="mt-5 grid gap-4">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-slate-700">{metric.label}</p>
              <p className="text-sm font-black text-slate-950">{metric.value}</p>
            </div>
            <ProgressBar value={metric.progress} tone={metric.tone} />
          </div>
        ))}
      </div>
      <a
        className="mt-5 inline-flex text-sm font-black text-blue-700 transition hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
        href={href}
      >
        {cta}
      </a>
    </article>
  );
}

function QuickActionsCard() {
  const actions = [
    "Novo cenário",
    "Novo caso de teste",
    "Registrar bug",
    "Nova evidência",
    "Criar relatório",
    "Estimar créditos de IA",
  ];

  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
      <h2 className="text-xl font-black tracking-tight text-slate-950">Ações rápidas</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Atalhos para as principais ações do dia a dia.
      </p>
      <div className="mt-5 grid gap-2">
        {actions.map((action) => (
          <button
            key={action}
            type="button"
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            {action}
            <span aria-hidden="true">›</span>
          </button>
        ))}
      </div>
    </article>
  );
}

export function WorkspaceDetailArea({
  activeTab,
  tabs,
  children,
  onChange,
}: WorkspaceDetailAreaProps) {
  const activeTabCopy = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <section
      id="workspace-details"
      className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 md:p-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
            WorkspaceDetailArea
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Área de trabalho por domínio
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{activeTabCopy.description}</p>
        </div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Domínios do workspace">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`rounded-full border px-4 py-2 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-cyan-300 ${
                activeTab === tab.id
                  ? "border-cyan-500 bg-cyan-50 text-cyan-800"
                  : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200"
              }`}
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6" role="tabpanel">
        {children}
      </div>
    </section>
  );
}

type StatusTone = "teal" | "violet" | "slate";

function StatusBadge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: StatusTone;
}) {
  const classes: Record<StatusTone, string> = {
    teal: "border-teal-200 bg-teal-50 text-teal-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
    slate: "border-slate-700 bg-slate-900 text-slate-100",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${classes[tone]}`}
    >
      {children}
    </span>
  );
}

function SummaryLine({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: "teal" | "rose" | "slate";
}) {
  const valueClass = tone === "teal" ? "text-emerald-700" : tone === "rose" ? "text-rose-700" : "text-slate-950";

  return (
    <p className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
      <span className="text-slate-600">{label}</span>
      <span className={`font-black ${valueClass}`}>{value}</span>
    </p>
  );
}

type ProgressTone = "teal" | "blue" | "violet" | "orange" | "rose";

function ProgressBar({ value, tone }: { value: number; tone: ProgressTone }) {
  const classes: Record<ProgressTone, string> = {
    teal: "bg-teal-500",
    blue: "bg-blue-500",
    violet: "bg-violet-500",
    orange: "bg-orange-500",
    rose: "bg-rose-500",
  };

  return (
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${classes[tone]}`} style={{ width: `${value}%` }} />
    </div>
  );
}
