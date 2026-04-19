import * as React from 'react';
import { useGraph } from '@/src/contexts/GraphContext';
import { useProvider } from '@/src/contexts/ProviderContext';
import { cn } from '@/src/lib/utils';
import { 
  MessageSquare, User, Bot, Clock, Tag, CheckSquare, 
  Square, Sparkles, Search, X, Loader2, Copy, FileText
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
  const { getProvider, apiKeys } = useProvider();
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
      const provider = getProvider('gemini');
      const apiKey = apiKeys['gemini'];
      if (!apiKey) throw new Error('Gemini API key required');

      const selectedMessages = Array.from(selectedIds)
        .map(id => state.messages[id])
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      const prompt = {
        system: "You are a concise summarizer. Summarize the following conversation snippet. Focus on key decisions, insights, or technical details. Use Markdown.",
        user: selectedMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')
      };

      const result = await provider.generate(prompt, apiKey, 'gemini-3-flash-preview');
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
      const provider = getProvider('gemini');
      const apiKey = apiKeys['gemini'];
      if (!apiKey) throw new Error('Gemini API key required');

      const selectedText = Array.from(selectedIds)
        .map(id => state.messages[id].content)
        .join(' ');

      const prompt = {
        system: "You are a retrieval assistant. Based on the selected text, identify key search terms or concepts that would be useful for finding related information in a large knowledge graph. Output a list of 5-7 specific keywords or short phrases.",
        user: `Selected Text: ${selectedText}`
      };

      const result = await provider.generate(prompt, apiKey, 'gemini-3-flash-preview');
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

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background text-muted-foreground">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-10" />
          <p className="font-mono uppercase tracking-widest text-xs">Select a conversation to review</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      <div className="p-6 border-b border-border flex justify-between items-center bg-card/30">
        <div>
          <h2 className="text-xl font-bold text-foreground">{conversation.title || 'Untitled Conversation'}</h2>
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {conversation.source}
            </div>
            {conversation.project_id && (
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                Project: {conversation.project_id}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-border/50 mr-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={selectAll} 
              className="text-[10px] h-7 px-2 uppercase tracking-wider hover:bg-brand-orange/10 hover:text-brand-orange"
            >
              All
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={selectUser} 
              className="text-[10px] h-7 px-2 uppercase tracking-wider hover:bg-brand-pink/10 hover:text-brand-pink"
            >
              User
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={selectAssistant} 
              className="text-[10px] h-7 px-2 uppercase tracking-wider hover:bg-brand-orange/10 hover:text-brand-orange"
            >
              Model
            </Button>
          </div>
          {selectedIds.size > 0 && (
            <Button variant="ghost" onClick={clearSelection} className="text-xs gap-2 h-8">
              <X className="w-3 h-3" /> Clear ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {conversation.messages.map((mId) => {
          const message = state.messages[mId];
          const isUser = message.role === 'user';
          const isSelected = selectedIds.has(mId);

          return (
            <div 
              key={mId} 
              className={cn(
                "flex gap-4 max-w-4xl mx-auto group relative transition-colors p-4 rounded-xl",
                isSelected ? "bg-brand-orange/5 ring-1 ring-brand-orange/20" : "hover:bg-muted/30"
              )}
              onClick={() => toggleSelection(mId)}
            >
              <div className="absolute left-[-2rem] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                {isSelected ? (
                  <CheckSquare className="w-4 h-4 text-brand-orange" />
                ) : (
                  <Square className="w-4 h-4 text-muted-foreground" />
                )}
              </div>

              <div className={cn(
                "w-8 h-8 rounded flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110",
                isUser 
                  ? "bg-brand-pink/10 text-brand-pink border border-brand-pink/20" 
                  : "bg-brand-orange/10 text-brand-orange border border-brand-orange/20"
              )}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className="flex-1 space-y-2">
                <div className={cn(
                  "text-[10px] font-mono uppercase tracking-wider flex justify-between items-center",
                  isUser ? "text-brand-pink" : "text-brand-orange"
                )}>
                  <span>{isUser ? 'User' : 'Assistant'}</span>
                  {isSelected && <span className="text-[8px] bg-brand-orange/20 px-1 rounded">Selected</span>}
                </div>
                <div className="text-sm leading-relaxed text-foreground/90 font-sans selection:bg-brand-orange/30">
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
