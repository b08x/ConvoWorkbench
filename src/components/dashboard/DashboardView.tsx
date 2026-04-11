import React from 'react';
import { useGraph } from '@/src/contexts/GraphContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { MessageSquare, Network, Zap, CheckCircle2, AlertCircle, Upload } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';

export function DashboardView() {
  const { state } = useGraph();
  const stats = state.meta.stats;

  const cards = [
    { title: 'Conversations', value: stats.conversation_count, icon: MessageSquare, color: 'text-blue-500' },
    { title: 'Messages', value: stats.message_count, icon: Network, color: 'text-purple-500' },
    { title: 'Rated', value: stats.rated_count, icon: CheckCircle2, color: 'text-green-500' },
    { title: 'Skills Distilled', value: Object.keys(state.skills).length, icon: Zap, color: 'text-yellow-500' },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-zinc-500">Overview of your ConvoGraph and distillation progress.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={cn("h-4 w-4", card.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.conversation_count === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">No data imported yet. Head to the Import tab.</p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-zinc-600">Last import: {new Date(state.meta.imported_at).toLocaleString()}</p>
                <div className="w-full bg-zinc-100 rounded-full h-2">
                  <div 
                    className="bg-zinc-900 h-2 rounded-full transition-all" 
                    style={{ width: `${(stats.rated_count / stats.conversation_count) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-500">{stats.rated_count} of {stats.conversation_count} conversations rated</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <a href="/import"><Upload className="w-4 h-4" /> Import New Data</a>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <a href="/review"><MessageSquare className="w-4 h-4" /> Continue Reviewing</a>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <a href="/distill"><Zap className="w-4 h-4" /> Distill Skills</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
