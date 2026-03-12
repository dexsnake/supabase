import { useChat } from '@ai-sdk/react'
import {
  AgentChat as AgentChatView,
  type AgentChatModel,
  type AgentChatSqlEditorRenderProps,
  type AgentChatSqlRunners,
  type AgentChatSqlRunRequest,
  type AgentChatSqlRunResult,
} from 'agent-chat'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { getAccessToken } from 'common'
import { useAgentsQuery } from 'data/agents/agents-query'
import { useConversationMessagesQuery } from 'data/agents/conversation-messages-query'
import { useConversationsQuery } from 'data/agents/conversations-query'
import { get } from 'data/fetchers'
import { executeSql } from 'data/sql/execute-sql-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { BASE_PATH } from 'lib/constants'
import { Loader2Icon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { agentChatState, useAgentChatStateSnapshot } from 'state/agent-chat-state'

import { AIEditor } from '@/components/ui/AIEditor'

const SUGGESTIONS = [
  'Summarize what this agent can help me with',
  'What should I investigate first in this project?',
  'Help me plan the next debugging steps',
  'Show me the most important recent context',
]

const MODELS: AgentChatModel[] = [
  { id: 'gpt-5', name: 'GPT-5', provider: 'OpenAI', group: 'OpenAI' },
  { id: 'gpt-5-mini', name: 'GPT-5 Mini', provider: 'OpenAI', group: 'OpenAI' },
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude 4 Opus',
    provider: 'Anthropic',
    group: 'Anthropic',
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude 4 Sonnet',
    provider: 'Anthropic',
    group: 'Anthropic',
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    group: 'Google',
  },
]

interface AgentChatProps {
  className?: string
  contentMaxWidthClassName?: string
  projectRef: string
  initialAgentId?: string
  initialConversationId?: string | null
  initialPrompt?: string
  initialPromptRequestId?: string
  onInitialPromptConsumed?: () => void
  onConversationChange?: (id: string | null) => void
  restrictToInitialAgent?: boolean
  showHeader?: boolean
}

interface AgentChatInnerProps {
  className?: string
  contentMaxWidthClassName?: string
  projectRef: string
  agentId: string
  agents: Array<{ id: string; name: string }>
  conversationId: string
  activeConversationId: string | null
  initialMessages: UIMessage[]
  conversations: Array<{ id: string; title: string | null; created_at: string }>
  onConversationChange: (id: string | null) => void
  onRefreshConversations: () => void
  onAgentChange: (id: string) => void
  initialPrompt?: string
  initialPromptRequestId?: string
  onInitialPromptConsumed?: () => void
  showHeader: boolean
}

function AgentChatInner({
  className,
  contentMaxWidthClassName,
  projectRef,
  agentId,
  agents,
  conversationId,
  activeConversationId,
  initialMessages,
  conversations,
  onConversationChange,
  onRefreshConversations,
  onAgentChange,
  initialPrompt,
  initialPromptRequestId,
  onInitialPromptConsumed,
  showHeader,
}: AgentChatInnerProps) {
  const [input, setInput] = useState('')
  const [selectedAgentId, setSelectedAgentId] = useState(agentId)
  const [model, setModel] = useState<string>('gpt-5-mini')
  const previousStatusRef = useRef<string | undefined>(undefined)
  const initialPromptRef = useRef<string | undefined>(undefined)
  const { data: selectedProject } = useSelectedProjectQuery()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { logsMetadata } = useIsFeatureEnabled(['logs:metadata'])

  const { messages, sendMessage, status } = useChat({
    id: conversationId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: `/api/platform/ai-agents/${projectRef}/chat`,
      headers: async () => {
        const token = await getAccessToken()
        return token ? { Authorization: `Bearer ${token}` } : ({} as Record<string, string>)
      },
      prepareSendMessagesRequest({ messages, body }) {
        return {
          body: {
            ...(body ?? {}),
            message: messages[messages.length - 1],
          },
        }
      },
    }),
  })

  useEffect(() => {
    if (previousStatusRef.current === 'streaming' && status === 'ready') {
      onRefreshConversations()
      if (activeConversationId === null) {
        onConversationChange(conversationId)
      }
    }

    previousStatusRef.current = status
  }, [activeConversationId, conversationId, onConversationChange, onRefreshConversations, status])

  useEffect(() => {
    if (agents.length === 0) return

    setSelectedAgentId((current) => {
      if (current && agents.some((agent) => agent.id === current)) return current
      if (agents.some((agent) => agent.id === agentId)) return agentId
      return agents[0].id
    })
  }, [agentId, agents])

  const handleSendMessage = useCallback(
    (
      text: string,
      options?: {
        agentId?: string
        modelId?: string
      }
    ) => {
      const trimmed = text.trim()
      if (!trimmed) return

      sendMessage(
        { text: trimmed },
        {
          body: {
            agent_id: options?.agentId ?? selectedAgentId,
            conversation_id: conversationId,
            model: options?.modelId ?? model,
          },
        }
      )

      setInput('')
    },
    [conversationId, model, selectedAgentId, sendMessage]
  )

  useEffect(() => {
    const trimmedPrompt = initialPrompt?.trim()
    const promptKey = initialPromptRequestId ?? trimmedPrompt
    if (!trimmedPrompt || !promptKey || status !== 'ready') return
    if (initialPromptRef.current === promptKey) return

    initialPromptRef.current = promptKey
    handleSendMessage(trimmedPrompt)
    onInitialPromptConsumed?.()
  }, [handleSendMessage, initialPrompt, initialPromptRequestId, onInitialPromptConsumed, status])

  const mappedConversations = useMemo(
    () =>
      conversations.map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.created_at,
      })),
    [conversations]
  )

  const handleDatabaseSqlRun = useCallback(
    async (request: AgentChatSqlRunRequest): Promise<AgentChatSqlRunResult> => {
      try {
        const response = await executeSql({
          projectRef: request.projectRef,
          connectionString: request.source === 'sql' ? request.connectionString : null,
          sql: request.sql,
        })

        return { rows: normalizeSqlRows(response.result) }
      } catch (error) {
        return { error: getErrorMessage(error) }
      }
    },
    []
  )

  const handleLogsSqlRun = useCallback(
    async (request: AgentChatSqlRunRequest): Promise<AgentChatSqlRunResult> => {
      if (request.source !== 'logs') {
        return { error: 'Logs runner received a non-logs SQL request.' }
      }

      try {
        const { data, error } = await get('/platform/projects/{ref}/analytics/endpoints/logs.all', {
          params: {
            path: { ref: request.projectRef },
            query: {
              sql: request.sql,
              iso_timestamp_start: request.dateRange.from,
              iso_timestamp_end: request.dateRange.to,
            },
          },
        })

        if (error) {
          return { error: getErrorMessage(error) }
        }

        if (data?.error) {
          return { error: getErrorMessage(data.error) }
        }

        return { rows: normalizeLogsRows(data?.result ?? [], logsMetadata) }
      } catch (error) {
        return { error: getErrorMessage(error) }
      }
    },
    [logsMetadata]
  )

  const sqlRunners = useMemo<AgentChatSqlRunners>(
    () => ({
      database: handleDatabaseSqlRun,
      logs: handleLogsSqlRun,
    }),
    [handleDatabaseSqlRun, handleLogsSqlRun]
  )

  const renderSqlEditor = useCallback(
    ({ payload, value, onChange, onRun, disabled }: AgentChatSqlEditorRenderProps) => (
      <div className="min-h-[220px] [&_.monaco-editor]:!bg [&_.monaco-editor_.margin]:!bg [&_.monaco-editor_.monaco-editor-background]:!bg">
        <AIEditor
          autoFocus={false}
          language="pgsql"
          value={value}
          onChange={onChange}
          aiEndpoint={`${BASE_PATH}/api/ai/code/complete`}
          aiMetadata={{
            projectRef: payload.projectRef,
            connectionString:
              payload.source === 'sql'
                ? payload.connectionString
                : selectedProject?.connectionString ?? null,
            orgSlug: selectedOrganization?.slug,
          }}
          executeQuery={onRun}
          options={{
            tabSize: 2,
            fontSize: 13,
            minimap: { enabled: false },
            wordWrap: 'on',
            lineNumbers: 'on',
            folding: false,
            padding: { top: 12, bottom: 12 },
            lineNumbersMinChars: 3,
            readOnly: disabled,
          }}
        />
      </div>
    ),
    [selectedOrganization?.slug, selectedProject?.connectionString]
  )

  return (
    <AgentChatView
      className={className}
      contentMaxWidthClassName={contentMaxWidthClassName}
      emptyStateContent={
        <div className="relative min-h-full flex-1 overflow-hidden bg-background">
          <div className="absolute -inset-16 z-0 opacity-50">
            <img
              src={`${BASE_PATH}/img/reports/bg-grafana-dark.svg`}
              alt="Supabase Grafana"
              className="hidden h-full w-full object-cover object-right dark:block"
            />
            <img
              src={`${BASE_PATH}/img/reports/bg-grafana-light.svg`}
              alt="Supabase Grafana"
              className="h-full w-full object-cover object-right dark:hidden"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background-alternative to-transparent" />
          </div>
        </div>
      }
      key={`${conversationId}:${selectedAgentId}`}
      activeConversationId={activeConversationId}
      agents={agents}
      conversations={mappedConversations}
      input={input}
      messages={messages}
      models={MODELS}
      onActionPrompt={handleSendMessage}
      onAgentChange={(id) => {
        setSelectedAgentId(id)
        onAgentChange(id)
      }}
      onConversationChange={onConversationChange}
      onInputChange={setInput}
      onModelChange={setModel}
      onRefreshConversations={onRefreshConversations}
      onSubmit={({ text, agentId, modelId }) => handleSendMessage(text, { agentId, modelId })}
      onSuggestionSelect={handleSendMessage}
      renderSqlEditor={renderSqlEditor}
      sqlRunners={sqlRunners}
      placeholder="Ask an agent anything..."
      selectedAgentId={selectedAgentId}
      selectedModelId={model}
      showHeader={showHeader}
      status={status}
      suggestions={SUGGESTIONS}
    />
  )
}

function normalizeSqlRows(result: unknown): Array<Record<string, string | number | boolean | null | object>> {
  if (!Array.isArray(result)) return []
  return result.filter(
    (row): row is Record<string, string | number | boolean | null | object> =>
      typeof row === 'object' && row !== null && !Array.isArray(row)
  )
}

function normalizeLogsRows(
  result: unknown,
  includeMetadata: boolean
): Array<Record<string, string | number | boolean | null | object>> {
  if (!Array.isArray(result)) return []

  return result
    .filter(
      (row): row is Record<string, string | number | boolean | null | object> =>
        typeof row === 'object' && row !== null && !Array.isArray(row)
    )
    .map((row) => {
      if (includeMetadata) return row

      const { metadata: _metadata, ...rest } = row
      return rest
    })
}

function getErrorMessage(error: unknown) {
  if (typeof error === 'string') return error

  if (error && typeof error === 'object') {
    if ('formattedError' in error && typeof error.formattedError === 'string') {
      return error.formattedError
    }

    if ('message' in error && typeof error.message === 'string') {
      return error.message
    }
  }

  return 'An unknown error occurred'
}

export function AgentChat({
  className,
  contentMaxWidthClassName,
  projectRef,
  initialAgentId,
  initialConversationId,
  initialPrompt,
  initialPromptRequestId,
  onInitialPromptConsumed,
  onConversationChange,
  restrictToInitialAgent = false,
  showHeader = true,
}: AgentChatProps) {
  const { pendingRequest } = useAgentChatStateSnapshot()
  const hasReportedConversationRef = useRef(false)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversationId ?? null
  )
  const [tempId, setTempId] = useState(() => crypto.randomUUID())
  const [activeAgentId, setActiveAgentId] = useState<string | undefined>(initialAgentId)
  const [queuedPrompt, setQueuedPrompt] = useState<string | undefined>(initialPrompt)
  const [queuedPromptRequestId, setQueuedPromptRequestId] = useState<string | undefined>(
    initialPromptRequestId
  )

  const conversationId = activeConversationId ?? tempId

  const { data: agents = [], isLoading: isLoadingAgents } = useAgentsQuery({ projectRef })
  const availableAgents = useMemo(() => {
    if (!restrictToInitialAgent || !initialAgentId) return agents
    return agents.filter((agent) => agent.id === initialAgentId)
  }, [agents, initialAgentId, restrictToInitialAgent])
  const { data: conversations = [], refetch: refetchConversations } = useConversationsQuery({
    projectRef,
    agentId: restrictToInitialAgent ? initialAgentId : activeAgentId,
  })
  const { data: initialMessages = [], isLoading: isLoadingMessages } = useConversationMessagesQuery(
    {
      projectRef,
      conversationId: activeConversationId ?? undefined,
    }
  )

  useEffect(() => {
    if (restrictToInitialAgent) {
      setActiveAgentId(initialAgentId)
      return
    }

    setActiveAgentId((current) => initialAgentId ?? current)
  }, [initialAgentId, restrictToInitialAgent])

  useEffect(() => {
    if (initialConversationId) {
      setActiveConversationId(initialConversationId)
      return
    }

    setActiveConversationId(null)
    setTempId(crypto.randomUUID())
  }, [initialConversationId])

  useEffect(() => {
    setQueuedPrompt(initialPrompt)
    setQueuedPromptRequestId(initialPromptRequestId)
  }, [initialPrompt, initialPromptRequestId])

  useEffect(() => {
    if (!pendingRequest) return

    if (!restrictToInitialAgent && pendingRequest.agentId) {
      setActiveAgentId(pendingRequest.agentId)
    }

    if (pendingRequest.conversationId) {
      setActiveConversationId(pendingRequest.conversationId)
    } else {
      setActiveConversationId(null)
      setTempId(crypto.randomUUID())
    }

    setQueuedPrompt(pendingRequest.prompt)
    setQueuedPromptRequestId(pendingRequest.requestId)
    agentChatState.consumeRequest()
  }, [pendingRequest, restrictToInitialAgent])

  useEffect(() => {
    if (!activeAgentId && availableAgents.length > 0) {
      setActiveAgentId(availableAgents[0].id)
    }
  }, [activeAgentId, availableAgents])

  const handleConversationChange = useCallback((id: string | null) => {
    if (id === null) {
      setActiveConversationId(null)
      setTempId(crypto.randomUUID())
      return
    }

    setActiveConversationId(id)
  }, [])

  useEffect(() => {
    if (!onConversationChange) return

    if (!hasReportedConversationRef.current) {
      hasReportedConversationRef.current = true
      return
    }

    onConversationChange(activeConversationId)
  }, [activeConversationId, onConversationChange])

  const handleRefreshConversations = useCallback(() => {
    refetchConversations()
  }, [refetchConversations])

  if (isLoadingAgents || (activeConversationId && isLoadingMessages)) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2Icon className="size-5 animate-spin text-foreground-muted" />
      </div>
    )
  }

  if (availableAgents.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-sm space-y-2 text-center">
          <p className="text-sm font-medium">No agents found</p>
          <p className="text-sm text-foreground-muted">
            Create an agent on the{' '}
            <a href={`/project/${projectRef}/agents`} className="underline">
              Agents page
            </a>{' '}
            first.
          </p>
        </div>
      </div>
    )
  }

  const resolvedAgentId = activeAgentId ?? availableAgents[0].id

  return (
    <AgentChatInner
      className={className}
      contentMaxWidthClassName={contentMaxWidthClassName}
      key={`${conversationId}:${resolvedAgentId}`}
      activeConversationId={activeConversationId}
      agentId={resolvedAgentId}
      agents={availableAgents.map((agent) => ({ id: agent.id, name: agent.name }))}
      conversationId={conversationId}
      conversations={conversations}
      initialMessages={initialMessages}
      initialPrompt={queuedPrompt}
      initialPromptRequestId={queuedPromptRequestId}
      onAgentChange={setActiveAgentId}
      onConversationChange={handleConversationChange}
      onInitialPromptConsumed={() => {
        setQueuedPrompt(undefined)
        setQueuedPromptRequestId(undefined)
        onInitialPromptConsumed?.()
      }}
      onRefreshConversations={handleRefreshConversations}
      projectRef={projectRef}
      showHeader={showHeader}
    />
  )
}
