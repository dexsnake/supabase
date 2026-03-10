import { useQuery } from '@tanstack/react-query'
import { constructHeaders, fetchHandler } from 'data/fetchers'
import { BASE_PATH } from 'lib/constants'
import type { ResponseError, UseCustomQueryOptions } from 'types'

import { edgeFunctionsKeys } from './keys'
import { FileData } from '@/components/ui/FileExplorerAndEditor/FileExplorerAndEditor.types'

type EdgeFunctionBodyVariables = {
  projectRef?: string
  slug?: string
}

export async function getEdgeFunctionBody(
  { projectRef, slug }: EdgeFunctionBodyVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!slug) throw new Error('slug is required')

  const headers = await constructHeaders()
  const response = await fetchHandler(
    `${BASE_PATH}/api/edge-functions/body?ref=${projectRef}&slug=${slug}`,
    {
      method: 'GET',
      headers: Object.fromEntries(headers.entries()),
      signal,
    }
  )

  if (!response.ok) {
    const errorBody = await response.json()
    throw new Error(
      errorBody?.error?.message || `Failed to fetch function body: ${response.status}`
    )
  }

  const result = await response.json()

  return {
    metadata: result.metadata ?? {},
    files: result.files as Omit<FileData, 'id' | 'selected' | 'state'>[],
  }
}

export type EdgeFunctionBodyData = Awaited<ReturnType<typeof getEdgeFunctionBody>>
export type EdgeFunctionBodyError = ResponseError

export const useEdgeFunctionBodyQuery = <TData = EdgeFunctionBodyData>(
  { projectRef, slug }: EdgeFunctionBodyVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<EdgeFunctionBodyData, EdgeFunctionBodyError, TData> = {}
) =>
  useQuery<EdgeFunctionBodyData, EdgeFunctionBodyError, TData>({
    queryKey: edgeFunctionsKeys.body(projectRef, slug),
    queryFn: ({ signal }) => getEdgeFunctionBody({ projectRef, slug }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof slug !== 'undefined',
    ...options,
  })
