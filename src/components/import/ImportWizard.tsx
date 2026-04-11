import React, { useState } from 'react';
import { useGraph } from '@/src/contexts/GraphContext';
import { parseClaudeExport, parseChatGPTExport } from '@/src/lib/graph/builder';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Upload, FileJson, CheckCircle2, AlertCircle } from 'lucide-react';

export function ImportWizard() {
  const { dispatch } = useGraph();
  const [source, setSource] = useState<'claude' | 'chatgpt' | null>(null);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'parsing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (key: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFiles(prev => ({ ...prev, [key]: content }));
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    setStatus('parsing');
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
        <h2 className="text-3xl font-bold tracking-tight">Import Conversations</h2>
        <p className="text-zinc-500">Normalize your LLM exports into a unified ConvoGraph.</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card 
          className={cn(
            "cursor-pointer transition-all hover:border-zinc-900",
            source === 'claude' && "border-zinc-900 ring-1 ring-zinc-900"
          )}
          onClick={() => setSource('claude')}
        >
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center text-white text-xs">C</div>
              Claude.ai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-500">Import conversations.json, projects.json, and memories.json.</p>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "cursor-pointer transition-all hover:border-zinc-900",
            source === 'chatgpt' && "border-zinc-900 ring-1 ring-zinc-900"
          )}
          onClick={() => setSource('chatgpt')}
        >
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center text-white text-xs">G</div>
              ChatGPT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-500">Import conversations.json export from OpenAI.</p>
          </CardContent>
        </Card>
      </div>

      {source && (
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-zinc-500">Upload Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">conversations.json (Required)</label>
                <input 
                  type="file" 
                  accept=".json"
                  onChange={(e) => e.target.files?.[0] && handleFileChange('conversations', e.target.files[0])}
                  className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-zinc-900 file:text-zinc-50 hover:file:bg-zinc-800"
                />
              </div>

              {source === 'claude' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">projects.json (Optional)</label>
                    <input 
                      type="file" 
                      accept=".json"
                      onChange={(e) => e.target.files?.[0] && handleFileChange('projects', e.target.files[0])}
                      className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 file:text-zinc-900 hover:file:bg-zinc-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">memories.json (Optional)</label>
                    <input 
                      type="file" 
                      accept=".json"
                      onChange={(e) => e.target.files?.[0] && handleFileChange('memories', e.target.files[0])}
                      className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 file:text-zinc-900 hover:file:bg-zinc-200"
                    />
                  </div>
                </>
              )}
            </div>

            <Button 
              className="w-full" 
              disabled={status === 'parsing' || !files['conversations']}
              onClick={handleImport}
            >
              {status === 'parsing' ? 'Processing...' : 'Build ConvoGraph'}
            </Button>

            {status === 'success' && (
              <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-md">
                <CheckCircle2 className="w-4 h-4" />
                Graph built successfully! Head to Review or Graph Explorer.
              </div>
            )}

            {status === 'error' && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
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

import { cn } from '@/src/lib/utils';
