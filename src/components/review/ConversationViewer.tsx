import React from 'react';
import { useGraph } from '@/src/contexts/GraphContext';
import { cn } from '@/src/lib/utils';
import { MessageSquare, User, Bot, Clock, Tag } from 'lucide-react';

interface ConversationViewerProps {
  conversationId: string | null;
}

export function ConversationViewer({ conversationId }: ConversationViewerProps) {
  const { state } = useGraph();
  const conversation = conversationId ? state.conversations[conversationId] : null;

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
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
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
      </div>
      <div className="flex-1 overflow-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {conversation.messages.map((mId) => {
          const message = state.messages[mId];
          const isUser = message.role === 'user';
          return (
            <div key={mId} className={cn(
              "flex gap-4 max-w-4xl mx-auto group",
              isUser ? "flex-row" : "flex-row"
            )}>
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
                  "text-[10px] font-mono uppercase tracking-wider",
                  isUser ? "text-brand-pink" : "text-brand-orange"
                )}>
                  {isUser ? 'User' : 'Assistant'}
                </div>
                <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap font-sans selection:bg-brand-orange/30">
                  {message.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
