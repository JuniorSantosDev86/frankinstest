export type TargetType =
  | 'URL'
  | 'FEATURE_DESCRIPTION'
  | 'API_DESCRIPTION'
  | 'DOCUMENT'
  | 'MOBILE_FLOW'
  | 'OTHER'

export type CheckupDepth = 'QUICK' | 'STANDARD' | 'DEEP'

export type OutputMode = 'REPORT_ONLY' | 'REPORT_WITH_SCENARIOS'

export type ReportStatus = 'DRAFT' | 'REVIEWED'

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type ScenarioType = 'POSITIVE' | 'NEGATIVE' | 'EDGE_CASE'

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

export type AiRunStatus = 'running' | 'completed' | 'failed' | 'reserved'

export interface CheckupRequest {
  targetType: TargetType
  targetValue: string
  userAuthorizationConfirmed: boolean
  context: string
  goal: string
  depth: CheckupDepth
  outputMode: OutputMode
  targetAudience?: string
  criticalFlows?: string
  knownRisks?: string
  technologies?: string
}

export interface CreditBreakdown {
  base: number
  outputMultiplier: number
  total: number
}

export interface CheckupEstimateResponse {
  estimatedCredits: number
  breakdown: CreditBreakdown
  currency: string
}

export interface CheckupRunResponse {
  aiRunId: string
  reportId: string
  status: string
  estimatedCredits: number
}

export interface FindingItem {
  title: string
  description: string
  severity: Severity
}

export interface ScenarioItem {
  title: string
  description: string
  type: ScenarioType
}

export interface TestCaseItem {
  title: string
  preconditions: string
  steps: string[]
  expectedResult: string
}

export interface ActionItem {
  action: string
  rationale: string
  priority: Priority
}

export interface CheckupReportView {
  id: string
  status: ReportStatus
  targetType: string
  targetValue: string
  depth: string
  qualityRisks: FindingItem[]
  missingOrUnclearRequirements: FindingItem[]
  suggestedTestScenarios: ScenarioItem[]
  suggestedTestCases: TestCaseItem[]
  uxProductRisks: FindingItem[]
  releaseReadinessNotes: FindingItem[]
  recommendedNextActions: ActionItem[]
  createdAt: string
  updatedAt: string
}

export interface CheckupRunStatusResponse {
  aiRunId: string
  status: AiRunStatus
  creditsConsumed: number
  report: CheckupReportView | null
  errorMessage?: string
}
