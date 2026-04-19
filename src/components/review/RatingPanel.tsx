import React, { useState, useEffect } from 'react';
import { useGraph } from '@/src/contexts/GraphContext';
import { ConversationRating } from '@/src/types/graph';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { 
  Check, X, ThumbsUp, ThumbsDown, FileText, AlertCircle, 
  Minus, Hash, MessageSquare, Zap, Ghost, Smile, RefreshCw
} from 'lucide-react';

interface RatingPanelProps {
  conversationId: string | null;
}

const STYLE_OPTIONS = [
  { id: 'too_long', label: 'Too Long', icon: Hash },
  { id: 'too_concise', label: 'Too Concise', icon: MessageSquare },
  { id: 'sycophantic', label: 'Sycophantic', icon: Smile },
  { id: 'caustic', label: 'Caustic', icon: Zap },
  { id: 'repetitive', label: 'Repetitive', icon: RefreshCw },
  { id: 'hallucination', label: 'Hallucination', icon: Ghost },
];

export function RatingPanel({ conversationId }: RatingPanelProps) {
  const { state, dispatch } = useGraph();
  const conversation = conversationId ? state.conversations[conversationId] : null;

  const [rating, setRating] = useState<Partial<ConversationRating>>({
    style_tags: []
  });
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (conversation) {
      setRating(conversation.rating || { style_tags: [] });
      setNotes(conversation.notes || '');
    }
  }, [conversationId, conversation]);

  const updateRating = (updates: Partial<ConversationRating>) => {
    const newRating = { 
      ...rating, 
      ...updates,
      style_tags: updates.style_tags || rating.style_tags || [],
      rated_at: Date.now()
    } as ConversationRating;
    
    setRating(newRating);
    if (conversationId) {
      dispatch({
        type: 'UPDATE_CONVERSATION_RATING',
        payload: { id: conversationId, rating: newRating, notes }
      });
    }
  };

  const toggleStyleTag = (tag: string) => {
    const currentTags = rating.style_tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    updateRating({ style_tags: newTags });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    if (conversationId) {
      dispatch({
        type: 'UPDATE_CONVERSATION_RATING',
        payload: { id: conversationId, rating: rating as ConversationRating, notes: e.target.value }
      });
    }
  };

  if (!conversation) return null;

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col h-full p-6 space-y-8 overflow-y-auto scrollbar-none">
      <div>
        <h3 className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] mb-6">Rating Controls</h3>
        
        <div className="space-y-8">
          {/* Correctness */}
          <div className="space-y-3">
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">Correctness</label>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                className={cn(
                  "flex-1 h-8 text-[10px] gap-1.5 transition-all border-border/30",
                  rating.correctness === 'correct' 
                    ? "bg-brand-orange/20 text-brand-orange border-brand-orange/40" 
                    : "hover:bg-muted/50 text-muted-foreground"
                )}
                onClick={() => updateRating({ correctness: 'correct' })}
              >
                <Check className="w-3 h-3" /> Correct
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 h-8 text-[10px] gap-1.5 transition-all border-border/30",
                  rating.correctness === 'neutral' 
                    ? "bg-muted text-foreground border-muted-foreground/30" 
                    : "hover:bg-muted/50 text-muted-foreground"
                )}
                onClick={() => updateRating({ correctness: 'neutral' })}
              >
                <Minus className="w-3 h-3" /> N/A
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 h-8 text-[10px] gap-1.5 transition-all border-border/30",
                  rating.correctness === 'incorrect' 
                    ? "bg-brand-pink/20 text-brand-pink border-brand-pink/40" 
                    : "hover:bg-muted/50 text-muted-foreground"
                )}
                onClick={() => updateRating({ correctness: 'incorrect' })}
              >
                <X className="w-3 h-3" /> Fail
              </Button>
            </div>
          </div>

          {/* Tone */}
          <div className="space-y-3">
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">Tone of Voice</label>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                className={cn(
                  "flex-1 h-8 text-[10px] gap-1.5 transition-all border-border/30",
                  rating.tone === 'appropriate' 
                    ? "bg-brand-orange/20 text-brand-orange border-brand-orange/40" 
                    : "hover:bg-muted/50 text-muted-foreground"
                )}
                onClick={() => updateRating({ tone: 'appropriate' })}
              >
                <ThumbsUp className="w-3 h-3" /> Good
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 h-8 text-[10px] gap-1.5 transition-all border-border/30",
                  rating.tone === 'neutral' 
                    ? "bg-muted text-foreground border-muted-foreground/30" 
                    : "hover:bg-muted/50 text-muted-foreground"
                )}
                onClick={() => updateRating({ tone: 'neutral' })}
              >
                <Minus className="w-3 h-3" /> N/A
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 h-8 text-[10px] gap-1.5 transition-all border-border/30",
                  rating.tone === 'inappropriate' 
                    ? "bg-brand-pink/20 text-brand-pink border-brand-pink/40" 
                    : "hover:bg-muted/50 text-muted-foreground"
                )}
                onClick={() => updateRating({ tone: 'inappropriate' })}
              >
                <ThumbsDown className="w-3 h-3" /> Issues
              </Button>
            </div>
          </div>

          {/* Format */}
          <div className="space-y-3">
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">Format</label>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                className={cn(
                  "flex-1 h-8 text-[10px] gap-1.5 transition-all border-border/30",
                  rating.format === 'good' 
                    ? "bg-brand-orange/20 text-brand-orange border-brand-orange/40" 
                    : "hover:bg-muted/50 text-muted-foreground"
                )}
                onClick={() => updateRating({ format: 'good' })}
              >
                <FileText className="w-3 h-3" /> Good
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 h-8 text-[10px] gap-1.5 transition-all border-border/30",
                  rating.format === 'neutral' 
                    ? "bg-muted text-foreground border-muted-foreground/30" 
                    : "hover:bg-muted/50 text-muted-foreground"
                )}
                onClick={() => updateRating({ format: 'neutral' })}
              >
                <Minus className="w-3 h-3" /> N/A
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 h-8 text-[10px] gap-1.5 transition-all border-border/30",
                  rating.format === 'bad' 
                    ? "bg-brand-pink/20 text-brand-pink border-brand-pink/40" 
                    : "hover:bg-muted/50 text-muted-foreground"
                )}
                onClick={() => updateRating({ format: 'bad' })}
              >
                <AlertCircle className="w-3 h-3" /> Bad
              </Button>
            </div>
          </div>

          {/* Style Tags */}
          <div className="space-y-3">
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">Style Judgement</label>
            <div className="grid grid-cols-2 gap-1.5">
              {STYLE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = rating.style_tags?.includes(opt.id);
                return (
                  <Button
                    key={opt.id}
                    variant="outline"
                    className={cn(
                      "h-8 text-[10px] justify-start gap-2 transition-all border-border/30",
                      isActive 
                        ? "bg-brand-pink/10 text-brand-pink border-brand-pink/30" 
                        : "hover:bg-muted/50 text-muted-foreground"
                    )}
                    onClick={() => toggleStyleTag(opt.id)}
                  >
                    <Icon className="w-3 h-3" />
                    {opt.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Notes</label>
        <textarea
          className="flex-1 w-full p-3 text-sm bg-muted/30 border border-border/50 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-orange/50 text-foreground placeholder:text-muted-foreground resize-none transition-all"
          placeholder="Add annotations or failure analysis..."
          value={notes}
          onChange={handleNotesChange}
        />
      </div>

      <div className="pt-4 border-t border-border/50">
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground uppercase">
          <span>Shortcuts</span>
          <span className="text-brand-pink">1-6, ←/→</span>
        </div>
      </div>
    </div>
  );
}
