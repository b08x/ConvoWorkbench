import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Upload, 
  MessageSquare, 
  Network, 
  Zap, 
  Download, 
  Settings,
  Menu,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';

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
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div 
      className={cn(
        "border-r border-border bg-card flex flex-col h-full transition-all duration-300 relative group",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "absolute -right-4 top-6 h-8 w-8 rounded-full border border-border bg-card shadow-md z-50 opacity-0 group-hover:opacity-100 transition-opacity",
          collapsed && "opacity-100"
        )}
      >
        {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </Button>

      <div className={cn("p-6 overflow-hidden whitespace-nowrap", collapsed && "p-4")}>
        {!collapsed ? (
          <>
            <h1 className="text-xl font-bold tracking-tight text-foreground">ConvoWorkbench</h1>
            <p className="text-xs text-muted-foreground mt-1 font-mono uppercase tracking-widest">Trace2Skill Engine</p>
          </>
        ) : (
          <div className="w-8 h-8 rounded bg-brand-orange flex items-center justify-center text-brand-bg text-xs font-bold mx-auto">CW</div>
        )}
      </div>

      <nav className="flex-1 px-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
              collapsed ? "justify-center px-0" : "",
              isActive 
                ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(230,126,95,0.3)]" 
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className={cn("p-4 border-t border-border", collapsed && "p-2")}>
        {!collapsed ? (
          <div className="bg-muted/50 rounded-md p-3 border border-border/50">
            <p className="text-[10px] text-muted-foreground font-mono uppercase">Session Stats</p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Rated</span>
                <span className="font-medium text-foreground">0</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Skills</span>
                <span className="font-medium text-foreground">0</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div className="w-1/3 h-full bg-brand-orange" />
          </div>
        )}
      </div>
    </div>
  );
}
