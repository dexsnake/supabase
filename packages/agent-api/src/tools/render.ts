import { tool } from 'ai'
import { z } from 'zod'

const rowSchema = z.object({
  primaryText: z.string().describe('Primary label for the row.'),
  secondaryText: z.string().optional().describe('Secondary information.'),
  actions: z.array(z.object({
    label: z.string().describe('Action menu text.'),
    prompt: z.string().describe('Prompt to send back when selected.'),
  })).optional().describe('Optional quick-action list.'),
})

const chartDataPointSchema = z
  .record(z.string(), z.union([z.string(), z.number()]))
  .refine((p) => Object.keys(p).length > 0, { message: 'Each data point must have at least one key/value pair.' })

const chartSchema = z.object({
  primaryText: z.string().describe('Chart title.'),
  secondaryText: z.string().optional().describe('Short description under the title.'),
  tertiaryText: z.string().optional().describe('Supporting text beneath the chart.'),
  data: z.array(chartDataPointSchema).min(1).describe('Data points to plot.'),
  xAxis: z.string().min(1).describe('Key in each data point to use for X-axis labels.'),
  yAxis: z.string().min(1).describe('Key in each data point to use for bar height values.'),
}).superRefine(({ data, xAxis, yAxis }, ctx) => {
  data.forEach((point, i) => {
    if (!(xAxis in point)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['data', i, xAxis], message: `Missing x-axis key "${xAxis}".` })
    if (!(yAxis in point)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['data', i, yAxis], message: `Missing y-axis key "${yAxis}".` })
  })
})

const sqlChartConfigSchema = z.object({
  type: z.literal('bar').optional().describe('Chart type. Defaults to bar.'),
  xKey: z.string().min(1).describe('Key in each result row to use for X-axis labels.'),
  yKey: z.string().min(1).describe('Key in each result row to use for numeric Y-axis values.'),
})

const baseSqlSchema = z.object({
  projectRef: z.string().min(1).describe('Project reference used when running the query.'),
  primaryText: z.string().optional().describe('Optional title shown above the editor.'),
  secondaryText: z.string().optional().describe('Optional supporting text shown near the editor.'),
  defaultValue: z.string().optional().describe('Initial SQL shown in the editor.'),
  view: z.enum(['table', 'chart']).optional().describe('Default output view.'),
  chartConfig: sqlChartConfigSchema.optional().describe('Chart configuration for chart view.'),
  runButtonLabel: z.string().optional().describe('Optional label for the run button.'),
})

const sqlSchema = z.discriminatedUnion('source', [
  baseSqlSchema.extend({
    source: z.literal('sql'),
    connectionString: z.string().nullable().optional().describe('Optional encrypted connection string override.'),
  }),
  baseSqlSchema.extend({
    source: z.literal('logs'),
    dateRange: z.object({
      from: z.string().min(1).describe('ISO start timestamp for logs queries.'),
      to: z.string().min(1).describe('ISO end timestamp for logs queries.'),
    }),
  }),
])

export const renderTools = {
  renderRow: tool({
    description: 'Render a list of rows summarizing records, with optional follow-up actions.',
    inputSchema: z.object({ rows: z.array(rowSchema).min(1) }),
    execute: async () => ({ success: true, message: 'Rows have been shown to the user' }),
  }),

  renderChart: tool({
    description: 'Render a bar chart summarizing metrics for the user.',
    inputSchema: chartSchema,
    execute: async (input) => ({ success: true, message: 'Chart has been shown to the user', ...input }),
  }),

  renderSql: tool({
    description: 'Render an interactive SQL editor that the user can run on the client.',
    inputSchema: sqlSchema,
    execute: async (input) => ({
      success: true,
      message: 'SQL editor has been shown to the user',
      ...input,
    }),
  }),
}
