export type ToolPriority = 'PRIMARY' | 'SECONDARY'

export interface RecommendedTool {
  name: string
  url: string
  priority: ToolPriority
  rationale: string
}

export interface ToolRecommendationCategory {
  categoryCode: string
  categoryLabel: string
  tools: RecommendedTool[]
  justification: string
  nextSteps: string[]
}

export interface ToolRecommendationResult {
  reportId: string
  generatedAt: string
  categories: ToolRecommendationCategory[]
}

export interface ToolRecommendationSaveResponse {
  artifactId: string
  artifactType: string
  title: string
  status: string
  createdAt: string
}
