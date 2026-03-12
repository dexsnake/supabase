'use client'

import type { UIMessage } from 'ai'
import {
  BotIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  Loader2Icon,
  PlusIcon,
  SendIcon,
} from 'lucide-react'
import type { ComponentProps, HTMLAttributes } from 'react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import {
  AiIconAnimation,
  Avatar,
  AvatarFallback,
  Button_Shadcn_ as Button,
  cn,
  Command_Shadcn_ as Command,
  CommandEmpty_Shadcn_ as CommandEmpty,
  CommandGroup_Shadcn_ as CommandGroup,
  CommandInput_Shadcn_ as CommandInput,
  CommandItem_Shadcn_ as CommandItem,
  CommandList_Shadcn_ as CommandList,
  CommandSeparator_Shadcn_ as CommandSeparator,
  Popover_Shadcn_ as Popover,
  PopoverContent_Shadcn_ as PopoverContent,
  PopoverTrigger_Shadcn_ as PopoverTrigger,
  TextArea_Shadcn_ as TextArea,
} from 'ui'
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom'

import { ToolChart, ToolRow, ToolSql } from './parts'
import type { AgentChatChart, AgentChatProps, AgentChatRowItem, AgentChatSql } from './types'

const DEFAULT_EMPTY_STATE = {
  title: 'No messages yet',
  description: 'Send a message to start chatting',
}

type RowToolPayload = {
  rows: AgentChatRowItem[]
}

type MessagePartWithPayload = UIMessage['parts'][number] & {
  input?: unknown
  output?: unknown
}

type ChatMessageWithTimestamp = UIMessage & {
  createdAt?: Date
}

const Conversation = ({ className, ...props }: ComponentProps<typeof StickToBottom>) => (
  <StickToBottom
    className={cn('relative flex-1 overflow-y-hidden', className)}
    initial="smooth"
    resize="smooth"
    role="log"
    {...props}
  />
)

const ConversationContent = ({
  className,
  ...props
}: ComponentProps<typeof StickToBottom.Content>) => (
  <StickToBottom.Content className={cn('flex flex-col gap-6 p-4', className)} {...props} />
)

const ConversationScrollButton = () => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext()

  if (isAtBottom) return null

  return (
    <Button
      className="absolute bottom-4 left-1/2 h-9 w-9 -translate-x-1/2 rounded-full"
      onClick={() => scrollToBottom()}
      size="icon"
      type="button"
      variant="outline"
    >
      <ChevronsUpDownIcon className="size-4 rotate-180" />
    </Button>
  )
}

const formatMessageTimestamp = (value?: Date) => {
  if (!value) return null

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(value)
}

const Message = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('group flex w-full flex-col items-start', className)} {...props} />
)

const MessageContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'min-w-0 max-w-[80%] overflow-hidden text-sm',
      'group-[.is-user]:rounded-2xl group-[.is-user]:bg-surface-100 group-[.is-user]:px-3 group-[.is-user]:py-2',
      className
    )}
    {...props}
  />
)

type StreamdownComponent = (props: { children: string; className?: string }) => JSX.Element

const StreamdownMessage = ({ children, className }: { children: string; className?: string }) => {
  const [Renderer, setRenderer] = useState<StreamdownComponent | null>(null)

  useEffect(() => {
    let active = true

    void import('streamdown').then((module) => {
      if (!active) return

      setRenderer(() => module.Streamdown as StreamdownComponent)
    })

    return () => {
      active = false
    }
  }, [])

  if (!Renderer) {
    return <div className={cn('whitespace-pre-wrap', className)}>{children}</div>
  }

  return <Renderer className={className}>{children}</Renderer>
}

const MessageResponse = memo(
  ({ children, className }: { children: string; className?: string }) => (
    <StreamdownMessage
      className={cn(
        'size-full whitespace-pre-wrap leading-normal text-foreground-light group-hover:text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
        '[&>pre]:rounded-lg [&>pre]:border [&>pre]:bg [&>pre]:p-4 [&>pre]:text-foreground-light',
        className
      )}
    >
      {children}
    </StreamdownMessage>
  )
)

MessageResponse.displayName = 'MessageResponse'

export const AgentChat = ({
  className,
  showHeader = true,
  contentMaxWidthClassName,
  emptyStateContent,
  messages,
  status = 'ready',
  input,
  onInputChange,
  onSubmit,
  placeholder = 'Ask anything...',
  disabled = false,
  suggestions = [],
  onSuggestionSelect,
  conversations,
  activeConversationId,
  onConversationChange,
  onRefreshConversations,
  agents = [],
  selectedAgentId,
  onAgentChange,
  models = [],
  selectedModelId,
  onModelChange,
  emptyState = DEFAULT_EMPTY_STATE,
  renderMessagePart,
  onActionPrompt,
  sqlRunners,
  renderSqlEditor,
}: AgentChatProps) => {
  const [conversationOpen, setConversationOpen] = useState(false)
  const [agentOpen, setAgentOpen] = useState(false)
  const [modelOpen, setModelOpen] = useState(false)

  const isStreaming = status === 'submitted' || status === 'streaming'
  const hasMessages = messages.length > 0

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId
  )
  const conversationLabel = activeConversationId
    ? selectedConversation?.title ?? 'Untitled'
    : 'New conversation'

  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId)
  const selectedModel = models.find((model) => model.id === selectedModelId)
  const groupedModels = useMemo(() => {
    const groups = new Map<string, typeof models>()

    models.forEach((model) => {
      const groupName = model.group ?? model.provider ?? 'Models'
      const group = groups.get(groupName) ?? []
      group.push(model)
      groups.set(groupName, group)
    })

    return Array.from(groups.entries())
  }, [models])

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || disabled || isStreaming) return

    onSubmit({
      text: trimmed,
      agentId: selectedAgentId,
      conversationId: activeConversationId,
      modelId: selectedModelId,
    })
  }, [
    activeConversationId,
    disabled,
    input,
    isStreaming,
    onSubmit,
    selectedAgentId,
    selectedModelId,
  ])

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      onSuggestionSelect?.(suggestion)
    },
    [onSuggestionSelect]
  )

  const renderBuiltInPart = useCallback(
    (
      part: UIMessage['parts'][number],
      message: UIMessage,
      messageIndex: number,
      partIndex: number
    ) => {
      if (part.type === 'text') {
        return <MessageResponse key={`${message.id}-${partIndex}`}>{part.text}</MessageResponse>
      }

      const payloadPart = part as MessagePartWithPayload

      if (payloadPart.type === 'tool-renderRow') {
        const payload = (payloadPart.input ?? payloadPart.output) as RowToolPayload | undefined
        if (!payload?.rows?.length) return null

        return (
          <ToolRow
            key={`${message.id}-${partIndex}`}
            rows={payload.rows}
            onActionSelect={onActionPrompt}
          />
        )
      }

      if (payloadPart.type === 'tool-renderChart') {
        const payload = (payloadPart.output ?? payloadPart.input) as AgentChatChart | undefined
        if (!payload) return null

        return <ToolChart key={`${message.id}-${partIndex}`} {...payload} />
      }

      if (payloadPart.type === 'tool-renderSql') {
        const payload = (payloadPart.output ?? payloadPart.input) as AgentChatSql | undefined
        if (!payload) return null

        return (
          <ToolSql
            key={`${message.id}-${partIndex}`}
            renderEditor={renderSqlEditor}
            sqlRunners={sqlRunners}
            sql={payload}
          />
        )
      }

      return renderMessagePart?.(part, { message, messageIndex, partIndex }) ?? null
    },
    [onActionPrompt, renderMessagePart, renderSqlEditor, sqlRunners]
  )

  return (
    <div className={cn('flex h-full min-h-0 flex-col overflow-hidden', className)}>
      {showHeader ? (
        <div className="flex h-10 shrink-0 items-center justify-between border-b px-3">
          <div className="flex items-center gap-1">
            <Popover
              open={conversationOpen}
              onOpenChange={(open) => {
                setConversationOpen(open)
                if (open) onRefreshConversations?.()
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  aria-label="Select conversation"
                  className="h-7 justify-between gap-2 px-2 font-normal"
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <span className="max-w-[220px] truncate font-mono text-xs font-medium uppercase text-foreground-light">
                    {conversationLabel}
                  </span>
                  <ChevronsUpDownIcon className="size-3.5 shrink-0 text-foreground-light" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[280px] p-0">
                <Command>
                  <CommandInput placeholder="Search conversations..." />
                  <CommandList>
                    <CommandEmpty>No conversations found.</CommandEmpty>
                    <CommandGroup heading="Recent">
                      {conversations.map((conversation) => (
                        <CommandItem
                          key={conversation.id}
                          value={`${conversation.title ?? ''} ${conversation.id}`}
                          onSelect={() => {
                            onConversationChange(conversation.id)
                            setConversationOpen(false)
                          }}
                        >
                          <span className="truncate">{conversation.title ?? 'Untitled'}</span>
                          {activeConversationId === conversation.id ? (
                            <CheckIcon className="ml-auto size-4" />
                          ) : null}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button
              aria-label="Start new conversation"
              className="h-7 w-7 rounded-md p-0"
              onClick={() => onConversationChange(null)}
              size="sm"
              type="button"
              variant="ghost"
            >
              <PlusIcon className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <Conversation className="min-h-0 flex-1">
        <ConversationContent className={cn(!hasMessages && Boolean(emptyStateContent) && 'p-0')}>
          {!hasMessages && emptyStateContent ? (
            <div className="relative flex flex-1">{emptyStateContent}</div>
          ) : (
          <div className={cn('mx-auto w-full', contentMaxWidthClassName)}>
            {!hasMessages ? (
                <div className="flex flex-1 items-center justify-center py-32">
                  <div className="max-w-sm space-y-2 text-center">
                    <p className="text-sm font-medium">{emptyState.title}</p>
                    {emptyState.description ? (
                      <p className="text-sm text-foreground-light">{emptyState.description}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}

            {messages.map((message, messageIndex) => {
              const isUser = message.role === 'user'
              const authorName = isUser ? 'You' : selectedAgent?.name ?? 'Assistant'
              const timestamp = formatMessageTimestamp(
                (message as ChatMessageWithTimestamp).createdAt
              )

              return (
                <Message
                  key={message.id}
                  className={cn(
                    isUser && 'is-user',
                    message.role === 'assistant' && 'is-assistant',
                    messageIndex > 0 && 'mt-8'
                  )}
                >
                  <div className="mb-4 flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback
                        className={cn(
                          isUser
                            ? 'bg-surface-75 text-foreground'
                            : 'border-brand bg-brand-300 text-foreground',
                          'text-xs font-mono'
                        )}
                      >
                        {isUser ? 'U' : <AiIconAnimation size={12} />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-foreground heading-default">{authorName}</div>
                    {timestamp ? (
                      <div className="text-sm text-foreground-lighter">{timestamp}</div>
                    ) : null}
                  </div>

                  <MessageContent className="w-full space-y-4">
                    {message.parts.map((part, partIndex) =>
                      renderBuiltInPart(part, message, messageIndex, partIndex)
                    )}
                    </MessageContent>
                  </Message>
                )
              })}

              {isStreaming && messages[messages.length - 1]?.role !== 'assistant' ? (
                <div className="flex gap-3 py-3">
                  <div className="rounded-lg bg-muted px-4 py-3">
                    <Loader2Icon className="size-4 animate-spin text-foreground-light" />
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {!hasMessages && suggestions.length > 0 ? (
        <div className={cn('mx-auto w-full shrink-0 px-4 pt-4', contentMaxWidthClassName)}>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                className="rounded-full border px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent"
                onClick={() => handleSuggestionClick(suggestion)}
                type="button"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className={cn('mx-auto w-full shrink-0 px-4 py-4', contentMaxWidthClassName)}>
        <div className="rounded-2xl border bg-background px-3 py-3">
          <TextArea
            className="min-h-[88px] resize-none border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
            disabled={disabled}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                handleSubmit()
              }
            }}
            placeholder={placeholder}
            value={input}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {agents.length > 1 && selectedAgentId && onAgentChange ? (
                <Popover open={agentOpen} onOpenChange={setAgentOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      className="h-8 gap-2 rounded-full px-3"
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <BotIcon className="size-4" />
                      <span className="max-w-[120px] truncate">
                        {selectedAgent?.name ?? 'Select agent'}
                      </span>
                      <ChevronsUpDownIcon className="size-3.5 shrink-0 text-foreground-light" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[240px] p-0">
                    <Command>
                      <CommandInput placeholder="Search agents..." />
                      <CommandList>
                        <CommandEmpty>No agents found.</CommandEmpty>
                        <CommandGroup heading="Agents">
                          {agents.map((agent) => (
                            <CommandItem
                              key={agent.id}
                              value={`${agent.name} ${agent.id}`}
                              onSelect={() => {
                                onAgentChange(agent.id)
                                setAgentOpen(false)
                              }}
                            >
                              <span className="truncate">{agent.name}</span>
                              {selectedAgentId === agent.id ? (
                                <CheckIcon className="ml-auto size-4" />
                              ) : null}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : null}

              {models.length > 0 && selectedModelId && onModelChange ? (
                <Popover open={modelOpen} onOpenChange={setModelOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      className="h-8 gap-2 rounded-full px-3"
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <span className="max-w-[140px] truncate">
                        {selectedModel?.name ?? 'Select model'}
                      </span>
                      <ChevronsUpDownIcon className="size-3.5 shrink-0 text-foreground-light" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[260px] p-0">
                    <Command>
                      <CommandInput placeholder="Search models..." />
                      <CommandList>
                        <CommandEmpty>No models found.</CommandEmpty>
                        {groupedModels.map(([groupName, groupModels], index) => (
                          <div key={groupName}>
                            {index > 0 ? <CommandSeparator /> : null}
                            <CommandGroup heading={groupName}>
                              {groupModels.map((model) => (
                                <CommandItem
                                  key={model.id}
                                  value={`${model.name} ${model.id}`}
                                  onSelect={() => {
                                    onModelChange(model.id)
                                    setModelOpen(false)
                                  }}
                                >
                                  <span className="truncate">{model.name}</span>
                                  {selectedModelId === model.id ? (
                                    <CheckIcon className="ml-auto size-4" />
                                  ) : null}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </div>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : null}
            </div>

            <Button
              className="h-9 w-9 rounded-full"
              disabled={disabled || !input.trim() || isStreaming}
              onClick={handleSubmit}
              size="icon"
              type="button"
            >
              {isStreaming ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <SendIcon className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
