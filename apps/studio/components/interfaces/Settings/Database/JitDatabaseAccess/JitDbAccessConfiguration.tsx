import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { DocsButton } from 'components/ui/DocsButton'

import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useJitDbAccessQuery } from 'data/jit-db-access/jit-db-access-query'
import { useJitDbAccessUpdateMutation } from 'data/jit-db-access/jit-db-access-update-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
// import MembersView from './JitDbAccessMembersView'
// import { ManageJitAccessPanel } from './ManageJitAccessPanel'

import { DOCS_URL } from 'lib/constants'
import {
  Alert,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Card,
  CardContent,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'

const JitDbAccessConfiguration = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [isEnabled, setIsEnabled] = useState(false)
  const [isSettingAccess, setIsSettingAccess] = useState(false)

  const {
    data: jitDbAccessConfiguration,
    isLoading,
    isSuccess,
  } = useJitDbAccessQuery({
    projectRef: ref,
  })
  const { mutate: updateJitDbAccess, isLoading: isSubmitting } = useJitDbAccessUpdateMutation({
    onSuccess: () => {
      toast.success('Successfully updated just-in-time (JIT) database access configuration')
    },
    onError: (error) => {
      setIsEnabled(initialIsEnabled)
      toast.error(
        `Failed to update just-in-time (JIT) database access enforcement: ${error.message}`
      )
    },
  })

  const { can: canUpdateJitDbAccess } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'projects',
    {
      resource: {
        project_id: project?.id,
      },
    }
  )
  const initialIsEnabled = isSuccess
    ? jitDbAccessConfiguration.appliedSuccessfully && jitDbAccessConfiguration.state == 'enabled'
    : false

  const hasAccessToJitDbAccess = !(
    jitDbAccessConfiguration !== undefined &&
    'isUnavailable' in jitDbAccessConfiguration &&
    jitDbAccessConfiguration.isUnavailable
  )
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT === 'prod' ? 'prod' : 'staging'

  useEffect(() => {
    if (!isLoading && jitDbAccessConfiguration) {
      setIsEnabled(initialIsEnabled)
    }
  }, [isLoading])

  const toggleJitDbAccess = async () => {
    if (!ref) return console.error('Project ref is required')
    setIsEnabled(!isEnabled)
    updateJitDbAccess({
      projectRef: ref,
      requestedConfig: { state: !isEnabled ? 'enabled' : 'disabled' },
    })
  }

  return (
    <PageSection id="jit-db-access-configuration">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Just-in-time (JIT) database access</PageSectionTitle>
        </PageSectionSummary>
        <DocsButton href={`${DOCS_URL}/guides/platform/just-in-time-database-access`} />
      </PageSectionMeta>
      <PageSectionContent>
        <Card>
          <CardContent className="space-y-4">
            <FormLayout
              layout="flex-row-reverse"
              label="Enable JIT database access"
              description="Allow JIT access to your database using Personal Access Tokens (PAT)."
            >
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <div className="flex items-center justify-end mt-2.5 space-x-2">
                    {(isLoading || isSubmitting) && (
                      <Loader2 className="animate-spin" strokeWidth={1.5} size={16} />
                    )}
                    {isSuccess && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {/* [Joshen] Added div as tooltip is messing with data state property of toggle */}
                          <div>
                            <Switch
                              size="large"
                              checked={isEnabled}
                              disabled={
                                isLoading ||
                                isSubmitting ||
                                !canUpdateJitDbAccess ||
                                !hasAccessToJitDbAccess
                              }
                            />
                          </div>
                        </TooltipTrigger>
                        {(!canUpdateJitDbAccess || !hasAccessToJitDbAccess) && (
                          <TooltipContent side="bottom" className="w-64 text-center">
                            {!canUpdateJitDbAccess
                              ? 'You need additional permissions to update Just-in-time database access for your project'
                              : !hasAccessToJitDbAccess
                                ? 'Your project does not have access to Just-in-time database access. Please update to the latest Postgres version'
                                : undefined}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    )}
                  </div>
                </AlertDialogTrigger>
                <AlertDialogContent size="medium">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {jitDbAccessConfiguration?.state !== 'enabled'
                        ? 'Access must be configured'
                        : 'Users will lose access'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {jitDbAccessConfiguration?.state !== 'enabled'
                        ? 'Access via JIT must be granted on a per user basis. Any existing mappings will immediately become active when JIT access is enabled. Confirm to proceed now?'
                        : 'Users with JIT access will no longer be able to connect. The user to role mappings will not be removed and access will automatically be restored if JIT access is re-enabled. Confirm to proceed now?'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant="warning"
                      disabled={isSubmitting}
                      onClick={toggleJitDbAccess}
                    >
                      {jitDbAccessConfiguration?.state !== 'enabled'
                        ? 'Enable JIT Access'
                        : 'Disable JIT Access'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </FormLayout>
            {isSuccess && !jitDbAccessConfiguration?.appliedSuccessfully && (
              <Alert withIcon variant="warning" title="JIT access was not updated successfully">
                Please try updating again, or contact{' '}
                <SupportLink className={InlineLinkClassName}>support</SupportLink> if this error
                persists
              </Alert>
            )}
          </CardContent>
        </Card>
      </PageSectionContent>
    </PageSection>
  )
}

export default JitDbAccessConfiguration
