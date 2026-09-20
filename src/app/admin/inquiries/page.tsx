import Link from 'next/link';
import { getCurrentUser, getInquiries } from '@/lib/supabase/queries';
import { formatDate } from '@/lib/utils';

const STATUS_BADGE: Record<string, { en: string; zh: string; bg: string; fg: string; border: string }> = {
  new: { en: 'New', zh: '新', bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
  needs_clarification: { en: 'Needs Clarification', zh: '需要澄清', bg: '#FFFBEB', fg: '#D97706', border: '#FDE68A' },
  clarification_sent: { en: 'Clarification Sent', zh: '已发澄清', bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
  customer_replied: { en: 'Customer Replied', zh: '客户已回复', bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
  requirements_confirmed: { en: 'Confirmed', zh: '已确认', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
  qualified: { en: 'Qualified', zh: '已合格', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
  declined: { en: 'Declined', zh: '已拒绝', bg: '#FEF2F2', fg: '#CC3340', border: '#FECACA' },
  duplicate: { en: 'Duplicate', zh: '重复', bg: '#F3F4F6', fg: '#6B7280', border: '#D1D5DB' },
  on_hold: { en: 'On Hold', zh: '搁置', bg: '#F3F4F6', fg: '#9CA3AF', border: '#D1D5DB' },
};

const PRIORITY_BADGE: Record<string, { bg: string; fg: string; en: string; zh: string }> = {
  high: { bg: '#FEE2E2', fg: '#DC2626', en: 'High', zh: '高' },
  medium: { bg: '#FEF3C7', fg: '#D97706', en: 'Medium', zh: '中' },
  low: { bg: '#DBEAFE', fg: '#2563EB', en: 'Low', zh: '低' },
};

export const dynamic = 'force-dynamic';

export default async function InquiriesPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-[22px] font-bold" style={{ color: 'var(--text)' }}>Inquiries</h1>
        <p style={{ color: 'var(--text-muted)' }}>Please log in to view inquiries.</p>
      </div>
    );
  }

  const inquiries = await getInquiries(user.company_id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: 'var(--text)' }}>
            Inquiries
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            {inquiries.length} total inquiries
          </p>
        </div>
      </div>

      {/* Empty state */}
      {inquiries.length === 0 && (
        <div
          className="rounded-[4px] border p-12 text-center"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-auto h-12 w-12" style={{ color: 'var(--text-muted)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          <h3 className="mt-4 text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
            No inquiries yet
          </h3>
          <p className="mt-2 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            Inquiries from customers will appear here once they come in through your inbox.
          </p>
          <Link
            href="/admin/inbox"
            className="mt-4 inline-flex items-center gap-2 rounded-[4px] px-4 py-2 text-[13px] font-semibold text-white"
            style={{ background: 'var(--accent)' }}
          >
            Go to Inbox
          </Link>
        </div>
      )}

      {/* Table */}
      {inquiries.length > 0 && (
        <div
          className="rounded-[4px] border overflow-hidden"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div
            className="grid gap-4 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider border-b"
            style={{
              gridTemplateColumns: '1fr 1.5fr 0.8fr 0.8fr 0.7fr',
              color: 'var(--text-muted)',
              borderColor: 'var(--border)',
              background: 'var(--bg)',
            }}
          >
            <span>Reference</span>
            <span>Subject</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Created</span>
          </div>

          {inquiries.map((inquiry) => {
            const statusBadge = STATUS_BADGE[inquiry.status] ?? STATUS_BADGE.new;
            const priorityBadge = PRIORITY_BADGE[inquiry.priority] ?? PRIORITY_BADGE.medium;
            return (
              <Link
                key={inquiry.id}
                href={`/admin/inquiries/${inquiry.id}`}
                className="grid gap-4 border-b px-4 py-3 transition-colors hover:bg-[var(--accent-light)] last:border-b-0"
                style={{
                  gridTemplateColumns: '1fr 1.5fr 0.8fr 0.8fr 0.7fr',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                <span className="text-[13px] font-semibold" style={{ color: 'var(--accent)' }}>
                  {inquiry.reference_number || '—'}
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium truncate">{inquiry.subject || 'No subject'}</div>
                  <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                    {inquiry.sender_name || inquiry.sender_email || '—'}
                  </div>
                </div>
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold w-fit"
                  style={{ background: priorityBadge.bg, color: priorityBadge.fg }}
                >
                  {priorityBadge.en}
                </span>
                <span
                  className="inline-flex items-center rounded-md px-2.5 py-0.5 text-[12px] font-semibold w-fit"
                  style={{ background: statusBadge.bg, color: statusBadge.fg, border: `1px solid ${statusBadge.border}` }}
                >
                  {statusBadge.en}
                </span>
                <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  {formatDate(inquiry.created_at)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
