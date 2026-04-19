import React, { useState } from 'react';
import { useGraph } from '@/src/contexts/GraphContext';
import { useProvider } from '@/src/contexts/ProviderContext';
import { parseClaudeExport, parseChatGPTExport } from '@/src/lib/graph/builder';
import { extractTopics, TopicExtractionProgress } from '@/src/lib/graph/topic_extraction';
import { ConversationNode } from '@/src/types/graph';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Upload, FileJson, CheckCircle2, AlertCircle, Loader2, Network, Clock, Tag } from 'lucide-react';
import { Checkbox } from '@/src/components/ui/checkbox';
import { Label } from '@/src/components/ui/label';
import { cn } from '@/src/lib/utils';

export function ImportWizard() {
  const { dispatch } = useGraph();
  const { getProvider, apiKeys, taskConfigs } = useProvider();
  const [source, setSource] = useState<'claude' | 'chatgpt' | null>(null);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'parsing' | 'extracting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [shouldExtractTopics, setShouldExtractTopics] = useState(false);
  const [topicLogs, setTopicLogs] = useState<TopicExtractionProgress[]>([]);

  const handleFileChange = (key: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFiles(prev => ({ ...prev, [key]: content }));
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setStatus('parsing');
    setTopicLogs([]);
    try {
      let graph;
      if (source === 'claude') {
        if (!files['conversations']) throw new Error('conversations.json is required');
        graph = parseClaudeExport(files['conversations'], files['projects'], files['memories']);
      } else if (source === 'chatgpt') {
        if (!files['conversations']) throw new Error('conversations.json is required');
        graph = parseChatGPTExport(files['conversations']);
      } else {
        throw new Error('Please select a source');
      }

      if (shouldExtractTopics) {
        setStatus('extracting');
        const config = taskConfigs.import;
        const provider = getProvider(config.providerId);
        const apiKey = apiKeys[config.providerId];
        
        if (provider && (apiKey || config.providerId === 'ollama')) {
          const conversations = Object.values(graph.conversations).slice(0, 50) as ConversationNode[]; // Limit for v1
          const topics = await extractTopics(conversations, provider, apiKey, config, (progress) => {
            setTopicLogs(prev => [progress, ...prev]);
          });
          topics.forEach(t => {
            graph.topics[t.id] = t;
          });
        }
      }

      dispatch({ type: 'SET_GRAPH', payload: graph });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Import Conversations</h2>
        <p className="text-muted-foreground">Normalize your LLM exports into a unified ConvoGraph.</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card 
          className={cn(
            "cursor-pointer transition-all border-border/50 bg-card/50 backdrop-blur-sm hover:border-brand-orange/50",
            source === 'claude' && "border-brand-orange ring-1 ring-brand-orange bg-brand-orange/5"
          )}
          onClick={() => setSource('claude')}
        >
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <div className="w-8 h-8 rounded bg-brand-orange flex items-center justify-center text-brand-bg text-xs font-bold">C</div>
              Claude.ai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Import conversations.json, projects.json, and memories.json.</p>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "cursor-pointer transition-all border-border/50 bg-card/50 backdrop-blur-sm hover:border-brand-pink/50",
            source === 'chatgpt' && "border-brand-pink ring-1 ring-brand-pink bg-brand-pink/5"
          )}
          onClick={() => setSource('chatgpt')}
        >
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <div className="w-8 h-8 rounded bg-brand-pink flex items-center justify-center text-brand-bg text-xs font-bold">G</div>
              ChatGPT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Import conversations.json export from OpenAI.</p>
          </CardContent>
        </Card>
      </div>

      {source && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Upload Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">conversations.json (Required)</label>
                <input 
                  type="file" 
                  accept=".json"
                  onChange={(e) => e.target.files?.[0] && handleFileChange('conversations', e.target.files[0])}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 transition-all"
                />
              </div>

              {source === 'claude' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">projects.json (Optional)</label>
                    <input 
                      type="file" 
                      accept=".json"
                      onChange={(e) => e.target.files?.[0] && handleFileChange('projects', e.target.files[0])}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-muted file:text-foreground hover:file:bg-muted/80 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">memories.json (Optional)</label>
                    <input 
                      type="file" 
                      accept=".json"
                      onChange={(e) => e.target.files?.[0] && handleFileChange('memories', e.target.files[0])}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-muted file:text-foreground hover:file:bg-muted/80 transition-all"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-border/50">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="extract-topics" 
                  checked={shouldExtractTopics}
                  onCheckedChange={(checked) => setShouldExtractTopics(checked as boolean)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="extract-topics" className="text-sm font-medium text-foreground">
                    Extract Topics using LLM
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Uses the model configured for "Conversation Import" in Settings.
                  </p>
                </div>
              </div>
            </div>

            {topicLogs.length > 0 && (
              <div className="space-y-3 bg-muted/30 p-4 rounded-lg border border-border/50">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Network className="w-3 h-3" /> Extraction Progress
                  </h4>
                  {topicLogs[0]?.estimatedTimeRemaining !== undefined && (
                    <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      ETR: {Math.ceil(topicLogs[0].estimatedTimeRemaining / 1000)}s
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-orange transition-all duration-500 shadow-[0_0_10px_rgba(230,126,95,0.5)]" 
                      style={{ width: topicLogs[0] ? `${(topicLogs[0].currentBatch / topicLogs[0].totalBatches) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                    Batch {topicLogs[0]?.currentBatch || 0} / {topicLogs[0]?.totalBatches || 0}
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {topicLogs.filter(log => log.topic).map((log, i) => (
                    <div key={i} className="text-xs border-l-2 border-brand-pink/50 pl-3 py-1 space-y-1">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="font-mono text-[10px] uppercase text-brand-pink">Topic Extracted</span>
                      </div>
                      <div className="font-semibold text-foreground flex items-center gap-1">
                        <Tag className="w-3 h-3 text-brand-orange" />
                        {log.topic?.label}
                      </div>
                      <div className="text-muted-foreground italic">
                        {log.convoTitles?.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(230,126,95,0.2)]" 
              disabled={status === 'parsing' || status === 'extracting' || !files['conversations']}
              onClick={handleImport}
            >
              {(status === 'parsing' || status === 'extracting') ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {status === 'parsing' ? 'Parsing Files...' : 'Extracting Topics...'}
                </span>
              ) : 'Build ConvoGraph'}
            </Button>

            {status === 'success' && (
              <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 p-3 rounded-md border border-green-500/20">
                <CheckCircle2 className="w-4 h-4" />
                Graph built successfully! Head to Review or Graph Explorer.
              </div>
            )}

            {status === 'error' && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-md border border-red-500/20">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
