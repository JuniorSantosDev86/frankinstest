export type ArtifactStatus = 'DRAFT' | 'REVIEWED' | 'ACCEPTED' | 'ARCHIVED';

export type ArtifactType = 'REQUIREMENT' | 'RISK_ITEM' | 'QA_ACTION';

export interface WorkspaceArtifact {
  id: string;
  organizationId: string;
  projectId: string | null;
  artifactType: ArtifactType;
  title: string;
  description: string | null;
  status: ArtifactStatus;
  aiAssisted: boolean;
  sourceCheckupReportId: string;
  sourceSection: string;
  sourceItemIndex: number;
  details: Record<string, unknown> | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArtifactListResponse {
  artifacts: WorkspaceArtifact[];
  limitReached: boolean;
}

export interface ArtifactListFilters {
  projectId?: string;
  sourceCheckupReportId?: string;
  artifactType?: ArtifactType;
  status?: ArtifactStatus;
}

export interface ArtifactPatch {
  title?: string;
  description?: string;
  status?: ArtifactStatus;
  details?: Record<string, unknown>;
}

export const ARTIFACT_STATUS_LABELS: Record<ArtifactStatus, string> = {
  DRAFT: 'Rascunho',
  REVIEWED: 'Revisado',
  ACCEPTED: 'Aceito',
  ARCHIVED: 'Arquivado',
};

export const ARTIFACT_TYPE_LABELS: Record<ArtifactType, string> = {
  REQUIREMENT: 'Requisito',
  RISK_ITEM: 'Item de Risco',
  QA_ACTION: 'Ação de QA',
};
