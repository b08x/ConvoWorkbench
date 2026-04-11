import React from 'react';
import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-white font-sans text-zinc-950">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-zinc-50/30">
        {children}
      </main>
    </div>
  );
}
