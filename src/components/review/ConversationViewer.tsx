import * as React from 'react';
import { useGraph } from '@/src/contexts/GraphContext';
import { useProvider } from '@/src/contexts/ProviderContext';
import { cn } from '@/src/lib/utils';
import { 
  MessageSquare, User, Bot, Clock, Tag, CheckSquare, 
  Square, Sparkles, Search, X, Loader2, Copy, FileText,
  Code, Layers, Info
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

interface ConversationViewerProps {
  conversationId: string | null;
}

export function ConversationViewer({ conversationId }: ConversationViewerProps) {
  const { state, dispatch } = useGraph();
  const { getProvider } = useProvider();
  const conversation = conversationId ? state.conversations[conversationId] : null;
  
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [actionResult, setActionResult] = React.useState<{ type: 'summary' | 'search', content: string } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadingText, setLoadingText] = React.useState('Analyzing');

  const verbs = ['Synthesizing', 'Distilling', 'Analyzing', 'Retrieving', 'Contextualizing', 'Extracting'];

  React.useEffect(() => {
    let interval: any;
    if (loading) {
      let i = 0;
      interval = setInterval(() => {
        setLoadingText(verbs[i % verbs.length]);
        i++;
      }, 800);
    } else {
      setLoadingText('Analyzing');
    }
    return () => clearInterval(interval);
  }, [loading]);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setActionResult(null);
  };

  const selectAll = () => {
    if (!conversation) return;
    setSelectedIds(new Set(conversation.messages));
  };

  const selectUser = () => {
    if (!conversation) return;
    const userIds = conversation.messages.filter(mId => state.messages[mId].role === 'user');
    setSelectedIds(new Set(userIds));
  };

  const selectAssistant = () => {
    if (!conversation) return;
    const assistantIds = conversation.messages.filter(mId => state.messages[mId].role === 'assistant');
    setSelectedIds(new Set(assistantIds));
  };

  const handleSummarize = async () => {
    if (selectedIds.size === 0) return;
    setLoading(true);
    try {
      const provider = getProvider('google');
      if (!provider) throw new Error('Google provider not found');

      const selectedMessages = Array.from(selectedIds)
        .map(id => state.messages[id])
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      const prompt = {
        system: "You are a concise summarizer. Summarize the following conversation snippet. Focus on key decisions, insights, or technical details. Use Markdown.",
        user: selectedMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')
      };

      const result = await provider.generate(prompt, undefined, 'gemini-3-flash-preview');
      setActionResult({ type: 'summary', content: result.text });
    } catch (err) {
      console.error(err);
      setActionResult({ type: 'summary', content: `Error: ${err instanceof Error ? err.message : 'Failed to summarize'}` });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (selectedIds.size === 0) return;
    setLoading(true);
    try {
      const provider = getProvider('google');
      if (!provider) throw new Error('Google provider not found');

      const selectedText = Array.from(selectedIds)
        .map(id => state.messages[id].content)
        .join(' ');

      const prompt = {
        system: "You are a retrieval assistant. Based on the selected text, identify key search terms or concepts that would be useful for finding related information in a large knowledge graph. Output a list of 5-7 specific keywords or short phrases.",
        user: `Selected Text: ${selectedText}`
      };

      const result = await provider.generate(prompt, undefined, 'gemini-3-flash-preview');
      setActionResult({ type: 'search', content: result.text });
    } catch (err) {
      console.error(err);
      setActionResult({ type: 'search', content: `Error: ${err instanceof Error ? err.message : 'Failed to generate search terms'}` });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToNotes = () => {
    if (!conversationId || !actionResult) return;
    
    const currentNotes = conversation?.notes || '';
    const header = actionResult.type === 'summary' ? '### AI Summary' : '### Search Terms';
    const newNotes = currentNotes 
      ? `${currentNotes}\n\n${header}\n${actionResult.content}`
      : `${header}\n${actionResult.content}`;

    dispatch({
      type: 'UPDATE_CONVERSATION_RATING',
      payload: { 
        id: conversationId, 
        rating: conversation?.rating || null, 
        notes: newNotes 
      }
    });
    setActionResult(null);
    clearSelection();
  };

  const [viewFilter, setViewFilter] = React.useState<'all' | 'user' | 'assistant'>('all');

  const filteredMessages = React.useMemo(() => {
    if (!conversation) return [];
    if (viewFilter === 'all') return conversation.messages;
    return conversation.messages.filter(mId => state.messages[mId].role === viewFilter);
  }, [conversation, viewFilter, state.messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] text-muted-foreground/20">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 mx-auto mb-6 opacity-5" />
          <p className="font-mono uppercase tracking-[0.3em] text-[10px]">Select Node to Inspect</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0a0a] overflow-hidden relative">
      <div className="p-8 border-b border-border/10 bg-[#0a0a0a]">
        <h2 className="text-xl font-bold text-foreground leading-tight">{conversation.title || 'Untitled Conversation'}</h2>
        <div className="flex gap-4 mt-6">
          {(['all', 'user', 'assistant'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setViewFilter(v)}
              className={cn(
                "px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest transition-all",
                viewFilter === v ? "text-brand-orange bg-brand-orange/10 rounded-sm" : "text-muted-foreground/40 hover:text-muted-foreground/70"
              )}
            >
              {v === 'assistant' ? 'MODEL' : v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-12 space-y-12 custom-scrollbar">
        {filteredMessages.map((mId) => {
          const message = state.messages[mId];
          if (!message) return null;
          const isUser = message.role === 'user';
          const isSelected = selectedIds.has(mId);

          return (
            <div 
              key={mId} 
              className={cn(
                "max-w-4xl group relative transition-all",
                isSelected && "bg-brand-orange/[0.02] -mx-4 px-4 rounded-sm ring-1 ring-brand-orange/10"
              )}
              onClick={() => toggleSelection(mId)}
            >
              <div className="space-y-4">
                <div className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2",
                  isUser ? "text-brand-pink/70" : "text-brand-orange/70"
                )}>
                  {isUser ? 'USER' : 'ASSISTANT'}
                  {isSelected && <span className="h-1 w-1 rounded-full bg-brand-orange animate-pulse" />}
                </div>
                <div className="text-sm leading-relaxed text-foreground/80 font-sans selection:bg-brand-orange/30 whitespace-pre-wrap">
                  <MessageContent 
                    content={message.content} 
                    artifactIds={message.artifact_ids} 
                    artifacts={state.artifacts} 
                  />
                </div>
              </div>
            </div>
          );
        })}

        {Object.values(state.artifacts).filter(a => a.conversation_id === conversationId).length > 0 && (
          <div className="max-w-4xl pt-12 pb-24 border-t border-border/10">
            <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground/30 mb-8 flex items-center gap-2 font-bold">
              <Layers className="w-3 h-3" /> Extracted Artifacts
            </h3>
            <div className="grid gap-6">
              {Object.values(state.artifacts)
                .filter(a => a.conversation_id === conversationId)
                .map(artifact => (
                  <Card key={artifact.id} className="border-border/10 bg-[#111] rounded-sm overflow-hidden group hover:border-brand-orange/20 transition-all">
                    <div className="p-6 flex items-start gap-6">
                      <div className="w-12 h-12 rounded-sm bg-muted/5 flex items-center justify-center text-muted-foreground/30 group-hover:text-brand-orange transition-colors">
                        {artifact.type === 'code' ? <Code className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-[9px] font-mono font-bold uppercase text-brand-orange/80 bg-brand-orange/5 px-2 py-0.5 rounded-sm tracking-widest border border-brand-orange/10">
                            {artifact.type}
                          </span>
                          {artifact.language && (
                            <span className="text-[9px] font-mono font-bold uppercase text-muted-foreground/40 tracking-widest">
                              {artifact.language}
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-bold text-foreground/90 mb-6 font-mono tracking-tight">
                          {artifact.title || 'Untitled Artifact'}
                        </h4>
                        <div className="bg-[#050505] border border-border/10 rounded-sm p-6 overflow-hidden">
                          <div className="max-h-96 overflow-y-auto custom-scrollbar">
                            <div className="text-xs font-mono leading-relaxed text-foreground/70">
                              <ReactMarkdown>
                                {artifact.type === 'code' ? `\`\`\`${artifact.language || ''}\n${artifact.content}\n\`\`\`` : artifact.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end mt-6">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-[10px] font-bold uppercase tracking-widest gap-2 h-8 px-4 hover:bg-white/5"
                            onClick={() => navigator.clipboard.writeText(artifact.content)}
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <Card className="bg-brand-bg/90 backdrop-blur-md border-brand-orange/30 shadow-2xl p-2 flex items-center gap-2">
              <div className="px-4 border-r border-border/50 mr-2">
                <span className="text-xs font-mono text-brand-orange">{selectedIds.size} Selected</span>
              </div>
              <Button 
                variant="ghost" 
                className="gap-2 text-xs text-zinc-100 hover:bg-brand-orange/10 hover:text-brand-orange h-8"
                onClick={handleSummarize}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {loading ? `${loadingText}...` : 'Summarize'}
              </Button>
              <Button 
                variant="ghost" 
                className="gap-2 text-xs text-zinc-100 hover:bg-brand-pink/10 hover:text-brand-pink h-8"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                {loading ? `${loadingText}...` : 'Search & Retrieve'}
              </Button>
              <Button 
                variant="ghost" 
                className="gap-2 text-xs text-zinc-400 hover:text-zinc-100 h-8"
                onClick={clearSelection}
              >
                <X className="w-3 h-3" />
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {actionResult && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-[60] bg-background/80 backdrop-blur-sm p-12 flex items-center justify-center"
          >
            <Card className="max-w-2xl w-full max-h-[80vh] flex flex-col border-brand-orange/30 bg-card shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
                <h3 className="text-sm font-mono uppercase tracking-wider text-brand-orange flex items-center gap-2">
                  {actionResult.type === 'summary' ? <Sparkles className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                  {actionResult.type === 'summary' ? 'AI Summary' : 'Search & Retrieval Terms'}
                </h3>
                <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setActionResult(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-auto p-6 prose prose-invert prose-sm max-w-none text-zinc-200">
                <ReactMarkdown>{actionResult.content}</ReactMarkdown>
              </div>
              <div className="p-4 border-t border-border flex justify-end gap-2 bg-muted/30">
                <Button 
                  variant="outline" 
                  className="text-xs gap-2 h-8 text-zinc-300 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100"
                  onClick={() => {
                    navigator.clipboard.writeText(actionResult.content);
                  }}
                >
                  <Copy className="w-3 h-3" /> Copy
                </Button>
                <Button 
                  className="text-xs bg-brand-pink text-brand-bg hover:bg-brand-pink/90 h-8"
                  onClick={handleSaveToNotes}
                >
                  <FileText className="w-3 h-3" /> Save to Notes
                </Button>
                <Button 
                  className="text-xs bg-brand-orange text-brand-bg hover:bg-brand-orange/90 h-8"
                  onClick={() => setActionResult(null)}
                >
                  Close
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MessageContent({ content, artifactIds, artifacts }: { content: string, artifactIds?: string[], artifacts: Record<string, import('@/src/types/graph').ArtifactNode> }) {
  if (!artifactIds || artifactIds.length === 0) return <div className="whitespace-pre-wrap">{content}</div>;

  const relevantArtifacts = artifactIds.map(id => artifacts[id]).filter(Boolean);
  if (relevantArtifacts.length === 0) return <div className="whitespace-pre-wrap">{content}</div>;

  // Sort by length descending to match longer strings first and prevent partial matches within matches
  const sortedArtifacts = [...relevantArtifacts].sort((a, b) => b.content.length - a.content.length);

  let parts: { text: string, artifact?: any }[] = [{ text: content }];

  sortedArtifacts.forEach(artifact => {
    const newParts: typeof parts = [];
    parts.forEach(part => {
      if (part.artifact) {
        newParts.push(part);
        return;
      }

      // Split text by artifact content, preserving the content
      // We use a simple split for now. In a more robust version, we'd handle regex escaping.
      const segments = part.text.split(artifact.content);
      segments.forEach((segment, i) => {
        if (segment) newParts.push({ text: segment });
        if (i < segments.length - 1) {
          newParts.push({ text: artifact.content, artifact });
        }
      });
    });
    parts = newParts;
  });

  return (
    <div className="whitespace-pre-wrap font-sans">
      {parts.map((part, i) => (
        part.artifact ? (
          <span 
            key={i} 
            className="inline-block bg-brand-orange/5 border border-brand-orange/20 rounded px-1 -mx-0.5 text-brand-orange/90 font-mono text-[0.95em] shadow-[0_0_15px_rgba(230,126,95,0.05)] cursor-default transition-all hover:bg-brand-orange/10 hover:border-brand-orange/40"
            title={`Artifact: ${part.artifact.title || part.artifact.type}`}
          >
            {part.text}
          </span>
        ) : (
          <span key={i}>{part.text}</span>
        )
      ))}
    </div>
  );
}
