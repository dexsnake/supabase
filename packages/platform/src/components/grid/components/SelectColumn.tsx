// Simplified from apps/studio/components/grid/components/grid/SelectColumn.tsx
// Removed: onEditRow expand button, studio state snapshots

import { ChangeEvent, InputHTMLAttributes, SyntheticEvent } from 'react'
import {
  type CalculatedColumn,
  type RenderCellProps,
  type RenderGroupCellProps,
  type RenderHeaderCellProps,
  useHeaderRowSelection,
  useRowSelection,
} from 'react-data-grid'

import { SELECT_COLUMN_KEY } from '../constants'
import type { SupaRow } from '../types'

export const SelectColumn: CalculatedColumn<any, any> = {
  key: SELECT_COLUMN_KEY,
  name: '',
  idx: 0,
  width: 65,
  maxWidth: 65,
  resizable: false,
  sortable: false,
  frozen: true,
  renderHeaderCell: (props: RenderHeaderCellProps<unknown>) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { isRowSelected, onRowSelectionChange } = useHeaderRowSelection()

    return (
      <SelectCellHeader
        aria-label="Select All"
        tabIndex={props.tabIndex}
        value={isRowSelected}
        onChange={(checked) => onRowSelectionChange({ checked })}
      />
    )
  },
  renderCell: (props: RenderCellProps<SupaRow>) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { isRowSelected, onRowSelectionChange } = useRowSelection()
    return (
      <SelectCellFormatter
        aria-label="Select"
        tabIndex={props.tabIndex}
        value={isRowSelected}
        onChange={(checked, isShiftClick) => {
          onRowSelectionChange({ row: props.row, checked, isShiftClick })
        }}
        onClick={stopPropagation}
      />
    )
  },
  renderGroupCell: (props: RenderGroupCellProps<SupaRow>) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { isRowSelected, onRowSelectionChange } = useRowSelection()
    return (
      <SelectCellFormatter
        aria-label="Select Group"
        tabIndex={props.tabIndex}
        value={isRowSelected}
        onChange={(checked) => {
          onRowSelectionChange({ row: props.row, checked, isShiftClick: false })
        }}
        onClick={stopPropagation}
      />
    )
  },

  parent: undefined,
  level: 0,
  minWidth: 0,
  draggable: false,
}

function stopPropagation(event: SyntheticEvent) {
  event.stopPropagation()
}

type SharedInputProps = Pick<
  InputHTMLAttributes<HTMLInputElement>,
  'disabled' | 'tabIndex' | 'onClick' | 'aria-label' | 'aria-labelledby'
>

interface SelectCellFormatterProps extends SharedInputProps {
  value: boolean
  onChange: (value: boolean, isShiftClick: boolean) => void
}

function SelectCellFormatter({
  value,
  tabIndex,
  disabled,
  onClick,
  onChange,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: SelectCellFormatterProps) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(e.target.checked, (e.nativeEvent as MouseEvent).shiftKey)
  }

  return (
    <div className="sb-grid-select-cell__formatter">
      <input
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        tabIndex={tabIndex}
        type="checkbox"
        className="rdg-row__select-column__select-action"
        disabled={disabled}
        checked={value}
        onChange={handleChange}
        onClick={onClick}
      />
    </div>
  )
}

interface SelectCellHeaderProps extends SharedInputProps {
  value: boolean
  onChange: (value: boolean, isShiftClick: boolean) => void
}

function SelectCellHeader({
  disabled,
  tabIndex,
  value,
  onChange,
  onClick,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: SelectCellHeaderProps) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(e.target.checked, (e.nativeEvent as MouseEvent).shiftKey)
  }

  return (
    <div className="sb-grid-select-cell__header">
      <input
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        tabIndex={tabIndex}
        type="checkbox"
        className="sb-grid-select-cell__header__input"
        disabled={disabled}
        checked={value}
        onChange={handleChange}
        onClick={onClick}
      />
    </div>
  )
}
