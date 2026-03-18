import { proxy, useSnapshot } from 'valtio'

export interface GridState {
  page: number
  sortColumn: string | null
  sortAscending: boolean
  selectedRows: Set<number>
}

export function createGridState(): GridState {
  return proxy<GridState>({
    page: 1,
    sortColumn: null,
    sortAscending: true,
    selectedRows: new Set(),
  })
}

export function useGridSnapshot(state: GridState) {
  return useSnapshot(state)
}
