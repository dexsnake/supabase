import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useIsAPIDocsSidePanelEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { APIDocsButton } from 'components/ui/APIDocsButton'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useTrack } from 'lib/telemetry/track'
import { compact, isEqual, noop } from 'lodash'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Columns,
  Edit2,
  FolderPlus,
  List,
  Loader,
  RefreshCw,
  Search,
  Upload,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Input,
} from 'ui'

import { STORAGE_SORT_BY, STORAGE_SORT_BY_ORDER, STORAGE_VIEWS } from '../Storage.constants'

const VIEW_OPTIONS = [
  { key: STORAGE_VIEWS.COLUMNS, name: 'As columns' },
  { key: STORAGE_VIEWS.LIST, name: 'As list' },
]

const SORT_BY_OPTIONS = [
  { key: STORAGE_SORT_BY.NAME, name: 'Name' },
  { key: STORAGE_SORT_BY.CREATED_AT, name: 'Time created' },
  { key: STORAGE_SORT_BY.UPDATED_AT, name: 'Time modified' },
  { key: STORAGE_SORT_BY.LAST_ACCESSED_AT, name: 'Time last accessed' },
]

const SORT_ORDER_OPTIONS = [
  { key: STORAGE_SORT_BY_ORDER.ASC, name: 'Ascending' },
  { key: STORAGE_SORT_BY_ORDER.DESC, name: 'Descending' },
]

const HeaderBreadcrumbs = ({
  loading,
  isSearching,
  breadcrumbs,
  selectBreadcrumb,
}: {
  loading: { isLoading: boolean; message: string }
  isSearching: boolean
  breadcrumbs: string[]
  selectBreadcrumb: (i: number) => void
}) => {
  // Max 5 crumbs, otherwise replace middle segment with ellipsis and only
  // have the first 2 and last 2 crumbs visible
  const ellipsis = '...'
  const breadcrumbsWithIndexes = breadcrumbs.map((name: string, index: number) => {
    return { name, index }
  })

  const formattedBreadcrumbs =
    breadcrumbsWithIndexes.length <= 5
      ? breadcrumbsWithIndexes
      : breadcrumbsWithIndexes
          .slice(0, 2)
          .concat([{ name: ellipsis, index: -1 }])
          .concat(
            breadcrumbsWithIndexes.slice(
              breadcrumbsWithIndexes.length - 2,
              breadcrumbsWithIndexes.length
            )
          )

  return loading.isLoading ? (
    <div className="ml-2 flex items-center">
      <Loader size={16} strokeWidth={2} className="animate-spin" />
      <p className="ml-3 text-sm">{loading.message}</p>
    </div>
  ) : (
    <div className={`ml-3 flex items-center ${isSearching && 'max-w-[140px] overflow-x-auto'}`}>
      {formattedBreadcrumbs.map((crumb, idx: number) => {
        const isEllipsis = crumb.name === ellipsis
        const isActive = crumb.index === breadcrumbs.length - 1

        return (
          <div className="flex items-center" key={crumb.name}>
            {idx !== 0 && (
              <ChevronRight size={14} strokeWidth={2} className="text-foreground-muted mx-1" />
            )}
            <p
              className={cn(
                'truncate text-sm transition-colors',
                isEllipsis && 'text-foreground-light',
                !isEllipsis && isActive && 'text-foreground',
                !isEllipsis &&
                  !isActive &&
                  'cursor-pointer text-foreground-lighter hover:text-foreground'
              )}
              style={{ maxWidth: '6rem' }}
              onClick={() => (!isEllipsis && !isActive ? selectBreadcrumb(crumb.index) : {})}
            >
              {crumb.name}
            </p>
          </div>
        )
      })}
    </div>
  )
}

interface FileExplorerHeader {
  itemSearchString: string
  setItemSearchString: (value: string) => void
  onFilesUpload: (event: any, columnIndex?: number) => void
}

export const FileExplorerHeader = ({
  itemSearchString = '',
  setItemSearchString = noop,
  onFilesUpload = noop,
}: FileExplorerHeader) => {
  const snap = useStorageExplorerStateSnapshot()
  const isNewAPIDocsEnabled = useIsAPIDocsSidePanelEnabled()
  const track = useTrack()

  const [pathString, setPathString] = useState('')
  const [loading, setLoading] = useState({ isLoading: false, message: '' })

  const [isEditingPath, setIsEditingPath] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const uploadButtonRef: any = useRef(null)
  const previousBreadcrumbs: any = useRef(null)

  const {
    columns,
    sortBy,
    setSortBy,
    sortByOrder,
    setSortByOrder,
    popColumn,
    popColumnAtIndex,
    popOpenedFolders,
    popOpenedFoldersAtIndex,
    fetchFoldersByPath,
    refetchAllOpenedFolders,
    addNewFolderPlaceholder,
    clearOpenedFolders,
    setSelectedFilePreview,
    selectedBucket,
  } = useStorageExplorerStateSnapshot()

  const breadcrumbs = columns.map((column) => column.name)
  const backDisabled = columns.length <= 1
  const { can: canUpdateStorage } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  useEffect(() => {
    // [Joshen] Somehow toggle search triggers this despite breadcrumbs
    // being unchanged. Manually doing a prop check to fix this
    if (!isEqual(previousBreadcrumbs.current, breadcrumbs)) {
      setIsEditingPath(false)
      previousBreadcrumbs.current = breadcrumbs
    }
  }, [breadcrumbs])

  const onSelectBack = () => {
    popColumn()
    popOpenedFolders()
    setSelectedFilePreview(undefined)
  }

  const onSelectUpload = () => {
    if (uploadButtonRef.current) {
      uploadButtonRef.current.click()
    }
  }

  /** Methods for path editings */
  const togglePathEdit = () => {
    setIsEditingPath(true)
    setPathString(breadcrumbs.slice(1).join('/'))
    if (snap.isSearching) onCancelSearch()
  }

  const onUpdatePathString = (event: any) => {
    setPathString(event.target.value)
  }

  const navigateByPathString = (event: any) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    track('storage_explorer_navigate_submitted')
    setIsEditingPath(false)
    onSetPathByString(compact(pathString.split('/')))
  }

  const onSetPathByString = async (paths: string[]) => {
    if (paths.length === 0) {
      popColumnAtIndex(0)
      clearOpenedFolders()
      setSelectedFilePreview(undefined)
    } else {
      const pathString = paths.join('/')
      setLoading({ isLoading: true, message: `Navigating to ${pathString}...` })
      await fetchFoldersByPath({ paths })
      setLoading({ isLoading: false, message: '' })
    }
  }

  const cancelSetPathString = () => {
    setIsEditingPath(false)
  }

  /** Methods for searching */
  // Search is currently within local scope when the view is set to list
  // Searching for column view requires much more thinking
  const toggleSearch = () => {
    setIsEditingPath(false)
    snap.setIsSearching(true)
  }

  const onCancelSearch = () => {
    snap.setIsSearching(false)
    setItemSearchString('')
  }

  /** Methods for breadcrumbs */

  const selectBreadcrumb = (columnIndex: number) => {
    popColumnAtIndex(columnIndex)
    popOpenedFoldersAtIndex(columnIndex - 1)
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    await refetchAllOpenedFolders()
    setIsRefreshing(false)
  }

  const onOpenNavigate = () => {
    track('storage_explorer_navigate_clicked')
    togglePathEdit()
  }

  return (
    <div
      className={cn(
        'flex h-[40px] pl-2',
        'items-center justify-between',
        'rounded-t-md border-b border-overlay bg-surface-100'
      )}
    >
      {/* Navigation */}
      <div className={`flex items-center ${isEditingPath ? 'w-1/2' : ''}`}>
        {breadcrumbs.length > 1 && (
          <>
            <Button
              icon={<ArrowLeft size={16} strokeWidth={2} />}
              size="tiny"
              type="text"
              className="opacity-100 px-1"
              disabled={backDisabled}
              onClick={() => {
                setIsEditingPath(false)
                onSelectBack()
              }}
            />
            <div className="mx-1 h-5 border-r border-strong" />
          </>
        )}
        {isEditingPath ? (
          <form className="ml-2 flex-grow">
            <Input
              autoFocus
              key="pathSet"
              type="text"
              size="small"
              value={pathString}
              onChange={onUpdatePathString}
              placeholder="e.g Parent Folder/Child Folder"
              actions={[
                <Button
                  key="cancelPath"
                  type="default"
                  htmlType="button"
                  onClick={cancelSetPathString}
                >
                  Cancel
                </Button>,
                <Button
                  key="setPath"
                  type="primary"
                  htmlType="submit"
                  onClick={navigateByPathString}
                >
                  Go to folder
                </Button>,
              ]}
            />
          </form>
        ) : breadcrumbs.length > 1 ? (
          <HeaderBreadcrumbs
            loading={loading}
            isSearching={snap.isSearching}
            breadcrumbs={breadcrumbs}
            selectBreadcrumb={selectBreadcrumb}
          />
        ) : null}
      </div>

      {/* Actions */}
      <div className="flex items-center">
        <div className="flex items-center space-x-1 px-2">
          {snap.view === STORAGE_VIEWS.COLUMNS && (
            <Button
              size="tiny"
              icon={<Edit2 />}
              type="text"
              disabled={isEditingPath || loading.isLoading}
              onClick={onOpenNavigate}
            >
              Navigate
            </Button>
          )}
          <Button
            size="tiny"
            icon={<RefreshCw />}
            type="text"
            loading={isRefreshing}
            onClick={refreshData}
          >
            Reload
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="text"
                icon={
                  snap.view === 'LIST' ? (
                    <List size={16} strokeWidth={2} />
                  ) : (
                    <Columns size={16} strokeWidth={2} />
                  )
                }
              >
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 min-w-0">
              {VIEW_OPTIONS.map((option) => (
                <DropdownMenuItem key={option.key} onClick={() => snap.setView(option.key)}>
                  <div className="flex items-center justify-between w-full">
                    <p>{option.name}</p>
                    {snap.view === option.key && (
                      <Check size={16} className="text-brand" strokeWidth={2} />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Sort by</DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-44">
                  {SORT_BY_OPTIONS.map((option) => (
                    <DropdownMenuItem key={option.key} onClick={() => setSortBy(option.key)}>
                      <div className="flex items-center justify-between w-full">
                        <p>{option.name}</p>
                        {sortBy === option.key && (
                          <Check size={16} className="text-brand" strokeWidth={2} />
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Sort order</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {SORT_ORDER_OPTIONS.map((option) => (
                    <DropdownMenuItem key={option.key} onClick={() => setSortByOrder(option.key)}>
                      <div className="flex items-center justify-between w-full">
                        <p>{option.name}</p>
                        {sortByOrder === option.key && (
                          <Check size={16} className="text-brand" strokeWidth={2} />
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="h-6 border-r border-control" />
        <div className="flex items-center space-x-1 px-2">
          <div className="hidden">
            <input ref={uploadButtonRef} type="file" multiple onChange={onFilesUpload} />
          </div>
          <ButtonTooltip
            icon={<Upload size={16} strokeWidth={2} />}
            type="text"
            disabled={!canUpdateStorage || breadcrumbs.length === 0}
            onClick={onSelectUpload}
            tooltip={{
              content: {
                side: 'bottom',
                text: !canUpdateStorage
                  ? 'You need additional permissions to upload files'
                  : undefined,
              },
            }}
          >
            Upload files
          </ButtonTooltip>
          <ButtonTooltip
            icon={<FolderPlus size={16} strokeWidth={2} />}
            type="text"
            disabled={!canUpdateStorage || breadcrumbs.length === 0}
            onClick={() => addNewFolderPlaceholder(-1)}
            tooltip={{
              content: {
                side: 'bottom',
                text: !canUpdateStorage
                  ? 'You need additional permissions to create folders'
                  : undefined,
              },
            }}
          >
            Create folder
          </ButtonTooltip>
        </div>

        <div className="h-6 border-r border-control" />
        <div className="flex items-center px-2">
          {snap.isSearching ? (
            <Input
              size="tiny"
              autoFocus
              className="w-52"
              icon={<Search />}
              actions={[
                <Button
                  key="cancel"
                  size="tiny"
                  type="text"
                  icon={<X />}
                  onClick={onCancelSearch}
                  className="p-0 h-5 w-5"
                />,
              ]}
              placeholder="Search for a file or folder"
              type="text"
              value={itemSearchString}
              onChange={(event) => setItemSearchString(event.target.value)}
            />
          ) : (
            <Button
              icon={<Search />}
              size="tiny"
              type="text"
              className="px-1"
              onClick={toggleSearch}
            />
          )}
        </div>

        {isNewAPIDocsEnabled && (
          <>
            <div className="h-6 border-r border-control" />
            <div className="mx-2">
              <APIDocsButton section={['storage', selectedBucket.name]} source="storage" />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
