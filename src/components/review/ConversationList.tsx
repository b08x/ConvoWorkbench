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
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  const conversations = (Object.values(state.conversations) as any[]).filter((c) => {
    const matchesSearch = c.title?.toLowerCase().includes(search.toLowerCase()) || c.id.includes(search);
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'unrated' && c.rating === null) ||
      (filter === 'rated' && c.rating !== null) ||
      (filter === 'issues' && (c.rating?.tone === 'inappropriate' || c.rating?.format === 'bad')) ||
      (filter === 'artifacts' && c.messages.some(mId => {
        const msg = state.messages[mId];
        return msg?.artifact_ids && msg.artifact_ids.length > 0;
      }));
    
    let matchesDate = true;
    if (c.created_at) {
      if (dateRange.start) {
        matchesDate = matchesDate && c.created_at >= new Date(dateRange.start).getTime();
      }
      if (dateRange.end) {
        matchesDate = matchesDate && c.created_at <= new Date(dateRange.end).getTime();
      }
    } else if (dateRange.start || dateRange.end) {
      matchesDate = false; // If filtering by date but convo has no date
    }

    return matchesSearch && matchesFilter && matchesDate;
  });

  return (
    <div className="w-80 border-r border-border bg-card flex flex-col h-full">
      <div className="p-4 border-b border-border space-y-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted/50 border border-border/50 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-orange/50 text-foreground placeholder:text-muted-foreground"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-mono uppercase text-muted-foreground">Date Range</label>
            {(dateRange.start || dateRange.end) && (
              <button 
                onClick={() => setDateRange({ start: '', end: '' })}
                className="text-[10px] text-brand-orange hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input 
              type="date" 
              className="bg-muted/30 border border-border/50 rounded px-2 py-1 text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-brand-orange/30"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
            <input 
              type="date" 
              className="bg-muted/30 border border-border/50 rounded px-2 py-1 text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-brand-orange/30"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex gap-1 p-1 bg-muted rounded-lg border border-border/30">
          {(['all', 'unrated', 'rated', 'issues', 'artifacts'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 px-2 py-1 text-[10px] font-medium uppercase tracking-wider rounded-md transition-all",
                filter === f ? "bg-brand-orange text-brand-bg shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No conversations found</div>
        ) : (
          conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={cn(
                "w-full text-left p-4 border-b border-border/30 transition-all hover:bg-muted/30",
                selectedId === c.id && "bg-muted/50 border-l-4 border-l-brand-orange"
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">{c.source}</span>
                {c.rating && (
                  <div className={cn(
                    "w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]",
                    c.rating.correctness === 'correct' ? "bg-green-400 text-green-400" : "bg-red-400 text-red-400"
                  )} />
                )}
              </div>
              <h4 className={cn(
                "text-sm font-medium line-clamp-1 transition-colors",
                selectedId === c.id ? "text-brand-orange" : "text-foreground"
              )}>{c.title || 'Untitled Conversation'}</h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 italic">
                {state.messages[c.messages[0]]?.content.substring(0, 100)}...
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
