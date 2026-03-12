import { AgentLogsList } from 'components/interfaces/Observability/Agents/AgentLogsList'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { AgentDetailsLayout } from 'components/layouts/ObservabilityLayout/AgentDetailsLayout'
import { ObservabilityLayout } from 'components/layouts/ObservabilityLayout/ObservabilityLayout'
import type { NextPageWithLayout } from 'types'

const AgentLogsPage: NextPageWithLayout = () => {
  return <AgentLogsList />
}

AgentLogsPage.getLayout = (page) => (
  <DefaultLayout>
    <ObservabilityLayout>
      <AgentDetailsLayout>{page}</AgentDetailsLayout>
    </ObservabilityLayout>
  </DefaultLayout>
)

export default AgentLogsPage
