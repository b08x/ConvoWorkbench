import { GenerationPrompt, GenerationResult, ModelProvider, ModelInfo } from '../../types/provider';

export class ProxyAdapter implements ModelProvider {
  constructor(public id: string, public name: string) {}
  
  supportsDirectBrowser = false;

  async generate(prompt: GenerationPrompt, _apiKey: string | undefined, modelId: string): Promise<GenerationResult> {
    const response = await fetch('/api/llm/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: this.id,
        modelId,
        prompt
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate');
    }

    return response.json();
  }

  async *stream(prompt: GenerationPrompt, _apiKey: string | undefined, modelId: string): AsyncGenerator<string> {
    const response = await fetch('/api/llm/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: this.id,
        modelId,
        prompt
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to stream');
    }

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          try {
            const { chunk, error } = JSON.parse(data);
            if (error) throw new Error(error);
            yield chunk;
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
        }
      }
    }
  }

  async fetchModels(_apiKey: string | undefined): Promise<ModelInfo[]> {
    const response = await fetch(`/api/llm/models/${this.id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch models');
    }
    return response.json();
  }

  async speak(text: string, _apiKey: string | undefined): Promise<string> {
    const response = await fetch('/api/llm/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: this.id,
        text
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate speech');
    }

    const data = await response.json();
    return data.audio;
  }
}
