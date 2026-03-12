import { AgentTasksList } from 'components/interfaces/Observability/Agents/AgentTasksList'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { AgentDetailsLayout } from 'components/layouts/ObservabilityLayout/AgentDetailsLayout'
import { ObservabilityLayout } from 'components/layouts/ObservabilityLayout/ObservabilityLayout'
import type { NextPageWithLayout } from 'types'

const AgentTasksPage: NextPageWithLayout = () => {
  return <AgentTasksList />
}

AgentTasksPage.getLayout = (page) => (
  <DefaultLayout>
    <ObservabilityLayout>
      <AgentDetailsLayout>{page}</AgentDetailsLayout>
    </ObservabilityLayout>
  </DefaultLayout>
)

export default AgentTasksPage
