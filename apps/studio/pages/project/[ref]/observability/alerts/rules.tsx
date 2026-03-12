import { RulesList } from 'components/interfaces/Observability/Alerts/RulesList'
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

const AlertsRulesPage: NextPageWithLayout = () => {
  return (
    <div className="w-full">
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Rules</PageHeaderTitle>
            <PageHeaderDescription>
              Create and manage the scheduled checks that open alert threads.
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <RulesList />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </div>
  )
}

AlertsRulesPage.getLayout = (page) => (
  <DefaultLayout>
    <ObservabilityLayout>{page}</ObservabilityLayout>
  </DefaultLayout>
)

export default AlertsRulesPage
