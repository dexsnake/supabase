'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type RightPanelType = 'chat' | 'sql' | 'adv' | null

export interface DetailTab {
  id: string
  label: string
  path: string
}

const defaultExpandedGroups: Record<string, boolean> = {
  'data-database': true,
  'data-auth': true,
  'data-storage': true,
  'data-edge-functions': true,
  'data-realtime': true,
  'obs-logs': true,
  'obs-metrics': true,
  'obs-alerts': true,
  'settings-project': true,
  'settings-branches': true,
  'settings-modules': true,
  'settings-org': true,
}

interface V2DashboardState {
  detailTabs: DetailTab[]
  expandedGroups: Record<string, boolean>
  rightPanel: RightPanelType

  addDetailTab: (tab: DetailTab) => void
  removeDetailTab: (id: string) => void
  setDetailTabs: (tabs: DetailTab[]) => void
  toggleGroup: (groupId: string) => void
  setExpandedGroup: (groupId: string, expanded: boolean) => void
  toggleRightPanel: (panel: 'chat' | 'sql' | 'adv') => void
  closeRightPanel: () => void
}

const V2DashboardContext = createContext<V2DashboardState | null>(null)

export function V2DashboardProvider({ children }: { children: ReactNode }) {
  const [detailTabs, setDetailTabsState] = useState<DetailTab[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(defaultExpandedGroups)
  const [rightPanel, setRightPanel] = useState<RightPanelType>(null)

  const addDetailTab = useCallback((tab: DetailTab) => {
    setDetailTabsState((state) =>
      state.some((t) => t.id === tab.id) ? state : [...state, tab]
    )
  }, [])

  const removeDetailTab = useCallback((id: string) => {
    setDetailTabsState((state) => state.filter((t) => t.id !== id))
  }, [])

  const setDetailTabs = useCallback((tabs: DetailTab[]) => {
    setDetailTabsState(tabs)
  }, [])

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((state) => ({
      ...state,
      [groupId]: !state[groupId],
    }))
  }, [])

  const setExpandedGroup = useCallback((groupId: string, expanded: boolean) => {
    setExpandedGroups((state) => ({ ...state, [groupId]: expanded }))
  }, [])

  const toggleRightPanel = useCallback((panel: 'chat' | 'sql' | 'adv') => {
    setRightPanel((current) => (current === panel ? null : panel))
  }, [])

  const closeRightPanel = useCallback(() => setRightPanel(null), [])

  const value = useMemo<V2DashboardState>(
    () => ({
      detailTabs,
      expandedGroups,
      rightPanel,
      addDetailTab,
      removeDetailTab,
      setDetailTabs,
      toggleGroup,
      setExpandedGroup,
      toggleRightPanel,
      closeRightPanel,
    }),
    [
      detailTabs,
      expandedGroups,
      rightPanel,
      addDetailTab,
      removeDetailTab,
      setDetailTabs,
      toggleGroup,
      setExpandedGroup,
      toggleRightPanel,
      closeRightPanel,
    ]
  )

  return (
    <V2DashboardContext.Provider value={value}>{children}</V2DashboardContext.Provider>
  )
}

export function useV2DashboardStore(): V2DashboardState
export function useV2DashboardStore<T>(selector: (s: V2DashboardState) => T): T
export function useV2DashboardStore<T>(selector?: (s: V2DashboardState) => T) {
  const ctx = useContext(V2DashboardContext)
  if (!ctx) {
    throw new Error('useV2DashboardStore must be used within V2DashboardProvider')
  }
  if (selector) return selector(ctx)
  return ctx
}
