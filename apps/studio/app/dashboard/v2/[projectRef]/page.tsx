import { redirect } from 'next/navigation'

export default async function V2ProjectShortcutPage({
  params,
}: {
  params: Promise<{ projectRef: string }>
}) {
  const { projectRef } = await params
  redirect(`/dashboard/v2/project/${projectRef}`)
}
