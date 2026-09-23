'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────

interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  fromEmail: string;
  to: string;
  date: string;
  body: string;
  snippet: string;
  isUnread: boolean;
  labels: string[];
  hasAttachments: boolean;
}

interface InboxState {
  messages: GmailMessage[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  processingId: string | null;
  filter: 'all' | 'unread' | 'processed';
  searchQuery: string;
}

// ─── Helper ──────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// ─── Page ────────────────────────────────────────────────────

export default function InboxPage() {
  const [state, setState] = useState<InboxState>({
    messages: [],
    loading: true,
    error: null,
    selectedId: null,
    processingId: null,
    filter: 'all',
    searchQuery: '',
  });

  const [selectedMessage, setSelectedMessage] = useState<GmailMessage | null>(null);

  // Fetch Gmail messages
  const fetchMessages = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch('/api/gmail/sync?max=30');
      if (!res.ok) throw new Error('Failed to fetch emails');
      const data = await res.json();
      setState((s) => ({
        ...s,
        messages: data.messages || [],
        loading: false,
      }));
    } catch (err: any) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err.message || 'Failed to load emails',
      }));
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Process email into RFQ
  const processEmail = async (messageId: string) => {
    setState((s) => ({ ...s, processingId: messageId }));
    try {
      const res = await fetch('/api/gmail/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });
      if (!res.ok) throw new Error('Failed to process');
      const data = await res.json();
      // Refresh messages
      await fetchMessages();
    } catch (err: any) {
      console.error('Process error:', err);
    } finally {
      setState((s) => ({ ...s, processingId: null }));
    }
  };

  // Filter messages
  const filteredMessages = state.messages.filter((msg) => {
    if (state.filter === 'unread' && !msg.isUnread) return false;
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      return (
        msg.subject.toLowerCase().includes(q) ||
        msg.from.toLowerCase().includes(q) ||
        msg.fromEmail.toLowerCase().includes(q) ||
        msg.snippet.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selected = state.messages.find((m) => m.id === state.selectedId);

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] md:text-[24px] font-semibold tracking-[-0.5px]">Inbox</h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
            {state.messages.length} emails · {state.messages.filter((m) => m.isUnread).length} unread
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchMessages}
            disabled={state.loading}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border flex items-center gap-1.5"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <svg className={`w-3.5 h-3.5 ${state.loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            Refresh
          </button>
          <Link href="/admin/upload" className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: 'var(--accent)' }}>
            Upload Documents
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--surface)' }}>
          {(['all', 'unread'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setState((s) => ({ ...s, filter: f }))}
              className="px-3 py-1 rounded text-[11px] font-medium"
              style={{
                background: state.filter === f ? 'var(--accent)' : 'transparent',
                color: state.filter === f ? '#fff' : 'var(--text-muted)',
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search emails..."
            value={state.searchQuery}
            onChange={(e) => setState((s) => ({ ...s, searchQuery: e.target.value }))}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border text-[12px] focus:outline-none focus:ring-2"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4" style={{ height: 'calc(100vh - 260px)' }}>
        {/* Message list */}
        <div className="col-span-12 lg:col-span-5 flex flex-col rounded-[4px] border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          {state.loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-3 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                Loading emails...
              </div>
            </div>
          ) : state.error ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
              <p className="text-[13px]" style={{ color: 'var(--danger)' }}>{state.error}</p>
              <button onClick={fetchMessages} className="text-[12px] px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                Retry
              </button>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
              No emails found
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {filteredMessages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => setState((s) => ({ ...s, selectedId: msg.id }))}
                  className="w-full text-left p-3 border-b transition-colors"
                  style={{
                    borderColor: 'var(--border)',
                    background: state.selectedId === msg.id ? 'var(--accent)08' : 'transparent',
                    borderLeft: state.selectedId === msg.id ? '3px solid var(--accent)' : '3px solid transparent',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[14px]">✉️</span>
                    <span className="text-[12px] font-semibold flex-1 truncate">{msg.from}</span>
                    <span className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>{timeAgo(msg.date)}</span>
                  </div>
                  <p className="text-[12px] font-medium truncate mb-0.5">{msg.subject}</p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{msg.snippet.slice(0, 100)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {msg.isUnread && <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />}
                    {msg.hasAttachments && <span className="text-[10px]">📎</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail view */}
        <div className="col-span-12 lg:col-span-7 flex flex-col rounded-[4px] border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          {selected ? (
            <>
              {/* Detail header */}
              <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-[14px] font-semibold">{selected.subject}</h2>
                  <button
                    onClick={() => processEmail(selected.id)}
                    disabled={state.processingId === selected.id}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white flex items-center gap-1.5 disabled:opacity-50"
                    style={{ background: 'var(--accent)' }}
                  >
                    {state.processingId === selected.id ? (
                      <>
                        <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} />
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                        Process as RFQ
                      </>
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-4 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  <span>From: <span className="font-medium" style={{ color: 'var(--text)' }}>{selected.from} &lt;{selected.fromEmail}&gt;</span></span>
                  <span>{new Date(selected.date).toLocaleString()}</span>
                </div>
              </div>

              {/* Email body */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="p-4 rounded-lg text-[13px] leading-relaxed whitespace-pre-wrap" style={{ background: 'var(--bg)' }}>
                  {selected.body || selected.snippet || '(No content)'}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
              Select an email to view
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
