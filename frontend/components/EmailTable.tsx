import React from 'react';
import { Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export type EmailItem = {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt?: string;
  status: string;
};

interface TableProps {
  items: EmailItem[];
  isLoading: boolean;
  type: 'scheduled' | 'sent';
}

export const EmailTable: React.FC<TableProps> = ({ items, isLoading, type }) => {
  if (isLoading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        <p className="text-sm">Loading emails...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center text-slate-500 gap-3 bg-white/5 rounded-2xl border border-white/5 border-dashed">
        {type === 'scheduled' ? <Clock size={32} className="opacity-50" /> : <Calendar size={32} className="opacity-50" />}
        <p className="text-sm">No {type} emails found.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
            <th className="px-4 py-3 font-medium">Subject</th>
            <th className="px-4 py-3 font-medium">Recipient</th>
            <th className="px-4 py-3 font-medium">{type === 'scheduled' ? 'Scheduled For' : 'Sent At'}</th>
            <th className="px-4 py-3 font-medium text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-white/5 transition-colors group">
              <td className="px-4 py-4 text-sm font-medium text-slate-200">
                <div className="truncate max-w-[200px]">{item.subject}</div>
              </td>
              <td className="px-4 py-4 text-sm text-slate-400">
                <div className="truncate max-w-[200px]">{item.recipient}</div>
              </td>
              <td className="px-4 py-4 text-sm text-slate-400 whitespace-nowrap">
                {format(new Date(type === 'scheduled' ? item.scheduledAt : (item.sentAt || item.scheduledAt)), "MMM d, yyyy • h:mm a")}
              </td>
              <td className="px-4 py-4 text-right">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                  item.status === 'SENT' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : item.status === 'FAILED'
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}>
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
