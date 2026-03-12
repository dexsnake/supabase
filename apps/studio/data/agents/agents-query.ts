import { useQuery } from '@tanstack/react-query'
import { fetchGet } from 'data/fetchers'
import type { UseCustomQueryOptions } from 'types'
import { agentKeys } from './keys'
import type { Agent } from './types'

export async function getAgents(
  { projectRef }: { projectRef?: string },
  signal?: AbortSignal
): Promise<Agent[]> {
  if (!projectRef) throw new Error('projectRef is required')

  const response = await fetchGet(`/api/platform/ai-agents/${projectRef}/agents`, {
    abortSignal: signal,
  })
  if (response.error) throw new Error(response.error.message)
  return response as Agent[]
}

export type AgentsData = Awaited<ReturnType<typeof getAgents>>

export const useAgentsQuery = <TData = AgentsData>(
  { projectRef }: { projectRef?: string },
  options: UseCustomQueryOptions<AgentsData, Error, TData> = {}
) =>
  useQuery<AgentsData, Error, TData>({
    queryKey: agentKeys.list(projectRef),
    queryFn: ({ signal }) => getAgents({ projectRef }, signal),
    enabled: !!projectRef,
    ...options,
  })
