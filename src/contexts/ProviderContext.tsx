import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { ModelProvider, TaskType, TaskModelConfig, ModelInfo } from '../types/provider';
import { ProxyAdapter } from '../lib/providers/proxy';
import { OllamaAdapter } from '../lib/providers/ollama';

interface ProviderState {
  apiKeys: Record<string, string>;
  taskConfigs: Record<TaskType, TaskModelConfig>;
  availableModels: Record<string, ModelInfo[]>;
}

const DEFAULT_CONFIGS: Record<TaskType, TaskModelConfig> = {
  import: { providerId: 'google', modelId: 'gemini-3-flash-preview', parameters: { temperature: 0.1, maxTokens: 1000 } },
  review: { providerId: 'google', modelId: 'gemini-3-flash-preview', parameters: { temperature: 0.1, maxTokens: 1000 } },
  trajectory: { providerId: 'google', modelId: 'gemini-3.1-pro-preview', parameters: { temperature: 0.3, maxTokens: 2000 } },
  distillation_weak: { providerId: 'google', modelId: 'gemini-3-flash-preview', parameters: { temperature: 0.5, maxTokens: 4000 } },
  distillation_strong: { providerId: 'google', modelId: 'gemini-3.1-pro-preview', parameters: { temperature: 0.5, maxTokens: 4000 } },
  retrieval: { providerId: 'google', modelId: 'gemini-3-flash-preview', parameters: { temperature: 0, maxTokens: 500 } },
  insights: { providerId: 'google', modelId: 'gemini-3-flash-preview', parameters: { temperature: 0.7, maxTokens: 2000 } },
};

const ProviderContext = createContext<{
  providers: ModelProvider[];
  apiKeys: Record<string, string>;
  taskConfigs: Record<TaskType, TaskModelConfig>;
  availableModels: Record<string, ModelInfo[]>;
  setApiKey: (providerId: string, key: string) => void;
  setTaskConfig: (task: TaskType, config: TaskModelConfig) => void;
  refreshModels: (providerId: string) => Promise<void>;
  getProvider: (id: string) => ModelProvider | undefined;
} | undefined>(undefined);

export function ProviderProvider({ children }: { children: ReactNode }) {
  const providers = useMemo(() => [
    new ProxyAdapter('google', 'Google Gemini'),
    new ProxyAdapter('openrouter', 'OpenRouter'),
    new ProxyAdapter('mistral', 'Mistral'),
    new ProxyAdapter('groq', 'Groq'),
    new OllamaAdapter(),
  ], []);

  const [state, setState] = useState<ProviderState>(() => {
    const savedKeys = sessionStorage.getItem('convo_workbench_api_keys');
    const savedConfigs = sessionStorage.getItem('convo_workbench_task_configs');
    return {
      apiKeys: savedKeys ? JSON.parse(savedKeys) : {},
      taskConfigs: savedConfigs ? JSON.parse(savedConfigs) : DEFAULT_CONFIGS,
      availableModels: {},
    };
  });

  useEffect(() => {
    sessionStorage.setItem('convo_workbench_api_keys', JSON.stringify(state.apiKeys));
  }, [state.apiKeys]);

  useEffect(() => {
    sessionStorage.setItem('convo_workbench_task_configs', JSON.stringify(state.taskConfigs));
  }, [state.taskConfigs]);

  const setApiKey = (providerId: string, key: string) => {
    setState(prev => ({
      ...prev,
      apiKeys: { ...prev.apiKeys, [providerId]: key }
    }));
  };

  const setTaskConfig = (task: TaskType, config: TaskModelConfig) => {
    setState(prev => ({
      ...prev,
      taskConfigs: { ...prev.taskConfigs, [task]: config }
    }));
  };

  const refreshModels = async (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (!provider) return;

    try {
      const key = state.apiKeys[providerId];
      const models = await provider.fetchModels(key);
      const uniqueModels = Array.from(new Map(models.map(m => [m.id, m])).values());
      
      setState(prev => ({
        ...prev,
        availableModels: { ...prev.availableModels, [providerId]: uniqueModels }
      }));
    } catch (err) {
      console.error(`Failed to fetch models for ${providerId}:`, err);
    }
  };

  const getProvider = (id: string) => providers.find(p => p.id === id);

  return (
    <ProviderContext.Provider value={{ 
      providers, 
      apiKeys: state.apiKeys,
      taskConfigs: state.taskConfigs, 
      availableModels: state.availableModels,
      setApiKey,
      setTaskConfig,
      refreshModels,
      getProvider
    }}>
      {children}
    </ProviderContext.Provider>
  );
}

export function useProvider() {
  const context = useContext(ProviderContext);
  if (!context) throw new Error('useProvider must be used within a ProviderProvider');
  return context;
}
