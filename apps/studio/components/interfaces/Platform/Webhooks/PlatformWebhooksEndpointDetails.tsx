import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

import { getStatusLevel } from 'components/interfaces/UnifiedLogs/UnifiedLogs.utils'
import { DataTableColumnStatusCode } from 'components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { TimestampInfo } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import type { WebhookDelivery, WebhookEndpoint } from './PlatformWebhooks.types'
import { statusBadgeVariant } from './PlatformWebhooksView.utils'

interface DetailItemProps {
  label: string
  children: ReactNode
  ddClassName?: string
}

const DetailItem = ({ label, children, ddClassName = 'text-sm' }: DetailItemProps) => (
  <div className="space-y-1">
    <dt className="text-sm text-foreground-lighter">{label}</dt>
    <dd className={ddClassName}>{children}</dd>
  </div>
)

interface PlatformWebhooksEndpointDetailsProps {
  deliverySearch: string
  filteredDeliveries: WebhookDelivery[]
  selectedEndpoint: WebhookEndpoint
  onDeliverySearchChange: (value: string) => void
  onOpenDelivery: (deliveryId: string) => void
}

const DELIVERIES_PAGE_SIZE = 5

export const PlatformWebhooksEndpointDetails = ({
  deliverySearch,
  filteredDeliveries,
  selectedEndpoint,
  onDeliverySearchChange,
  onOpenDelivery,
}: PlatformWebhooksEndpointDetailsProps) => {
  const hasCustomHeaders = selectedEndpoint.customHeaders.length > 0
  const [deliveryPage, setDeliveryPage] = useState(1)
  const deliveryPageCount = Math.max(1, Math.ceil(filteredDeliveries.length / DELIVERIES_PAGE_SIZE))
  const currentDeliveryPage = Math.min(deliveryPage, deliveryPageCount)
  const deliveryStartIndex = (currentDeliveryPage - 1) * DELIVERIES_PAGE_SIZE
  const paginatedDeliveries = filteredDeliveries.slice(
    deliveryStartIndex,
    deliveryStartIndex + DELIVERIES_PAGE_SIZE
  )
  const deliveryRangeStart = filteredDeliveries.length === 0 ? 0 : deliveryStartIndex + 1
  const deliveryRangeEnd = Math.min(
    deliveryStartIndex + DELIVERIES_PAGE_SIZE,
    filteredDeliveries.length
  )

  useEffect(() => {
    setDeliveryPage(1)
  }, [deliverySearch, selectedEndpoint.id])

  useEffect(() => {
    setDeliveryPage((currentPage) => Math.min(currentPage, deliveryPageCount))
  }, [deliveryPageCount])

  return (
    <div className="space-y-16">
      <div className="space-y-4">
        <h2 className="text-foreground text-xl">Overview</h2>
        <Card className="overflow-hidden">
          <CardContent className="pb-5">
            <dl className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
              <DetailItem label="URL" ddClassName="text-sm break-all">
                {selectedEndpoint.url}
              </DetailItem>

              <DetailItem label="Description">{selectedEndpoint.description || '-'}</DetailItem>

              <DetailItem label="Event types" ddClassName="flex flex-wrap gap-2">
                {(selectedEndpoint.eventTypes.includes('*')
                  ? ['All events (*)']
                  : selectedEndpoint.eventTypes
                ).map((eventType) => (
                  <code
                    key={eventType}
                    className="text-code-inline rounded-md border px-3 py-1.5 text-2xs"
                  >
                    {eventType}
                  </code>
                ))}
              </DetailItem>

              {hasCustomHeaders && (
                <DetailItem label="Custom headers">
                  <div className="rounded-md border divide-y divide-border">
                    {selectedEndpoint.customHeaders.map((header) => (
                      <div
                        key={header.id}
                        className="px-2 py-2 font-mono font-medium text-xs flex items-center gap-2 flex-wrap"
                      >
                        <code className="text-code_block-4">{header.key}:</code>
                        <code className="">{header.value}</code>
                      </div>
                    ))}
                  </div>
                </DetailItem>
              )}

              <DetailItem label="Created by">{selectedEndpoint.createdBy}</DetailItem>

              <DetailItem label="Created at">
                <TimestampInfo className="text-sm" utcTimestamp={selectedEndpoint.createdAt} />
              </DetailItem>
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-foreground text-xl">Deliveries</h2>
        <div className="flex items-center justify-between gap-2">
          <Input
            placeholder="Search deliveries"
            size="tiny"
            icon={<Search />}
            value={deliverySearch}
            className="w-full lg:w-52"
            onChange={(event) => onDeliverySearchChange(event.target.value)}
          />
          <p className="text-sm text-foreground-muted">{filteredDeliveries.length} total</p>
        </div>
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Event type</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Attempted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDeliveries.length > 0 ? (
                paginatedDeliveries.map((delivery) => (
                  <TableRow
                    key={delivery.id}
                    className="cursor-pointer inset-focus"
                    onClick={() => onOpenDelivery(delivery.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onOpenDelivery(delivery.id)
                      }
                    }}
                    tabIndex={0}
                  >
                    <TableCell>
                      <Badge variant={statusBadgeVariant[delivery.status]}>{delivery.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-code-inline">{delivery.eventType}</code>
                    </TableCell>
                    <TableCell>
                      {delivery.responseCode ? (
                        <DataTableColumnStatusCode
                          value={delivery.responseCode}
                          level={getStatusLevel(delivery.responseCode)}
                          className="text-xs"
                        />
                      ) : (
                        <span className="text-xs text-foreground-muted">–</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <TimestampInfo className="text-sm" utcTimestamp={delivery.attemptAt} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="[&>td]:hover:bg-inherit">
                  <TableCell colSpan={4}>
                    <p className="text-sm text-foreground">No deliveries found</p>
                    <p className="text-sm text-foreground-lighter">
                      Try adjusting your search to see more webhook attempts.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {filteredDeliveries.length > 0 && (
            <CardFooter className="border-t p-4 flex items-center justify-between">
              <p className="text-foreground-muted text-sm">
                Showing {deliveryRangeStart} to {deliveryRangeEnd} of {filteredDeliveries.length}{' '}
                deliveries
              </p>
              <div className="flex items-center gap-x-2" aria-label="Pagination">
                <Button
                  icon={<ChevronLeft />}
                  aria-label="Previous page"
                  type="default"
                  size="tiny"
                  disabled={currentDeliveryPage === 1}
                  onClick={() => setDeliveryPage((page) => Math.max(1, page - 1))}
                />
                <Button
                  icon={<ChevronRight />}
                  aria-label="Next page"
                  type="default"
                  size="tiny"
                  disabled={currentDeliveryPage >= deliveryPageCount}
                  onClick={() =>
                    setDeliveryPage((page) => Math.min(deliveryPageCount, page + 1))
                  }
                />
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
