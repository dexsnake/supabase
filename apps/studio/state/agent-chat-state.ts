import { proxy, snapshot, useSnapshot } from 'valtio'

export type PendingAgentChatRequest = {
  requestId: string
  prompt?: string
  agentId?: string
  conversationId?: string | null
}

type AgentChatState = {
  pendingRequest?: PendingAgentChatRequest
  queueRequest: (request: Omit<PendingAgentChatRequest, 'requestId'>) => string
  consumeRequest: () => PendingAgentChatRequest | undefined
  clearRequest: () => void
}

const createAgentChatState = (): AgentChatState =>
  proxy({
    pendingRequest: undefined,

    queueRequest(request) {
      const requestId = crypto.randomUUID()
      agentChatState.pendingRequest = { ...request, requestId }
      return requestId
    },

    consumeRequest() {
      const request = agentChatState.pendingRequest
      agentChatState.pendingRequest = undefined
      return request
    },

    clearRequest() {
      agentChatState.pendingRequest = undefined
    },
  })

export const agentChatState = createAgentChatState()

export const getAgentChatStateSnapshot = () => snapshot(agentChatState)

export const useAgentChatStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(agentChatState, options)
