import { Settings2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { useAuthorizedAppsQuery } from 'data/oauth/authorized-apps-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'
import {
  getAuthorizedAppNames,
  getConnectedAppsTitle,
  isProjectRoute,
} from './ProjectOAuthIntegrationsBanner.utils'

const BANNER_DESCRIPTION =
  'Dashboard changes can affect connected tools in this organization.'

export const ProjectOAuthIntegrationsBanner = () => {
  const router = useRouter()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()

  const organizationSlug = selectedOrganization?.slug
  const showProjectBanner = isProjectRoute({ pathname: router.pathname, asPath: router.asPath })

  const { data: authorizedApps = [], isError } = useAuthorizedAppsQuery(
    { slug: organizationSlug },
    { enabled: showProjectBanner && !!organizationSlug }
  )

  if (!showProjectBanner || !organizationSlug || isError) return null

  if (authorizedApps.length === 0) return null

  const appNames = getAuthorizedAppNames(authorizedApps)

  return (
    <Alert_Shadcn_
      variant="default"
      className="flex items-center gap-4 border-t-0 border-x-0 rounded-none"
    >
      <div className="flex flex-1 flex-col">
        <AlertTitle_Shadcn_>{getConnectedAppsTitle(appNames)}</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>{BANNER_DESCRIPTION}</AlertDescription_Shadcn_>
      </div>
      <Button asChild type="default" icon={<Settings2 />}>
        <Link href={`/org/${organizationSlug}/apps`}>Manage</Link>
      </Button>
    </Alert_Shadcn_>
  )
}
