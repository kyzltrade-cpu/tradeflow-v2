'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useLang } from '@/lib/lang';
import { formatDateTime } from '@/lib/utils';

interface FieldRow {
  id: string;
  field_key: string;
  field_label?: string;
  raw_value?: string;
  normalized_value?: string;
  confidence: number;
  status: string;
}

interface ClarityItem {
  id: string;
  subject?: string;
  sender_name?: string;
  sender_email?: string;
  status: string;
  processing_status: string;
  created_at: string;
  fields: FieldRow[];
  missingCount: number;
  criticalMissing: number;
  hasDraft: boolean;
}

const STATUS_MAP: Record<string, { en: string; zh: string; bg: string; fg: string }> = {
  new: { en: 'New', zh: '新', bg: '#EFF6FF', fg: '#2563EB' },
  needs_clarification: { en: 'Needs Clarification', zh: '需要澄清', bg: '#FFFBEB', fg: '#D97706' },
  clarification_sent: { en: 'Clarification Sent', zh: '已发送澄清', bg: '#F0F9FF', fg: '#0369A1' },
  requirements_confirmed: { en: 'Requirements Confirmed', zh: '需求已确认', bg: '#ECFDF5', fg: '#038153' },
};

function StatusBadge({ status }: { status: string }) {
  const { t } = useLang();
  const s = STATUS_MAP[status] ?? { en: status, zh: status, bg: '#F3F4F6', fg: '#6B7280' };
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ background: s.bg, color: s.fg }}>
      {t(s.en, s.zh)}
    </span>
  );
}

export default function ClarificationsPage() {
  const { t } = useLang();
  const [items, setItems] = useState<ClarityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/workflow/clarifications', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setItems(data.items || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const run = async (id: string, path: string) => {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/inquiries/${id}/${path}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const actionable = (item: ClarityItem) => {
    if (item.status === 'new') return 'analyze';
    if (item.status === 'needs_clarification' && !item.hasDraft) return 'clarify';
    return null;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-[22px] font-bold" style={{ color: 'var(--text)' }}>
          {t('Clarifications', '澄清')}
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
          {t(
            'Inquiries missing critical requirements — review gaps, generate the clarification, and track replies.',
            '缺少关键需求的询盘——检查缺口、生成澄清邮件并追踪回覆。',
          )}
        </p>
      </div>

      {error && (
        <div className="rounded-[4px] border px-4 py-3 text-[13px]" style={{ background: '#FEF2F2', borderColor: '#FECACA', color: '#CC3340' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>{t('Loading...', '加载中...')}</p>
      ) : items.length === 0 ? (
        <div className="rounded-[4px] border p-8 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
            {t('No clarifications pending', '没有待处理的澄清')}
          </h3>
          <p className="mt-2 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            {t('New inquiries appear here when critical fields are missing.', '当关键字段缺失时，新询盘会出现在这里。')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const action = actionable(item);
            return (
              <div key={item.id} className="rounded-[4px] border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="border-b px-4 py-3 flex items-start justify-between gap-3" style={{ borderColor: 'var(--border)' }}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/admin/inquiries/${item.id}`} className="text-[14px] font-semibold hover:underline" style={{ color: 'var(--accent)' }}>
                        {item.subject || '(no subject)'}
                      </Link>
                      <StatusBadge status={item.status} />
                      {item.criticalMissing > 0 && (
                        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold" style={{ background: '#FEF2F2', color: '#CC3340' }}>
                          {t('Critical gaps', '关键缺口')}: {item.criticalMissing}
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {item.sender_name || 'Unknown'} {item.sender_email && `<${item.sender_email}>`} — {formatDateTime(item.created_at)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      {t('Missing', '缺失')}: {item.missingCount}
                    </div>
                    {item.hasDraft && (
                      <div className="text-[11px] mt-0.5 font-medium" style={{ color: '#0369A1' }}>
                        {t('Draft in queue', '草稿已入队')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-4 py-3">
                  {item.fields.filter((f) => f.status === 'missing' || !f.normalized_value).slice(0, 6).map((f) => (
                    <div key={f.id} className="flex items-baseline justify-between gap-3 py-1 border-b border-dashed" style={{ borderColor: 'var(--border)' }}>
                      <span className="text-[12px] font-medium" style={{ color: 'var(--text)' }}>
                        {f.field_label || f.field_key}
                      </span>
                      <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                        {t('needed for quote', '报价所需')}
                      </span>
                    </div>
                  ))}
                  {item.fields.length === 0 && (
                    <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      {t('No fields extracted yet — run analysis first.', '尚未提取字段——请先运行分析。')}
                    </p>
                  )}
                </div>

                {(action || item.status === 'needs_clarification') && (
                  <div className="border-t px-4 py-3 flex flex-wrap gap-2" style={{ borderColor: 'var(--border)' }}>
                    {action === 'analyze' && (
                      <button
                        onClick={() => run(item.id, 'analyze')}
                        disabled={busy === item.id}
                        className="rounded-lg px-4 py-2 text-[13px] font-medium transition-all disabled:opacity-50"
                        style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                      >
                        {busy === item.id ? t('Analyzing...', '分析中...') : t('Analyze requirements', '分析需求')}
                      </button>
                    )}
                    {action === 'clarify' && (
                      <button
                        onClick={() => run(item.id, 'clarify')}
                        disabled={busy === item.id}
                        className="rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                        style={{ background: 'var(--accent)' }}
                      >
                        {busy === item.id ? t('Drafting...', '生成草稿中...') : t('✓ AI-draft clarification', '✓ AI 生成澄清')}
                      </button>
                    )}
                    {item.status === 'needs_clarification' && (
                      <Link
                        href="/admin/draft-review"
                        className="inline-flex items-center rounded-lg px-4 py-2 text-[13px] font-medium"
                        style={{ background: '#EFF6FF', color: '#2563EB' }}
                      >
                        {t('Review in Draft Queue', '在草稿队列审核')}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}