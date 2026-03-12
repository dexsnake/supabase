import type { ChatStatus, UIMessage } from 'ai'
import type { ReactNode } from 'react'

export type AgentChatConversation = {
  id: string
  title: string | null
  createdAt?: string
}

export type AgentChatAgent = {
  id: string
  name: string
}

export type AgentChatModel = {
  id: string
  name: string
  provider?: string
  group?: string
}

export type AgentChatRowAction = {
  label: string
  prompt: string
}

export type AgentChatRowItem = {
  primaryText: string
  secondaryText?: string
  actions?: AgentChatRowAction[]
}

export type AgentChatChartPoint = Record<string, string | number>

export type AgentChatChart = {
  primaryText?: string
  secondaryText?: string
  tertiaryText?: string
  data?: AgentChatChartPoint[]
  xAxis?: string
  yAxis?: string
}

export type AgentChatSqlPoint = Record<string, string | number | boolean | null | object>

export type AgentChatSqlChartConfig = {
  type?: 'bar'
  xKey: string
  yKey: string
}

export type AgentChatSql =
  | {
      source: 'sql'
      projectRef: string
      connectionString?: string | null
      defaultValue?: string
      view?: 'table' | 'chart'
      chartConfig?: AgentChatSqlChartConfig
      runButtonLabel?: string
      primaryText?: string
      secondaryText?: string
    }
  | {
      source: 'logs'
      projectRef: string
      dateRange: { from: string; to: string }
      defaultValue?: string
      view?: 'table' | 'chart'
      chartConfig?: AgentChatSqlChartConfig
      runButtonLabel?: string
      primaryText?: string
      secondaryText?: string
    }

export type AgentChatSqlRunRequest = AgentChatSql & {
  sql: string
}

export type AgentChatSqlRunResult = {
  rows?: AgentChatSqlPoint[]
  error?: string
}

export type AgentChatSqlRun = (request: AgentChatSqlRunRequest) => Promise<AgentChatSqlRunResult>

export type AgentChatSqlRunners = {
  database?: AgentChatSqlRun
  logs?: AgentChatSqlRun
}

export type AgentChatSqlEditorRenderProps = {
  payload: AgentChatSql
  value: string
  disabled?: boolean
  onChange: (value: string) => void
  onRun: () => void
}

export type AgentChatSqlEditorRender = (props: AgentChatSqlEditorRenderProps) => ReactNode

export type AgentChatSubmitMessage = {
  text: string
  agentId?: string
  conversationId?: string | null
  modelId?: string
}

export type RenderMessagePartContext = {
  message: UIMessage
  messageIndex: number
  partIndex: number
}

export type RenderMessagePart = (
  part: UIMessage['parts'][number],
  context: RenderMessagePartContext
) => ReactNode

export interface AgentChatProps {
  className?: string
  showHeader?: boolean
  contentMaxWidthClassName?: string
  emptyStateContent?: ReactNode
  messages: UIMessage[]
  status?: ChatStatus
  input: string
  onInputChange: (value: string) => void
  onSubmit: (message: AgentChatSubmitMessage) => void
  placeholder?: string
  disabled?: boolean
  suggestions?: string[]
  onSuggestionSelect?: (suggestion: string) => void
  conversations: AgentChatConversation[]
  activeConversationId: string | null
  onConversationChange: (id: string | null) => void
  onRefreshConversations?: () => void
  agents?: AgentChatAgent[]
  selectedAgentId?: string
  onAgentChange?: (id: string) => void
  models?: AgentChatModel[]
  selectedModelId?: string
  onModelChange?: (id: string) => void
  emptyState?: {
    title?: string
    description?: string
  }
  renderMessagePart?: RenderMessagePart
  onActionPrompt?: (prompt: string) => void
  sqlRunners?: AgentChatSqlRunners
  renderSqlEditor?: AgentChatSqlEditorRender
}
