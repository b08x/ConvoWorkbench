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
    // Gemini API doesn't have a simple public "list models" endpoint that works with just an API key in the same way
    // But we can return a list of known good models
    return [
      {
        id: 'gemini-2.0-flash-exp',
        name: 'Gemini 2.0 Flash (Experimental)',
        capabilities: { tools: true, reasoning: true, structured: true }
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        capabilities: { tools: true, reasoning: false, structured: true }
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        capabilities: { tools: true, reasoning: true, structured: true }
      }
    ];
  }
}
