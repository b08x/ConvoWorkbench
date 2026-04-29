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
  insights: 'Graph Insights',
  summary: 'Node & Chat Summaries',
  refactor: 'Refactor Recommendations',
  search: 'Query Suggestions',
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
    // Refresh models for all providers (server handles auth)
    providers.forEach(p => {
      refreshModels(p.id);
    });
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Settings</h2>
        <p className="text-muted-foreground">Configure your model providers and task-specific model selection.</p>
      </div>

      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50 border border-border/50 p-1">
          <TabsTrigger value="providers" className="gap-2 data-[state=active]:bg-brand-orange data-[state=active]:text-brand-bg transition-all">
            <ShieldCheck className="w-4 h-4" /> Provider Status
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2 data-[state=active]:bg-brand-pink data-[state=active]:text-brand-bg transition-all">
            <Settings2 className="w-4 h-4" /> Task Models
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm text-foreground">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                <ShieldCheck className="w-5 h-5 text-green-400" />
                Server-Side Key Management
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                API keys are securely handled on the server. You can configure them in the environment settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-brand-orange/5 border border-brand-orange/20 rounded-md p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-brand-orange shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The client no longer handles or stores API keys directly. All requests are proxied through the secure backend for enhanced security and lazy injection.
                </p>
              </div>

              <div className="grid gap-4">
                {providers.map((p) => (
                  <div key={p.id} className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-foreground font-medium">{p.name}</Label>
                        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                          {availableModels[p.id]?.length || 0} Models Active
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-8 gap-1 text-xs border-border/50 hover:bg-brand-orange/10 hover:text-brand-orange hover:border-brand-orange/30"
                        onClick={() => refreshModels(p.id)}
                      >
                        <RefreshCw className="w-3 h-3" /> Sync
                      </Button>
                    </div>
                    {p.id === 'ollama' && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="http://localhost:11434"
                          value={apiKeys[p.id] || ''}
                          onChange={(e) => setApiKey(p.id, e.target.value)}
                          className="h-8 bg-background/50 border-border/50 text-xs"
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2 text-[10px] uppercase font-bold"
                          onClick={() => setApiKey(p.id, '')}
                        >
                          Reset
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm text-foreground">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Task-Specific Configuration</CardTitle>
              <CardDescription className="text-muted-foreground">
                Assign specific models and parameters to different application tasks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {(Object.keys(TASK_LABELS) as TaskType[]).map((task) => {
                const config = taskConfigs[task];
                if (!config) return null;
                const models = availableModels[config.providerId] || [];

                return (
                  <div key={task} className="space-y-4 pb-6 border-b border-border/30 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm text-foreground">{TASK_LABELS[task]}</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Provider</Label>
                        <Select 
                          value={config.providerId} 
                          onValueChange={(val) => setTaskConfig(task, { ...config, providerId: val, modelId: '' })}
                        >
                          <SelectTrigger className="bg-muted/50 border-border/50 text-foreground">
                            <SelectValue placeholder="Select Provider" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {providers.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Model</Label>
                        <Select 
                          value={config.modelId} 
                          onValueChange={(val) => setTaskConfig(task, { ...config, modelId: val })}
                        >
                          <SelectTrigger className="bg-muted/50 border-border/50 text-foreground">
                            <SelectValue placeholder="Select Model" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
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
                          <Label className="text-xs text-muted-foreground">Temperature</Label>
                          <span className="text-xs font-mono text-brand-orange">{config.parameters.temperature}</span>
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
                          className="[&_[role=slider]]:bg-brand-orange [&_[role=slider]]:border-brand-orange"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Max Tokens</Label>
                        <Input 
                          type="number" 
                          value={config.parameters.maxTokens}
                          onChange={(e) => setTaskConfig(task, { 
                            ...config, 
                            parameters: { ...config.parameters, maxTokens: parseInt(e.target.value) } 
                          })}
                          className="h-8 bg-muted/50 border-border/50 focus:ring-brand-pink/50"
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
