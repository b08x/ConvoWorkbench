import React from 'react';
import { useGraph } from '@/src/contexts/GraphContext';
import { Card } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Code, FileText, Copy, Layers } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ArtifactPanelProps {
  conversationId: string | null;
}

export function ArtifactPanel({ conversationId }: ArtifactPanelProps) {
  const { state } = useGraph();
  
  const conversationArtifacts = Object.values(state?.artifacts || {}).filter(
    a => a.conversation_id === conversationId
  );

  if (!conversationArtifacts || conversationArtifacts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground border-t border-border/10">
        <div>
          <Layers className="w-8 h-8 mx-auto mb-3 opacity-20" />
          <p className="text-xs font-mono uppercase tracking-wider">No artifacts extracted</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-card overflow-hidden">
      <div className="flex-1 overflow-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
        {conversationArtifacts.map(artifact => (
          <Card key={artifact.id} className="border-border/50 bg-muted/20 backdrop-blur-sm overflow-hidden group hover:border-brand-orange/30 transition-all">
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-mono uppercase text-brand-orange bg-brand-orange/10 px-1.5 py-0.5 rounded">
                      {artifact.type}
                    </span>
                    {artifact.language && (
                      <span className="text-[9px] font-mono uppercase text-muted-foreground">
                        {artifact.language}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-semibold text-foreground truncate">
                    {artifact.title || 'Untitled Artifact'}
                  </h4>
                </div>
                <div className="w-8 h-8 rounded bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:text-brand-orange transition-colors">
                  {artifact.type === 'code' ? <Code className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                </div>
              </div>
              
              <div className="bg-brand-bg/50 border border-border/30 rounded p-3 overflow-hidden">
                <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                  <div className="text-[10px] font-mono leading-relaxed text-foreground/80">
                    <ReactMarkdown>
                      {artifact.type === 'code' ? `\`\`\`${artifact.language || ''}\n${artifact.content}\n\`\`\`` : artifact.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[10px] gap-2 h-7 px-2"
                  onClick={() => navigator.clipboard.writeText(artifact.content)}
                >
                  <Copy className="w-3 h-3" /> Copy
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
