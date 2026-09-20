import Link from 'next/link';
import { getCurrentUser, getQuotes, getCustomers } from '@/lib/supabase/queries';
import { formatDate, formatCurrency } from '@/lib/utils';

const STATUS_BADGE: Record<string, { en: string; zh: string; bg: string; fg: string; border: string }> = {
  draft: { en: 'Draft', zh: '草稿', bg: '#F3F4F6', fg: '#6B7280', border: '#D1D5DB' },
  pending_approval: { en: 'Pending Approval', zh: '待审批', bg: '#FFFBEB', fg: '#D97706', border: '#FDE68A' },
  approved: { en: 'Approved', zh: '已批准', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
  sent: { en: 'Sent', zh: '已发送', bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
  accepted: { en: 'Accepted', zh: '已接受', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
  rejected: { en: 'Rejected', zh: '已拒绝', bg: '#FEF2F2', fg: '#CC3340', border: '#FECACA' },
  expired: { en: 'Expired', zh: '已过期', bg: '#F3F4F6', fg: '#9CA3AF', border: '#D1D5DB' },
  viewed: { en: 'Viewed', zh: '已查看', bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
  negotiation: { en: 'Negotiation', zh: '谈判中', bg: '#FFFBEB', fg: '#D97706', border: '#FDE68A' },
  sending: { en: 'Sending', zh: '发送中', bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
  cancelled: { en: 'Cancelled', zh: '已取消', bg: '#F3F4F6', fg: '#9CA3AF', border: '#D1D5DB' },
};

export const dynamic = 'force-dynamic';

export default async function QuotesPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-[22px] font-bold" style={{ color: 'var(--text)' }}>Quotes</h1>
        <p style={{ color: 'var(--text-muted)' }}>Please log in to view quotes.</p>
      </div>
    );
  }

  const [quotes, customers] = await Promise.all([
    getQuotes(user.company_id),
    getCustomers(user.company_id),
  ]);

  const customerMap = new Map(customers.map((c) => [c.id, c]));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: 'var(--text)' }}>
            Quotes
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            {quotes.length} total quotes
          </p>
        </div>
      </div>

      {/* Empty state */}
      {quotes.length === 0 && (
        <div
          className="rounded-[4px] border p-12 text-center"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-auto h-12 w-12" style={{ color: 'var(--text-muted)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <h3 className="mt-4 text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
            No quotes yet
          </h3>
          <p className="mt-2 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            Quotes you create will appear here. Start by reviewing inquiries and building quotes from opportunities.
          </p>
          <Link
            href="/admin/inquiries"
            className="mt-4 inline-flex items-center gap-2 rounded-[4px] px-4 py-2 text-[13px] font-semibold text-white"
            style={{ background: 'var(--accent)' }}
          >
            View Inquiries
          </Link>
        </div>
      )}

      {/* Table */}
      {quotes.length > 0 && (
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
            <span>Reference</span>
            <span>Customer</span>
            <span>Value</span>
            <span>Status</span>
            <span>Created</span>
            <span>Valid Until</span>
          </div>

          {/* Table rows */}
          {quotes.map((q) => {
            const customer = q.customer_id ? customerMap.get(q.customer_id) : null;
            const badge = STATUS_BADGE[q.status] ?? STATUS_BADGE.draft;
            return (
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
                  {q.quote_number || q.reference_number || '—'}
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium truncate">
                    {customer?.legal_name ?? '—'}
                  </div>
                  <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                    {customer?.contact_name || ''}
                  </div>
                </div>
                <span className="text-[13px] font-semibold tabular-nums">
                  {q.customer_price ? formatCurrency(q.customer_price, q.currency) : '—'}
                </span>
                <span
                  className="inline-flex items-center rounded-md px-2.5 py-0.5 text-[12px] font-semibold w-fit"
                  style={{ background: badge.bg, color: badge.fg, border: `1px solid ${badge.border}` }}
                >
                  {badge.en}
                </span>
                <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  {formatDate(q.created_at)}
                </span>
                <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  {q.valid_until ? formatDate(q.valid_until) : '—'}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
