import { Sandbox } from '@vercel/sandbox'
import { Writable } from 'stream'
import { tool } from 'ai'
import { z } from 'zod'
import { getToolContext } from './context.js'

const CHAT_POST_MAX_CHARS = 24_000
const CHAT_POST_MAX_ATTEMPTS = 4
const CHAT_POST_TIMEOUT_MS = 180_000
const SANDBOX_OUTPUT_BUFFER_CHARS = 160_000
const SUMMARY_TAG_REGEX = /<summary>([\s\S]*?)<\/summary>/gi
const DEFAULT_WRITE_BRANCH_PREFIX = 'pa'
const SANDBOX_TIMEOUT_MS = 35 * 60 * 1000

function truncate(input: string, maxChars = CHAT_POST_MAX_CHARS): string {
  if (input.length <= maxChars) return input
  const head = Math.floor(maxChars * 0.7)
  const tail = maxChars - head
  return `${input.slice(0, head)}\n\n...[truncated ${input.length - head - tail} chars]...\n\n${input.slice(-tail)}`
}

function sleep(ms: number): Promise<void> { return new Promise((r) => setTimeout(r, ms)) }

function lastLine(s: string): string {
  return s.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) ?? ''
}

function createOutputCollector(maxChars = SANDBOX_OUTPUT_BUFFER_CHARS) {
  const chunks: string[] = []
  let currentChars = 0
  let truncatedChars = 0
  return {
    append(chunk: string) {
      if (!chunk) return
      chunks.push(chunk)
      currentChars += chunk.length
      while (currentChars > maxChars && chunks.length > 0) {
        const removed = chunks.shift()!
        currentChars -= removed.length
        truncatedChars += removed.length
      }
    },
    getText() {
      const body = chunks.join('')
      return truncatedChars > 0 ? `[truncated: omitted ${truncatedChars} chars]\n${body}` : body
    },
  }
}

function extractSummary(output: string): string | null {
  let match: RegExpExecArray | null
  let last: string | null = null
  SUMMARY_TAG_REGEX.lastIndex = 0
  while ((match = SUMMARY_TAG_REGEX.exec(output)) !== null) {
    const c = match[1]?.trim()
    if (c) last = c
  }
  SUMMARY_TAG_REGEX.lastIndex = 0
  return last
}

function shellQuote(v: string): string { return `'${v.replace(/'/g, `'\"'\"'`)}'` }

function createDefaultBranchName(): string {
  return `${DEFAULT_WRITE_BRANCH_PREFIX}/${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomUUID().slice(0, 8)}`
}

async function runCommand(sandbox: any, cmd: string): Promise<{ output: string; exitCode: number }> {
  const r = await sandbox.runCommand('bash', ['-c', `${cmd} 2>&1`])
  const output = (await r.stdout() as string).trim()
  return { output, exitCode: (r.exitCode as number) ?? -1 }
}

function parseGitHubRepo(repoUrl: string): { owner: string; repo: string } | null {
  const ssh = repoUrl.match(/^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/i)
  if (ssh) return { owner: ssh[1], repo: ssh[2] }
  try {
    const u = new URL(repoUrl)
    if (u.hostname.toLowerCase() !== 'github.com') return null
    const parts = u.pathname.replace(/^\/+/, '').replace(/\.git$/, '').split('/')
    return parts.length >= 2 ? { owner: parts[0], repo: parts[1] } : null
  } catch { return null }
}

async function pushBranch(sandbox: any, branch: string, githubToken: string) {
  if (githubToken) {
    const { output: remoteUrl } = await runCommand(sandbox, 'git remote get-url origin')
    if (remoteUrl && !remoteUrl.includes('@github.com')) {
      const authedUrl = remoteUrl.replace('https://', `https://x-access-token:${githubToken}@`)
      await runCommand(sandbox, `git remote set-url origin ${shellQuote(authedUrl)}`)
    }
  }
  const r = await runCommand(sandbox, `git push --set-upstream origin ${shellQuote(branch)}`)
  return r.exitCode !== 0
    ? { ok: false, message: `Push failed for branch \`${branch}\`: ${r.output}` }
    : { ok: true, message: `Push succeeded for branch \`${branch}\`` }
}

async function createPR(owner: string, repo: string, head: string, base: string, title: string, body: string, token: string) {
  if (!token) return { ok: false, message: 'No GitHub token — PR creation skipped.' }
  const path = `${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
  const headers = { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'agent-api' }
  const resp = await fetch(`https://api.github.com/repos/${path}/pulls`, { method: 'POST', headers, body: JSON.stringify({ title, body, head, base, maintainer_can_modify: true }) })
  if (resp.status === 201) {
    const p = await resp.json() as { html_url?: string }
    return { ok: true, url: p.html_url, message: `Pull request created: ${p.html_url}` }
  }
  return { ok: false, message: `PR creation failed (${resp.status}): ${await resp.text()}` }
}

async function postResultToChat(result: string, agentId: string, conversationId?: string, alertId?: string) {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '')
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !serviceRoleKey) return

  const messageId = `msg-sandbox-${crypto.randomUUID().replace(/-/g, '')}`
  const payload: Record<string, unknown> = {
    message: { id: messageId, role: 'user', parts: [{ type: 'text', text: truncate(result) }], createdAt: new Date().toISOString() },
    agent_id: agentId,
    ...(alertId ? { alert_id: alertId } : {}),
    ...(conversationId ? { conversation_id: conversationId } : {}),
  }

  for (let attempt = 1; attempt <= CHAT_POST_MAX_ATTEMPTS; attempt++) {
    try {
      const resp = await fetch(`${supabaseUrl}/agent/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceRoleKey}`, 'x-internal-no-stream': '1' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(CHAT_POST_TIMEOUT_MS),
      })
      if (resp.ok) return
      console.error(`Chat post attempt ${attempt} failed: ${resp.status}`)
    } catch (err) { console.error(`Chat post attempt ${attempt} error:`, err) }
    if (attempt < CHAT_POST_MAX_ATTEMPTS) await sleep(500 * 2 ** (attempt - 1))
  }
}

async function runSandbox(opts: {
  mode: 'readonly' | 'write'
  writeBranch: string
  shouldCreatePr: boolean
  prompt: string
  repoUrl: string
  githubToken: string
  anthropicApiKey: string
  agentId: string
  conversationId?: string
  alertId?: string
}): Promise<void> {
  const { mode, shouldCreatePr, repoUrl, githubToken, anthropicApiKey, agentId, conversationId, alertId } = opts
  const writeBranch = opts.mode === 'write' ? opts.writeBranch || createDefaultBranchName() : ''
  let sandbox: any

  try {
    sandbox = await Sandbox.create({
      source: {
        url: repoUrl,
        type: 'git',
        ...(githubToken ? { username: 'x-access-token', password: githubToken } : {}),
      },
      timeout: SANDBOX_TIMEOUT_MS,
    })

    const agentNotes: string[] = []
    const hostGitNotes: string[] = []
    let prUrl = ''

    await runCommand(sandbox, 'git config user.name "Agent Bot" && git config user.email "agent-bot@users.noreply.github.com"')

    if (mode === 'write') {
      await runCommand(sandbox, `git checkout ${shellQuote(writeBranch)} 2>/dev/null || git checkout -b ${shellQuote(writeBranch)}`)
    }

    const { output: headOutput } = await runCommand(sandbox, 'git rev-parse --verify HEAD')
    const initialHead = lastLine(headOutput)

    const sdkInstall = await runCommand(sandbox, 'python3 -m pip install --disable-pip-version-check claude-agent-sdk==0.1.19')
    if (sdkInstall.exitCode !== 0) throw new Error(`SDK install failed: ${sdkInstall.output}`)

    if (githubToken) await runCommand(sandbox, `if command -v gh >/dev/null 2>&1; then echo ${shellQuote(githubToken)} | gh auth login --with-token >/dev/null 2>&1 || true; fi`)

    const { output: workdir } = await runCommand(sandbox, 'pwd')

    const summaryBlock = [
      'End your final response with exactly one <summary>...</summary> block containing:',
      '- What was implemented/fixed, files changed, any blockers',
      ...(mode === 'write' ? ['- Commit status, push status, PR URL (if created)'] : ['- Confirmation that no edits/commits were made']),
    ].join('\n')

    const modeInstructions = mode === 'write'
      ? `Write mode: apply changes on branch "${writeBranch}". Commit your changes when complete. The host will push.`
      : 'Readonly mode: do not modify files, create commits, or push.'

    const promptFull = `${opts.prompt}\n\n${modeInstructions}\n\n${summaryBlock}`

    const agentCode = [
      'import os, sys, asyncio, logging',
      'from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions, AssistantMessage, TextBlock, ToolUseBlock',
      'logging.getLogger("claude_agent_sdk").setLevel(logging.WARNING)',
      'run_mode = os.environ.get("RUN_MODE", "readonly")',
      'branch_name = os.environ.get("BRANCH_NAME", "")',
      'allowed_tools = ["Read", "Glob", "Grep", "Bash"] + (["Edit"] if run_mode == "write" else [])',
      `SYSTEM = f"You are in a sandbox. Use ${workdir || '/workspace'} as the repository root. Readonly: inspect only. Write: apply changes on branch {branch_name} and commit."`,
      'async def main():',
      '    with open("/tmp/agent_prompt.txt") as f:',
      '        prompt = f.read()',
      '    if not prompt: raise RuntimeError("Prompt file is empty")',
      '    opts = ClaudeAgentOptions(model="claude-haiku-4-5", allowed_tools=allowed_tools, permission_mode="acceptEdits", system_prompt=SYSTEM)',
      '    async with ClaudeSDKClient(options=opts) as client:',
      `        await client.query(f"Repository root: ${workdir || '/workspace'}\\n\\n{prompt}")`,
      '        async for msg in client.receive_response():',
      '            if isinstance(msg, AssistantMessage):',
      '                for block in msg.content:',
      '                    if isinstance(block, TextBlock): sys.stdout.write(block.text + "\\n"); sys.stdout.flush()',
      '                    elif isinstance(block, ToolUseBlock): sys.stdout.write(f"[tool] {getattr(block, \\"name\\", \\"?\\")}\\n"); sys.stdout.flush()',
      'asyncio.run(asyncio.wait_for(main(), timeout=1800))',
    ].join('\n')

    // Write agent script and prompt via base64 to avoid shell escaping issues
    const scriptB64 = Buffer.from(agentCode).toString('base64')
    await runCommand(sandbox, `printf '%s' ${shellQuote(scriptB64)} | base64 -d > /tmp/agent.py`)

    const promptB64 = Buffer.from(promptFull).toString('base64')
    await runCommand(sandbox, `printf '%s' ${shellQuote(promptB64)} | base64 -d > /tmp/agent_prompt.txt`)

    const outputCollector = createOutputCollector()
    let agentSucceeded = false

    for (let attempt = 1; attempt <= 2; attempt++) {
      const writer = new Writable({
        write(chunk: Buffer, _enc: string, cb: () => void) { outputCollector.append(chunk.toString()); cb() },
      })

      const envPrefix = [
        `ANTHROPIC_API_KEY=${shellQuote(anthropicApiKey)}`,
        `RUN_MODE=${mode}`,
        `BRANCH_NAME=${shellQuote(writeBranch)}`,
        'CI=1',
        ...(githubToken ? [`GITHUB_TOKEN=${shellQuote(githubToken)}`] : []),
      ].join(' ')

      const agentRun = await sandbox.runCommand({
        cmd: 'bash',
        args: ['-c', `${envPrefix} python3 /tmp/agent.py`],
        stdout: writer,
      })

      if (agentRun.exitCode === 0) { agentSucceeded = true; break }

      outputCollector.append(`\nExit code: ${agentRun.exitCode}`)
      agentNotes.push(`SDK run failed (attempt ${attempt}): exit code ${agentRun.exitCode}`)
      if (attempt < 2) { await sleep(2000); continue }
    }

    if (mode === 'write') {
      const { output: finalHeadOutput } = await runCommand(sandbox, 'git rev-parse --verify HEAD')
      const finalHead = lastLine(finalHeadOutput)
      if (initialHead && finalHead !== initialHead) {
        const pushResult = await pushBranch(sandbox, writeBranch, githubToken)
        agentNotes.push(pushResult.message); hostGitNotes.push(pushResult.message)

        if (shouldCreatePr && pushResult.ok) {
          const repoInfo = parseGitHubRepo(repoUrl)
          if (repoInfo) {
            const { output: baseOutput } = await runCommand(sandbox, 'git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed "s|refs/remotes/origin/||"')
            const baseBranch = lastLine(baseOutput) || 'main'
            if (baseBranch !== writeBranch) {
              const prTitle = opts.prompt.split(/\r?\n/).map((l) => l.trim()).find(Boolean)
              const prResult = await createPR(
                repoInfo.owner, repoInfo.repo, writeBranch, baseBranch,
                prTitle ? `Code agent: ${prTitle.replace(/\s+/g, ' ').slice(0, 90)}` : `Code agent changes (${writeBranch})`,
                `## Summary\n- Automated changes from code agent.\n- Branch: \`${writeBranch}\`\n\n## Prompt\n\`\`\`\n${truncate(opts.prompt, 2500)}\n\`\`\``,
                githubToken,
              )
              agentNotes.push(prResult.message); hostGitNotes.push(prResult.message)
              if (prResult.url) prUrl = prResult.url
            }
          }
        }
      } else {
        const skip = `No new commits on \`${writeBranch}\`; push skipped.`
        agentNotes.push(skip); hostGitNotes.push(skip)
      }
    }

    const output = outputCollector.getText()
    const summary = extractSummary(output)
    const hostLines = [
      `Execution mode: ${mode}`,
      ...(writeBranch ? [`Branch: ${writeBranch}`] : []),
      ...(prUrl ? [`PR: ${prUrl}`] : []),
      ...hostGitNotes,
    ]
    const resultMessage = summary
      ? `${summary}\n\n${hostLines.join('\n')}`
      : [`Status: ${agentSucceeded ? 'succeeded' : 'failed'}`, ...hostLines, ...agentNotes].join('\n')

    await postResultToChat(resultMessage, agentId, conversationId, alertId)
  } catch (err) {
    console.error('Sandbox error:', err)
    await postResultToChat(`**Sandbox Error**\n\n${err instanceof Error ? err.message : String(err)}`, agentId, conversationId, alertId)
  } finally {
    if (sandbox) { try { await sandbox.kill() } catch { /* ignore */ } }
  }
}

export const sandboxTools = {
  'deploy-code-agent': tool({
    description:
      'Deploy a Claude code agent in a Vercel Sandbox to review a codebase, debug issues, or implement changes. ' +
      'The sandbox already has repository context — do not ask the user for repo URLs or code files. ' +
      'Use mode="readonly" for review/debug; mode="write" when code changes are expected. ' +
      'Set createPr=true in write mode to open a GitHub PR after push. ' +
      'This is a high-cost action — only call it when explicitly requested.',
    inputSchema: z.object({
      mode: z.enum(['readonly', 'write']).default('readonly').describe('Execution mode.'),
      branch: z.string().optional().describe('Target branch for write mode. Auto-generated if omitted.'),
      createPr: z.boolean().default(false).describe('Open a GitHub PR after pushing commits (write mode only).'),
      prompt: z.string().describe('Detailed instructions for the code agent.'),
    }),
    execute: async ({ mode, branch, createPr, prompt }) => {
      const ctx = getToolContext()

      const anthropicApiKey = process.env.SANDBOX_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY
      const repoUrl = process.env.GITHUB_REPO_URL

      if (!anthropicApiKey) return { success: false, error: 'ANTHROPIC_API_KEY is not configured' }
      if (!repoUrl) return { success: false, error: 'GITHUB_REPO_URL is not configured' }
      if (!ctx.agentId) return { success: false, error: 'Cannot deploy code agent without an agent_id context' }

      const writeBranch = mode === 'write' ? (branch?.trim() || createDefaultBranchName()) : ''

      void runSandbox({
        mode,
        writeBranch,
        shouldCreatePr: mode === 'write' && createPr,
        prompt,
        repoUrl,
        githubToken: process.env.GITHUB_TOKEN || '',
        anthropicApiKey,
        agentId: ctx.agentId,
        conversationId: ctx.conversationId,
        alertId: ctx.alertId,
      })

      return {
        success: true,
        message: 'Code agent deployed and running in the background. Results will appear in this conversation when complete.',
        mode,
        ...(writeBranch ? { branch: writeBranch } : {}),
      }
    },
  }),
}
