// Adapter types
export type {
  ColumnDef,
  ColumnInfo,
  DatabaseAdapter,
  QueryBuilder,
  QueryResult,
  TableInfo,
} from './src/adapters/types'

// Adapters
export { MockDatabaseAdapter, MockQueryBuilder } from './src/adapters/mock'
export { SqlJsDatabaseAdapter, SqlJsQueryBuilder } from './src/adapters/sqljs'

// Context
export { AdapterProvider, useAdapter } from './src/context/AdapterContext'

// Grid (core shared component)
export { PlatformGrid } from './src/components/grid'
export type { PlatformGridContext } from './src/components/grid/PlatformGrid'

// SQL editor (core shared component)
export { SqlEditor, MonacoThemeProvider, createSqlEditorState, useSqlEditorSnapshot } from './src/components/SqlEditor'
export type { SqlEditorState, Snippet } from './src/components/SqlEditor'
