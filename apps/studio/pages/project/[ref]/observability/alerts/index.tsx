import { useParams } from 'common'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ObservabilityLayout } from 'components/layouts/ObservabilityLayout/ObservabilityLayout'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import type { NextPageWithLayout } from 'types'

const AlertsIndexPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()

  useEffect(() => {
    if (!ref) return
    router.replace(`/project/${ref}/observability/alerts/inbox`)
  }, [ref, router])

  return null
}

AlertsIndexPage.getLayout = (page) => (
  <DefaultLayout>
    <ObservabilityLayout>{page}</ObservabilityLayout>
  </DefaultLayout>
)

export default AlertsIndexPage
