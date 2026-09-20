import Link from 'next/link';
import { getCurrentUser, getInquiries, getQuotes, getSuppliers } from '@/lib/supabase/queries';
import { formatCurrency } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const ICONS = {
  inbox:
    'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
  docCheck:
    'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  paper:
    'M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5',
  dollar:
    'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  chart:
    'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
};

function Metric({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: string;
  accent: string;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-[4px] border p-4"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]"
        style={{ background: accent + '18' }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5"
          style={{ color: accent }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <div>
        <div className="text-[22px] font-bold" style={{ color: 'var(--text)' }}>
          {value}
        </div>
        <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
          {label}
        </div>
      </div>
    </div>
  );
}

export default async function WorkQueuePage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <h1 className="text-[22px] font-bold" style={{ color: 'var(--text)' }}>Work Queue</h1>
        <p style={{ color: 'var(--text-muted)' }}>Please log in to view your work queue.</p>
      </div>
    );
  }

  const [inquiries, quotes, suppliers] = await Promise.all([
    getInquiries(user.company_id),
    getQuotes(user.company_id),
    getSuppliers(user.company_id),
  ]);

  // Compute stats from real data
  const pendingInquiries = inquiries.filter(
    (i) => i.processing_status === 'new' || i.processing_status === 'processing',
  );
  const activeQuotes = quotes.filter(
    (q) => q.status === 'draft' || q.status === 'pending_approval' || q.status === 'sent' || q.status === 'viewed',
  );
  const totalPipelineValue = quotes.reduce((sum, q) => sum + (q.total_amount || 0), 0);
  const approvedSuppliers = suppliers.filter((s) => s.is_approved);

  // Build action cards from real data
  const cards = [
    {
      id: 'inquiries',
      icon: ICONS.inbox,
      title: 'Pending inquiries',
      desc: `${pendingInquiries.length} ${pendingInquiries.length === 1 ? 'inquiry requires' : 'inquiries require'} your attention.`,
      priority: 'high' as const,
      href: '/admin/inquiries',
      count: pendingInquiries.length,
    },
    {
      id: 'quotes',
      icon: ICONS.dollar,
      title: 'Active quotes',
      desc: `${activeQuotes.length} ${activeQuotes.length === 1 ? 'quote is' : 'quotes are'} in progress or awaiting approval.`,
      priority: 'medium' as const,
      href: '/admin/quotes',
      count: activeQuotes.length,
    },
    {
      id: 'suppliers',
      icon: ICONS.paper,
      title: 'Supplier directory',
      desc: `${suppliers.length} ${suppliers.length === 1 ? 'supplier' : 'suppliers'} in your network${approvedSuppliers.length > 0 ? ` (${approvedSuppliers.length} approved)` : ''}.`,
      priority: 'low' as const,
      href: '/admin/suppliers',
      count: suppliers.length,
    },
  ];

  const priorityColors = {
    high: { bg: '#FEE2E2', fg: '#DC2626' },
    medium: { bg: '#FEF3C7', fg: '#D97706' },
    low: { bg: '#DBEAFE', fg: '#2563EB' },
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold" style={{ color: 'var(--text)' }}>
          Work Queue
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
          Items requiring your action, sorted by priority.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric
          label="Pending Inquiries"
          value={String(pendingInquiries.length)}
          icon={ICONS.inbox}
          accent="#6366F1"
        />
        <Metric
          label="Pipeline Value"
          value={totalPipelineValue > 0 ? formatCurrency(totalPipelineValue) : '$0'}
          icon={ICONS.chart}
          accent="#10B981"
        />
        <Metric
          label="Active Quotes"
          value={String(activeQuotes.length)}
          icon={ICONS.paper}
          accent="#F59E0B"
        />
        <Metric
          label="Suppliers"
          value={String(suppliers.length)}
          icon={ICONS.docCheck}
          accent="#8B5CF6"
        />
      </div>

      {/* Action cards */}
      <section>
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Action Required
        </h2>
        <div className="space-y-3">
          {cards.map((card) => {
            const pc = priorityColors[card.priority];
            return (
              <Link
                key={card.id}
                href={card.href}
                className="group flex items-start gap-4 rounded-[4px] border p-4 transition-all hover:shadow-md"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]"
                  style={{ background: 'var(--accent-light)' }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                    style={{ color: 'var(--accent)' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className="text-[14px] font-semibold group-hover:underline"
                      style={{ color: 'var(--text)' }}
                    >
                      {card.title}
                    </h3>
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{ background: pc.bg, color: pc.fg }}
                    >
                      {card.priority}
                    </span>
                    {card.count > 0 && (
                      <span
                        className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold"
                        style={{ background: 'var(--accent)', color: '#fff' }}
                      >
                        {card.count}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                    {card.desc}
                  </p>
                  <span
                    className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium group-hover:underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    View
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3 w-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Empty state hint */}
      {inquiries.length === 0 && quotes.length === 0 && (
        <div
          className="rounded-[4px] border p-8 text-center"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
            Getting started
          </h3>
          <p className="mt-2 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            Your workspace is empty. As inquiries come in through your inbox, they will appear here for you to work on.
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
    </div>
  );
}
