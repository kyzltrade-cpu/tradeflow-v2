'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────

interface AnalyticsData {
  metrics: {
    totalInquiries: number;
    totalDrafts: number;
    sentDrafts: number;
    pendingDrafts: number;
    aiDrafts: number;
    totalQuotes: number;
    totalCustomers: number;
  };
  channels: {
    email: number;
    whatsapp: number;
  };
  recentActivity: {
    id: string;
    channel: string;
    status: string;
    aiGenerated: boolean;
    createdAt: string;
  }[];
}

// ─── Components ──────────────────────────────────────────────

function MetricCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent: string }) {
  return (
    <div className="p-4 rounded-[4px] border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <div className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-[28px] font-bold" style={{ color: 'var(--text)' }}>{value}</div>
      {sub && <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const m = data?.metrics;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-[-0.5px]">Analytics</h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
          Track AI performance and workflow metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Inquiries" value={m?.totalInquiries ?? 0} accent="var(--accent)" />
        <MetricCard label="Drafts Created" value={m?.totalDrafts ?? 0} sub={`${m?.aiDrafts ?? 0} AI-generated`} accent="var(--accent)" />
        <MetricCard label="Pending Approval" value={m?.pendingDrafts ?? 0} accent="var(--accent)" />
        <MetricCard label="Sent" value={m?.sentDrafts ?? 0} accent="var(--accent)" />
      </div>

      {/* Channel Breakdown */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4 rounded-[4px] border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <h3 className="text-[13px] font-semibold mb-4">Channels</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg)' }}>
              <div className="flex items-center gap-2">
                <span className="text-[16px]">✉️</span>
                <span className="text-[12px] font-medium">Email (Gmail)</span>
              </div>
              <span className="text-[14px] font-bold">{data?.channels.email ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg)' }}>
              <div className="flex items-center gap-2">
                <span className="text-[16px]">💬</span>
                <span className="text-[12px] font-medium">WhatsApp</span>
              </div>
              <span className="text-[14px] font-bold">{data?.channels.whatsapp ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-12 lg:col-span-8 rounded-[4px] border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-[13px] font-semibold">Recent Activity</h3>
          </div>
          {data?.recentActivity?.length === 0 ? (
            <div className="p-8 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
              No activity yet. Process your first email to get started.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {data?.recentActivity?.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-[14px]">{item.channel === 'email' ? '✉️' : '💬'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium truncate">{item.channel} draft</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold" style={{
                    background: item.status === 'sent' ? '#EFF6FF' : item.status === 'approved' ? '#ECFDF5' : '#FFFBEB',
                    color: item.status === 'sent' ? '#2563EB' : item.status === 'approved' ? '#038153' : '#AD5918',
                  }}>
                    {item.status}
                  </span>
                  {item.aiGenerated && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--accent)18', color: 'var(--accent)' }}>AI</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-[4px] border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <h3 className="text-[13px] font-semibold mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/inbox" className="px-4 py-2 rounded-lg text-[12px] font-semibold border" style={{ borderColor: 'var(--border)' }}>
            Check Inbox →
          </Link>
          <Link href="/admin/draft-review" className="px-4 py-2 rounded-lg text-[12px] font-semibold border" style={{ borderColor: 'var(--border)' }}>
            Review Drafts ({m?.pendingDrafts ?? 0}) →
          </Link>
          <Link href="/admin/upload" className="px-4 py-2 rounded-lg text-[12px] font-semibold border" style={{ borderColor: 'var(--border)' }}>
            Upload Documents →
          </Link>
        </div>
      </div>
    </div>
  );
}
