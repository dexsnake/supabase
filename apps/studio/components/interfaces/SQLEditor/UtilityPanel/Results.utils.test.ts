import { describe, expect, it } from 'vitest'

import { convertResultsToJSON, convertResultsToMarkdown, formatResults } from './Results.utils'

describe('Results.utils', () => {
  describe('formatResults', () => {
    it('should stringify object values', () => {
      const results = [{ id: 1, data: { nested: true } }]
      const formatted = formatResults(results)
      expect(formatted).toEqual([{ id: 1, data: '{"nested":true}' }])
    })

    it('should stringify array values', () => {
      const results = [{ id: 1, tags: ['a', 'b'] }]
      const formatted = formatResults(results)
      expect(formatted).toEqual([{ id: 1, tags: '["a","b"]' }])
    })

    it('should stringify null values', () => {
      const results = [{ id: 1, value: null }]
      const formatted = formatResults(results)
      expect(formatted).toEqual([{ id: 1, value: 'null' }])
    })

    it('should leave primitive values unchanged', () => {
      const results = [{ name: 'test', count: 42, active: true }]
      const formatted = formatResults(results)
      expect(formatted).toEqual([{ name: 'test', count: 42, active: true }])
    })

    it('should return empty array for empty input', () => {
      expect(formatResults([])).toEqual([])
    })
  })

  describe('convertResultsToMarkdown', () => {
    it('should return undefined for empty results', () => {
      expect(convertResultsToMarkdown([])).toBeUndefined()
    })

    it('should convert results to a markdown table', () => {
      const results = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]
      const md = convertResultsToMarkdown(results)
      expect(md).toContain('| id | name  |')
      expect(md).toContain('| 1  | Alice |')
      expect(md).toContain('| 2  | Bob   |')
    })

    it('should stringify nested objects in markdown output', () => {
      const results = [{ id: 1, meta: { role: 'admin' } }]
      const md = convertResultsToMarkdown(results)
      expect(md).toContain('{"role":"admin"}')
    })
  })

  describe('convertResultsToJSON', () => {
    it('should return undefined for empty results', () => {
      expect(convertResultsToJSON([])).toBeUndefined()
    })

    it('should return formatted JSON string', () => {
      const results = [{ id: 1, name: 'Alice' }]
      const json = convertResultsToJSON(results)
      expect(json).toBe(JSON.stringify(results, null, 2))
    })

    it('should preserve nested object structure', () => {
      const results = [{ id: 1, meta: { role: 'admin' } }]
      const json = convertResultsToJSON(results)
      const parsed = JSON.parse(json!)
      expect(parsed[0].meta.role).toBe('admin')
    })
  })
})
