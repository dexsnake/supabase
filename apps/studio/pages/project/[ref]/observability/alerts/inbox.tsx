import { AlertsInbox } from 'components/interfaces/Observability/Alerts/AlertsInbox'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ObservabilityLayout } from 'components/layouts/ObservabilityLayout/ObservabilityLayout'
import type { NextPageWithLayout } from 'types'

const AlertsInboxPage: NextPageWithLayout = () => {
  return <AlertsInbox />
}

AlertsInboxPage.getLayout = (page) => (
  <DefaultLayout>
    <ObservabilityLayout>{page}</ObservabilityLayout>
  </DefaultLayout>
)

export default AlertsInboxPage
