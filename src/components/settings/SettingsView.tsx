import React from 'react';
import { useProvider } from '@/src/contexts/ProviderContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { AlertCircle, ShieldCheck } from 'lucide-react';

export function SettingsView() {
  const { apiKey, setApiKey, provider } = useProvider();

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-zinc-500">Configure your model providers and API keys.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            API Key Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-zinc-50 border border-zinc-200 rounded-md p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-zinc-400 shrink-0" />
            <p className="text-xs text-zinc-600 leading-relaxed">
              API keys are stored in <span className="font-bold">sessionStorage</span> only. 
              They will be cleared when you close this tab. We never store your keys on a server.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">OpenRouter API Key</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="sk-or-v1-..."
                  className="flex-1 px-3 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <Button variant="outline" onClick={() => setApiKey('')}>Clear</Button>
              </div>
              <p className="text-[10px] text-zinc-400">
                OpenRouter is the recommended provider as it supports direct browser calls (CORS).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Provider Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-md border border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium">{provider.name}</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 uppercase">CORS-SAFE</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
