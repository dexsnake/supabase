import { Checkbox_Shadcn_ } from 'ui'

type Props = {
  acknowledgedAll: boolean
  setAcknowledgedAll: (value: boolean) => void
  max: number
}

export const DeleteOrganizationButtonSingleAck = ({
  acknowledgedAll,
  setAcknowledgedAll,
  max,
}: Props) => {
  return (
    <div className="mt-2 rounded-md border border-warning bg-warning/5 px-3 py-3">
      <p className="text-sm text-foreground">
        This organization contains more than {max} projects.
      </p>

      <label className="mt-3 flex items-center gap-2 text-sm text-foreground">
        <Checkbox_Shadcn_
          checked={acknowledgedAll}
          onCheckedChange={(checked) => setAcknowledgedAll(checked === true)}
        />
        I understand that all projects will be permanently deleted.
      </label>
    </div>
  )
}
