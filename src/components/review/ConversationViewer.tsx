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
      <div className="flex-1 flex items-center justify-center bg-zinc-50 text-zinc-400">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Select a conversation to review</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      <div className="p-6 border-b border-zinc-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">{conversation.title || 'Untitled Conversation'}</h2>
          <div className="flex gap-4 mt-2 text-xs text-zinc-500">
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
      <div className="flex-1 overflow-auto p-6 space-y-8">
        {conversation.messages.map((mId) => {
          const message = state.messages[mId];
          const isUser = message.role === 'user';
          return (
            <div key={mId} className={cn(
              "flex gap-4 max-w-4xl mx-auto",
              isUser ? "flex-row" : "flex-row"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                isUser ? "bg-zinc-100 text-zinc-600" : "bg-zinc-900 text-zinc-50"
              )}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className="flex-1 space-y-2">
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  {isUser ? 'Customer' : 'Bot'}
                </div>
                <div className="text-sm leading-relaxed text-zinc-800 whitespace-pre-wrap">
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
