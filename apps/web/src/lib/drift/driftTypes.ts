export type DriftStatus =
  | 'SEM_DRIFT'
  | 'POSSIVEL_DRIFT'
  | 'RASTREABILIDADE_INCOMPLETA'
  | 'RELATORIO_INDISPONIVEL';

export type DriftSignalCode =
  | 'EDITED_AFTER_CREATION'
  | 'STATUS_CHANGED'
  | 'INCOMPLETE_TRACEABILITY'
  | 'SOURCE_UNAVAILABLE';

export interface DriftSignal {
  code: DriftSignalCode;
  reasonPtBr: string;
}

export interface DriftResult {
  artifactId: string;
  driftStatus: DriftStatus;
  signals: DriftSignal[];
}

export interface MissingSection {
  sectionName: string;
  eligibleItemCount: number;
  existingArtifactCount: number;
}

export interface DriftSummary {
  reportId: string;
  totalAnalyzed: number;
  countByStatus: Record<DriftStatus, number>;
  missingSections: MissingSection[];
}

export const DRIFT_STATUS_LABELS: Record<DriftStatus, string> = {
  SEM_DRIFT: 'Sem drift detectado',
  POSSIVEL_DRIFT: 'Possível drift',
  RASTREABILIDADE_INCOMPLETA: 'Rastreabilidade incompleta',
  RELATORIO_INDISPONIVEL: 'Relatório de origem indisponível',
};
