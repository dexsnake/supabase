import { AgentOverview } from 'components/interfaces/Observability/Agents/AgentOverview'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { AgentDetailsLayout } from 'components/layouts/ObservabilityLayout/AgentDetailsLayout'
import { ObservabilityLayout } from 'components/layouts/ObservabilityLayout/ObservabilityLayout'
import type { NextPageWithLayout } from 'types'

const AgentOverviewPage: NextPageWithLayout = () => {
  return <AgentOverview />
}

AgentOverviewPage.getLayout = (page) => (
  <DefaultLayout>
    <ObservabilityLayout>
      <AgentDetailsLayout>{page}</AgentDetailsLayout>
    </ObservabilityLayout>
  </DefaultLayout>
)

export default AgentOverviewPage
