import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { agentKeys } from './keys'
import { requestAgentApi } from './request'

export type AgentDeleteVariables = {
  projectRef: string
  id: string
}

export async function deleteAgent({ projectRef, id }: AgentDeleteVariables) {
  return requestAgentApi<{ success: boolean }>(
    `/api/platform/ai-agents/${projectRef}/agents/${id}`,
    {
      method: 'DELETE',
    }
  )
}

export const useAgentDeleteMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAgent,
    async onSuccess(_data, variables) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: agentKeys.list(variables.projectRef) }),
        queryClient.invalidateQueries({ queryKey: agentKeys.tasks(variables.projectRef) }),
        queryClient.invalidateQueries({
          queryKey: agentKeys.agent(variables.projectRef, variables.id),
        }),
        queryClient.invalidateQueries({
          queryKey: agentKeys.agentTasks(variables.projectRef, variables.id),
        }),
        queryClient.invalidateQueries({
          queryKey: agentKeys.agentLogs(variables.projectRef, variables.id),
        }),
      ])
      toast.success('Agent deleted')
    },
    onError(err: Error) {
      toast.error(`Failed to delete agent: ${err.message}`)
    },
  })
}
