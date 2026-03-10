import { readFile } from 'node:fs/promises'
import { getMultipartBoundary, parseMultipartStream } from '@mjackson/multipart-parser'
import { IS_PLATFORM } from 'common'
import { API_URL } from 'lib/constants'
import { NextApiRequest, NextApiResponse } from 'next'

import { getFunctionsArtifactStore } from '@/lib/api/self-hosted/functions'
import { uuidv4 } from '@/lib/helpers'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    default:
      return res.status(405).json({ error: { message: `Method ${method} Not Allowed` } })
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { ref, slug } = req.query
    if (!ref) return res.status(400).json({ error: { message: 'Project ref is missing' } })
    if (!slug) return res.status(400).json({ error: { message: 'Slug is missing' } })

    if (IS_PLATFORM) {
      return await getBodyFromPlatform(req, res)
    } else {
      return await getBodyFromLocal(req, res)
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch function body'
    return res.status(500).json({ error: { message } })
  }
}

async function getBodyFromPlatform(req: NextApiRequest, res: NextApiResponse) {
  const { ref, slug } = req.query

  const authorization = req.headers.authorization
  if (!authorization) {
    return res.status(401).json({ error: { message: 'Unauthorized' } })
  }

  const url = `${API_URL?.replace('/platform', '')}/v1/projects/${ref}/functions/${slug}/body`
  const response = await fetch(url, {
    headers: {
      Accept: 'multipart/form-data',
      Authorization: authorization,
    },
  })

  if (!response.ok) {
    const errorBody = await response.text()
    return res.status(response.status).json({
      error: { message: errorBody || `Upstream error: ${response.status}` },
    })
  }

  const contentTypeHeader = response.headers.get('content-type') ?? ''
  const boundary = getMultipartBoundary(contentTypeHeader)

  if (!response.body || !boundary) {
    return res.status(200).json({ metadata: {}, files: [] })
  }

  let metadata: { deno2_entrypoint_path?: string | null } = {}
  const files: { name: string | undefined; content: string }[] = []

  for await (const part of parseMultipartStream(response.body, {
    boundary,
    maxFileSize: 20 * 1024 * 1024,
  })) {
    if (part.isFile) {
      files.push({
        name: part.filename,
        content: part.text,
      })
    } else {
      metadata = JSON.parse(part.text)
    }
  }

  return res.status(200).json({ metadata, files })
}

async function getBodyFromLocal(req: NextApiRequest, res: NextApiResponse) {
  const slugParam = req.query.slug
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam
  if (!slug) {
    return res.status(404).json({ error: { message: `Missing function 'slug' parameter` } })
  }

  const store = getFunctionsArtifactStore()
  const fileEntries = await store.getFileEntriesBySlug(slug)

  const totalSize = fileEntries.reduce((sum, entry) => sum + entry.size, 0)

  const metadata = {
    deployment_id: uuidv4(),
    original_size: totalSize,
    compressed_size: totalSize,
    module_count: fileEntries.length,
  }

  const files = await Promise.all(
    fileEntries.map(async (entry) => ({
      name: entry.relativePath,
      content: await readFile(entry.absolutePath, 'utf-8'),
    }))
  )

  return res.status(200).json({ metadata, files })
}
