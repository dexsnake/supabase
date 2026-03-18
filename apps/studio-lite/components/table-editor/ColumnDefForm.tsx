'use client'

import { Trash2 } from 'lucide-react'
import { Button, Input_Shadcn_ } from 'ui'

const DATA_TYPES = ['TEXT', 'INTEGER', 'REAL', 'BLOB']

export interface ColumnDefFormState {
  name: string
  dataType: string
  isPrimaryKey: boolean
  isNullable: boolean
  defaultValue: string
  isAutoIncrement: boolean
}

export function createDefaultColumn(isPk = false): ColumnDefFormState {
  return {
    name: isPk ? 'id' : '',
    dataType: isPk ? 'INTEGER' : 'TEXT',
    isPrimaryKey: isPk,
    isNullable: !isPk,
    defaultValue: '',
    isAutoIncrement: isPk,
  }
}

export interface ColumnDefFormProps {
  value: ColumnDefFormState
  onChange: (value: ColumnDefFormState) => void
  onRemove: () => void
  canRemove: boolean
}

export function ColumnDefForm({ value, onChange, onRemove, canRemove }: ColumnDefFormProps) {
  const update = (patch: Partial<ColumnDefFormState>) => onChange({ ...value, ...patch })

  return (
    <div className="flex items-center gap-2">
      <Input_Shadcn_
        className="flex-1 min-w-0 h-8 text-sm"
        placeholder="Column name"
        value={value.name}
        onChange={(e) => update({ name: e.target.value })}
      />
      <select
        className="h-8 rounded-md border bg-control text-sm px-2 min-w-[100px]"
        value={value.dataType}
        onChange={(e) => update({ dataType: e.target.value })}
      >
        {DATA_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-1 text-xs text-foreground-light whitespace-nowrap cursor-pointer">
        <input
          type="checkbox"
          checked={value.isPrimaryKey}
          onChange={(e) =>
            update({
              isPrimaryKey: e.target.checked,
              isNullable: e.target.checked ? false : value.isNullable,
            })
          }
        />
        PK
      </label>
      <label className="flex items-center gap-1 text-xs text-foreground-light whitespace-nowrap cursor-pointer">
        <input
          type="checkbox"
          checked={value.isNullable}
          disabled={value.isPrimaryKey}
          onChange={(e) => update({ isNullable: e.target.checked })}
        />
        Nullable
      </label>
      <label className="flex items-center gap-1 text-xs text-foreground-light whitespace-nowrap cursor-pointer">
        <input
          type="checkbox"
          checked={value.isAutoIncrement}
          onChange={(e) => update({ isAutoIncrement: e.target.checked })}
        />
        Auto
      </label>
      <Input_Shadcn_
        className="w-24 h-8 text-sm"
        placeholder="Default"
        value={value.defaultValue}
        onChange={(e) => update({ defaultValue: e.target.value })}
      />
      <Button
        type="text"
        size="tiny"
        disabled={!canRemove}
        icon={<Trash2 size={14} strokeWidth={1.5} />}
        onClick={onRemove}
      />
    </div>
  )
}
