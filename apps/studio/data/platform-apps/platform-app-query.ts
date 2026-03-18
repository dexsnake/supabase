import { useQuery } from '@tanstack/react-query'

import type { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { platformAppKeys } from './keys'

export type PlatformAppVariables = {
  slug?: string
  id?: string
}

export type PlatformAppDetail = components['schemas']['CreatePlatformAppResponse']

export async function getPlatformApp({ slug, id }: PlatformAppVariables, signal?: AbortSignal) {
  if (!slug) throw new Error('slug is required')
  if (!id) throw new Error('id is required')

  const { data, error } = await get('/platform/organizations/{slug}/apps/{id}', {
    params: { path: { slug, app_id: id } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type PlatformAppData = Awaited<ReturnType<typeof getPlatformApp>>
export type PlatformAppError = ResponseError

export const usePlatformAppQuery = <TData = PlatformAppData>(
  { slug, id }: PlatformAppVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<PlatformAppData, PlatformAppError, TData> = {}
) =>
  useQuery<PlatformAppData, PlatformAppError, TData>({
    queryKey: platformAppKeys.detail(slug, id),
    queryFn: ({ signal }) => getPlatformApp({ slug, id }, signal),
    enabled: enabled && typeof slug !== 'undefined' && typeof id !== 'undefined',
    ...options,
  })
