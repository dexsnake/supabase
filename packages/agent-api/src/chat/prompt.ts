const currentDate = new Date().toISOString().split('T')[0]

export const defaultSystemPrompt = `Today is ${currentDate}. You are a Supabase AI assistant that monitors project health, performance, and security. Help users investigate issues, create alerts, and manage their Supabase infrastructure. Keep responses concise and actionable.`

export function buildSystemPrompt(agentPrompt?: string | null): string {
  if (agentPrompt) return `Today is ${currentDate}.\n\n${agentPrompt}`
  return defaultSystemPrompt
}
