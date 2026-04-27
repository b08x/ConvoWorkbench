import { GenerationPrompt, GenerationResult, ModelProvider, ModelInfo } from '../../types/provider';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

export class OpenRouterAdapter implements ModelProvider {
  id = 'openrouter';
  name = 'OpenRouter';
  supportsDirectBrowser = true;

  async generate(prompt: GenerationPrompt, apiKey: string, modelId: string): Promise<GenerationResult> {
    const openrouter = createOpenRouter({
      apiKey,
      headers: {
        'HTTP-Referer': window.location.origin,
        'X-Title': 'ConvoWorkbench',
      },
    });

    const { text } = await generateText({
      model: openrouter(modelId),
      system: prompt.system,
      prompt: prompt.user,
    });

    return { text };
  }

  async *stream(prompt: GenerationPrompt, apiKey: string, modelId: string): AsyncGenerator<string> {
    const result = await this.generate(prompt, apiKey, modelId);
    yield result.text;
  }

  async fetchModels(apiKey: string): Promise<ModelInfo[]> {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'ConvoWorkbench',
      }
    });

    if (!response.ok) throw new Error('Failed to fetch OpenRouter models');
    const data = await response.json();

    return data.data.map((m: any) => ({
      id: m.id || '',
      name: m.name || m.id || 'Unknown Model',
      description: m.description,
      capabilities: {
        tools: m.description?.toLowerCase().includes('tool') || false,
        reasoning: m.description?.toLowerCase().includes('reasoning') || m.id?.includes('thought') || false,
        structured: true,
      }
    }));
  }
}
