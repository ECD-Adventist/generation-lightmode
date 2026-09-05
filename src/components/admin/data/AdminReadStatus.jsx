import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
export default function AdminReadStatus({ loading, error, readAt, onRefresh, message, t }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs" style={{ background: t.surface, borderColor: t.border, color: t.textSecondary }}>
      <div role={error ? 'alert' : 'status'} className="flex items-center gap-2">
        {loading && <Loader2 size={14} className="animate-spin shrink-0" />}
        <span>{error ? 'The database read was interrupted; previously loaded records are retained.' : message || (loading ? 'Reading the database…' : 'Database read complete')}
          {readAt && <span className="ml-2">Last read: {new Date(readAt).toLocaleTimeString()}</span>}
        </span>
      </div>
      <button type="button" disabled={loading} onClick={onRefresh} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 font-semibold disabled:opacity-50" style={{ borderColor: t.border, color: t.accent }}>
        <RefreshCw size={13} />{error ? 'Retry' : 'Refresh'}
      </button>
    </div>
  );
}