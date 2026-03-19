import { LOCAL_STORAGE_KEYS } from 'common'
import { useParams } from 'common/hooks'
import { useGrafanaConnectMutation } from 'data/database-integrations/grafana/grafana-connect-mutation'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { Grafana } from 'icons'
import { useTrack } from 'lib/telemetry/track'
import { Badge, Button } from 'ui'

import { BannerCard } from '../BannerCard'
import { useBannerStack } from '../BannerStackProvider'

export const BannerGrafana = () => {
  const { ref } = useParams()
  const track = useTrack()
  const { data: org } = useSelectedOrganizationQuery()
  const { dismissBanner } = useBannerStack()
  const [, setIsDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.GRAFANA_BANNER_DISMISSED(ref ?? ''),
    false
  )

  const { mutate: connectGrafana, isPending } = useGrafanaConnectMutation({
    onSuccess(data) {
      if (data.data?.redirectUrl) {
        window.open(data.data.redirectUrl, '_blank')
      }
    },
  })

  const handleConnect = () => {
    track('grafana_banner_cta_button_clicked')
    connectGrafana({
      organizationSlug: org?.slug ?? '',
      projectRef: ref ?? '',
    })
  }

  return (
    <BannerCard
      onDismiss={() => {
        setIsDismissed(true)
        dismissBanner('grafana-banner')
        track('grafana_banner_dismiss_button_clicked')
      }}
    >
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-col gap-y-2 items-start">
          <Badge variant="default" className="-ml-0.5 uppercase inline-flex items-center mb-2">
            New
          </Badge>
          <div className="flex items-center gap-2">
            <Grafana height={40} width={40} className="text-[#ff671d]" />
          </div>
        </div>
        <div className="flex flex-col gap-y-1 mb-2">
          <p className="text-sm font-medium">Export Metrics to Grafana Cloud</p>
          <p className="text-xs text-foreground-lighter text-balance">
            Visualize over 200 database performance and health metrics directly in your Grafana
            Cloud dashboards.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="default"
            size="tiny"
            loading={isPending}
            onClick={handleConnect}
            className="bg-[#F46800] border-[#F46800] text-white hover:bg-[#E05F00] hover:border-[#E05F00]"
          >
            Connect to Grafana Cloud
          </Button>
        </div>
      </div>
    </BannerCard>
  )
}
