import React, { useState } from 'react';
import { useGraph } from '@/src/contexts/GraphContext';
import { RatingFilter } from '@/src/types/rating';
import { cn } from '@/src/lib/utils';
import { Search, Filter } from 'lucide-react';

interface ConversationListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  const { state } = useGraph();
  const [filter, setFilter] = useState<RatingFilter>('all');
  const [search, setSearch] = useState('');

  const conversations = (Object.values(state.conversations) as any[]).filter((c) => {
    const matchesSearch = c.title?.toLowerCase().includes(search.toLowerCase()) || c.id.includes(search);
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'unrated' && c.rating === null) ||
      (filter === 'rated' && c.rating !== null) ||
      (filter === 'issues' && (c.rating?.tone === 'inappropriate' || c.rating?.format === 'bad'));
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="w-80 border-r border-zinc-200 bg-white flex flex-col h-full">
      <div className="p-4 border-b border-zinc-200 space-y-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-950"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 p-1 bg-zinc-100 rounded-lg">
          {(['all', 'unrated', 'rated', 'issues'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 px-2 py-1 text-[10px] font-medium uppercase tracking-wider rounded-md transition-all",
                filter === f ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm">No conversations found</div>
        ) : (
          conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={cn(
                "w-full text-left p-4 border-b border-zinc-100 transition-colors hover:bg-zinc-50",
                selectedId === c.id && "bg-zinc-50 border-l-4 border-l-zinc-900"
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">{c.source}</span>
                {c.rating && (
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    c.rating.correctness === 'correct' ? "bg-green-500" : "bg-red-500"
                  )} />
                )}
              </div>
              <h4 className="text-sm font-medium text-zinc-900 line-clamp-1">{c.title || 'Untitled Conversation'}</h4>
              <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                {state.messages[c.messages[0]]?.content.substring(0, 100)}...
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
