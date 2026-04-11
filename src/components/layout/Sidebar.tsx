import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Upload, 
  MessageSquare, 
  Network, 
  Zap, 
  Download, 
  Settings 
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/import', icon: Upload, label: 'Import' },
  { to: '/review', icon: MessageSquare, label: 'Review' },
  { to: '/graph', icon: Network, label: 'Graph' },
  { to: '/distill', icon: Zap, label: 'Distill' },
  { to: '/export', icon: Download, label: 'Export' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  return (
    <div className="w-64 border-r border-zinc-200 bg-zinc-50/50 flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">ConvoWorkbench</h1>
        <p className="text-xs text-zinc-500 mt-1 font-mono uppercase tracking-widest">Trace2Skill Engine</p>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isActive 
                ? "bg-zinc-900 text-zinc-50" 
                : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-zinc-200">
        <div className="bg-zinc-100 rounded-md p-3">
          <p className="text-[10px] text-zinc-500 font-mono uppercase">Session Stats</p>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Rated</span>
              <span className="font-medium">0</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Skills</span>
              <span className="font-medium">0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
