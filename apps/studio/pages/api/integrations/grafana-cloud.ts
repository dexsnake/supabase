import * as jose from 'jose'
import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

const GRAFANA_INTEGRATION_URL = 'https://grafana.com/api/integrations'

const ConnectBodySchema = z.object({
  organizationSlug: z.string().min(1),
  projectRef: z.string().min(1),
})

function getBearerToken(req: NextApiRequest) {
  const authHeader = req.headers.authorization
  if (!authHeader || Array.isArray(authHeader)) return null
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() ?? null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ data: null, error: { message: `Method ${req.method} Not Allowed` } })
  }

  const supabaseToken = getBearerToken(req)
  if (!supabaseToken) {
    return res
      .status(401)
      .json({ data: null, error: { message: 'Unauthorized: Invalid Authorization header' } })
  }

  const parsed = ConnectBodySchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ data: null, error: { message: 'Bad Request: Invalid request body' } })
  }

  const { organizationSlug, projectRef } = parsed.data

  const privateKeyPem = process.env.GRAFANA_PRIVATE_KEY_PEM
  const kid = process.env.GRAFANA_KID
  const partnerId = 'supabase'

  if (!privateKeyPem || !partnerId || !kid) {
    return res.status(500).json({
      data: null,
      error: { message: 'Grafana integration is not configured' },
    })
  }

  try {
    // 1. Create a short-lived JWT to authenticate the API call
    const privateKey = await jose.importPKCS8(privateKeyPem, 'ES256')

    const now = Math.floor(Date.now() / 1000)

    const isLocalDev = organizationSlug === 'default-org-slug' && projectRef === 'default'

    const token = await new jose.SignJWT({
      iss: partnerId,
      aud: 'https://grafana.com/integrations',
      iat: now,
      exp: now + 300,
      ...(!isLocalDev && organizationSlug && { organization_slug: organizationSlug }),
      ...(!isLocalDev && projectRef && { project_id: projectRef }),
    })
      .setProtectedHeader({ alg: 'ES256', kid })
      .sign(privateKey)

    // 2. Create the integration server-to-server
    const grafanaResponse = await fetch(GRAFANA_INTEGRATION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    if (!grafanaResponse.ok) {
      const errorData = await grafanaResponse.json().catch(() => ({}))
      const errorMessage =
        errorData.error?.message ||
        errorData.message ||
        `Grafana Cloud returned HTTP ${grafanaResponse.status}`
      return res.status(grafanaResponse.status).json({
        data: null,
        error: { message: errorMessage },
      })
    }

    // Response: { integrationId, redirectUrl, expiresAt }
    const data = await grafanaResponse.json()

    // 3. Return the redirect URL to the frontend
    return res.status(200).json({ data: { redirectUrl: data.redirectUrl }, error: null })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return res.status(500).json({
      data: null,
      error: { message: `Failed to connect to Grafana Cloud: ${message}` },
    })
  }
}
