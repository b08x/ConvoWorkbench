import { GenerationPrompt, GenerationResult, ModelProvider, ModelInfo } from '../../types/provider';
import { createMistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';

export class MistralAdapter implements ModelProvider {
  id = 'mistral';
  name = 'Mistral';
  supportsDirectBrowser = true;

  async generate(prompt: GenerationPrompt, apiKey: string, modelId: string): Promise<GenerationResult> {
    const mistral = createMistral({ apiKey });

    const { text } = await generateText({
      model: mistral(modelId),
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
    try {
      const response = await fetch('https://api.mistral.ai/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch Mistral models');
      const data = await response.json();

      return data.data.map((m: any) => ({
        id: m.id,
        name: m.id,
        capabilities: {
          tools: true,
          reasoning: m.id.includes('large') || m.id.includes('pixtral'),
          structured: true,
        }
      }));
    } catch (e) {
      console.warn('Mistral model fetch failed (likely CORS). Using fallback list.', e);
      return [
        { id: 'mistral-large-latest', name: 'Mistral Large (Latest)', capabilities: { tools: true, reasoning: true, structured: true } },
        { id: 'mistral-small-latest', name: 'Mistral Small (Latest)', capabilities: { tools: true, reasoning: false, structured: true } },
        { id: 'open-mistral-nemo', name: 'Mistral Nemo', capabilities: { tools: true, reasoning: false, structured: true } },
        { id: 'codestral-latest', name: 'Codestral', capabilities: { tools: true, reasoning: true, structured: true } },
      ];
    }
  }
}
