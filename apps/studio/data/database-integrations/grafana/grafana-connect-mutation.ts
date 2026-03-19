import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { getAccessToken } from 'common'
import { BASE_PATH } from 'lib/constants'
import { useTrack } from 'lib/telemetry/track'
import { toast } from 'sonner'
import type { ResponseError } from 'types'

export type GrafanaConnectVariables = {
  organizationSlug: string
  projectRef: string
}

export type GrafanaConnectResponse = {
  data: { redirectUrl: string } | null
  error: { message: string } | null
}

export async function connectGrafanaCloud({
  organizationSlug,
  projectRef,
}: GrafanaConnectVariables): Promise<GrafanaConnectResponse> {
  const accessToken = await getAccessToken()

  const response = await fetch(`${BASE_PATH}/api/integrations/grafana-cloud`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ organizationSlug, projectRef }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error?.message || 'Failed to connect to Grafana Cloud')
  }

  return result
}

type GrafanaConnectData = Awaited<ReturnType<typeof connectGrafanaCloud>>

export const useGrafanaConnectMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<GrafanaConnectData, ResponseError, GrafanaConnectVariables>,
  'mutationFn'
> = {}) => {
  const track = useTrack()

  return useMutation<GrafanaConnectData, ResponseError, GrafanaConnectVariables>({
    mutationFn: (vars) => connectGrafanaCloud(vars),
    async onSuccess(data, variables, context) {
      track('integration_install_completed', {
        integrationName: 'grafana_cloud',
      })

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to connect to Grafana Cloud: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
