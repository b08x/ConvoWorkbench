import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ModelProvider } from '../types/provider';
import { OpenRouterAdapter } from '../lib/providers/openrouter';

const ProviderContext = createContext<{
  provider: ModelProvider;
  apiKey: string;
  setApiKey: (key: string) => void;
} | undefined>(undefined);

export function ProviderProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState<string>(() => sessionStorage.getItem('convo_workbench_api_key') || '');
  const [provider] = useState<ModelProvider>(new OpenRouterAdapter());

  useEffect(() => {
    if (apiKey) {
      sessionStorage.setItem('convo_workbench_api_key', apiKey);
    } else {
      sessionStorage.removeItem('convo_workbench_api_key');
    }
  }, [apiKey]);

  return (
    <ProviderContext.Provider value={{ provider, apiKey, setApiKey }}>
      {children}
    </ProviderContext.Provider>
  );
}

export function useProvider() {
  const context = useContext(ProviderContext);
  if (!context) throw new Error('useProvider must be used within a ProviderProvider');
  return context;
}
