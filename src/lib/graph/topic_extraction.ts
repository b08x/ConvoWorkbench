import { ConversationNode, TopicNode } from '../../types/graph';
import { ModelProvider, TaskModelConfig } from '../../types/provider';

export interface TopicExtractionProgress {
  topic?: TopicNode;
  timestamp: number;
  convoTitles?: string[];
  currentBatch: number;
  totalBatches: number;
  estimatedTimeRemaining?: number; // in ms
  progress: number;
}

export async function extractTopics(
  conversations: ConversationNode[],
  provider: ModelProvider,
  apiKey: string | undefined,
  config: TaskModelConfig,
  onProgress?: (progress: TopicExtractionProgress) => void
): Promise<TopicNode[]> {
  if (conversations.length === 0) return [];

  const BATCH_SIZE = 10;
  const allTopics: Record<string, TopicNode> = {};
  const convoMap = new Map(conversations.map(c => [c.id, c]));
  const totalBatches = Math.max(1, Math.ceil(conversations.length / BATCH_SIZE));
  const startTime = Date.now();

  for (let i = 0; i < conversations.length; i += BATCH_SIZE) {
    const currentBatch = Math.floor(i / BATCH_SIZE) + 1;
    const batch = conversations.slice(i, i + BATCH_SIZE);
    
    // Initial batch progress
    if (onProgress) {
      const elapsed = Date.now() - startTime;
      const avgTimePerBatch = currentBatch > 1 ? elapsed / (currentBatch - 1) : 0;
      const etr = avgTimePerBatch ? avgTimePerBatch * (totalBatches - currentBatch + 1) : undefined;

      onProgress({
        currentBatch,
        totalBatches,
        progress: (currentBatch / totalBatches) * 100,
        timestamp: Date.now(),
        estimatedTimeRemaining: etr
      });
    }

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
      let batchTopics = result.object;
      
      // If result.object is not set or not an array, try parsing text
      if (!Array.isArray(batchTopics)) {
        try {
          const jsonMatch = result.text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            batchTopics = JSON.parse(jsonMatch[0]);
          } else if (typeof result.object === 'object' && result.object !== null) {
            // Handle case where it returned { "topics": [...] }
            const values = Object.values(result.object);
            const foundArray = values.find(v => Array.isArray(v));
            if (foundArray) batchTopics = foundArray;
          }
        } catch (e) {
          console.error('Inner parse failed:', e);
        }
      }
      
      if (Array.isArray(batchTopics)) {
        batchTopics.forEach((t: any) => {
          const topicId = t.id || `topic-${Math.random().toString(36).slice(2, 7)}`;
          const label = t.label || 'Unlabeled Topic';
          const convoIds = Array.isArray(t.conversation_ids) ? t.conversation_ids : [];

          if (allTopics[topicId]) {
            // Merge
            allTopics[topicId].conversation_ids = Array.from(new Set([
              ...allTopics[topicId].conversation_ids,
              ...convoIds
            ]));
          } else {
            allTopics[topicId] = {
              id: topicId,
              label,
              conversation_ids: convoIds,
              centroid_vector: [],
            };
          }

          if (onProgress) {
            const elapsed = Date.now() - startTime;
            const avgTimePerBatch = elapsed / currentBatch;
            const etr = avgTimePerBatch * (totalBatches - currentBatch);

            onProgress({
              topic: allTopics[topicId],
              timestamp: Date.now(),
              convoTitles: convoIds.map((id: string) => convoMap.get(id)?.title || id),
              currentBatch,
              totalBatches,
              progress: (currentBatch / totalBatches) * 100,
              estimatedTimeRemaining: etr
            });
          }
        });
      } else {
        console.warn('Batch topics result is not an array:', result);
      }
    } catch (e) {
      console.error('Failed to parse topics for batch:', e);
    }
  }

  return Object.values(allTopics);
}
