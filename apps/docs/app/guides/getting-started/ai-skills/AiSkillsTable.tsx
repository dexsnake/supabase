'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from 'ui'
import type { SkillSummary } from './AiSkills.utils'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors',
        'border-default bg-surface-100 text-foreground-lighter hover:bg-surface-200 hover:text-foreground'
      )}
      title={`Copy: ${text}`}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

export function AiSkillsTable({ skills }: { skills: SkillSummary[] }) {
  return (
    <div className="not-prose overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-default">
            <th className="text-left py-2 pr-4 text-foreground-lighter font-medium">Skill</th>
            <th className="text-left py-2 pr-4 text-foreground-lighter font-medium">Description</th>
            <th className="text-right py-2 text-foreground-lighter font-medium">Install</th>
          </tr>
        </thead>
        <tbody>
          {skills.map((skill) => (
            <tr key={skill.name} className="border-b border-default">
              <td className="py-3 pr-4 font-mono text-xs whitespace-nowrap">
                <a
                  href={`https://github.com/supabase/agent-skills/tree/main/skills/${skill.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-brand transition-colors"
                >
                  {skill.name}
                </a>
              </td>
              <td className="py-3 pr-4 text-foreground-lighter">{skill.description}</td>
              <td className="py-3 text-right">
                <CopyButton text={skill.installCommand} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
