import { ConversationNode, TopicNode } from '../../types/graph';
import { ModelProvider, TaskModelConfig } from '../../types/provider';

export async function extractTopics(
  conversations: ConversationNode[],
  provider: ModelProvider,
  apiKey: string,
  config: TaskModelConfig
): Promise<TopicNode[]> {
  const system = `You are a Topic Modeler. Given a list of conversation titles and snippets, group them into meaningful topic clusters.
Output a JSON array of objects:
{
  "id": "kebab-case-id",
  "label": "Human Readable Label",
  "conversation_ids": ["id1", "id2"]
}`;

  const user = `Analyze these conversations and group them into topics:
${conversations.map(c => `ID: ${c.id}, Title: ${c.title}`).join('\n')}`;

  const result = await provider.generate({ 
    system, 
    user,
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          conversation_ids: { type: "array", items: { type: "string" } }
        },
        required: ["id", "label", "conversation_ids"]
      }
    }
  }, apiKey, config.modelId);

  try {
    const topics = typeof result.object === 'string' ? JSON.parse(result.object) : result.object;
    return topics.map((t: any) => ({
      ...t,
      centroid_vector: [], // Placeholder for embeddings
    }));
  } catch (e) {
    console.error('Failed to parse topics:', e);
    return [];
  }
}
