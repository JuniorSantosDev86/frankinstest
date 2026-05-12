import type {
  BusinessRulePriority,
  BusinessRuleStatus,
  ModuleCriticality,
  ModuleStatus,
  RequirementSource,
  RequirementStatus,
} from "@/lib/business-understanding/types";
import type {
  ProjectStatus,
  ProjectType,
  QaMaturity,
  RiskLevel,
} from "@/lib/projects/types";

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

type ProjectCopy = {
  eyebrow: string;
  title: string;
  description: string;
  persistenceNote: string;
  createTitle: string;
  editTitle: string;
  emptyTitle: string;
  emptyDescription: string;
  fields: {
    name: string;
    type: string;
    description: string;
    targetUrl: string;
    qaMaturity: string;
    riskLevel: string;
    status: string;
  };
  placeholders: {
    name: string;
    description: string;
    targetUrl: string;
  };
  actions: {
    create: string;
    update: string;
    cancel: string;
    edit: string;
    delete: string;
  };
  summaryLabel: string;
  targetUrlLabel: string;
  noTargetUrl: string;
  deleteConfirm: string;
  validationError: string;
  options: {
    types: Record<ProjectType, string>;
    qaMaturity: Record<QaMaturity, string>;
    riskLevel: Record<RiskLevel, string>;
    status: Record<ProjectStatus, string>;
  };
};

type BusinessUnderstandingCopy = {
  eyebrow: string;
  title: string;
  description: string;
  persistenceNote: string;
  workflowLabel: string;
  projectSelectLabel: string;
  summaryTitle: string;
  summaryMetrics: {
    totalModules: string;
    totalRequirements: string;
    totalBusinessRules: string;
    criticalModules: string;
    requirementsNeedingReview: string;
    businessRulesNeedingReview: string;
  };
  modules: {
    title: string;
    createTitle: string;
    editTitle: string;
    emptyTitle: string;
    emptyDescription: string;
    fields: {
      name: string;
      description: string;
      criticality: string;
      status: string;
    };
    placeholders: {
      name: string;
      description: string;
    };
    options: {
      criticality: Record<ModuleCriticality, string>;
      status: Record<ModuleStatus, string>;
    };
  };
  requirements: {
    title: string;
    createTitle: string;
    editTitle: string;
    emptyTitle: string;
    emptyDescription: string;
    moduleLabel: string;
    fields: {
      moduleId: string;
      title: string;
      description: string;
      source: string;
      status: string;
      aiGenerated: string;
      reviewedBy: string;
    };
    placeholders: {
      title: string;
      description: string;
      reviewedBy: string;
    };
    options: {
      source: Record<RequirementSource, string>;
      status: Record<RequirementStatus, string>;
    };
  };
  businessRules: {
    title: string;
    createTitle: string;
    editTitle: string;
    emptyTitle: string;
    emptyDescription: string;
    requirementLabel: string;
    ruleTextLabel: string;
    fields: {
      requirementId: string;
      title: string;
      ruleText: string;
      priority: string;
      status: string;
      aiGenerated: string;
      reviewedBy: string;
    };
    placeholders: {
      title: string;
      ruleText: string;
      reviewedBy: string;
    };
    options: {
      priority: Record<BusinessRulePriority, string>;
      status: Record<BusinessRuleStatus, string>;
    };
  };
  badges: {
    aiGenerated: string;
    humanCreated: string;
  };
  actions: {
    create: string;
    update: string;
    cancel: string;
    edit: string;
  };
  validationError: string;
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
  auth: {
    demoLabel: string;
    mode: string;
    signedInAs: string;
    localOnly: string;
  };
  workspace: {
    activeWorkspace: string;
    plan: string;
    credits: string;
    role: string;
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
  projects: ProjectCopy;
  businessUnderstanding: BusinessUnderstandingCopy;
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
    auth: {
      demoLabel: "Autenticação demo",
      mode: "Sessão local assinada para o skeleton MVP",
      signedInAs: "Conectado como",
      localOnly: "Sem login real, senha, OAuth, cookies ou provedor externo neste bloco.",
    },
    workspace: {
      activeWorkspace: "Workspace ativo",
      plan: "Plano",
      credits: "Créditos placeholder",
      role: "Papel",
    },
    navigationItems: [
      { label: "Control Tower", href: "#control-tower", status: "Ativo" },
      { label: "Projetos", href: "#projects", status: "Operacional" },
      { label: "QA Workspace", href: "#workspace", status: "Operacional" },
      { label: "Módulos", href: "#business-understanding", status: "MVP local" },
      { label: "Requisitos", href: "#business-understanding", status: "MVP local" },
      { label: "Regras de Negócio", href: "#business-understanding", status: "MVP local" },
      { label: "Cenários de Teste", href: "#test-scenarios", status: "MVP local" },
      { label: "Casos de Teste", href: "#test-cases", status: "MVP local" },
      { label: "Relatórios", href: "#reports", status: "UI demo" },
      { label: "FrankInDrift", href: "#drift", status: "UI demo" },
      { label: "Configurações", href: "#settings", status: "Placeholder" },
    ],
    controlTowerBadge: "Control Tower",
    hero: {
      eyebrow: "Control Tower",
      title: "Um workspace para transformar artefatos de produto em artefatos de QA.",
      description:
        "Visão integrada do seu ecossistema de qualidade. Transforme requisitos, regras e riscos em cenários, casos e decisões de release.",
    },
    qualitySignals: [
      {
        label: "Projetos no workspace pessoal",
        value: "2+",
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
          "Fluxo de Check-up seguro para landing pages, MVPs, fluxos SaaS, APIs, fluxos mobile e descrições de produto. As saídas serão riscos potenciais e rascunhos de artefatos de QA.",
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
    projects: {
      eyebrow: "Projetos",
      title: "Primeiro módulo operacional do workspace.",
      description:
        "Crie, edite e remova projetos locais para definir produto, URL alvo, maturidade de QA e nível de risco antes dos próximos artefatos.",
      persistenceNote:
        "Persistência local simples via localStorage. Não há banco real, sincronização, billing ou dedução de créditos.",
      createTitle: "Novo projeto",
      editTitle: "Editar projeto",
      emptyTitle: "Nenhum projeto local ainda",
      emptyDescription: "Crie o primeiro projeto para começar a organizar o escopo de QA.",
      fields: {
        name: "Nome",
        type: "Tipo",
        description: "Descrição",
        targetUrl: "URL alvo",
        qaMaturity: "Maturidade de QA",
        riskLevel: "Risco",
        status: "Status",
      },
      placeholders: {
        name: "Ex.: Portal do cliente",
        description: "Contexto, fluxos críticos e objetivo de qualidade.",
        targetUrl: "https://...",
      },
      actions: {
        create: "Criar projeto",
        update: "Salvar alterações",
        cancel: "Cancelar edição",
        edit: "Editar",
        delete: "Remover",
      },
      summaryLabel: "Resumo rápido",
      targetUrlLabel: "Alvo",
      noTargetUrl: "Sem URL alvo definida",
      deleteConfirm: "Remover este projeto local? Esta ação precisa de confirmação.",
      validationError: "Informe um nome válido e selecione valores suportados para o projeto.",
      options: {
        types: {
          landing_page: "Landing page",
          saas: "SaaS",
          mobile_app: "App mobile",
          api: "API",
          erp: "ERP",
          ecommerce: "E-commerce",
          internal_system: "Sistema interno",
          other: "Outro",
        },
        qaMaturity: {
          unknown: "Desconhecida",
          ad_hoc: "Ad hoc",
          basic: "Básica",
          structured: "Estruturada",
          advanced: "Avançada",
        },
        riskLevel: {
          low: "Baixo",
          medium: "Médio",
          high: "Alto",
          critical: "Crítico",
        },
        status: {
          active: "Ativo",
          paused: "Pausado",
          archived: "Arquivado",
        },
      },
    },
    businessUnderstanding: {
      eyebrow: "Entendimento do negócio",
      title: "Mapeie o produto antes de desenhar testes.",
      description:
        "Organize módulos, requisitos e regras de negócio em um fluxo rastreável para transformar contexto de produto em artefatos de QA.",
      persistenceNote:
        "Dados locais de demonstração via localStorage. Sem banco real, IA real, cobrança ou dedução de créditos.",
      workflowLabel: "Projeto -> Módulo -> Requisito -> Regra de negócio",
      projectSelectLabel: "Projeto em análise",
      summaryTitle: "Resumo de rastreabilidade",
      summaryMetrics: {
        totalModules: "Módulos",
        totalRequirements: "Requisitos",
        totalBusinessRules: "Regras",
        criticalModules: "Módulos críticos",
        requirementsNeedingReview: "Requisitos a revisar",
        businessRulesNeedingReview: "Regras a revisar",
      },
      modules: {
        title: "Product Modules",
        createTitle: "Novo módulo",
        editTitle: "Editar módulo",
        emptyTitle: "Nenhum módulo neste projeto",
        emptyDescription: "Crie um módulo para representar uma área funcional ou fluxo do produto.",
        fields: {
          name: "Nome do módulo",
          description: "Descrição QA",
          criticality: "Criticidade",
          status: "Status",
        },
        placeholders: {
          name: "Ex.: Checkout, autenticação, dashboard",
          description: "O que existe nesta área e por que ela importa para QA.",
        },
        options: {
          criticality: {
            low: "Baixa",
            medium: "Média",
            high: "Alta",
            critical: "Crítica",
          },
          status: {
            active: "Ativo",
            deprecated: "Depreciado",
            planned: "Planejado",
          },
        },
      },
      requirements: {
        title: "Requirements",
        createTitle: "Novo requisito",
        editTitle: "Editar requisito",
        emptyTitle: "Nenhum requisito para os módulos selecionados",
        emptyDescription: "Crie requisitos para declarar o que o produto precisa entregar.",
        moduleLabel: "Módulo",
        fields: {
          moduleId: "Módulo vinculado",
          title: "Título do requisito",
          description: "Descrição",
          source: "Fonte",
          status: "Status",
          aiGenerated: "Rascunho assistido por IA",
          reviewedBy: "Revisado por",
        },
        placeholders: {
          title: "Ex.: Usuário deve recuperar senha com segurança",
          description: "Contexto, regra esperada e critério de entendimento.",
          reviewedBy: "Nome ou ID do revisor humano",
        },
        options: {
          source: {
            user_input: "Entrada do usuário",
            documentation: "Documentação",
            stakeholder: "Stakeholder",
            ai_draft: "Rascunho de IA",
            imported: "Importado",
          },
          status: {
            draft: "Rascunho",
            active: "Ativo",
            needs_review: "Precisa revisão",
            archived: "Arquivado",
          },
        },
      },
      businessRules: {
        title: "Business Rules",
        createTitle: "Nova regra de negócio",
        editTitle: "Editar regra de negócio",
        emptyTitle: "Nenhuma regra vinculada aos requisitos",
        emptyDescription: "Crie regras para transformar requisitos em comportamento validável.",
        requirementLabel: "Requisito",
        ruleTextLabel: "Regra",
        fields: {
          requirementId: "Requisito vinculado",
          title: "Título da regra",
          ruleText: "Texto da regra",
          priority: "Prioridade",
          status: "Status",
          aiGenerated: "Rascunho assistido por IA",
          reviewedBy: "Revisado por",
        },
        placeholders: {
          title: "Ex.: E-mail é obrigatório para cadastro",
          ruleText: "Descreva a regra de negócio que deve ser validada.",
          reviewedBy: "Nome ou ID do revisor humano",
        },
        options: {
          priority: {
            low: "Baixa",
            medium: "Média",
            high: "Alta",
            critical: "Crítica",
          },
          status: {
            draft: "Rascunho",
            active: "Ativo",
            needs_review: "Precisa revisão",
            archived: "Arquivado",
          },
        },
      },
      badges: {
        aiGenerated: "IA assistida",
        humanCreated: "Humano",
      },
      actions: {
        create: "Criar",
        update: "Salvar alterações",
        cancel: "Cancelar edição",
        edit: "Editar",
      },
      validationError:
        "Revise os campos obrigatórios e use apenas valores suportados pelo modelo local.",
    },
    applicationSections: {
      eyebrow: "Seções da aplicação",
      title: "Skeleton navegável para o primeiro shell SaaS.",
      description:
        "Estas seções têm escopo específico de produto e preservam a Torre de Controle como entrada principal.",
    },
    workspaceModules: [
      {
        id: "workspace",
        name: "QA Workspace",
        summary:
          "Mapeie requisitos, regras, cenários, casos de teste, ciclos, bugs, evidências e recomendações de automação.",
        status: "Artefatos chegam no Bloco 03+",
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
        "Nenhuma ação destrutiva, varredura invasiva, integração real ou execução externa roda no Bloco 02.",
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
    auth: {
      demoLabel: "Demo authentication",
      mode: "Local signed-in session for the MVP skeleton",
      signedInAs: "Signed in as",
      localOnly: "No real login, passwords, OAuth, cookies, or external provider in this block.",
    },
    workspace: {
      activeWorkspace: "Active workspace",
      plan: "Plan",
      credits: "Credit placeholder",
      role: "Role",
    },
    navigationItems: [
      { label: "Control Tower", href: "#control-tower", status: "Live shell" },
      { label: "Projects", href: "#projects", status: "Operational" },
      { label: "QA Workspace", href: "#workspace", status: "Placeholder" },
      { label: "Cenários de teste", href: "#test-scenarios", status: "MVP local" },
      { label: "Casos de teste", href: "#test-cases", status: "MVP local" },
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
        "FrankInTest now has a local auth boundary, personal workspace, and projects for organizing quality scope before any real AI, billing, integration, or database work.",
    },
    qualitySignals: [
      {
        label: "Projects in the personal workspace",
        value: "2+",
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
          "Safe Check-up flow for landing pages, MVPs, SaaS flows, APIs, mobile flows, and product descriptions. Outputs will be framed as potential risks and draft QA artifacts.",
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
    projects: {
      eyebrow: "Projects",
      title: "The first operational workspace module.",
      description:
        "Create, edit, and remove local projects to define product, target URL, QA maturity, and risk level before the next artifacts.",
      persistenceNote:
        "Simple local persistence through localStorage. There is no real database, sync, billing, or credit deduction.",
      createTitle: "New project",
      editTitle: "Edit project",
      emptyTitle: "No local projects yet",
      emptyDescription: "Create the first project to start organizing QA scope.",
      fields: {
        name: "Name",
        type: "Type",
        description: "Description",
        targetUrl: "Target URL",
        qaMaturity: "QA maturity",
        riskLevel: "Risk",
        status: "Status",
      },
      placeholders: {
        name: "Example: Customer portal",
        description: "Context, critical flows, and quality objective.",
        targetUrl: "https://...",
      },
      actions: {
        create: "Create project",
        update: "Save changes",
        cancel: "Cancel edit",
        edit: "Edit",
        delete: "Remove",
      },
      summaryLabel: "Quick summary",
      targetUrlLabel: "Target",
      noTargetUrl: "No target URL defined",
      deleteConfirm: "Remove this local project? This action requires confirmation.",
      validationError: "Enter a valid name and select supported project values.",
      options: {
        types: {
          landing_page: "Landing page",
          saas: "SaaS",
          mobile_app: "Mobile app",
          api: "API",
          erp: "ERP",
          ecommerce: "E-commerce",
          internal_system: "Internal system",
          other: "Other",
        },
        qaMaturity: {
          unknown: "Unknown",
          ad_hoc: "Ad hoc",
          basic: "Basic",
          structured: "Structured",
          advanced: "Advanced",
        },
        riskLevel: {
          low: "Low",
          medium: "Medium",
          high: "High",
          critical: "Critical",
        },
        status: {
          active: "Active",
          paused: "Paused",
          archived: "Archived",
        },
      },
    },
    businessUnderstanding: {
      eyebrow: "Business understanding",
      title: "Map the product before designing tests.",
      description:
        "Organize modules, requirements, and business rules in a traceable flow that turns product context into QA artifacts.",
      persistenceNote:
        "Local demo data through localStorage. No real database, real AI, billing, or credit deduction.",
      workflowLabel: "Project -> Module -> Requirement -> Business Rule",
      projectSelectLabel: "Project under analysis",
      summaryTitle: "Traceability summary",
      summaryMetrics: {
        totalModules: "Modules",
        totalRequirements: "Requirements",
        totalBusinessRules: "Rules",
        criticalModules: "Critical modules",
        requirementsNeedingReview: "Requirements to review",
        businessRulesNeedingReview: "Rules to review",
      },
      modules: {
        title: "Product Modules",
        createTitle: "New module",
        editTitle: "Edit module",
        emptyTitle: "No modules in this project",
        emptyDescription: "Create a module to represent a product area or functional flow.",
        fields: {
          name: "Module name",
          description: "QA description",
          criticality: "Criticality",
          status: "Status",
        },
        placeholders: {
          name: "Example: Checkout, authentication, dashboard",
          description: "What exists in this area and why it matters for QA.",
        },
        options: {
          criticality: {
            low: "Low",
            medium: "Medium",
            high: "High",
            critical: "Critical",
          },
          status: {
            active: "Active",
            deprecated: "Deprecated",
            planned: "Planned",
          },
        },
      },
      requirements: {
        title: "Requirements",
        createTitle: "New requirement",
        editTitle: "Edit requirement",
        emptyTitle: "No requirements for the selected modules",
        emptyDescription: "Create requirements to state what the product needs to deliver.",
        moduleLabel: "Module",
        fields: {
          moduleId: "Linked module",
          title: "Requirement title",
          description: "Description",
          source: "Source",
          status: "Status",
          aiGenerated: "AI-assisted draft",
          reviewedBy: "Reviewed by",
        },
        placeholders: {
          title: "Example: User should recover password safely",
          description: "Context, expected rule, and understanding criteria.",
          reviewedBy: "Human reviewer name or ID",
        },
        options: {
          source: {
            user_input: "User input",
            documentation: "Documentation",
            stakeholder: "Stakeholder",
            ai_draft: "AI draft",
            imported: "Imported",
          },
          status: {
            draft: "Draft",
            active: "Active",
            needs_review: "Needs review",
            archived: "Archived",
          },
        },
      },
      businessRules: {
        title: "Business Rules",
        createTitle: "New business rule",
        editTitle: "Edit business rule",
        emptyTitle: "No rules linked to requirements",
        emptyDescription: "Create rules to turn requirements into behavior that can be validated.",
        requirementLabel: "Requirement",
        ruleTextLabel: "Rule",
        fields: {
          requirementId: "Linked requirement",
          title: "Rule title",
          ruleText: "Rule text",
          priority: "Priority",
          status: "Status",
          aiGenerated: "AI-assisted draft",
          reviewedBy: "Reviewed by",
        },
        placeholders: {
          title: "Example: Email is required for sign-up",
          ruleText: "Describe the business rule that should be validated.",
          reviewedBy: "Human reviewer name or ID",
        },
        options: {
          priority: {
            low: "Low",
            medium: "Medium",
            high: "High",
            critical: "Critical",
          },
          status: {
            draft: "Draft",
            active: "Active",
            needs_review: "Needs review",
            archived: "Archived",
          },
        },
      },
      badges: {
        aiGenerated: "AI-assisted",
        humanCreated: "Human",
      },
      actions: {
        create: "Create",
        update: "Save changes",
        cancel: "Cancel edit",
        edit: "Edit",
      },
      validationError:
        "Review the required fields and use only values supported by the local model.",
    },
    applicationSections: {
      eyebrow: "Application sections",
      title: "Navigable skeleton for the first SaaS shell.",
      description:
        "These sections have product-specific scope and preserve the Control Tower as the main entry point.",
    },
    workspaceModules: [
      {
        id: "workspace",
        name: "QA Workspace",
        summary:
          "Map requirements, rules, scenarios, test cases, cycles, bugs, evidence, and automation recommendations.",
        status: "Artifacts arrive in Block 03+",
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
        "No destructive actions, invasive scans, real integrations, or external execution run in Block 02.",
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
    auth: {
      demoLabel: "Autenticación demo",
      mode: "Sesión local iniciada para el skeleton MVP",
      signedInAs: "Conectado como",
      localOnly: "Sin login real, contraseñas, OAuth, cookies ni proveedor externo en este bloque.",
    },
    workspace: {
      activeWorkspace: "Workspace activo",
      plan: "Plan",
      credits: "Créditos placeholder",
      role: "Rol",
    },
    navigationItems: [
      { label: "Torre de Control", href: "#control-tower", status: "Shell activo" },
      { label: "Proyectos", href: "#projects", status: "Operacional" },
      { label: "QA Workspace", href: "#workspace", status: "Placeholder" },
      { label: "Cenários de teste", href: "#test-scenarios", status: "MVP local" },
      { label: "Casos de teste", href: "#test-cases", status: "MVP local" },
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
        "FrankInTest ahora tiene una frontera local de autenticación, workspace personal y proyectos para organizar el alcance de calidad antes de cualquier IA, cobro, integración o base real.",
    },
    qualitySignals: [
      {
        label: "Proyectos en el workspace personal",
        value: "2+",
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
          "Flujo de Check-up seguro para landing pages, MVPs, flujos SaaS, APIs, flujos móviles y descripciones de producto. Las salidas serán riesgos potenciales y borradores de artefactos de QA.",
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
    projects: {
      eyebrow: "Proyectos",
      title: "El primer módulo operacional del workspace.",
      description:
        "Crea, edita y remueve proyectos locales para definir producto, URL objetivo, madurez de QA y nivel de riesgo antes de los próximos artefactos.",
      persistenceNote:
        "Persistencia local simple con localStorage. No hay base de datos real, sincronización, cobro ni deducción de créditos.",
      createTitle: "Nuevo proyecto",
      editTitle: "Editar proyecto",
      emptyTitle: "Todavía no hay proyectos locales",
      emptyDescription: "Crea el primer proyecto para empezar a organizar el alcance de QA.",
      fields: {
        name: "Nombre",
        type: "Tipo",
        description: "Descripción",
        targetUrl: "URL objetivo",
        qaMaturity: "Madurez de QA",
        riskLevel: "Riesgo",
        status: "Status",
      },
      placeholders: {
        name: "Ej.: Portal del cliente",
        description: "Contexto, flujos críticos y objetivo de calidad.",
        targetUrl: "https://...",
      },
      actions: {
        create: "Crear proyecto",
        update: "Guardar cambios",
        cancel: "Cancelar edición",
        edit: "Editar",
        delete: "Remover",
      },
      summaryLabel: "Resumen rápido",
      targetUrlLabel: "Objetivo",
      noTargetUrl: "Sin URL objetivo definida",
      deleteConfirm: "¿Remover este proyecto local? Esta acción requiere confirmación.",
      validationError: "Informa un nombre válido y selecciona valores soportados para el proyecto.",
      options: {
        types: {
          landing_page: "Landing page",
          saas: "SaaS",
          mobile_app: "App mobile",
          api: "API",
          erp: "ERP",
          ecommerce: "E-commerce",
          internal_system: "Sistema interno",
          other: "Otro",
        },
        qaMaturity: {
          unknown: "Desconocida",
          ad_hoc: "Ad hoc",
          basic: "Básica",
          structured: "Estructurada",
          advanced: "Avanzada",
        },
        riskLevel: {
          low: "Bajo",
          medium: "Medio",
          high: "Alto",
          critical: "Crítico",
        },
        status: {
          active: "Activo",
          paused: "Pausado",
          archived: "Archivado",
        },
      },
    },
    businessUnderstanding: {
      eyebrow: "Entendimiento del negocio",
      title: "Mapea el producto antes de diseñar pruebas.",
      description:
        "Organiza módulos, requisitos y reglas de negocio en un flujo trazable para convertir contexto de producto en artefactos de QA.",
      persistenceNote:
        "Datos demo locales con localStorage. Sin base de datos real, IA real, cobro ni deducción de créditos.",
      workflowLabel: "Proyecto -> Módulo -> Requisito -> Regla de negocio",
      projectSelectLabel: "Proyecto en análisis",
      summaryTitle: "Resumen de trazabilidad",
      summaryMetrics: {
        totalModules: "Módulos",
        totalRequirements: "Requisitos",
        totalBusinessRules: "Reglas",
        criticalModules: "Módulos críticos",
        requirementsNeedingReview: "Requisitos a revisar",
        businessRulesNeedingReview: "Reglas a revisar",
      },
      modules: {
        title: "Product Modules",
        createTitle: "Nuevo módulo",
        editTitle: "Editar módulo",
        emptyTitle: "Sin módulos en este proyecto",
        emptyDescription: "Crea un módulo para representar un área o flujo funcional del producto.",
        fields: {
          name: "Nombre del módulo",
          description: "Descripción QA",
          criticality: "Criticidad",
          status: "Status",
        },
        placeholders: {
          name: "Ej.: Checkout, autenticación, dashboard",
          description: "Qué existe en esta área y por qué importa para QA.",
        },
        options: {
          criticality: {
            low: "Baja",
            medium: "Media",
            high: "Alta",
            critical: "Crítica",
          },
          status: {
            active: "Activo",
            deprecated: "Deprecado",
            planned: "Planeado",
          },
        },
      },
      requirements: {
        title: "Requirements",
        createTitle: "Nuevo requisito",
        editTitle: "Editar requisito",
        emptyTitle: "Sin requisitos para los módulos seleccionados",
        emptyDescription: "Crea requisitos para declarar lo que el producto necesita entregar.",
        moduleLabel: "Módulo",
        fields: {
          moduleId: "Módulo vinculado",
          title: "Título del requisito",
          description: "Descripción",
          source: "Fuente",
          status: "Status",
          aiGenerated: "Borrador asistido por IA",
          reviewedBy: "Revisado por",
        },
        placeholders: {
          title: "Ej.: Usuario debe recuperar contraseña de forma segura",
          description: "Contexto, regla esperada y criterio de entendimiento.",
          reviewedBy: "Nombre o ID del revisor humano",
        },
        options: {
          source: {
            user_input: "Entrada del usuario",
            documentation: "Documentación",
            stakeholder: "Stakeholder",
            ai_draft: "Borrador de IA",
            imported: "Importado",
          },
          status: {
            draft: "Borrador",
            active: "Activo",
            needs_review: "Necesita revisión",
            archived: "Archivado",
          },
        },
      },
      businessRules: {
        title: "Business Rules",
        createTitle: "Nueva regla de negocio",
        editTitle: "Editar regla de negocio",
        emptyTitle: "Sin reglas vinculadas a requisitos",
        emptyDescription: "Crea reglas para convertir requisitos en comportamiento validable.",
        requirementLabel: "Requisito",
        ruleTextLabel: "Regla",
        fields: {
          requirementId: "Requisito vinculado",
          title: "Título de la regla",
          ruleText: "Texto de la regla",
          priority: "Prioridad",
          status: "Status",
          aiGenerated: "Borrador asistido por IA",
          reviewedBy: "Revisado por",
        },
        placeholders: {
          title: "Ej.: E-mail es obligatorio para registro",
          ruleText: "Describe la regla de negocio que debe validarse.",
          reviewedBy: "Nombre o ID del revisor humano",
        },
        options: {
          priority: {
            low: "Baja",
            medium: "Media",
            high: "Alta",
            critical: "Crítica",
          },
          status: {
            draft: "Borrador",
            active: "Activo",
            needs_review: "Necesita revisión",
            archived: "Archivado",
          },
        },
      },
      badges: {
        aiGenerated: "IA asistida",
        humanCreated: "Humano",
      },
      actions: {
        create: "Crear",
        update: "Guardar cambios",
        cancel: "Cancelar edición",
        edit: "Editar",
      },
      validationError:
        "Revisa los campos obligatorios y usa solo valores soportados por el modelo local.",
    },
    applicationSections: {
      eyebrow: "Secciones de la aplicación",
      title: "Skeleton navegable para el primer shell SaaS.",
      description:
        "Estas secciones tienen alcance específico de producto y preservan la Torre de Control como entrada principal.",
    },
    workspaceModules: [
      {
        id: "workspace",
        name: "QA Workspace",
        summary:
          "Mapea requisitos, reglas, escenarios, casos de prueba, ciclos, bugs, evidencias y recomendaciones de automatización.",
        status: "Los artefactos llegan en el Bloque 03+",
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
        "No se ejecutan acciones destructivas, escaneos invasivos, integraciones reales ni ejecución externa en el Bloque 02.",
        "Los futuros análisis de IA de alto costo deben estimar créditos antes de la ejecución.",
      ],
    },
  },
};

export function isSupportedLocale(locale: string): locale is Locale {
  return supportedLocales.some((supportedLocale) => supportedLocale.key === locale);
}
