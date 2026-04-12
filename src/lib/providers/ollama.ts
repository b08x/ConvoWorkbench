import { GenerationPrompt, GenerationResult, ModelProvider, ModelInfo } from '../../types/provider';

export class OllamaAdapter implements ModelProvider {
  id = 'ollama';
  name = 'Ollama (Local)';
  supportsDirectBrowser = true;

  private getBaseUrl(apiKey: string) {
    // For Ollama, the "apiKey" field can be used for the URL if the user wants to override localhost
    return apiKey || 'http://localhost:11434';
  }

  async generate(prompt: GenerationPrompt, apiKey: string, modelId: string): Promise<GenerationResult> {
    const baseUrl = this.getBaseUrl(apiKey);
    try {
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelId,
          prompt: prompt.user,
          system: prompt.system,
          stream: false,
          format: prompt.schema ? 'json' : undefined,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama error (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();

      return { 
        text: data.response,
        object: prompt.schema ? JSON.parse(data.response) : undefined
      };
    } catch (e) {
      console.error('Ollama generation failed:', e);
      throw new Error(`Ollama connection failed. Ensure Ollama is running and OLLAMA_ORIGINS="*" is set. Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async *stream(prompt: GenerationPrompt, apiKey: string, modelId: string): AsyncGenerator<string> {
    const baseUrl = this.getBaseUrl(apiKey);
    try {
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelId,
          prompt: prompt.user,
          system: prompt.system,
          stream: true,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama stream error (${response.status}): ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line) continue;
          const data = JSON.parse(line);
          yield data.response || '';
        }
      }
    } catch (e) {
      console.error('Ollama streaming failed:', e);
      throw new Error(`Ollama connection failed. Ensure Ollama is running and OLLAMA_ORIGINS="*" is set. Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async fetchModels(apiKey: string): Promise<ModelInfo[]> {
    const baseUrl = this.getBaseUrl(apiKey);
    try {
      const response = await fetch(`${baseUrl}/api/tags`);
      if (!response.ok) {
        console.warn(`Ollama returned status ${response.status} for /api/tags`);
        return [];
      }
      const data = await response.json();
      return data.models.map((m: any) => ({
        id: m.name,
        name: m.name,
        capabilities: {
          tools: false, // Ollama tool support varies
          reasoning: m.name.includes('llama3') || m.name.includes('mistral'),
          structured: true,
        }
      }));
    } catch (e) {
      console.error('Ollama connection failed. Ensure Ollama is running and OLLAMA_ORIGINS="*" is set for CORS support.', e);
      return [];
    }
  }
}
