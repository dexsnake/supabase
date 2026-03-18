import { IS_PLATFORM, LOCAL_STORAGE_KEYS, useParams } from 'common'
import {
  convertResultsToJSON,
  convertResultsToMarkdown,
  formatResults,
} from 'components/interfaces/SQLEditor/UtilityPanel/Results.utils'
import saveAs from 'file-saver'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useHotKey } from 'hooks/ui/useHotKey'
import { ChevronDown, Copy, Download, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Papa from 'papaparse'
import { useMemo } from 'react'
import { toast } from 'sonner'
import {
  Button,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  KeyboardShortcut,
} from 'ui'

interface DownloadResultsButtonProps {
  iconOnly?: boolean
  type?: 'text' | 'default'
  text?: string
  align?: 'start' | 'center' | 'end'
  results: any[]
  fileName: string
  onDownloadAsCSV?: () => void
  onCopyAsMarkdown?: () => void
  onCopyAsJSON?: () => void
}

export const DownloadResultsButton = ({
  iconOnly = false,
  type = 'default',
  text = 'Export',
  align = 'start',
  results,
  fileName,
  onDownloadAsCSV,
  onCopyAsMarkdown,
  onCopyAsJSON,
}: DownloadResultsButtonProps) => {
  const { ref } = useParams()
  const pathname = usePathname()
  const isLogs = pathname?.includes?.('/logs') ?? false
  const formattedResults = formatResults(results)

  const [copyMarkdownEnabled] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.HOTKEY_COPY_MARKDOWN, true)
  const [copyJsonEnabled] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.HOTKEY_COPY_JSON, true)
  const [downloadCsvEnabled] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.HOTKEY_DOWNLOAD_CSV, true)

  const headers = useMemo(() => {
    if (results) {
      const firstRow = Array.from(results)[0]
      if (firstRow) return Object.keys(firstRow)
    }
    return undefined
  }, [results])

  const downloadAsCSV = () => {
    const csv = Papa.unparse(formattedResults, { columns: headers })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, `${fileName}.csv`)
    toast.success('Downloading results as CSV')
    onDownloadAsCSV?.()
  }

  const copyAsMarkdown = () => {
    const markdownData = convertResultsToMarkdown(results)
    if (!markdownData) {
      toast('Results are empty')
      return
    }
    copyToClipboard(markdownData, () => {
      toast.success('Copied markdown to clipboard')
      onCopyAsMarkdown?.()
    })
  }

  const copyAsJSON = () => {
    const jsonData = convertResultsToJSON(results)
    if (!jsonData) {
      toast('Results are empty')
      return
    }
    copyToClipboard(jsonData, () => {
      toast.success('Copied JSON to clipboard')
      onCopyAsJSON?.()
    })
  }

  useHotKey(
    (e) => {
      e.preventDefault()
      copyAsMarkdown()
    },
    'm',
    { enabled: copyMarkdownEnabled ?? true }
  )

  useHotKey(
    (e) => {
      e.preventDefault()
      copyAsJSON()
    },
    'o',
    { enabled: copyJsonEnabled ?? true }
  )

  useHotKey(
    (e) => {
      e.preventDefault()
      downloadAsCSV()
    },
    'l',
    { enabled: downloadCsvEnabled ?? true }
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type={type}
          icon={iconOnly ? <Download /> : undefined}
          iconRight={iconOnly ? undefined : <ChevronDown />}
          disabled={results.length === 0}
          className={iconOnly ? 'w-7' : ''}
        >
          {!iconOnly && text}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56">
        {isLogs && IS_PLATFORM && (
          <DropdownMenuItem asChild className="gap-x-2">
            <Link href={`/project/${ref}/settings/log-drains`}>
              <Settings size={14} />
              <p>Add a Log Drain</p>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={copyAsMarkdown} className="gap-x-2">
          <Copy size={14} />
          <p>Copy as markdown</p>
          <span className="ml-auto">
            <KeyboardShortcut keys={['Meta', 'M']} />
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyAsJSON} className="gap-x-2">
          <Copy size={14} />
          <p>Copy as JSON</p>
          <span className="ml-auto">
            <KeyboardShortcut keys={['Meta', 'O']} />
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-x-2" onClick={() => downloadAsCSV()}>
          <Download size={14} />
          <p>Download CSV</p>
          <span className="ml-auto">
            <KeyboardShortcut keys={['Meta', 'L']} />
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
