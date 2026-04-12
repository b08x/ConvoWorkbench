import React, { useEffect } from 'react';
import { useProvider } from '@/src/contexts/ProviderContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { Label } from '@/src/components/ui/label';
import { Slider } from '@/src/components/ui/slider';
import { AlertCircle, ShieldCheck, RefreshCw, Settings2, Key } from 'lucide-react';
import { TaskType } from '@/src/types/provider';

const TASK_LABELS: Record<TaskType, string> = {
  import: 'Conversation Import',
  review: 'Review & Rating',
  trajectory: 'Trajectory Compiler',
  distillation_weak: 'Skill Distiller (Weak Agent)',
  distillation_strong: 'Skill Distiller (Strong Agent)',
  retrieval: 'Search & Retrieval',
};

export function SettingsView() {
  const { 
    providers, 
    apiKeys, 
    taskConfigs, 
    availableModels, 
    setApiKey, 
    setTaskConfig, 
    refreshModels 
  } = useProvider();

  useEffect(() => {
    // Refresh models for providers that have keys
    providers.forEach(p => {
      if (apiKeys[p.id] || p.id === 'ollama') {
        refreshModels(p.id);
      }
    });
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-zinc-500">Configure your model providers and task-specific model selection.</p>
      </div>

      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="providers" className="gap-2"><Key className="w-4 h-4" /> Providers</TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2"><Settings2 className="w-4 h-4" /> Task Models</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                API Key Management
              </CardTitle>
              <CardDescription>
                Keys are stored in sessionStorage and cleared on tab close.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-zinc-50 border border-zinc-200 rounded-md p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-zinc-400 shrink-0" />
                <p className="text-xs text-zinc-600 leading-relaxed">
                  OpenRouter is recommended for browser-native apps. Other providers may require CORS proxies if not running locally.
                </p>
              </div>

              <div className="grid gap-6">
                {providers.map((p) => (
                  <div key={p.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`key-${p.id}`}>{p.name} {p.id === 'ollama' ? 'URL' : 'API Key'}</Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 gap-1 text-xs"
                        onClick={() => refreshModels(p.id)}
                      >
                        <RefreshCw className="w-3 h-3" /> Refresh Models
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        id={`key-${p.id}`}
                        type={p.id === 'ollama' ? 'text' : 'password'}
                        placeholder={p.id === 'ollama' ? 'http://localhost:11434' : 'sk-...'}
                        value={apiKeys[p.id] || ''}
                        onChange={(e) => setApiKey(p.id, e.target.value)}
                      />
                      <Button variant="outline" onClick={() => setApiKey(p.id, '')}>Clear</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Task-Specific Configuration</CardTitle>
              <CardDescription>
                Assign specific models and parameters to different application tasks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {(Object.keys(TASK_LABELS) as TaskType[]).map((task) => {
                const config = taskConfigs[task];
                const models = availableModels[config.providerId] || [];

                return (
                  <div key={task} className="space-y-4 pb-6 border-b border-zinc-100 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{TASK_LABELS[task]}</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-zinc-500">Provider</Label>
                        <Select 
                          value={config.providerId} 
                          onValueChange={(val) => setTaskConfig(task, { ...config, providerId: val, modelId: '' })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Provider" />
                          </SelectTrigger>
                          <SelectContent>
                            {providers.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-zinc-500">Model</Label>
                        <Select 
                          value={config.modelId} 
                          onValueChange={(val) => setTaskConfig(task, { ...config, modelId: val })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Model" />
                          </SelectTrigger>
                          <SelectContent>
                            {models.length > 0 ? (
                              models.map(m => (
                                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>No models loaded</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <Label className="text-xs text-zinc-500">Temperature</Label>
                          <span className="text-xs font-mono">{config.parameters.temperature}</span>
                        </div>
                        <Slider 
                          value={[config.parameters.temperature]} 
                          min={0} 
                          max={1} 
                          step={0.1}
                          onValueChange={(vals) => {
                            const val = Array.isArray(vals) ? vals[0] : vals;
                            setTaskConfig(task, { 
                              ...config, 
                              parameters: { ...config.parameters, temperature: val } 
                            });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-zinc-500">Max Tokens</Label>
                        <Input 
                          type="number" 
                          value={config.parameters.maxTokens}
                          onChange={(e) => setTaskConfig(task, { 
                            ...config, 
                            parameters: { ...config.parameters, maxTokens: parseInt(e.target.value) } 
                          })}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
