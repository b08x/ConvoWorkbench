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
      (filter === 'issues' && (c.rating?.tone === 'issues' || c.rating?.format === 'bad' || c.rating?.correctness === 'fail'));
    
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
    <div className="w-96 border-r border-border bg-[#0a0a0a] flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-border/10 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-9 pr-4 h-9 text-xs bg-[#1a1a1a] border border-border/10 rounded-sm focus:outline-none focus:ring-1 focus:ring-brand-orange/50 text-foreground placeholder:text-muted-foreground/50 transition-all font-mono"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-1">
          {(['all', 'unrated', 'rated', 'issues'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all border",
                filter === f 
                  ? "bg-[#e56b3f] text-white border-[#e56b3f]" 
                  : "bg-transparent text-muted-foreground border-border/10 hover:text-foreground hover:bg-white/5 whitespace-nowrap"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground/40 text-xs font-mono uppercase tracking-widest">No results</div>
        ) : (
          conversations.map((c) => {
            const firstMsg = state.messages[c.messages[0]];
            const date = c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : 'UNKNOWN DATE';
            
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={cn(
                  "w-full text-left p-4 border-b border-border/10 transition-all relative",
                  selectedId === c.id ? "bg-[#1a1a1a]" : "hover:bg-white/[0.02]"
                )}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold text-muted-foreground/60 uppercase tracking-widest">{c.source}</span>
                    <span className="text-[9px] font-mono text-muted-foreground/40 tracking-wider">• {date}</span>
                  </div>
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    !c.rating 
                      ? "bg-muted-foreground/30" 
                      : c.rating.correctness === 'correct' 
                        ? "bg-green-500 shadow-[0_0_8px_#22c55e]" 
                        : "bg-red-500 shadow-[0_0_8px_#ef4444]"
                  )} />
                </div>
                <h4 className={cn(
                  "text-xs font-medium line-clamp-2 leading-relaxed mb-1 transition-colors",
                  selectedId === c.id ? "text-brand-orange" : "text-foreground/90"
                )}>
                  {c.title || 'Untitled Conversation'}
                </h4>
                <p className="text-[10px] text-muted-foreground/40 line-clamp-2 leading-relaxed font-mono">
                  {firstMsg?.content || 'No content...'}
                </p>
                
                {selectedId === c.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-brand-orange" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
