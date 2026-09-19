'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDemo } from '@/lib/demo-store';
import { useLang } from '@/lib/lang';
import { formatDate, formatCurrency } from '@/lib/utils';

type FilterStatus = 'all' | 'draft' | 'pending_approval' | 'approved' | 'sent' | 'accepted' | 'rejected';

const FILTERS: { key: FilterStatus; en: string; zh: string }[] = [
  { key: 'all', en: 'All', zh: '全部' },
  { key: 'draft', en: 'Draft', zh: '草稿' },
  { key: 'pending_approval', en: 'Pending Approval', zh: '待审批' },
  { key: 'approved', en: 'Approved', zh: '已批准' },
  { key: 'sent', en: 'Sent', zh: '已发送' },
  { key: 'accepted', en: 'Accepted', zh: '已接受' },
  { key: 'rejected', en: 'Rejected', zh: '已拒绝' },
];

const STATUS_BADGE: Record<string, { en: string; zh: string; bg: string; fg: string; border: string }> = {
  draft: { en: 'Draft', zh: '草稿', bg: '#F3F4F6', fg: '#6B7280', border: '#D1D5DB' },
  pending_approval: { en: 'Pending Approval', zh: '待审批', bg: '#FFFBEB', fg: '#D97706', border: '#FDE68A' },
  approved: { en: 'Approved', zh: '已批准', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
  sent: { en: 'Sent', zh: '已发送', bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
  accepted: { en: 'Accepted', zh: '已接受', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
  rejected: { en: 'Rejected', zh: '已拒绝', bg: '#FEF2F2', fg: '#CC3340', border: '#FECACA' },
  expired: { en: 'Expired', zh: '已过期', bg: '#F3F4F6', fg: '#9CA3AF', border: '#D1D5DB' },
};

function StatusBadge({ status }: { status: string }) {
  const { t } = useLang();
  const b = STATUS_BADGE[status] ?? STATUS_BADGE.draft;
  return (
    <span
      className="inline-flex items-center rounded-md px-2.5 py-0.5 text-[12px] font-semibold"
      style={{ background: b.bg, color: b.fg, border: `1px solid ${b.border}` }}
    >
      {t(b.en, b.zh)}
    </span>
  );
}

export default function QuotesListPage() {
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const demo = useDemo();
  const { t } = useLang();

  const { quote, opportunity, customers, suppliers } = demo;
  const customer = customers.find((c) => c.id === opportunity.customerId);

  // Build the list from the single demo quote (filterable)
  const allQuotes = [quote];
  const filtered =
    activeFilter === 'all'
      ? allQuotes
      : allQuotes.filter((q) => q.status === activeFilter);

  const counts = FILTERS.reduce(
    (acc, f) => {
      acc[f.key] = f.key === 'all' ? allQuotes.length : allQuotes.filter((q) => q.status === f.key).length;
      return acc;
    },
    {} as Record<FilterStatus, number>,
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: 'var(--text)' }}>
            {t('Quotes', '报价')}
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            {t(
              `${allQuotes.length} total quotes`,
              `共 ${allQuotes.length} 份报价`,
            )}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div
        className="flex items-center gap-1 rounded-[4px] border p-1 overflow-x-auto"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {FILTERS.map((f) => {
          const active = activeFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className="shrink-0 rounded-[4px] px-3 py-1.5 text-[12px] font-medium transition-colors"
              style={{
                background: active ? 'var(--accent)' : 'transparent',
                color: active ? '#fff' : 'var(--text-muted)',
              }}
            >
              {t(f.en, f.zh)}
              {counts[f.key] > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{
                  background: active ? 'rgba(255,255,255,0.25)' : 'var(--border)',
                  color: active ? '#fff' : 'var(--text-muted)',
                }}>
                  {counts[f.key]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quotes table */}
      {filtered.length === 0 ? (
        <div
          className="rounded-[4px] border p-12 text-center"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <p className="text-[14px]" style={{ color: 'var(--text-muted)' }}>
            {t('No quotes match this filter.', '没有匹配此筛选条件的报价。')}
          </p>
        </div>
      ) : (
        <div
          className="rounded-[4px] border overflow-hidden"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {/* Table header */}
          <div
            className="grid gap-4 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider border-b"
            style={{
              gridTemplateColumns: '1fr 1.2fr 0.8fr 0.7fr 0.8fr 0.8fr',
              color: 'var(--text-muted)',
              borderColor: 'var(--border)',
              background: 'var(--bg)',
            }}
          >
            <span>{t('Reference', '编号')}</span>
            <span>{t('Customer', '客户')}</span>
            <span>{t('Value', '金额')}</span>
            <span>{t('Status', '状态')}</span>
            <span>{t('Created', '创建日期')}</span>
            <span>{t('Valid Until', '有效期至')}</span>
          </div>

          {/* Table rows */}
          {filtered.map((q) => (
            <Link
              key={q.id}
              href={`/admin/quotes/${q.id}`}
              className="grid gap-4 border-b px-4 py-3 transition-colors hover:bg-[var(--accent-light)] last:border-b-0"
              style={{
                gridTemplateColumns: '1fr 1.2fr 0.8fr 0.7fr 0.8fr 0.8fr',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            >
              <span className="text-[13px] font-semibold" style={{ color: 'var(--accent)' }}>
                {q.referenceNumber}
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-medium truncate">{customer?.companyName ?? '—'}</div>
                <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                  {customer?.contactName}
                </div>
              </div>
              <span className="text-[13px] font-semibold tabular-nums">
                {formatCurrency(q.customerPrice, q.currency)}
              </span>
              <StatusBadge status={q.status} />
              <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                {formatDate(q.createdAt)}
              </span>
              <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                {formatDate(q.validUntil)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
