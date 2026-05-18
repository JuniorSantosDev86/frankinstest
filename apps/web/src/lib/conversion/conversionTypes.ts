export type ConversionIntent = 'CREATE_NEW' | 'SKIP';

export type ArtifactType =
  | 'REQUIREMENT'
  | 'TEST_SCENARIO'
  | 'TEST_CASE'
  | 'RISK_ITEM'
  | 'QA_ACTION';

export interface ConversionSelectedItem {
  sourceSection: string;
  sourceItemIndex: number;
}

export interface ConversionPreviewItem {
  sourceSection: string;
  sourceItemIndex: number;
  artifactType: ArtifactType;
  targetTable: string;
  title: string;
  description: string;
  alreadyConverted: boolean;
  existingArtifactId: string | null;
  existingArtifactTable: string | null;
}

export interface ConversionPreviewResponse {
  reportId: string;
  organizationId: string;
  projectId: string | null;
  items: ConversionPreviewItem[];
}

export interface ConversionConfirmItem {
  sourceSection: string;
  sourceItemIndex: number;
  intent: ConversionIntent;
}

export interface ConversionConfirmRequest {
  items: ConversionConfirmItem[];
}

export interface CreatedArtifact {
  artifactId: string;
  artifactType: ArtifactType;
  targetTable: string;
  sourceSection: string;
  sourceItemIndex: number;
}

export interface ConversionResult {
  reportId: string;
  createdArtifacts: CreatedArtifact[];
  skippedCount: number;
}

export const SECTION_LABELS: Record<string, string> = {
  missing_or_unclear_requirements: 'Requisitos ausentes/incompletos',
  suggested_test_scenarios: 'Cenários de teste sugeridos',
  suggested_test_cases: 'Casos de teste sugeridos',
  quality_risks: 'Riscos de qualidade',
  ux_product_risks: 'Riscos de UX/produto',
  release_readiness_notes: 'Notas de release readiness',
};

export const ARTIFACT_TYPE_LABELS: Record<ArtifactType, string> = {
  REQUIREMENT: 'Rascunho de Requisito',
  TEST_SCENARIO: 'Rascunho de Cenário de Teste',
  TEST_CASE: 'Rascunho de Caso de Teste',
  RISK_ITEM: 'Item de Risco',
  QA_ACTION: 'Ação de QA Recomendada',
};
