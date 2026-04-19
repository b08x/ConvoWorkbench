import * as React from 'react';
import { useGraph } from '@/src/contexts/GraphContext';
import { useProvider } from '@/src/contexts/ProviderContext';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Sparkles, Loader2, BrainCircuit, Volume2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { TopicNode, SkillNode } from '@/src/types/graph';
import { cn } from '@/src/lib/utils';

export function GraphInsights() {
  const { state } = useGraph();
  const { getProvider, apiKeys } = useProvider();
  const [insight, setInsight] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [speaking, setSpeaking] = React.useState(false);

  const playAudio = async (base64: string) => {
    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const int16Data = new Int16Array(bytes.buffer);
      const float32Data = new Float32Array(int16Data.length);
      for (let i = 0; i < int16Data.length; i++) {
        float32Data[i] = int16Data[i] / 32768;
      }
      
      const buffer = audioContext.createBuffer(1, float32Data.length, 24000);
      buffer.getChannelData(0).set(float32Data);
      
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.onended = () => setSpeaking(false);
      source.start();
    } catch (err) {
      console.error('Audio playback failed:', err);
      setSpeaking(false);
    }
  };

  const handleSpeak = async () => {
    if (!insight || speaking) return;
    setSpeaking(true);
    try {
      const provider = getProvider('gemini');
      const apiKey = apiKeys['gemini'];
      if (!apiKey || !provider.speak) throw new Error('TTS not available');

      // Strip markdown for better TTS
      const cleanText = insight.replace(/[#*`]/g, '').slice(0, 2000); // Limit length for TTS
      const base64 = await provider.speak(cleanText, apiKey);
      await playAudio(base64);
    } catch (err) {
      console.error(err);
      setSpeaking(false);
    }
  };

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
        <div className="flex gap-2">
          {insight && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-border/50 hover:bg-brand-orange/10 hover:text-brand-orange"
              onClick={handleSpeak}
              disabled={speaking}
            >
              <Volume2 className={cn("w-4 h-4", speaking && "animate-pulse text-brand-orange")} />
            </Button>
          )}
          <Button 
            onClick={generateInsights} 
            disabled={loading} 
            className="h-8 gap-2 bg-brand-orange text-brand-bg hover:bg-brand-orange/90"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Generate
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-6">
        {insight ? (
          <div className="text-sm text-foreground/90 leading-relaxed space-y-4">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-lg font-semibold text-brand-orange mt-6 mb-2 border-b border-brand-orange/20 pb-1">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-medium text-brand-pink mt-4 mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-medium text-foreground mt-3 mb-1">{children}</h3>,
                p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 mb-3">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 mb-3">{children}</ol>,
                li: ({ children }) => <li className="pl-1">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-brand-orange/90">{children}</strong>,
                code: ({ children }) => <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-brand-pink">{children}</code>,
                blockquote: ({ children }) => <blockquote className="border-l-2 border-brand-orange/30 pl-4 italic text-muted-foreground my-4">{children}</blockquote>,
              }}
            >
              {insight}
            </ReactMarkdown>
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
