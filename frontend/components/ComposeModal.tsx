import React, { useState, useRef } from 'react';
import { Button } from './ui/Button';
import { Input, Textarea } from './ui/Input';
import { X, UploadCloud, CheckCircle2 } from 'lucide-react';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  apiBase: string;
  token: string;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({ isOpen, onClose, onSuccess, apiBase, token }) => {
  const [form, setForm] = useState({ 
    recipient: "", 
    subject: "", 
    body: "", 
    scheduledAt: "", 
    delayMs: 2000, 
    hourlyLimit: 200 
  });
  const [csvCount, setCsvCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const emails = text
        .split(/[\n,;]+/)
        .map(e => e.trim())
        .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
      
      setForm(prev => ({
        ...prev,
        recipient: Array.from(new Set([...prev.recipient.split(",").map(i => i.trim()).filter(Boolean), ...emails])).join(", ")
      }));
      setCsvCount(emails.length);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${apiBase}/emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to schedule email");
      }

      setForm({ recipient: "", subject: "", body: "", scheduledAt: "", delayMs: 2000, hourlyLimit: 200 });
      setCsvCount(0);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="glass-panel relative w-full max-w-2xl rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-white tracking-tight">Compose Campaign</h2>
            <p className="text-sm text-slate-400 mt-1">Schedule a single email or a bulk CSV batch.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto pr-2 custom-scrollbar flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Textarea
              label="Recipients (comma separated)"
              value={form.recipient}
              onChange={(e) => setForm({ ...form, recipient: e.target.value })}
              placeholder="john@example.com, jane@example.com"
              required
              rows={2}
            />

            <div className="relative overflow-hidden rounded-xl border border-dashed border-white/20 bg-white/5 p-4 transition-all hover:bg-white/10 flex flex-col items-center justify-center gap-2 group">
              <input
                type="file"
                accept=".csv,.txt"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              <UploadCloud className="text-slate-400 group-hover:text-indigo-400 transition-colors" size={24} />
              <div className="text-center">
                <p className="text-sm font-medium text-slate-300">Drop a CSV or TXT file here</p>
                <p className="text-xs text-slate-500 mt-1">Or click to browse</p>
              </div>
              {csvCount > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full mt-2">
                  <CheckCircle2 size={14} />
                  Found {csvCount} valid emails
                </div>
              )}
            </div>

            <Input
              label="Subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              required
            />

            <Textarea
              label="Message Body"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              required
              rows={5}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-black/20 border border-white/5">
              <Input
                label="Start Time"
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                required
              />
              <Input
                label="Delay (ms)"
                type="number"
                min="0"
                value={form.delayMs}
                onChange={(e) => setForm({ ...form, delayMs: Number(e.target.value) })}
                required
              />
              <Input
                label="Hourly Limit"
                type="number"
                min="1"
                value={form.hourlyLimit}
                onChange={(e) => setForm({ ...form, hourlyLimit: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-background/50 backdrop-blur-md pb-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Schedule Emails
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
