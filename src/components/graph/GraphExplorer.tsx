import React, { useState } from 'react';
import { useGraph } from '@/src/contexts/GraphContext';
import { createExecutor } from '@/src/lib/graph/query';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Network, Play, Terminal } from 'lucide-react';

export function GraphExplorer() {
  const { state } = useGraph();
  const [query, setQuery] = useState(`{
  conversations(rated: true) {
    id
    title
    rating {
      correctness
    }
  }
}`);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    setLoading(true);
    const executor = createExecutor(state);
    const res = await executor.execute(query);
    setResult(res);
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 h-full flex flex-col">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Graph Explorer</h2>
        <p className="text-zinc-500">Query the in-memory ConvoGraph via GraphQL.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <Terminal className="w-4 h-4" /> GraphQL Query
            </CardTitle>
            <Button size="sm" onClick={handleExecute} disabled={loading} className="h-8 gap-2">
              <Play className="w-3 h-3" /> Run
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <textarea
              className="w-full h-full p-6 font-mono text-sm bg-zinc-900 text-zinc-50 focus:outline-none resize-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-zinc-500">Result</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-auto bg-zinc-50">
            <pre className="p-6 text-xs font-mono text-zinc-800">
              {result ? JSON.stringify(result, null, 2) : 'No query executed yet.'}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
