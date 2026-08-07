"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, LayoutDashboard, Send, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name?: string; picture?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("reachbox_token");
    if (!token) {
      router.push("/");
      return;
    }

    const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
    fetch(`${apiBase}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) throw new Error("Invalid token");
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem("reachbox_token");
        router.push("/");
      });
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem("reachbox_token");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-black/20 flex flex-col backdrop-blur-xl hidden md:flex">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            ReachInbox
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 text-white font-medium transition-all">
            <LayoutDashboard size={18} className="text-primary" />
            Dashboard
          </Link>
          <Link href="/dashboard?tab=scheduled" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <Clock size={18} />
            Scheduled
          </Link>
          <Link href="/dashboard?tab=sent" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <Send size={18} />
            Sent Campaigns
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-3">
            {user?.picture ? (
              <img src={user.picture} alt="Profile" className="w-10 h-10 rounded-full border border-white/20" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <User size={20} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full mt-2 justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={handleSignOut}>
            <LogOut size={16} className="mr-2" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden border-b border-white/10 bg-black/20 p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            ReachInbox
          </h1>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-slate-400">
            <LogOut size={18} />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
