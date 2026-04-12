import { GenerationPrompt, GenerationResult, ModelProvider, ModelInfo } from '../../types/provider';
import { GoogleGenAI } from "@google/genai";

export class GeminiAdapter implements ModelProvider {
  id = 'gemini';
  name = 'Gemini';
  supportsDirectBrowser = true;

  async generate(prompt: GenerationPrompt, apiKey: string, modelId: string): Promise<GenerationResult> {
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt.user,
      config: {
        systemInstruction: prompt.system,
        responseMimeType: prompt.schema ? "application/json" : "text/plain",
      }
    });

    return { 
      text: response.text || '',
      object: prompt.schema ? JSON.parse(response.text || '{}') : undefined
    };
  }

  async *stream(prompt: GenerationPrompt, apiKey: string, modelId: string): AsyncGenerator<string> {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContentStream({
      model: modelId,
      contents: prompt.user,
      config: {
        systemInstruction: prompt.system,
      }
    });

    for await (const chunk of response) {
      yield chunk.text || '';
    }
  }

  async fetchModels(apiKey: string): Promise<ModelInfo[]> {
    return [
      {
        id: 'gemini-3-flash-preview',
        name: 'Gemini 3 Flash (Preview)',
        capabilities: { tools: true, reasoning: true, structured: true }
      },
      {
        id: 'gemini-3.1-pro-preview',
        name: 'Gemini 3.1 Pro (Preview)',
        capabilities: { tools: true, reasoning: true, structured: true }
      },
      {
        id: 'gemini-flash-latest',
        name: 'Gemini Flash Latest',
        capabilities: { tools: true, reasoning: false, structured: true }
      }
    ];
  }
}
