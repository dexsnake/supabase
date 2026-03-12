import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { agentKeys } from './keys'
import { requestAgentApi } from './request'
import type { AgentTask } from './types'

export type AgentTaskUpdateVariables = {
  projectRef: string
  id: string
  agent_id: string
  name: string
  description: string
  schedule: string
  is_unique: boolean
  enabled: boolean
}

export async function updateAgentTask({
  projectRef,
  id,
  ...body
}: AgentTaskUpdateVariables): Promise<AgentTask> {
  return requestAgentApi(`/api/platform/ai-agents/${projectRef}/agent-tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export const useAgentTaskUpdateMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateAgentTask,
    async onSuccess(_data, variables) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: agentKeys.tasks(variables.projectRef) }),
        queryClient.invalidateQueries({
          queryKey: agentKeys.agentTasks(variables.projectRef, variables.agent_id),
        }),
        queryClient.invalidateQueries({
          queryKey: agentKeys.agent(variables.projectRef, variables.agent_id),
        }),
        queryClient.invalidateQueries({
          queryKey: agentKeys.agentLogs(variables.projectRef, variables.agent_id),
        }),
      ])
      toast.success('Task updated')
    },
    onError(err: Error) {
      toast.error(`Failed to update task: ${err.message}`)
    },
  })
}
