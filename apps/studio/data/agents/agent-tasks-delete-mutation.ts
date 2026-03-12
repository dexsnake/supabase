import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { agentKeys } from './keys'
import { requestAgentApi } from './request'

export type AgentTaskDeleteVariables = {
  projectRef: string
  id: string
  agent_id: string
}

export async function deleteAgentTask({ projectRef, id }: AgentTaskDeleteVariables) {
  return requestAgentApi<{ success: boolean }>(
    `/api/platform/ai-agents/${projectRef}/agent-tasks/${id}`,
    {
      method: 'DELETE',
    }
  )
}

export const useAgentTaskDeleteMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAgentTask,
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
      toast.success('Task deleted')
    },
    onError(err: Error) {
      toast.error(`Failed to delete task: ${err.message}`)
    },
  })
}
