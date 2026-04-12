import React, { useState } from 'react';
import { useGraph } from '@/src/contexts/GraphContext';
import { useProvider } from '@/src/contexts/ProviderContext';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Sparkles, Loader2, BrainCircuit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { TopicNode, SkillNode } from '@/src/types/graph';

export function GraphInsights() {
  const { state } = useGraph();
  const { getProvider, apiKeys } = useProvider();
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const provider = getProvider('gemini');
      const apiKey = apiKeys['gemini'];
      
      if (!apiKey) {
        throw new Error('Gemini API key not found in Settings.');
      }

      // Prepare a summary of the graph for Gemini
      const summary = {
        stats: state.meta.stats,
        topics: (Object.values(state.topics) as TopicNode[]).map(t => ({ label: t.label, count: t.conversation_ids.length })),
        skills: (Object.values(state.skills) as SkillNode[]).map(s => s.title),
        trajectories: Object.values(state.trajectories).length
      };

      const prompt = {
        system: "You are a Graph Intelligence Analyst. Analyze the provided ConvoGraph summary and provide deep insights into the clusters, identified skills, and potential knowledge gaps. Use professional, technical language. Format with Markdown.",
        user: `Graph Summary: ${JSON.stringify(summary, null, 2)}
        
        Please provide:
        1. A high-level overview of the knowledge distribution.
        2. Analysis of the topic clusters.
        3. Evaluation of the distilled skills.
        4. Recommendations for further exploration or distillation.`
      };

      const result = await provider.generate(prompt, apiKey, 'gemini-3-flash-preview');
      setInsight(result.text);
    } catch (err) {
      console.error(err);
      setInsight(`Error: ${err instanceof Error ? err.message : 'Failed to generate insights'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full flex flex-col overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-brand-orange" /> Gemini Graph Insights
        </CardTitle>
        <Button 
          onClick={generateInsights} 
          disabled={loading} 
          className="h-8 gap-2 bg-brand-orange text-brand-bg hover:bg-brand-orange/90"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Generate
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-6">
        {insight ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{insight}</ReactMarkdown>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <BrainCircuit className="w-12 h-12 text-brand-orange" />
            <p className="text-sm text-muted-foreground max-w-xs">
              Click generate to have Gemini analyze your ConvoGraph structure and provide strategic insights.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
