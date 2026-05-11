export const defaultLocale = "pt-BR" as const;

export const supportedLocales = [
  { key: "pt-BR", label: "Português (BR)" },
  { key: "en", label: "English" },
  { key: "es", label: "Español" },
] as const;

export type Locale = (typeof supportedLocales)[number]["key"];

type Tone =
  | "from-teal-500 to-emerald-400"
  | "from-amber-500 to-orange-400"
  | "from-sky-500 to-blue-400"
  | "from-rose-500 to-red-400";

type NavigationItem = {
  label: string;
  href: string;
  status: string;
};

type QualitySignal = {
  label: string;
  value: string;
  tone: Tone;
};

type PillarCard = {
  title: string;
  eyebrow: string;
  description: string;
  artifacts: string[];
};

type WorkspaceModule = {
  id: string;
  name: string;
  summary: string;
  status: string;
};

type Translation = {
  languageSelector: {
    label: string;
    ariaLabel: string;
  };
  productRule: {
    title: string;
    description: string;
  };
  navigationItems: NavigationItem[];
  controlTowerBadge: string;
  hero: {
    eyebrow: string;
    title: string;
    description: string;
  };
  qualitySignals: QualitySignal[];
  pillarCards: PillarCard[];
  applicationSections: {
    eyebrow: string;
    title: string;
    description: string;
  };
  workspaceModules: WorkspaceModule[];
  artifactFirstAi: {
    eyebrow: string;
    title: string;
  };
  artifactTypes: string[];
  safeBoundaries: {
    eyebrow: string;
    items: string[];
  };
};

export const translations: Record<Locale, Translation> = {
  "pt-BR": {
    languageSelector: {
      label: "Idioma",
      ariaLabel: "Selecionar idioma da interface",
    },
    productRule: {
      title: "Regra do produto",
      description:
        "A IA fica ligada a artefatos estruturados de QA, nunca apresentada como chatbot solto.",
    },
    navigationItems: [
      { label: "Torre de Controle", href: "#control-tower", status: "Shell ativo" },
      { label: "Projetos", href: "#projects", status: "Placeholder" },
      { label: "QA Workspace", href: "#workspace", status: "Placeholder" },
      { label: "Check-up", href: "#checkup", status: "Pronto para créditos" },
      { label: "Relatórios", href: "#reports", status: "Placeholder" },
      { label: "FrankInDrift", href: "#drift", status: "Estratégico" },
      { label: "Configurações", href: "#settings", status: "Placeholder" },
    ],
    controlTowerBadge: "Torre de Controle",
    hero: {
      eyebrow: "Fundação do sistema operacional de qualidade",
      title: "Um workspace para transformar incerteza de produto em artefatos de QA.",
      description:
        "FrankInTest começa com uma Torre de Controle profissional para Check-ups seguros assistidos por IA, operações de QA Workspace, relatórios prontos para evidências e alinhamento com FrankInDrift.",
    },
    qualitySignals: [
      {
        label: "Rascunhos de artefatos estruturados",
        value: "12",
        tone: "from-teal-500 to-emerald-400",
      },
      {
        label: "Riscos potenciais aguardando revisão",
        value: "7",
        tone: "from-amber-500 to-orange-400",
      },
      {
        label: "Evidências preparadas",
        value: "5",
        tone: "from-sky-500 to-blue-400",
      },
      {
        label: "Achados de drift para confirmar",
        value: "3",
        tone: "from-rose-500 to-red-400",
      },
    ],
    pillarCards: [
      {
        title: "FrankInTest Check-up assistido por IA",
        eyebrow: "Entrada baseada em créditos",
        description:
          "Fluxo de Check-up seguro para landing pages, MVPs, fluxos SaaS, APIs, fluxos mobile e descrições de produto. As saídas são tratadas como riscos potenciais e rascunhos de artefatos de QA.",
        artifacts: ["Item de risco", "Cenário de teste", "Resumo de evidência"],
      },
      {
        title: "QA Workspace profissional",
        eyebrow: "Sistema operacional de QA",
        description:
          "Um workspace determinístico para requisitos, regras de negócio, desenho de testes, ciclos de execução, bugs, evidências, estratégia de automação e prontidão de release.",
        artifacts: ["Requisito", "Caso de teste", "Relatório de bug"],
      },
      {
        title: "FrankInDrift",
        eyebrow: "Alinhamento de documentação",
        description:
          "Detecte e gerencie divergências entre requisitos, docs, testes, notas de release, especificações de API, comportamento observado e realidade do produto.",
        artifacts: ["Achado de drift", "Item de risco", "Validação recomendada"],
      },
    ],
    applicationSections: {
      eyebrow: "Seções da aplicação",
      title: "Skeleton navegável para o primeiro shell SaaS.",
      description:
        "Estas seções são placeholders com escopo específico de produto, não páginas vazias genéricas.",
    },
    workspaceModules: [
      {
        id: "projects",
        name: "Projetos",
        summary:
          "Organize produtos, módulos, contexto, nível de risco e o escopo de qualidade de cada workspace.",
        status: "CRUD de projetos vem em um bloco futuro",
      },
      {
        id: "workspace",
        name: "QA Workspace",
        summary:
          "Mapeie requisitos, regras, cenários, casos de teste, ciclos, bugs, evidências e recomendações de automação.",
        status: "Telas de artefatos são placeholders",
      },
      {
        id: "checkup",
        name: "Check-up",
        summary:
          "Estime créditos antes de futuras análises assistidas por IA e salve saídas úteis como rascunhos de artefatos estruturados.",
        status: "Sem chamadas reais de IA ou dedução de créditos",
      },
      {
        id: "reports",
        name: "Relatórios",
        summary:
          "Prepare prontidão de release, resumos de bugs, resumos de evidências e relatórios de QA para stakeholders.",
        status: "Fundação estática de relatórios",
      },
      {
        id: "drift",
        name: "FrankInDrift",
        summary:
          "Acompanhe potenciais desalinhamentos entre expectativas documentadas, cobertura de testes e comportamento observado do produto.",
        status: "Sugestões manuais e assistidas por IA depois",
      },
      {
        id: "settings",
        name: "Configurações",
        summary:
          "Futura área para preferências do workspace, limites de análise segura, política de auditoria e controles de cobrança/créditos.",
        status: "Placeholder de configuração",
      },
    ],
    artifactFirstAi: {
      eyebrow: "IA artefato-primeiro",
      title: "Saídas futuras de IA viram rascunhos que usuários podem revisar.",
    },
    artifactTypes: [
      "Requisito",
      "Regra de negócio",
      "Cenário de teste",
      "Caso de teste",
      "Ciclo de teste",
      "Relatório de bug",
      "Resumo de evidência",
      "Item de risco",
      "Relatório de prontidão de release",
      "Achado de drift",
      "Recomendação de automação",
      "Recomendação de integração",
    ],
    safeBoundaries: {
      eyebrow: "Limites de análise segura",
      items: [
        "Saídas assistidas por IA exigem confirmação antes de serem tratadas como verdade.",
        "A linguagem de segurança permanece limitada a orientação segura de Check-up nesta fundação.",
        "Nenhuma ação destrutiva, varredura invasiva, integração real ou execução externa roda no Bloco 01.",
        "Futuras análises de IA de alto custo devem estimar créditos antes da execução.",
      ],
    },
  },
  en: {
    languageSelector: {
      label: "Language",
      ariaLabel: "Select interface language",
    },
    productRule: {
      title: "Product rule",
      description:
        "AI is attached to structured QA artifacts, never presented as a loose chatbot.",
    },
    navigationItems: [
      { label: "Control Tower", href: "#control-tower", status: "Live shell" },
      { label: "Projects", href: "#projects", status: "Placeholder" },
      { label: "QA Workspace", href: "#workspace", status: "Placeholder" },
      { label: "Check-up", href: "#checkup", status: "Credit-ready" },
      { label: "Reports", href: "#reports", status: "Placeholder" },
      { label: "FrankInDrift", href: "#drift", status: "Strategic" },
      { label: "Settings", href: "#settings", status: "Placeholder" },
    ],
    controlTowerBadge: "Control Tower",
    hero: {
      eyebrow: "Quality operating system foundation",
      title: "One workspace to turn product uncertainty into QA artifacts.",
      description:
        "FrankInTest starts with a professional Control Tower for safe AI-assisted check-ups, QA workspace operations, evidence-ready reports, and FrankInDrift alignment work.",
    },
    qualitySignals: [
      {
        label: "Structured artifact drafts",
        value: "12",
        tone: "from-teal-500 to-emerald-400",
      },
      {
        label: "Potential risks pending review",
        value: "7",
        tone: "from-amber-500 to-orange-400",
      },
      {
        label: "Evidence items prepared",
        value: "5",
        tone: "from-sky-500 to-blue-400",
      },
      {
        label: "Drift findings to confirm",
        value: "3",
        tone: "from-rose-500 to-red-400",
      },
    ],
    pillarCards: [
      {
        title: "AI-assisted FrankInTest Check-up",
        eyebrow: "Credit-based entry point",
        description:
          "Safe Check-up flow for landing pages, MVPs, SaaS flows, APIs, mobile flows, and product descriptions. Outputs are framed as potential risks and draft QA artifacts.",
        artifacts: ["Risk item", "Test scenario", "Evidence summary"],
      },
      {
        title: "Professional QA Workspace",
        eyebrow: "QA operating system",
        description:
          "A deterministic workspace for requirements, business rules, test design, execution cycles, bugs, evidence, automation strategy, and release readiness.",
        artifacts: ["Requirement", "Test case", "Bug report"],
      },
      {
        title: "FrankInDrift",
        eyebrow: "Documentation alignment",
        description:
          "Detect and manage mismatch between requirements, docs, tests, release notes, API specs, observed behavior, and product reality.",
        artifacts: ["Drift finding", "Risk item", "Recommended validation"],
      },
    ],
    applicationSections: {
      eyebrow: "Application sections",
      title: "Navigable skeleton for the first SaaS shell.",
      description:
        "These sections are placeholders with product-specific scope, not generic empty pages.",
    },
    workspaceModules: [
      {
        id: "projects",
        name: "Projects",
        summary:
          "Organize products, modules, context, risk level, and the quality scope for each workspace.",
        status: "Project CRUD comes in a later block",
      },
      {
        id: "workspace",
        name: "QA Workspace",
        summary:
          "Map requirements, rules, scenarios, test cases, cycles, bugs, evidence, and automation recommendations.",
        status: "Artifact screens are placeholders",
      },
      {
        id: "checkup",
        name: "Check-up",
        summary:
          "Estimate credits before future AI-assisted analysis and save useful outputs as structured draft artifacts.",
        status: "No real AI calls or credit deduction",
      },
      {
        id: "reports",
        name: "Reports",
        summary:
          "Prepare release readiness, bug summaries, evidence summaries, and stakeholder-friendly QA reports.",
        status: "Static report foundation",
      },
      {
        id: "drift",
        name: "FrankInDrift",
        summary:
          "Track potential misalignment between documented expectations, test coverage, and observed product behavior.",
        status: "Manual and AI-assisted suggestions later",
      },
      {
        id: "settings",
        name: "Settings",
        summary:
          "Future home for workspace preferences, safe analysis boundaries, audit policy, and billing/credit controls.",
        status: "Configuration placeholder",
      },
    ],
    artifactFirstAi: {
      eyebrow: "Artifact-first AI",
      title: "Future AI outputs become drafts users can review.",
    },
    artifactTypes: [
      "Requirement",
      "Business rule",
      "Test scenario",
      "Test case",
      "Test cycle",
      "Bug report",
      "Evidence summary",
      "Risk item",
      "Release readiness report",
      "Drift finding",
      "Automation recommendation",
      "Integration recommendation",
    ],
    safeBoundaries: {
      eyebrow: "Safe analysis boundaries",
      items: [
        "AI-assisted outputs require confirmation before being treated as truth.",
        "Security language stays scoped to safe Check-up guidance in this foundation.",
        "No destructive actions, invasive scans, real integrations, or external execution run in Block 01.",
        "Future high-cost AI analysis must estimate credits before execution.",
      ],
    },
  },
  es: {
    languageSelector: {
      label: "Idioma",
      ariaLabel: "Seleccionar idioma de la interfaz",
    },
    productRule: {
      title: "Regla del producto",
      description:
        "La IA se conecta a artefactos estructurados de QA, nunca se presenta como un chatbot suelto.",
    },
    navigationItems: [
      { label: "Torre de Control", href: "#control-tower", status: "Shell activo" },
      { label: "Proyectos", href: "#projects", status: "Placeholder" },
      { label: "QA Workspace", href: "#workspace", status: "Placeholder" },
      { label: "Check-up", href: "#checkup", status: "Listo para créditos" },
      { label: "Reportes", href: "#reports", status: "Placeholder" },
      { label: "FrankInDrift", href: "#drift", status: "Estratégico" },
      { label: "Configuración", href: "#settings", status: "Placeholder" },
    ],
    controlTowerBadge: "Torre de Control",
    hero: {
      eyebrow: "Fundación del sistema operativo de calidad",
      title: "Un workspace para transformar incertidumbre de producto en artefactos de QA.",
      description:
        "FrankInTest empieza con una Torre de Control profesional para Check-ups seguros asistidos por IA, operaciones de QA Workspace, reportes listos para evidencias y alineación con FrankInDrift.",
    },
    qualitySignals: [
      {
        label: "Borradores de artefactos estructurados",
        value: "12",
        tone: "from-teal-500 to-emerald-400",
      },
      {
        label: "Riesgos potenciales pendientes de revisión",
        value: "7",
        tone: "from-amber-500 to-orange-400",
      },
      {
        label: "Evidencias preparadas",
        value: "5",
        tone: "from-sky-500 to-blue-400",
      },
      {
        label: "Hallazgos de drift por confirmar",
        value: "3",
        tone: "from-rose-500 to-red-400",
      },
    ],
    pillarCards: [
      {
        title: "FrankInTest Check-up asistido por IA",
        eyebrow: "Entrada basada en créditos",
        description:
          "Flujo de Check-up seguro para landing pages, MVPs, flujos SaaS, APIs, flujos móviles y descripciones de producto. Las salidas se tratan como riesgos potenciales y borradores de artefactos de QA.",
        artifacts: ["Ítem de riesgo", "Escenario de prueba", "Resumen de evidencia"],
      },
      {
        title: "QA Workspace profesional",
        eyebrow: "Sistema operativo de QA",
        description:
          "Un workspace determinístico para requisitos, reglas de negocio, diseño de pruebas, ciclos de ejecución, bugs, evidencias, estrategia de automatización y preparación de release.",
        artifacts: ["Requisito", "Caso de prueba", "Reporte de bug"],
      },
      {
        title: "FrankInDrift",
        eyebrow: "Alineación de documentación",
        description:
          "Detecta y gestiona diferencias entre requisitos, docs, pruebas, notas de release, especificaciones de API, comportamiento observado y realidad del producto.",
        artifacts: ["Hallazgo de drift", "Ítem de riesgo", "Validación recomendada"],
      },
    ],
    applicationSections: {
      eyebrow: "Secciones de la aplicación",
      title: "Skeleton navegable para el primer shell SaaS.",
      description:
        "Estas secciones son placeholders con alcance específico de producto, no páginas vacías genéricas.",
    },
    workspaceModules: [
      {
        id: "projects",
        name: "Proyectos",
        summary:
          "Organiza productos, módulos, contexto, nivel de riesgo y el alcance de calidad de cada workspace.",
        status: "CRUD de proyectos llega en un bloque posterior",
      },
      {
        id: "workspace",
        name: "QA Workspace",
        summary:
          "Mapea requisitos, reglas, escenarios, casos de prueba, ciclos, bugs, evidencias y recomendaciones de automatización.",
        status: "Las pantallas de artefactos son placeholders",
      },
      {
        id: "checkup",
        name: "Check-up",
        summary:
          "Estima créditos antes de futuros análisis asistidos por IA y guarda salidas útiles como borradores de artefactos estructurados.",
        status: "Sin llamadas reales de IA ni deducción de créditos",
      },
      {
        id: "reports",
        name: "Reportes",
        summary:
          "Prepara readiness de release, resúmenes de bugs, resúmenes de evidencias y reportes de QA para stakeholders.",
        status: "Fundación estática de reportes",
      },
      {
        id: "drift",
        name: "FrankInDrift",
        summary:
          "Rastrea posibles desalineaciones entre expectativas documentadas, cobertura de pruebas y comportamiento observado del producto.",
        status: "Sugerencias manuales y asistidas por IA después",
      },
      {
        id: "settings",
        name: "Configuración",
        summary:
          "Futura área para preferencias del workspace, límites de análisis seguro, política de auditoría y controles de cobro/créditos.",
        status: "Placeholder de configuración",
      },
    ],
    artifactFirstAi: {
      eyebrow: "IA artefacto-primero",
      title: "Las futuras salidas de IA se convierten en borradores que los usuarios pueden revisar.",
    },
    artifactTypes: [
      "Requisito",
      "Regla de negocio",
      "Escenario de prueba",
      "Caso de prueba",
      "Ciclo de prueba",
      "Reporte de bug",
      "Resumen de evidencia",
      "Ítem de riesgo",
      "Reporte de preparación de release",
      "Hallazgo de drift",
      "Recomendación de automatización",
      "Recomendación de integración",
    ],
    safeBoundaries: {
      eyebrow: "Límites de análisis seguro",
      items: [
        "Las salidas asistidas por IA requieren confirmación antes de tratarse como verdad.",
        "El lenguaje de seguridad se mantiene limitado a orientación segura de Check-up en esta fundación.",
        "No se ejecutan acciones destructivas, escaneos invasivos, integraciones reales ni ejecución externa en el Bloque 01.",
        "Los futuros análisis de IA de alto costo deben estimar créditos antes de la ejecución.",
      ],
    },
  },
};

export function isSupportedLocale(locale: string): locale is Locale {
  return supportedLocales.some((supportedLocale) => supportedLocale.key === locale);
}
