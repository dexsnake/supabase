import { describe, expect, test } from 'vitest'

import { TableNodeColumnData } from './SchemaTableNode.types'
import { getOrderedColumns } from './SchemaTableNode.utils'

describe('getOrderedColumns', () => {
  const idColumn = {
    id: 'id',
    name: 'id',
    format: '',
    isIdentity: true,
    isNullable: false,
    isPrimary: true,
    isUnique: true,
  }
  const column1 = {
    id: 'column1',
    name: 'column1',
    format: '',
    isIdentity: false,
    isNullable: true,
    isPrimary: false,
    isUnique: false,
  }
  const column2 = {
    id: 'column2',
    name: 'column2',
    format: '',
    isIdentity: false,
    isNullable: true,
    isPrimary: false,
    isUnique: false,
  }
  const column3 = {
    id: 'column3',
    name: 'column3',
    format: '',
    isIdentity: false,
    isNullable: true,
    isPrimary: false,
    isUnique: false,
  }

  const tableColumns: Array<TableNodeColumnData> = [idColumn, column1, column2]

  test('return the columns directly if no persisted order is provided', () => {
    expect(getOrderedColumns(tableColumns, undefined)).toEqual(tableColumns)
  })

  test('return the columns ordered as in the persisted order if provided', () => {
    expect(getOrderedColumns(tableColumns, ['id', 'column2', 'column1'])).toEqual([
      idColumn,
      column2,
      column1,
    ])
  })

  test('return the columns ordered as in the persisted order if provided with new columns at the end', () => {
    expect(getOrderedColumns([...tableColumns, column3], ['id', 'column2', 'column1'])).toEqual([
      idColumn,
      column2,
      column1,
      column3
    ])
  })

  test('return the columns ordered as in the persisted order with deleted columns removed', () => {
    expect(getOrderedColumns([idColumn, column1], ['id', 'column2', 'column1'])).toEqual([
      idColumn,
      column1,
    ])
  })

  test('return the columns ordered as in the persisted order with deleted columns removed and new columns at the end', () => {
    expect(getOrderedColumns([idColumn, column1, column3], ['id', 'column2', 'column1'])).toEqual([
      idColumn,
      column1,
      column3
    ])
  })
})
