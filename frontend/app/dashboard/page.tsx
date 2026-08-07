"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { ComposeModal } from '@/components/ComposeModal';
import { EmailTable, EmailItem } from '@/components/EmailTable';
import { useSearchParams } from 'next/navigation';
import { Plus, RefreshCcw } from 'lucide-react';

const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [scheduled, setScheduled] = useState<EmailItem[]>([]);
  const [sent, setSent] = useState<EmailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>(tabParam === 'sent' ? 'sent' : 'scheduled');

  useEffect(() => {
    if (tabParam === 'sent') setActiveTab('sent');
    else if (tabParam === 'scheduled') setActiveTab('scheduled');
  }, [tabParam]);

  const fetchData = async () => {
    const token = localStorage.getItem("reachbox_token");
    if (!token) return;

    setLoading(true);
    try {
      const [scheduledRes, sentRes] = await Promise.all([
        fetch(`${apiBase}/emails/scheduled`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiBase}/emails/sent`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const scheduledData = scheduledRes.ok ? await scheduledRes.json() : { emails: [] };
      const sentData = sentRes.ok ? await sentRes.json() : { emails: [] };

      setScheduled(scheduledData.emails || []);
      setSent(sentData.emails || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Campaign Overview</h1>
          <p className="text-slate-400 mt-1">Manage your scheduled and sent email sequences.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={fetchData} className="px-3" title="Refresh">
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button variant="primary" onClick={() => setIsComposeOpen(true)} className="gap-2">
            <Plus size={18} />
            Compose Email
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">Scheduled Emails</p>
            <p className="text-4xl font-bold text-white mt-2">{scheduled.length}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <div className="w-4 h-4 rounded-full bg-indigo-400 animate-pulse" />
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">Sent Emails</p>
            <p className="text-4xl font-bold text-white mt-2">{sent.length}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <div className="w-4 h-4 rounded-full bg-emerald-400" />
          </div>
        </div>
      </div>

      {/* Tabs and Table area */}
      <div className="glass-panel rounded-2xl overflow-hidden flex flex-col">
        <div className="flex border-b border-white/10">
          <button 
            onClick={() => setActiveTab('scheduled')}
            className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'scheduled' ? 'border-indigo-400 text-white bg-white/5' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            Scheduled Queue
          </button>
          <button 
            onClick={() => setActiveTab('sent')}
            className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'sent' ? 'border-indigo-400 text-white bg-white/5' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            Sent History
          </button>
        </div>
        
        <div className="p-0">
          {activeTab === 'scheduled' ? (
            <EmailTable items={scheduled} isLoading={loading} type="scheduled" />
          ) : (
            <EmailTable items={sent} isLoading={loading} type="sent" />
          )}
        </div>
      </div>

      {/* Compose Modal */}
      <ComposeModal 
        isOpen={isComposeOpen} 
        onClose={() => setIsComposeOpen(false)} 
        onSuccess={fetchData}
        apiBase={apiBase}
        token={typeof window !== 'undefined' ? localStorage.getItem("reachbox_token") || "" : ""}
      />
    </div>
  );
}
