import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Label } from '@ui/components/shadcn/ui/label'
import { getConnectionStrings } from 'components/interfaces/Connect/DatabaseSettings.utils'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { pluckObjectFields } from 'lib/helpers'
import { ChevronDown } from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useMemo, useState, type ReactNode } from 'react'
import {
  Button,
  PopoverContent_Shadcn_ as PopoverContent,
  PopoverTrigger_Shadcn_ as PopoverTrigger,
  Popover_Shadcn_ as Popover,
  cn,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'

import { useProjectApiUrl } from '@/data/config/project-endpoint-query'

const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user'] as const
const EMPTY_CONNECTION_INFO = {
  db_user: '',
  db_host: '',
  db_port: '',
  db_name: '',
}

const DetailRow = ({ label, children }: { label: string; children: ReactNode }) => {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
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

  return (
    <div className="mt-3 inline-flex max-w-full items-center gap-2 min-w-0">
      {isLoadingApiUrl ? (
        <ShimmeringLoader className="w-32 shrink-0" />
      ) : (
        <span className="min-w-0 max-w-[320px] truncate text-left text-sm text-foreground-light">
          {projectUrl ?? 'Project URL unavailable'}
        </span>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="default"
            size="tiny"
            className="shrink-0 gap-1 px-2.5"
            iconRight={
              <ChevronDown
                size={14}
                className={cn('transition-transform', open && 'rotate-180')}
              />
            }
          >
            Connect
          </Button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="end" className="w-[420px] p-0">
          <div className="p-4 border-b space-y-4">
            <h3 className="heading-meta text-foreground-light">Data API</h3>
            <DetailRow label="Project URL">
              <Input
                copy
                readOnly
                className="font-mono text-xs"
                value={projectUrl ?? ''}
                placeholder="Project URL unavailable"
              />
            </DetailRow>
            <DetailRow label="Publishable Key">
              {isLoadingPermissions || isLoadingKeys ? (
                <div className="text-xs text-foreground-lighter">Loading publishable key...</div>
              ) : canReadAPIKeys ? (
                <Input
                  copy
                  readOnly
                  className="font-mono text-xs"
                  value={publishableKey?.api_key ?? ''}
                  placeholder="Publishable key unavailable"
                />
              ) : (
                <div className="text-xs text-foreground-lighter">
                  You don't have permission to view API keys.
                </div>
              )}
            </DetailRow>
          </div>
          <div className="p-4 space-y-4 border-b">
            <h3 className="heading-meta text-foreground-light"> Database </h3>
            <DetailRow label="Direct connection string">
              {isLoadingDatabases ? (
                <div className="text-xs text-foreground-lighter">Loading connection string...</div>
              ) : (
                <Input
                  copy
                  readOnly
                  className="font-mono text-xs"
                  value={directConnectionString}
                  placeholder="Connection string unavailable"
                />
              )}
            </DetailRow>
          </div>
          <div className="p-4">
            <Button
              type="default"
              size="medium"
              className="w-full"
              onClick={() => setShowConnect(true)}
            >
              Get connected
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
