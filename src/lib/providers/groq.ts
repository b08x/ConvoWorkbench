import { GenerationPrompt, GenerationResult, ModelProvider, ModelInfo } from '../../types/provider';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

export class GroqAdapter implements ModelProvider {
  id = 'groq';
  name = 'Groq';
  supportsDirectBrowser = true;

  async generate(prompt: GenerationPrompt, apiKey: string, modelId: string): Promise<GenerationResult> {
    const groq = createOpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    const { text } = await generateText({
      model: groq(modelId),
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
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch Groq models');
      const data = await response.json();

      return data.data.map((m: any) => ({
        id: m.id,
        name: m.id,
        capabilities: {
          tools: true,
          reasoning: m.id.includes('llama-3.1') || m.id.includes('70b'),
          structured: true,
        }
      }));
    } catch (e) {
      console.warn('Groq model fetch failed (likely CORS). Using fallback list.', e);
      return [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', capabilities: { tools: true, reasoning: true, structured: true } },
        { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B Versatile', capabilities: { tools: true, reasoning: true, structured: true } },
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', capabilities: { tools: true, reasoning: false, structured: true } },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', capabilities: { tools: true, reasoning: false, structured: true } },
        { id: 'gemma2-9b-it', name: 'Gemma 2 9B', capabilities: { tools: true, reasoning: false, structured: true } },
      ];
    }
  }
}
