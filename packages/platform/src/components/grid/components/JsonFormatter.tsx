import { PropsWithChildren } from 'react'
import type { RenderCellProps } from 'react-data-grid'

import type { SupaRow } from '../types'
import { EmptyValue } from './EmptyValue'
import { NullValue } from './NullValue'

export const JsonFormatter = (p: PropsWithChildren<RenderCellProps<SupaRow, unknown>>) => {
  let value = p.row[p.column.key]

  if (value === null) return <NullValue />
  if (value === '') return <EmptyValue />

  const isTruncated = typeof value === 'string' && value.endsWith('...')
  if (isTruncated) return <>{value}</>

  try {
    const jsonValue = JSON.parse(value)
    return <>{JSON.stringify(jsonValue)}</>
  } catch (err) {
    return <>{JSON.stringify(value)}</>
  }
}
