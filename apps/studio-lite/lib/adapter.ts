import initSqlJs from 'sql.js'
import { SqlJsDatabaseAdapter, type ColumnDef } from 'platform'

const IDB_NAME = 'supalite'
const IDB_STORE = 'database'
const IDB_KEY = 'main'
const DEBOUNCE_MS = 1000

// ---------------------------------------------------------------------------
// IndexedDB helpers
// ---------------------------------------------------------------------------

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function loadFromIDB(): Promise<Uint8Array | null> {
  const db = await openIDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly')
    const req = tx.objectStore(IDB_STORE).get(IDB_KEY)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })
}

async function saveToIDB(data: Uint8Array): Promise<void> {
  const db = await openIDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).put(data, IDB_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// ---------------------------------------------------------------------------
// Seed data (only used on first run)
// ---------------------------------------------------------------------------

const seedData = [
  {
    name: 'todos',
    columns: [
      { name: 'id', dataType: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true, isNullable: false },
      { name: 'title', dataType: 'TEXT', isNullable: false },
      { name: 'completed', dataType: 'INTEGER', isNullable: false, defaultValue: '0' },
      { name: 'created_at', dataType: 'TEXT', isNullable: false, defaultValue: "(datetime('now'))" },
    ] as ColumnDef[],
    rows: [
      { id: 1, title: 'Set up Supalite project', completed: 1, created_at: '2026-03-15T10:00:00Z' },
      { id: 2, title: 'Build mock adapter', completed: 1, created_at: '2026-03-16T09:30:00Z' },
      { id: 3, title: 'Implement SQL editor', completed: 0, created_at: '2026-03-17T14:00:00Z' },
      { id: 4, title: 'Add data grid component', completed: 0, created_at: '2026-03-17T14:30:00Z' },
      { id: 5, title: 'Wire up storage browser', completed: 0, created_at: '2026-03-18T08:00:00Z' },
    ],
  },
  {
    name: 'profiles',
    columns: [
      { name: 'id', dataType: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true, isNullable: false },
      { name: 'username', dataType: 'TEXT', isNullable: false, isUnique: true },
      { name: 'display_name', dataType: 'TEXT', isNullable: true },
      { name: 'email', dataType: 'TEXT', isNullable: true },
      { name: 'bio', dataType: 'TEXT', isNullable: true },
      { name: 'created_at', dataType: 'TEXT', isNullable: false, defaultValue: "(datetime('now'))" },
    ] as ColumnDef[],
    rows: [
      { id: 1, username: 'alice', display_name: 'Alice Chen', email: 'alice@example.com', bio: 'Full-stack developer', created_at: '2026-01-10T12:00:00Z' },
      { id: 2, username: 'bob', display_name: 'Bob Smith', email: 'bob@example.com', bio: null, created_at: '2026-02-05T15:30:00Z' },
      { id: 3, username: 'charlie', display_name: 'Charlie Park', email: 'charlie@example.com', bio: 'Loves SQLite', created_at: '2026-03-01T09:00:00Z' },
    ],
  },
  {
    name: 'posts',
    columns: [
      { name: 'id', dataType: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true, isNullable: false },
      { name: 'author_id', dataType: 'INTEGER', isNullable: false },
      { name: 'title', dataType: 'TEXT', isNullable: false },
      { name: 'body', dataType: 'TEXT', isNullable: true },
      { name: 'published', dataType: 'INTEGER', isNullable: false, defaultValue: '0' },
      { name: 'created_at', dataType: 'TEXT', isNullable: false, defaultValue: "(datetime('now'))" },
    ] as ColumnDef[],
    rows: [
      { id: 1, author_id: 1, title: 'Getting started with Supalite', body: 'Supalite is a lightweight alternative to Supabase backed by SQLite.', published: 1, created_at: '2026-03-10T10:00:00Z' },
      { id: 2, author_id: 1, title: 'Query builder patterns', body: 'The supabase-js query builder translates cleanly to SQLite operations.', published: 1, created_at: '2026-03-12T11:00:00Z' },
      { id: 3, author_id: 2, title: 'Draft: Performance tips', body: null, published: 0, created_at: '2026-03-14T16:00:00Z' },
      { id: 4, author_id: 3, title: 'Why SQLite rocks', body: 'SQLite handles most workloads beautifully with zero configuration.', published: 1, created_at: '2026-03-16T09:00:00Z' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Persisting adapter — wraps SqlJsDatabaseAdapter with auto-save to IndexedDB
// ---------------------------------------------------------------------------

class PersistentAdapter extends SqlJsDatabaseAdapter {
  private _saveTimer: ReturnType<typeof setTimeout> | null = null

  private _scheduleSave() {
    if (this._saveTimer) clearTimeout(this._saveTimer)
    this._saveTimer = setTimeout(() => {
      const data = this.export()
      saveToIDB(data).catch(console.error)
    }, DEBOUNCE_MS)
  }

  async query(sql: string, params?: unknown[]) {
    const result = await super.query(sql, params)
    // Persist after any mutation (non-SELECT)
    const trimmed = sql.trim().toUpperCase()
    if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('PRAGMA') && !trimmed.startsWith('EXPLAIN')) {
      this._scheduleSave()
    }
    return result
  }

  async createTable(name: string, columns: ColumnDef[]) {
    await super.createTable(name, columns)
    this._scheduleSave()
  }

  async dropTable(name: string) {
    await super.dropTable(name)
    this._scheduleSave()
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let _initPromise: Promise<PersistentAdapter> | null = null

export function getAdapter(): Promise<PersistentAdapter> {
  if (!_initPromise) {
    _initPromise = (async () => {
      const SQL = await initSqlJs({
        locateFile: (file: string) => `/${file}`,
      }) as any

      // Try loading from IndexedDB first
      const saved = await loadFromIDB().catch(() => null)

      if (saved) {
        const db = new SQL.Database(saved)
        return new PersistentAdapter(db)
      }

      // Fresh database — seed with initial data
      const db = new SQL.Database()
      const adapter = new PersistentAdapter(db)
      adapter.seed(seedData)

      // Persist the seeded database
      const data = adapter.export()
      await saveToIDB(data).catch(console.error)

      return adapter
    })()
  }

  return _initPromise
}
