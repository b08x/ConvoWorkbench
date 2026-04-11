import { ConvoGraph, TrajectoryNode, SkillNode } from '../../types/graph';
import { ModelProvider } from '../../types/provider';
import { SkillFrontmatterSchema } from '../../types/skill';
import { stringify } from 'yaml';

export async function distillSkills(
  graph: ConvoGraph,
  provider: ModelProvider,
  apiKey: string,
  topicId: string
): Promise<SkillNode[]> {
  const trajectories = Object.values(graph.trajectories).filter(t => {
    // Check if any conversation in trajectory belongs to this topic
    return t.conversation_ids.some(cId => graph.topics[topicId]?.conversation_ids.includes(cId));
  });

  if (trajectories.length === 0) return [];

  // Consolidate lessons into SKILL.md
  const skillContent = await consolidateLessons(trajectories, provider, apiKey, graph.skills[topicId]?.content);

  const skillId = topicId.toLowerCase().replace(/\s+/g, '-');
  const skill: SkillNode = {
    id: skillId,
    title: graph.topics[topicId]?.label || topicId,
    content: skillContent,
    source_trajectory_ids: trajectories.map(t => t.id),
    version: (graph.skills[skillId]?.version || 0) + 1,
    gitagent_path: `skills/${skillId}/SKILL.md`,
  };

  return [skill];
}

async function consolidateLessons(
  trajectories: TrajectoryNode[],
  provider: ModelProvider,
  apiKey: string,
  existingContent?: string
): Promise<string> {
  const system = `You are a Skill Distiller implementing the Trace2Skill pattern.
Your task is to consolidate multiple trajectory lessons into a single gitagent-compatible SKILL.md file.
Follow the format:
---
name: <kebab-case>
version: "1.0"
description: <one line>
allowed-tools: []
---
# <Title>
## When to Use
## Procedure
## Anti-Patterns
## Examples

Dominance Scoring: Positive trajectories outweigh negative ones.`;

  const user = `
${existingContent ? `EXISTING SKILL CONTENT:\n${existingContent}\n---` : ''}
TRAJECTORY LESSONS:
${trajectories.map(t => `
QUALITY: ${t.quality_signal}
LESSON: ${t.lesson}
`).join('\n---')}
`;

  const result = await provider.generate({ system, user }, apiKey);
  return result.text;
}
