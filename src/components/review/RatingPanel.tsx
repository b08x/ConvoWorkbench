import React, { useState, useEffect } from 'react';
import { useGraph } from '@/src/contexts/GraphContext';
import { ConversationRating } from '@/src/types/graph';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { Check, X, ThumbsUp, ThumbsDown, FileText, AlertCircle } from 'lucide-react';

interface RatingPanelProps {
  conversationId: string | null;
}

export function RatingPanel({ conversationId }: RatingPanelProps) {
  const { state, dispatch } = useGraph();
  const conversation = conversationId ? state.conversations[conversationId] : null;

  const [rating, setRating] = useState<Partial<ConversationRating>>({});
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (conversation) {
      setRating(conversation.rating || {});
      setNotes(conversation.notes || '');
    }
  }, [conversationId, conversation]);

  const updateRating = (updates: Partial<ConversationRating>) => {
    const newRating = { ...rating, ...updates } as ConversationRating;
    setRating(newRating);
    if (conversationId) {
      dispatch({
        type: 'UPDATE_CONVERSATION_RATING',
        payload: { id: conversationId, rating: newRating, notes }
      });
    }
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
    <div className="w-80 border-l border-border bg-card flex flex-col h-full p-6 space-y-8">
      <div>
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">Rating Controls</h3>
        
        <div className="space-y-6">
          {/* Correctness */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Correctness</label>
            <div className="flex gap-2">
              <Button
                variant={rating.correctness === 'correct' ? 'default' : 'outline'}
                className={cn(
                  "flex-1 h-9 gap-2 transition-all",
                  rating.correctness === 'correct' ? "bg-brand-orange text-brand-bg hover:bg-brand-orange/90" : "border-border/50 hover:bg-brand-orange/10 hover:text-brand-orange hover:border-brand-orange/50"
                )}
                onClick={() => updateRating({ correctness: 'correct' })}
              >
                <Check className="w-3 h-3" /> Correct
              </Button>
              <Button
                variant={rating.correctness === 'incorrect' ? 'default' : 'outline'}
                className={cn(
                  "flex-1 h-9 gap-2 transition-all",
                  rating.correctness === 'incorrect' ? "bg-brand-pink text-brand-bg hover:bg-brand-pink/90" : "border-border/50 hover:bg-brand-pink/10 hover:text-brand-pink hover:border-brand-pink/50"
                )}
                onClick={() => updateRating({ correctness: 'incorrect' })}
              >
                <X className="w-3 h-3" /> Incorrect
              </Button>
            </div>
          </div>

          {/* Tone */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Tone of Voice</label>
            <div className="flex gap-2">
              <Button
                variant={rating.tone === 'appropriate' ? 'default' : 'outline'}
                className={cn(
                  "flex-1 h-9 gap-2 transition-all",
                  rating.tone === 'appropriate' ? "bg-brand-orange text-brand-bg hover:bg-brand-orange/90" : "border-border/50 hover:bg-brand-orange/10 hover:text-brand-orange hover:border-brand-orange/50"
                )}
                onClick={() => updateRating({ tone: 'appropriate' })}
              >
                <ThumbsUp className="w-3 h-3" /> Appropriate
              </Button>
              <Button
                variant={rating.tone === 'inappropriate' ? 'default' : 'outline'}
                className={cn(
                  "flex-1 h-9 gap-2 transition-all",
                  rating.tone === 'inappropriate' ? "bg-brand-pink text-brand-bg hover:bg-brand-pink/90" : "border-border/50 hover:bg-brand-pink/10 hover:text-brand-pink hover:border-brand-pink/50"
                )}
                onClick={() => updateRating({ tone: 'inappropriate' })}
              >
                <ThumbsDown className="w-3 h-3" /> Issues
              </Button>
            </div>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Format</label>
            <div className="flex gap-2">
              <Button
                variant={rating.format === 'good' ? 'default' : 'outline'}
                className={cn(
                  "flex-1 h-9 gap-2 transition-all",
                  rating.format === 'good' ? "bg-brand-orange text-brand-bg hover:bg-brand-orange/90" : "border-border/50 hover:bg-brand-orange/10 hover:text-brand-orange hover:border-brand-orange/50"
                )}
                onClick={() => updateRating({ format: 'good' })}
              >
                <FileText className="w-3 h-3" /> Good
              </Button>
              <Button
                variant={rating.format === 'bad' ? 'default' : 'outline'}
                className={cn(
                  "flex-1 h-9 gap-2 transition-all",
                  rating.format === 'bad' ? "bg-brand-pink text-brand-bg hover:bg-brand-pink/90" : "border-border/50 hover:bg-brand-pink/10 hover:text-brand-pink hover:border-brand-pink/50"
                )}
                onClick={() => updateRating({ format: 'bad' })}
              >
                <AlertCircle className="w-3 h-3" /> Bad
              </Button>
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
