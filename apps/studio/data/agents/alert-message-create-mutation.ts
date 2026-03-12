import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { agentKeys } from './keys'
import { requestAgentApi } from './request'
import type { AlertMessage } from './types'

export type AlertMessageCreateVariables = {
  projectRef: string
  alertId: string
  id: string
  content: string
}

export async function createAlertMessage({
  projectRef,
  alertId,
  ...body
}: AlertMessageCreateVariables): Promise<AlertMessage> {
  return requestAgentApi(`/api/platform/ai-agents/${projectRef}/alerts/${alertId}/messages`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export const useAlertMessageCreateMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAlertMessage,
    async onSuccess(_data, variables) {
      await queryClient.invalidateQueries({
        queryKey: agentKeys.alertMessages(variables.projectRef, variables.alertId),
      })
      toast.success('Comment added')
    },
    onError(err: Error) {
      toast.error(`Failed to add comment: ${err.message}`)
    },
  })
}
