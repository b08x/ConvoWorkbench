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
    <div className="w-80 border-l border-zinc-200 bg-white flex flex-col h-full p-6 space-y-8">
      <div>
        <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-4">Rating Controls</h3>
        
        <div className="space-y-6">
          {/* Correctness */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-700">Correctness</label>
            <div className="flex gap-2">
              <Button
                variant={rating.correctness === 'correct' ? 'default' : 'outline'}
                className="flex-1 h-9 gap-2"
                onClick={() => updateRating({ correctness: 'correct' })}
              >
                <Check className="w-3 h-3" /> Correct
              </Button>
              <Button
                variant={rating.correctness === 'incorrect' ? 'default' : 'outline'}
                className="flex-1 h-9 gap-2"
                onClick={() => updateRating({ correctness: 'incorrect' })}
              >
                <X className="w-3 h-3" /> Incorrect
              </Button>
            </div>
          </div>

          {/* Tone */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-700">Tone of Voice</label>
            <div className="flex gap-2">
              <Button
                variant={rating.tone === 'appropriate' ? 'default' : 'outline'}
                className="flex-1 h-9 gap-2"
                onClick={() => updateRating({ tone: 'appropriate' })}
              >
                <ThumbsUp className="w-3 h-3" /> Appropriate
              </Button>
              <Button
                variant={rating.tone === 'inappropriate' ? 'default' : 'outline'}
                className="flex-1 h-9 gap-2"
                onClick={() => updateRating({ tone: 'inappropriate' })}
              >
                <ThumbsDown className="w-3 h-3" /> Issues
              </Button>
            </div>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-700">Format</label>
            <div className="flex gap-2">
              <Button
                variant={rating.format === 'good' ? 'default' : 'outline'}
                className="flex-1 h-9 gap-2"
                onClick={() => updateRating({ format: 'good' })}
              >
                <FileText className="w-3 h-3" /> Good
              </Button>
              <Button
                variant={rating.format === 'bad' ? 'default' : 'outline'}
                className="flex-1 h-9 gap-2"
                onClick={() => updateRating({ format: 'bad' })}
              >
                <AlertCircle className="w-3 h-3" /> Bad
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col space-y-2">
        <label className="text-xs font-medium text-zinc-700">Notes</label>
        <textarea
          className="flex-1 w-full p-3 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-950 resize-none"
          placeholder="Add annotations or failure analysis..."
          value={notes}
          onChange={handleNotesChange}
        />
      </div>

      <div className="pt-4 border-t border-zinc-100">
        <div className="flex justify-between text-[10px] font-mono text-zinc-400 uppercase">
          <span>Shortcuts</span>
          <span>1-6, ←/→</span>
        </div>
      </div>
    </div>
  );
}
