'use client';

import Link from 'next/link';
import { useDemo } from '@/lib/demo-store';
import { useLang } from '@/lib/lang';
import { formatDate, formatCurrency } from '@/lib/utils';

/* ── Icons (Heroicons outline 24x24, just the d path) ───────────────────── */

const ICONS = {
  inbox:
    'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
  docCheck:
    'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  paper:
    'M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5',
  warn:
    'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
  chart:
    'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
  dollar:
    'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  clock:
    'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  check:
    'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
} as const;

/* ── Priority badge ─────────────────────────────────────────────────────── */

function Badge({
  priority,
  t,
}: {
  priority: 'high' | 'medium' | 'low';
  t: (en: string, zh: string) => string;
}) {
  const map = {
    high: { bg: '#FEE2E2', fg: '#DC2626', en: 'High', zh: '高' },
    medium: { bg: '#FEF3C7', fg: '#D97706', en: 'Medium', zh: '中' },
    low: { bg: '#DBEAFE', fg: '#2563EB', en: 'Low', zh: '低' },
  };
  const s = map[priority];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: s.bg, color: s.fg }}
    >
      {t(s.en, s.zh)}
    </span>
  );
}

/* ── Action card ────────────────────────────────────────────────────────── */

interface ActionCard {
  id: string;
  icon: string;
  title: string;
  titleZh: string;
  desc: string;
  descZh: string;
  priority: 'high' | 'medium' | 'low';
  href: string;
  count: number;
  actionLabel?: string;
  actionLabelZh?: string;
}

function ActionCard({ card, t }: { card: ActionCard; t: (en: string, zh: string) => string }) {
  return (
    <Link
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
            {t(card.title, card.titleZh)}
          </h3>
          <Badge priority={card.priority} t={t} />
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
          {t(card.desc, card.descZh)}
        </p>
        {card.actionLabel && (
          <span
            className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium group-hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            {t(card.actionLabel, card.actionLabelZh || card.actionLabel)}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-3 w-3"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </span>
        )}
      </div>
    </Link>
  );
}

/* ── Metric card ────────────────────────────────────────────────────────── */

function Metric({
  label,
  labelZh,
  value,
  icon,
  accent,
}: {
  label: string;
  labelZh: string;
  value: string;
  icon: string;
  accent: string;
}) {
  const { t } = useLang();
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
          {t(label, labelZh)}
        </div>
      </div>
    </div>
  );
}

/* ── Section heading ────────────────────────────────────────────────────── */

function Section({ title, titleZh }: { title: string; titleZh: string }) {
  const { t } = useLang();
  return (
    <h2
      className="mb-3 text-[13px] font-semibold uppercase tracking-wider"
      style={{ color: 'var(--text-muted)' }}
    >
      {t(title, titleZh)}
    </h2>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function WorkQueuePage() {
  const { t } = useLang();
  const demo = useDemo();

  const { inquiry, opportunity, rfqBatch, supplierResponses, comparison, quote, followUp, suppliers, requirementVersions } =
    demo;

  /* ── Compute action items from live demo state ──────────────────────── */

  const newInquiries =
    inquiry.status === 'new' || inquiry.status === 'needs_clarification' ? [inquiry] : [];
  const clarificationDrafts = inquiry.status === 'clarification_sent' ? [inquiry] : [];
  const draftRfqs = rfqBatch.status === 'draft' ? [rfqBatch] : [];
  const incompleteResponses = supplierResponses.filter((r) => r.status === 'incomplete');
  const readyComparisons = comparison.status === 'ready_for_review' ? [comparison] : [];
  const pendingQuotes = quote.status === 'pending_approval' ? [quote] : [];

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const followUpDue =
    followUp.status === 'active' && new Date(followUp.nextDueAt) <= todayStart
      ? [followUp]
      : [];

  const incompleteSupplierNames = incompleteResponses
    .map((r) => suppliers.find((s) => s.id === r.supplierId)?.name || 'Unknown')
    .join(', ');

  const cards: ActionCard[] = [
    {
      id: 'inquiries',
      icon: ICONS.inbox,
      title: 'New inquiries needing review',
      titleZh: '新询盘待审核',
      desc: `${newInquiries.length} ${newInquiries.length === 1 ? 'inquiry requires' : 'inquiries require'} your attention \u2014 review and qualify incoming requests.`,
      descZh: `${newInquiries.length} \u6761\u8be2\u76d8\u9700\u8981\u60a8\u7684\u5173\u6ce8 \u2014 \u5ba1\u6838\u5e76\u7b5b\u9009\u65b0\u8be2\u76d8\u3002`,
      priority: 'high',
      href: '/admin/inbox',
      count: newInquiries.length,
      actionLabel: 'Review inbox',
      actionLabelZh: '\u5ba1\u6838\u6536\u4ef6\u7bb1',
    },
    {
      id: 'clarifications',
      icon: ICONS.docCheck,
      title: 'Clarification drafts needing approval',
      titleZh: '澄清草稿待审批',
      desc: `${clarificationDrafts.length} AI-drafted clarification ready \u2014 review before sending to customer.`,
      descZh: `${clarificationDrafts.length} \u4efd AI \u6f84\u6e05\u8349\u7a3f\u5df2\u5c31\u7eea \u2014 \u53d1\u9001\u524d\u8bf7\u5ba1\u6838\u3002`,
      priority: 'high',
      href: '/admin/inbox',
      count: clarificationDrafts.length,
      actionLabel: 'Review clarification',
      actionLabelZh: '\u5ba1\u6838\u6f84\u6e05\u5185\u5bb9',
    },
    {
      id: 'rfqs',
      icon: ICONS.paper,
      title: 'Supplier RFQs awaiting approval',
      titleZh: '供应商询价待审批',
      desc: `${draftRfqs.length} RFQ batch drafted \u2014 approve to send pricing requests to suppliers.`,
      descZh: `${draftRfqs.length} \u6279\u8be2\u4ef7\u5df2\u8349\u62df \u2014 \u5ba1\u6279\u540e\u53d1\u9001\u62a5\u4ef7\u8bf7\u6c42\u3002`,
      priority: 'medium',
      href: '/admin/suppliers',
      count: draftRfqs.length,
      actionLabel: 'Review RFQ batch',
      actionLabelZh: '\u5ba1\u6838\u8be2\u4ef7\u6279\u6b21',
    },
    {
      id: 'incomplete',
      icon: ICONS.warn,
      title: 'Supplier responses with missing fields',
      titleZh: '供应商回复缺少字段',
      desc: `${incompleteResponses.length} response incomplete \u2014 follow up with ${incompleteSupplierNames || 'suppliers'} for missing information.`,
      descZh: `${incompleteResponses.length} \u6761\u56de\u590d\u4e0d\u5b8c\u6574 \u2014 \u8bf7\u8ddf\u8fdb ${incompleteSupplierNames || '\u4f9b\u5e94\u5546'} \u83b7\u53d6\u7f3a\u5931\u4fe1\u606f\u3002`,
      priority: 'high',
      href: '/admin/suppliers',
      count: incompleteResponses.length,
      actionLabel: 'Follow up on responses',
      actionLabelZh: '\u8ddf\u8fdb\u56de\u590d',
    },
    {
      id: 'comparisons',
      icon: ICONS.chart,
      title: 'Comparisons ready for review',
      titleZh: '比较分析待审核',
      desc: `${readyComparisons.length} supplier comparison ready \u2014 review the recommendation and select your supplier.`,
      descZh: `${readyComparisons.length} \u4efd\u4f9b\u5e94\u5546\u6bd4\u8f83\u5df2\u5c31\u7eea \u2014 \u5ba1\u6838\u63a8\u8350\u5e76\u9009\u62e9\u4f9b\u5e94\u5546\u3002`,
      priority: 'high',
      href: '/admin/opportunities',
      count: readyComparisons.length,
      actionLabel: 'Review comparison',
      actionLabelZh: '\u5ba1\u6838\u6bd4\u8f83\u5206\u6790',
    },
    {
      id: 'quotes',
      icon: ICONS.dollar,
      title: 'Quotes pending approval',
      titleZh: '报价待审批',
      desc: `${pendingQuotes.length} quote awaiting approval \u2014 review margin and terms before sending.`,
      descZh: `${pendingQuotes.length} \u4efd\u62a5\u4ef7\u7b49\u5f85\u5ba1\u6279 \u2014 \u53d1\u9001\u524d\u8bf7\u5ba1\u6838\u5229\u6da6\u7387\u548c\u6761\u6b3e\u3002`,
      priority: 'medium',
      href: '/admin/quotes',
      count: pendingQuotes.length,
      actionLabel: 'Review quote',
      actionLabelZh: '\u5ba1\u6838\u62a5\u4ef7',
    },
    {
      id: 'follow-ups',
      icon: ICONS.clock,
      title: 'Follow-ups due',
      titleZh: '待跟进事项',
      desc: `${followUpDue.length} follow-up ${followUpDue.length === 1 ? 'is' : 'are'} due \u2014 send the next step in your sequence.`,
      descZh: `${followUpDue.length} \u4efd\u8ddf\u8fdb ${followUpDue.length === 1 ? '\u5df2\u5230\u671f' : '\u5df2\u5230\u671f'} \u2014 \u53d1\u9001\u5e8f\u5217\u4e2d\u7684\u4e0b\u4e00\u6b65\u3002`,
      priority: 'medium',
      href: '/admin/follow-ups',
      count: followUpDue.length,
      actionLabel: 'View follow-ups',
      actionLabelZh: '\u67e5\u770b\u8ddf\u8fdb',
    },
  ];

  /* ── Metrics ─────────────────────────────────────────────────────────── */

  const activeInquiries = inquiry.status !== 'declined' && inquiry.status !== 'duplicate' && inquiry.status !== 'on_hold' ? 1 : 0;
  const pipelineValue = opportunity.estimatedValue;
  const quotesSent = quote.status === 'sent' || quote.status === 'viewed' || quote.status === 'accepted' ? 1 : 0;
  const totalOpps = 1;
  const wonOpps = opportunity.stage === 'won' ? 1 : 0;
  const conversionRate = totalOpps > 0 ? Math.round((wonOpps / totalOpps) * 100) : 0;

  /* ── Recent activity (from audit trail) ──────────────────────────────── */

  const activityEvents = [
    {
      id: 'a1',
      actor: 'Priya Sharma',
      action: 'sent quote',
      actionZh: '\u53d1\u9001\u4e86\u62a5\u4ef7',
      detail: `to Global Bottling \u2014 ${formatCurrency(quote.customerPrice)}`,
      detailZh: `\u53d1\u9001\u7ed9 Global Bottling \u2014 ${formatCurrency(quote.customerPrice)}`,
      timestamp: quote.auditTrail[quote.auditTrail.length - 1]?.timestamp || new Date().toISOString(),
    },
    {
      id: 'a2',
      actor: 'James Mitchell',
      action: 'approved quote',
      actionZh: '\u6279\u51c6\u4e86\u62a5\u4ef7',
      detail: `TF-Q-2026-0193 \u2014 margin at ${quote.internalView.marginPercent}%`,
      detailZh: `TF-Q-2026-0193 \u2014 \u5229\u6da6\u7387 ${quote.internalView.marginPercent}%`,
      timestamp: quote.approvedAt || '',
    },
    {
      id: 'a3',
      actor: 'AI System',
      action: 'completed supplier comparison',
      actionZh: '\u5b8c\u6210\u4e86\u4f9b\u5e94\u5546\u6bd4\u8f83',
      detail: `recommended ${suppliers.find((s) => s.id === comparison.recommendation.recommendedSupplierId)?.name}`,
      detailZh: `\u63a8\u8350 ${suppliers.find((s) => s.id === comparison.recommendation.recommendedSupplierId)?.name}`,
      timestamp: comparison.createdAt,
    },
    {
      id: 'a4',
      actor: 'Li Chen (Guangdong)',
      action: 'sent incomplete response',
      actionZh: '\u53d1\u9001\u4e86\u4e0d\u5b8c\u6574\u56de\u590d',
      detail: 'missing packaging cost, payment terms, sample info',
      detailZh: '\u7f3a\u5c11\u5305\u88c5\u8d39\u7528\u3001\u4ed8\u6b3e\u6761\u4ef6\u3001\u6837\u54c1\u4fe1\u606f',
      timestamp: '2026-09-19T03:45:00Z',
    },
    {
      id: 'a5',
      actor: 'Priya Sharma',
      action: 'confirmed requirements',
      actionZh: '\u786e\u8ba4\u4e86\u9700\u6c42',
      detail: 'TF-2026-0193 \u2014 all fields locked for RFQ',
      detailZh: 'TF-2026-0193 \u2014 \u6240\u6709\u5b57\u6bb5\u5df2\u9501\u5b9a\u7528\u4e8e\u8be2\u4ef7',
      timestamp: requirementVersions[0]?.approvedAt || '',
    },
  ].filter((e) => e.timestamp);

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold" style={{ color: 'var(--text)' }}>
          {t('Work Queue', '工作佇列')}
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
          {t(
            'Items requiring your action, sorted by priority.',
            '需要您操作的项目，按优先级排序。',
          )}
        </p>
      </div>

      {/* Action cards */}
      <section>
        <Section title="Action Required" titleZh="需要操作" />
        <div className="space-y-3">
          {cards.map((card) => (
            <ActionCard key={card.id} card={card} t={t} />
          ))}
        </div>
      </section>

      {/* Metrics */}
      <section>
        <Section title="Pipeline Metrics" titleZh="商机指标" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric
            label="Active Inquiries"
            labelZh="活跃询盘"
            value={String(activeInquiries)}
            icon={ICONS.inbox}
            accent="#6366F1"
          />
          <Metric
            label="Pipeline Value"
            labelZh="管道价值"
            value={formatCurrency(pipelineValue)}
            icon={ICONS.chart}
            accent="#10B981"
          />
          <Metric
            label="Quotes Sent"
            labelZh="已发报价"
            value={String(quotesSent)}
            icon={ICONS.paper}
            accent="#F59E0B"
          />
          <Metric
            label="Conversion Rate"
            labelZh="转化率"
            value={`${conversionRate}%`}
            icon={ICONS.dollar}
            accent="#8B5CF6"
          />
        </div>
      </section>

      {/* Recent activity */}
      <section>
        <Section title="Recent Activity" titleZh="最近活动" />
        <div
          className="rounded-[4px] border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {activityEvents.map((evt) => (
            <div
              key={evt.id}
              className="flex items-start gap-3 border-b px-4 py-3 last:border-b-0"
              style={{ borderColor: 'var(--border)' }}
            >
              <div
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                style={{ background: 'var(--accent-light)' }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-3.5 w-3.5"
                  style={{ color: 'var(--accent)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={ICONS.check} />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px]" style={{ color: 'var(--text)' }}>
                  <span className="font-medium">{evt.actor}</span>{' '}
                  {t(evt.action, evt.actionZh)}{' '}
                  <span style={{ color: 'var(--text-muted)' }}>
                    {t(evt.detail, evt.detailZh)}
                  </span>
                </p>
                <p className="mt-0.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {formatDate(evt.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
