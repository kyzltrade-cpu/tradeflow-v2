'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────

type DraftStatus = 'draft' | 'pending_approval' | 'approved' | 'sent' | 'rejected' | 'failed';

interface Draft {
  id: string;
  channel: 'email' | 'whatsapp';
  to_address: string;
  subject: string;
  body: string;
  ai_reasoning: string;
  citations: { field: string; source: string; confidence: number; snippet: string }[];
  draft_status: DraftStatus;
  ai_generated: boolean;
  inquiry_id?: string;
  created_at: string;
  approved_at?: string;
  sent_at?: string;
}

// ─── Components ──────────────────────────────────────────────

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 0.9 ? '#038153' : value >= 0.7 ? '#D97706' : '#CC3340';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full" style={{ width: `${value * 100}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono" style={{ color }}>{Math.round(value * 100)}%</span>
    </div>
  );
}

function StatusPill({ status }: { status: DraftStatus }) {
  const map: Record<DraftStatus, { label: string; bg: string; fg: string; border: string }> = {
    draft: { label: 'Draft', bg: '#F3F4F6', fg: '#6B7280', border: '#D1D5DB' },
    pending_approval: { label: 'Pending', bg: '#FFFBEB', fg: '#AD5918', border: '#FDE68A' },
    approved: { label: 'Approved', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
    sent: { label: 'Sent', bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
    rejected: { label: 'Rejected', bg: '#FEF2F2', fg: '#CC3340', border: '#FECACA' },
    failed: { label: 'Failed', bg: '#FEF2F2', fg: '#CC3340', border: '#FECACA' },
  };
  const s = map[status] || map.draft;
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ background: s.bg, color: s.fg, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

// ─── Page ────────────────────────────────────────────────────

export default function DraftReviewPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState('');
  const [filter, setFilter] = useState<'all' | DraftStatus>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/drafts?limit=50');
      if (!res.ok) throw new Error('Failed to fetch drafts');
      const data = await res.json();
      setDrafts(data.drafts || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const selected = drafts.find((d) => d.id === selectedId);

  const startEdit = () => {
    if (selected) {
      setEditBody(selected.body);
      setEditing(true);
    }
  };

  const saveEdit = async () => {
    if (!selected) return;
    setActionLoading(selected.id);
    try {
      await fetch('/api/drafts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, body: editBody }),
      });
      setDrafts((prev) => prev.map((d) => (d.id === selected.id ? { ...d, body: editBody } : d)));
      setEditing(false);
    } finally {
      setActionLoading(null);
    }
  };

  const updateStatus = async (id: string, status: DraftStatus) => {
    setActionLoading(id);
    try {
      await fetch('/api/drafts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, draft_status: status } : d)));
    } finally {
      setActionLoading(null);
    }
  };

  const filteredDrafts = filter === 'all' ? drafts : drafts.filter((d) => d.draft_status === filter);

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] md:text-[24px] font-semibold tracking-[-0.5px]">Draft Review</h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
            {drafts.length} drafts · {drafts.filter((d) => d.draft_status === 'pending_approval').length} pending approval
          </p>
        </div>
        <button onClick={fetchDrafts} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border flex items-center gap-1.5" style={{ borderColor: 'var(--border)' }}>
          <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4" style={{ height: 'calc(100vh - 220px)' }}>
        {/* Left: Draft list */}
        <div className="col-span-12 lg:col-span-4 flex flex-col rounded-[4px] border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          {/* Filters */}
          <div className="flex gap-1 p-2 border-b overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
            {(['all', 'pending_approval', 'approved', 'sent', 'rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-2.5 py-1 rounded text-[11px] font-medium whitespace-nowrap"
                style={{
                  background: filter === f ? 'var(--accent)' : 'transparent',
                  color: filter === f ? '#fff' : 'var(--text-muted)',
                }}
              >
                {f === 'all' ? 'All' : f === 'pending_approval' ? 'Pending' : f.charAt(0).toUpperCase() + f.slice(1)}
                <span className="ml-1 text-[10px]">
                  ({f === 'all' ? drafts.length : drafts.filter((d) => d.draft_status === f).length})
                </span>
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
              </div>
            ) : filteredDrafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                No drafts found
              </div>
            ) : (
              filteredDrafts.map((draft) => (
                <button
                  key={draft.id}
                  onClick={() => { setSelectedId(draft.id); setEditing(false); }}
                  className="w-full text-left p-3 border-b transition-colors"
                  style={{
                    borderColor: 'var(--border)',
                    background: selectedId === draft.id ? 'var(--accent)08' : 'transparent',
                    borderLeft: selectedId === draft.id ? '3px solid var(--accent)' : '3px solid transparent',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[14px]">{draft.channel === 'email' ? '✉️' : '💬'}</span>
                    <span className="text-[12px] font-semibold truncate flex-1">{draft.to_address}</span>
                    <StatusPill status={draft.draft_status} />
                  </div>
                  {draft.subject && <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{draft.subject}</p>}
                  <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {draft.body?.slice(0, 80)}...
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {new Date(draft.created_at).toLocaleDateString()}
                    </span>
                    {draft.ai_generated && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--accent)18', color: 'var(--accent)' }}>
                        AI
                      </span>
                    )}
                    {draft.citations?.length > 0 && (
                      <span className="text-[10px]" style={{ color: 'var(--accent)' }}>
                        {draft.citations.length} citations
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Detail view */}
        <div className="col-span-12 lg:col-span-8 flex flex-col rounded-[4px] border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          {selected ? (
            <>
              {/* Detail header */}
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-[18px]">{selected.channel === 'email' ? '✉️' : '💬'}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold">{selected.to_address}</span>
                      <StatusPill status={selected.draft_status} />
                    </div>
                    {selected.subject && (
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{selected.subject}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {selected.draft_status === 'pending_approval' && (
                    <>
                      <button onClick={startEdit} disabled={actionLoading === selected.id} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border" style={{ borderColor: 'var(--border)' }}>
                        Edit
                      </button>
                      <button onClick={() => updateStatus(selected.id, 'rejected')} disabled={actionLoading === selected.id} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                        Reject
                      </button>
                      <button onClick={() => updateStatus(selected.id, 'approved')} disabled={actionLoading === selected.id} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: 'var(--accent)' }}>
                        {actionLoading === selected.id ? 'Saving...' : 'Approve'}
                      </button>
                    </>
                  )}
                  {selected.draft_status === 'approved' && (
                    <button onClick={() => updateStatus(selected.id, 'sent')} disabled={actionLoading === selected.id} className="px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: '#2563EB' }}>
                      {actionLoading === selected.id ? 'Sending...' : 'Send Now →'}
                    </button>
                  )}
                </div>
              </div>

              {/* Content area */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-0">
                  {/* Message body */}
                  <div className="xl:col-span-3 p-4 border-r" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        {selected.channel === 'email' ? 'Email Body' : 'WhatsApp Message'}
                      </h3>
                      {editing && (
                        <div className="flex gap-2">
                          <button onClick={() => setEditing(false)} className="text-[11px] px-2 py-1 rounded border" style={{ borderColor: 'var(--border)' }}>
                            Cancel
                          </button>
                          <button onClick={saveEdit} disabled={actionLoading === selected.id} className="text-[11px] px-2 py-1 rounded text-white" style={{ background: 'var(--accent)' }}>
                            {actionLoading === selected.id ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      )}
                    </div>

                    {editing ? (
                      <textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        className="w-full h-[400px] p-3 rounded-lg border text-[13px] font-mono leading-relaxed resize-none focus:outline-none focus:ring-2"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                      />
                    ) : (
                      <div className="p-3 rounded-lg text-[13px] leading-relaxed whitespace-pre-wrap" style={{ background: 'var(--bg)' }}>
                        {selected.body}
                      </div>
                    )}
                  </div>

                  {/* Right panel: AI reasoning + citations */}
                  <div className="xl:col-span-2 p-4 space-y-4">
                    {/* AI Reasoning */}
                    {selected.ai_reasoning && (
                      <div>
                        <h3 className="text-[12px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                          🧠 AI Reasoning
                        </h3>
                        <p className="text-[12px] leading-relaxed p-3 rounded-lg" style={{ background: 'var(--bg)' }}>
                          {selected.ai_reasoning}
                        </p>
                      </div>
                    )}

                    {/* Citations */}
                    {selected.citations && selected.citations.length > 0 && (
                      <div>
                        <h3 className="text-[12px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                          📎 Citations ({selected.citations.length})
                        </h3>
                        <div className="space-y-2">
                          {selected.citations.map((cite, i) => (
                            <div key={i} className="p-2.5 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>{cite.field}</span>
                                <ConfidenceBar value={cite.confidence} />
                              </div>
                              <p className="text-[10px] font-medium mb-0.5">{cite.source}</p>
                              {cite.snippet && (
                                <p className="text-[10px] italic" style={{ color: 'var(--text-muted)' }}>&ldquo;{cite.snippet}&rdquo;</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="p-3 rounded-lg space-y-2 text-[11px]" style={{ background: 'var(--bg)' }}>
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--text-muted)' }}>Created</span>
                        <span>{new Date(selected.created_at).toLocaleString()}</span>
                      </div>
                      {selected.approved_at && (
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-muted)' }}>Approved</span>
                          <span>{new Date(selected.approved_at).toLocaleString()}</span>
                        </div>
                      )}
                      {selected.sent_at && (
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-muted)' }}>Sent</span>
                          <span>{new Date(selected.sent_at).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--text-muted)' }}>AI Generated</span>
                        <span>{selected.ai_generated ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
              Select a draft to review
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
