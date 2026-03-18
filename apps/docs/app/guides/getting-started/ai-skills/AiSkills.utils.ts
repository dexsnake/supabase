import matter from 'gray-matter'
import { cache } from 'react'

const SKILLS_REPO = {
  org: 'supabase',
  repo: 'agent-skills',
  branch: 'main',
  path: 'skills',
}

interface SkillMetadata {
  name?: string
  title?: string
  description?: string
}

export interface SkillSummary {
  name: string
  description: string
  installCommand: string
}

interface GitHubContentItem {
  name: string
  path: string
  type: 'file' | 'dir'
}

async function fetchGitHubDirectory(path: string): Promise<GitHubContentItem[]> {
  const url = `https://api.github.com/repos/${SKILLS_REPO.org}/${SKILLS_REPO.repo}/contents/${path}?ref=${SKILLS_REPO.branch}`

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Supabase-Docs',
      },
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const data = await response.json()
    if (!Array.isArray(data)) {
      throw new Error('Expected directory listing')
    }

    return data
  } catch (err) {
    console.error('Failed to fetch GitHub directory: %o', err)
    return []
  }
}

async function fetchGitHubFile(path: string): Promise<string | null> {
  const url = `https://raw.githubusercontent.com/${SKILLS_REPO.org}/${SKILLS_REPO.repo}/${SKILLS_REPO.branch}/${path}`

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      throw new Error(`GitHub raw file error: ${response.status}`)
    }

    return await response.text()
  } catch (err) {
    console.error('Failed to fetch GitHub file: %o', err)
    return null
  }
}

async function getAiSkillsImpl(): Promise<SkillSummary[]> {
  const directories = await fetchGitHubDirectory(SKILLS_REPO.path)

  const skills: SkillSummary[] = []

  for (const item of directories) {
    if (item.type !== 'dir') continue

    const skillPath = `${SKILLS_REPO.path}/${item.name}/SKILL.md`
    const rawContent = await fetchGitHubFile(skillPath)

    if (!rawContent) continue

    const { data } = matter(rawContent) as { data: SkillMetadata }

    skills.push({
      name: item.name,
      description: data.description || '',
      installCommand: `npx skills add supabase/agent-skills --skill ${item.name}`,
    })
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name))
}

export const getAiSkills = cache(getAiSkillsImpl)
