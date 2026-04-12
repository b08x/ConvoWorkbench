import { ConversationNode, TopicNode } from '../../types/graph';
import { ModelProvider, TaskModelConfig } from '../../types/provider';

export interface TopicExtractionProgress {
  topic: TopicNode;
  timestamp: number;
  convoTitles: string[];
}

export async function extractTopics(
  conversations: ConversationNode[],
  provider: ModelProvider,
  apiKey: string,
  config: TaskModelConfig,
  onProgress?: (progress: TopicExtractionProgress) => void
): Promise<TopicNode[]> {
  const BATCH_SIZE = 10;
  const allTopics: Record<string, TopicNode> = {};
  const convoMap = new Map(conversations.map(c => [c.id, c]));

  for (let i = 0; i < conversations.length; i += BATCH_SIZE) {
    const batch = conversations.slice(i, i + BATCH_SIZE);
    
    const system = `You are a Topic Modeler. Given a list of conversation titles and snippets, group them into meaningful topic clusters.
Output a JSON array of objects:
{
  "id": "kebab-case-id",
  "label": "Human Readable Label",
  "conversation_ids": ["id1", "id2"]
}`;

    const user = `Analyze these conversations and group them into topics:
${batch.map(c => `ID: ${c.id}, Title: ${c.title}`).join('\n')}`;

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
      const batchTopics = typeof result.object === 'string' ? JSON.parse(result.object) : result.object;
      
      if (Array.isArray(batchTopics)) {
        batchTopics.forEach((t: any) => {
          const topicId = t.id;
          if (allTopics[topicId]) {
            // Merge
            allTopics[topicId].conversation_ids = Array.from(new Set([
              ...allTopics[topicId].conversation_ids,
              ...t.conversation_ids
            ]));
          } else {
            allTopics[topicId] = {
              ...t,
              centroid_vector: [],
            };
          }

          if (onProgress) {
            onProgress({
              topic: allTopics[topicId],
              timestamp: Date.now(),
              convoTitles: t.conversation_ids.map((id: string) => convoMap.get(id)?.title || id)
            });
          }
        });
      } else {
        console.warn('Batch topics result is not an array:', batchTopics);
      }
    } catch (e) {
      console.error('Failed to parse topics for batch:', e);
    }
  }

  return Object.values(allTopics);
}
