export type WorkspaceDetailDomain =
  | "control-tower"
  | "produto"
  | "qa-design"
  | "execucao"
  | "qualidade"
  | "relatorios"
  | "ia-creditos";

export type WorkspaceNavigationTarget = {
  group: string;
  label: string;
  hash: string;
  domainId: WorkspaceDetailDomain;
  sectionId: string;
  disabled?: boolean;
  status?: string;
};

export type ActiveWorkspaceNavigation = {
  activeHash: string;
  activeDomainId: WorkspaceDetailDomain;
  activeSectionId: string;
  fallbackUsed: boolean;
};

export const defaultWorkspaceHash = "#control-tower";

export const workspaceNavigationTargets: WorkspaceNavigationTarget[] = [
  {
    group: "Visão geral",
    label: "Control Tower",
    hash: "#control-tower",
    domainId: "control-tower",
    sectionId: "control-tower",
    status: "Ativo",
  },
  {
    group: "Produto",
    label: "Projetos",
    hash: "#workspace-produto-projetos",
    domainId: "produto",
    sectionId: "projects",
  },
  {
    group: "Produto",
    label: "Módulos",
    hash: "#workspace-produto-modulos",
    domainId: "produto",
    sectionId: "business-understanding",
  },
  {
    group: "Produto",
    label: "Requisitos",
    hash: "#workspace-produto-requisitos",
    domainId: "produto",
    sectionId: "business-understanding",
  },
  {
    group: "Produto",
    label: "Regras de negócio",
    hash: "#workspace-produto-regras",
    domainId: "produto",
    sectionId: "business-understanding",
  },
  {
    group: "QA Design",
    label: "Cenários de teste",
    hash: "#workspace-qa-design-cenarios",
    domainId: "qa-design",
    sectionId: "test-scenarios",
  },
  {
    group: "QA Design",
    label: "Casos de teste",
    hash: "#workspace-qa-design-casos",
    domainId: "qa-design",
    sectionId: "test-cases",
  },
  {
    group: "QA Design",
    label: "Suítes de teste",
    hash: "#workspace-qa-design-suites",
    domainId: "qa-design",
    sectionId: "test-suites",
  },
  {
    group: "Execução",
    label: "Ciclos de teste",
    hash: "#workspace-execucao-ciclos",
    domainId: "execucao",
    sectionId: "test-cycles",
  },
  {
    group: "Execução",
    label: "Execução de testes",
    hash: "#workspace-execucao-testes",
    domainId: "execucao",
    sectionId: "test-executions",
  },
  {
    group: "Qualidade",
    label: "Bugs e defeitos",
    hash: "#workspace-qualidade-bugs",
    domainId: "qualidade",
    sectionId: "bugs",
  },
  {
    group: "Qualidade",
    label: "Evidências",
    hash: "#workspace-qualidade-evidencias",
    domainId: "qualidade",
    sectionId: "evidence",
  },
  {
    group: "Qualidade",
    label: "Relatórios",
    hash: "#workspace-relatorios",
    domainId: "relatorios",
    sectionId: "reports",
  },
  {
    group: "IA",
    label: "IA e créditos",
    hash: "#workspace-ia-creditos",
    domainId: "ia-creditos",
    sectionId: "ai-usage",
  },
  {
    group: "IA",
    label: "Assistência de design de testes",
    hash: "#workspace-ia-design-em-breve",
    domainId: "ia-creditos",
    sectionId: "ai-usage",
    status: "Em breve",
    disabled: true,
  },
  {
    group: "Configurações",
    label: "Configurações",
    hash: "#workspace-configuracoes",
    domainId: "control-tower",
    sectionId: "control-tower",
    status: "Futuro",
    disabled: true,
  },
];

export const enabledWorkspaceNavigationTargets = workspaceNavigationTargets.filter(
  (target) => !target.disabled,
);

export function normalizeWorkspaceHash(hash: string | null | undefined): string {
  if (!hash) {
    return "";
  }

  const trimmedHash = hash.trim();

  if (!trimmedHash) {
    return "";
  }

  return trimmedHash.startsWith("#") ? trimmedHash : `#${trimmedHash}`;
}

export function getWorkspaceNavigationTarget(hash: string | null | undefined) {
  const normalizedHash = normalizeWorkspaceHash(hash);

  return workspaceNavigationTargets.find((target) => target.hash === normalizedHash);
}

export function getEnabledWorkspaceNavigationTarget(hash: string | null | undefined) {
  const target = getWorkspaceNavigationTarget(hash);

  return target?.disabled ? undefined : target;
}

export function resolveWorkspaceNavigation(hash: string | null | undefined): ActiveWorkspaceNavigation {
  const target = getEnabledWorkspaceNavigationTarget(hash);

  if (target) {
    return {
      activeHash: target.hash,
      activeDomainId: target.domainId,
      activeSectionId: target.sectionId,
      fallbackUsed: false,
    };
  }

  const fallbackTarget = getEnabledWorkspaceNavigationTarget(defaultWorkspaceHash);

  return {
    activeHash: fallbackTarget?.hash ?? defaultWorkspaceHash,
    activeDomainId: fallbackTarget?.domainId ?? "control-tower",
    activeSectionId: fallbackTarget?.sectionId ?? "control-tower",
    fallbackUsed: true,
  };
}

export function getWorkspaceNavigationTargetForDomain(domainId: WorkspaceDetailDomain) {
  return enabledWorkspaceNavigationTargets.find((target) => target.domainId === domainId);
}
