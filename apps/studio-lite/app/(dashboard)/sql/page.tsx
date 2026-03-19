'use client'

import {
  MonacoThemeProvider,
  SqlEditor,
  createSqlEditorState,
} from 'platform'
import { SnippetSidebar } from '@/components/sql-editor/SnippetSidebar'

const sqlState = createSqlEditorState([
  {
    id: 'welcome',
    name: 'Welcome',
    sql: `-- Welcome to Supalite SQL Editor!
-- Press Ctrl/Cmd+Enter to run a query.
-- Select text to run only a portion.

SELECT * FROM todos;
`,
  },
  {
    id: 'example-insert',
    name: 'Insert example',
    sql: `INSERT INTO todos (title, completed)
VALUES ('Learn Supalite', 0);
`,
  },
  {
    id: 'example-join',
    name: 'Posts with authors',
    sql: `SELECT
  posts.title,
  posts.published,
  profiles.username AS author
FROM posts
JOIN profiles ON profiles.id = posts.author_id
ORDER BY posts.created_at DESC;
`,
  },
])

export default function SqlPage() {
  return (
    <>
      <MonacoThemeProvider />
      <div className="flex h-full">
        <SnippetSidebar state={sqlState} />
        <div className="flex-1 overflow-hidden">
          <SqlEditor state={sqlState} />
        </div>
      </div>
    </>
  )
}
