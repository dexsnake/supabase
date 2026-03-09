import type { AuthorizedAppsData } from 'data/oauth/authorized-apps-query'

const PROJECT_ROUTE_PREFIX = '/project/'
const PROJECT_ROUTE_TEMPLATE = '/project/[ref]'
const MAX_APPS_IN_TITLE = 2

const sanitizeAppName = (name: string) => name.trim().replace(/\s+/g, ' ')

export const isProjectRoute = ({
  pathname,
  asPath,
}: {
  pathname?: string
  asPath?: string
}) => Boolean(pathname?.startsWith(PROJECT_ROUTE_TEMPLATE) || asPath?.startsWith(PROJECT_ROUTE_PREFIX))

export const getAuthorizedAppNames = (authorizedApps: AuthorizedAppsData = []) => {
  const uniqueNames = new Map<string, string>()

  authorizedApps.forEach((app) => {
    const safeName = sanitizeAppName(app.name)
    if (!safeName) return

    const normalizedName = safeName.toLowerCase()
    if (!uniqueNames.has(normalizedName)) {
      uniqueNames.set(normalizedName, safeName)
    }
  })

  return Array.from(uniqueNames.values())
}

export const getConnectedAppsTitle = (appNames: string[]) => {
  if (appNames.length === 0) return 'Connected to external apps'
  if (appNames.length === 1) return `Connected to ${appNames[0]}`
  if (appNames.length === 2) return `Connected to ${appNames[0]} and ${appNames[1]}`

  const [firstName, secondName] = appNames
  const additionalApps = appNames.length - MAX_APPS_IN_TITLE
  const suffix = additionalApps === 1 ? 'other' : 'others'

  return `Connected to ${firstName}, ${secondName}, and ${additionalApps} ${suffix}`
}
