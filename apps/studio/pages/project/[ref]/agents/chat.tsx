import { useParams } from 'common'
import { AgentChat } from 'components/interfaces/AgentChat/AgentChat'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { useRouter } from 'next/router'
import type { NextPageWithLayout } from 'types'

const getQueryValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

const AgentChatPage: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const router = useRouter()

  if (!projectRef) return null

  const agentId = getQueryValue(router.query.agentId)
  const conversationId = getQueryValue(router.query.conversationId)
  const prompt = getQueryValue(router.query.prompt)

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center border-b px-6">
        <h1 className="text-sm font-medium">Agent Chat</h1>
        <span className="ml-2 rounded bg-surface-300 px-1.5 py-0.5 text-xs text-foreground-muted">
          demo
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <AgentChat
          projectRef={projectRef}
          initialAgentId={agentId}
          initialConversationId={conversationId}
          initialPrompt={prompt}
          onInitialPromptConsumed={() => {
            if (!prompt) return

            const nextQuery = { ...router.query }
            delete nextQuery.prompt

            void router.replace(
              {
                pathname: router.pathname,
                query: nextQuery,
              },
              undefined,
              { shallow: true }
            )
          }}
        />
      </div>
    </div>
  )
}

AgentChatPage.getLayout = (page: React.ReactElement) => <DefaultLayout>{page}</DefaultLayout>

export default AgentChatPage
