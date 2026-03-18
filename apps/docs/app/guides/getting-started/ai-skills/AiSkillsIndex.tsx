import { getAiSkills } from './AiSkills.utils'
import { AiSkillsTable } from './AiSkillsTable'

export async function AiSkillsIndex() {
  const skills = await getAiSkills()
  return <AiSkillsTable skills={skills} />
}
