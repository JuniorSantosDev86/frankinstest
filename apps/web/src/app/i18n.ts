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

export type Locale = "pt-BR";

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
      { label: "Suítes de teste", href: "#test-suites", status: "MVP local" },
      { label: "Ciclos de teste", href: "#test-cycles", status: "MVP local" },
      { label: "Execução de testes", href: "#test-executions", status: "MVP local" },
      { label: "Bugs e defeitos", href: "#bugs", status: "MVP local" },
      { label: "Evidências", href: "#evidence", status: "MVP local" },
      { label: "Relatórios", href: "#reports", status: "MVP local" },
      { label: "IA e créditos", href: "#ai-usage", status: "MVP local" },
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
        id: "reports-overview",
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
};

export function getTranslations(): Translation {
  return translations["pt-BR"];
}
