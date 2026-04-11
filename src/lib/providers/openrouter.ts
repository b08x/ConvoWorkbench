import { GenerationPrompt, GenerationResult, ModelProvider } from '../../types/provider';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

export class OpenRouterAdapter implements ModelProvider {
  id = 'openrouter';
  name = 'OpenRouter';
  supportsDirectBrowser = true;

  async generate(prompt: GenerationPrompt, apiKey: string): Promise<GenerationResult> {
    const openrouter = createOpenRouter({
      apiKey,
      headers: {
        'HTTP-Referer': window.location.origin,
        'X-Title': 'ConvoWorkbench',
      },
    });

    const { text } = await generateText({
      model: openrouter('meta-llama/llama-3.1-70b-instruct'),
      system: prompt.system,
      prompt: prompt.user,
    });

    return { text };
  }

  async *stream(prompt: GenerationPrompt, apiKey: string): AsyncGenerator<string> {
    // Simplified stream for v1
    const result = await this.generate(prompt, apiKey);
    yield result.text;
  }
}
