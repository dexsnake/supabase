import { ObservabilityAgentsPage } from 'components/interfaces/Observability/Agents/AgentsPage'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ObservabilityLayout } from 'components/layouts/ObservabilityLayout/ObservabilityLayout'
import type { NextPageWithLayout } from 'types'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

const AgentsPage: NextPageWithLayout = () => {
  return (
    <div className="w-full">
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Agents</PageHeaderTitle>
            <PageHeaderDescription>
              Create and manage monitoring agents, then drill into tasks and message history.
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <ObservabilityAgentsPage />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </div>
  )
}

AgentsPage.getLayout = (page) => (
  <DefaultLayout>
    <ObservabilityLayout>{page}</ObservabilityLayout>
  </DefaultLayout>
)

export default AgentsPage
