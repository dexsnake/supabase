import { describe, expect, it } from 'vitest'

import { computeYAxisDomain, normalizeStackedData } from './Charts.utils'

const IOPS_DATA = [
  { timestamp: 1, disk_iops_write: 1200, disk_iops_read: 24203, disk_iops_max: 25000 },
  { timestamp: 2, disk_iops_write: 400, disk_iops_read: 3200, disk_iops_max: 25000 },
  { timestamp: 3, disk_iops_write: 100, disk_iops_read: 900, disk_iops_max: 25000 },
]

const IOPS_VISIBLE = ['disk_iops_write', 'disk_iops_read']

describe('computeYAxisDomain', () => {
  describe('percentage charts with max line hidden', () => {
    it('returns [0, yMaxFromVisible] to zoom in on the data', () => {
      expect(
        computeYAxisDomain({
          isPercentage: true,
          showMaxValue: false,
          yMaxFromVisible: 75,
          maxAttributeKey: 'cpu_usage_max',
          showMaxLine: false,
          data: [{ cpu_busy: 75, cpu_usage_max: 100 }],
          visibleAttributeNames: ['cpu_busy'],
        })
      ).toEqual([0, 75])
    })

    it('still zooms in even when a maxAttributeKey is present', () => {
      expect(
        computeYAxisDomain({
          isPercentage: true,
          showMaxValue: false,
          yMaxFromVisible: 60,
          maxAttributeKey: 'cpu_usage_max',
          showMaxLine: true,
          data: [{ cpu_busy: 60, cpu_usage_max: 100 }],
          visibleAttributeNames: ['cpu_busy'],
        })
      ).toEqual([0, 60])
    })
  })

  describe('no max reference line', () => {
    it('returns auto when maxAttributeKey is undefined', () => {
      expect(
        computeYAxisDomain({
          isPercentage: false,
          showMaxValue: false,
          yMaxFromVisible: 5000,
          maxAttributeKey: undefined,
          showMaxLine: false,
          data: IOPS_DATA,
          visibleAttributeNames: IOPS_VISIBLE,
        })
      ).toEqual(['auto', 'auto'])
    })

    it('returns auto when showMaxLine is false', () => {
      expect(
        computeYAxisDomain({
          isPercentage: false,
          showMaxValue: true,
          yMaxFromVisible: 5000,
          maxAttributeKey: 'disk_iops_max',
          showMaxLine: false,
          data: IOPS_DATA,
          visibleAttributeNames: IOPS_VISIBLE,
        })
      ).toEqual(['auto', 'auto'])
    })
  })

  describe('max reference line not yet loaded (value is 0)', () => {
    it('returns auto when diskConfig has not loaded and reference line value is 0', () => {
      const dataWithZeroMax = IOPS_DATA.map((p) => ({ ...p, disk_iops_max: 0 }))
      expect(
        computeYAxisDomain({
          isPercentage: false,
          showMaxValue: true,
          yMaxFromVisible: 5000,
          maxAttributeKey: 'disk_iops_max',
          showMaxLine: true,
          data: dataWithZeroMax,
          visibleAttributeNames: IOPS_VISIBLE,
        })
      ).toEqual(['auto', 'auto'])
    })
  })

  describe('explicit domain with reference line', () => {
    it('uses the reference line value when bars stay below it', () => {
      // All stacked bar totals (1000, 500) are well below maxRefValue (25000)
      expect(
        computeYAxisDomain({
          isPercentage: false,
          showMaxValue: true,
          yMaxFromVisible: 800,
          maxAttributeKey: 'disk_iops_max',
          showMaxLine: true,
          data: [
            { disk_iops_write: 400, disk_iops_read: 600, disk_iops_max: 25000 },
            { disk_iops_write: 200, disk_iops_read: 300, disk_iops_max: 25000 },
          ],
          visibleAttributeNames: IOPS_VISIBLE,
        })
      ).toEqual([0, 25000])
    })

    it('uses the stacked bar total when it exceeds the reference line', () => {
      // Stacked total at first point: 24203 + 1200 = 25403 > 25000
      expect(
        computeYAxisDomain({
          isPercentage: false,
          showMaxValue: true,
          yMaxFromVisible: 24203,
          maxAttributeKey: 'disk_iops_max',
          showMaxLine: true,
          data: IOPS_DATA,
          visibleAttributeNames: IOPS_VISIBLE,
        })
      ).toEqual([0, 25403])
    })

    it('domain min is always 0', () => {
      const [min] = computeYAxisDomain({
        isPercentage: false,
        showMaxValue: true,
        yMaxFromVisible: 100,
        maxAttributeKey: 'disk_iops_max',
        showMaxLine: true,
        data: IOPS_DATA,
        visibleAttributeNames: IOPS_VISIBLE,
      }) as [number, number]
      expect(min).toBe(0)
    })

    it('works for database connections chart (single bar series, no stacking)', () => {
      const data = [
        { pg_stat_database_num_backends: 45, max_db_connections: 60 },
        { pg_stat_database_num_backends: 52, max_db_connections: 60 },
      ]
      expect(
        computeYAxisDomain({
          isPercentage: false,
          showMaxValue: true,
          yMaxFromVisible: 52,
          maxAttributeKey: 'max_db_connections',
          showMaxLine: true,
          data,
          visibleAttributeNames: ['pg_stat_database_num_backends'],
        })
      ).toEqual([0, 60])
    })

    it('handles non-numeric values in data gracefully', () => {
      const data = [
        { disk_iops_write: 'bad', disk_iops_read: null, disk_iops_max: 25000 },
        { disk_iops_write: 500, disk_iops_read: 1000, disk_iops_max: 25000 },
      ]
      expect(
        computeYAxisDomain({
          isPercentage: false,
          showMaxValue: true,
          yMaxFromVisible: 1000,
          maxAttributeKey: 'disk_iops_max',
          showMaxLine: true,
          data: data as Record<string, unknown>[],
          visibleAttributeNames: IOPS_VISIBLE,
        })
      ).toEqual([0, 25000])
    })
  })
})

describe('normalizeStackedData', () => {
  const CPU_ATTRS = ['cpu_system', 'cpu_user', 'cpu_iowait']

  it('passes through unchanged when sum is under the cap', () => {
    const data = [{ timestamp: 1, cpu_system: 10, cpu_user: 30, cpu_iowait: 5 }]
    const result = normalizeStackedData(data, CPU_ATTRS, 100)
    expect(result).toEqual(data)
  })

  it('passes through unchanged when sum equals the cap', () => {
    const data = [{ timestamp: 1, cpu_system: 40, cpu_user: 50, cpu_iowait: 10 }]
    const result = normalizeStackedData(data, CPU_ATTRS, 100)
    expect(result).toEqual(data)
  })

  it('scales values proportionally when sum exceeds the cap', () => {
    const data = [{ timestamp: 1, cpu_system: 60, cpu_user: 90, cpu_iowait: 50 }]
    // sum = 200, scale = 100/200 = 0.5
    const result = normalizeStackedData(data, CPU_ATTRS, 100)
    expect(result[0]).toEqual({ timestamp: 1, cpu_system: 30, cpu_user: 45, cpu_iowait: 25 })
  })

  it('preserves relative proportions', () => {
    const data = [{ timestamp: 1, cpu_system: 60, cpu_user: 90, cpu_iowait: 50 }]
    const result = normalizeStackedData(data, CPU_ATTRS, 100)
    const r = result[0] as Record<string, number>
    // system:user:iowait ratio should remain 60:90:50 = 6:9:5
    expect(r.cpu_system / r.cpu_user).toBeCloseTo(60 / 90)
    expect(r.cpu_user / r.cpu_iowait).toBeCloseTo(90 / 50)
  })

  it('does not modify non-stacked attributes', () => {
    const data = [{ timestamp: 1, cpu_system: 80, cpu_user: 80, cpu_iowait: 40, cpu_max: 100 }]
    const result = normalizeStackedData(data, CPU_ATTRS, 100)
    expect((result[0] as Record<string, number>).cpu_max).toBe(100)
    expect((result[0] as Record<string, number>).timestamp).toBe(1)
  })

  it('ignores non-numeric values', () => {
    const data = [{ timestamp: 1, cpu_system: 'bad' as any, cpu_user: 120, cpu_iowait: 30 }]
    // sum = 0 + 120 + 30 = 150, scale = 100/150
    const result = normalizeStackedData(data, CPU_ATTRS, 100)
    const r = result[0] as Record<string, unknown>
    expect(r.cpu_system).toBe('bad') // non-numeric left untouched
    expect(r.cpu_user).toBeCloseTo(80)
    expect(r.cpu_iowait).toBeCloseTo(20)
  })

  it('handles mixed rows where only some need normalization', () => {
    const data = [
      { timestamp: 1, cpu_system: 10, cpu_user: 20, cpu_iowait: 5 }, // sum 35, no change
      { timestamp: 2, cpu_system: 80, cpu_user: 80, cpu_iowait: 40 }, // sum 200, normalize
    ]
    const result = normalizeStackedData(data, CPU_ATTRS, 100)
    expect(result[0]).toEqual(data[0]) // unchanged
    const r1 = result[1] as Record<string, number>
    expect(r1.cpu_system + r1.cpu_user + r1.cpu_iowait).toBeCloseTo(100)
  })

  it('handles zero sum gracefully', () => {
    const data = [{ timestamp: 1, cpu_system: 0, cpu_user: 0, cpu_iowait: 0 }]
    const result = normalizeStackedData(data, CPU_ATTRS, 100)
    expect(result).toEqual(data)
  })
})
