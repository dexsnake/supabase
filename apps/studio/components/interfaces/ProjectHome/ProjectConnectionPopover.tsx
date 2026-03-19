import { PermissionAction } from '@supabase/shared-types/out/constants'
import { getConnectionStrings } from 'components/interfaces/Connect/DatabaseSettings.utils'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { pluckObjectFields } from 'lib/helpers'
import { ChevronDown, Database, KeyRound, Link2, Terminal } from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useMemo, useState } from 'react'
import {
  Button,
  cn,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns'

import { useProjectApiUrl } from '@/data/config/project-endpoint-query'

const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user'] as const
const EMPTY_CONNECTION_INFO = {
  db_user: '',
  db_host: '',
  db_port: '',
  db_name: '',
}

interface ProjectConnectionPopoverProps {
  projectRef?: string
}

export const ProjectConnectionPopover = ({ projectRef }: ProjectConnectionPopoverProps) => {
  const [open, setOpen] = useState(false)
  const [, setShowConnect] = useQueryState('showConnect', parseAsBoolean.withDefault(false))

  const { isLoading: isLoadingPermissions, can: canReadAPIKeys } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'service_api_keys'
  )

  const { data: projectUrl, isPending: isLoadingApiUrl } = useProjectApiUrl({ projectRef })

  const { data: apiKeys, isLoading: isLoadingKeys } = useAPIKeysQuery(
    { projectRef },
    { enabled: open && canReadAPIKeys }
  )
  const { publishableKey } = canReadAPIKeys ? getKeys(apiKeys) : { publishableKey: null }

  const { data: databases, isLoading: isLoadingDatabases } = useReadReplicasQuery(
    { projectRef },
    { enabled: open && !!projectRef }
  )
  const primaryDatabase = databases?.find((db) => db.identifier === projectRef)

  const directConnectionString = useMemo(() => {
    if (
      !primaryDatabase?.db_host ||
      !primaryDatabase?.db_name ||
      !primaryDatabase?.db_user ||
      !primaryDatabase?.db_port
    ) {
      return ''
    }
    const connectionInfo = pluckObjectFields(primaryDatabase, [...DB_FIELDS])
    return getConnectionStrings({
      connectionInfo: { ...EMPTY_CONNECTION_INFO, ...connectionInfo },
      metadata: { projectRef },
    }).direct.uri
  }, [primaryDatabase, projectRef])

  const cliCommands = useMemo(
    () =>
      [
        'supabase login',
        'supabase init',
        `supabase link --project-ref ${projectRef ?? 'PROJECT_REF_UNAVAILABLE'}`,
      ].join('\n'),
    [projectRef]
  )

  const menuItems = useMemo(
    () => [
      {
        label: 'Project URL',
        value: projectUrl ?? '',
        disabled: isLoadingApiUrl || !projectUrl,
        icon: Link2,
      },
      {
        label: 'Publishable key',
        value: publishableKey?.api_key ?? '',
        disabled:
          isLoadingPermissions || isLoadingKeys || !canReadAPIKeys || !publishableKey?.api_key,
        icon: KeyRound,
      },
      {
        label: 'Direct connection string',
        value: directConnectionString,
        disabled: isLoadingDatabases || !directConnectionString,
        icon: Database,
      },
      {
        label: 'CLI setup commands',
        value: cliCommands,
        disabled: !projectRef,
        icon: Terminal,
      },
    ],
    [
      canReadAPIKeys,
      cliCommands,
      directConnectionString,
      isLoadingApiUrl,
      isLoadingDatabases,
      isLoadingKeys,
      isLoadingPermissions,
      projectRef,
      projectUrl,
      publishableKey?.api_key,
    ]
  )

  return (
    <div className="mt-3 inline-flex max-w-full items-center gap-3 min-w-0">
      {isLoadingApiUrl ? (
        <ShimmeringLoader className="w-32 shrink-0" />
      ) : (
        <span className="min-w-0 max-w-[320px] truncate text-left text-foreground-light">
          {projectUrl ?? 'Project URL unavailable'}
        </span>
      )}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="default"
            size="tiny"
            className="shrink-0"
            iconRight={
              <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
            }
          >
            Copy
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end" className="w-64 p-1">
          {menuItems.map((item) => {
            const Icon = item.icon

            return (
              <DropdownMenuItem
                key={item.label}
                className="gap-2"
                disabled={item.disabled}
                onClick={() => {
                  copyToClipboard(item.value)
                  setOpen(false)
                }}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </DropdownMenuItem>
            )
          })}
          <DropdownMenuSeparator />
          <div className="p-1">
            <Button
              type="default"
              size="tiny"
              className="w-full"
              onClick={() => {
                setOpen(false)
                setShowConnect(true)
              }}
            >
              Connect
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
