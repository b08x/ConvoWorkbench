import React, { useState } from 'react';
import { useGraph } from '@/src/contexts/GraphContext';
import { useProvider } from '@/src/contexts/ProviderContext';
import { compileTrajectories, CompilationProgress } from '@/src/lib/trajectory/compiler';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Zap, Loader2, CheckCircle2, Clock, Network, Tag } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export function TrajectoryCompiler() {
  const { state, dispatch } = useGraph();
  const { getProvider, apiKeys, taskConfigs } = useProvider();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [compilationLogs, setCompilationLogs] = useState<CompilationProgress[]>([]);

  const handleCompile = async () => {
    const config = taskConfigs.trajectory;
    const provider = getProvider(config.providerId);
    const apiKey = apiKeys[config.providerId];

    if (!provider || (!apiKey && config.providerId === 'ollama')) {
      // alert handled by provider logic usually, but let's be safe
    }
    
    setLoading(true);
    setCompilationLogs([]);
    setSuccess(false);
    
    try {
      const trajectories = await compileTrajectories(state, provider, apiKey, config, {}, (progress) => {
        setCompilationLogs(prev => [progress, ...prev]);
      });
      dispatch({ type: 'ADD_TRAJECTORIES', payload: trajectories });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Compilation failed. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const currentProgress = compilationLogs[0];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Trajectory Compiler</h2>
        <p className="text-zinc-500">Group rated conversations into trajectories and extract lessons.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compile Rated Traces</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-zinc-600">
            This will analyze all rated conversations, group them by topic and quality, 
            and use the LLM to extract generalizable lessons.
          </p>
          
          {loading && currentProgress && (
            <div className="space-y-3 bg-zinc-50 p-4 rounded-lg border border-zinc-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                  <Network className="w-3 h-3" /> Compilation Progress
                </h4>
                {currentProgress.estimatedTimeRemaining !== undefined && (
                  <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    ETR: {Math.ceil(currentProgress.estimatedTimeRemaining / 1000)}s
                  </span>
                )}
                {currentProgress.estimatedTimeRemaining === undefined && (
                  <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Processing...
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-zinc-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-zinc-900 transition-all duration-500" 
                    style={{ width: `${(currentProgress.currentGroup / currentProgress.totalGroups) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-zinc-500 whitespace-nowrap">
                  Group {currentProgress.currentGroup} / {currentProgress.totalGroups}
                </span>
              </div>

              <div className="text-xs text-zinc-500 italic">
                Currently analyzing: <span className="font-semibold text-zinc-900">{currentProgress.groupLabel}</span>
              </div>
            </div>
          )}

          <Button 
            className="w-full h-12 gap-2" 
            onClick={handleCompile} 
            disabled={loading || (Object.values(state.conversations) as any[]).filter(c => c.rating).length === 0}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {loading ? 'Compiling Trajectories...' : 'Start Compilation'}
          </Button>

          {success && (
            <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-md">
              <CheckCircle2 className="w-4 h-4" />
              Trajectories compiled! Head to Distill to generate skills.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500">Compiled Trajectories</h3>
        {Object.values(state.trajectories).length === 0 ? (
          <p className="text-sm text-zinc-500 italic">No trajectories compiled yet.</p>
        ) : (
          <div className="grid gap-4">
            {(Object.values(state.trajectories) as any[]).map((t) => (
              <Card key={t.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn(
                      "text-[10px] font-mono uppercase px-2 py-0.5 rounded",
                      t.quality_signal === 'positive' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {t.quality_signal}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">{t.conversation_ids.length} traces</span>
                  </div>
                  <p className="text-sm text-zinc-800 line-clamp-3 whitespace-pre-wrap">{t.lesson}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
