'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useDemo } from '@/lib/demo-store';
import { useLang } from '@/lib/lang';
import { formatDate, formatDateTime, formatCurrency, formatNumber, formatRelativeTime } from '@/lib/utils';
import type { InquiryStatus, FieldStatus, FieldSourceType, InquiryField } from '@/lib/types';
import { RFQTab } from './rfq-tab';
import { ComparisonTab } from './comparison-tab';
import { QuoteTab } from './quote-tab';

/* ── Golden path stages ──────────────────────────────────────────────────── */

const STAGES: { key: string; en: string; zh: string; tab: TabKey }[] = [
  { key: 'received', en: 'Inquiry Received', zh: '收到询盘', tab: 'details' },
  { key: 'requirements', en: 'Requirements', zh: '需求确认', tab: 'requirements' },
  { key: 'discovery', en: 'Supplier Discovery', zh: '供应商发现', tab: 'suppliers' },
  { key: 'rfq', en: 'RFQ', zh: '供应商报价', tab: 'suppliers' },
  { key: 'responses', en: 'Responses', zh: '收到回复', tab: 'comparison' },
  { key: 'comparison', en: 'Comparison', zh: '比较分析', tab: 'comparison' },
  { key: 'quote', en: 'Quote', zh: '报价', tab: 'quote' },
  { key: 'follow_up', en: 'Follow-up', zh: '跟进', tab: 'activity' },
  { key: 'outcome', en: 'Outcome', zh: '结果', tab: 'activity' },
];

const STAGE_INDEX: Record<string, number> = {
  new: 0,
  needs_clarification: 1,
  clarification_sent: 1,
  customer_replied: 1,
  requirements_confirmed: 2,
  qualified: 3,
  on_hold: 1,
  declined: 8,
  duplicate: 8,
};

function getStageIndex(status: InquiryStatus): number {
  return STAGE_INDEX[status] ?? 0;
}

type TabKey = 'details' | 'requirements' | 'suppliers' | 'comparison' | 'quote' | 'activity';

const TABS: { key: TabKey; en: string; zh: string }[] = [
  { key: 'details', en: 'Details', zh: '详情' },
  { key: 'requirements', en: 'Requirements', zh: '需求' },
  { key: 'suppliers', en: 'Suppliers', zh: '供应商' },
  { key: 'comparison', en: 'Comparison', zh: '比较' },
  { key: 'quote', en: 'Quote', zh: '报价' },
  { key: 'activity', en: 'Activity', zh: '活动' },
];

/* ── Channel Labels ───────────────────────────────────────────────────────── */

function ChannelBadge({ channel }: { channel: string }) {
  const map: Record<string, { label: string; dot: string; bg: string; fg: string; border: string }> = {
    email: { label: 'Live email integration', dot: '#22C55E', bg: '#F0FDF4', fg: '#166534', border: '#BBF7D0' },
    whatsapp: { label: 'Live email integration', dot: '#22C55E', bg: '#F0FDF4', fg: '#166534', border: '#BBF7D0' },
    wechat: { label: 'Live email integration', dot: '#22C55E', bg: '#F0FDF4', fg: '#166534', border: '#BBF7D0' },
    manual: { label: 'Manual capture', dot: '#EAB308', bg: '#FEFCE8', fg: '#854D0E', border: '#FEF08A' },
    demo: { label: 'Simulated demo data', dot: '#3B82F6', bg: '#EFF6FF', fg: '#1E40AF', border: '#BFDBFE' },
  };
  const b = map[channel] ?? map.demo;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium"
      style={{ background: b.bg, color: b.fg, border: `1px solid ${b.border}` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: b.dot }} />
      {b.label}
    </span>
  );
}

/* ── Badge helpers ───────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: InquiryStatus }) {
  const map: Record<InquiryStatus, { label: string; bg: string; fg: string; border: string }> = {
    new: { label: 'New', bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
    needs_clarification: { label: 'Needs Clarification', bg: '#FFFBEB', fg: '#AD5918', border: '#FDE68A' },
    clarification_sent: { label: 'Clarification Sent', bg: '#F0F9FF', fg: '#0369A1', border: '#BAE6FD' },
    customer_replied: { label: 'Customer Replied', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
    requirements_confirmed: { label: 'Requirements Confirmed', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
    qualified: { label: 'Qualified', bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
    on_hold: { label: 'On Hold', bg: '#F3F4F6', fg: '#6B7280', border: '#D1D5DB' },
    declined: { label: 'Declined', bg: '#FEF2F2', fg: '#CC3340', border: '#FECACA' },
    duplicate: { label: 'Duplicate', bg: '#F3F4F6', fg: '#6B7280', border: '#D1D5DB' },
  };
  const b = map[status] ?? map.new;
  return (
    <span
      className="inline-flex items-center rounded-md px-2.5 py-0.5 text-[12px] font-semibold"
      style={{ background: b.bg, color: b.fg, border: `1px solid ${b.border}` }}
    >
      {b.label}
    </span>
  );
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const map: Record<string, { label: string; bg: string; fg: string; border: string }> = {
    low: { label: 'Low', bg: '#F3F4F6', fg: '#6B7280', border: '#D1D5DB' },
    medium: { label: 'Medium', bg: '#FFFBEB', fg: '#AD5918', border: '#FDE68A' },
    high: { label: 'High', bg: '#FEF2F2', fg: '#CC3340', border: '#FECACA' },
    urgent: { label: 'Urgent', bg: '#FEF2F2', fg: '#991B1B', border: '#FCA5A5' },
  };
  const b = map[urgency] ?? map.medium;
  return (
    <span
      className="inline-flex items-center rounded-md px-2.5 py-0.5 text-[12px] font-semibold"
      style={{ background: b.bg, color: b.fg, border: `1px solid ${b.border}` }}
    >
      {b.label}
    </span>
  );
}

/* ── Approval state badge ─────────────────────────────────────────────────── */

function ApprovalBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; fg: string; border: string }> = {
    draft: { label: 'Draft', bg: '#F3F4F6', fg: '#6B7280', border: '#D1D5DB' },
    pending_approval: { label: 'Pending Approval', bg: '#FFFBEB', fg: '#AD5918', border: '#FDE68A' },
    approved: { label: 'Approved', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
    sending: { label: 'Sending', bg: '#F0F9FF', fg: '#0369A1', border: '#BAE6FD' },
    sent: { label: 'Sent', bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
    failed: { label: 'Failed', bg: '#FEF2F2', fg: '#CC3340', border: '#FECACA' },
  };
  const b = map[status] ?? map.draft;
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: b.bg, color: b.fg, border: `1px solid ${b.border}` }}
    >
      {b.label}
    </span>
  );
}

/* ── Confidence bar ──────────────────────────────────────────────────────── */

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 90 ? 'var(--success)' : pct >= 70 ? 'var(--accent)' : pct >= 50 ? 'var(--warning)' : 'var(--error)';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-medium tabular-nums" style={{ color: 'var(--text-muted)', minWidth: 32 }}>
        {pct}%
      </span>
    </div>
  );
}

/* ── Source badge ─────────────────────────────────────────────────────────── */

function SourceBadge({ source }: { source: FieldSourceType }) {
  const map: Record<FieldSourceType, { label: string; icon: string; bg: string; fg: string; border: string }> = {
    customer_message: { label: 'Customer message', icon: '🟢', bg: '#F0FDF4', fg: '#166534', border: '#BBF7D0' },
    customer_attachment: { label: 'Attachment', icon: '🟢', bg: '#F0FDF4', fg: '#166534', border: '#BBF7D0' },
    customer_reply: { label: 'Customer reply', icon: '🟢', bg: '#F0FDF4', fg: '#166534', border: '#BBF7D0' },
    supplier_reply: { label: 'Supplier record', icon: '🟡', bg: '#FEFCE8', fg: '#854D0E', border: '#FEF08A' },
    user_entered: { label: 'User assumption', icon: '🟠', bg: '#FFF7ED', fg: '#9A3412', border: '#FED7AA' },
    system_default: { label: 'Missing', icon: '⚪', bg: '#F9FAFB', fg: '#6B7280', border: '#E5E7EB' },
    ai_inference: { label: 'Unverified AI', icon: '🔴', bg: '#FEF2F2', fg: '#991B1B', border: '#FECACA' },
    external_source: { label: 'Historical quote', icon: '🔵', bg: '#EFF6FF', fg: '#1E40AF', border: '#BFDBFE' },
  };
  const b = map[source] ?? map.ai_inference;
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
      style={{ background: b.bg, color: b.fg, border: `1px solid ${b.border}` }}
    >
      <span>{b.icon}</span>
      {b.label}
    </span>
  );
}

/* ── Field status badge ───────────────────────────────────────────────────── */

function FieldStatusBadge({ status }: { status: FieldStatus }) {
  const map: Record<FieldStatus, { label: string; bg: string; fg: string; border: string }> = {
    confirmed: { label: 'Confirmed', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
    extracted: { label: 'Inferred', bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
    assumption: { label: 'Needs verification', bg: '#FFFBEB', fg: '#AD5918', border: '#FDE68A' },
    missing: { label: 'Missing', bg: '#FEF2F2', fg: '#CC3340', border: '#FECACA' },
    conflict: { label: 'Conflicting', bg: '#FEF2F2', fg: '#991B1B', border: '#FCA5A5' },
    rejected: { label: 'Rejected', bg: '#F3F4F6', fg: '#6B7280', border: '#D1D5DB' },
  };
  const b = map[status] ?? map.extracted;
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
      style={{ background: b.bg, color: b.fg, border: `1px solid ${b.border}` }}
    >
      {b.label}
    </span>
  );
}

/* ── Progress tracker ────────────────────────────────────────────────────── */

function ProgressTracker({ currentIndex, onStageClick }: { currentIndex: number; onStageClick: (tab: TabKey) => void }) {
  return (
    <div className="overflow-x-auto">
      <div className="flex items-center gap-0 min-w-max py-2">
        {STAGES.map((stage, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isFuture = i > currentIndex;
          return (
            <div key={stage.key} className="flex items-center">
              <button
                onClick={() => onStageClick(stage.tab)}
                className="flex flex-col items-center group cursor-pointer"
                title={`Go to ${stage.en}`}
              >
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-all"
                  style={{
                    background: isCompleted ? 'var(--accent)' : isCurrent ? 'var(--surface)' : 'transparent',
                    color: isCompleted ? '#fff' : isCurrent ? 'var(--accent)' : '#9CA3AF',
                    border: isCurrent ? '2px solid var(--accent)' : isFuture ? '2px solid #D1D5DB' : 'none',
                  }}
                >
                  {isCompleted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-3.5 w-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className="mt-1 text-[10px] font-medium text-center leading-tight group-hover:text-[var(--accent)]"
                  style={{
                    color: isCompleted ? 'var(--accent)' : isCurrent ? 'var(--text)' : '#9CA3AF',
                    maxWidth: 68,
                  }}
                >
                  {stage.en}
                </span>
              </button>
              {i < STAGES.length - 1 && (
                <div
                  className="mx-1 h-px flex-1"
                  style={{
                    minWidth: 24,
                    background: i < currentIndex ? 'var(--accent)' : '#D1D5DB',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Card wrapper ────────────────────────────────────────────────────────── */

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[4px] border ${className}`} style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{title}</h3>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

function SidebarCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[4px] border ${className}`} style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="border-b px-3 py-2.5" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{title}</h3>
      </div>
      <div className="px-3 py-3">{children}</div>
    </div>
  );
}

/* ── Info row ────────────────────────────────────────────────────────────── */

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-[12px] shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-[12px] font-medium text-right" style={{ color: 'var(--text)' }}>{value}</span>
    </div>
  );
}

/* ── Timeline ────────────────────────────────────────────────────────────── */

interface TimelineEvent {
  id: string;
  timestamp: string;
  label: string;
  color: string;
}

function ActivityTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="space-y-0">
      {events.map((ev, i) => (
        <div key={ev.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="h-2.5 w-2.5 rounded-full shrink-0 mt-1" style={{ background: ev.color }} />
            {i < events.length - 1 && <div className="w-px flex-1 my-1" style={{ background: 'var(--border)' }} />}
          </div>
          <div className="pb-4 min-w-0">
            <div className="text-[12px] font-medium leading-tight" style={{ color: 'var(--text)' }}>{ev.label}</div>
            <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{formatRelativeTime(ev.timestamp)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Clarification Question ───────────────────────────────────────────────── */

interface ClarificationQuestion {
  id: string;
  fieldKey: string;
  question: string;
  confidence: number;
  status: 'draft' | 'sent' | 'answered';
}

function ClarificationQuestions({ questions, onApprove, onSkip, onSend }: {
  questions: ClarificationQuestion[];
  onApprove: (id: string) => void;
  onSkip: (id: string) => void;
  onSend: () => void;
}) {
  const draftQuestions = questions.filter((q) => q.status === 'draft');
  const sentQuestions = questions.filter((q) => q.status === 'sent' || q.status === 'answered');

  return (
    <div className="space-y-4">
      {draftQuestions.length > 0 && (
        <div className="space-y-2">
          {draftQuestions.map((q) => (
            <div key={q.id} className="flex items-start gap-3 rounded-[4px] border p-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-medium px-1.5 py-0.5 rounded" style={{ background: '#F3F4F6', color: 'var(--text-muted)' }}>
                    {q.fieldKey}
                  </span>
                  <ConfidenceBar value={q.confidence} />
                </div>
                <p className="text-[13px]" style={{ color: 'var(--text)' }}>{q.question}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => onApprove(q.id)}
                  className="rounded px-2 py-1 text-[11px] font-medium"
                  style={{ background: '#ECFDF5', color: 'var(--success)', border: '1px solid #A7F3D0' }}
                >
                  Approve
                </button>
                <button
                  onClick={() => onSkip(q.id)}
                  className="rounded px-2 py-1 text-[11px] font-medium"
                  style={{ background: '#F3F4F6', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                >
                  Skip
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={onSend}
            className="w-full rounded-lg px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'var(--accent)' }}
          >
            Send Clarification ({draftQuestions.length} questions)
          </button>
        </div>
      )}
      {sentQuestions.length > 0 && (
        <div className="space-y-2">
          {sentQuestions.map((q) => (
            <div key={q.id} className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>
              <span className={`h-1.5 w-1.5 rounded-full ${q.status === 'answered' ? 'bg-green-500' : 'bg-blue-500'}`} />
              <span className="line-through">{q.question}</span>
              <span className="text-[10px]">({q.status})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
/* ── Page component ─────────────────────────────────────────────────────── */
/* ════════════════════════════════════════════════════════════════════════════ */

export default function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const demo = useDemo();
  const [activeTab, setActiveTab] = useState<TabKey>('details');

  const {
    inquiry,
    inquiryFields,
    customers,
    users,
    suppliers,
    opportunity,
    rfqBatch,
    supplierResponses,
    quote,
    followUp,
    messages,
    conversation,
    requirementVersions,
    advanceInquiryStatus,
  } = demo;

  const customer = customers.find((c) => c.id === inquiry.customerId);
  const owner = users.find((u) => u.id === inquiry.ownerId);
  const category = demo.categories.find((c) => c.id === inquiry.categoryId);
  const requirementVersion = requirementVersions[0];
  const stageIndex = getStageIndex(inquiry.status);

  // Missing required fields
  const missingRequired = inquiryFields.filter((f) => f.isRequired && f.status === 'missing');
  const fieldValues = inquiryFields.filter((f) => f.status !== 'missing');

  // Clarification questions
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([
    { id: 'cq1', fieldKey: 'certifications', question: 'Do you require any specific certifications (FDA, LFGB, BPA-Free) for the vacuum bottles? Some markets require specific compliance.', confidence: 0.9, status: 'draft' },
    { id: 'cq2', fieldKey: 'packaging', question: 'What packaging do you prefer — individual gift boxes, bulk packaging, or custom branded boxes? This affects pricing.', confidence: 0.85, status: 'draft' },
    { id: 'cq3', fieldKey: 'payment_terms', question: 'What payment terms do you typically work with? Our standard is 30/70 T/T.', confidence: 0.7, status: 'draft' },
    { id: 'cq4', fieldKey: 'colour', question: 'Which colours are you looking for? We have Silver, Black, Rose Gold, and Navy Blue available.', confidence: 0.75, status: 'draft' },
  ]);

  // Activity timeline events
  const timelineEvents: TimelineEvent[] = [
    { id: 'ev1', timestamp: inquiry.createdAt, label: 'Inquiry received via email', color: 'var(--accent)' },
    { id: 'ev2', timestamp: '2026-09-15T09:10:00Z', label: 'AI extracted 11 fields from customer message', color: '#A21CAF' },
    ...(inquiry.status !== 'new'
      ? [{ id: 'ev3', timestamp: '2026-09-15T09:15:00Z', label: 'Clarification questions generated', color: '#A21CAF' }]
      : []),
    ...(inquiry.status === 'requirements_confirmed' || inquiry.status === 'qualified'
      ? [
          { id: 'ev4', timestamp: '2026-09-15T14:45:00Z', label: 'Customer replied with additional details', color: 'var(--success)' },
          { id: 'ev5', timestamp: '2026-09-16T11:30:00Z', label: 'Requirements confirmed (v1)', color: 'var(--success)' },
        ]
      : []),
    ...(rfqBatch
      ? [
          { id: 'ev6', timestamp: rfqBatch.createdAt, label: `RFQ batch ${rfqBatch.referenceNumber} created`, color: 'var(--accent)' },
          { id: 'ev7', timestamp: '2026-09-17T09:00:00Z', label: `RFQs sent to ${rfqBatch.rfqs.length} suppliers`, color: 'var(--accent)' },
        ]
      : []),
    ...(supplierResponses.length > 0
      ? [
          { id: 'ev8', timestamp: '2026-09-18T06:15:00Z', label: 'Shenzhen Steel Works responded', color: 'var(--success)' },
          { id: 'ev9', timestamp: '2026-09-18T10:30:00Z', label: 'Yiwu Drinkware responded', color: 'var(--success)' },
        ]
      : []),
    ...(quote
      ? [
          { id: 'ev10', timestamp: quote.createdAt, label: `Quote ${quote.referenceNumber} created`, color: 'var(--accent)' },
          { id: 'ev11', timestamp: quote.sentAt ?? quote.createdAt, label: 'Quote sent to customer', color: 'var(--accent)' },
        ]
      : []),
  ];

  // Supplier RFQ summaries
  const supplierSummaries = rfqBatch?.rfqs.map((rfq) => {
    const supplier = suppliers.find((s) => s.id === rfq.supplierId);
    const response = supplierResponses.find((r) => r.supplierRfqId === rfq.id);
    return { ...rfq, supplier, response };
  }) ?? [];

  // Next action determination
  const nextActionMap: Record<string, string> = {
    new: 'Extract requirements from customer message',
    needs_clarification: 'Send clarification questions to customer',
    clarification_sent: 'Wait for customer response',
    customer_replied: 'Review and confirm requirements',
    requirements_confirmed: 'Match suppliers and create RFQ batch',
    qualified: 'Create RFQ batch for suppliers',
    on_hold: 'Resume inquiry processing',
  };

  // Missing fields for context panel
  const missingFields = inquiryFields.filter((f) => f.status === 'missing');
  const inferredFields = inquiryFields.filter((f) => f.status === 'assumption');

  return (
    <div className="space-y-6">
      {/* ── Back link ──────────────────────────────────────────────────── */}
      <Link
        href="/admin/inquiries"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Inquiries
      </Link>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="rounded-[4px] border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>
                {customer?.contactName ?? 'Unknown Customer'}
              </h1>
              <ChannelBadge channel={conversation.channel} />
              <StatusBadge status={inquiry.status} />
              <UrgencyBadge urgency={inquiry.urgency} />
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-[14px] font-medium" style={{ color: 'var(--text-muted)' }}>
                {customer?.companyName}
              </span>
              <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                {inquiry.referenceNumber}
              </span>
              <span className="text-[13px] font-semibold" style={{ color: 'var(--accent)' }}>
                {formatCurrency(inquiry.estimatedValue, inquiry.currency)}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: 'var(--text-muted)' }}>
              Category
            </div>
            <div className="text-[13px] font-medium mt-0.5" style={{ color: 'var(--text)' }}>
              {category?.name ?? '—'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Progress Tracker ───────────────────────────────────────────── */}
      <Card title="Progress">
        <ProgressTracker currentIndex={stageIndex} onStageClick={setActiveTab} />
      </Card>

      {/* ── Two-column layout ──────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* ═══ LEFT COLUMN (main) ═════════════════════════════════════════ */}
        <div className="flex-1 min-w-0" style={{ flexBasis: '65%' }}>
          {/* Tab navigation */}
          <div className="flex items-center gap-0.5 rounded-[4px] border p-1 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="rounded-[4px] px-3 py-1.5 text-[13px] font-medium transition-colors"
                style={{
                  background: activeTab === tab.key ? 'var(--accent)' : 'transparent',
                  color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
                }}
              >
                {tab.en}
              </button>
            ))}
          </div>

          {/* ═══ TAB: Details ════════════════════════════════════════════ */}
          {activeTab === 'details' && (
            <Card title="Original Conversation">
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {messages.filter((m) => m.conversationId === conversation.id).map((msg) => {
                  const isInbound = msg.direction === 'inbound';
                  return (
                    <div key={msg.id} className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}>
                      <div
                        className="max-w-[85%] rounded-lg px-4 py-3"
                        style={{
                          background: isInbound ? 'var(--accent-light)' : '#F3F4F6',
                          border: `1px solid ${isInbound ? 'var(--border)' : '#E5E7EB'}`,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>
                            {msg.senderName}
                          </span>
                          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            {formatDateTime(msg.receivedAt)}
                          </span>
                        </div>
                        <div className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text)' }}>
                          {msg.bodyText}
                        </div>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {msg.attachments.map((att) => (
                              <span
                                key={att.id}
                                className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium"
                                style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3 w-3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                                </svg>
                                {att.fileName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* ═══ TAB: Requirements ═══════════════════════════════════════ */}
          {activeTab === 'requirements' && (
            <div className="space-y-6">
              {/* Missing required fields alert */}
              {missingRequired.length > 0 && (
                <div
                  className="rounded-[4px] border px-4 py-3"
                  style={{ background: '#FEF2F2', borderColor: '#FECACA' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4" style={{ color: 'var(--error)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--error)' }}>
                      Missing Required Fields
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {missingRequired.map((f) => (
                      <span
                        key={f.fieldKey}
                        className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium"
                        style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }}
                      >
                        {f.fieldLabel}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Fields table */}
              <Card title="Extracted Fields">
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                        <th className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>Field</th>
                        <th className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>Value</th>
                        <th className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>Source</th>
                        <th className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>Confidence</th>
                        <th className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inquiryFields.map((field) => (
                        <tr
                          key={field.fieldKey}
                          className="border-b last:border-b-0"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--text)' }}>
                            {field.fieldLabel}
                            {field.isRequired && (
                              <span className="ml-1" style={{ color: 'var(--error)' }}>*</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            {field.status === 'missing' ? (
                              <span className="italic" style={{ color: 'var(--error)' }}>Missing</span>
                            ) : (
                              <span style={{ color: 'var(--text)' }}>
                                {field.normalizedValue || field.rawValue}
                                {field.unit && (
                                  <span className="ml-0.5" style={{ color: 'var(--text-muted)' }}>{field.unit}</span>
                                )}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <SourceBadge source={field.sourceType} />
                          </td>
                          <td className="px-3 py-2.5" style={{ minWidth: 100 }}>
                            <ConfidenceBar value={field.confidence} />
                          </td>
                          <td className="px-3 py-2.5">
                            <FieldStatusBadge status={field.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Clarification Questions */}
              <Card title="Clarification Questions">
                <ClarificationQuestions
                  questions={clarificationQuestions}
                  onApprove={(qId) => {
                    setClarificationQuestions((prev) =>
                      prev.map((q) => (q.id === qId ? { ...q, status: 'sent' as const } : q))
                    );
                  }}
                  onSkip={(qId) => {
                    setClarificationQuestions((prev) => prev.filter((q) => q.id !== qId));
                  }}
                  onSend={() => {
                    setClarificationQuestions((prev) =>
                      prev.map((q) => (q.status === 'draft' ? { ...q, status: 'sent' as const } : q))
                    );
                  }}
                />
              </Card>

              {/* Clarification Email Draft */}
              {inquiry.status === 'needs_clarification' && (
                <Card title="Clarification Email Draft">
                  <div className="space-y-3">
                    <div
                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium"
                      style={{ background: '#FDF4FF', color: '#A21CAF', border: '1px solid #F0ABFC' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                      </svg>
                      AI Generated — Awaiting approval
                    </div>
                    <div
                      className="rounded-[4px] border p-4 text-[13px] leading-relaxed whitespace-pre-wrap"
                      style={{ background: '#F8FAFD', borderColor: 'var(--border)', color: 'var(--text)' }}
                    >
                      {messages.find((m) => m.classification === 'customer_clarification' && m.direction === 'outbound')?.bodyText ??
                        'No clarification draft available.'}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        className="rounded-lg px-4 py-2 text-[13px] font-medium transition-all"
                        style={{ background: 'var(--accent)', color: '#fff' }}
                        onClick={() => advanceInquiryStatus('clarification_sent')}
                      >
                        Approve & Send
                      </button>
                      <button className="secondary-btn">
                        Edit
                      </button>
                      <button
                        className="rounded-lg px-4 py-2 text-[13px] font-medium transition-all"
                        style={{ background: '#FEF2F2', color: 'var(--error)', border: '1px solid #FECACA' }}
                        onClick={() => advanceInquiryStatus('new')}
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ═══ TAB: Suppliers ══════════════════════════════════════════ */}
          {activeTab === 'suppliers' && (
            <RFQTab
              rfqBatch={rfqBatch}
              supplierSummaries={supplierSummaries}
              suppliers={suppliers}
              opportunity={opportunity}
            />
          )}

          {/* ═══ TAB: Comparison ═════════════════════════════════════════ */}
          {activeTab === 'comparison' && (
            <ComparisonTab
              comparison={demo.comparison}
              supplierResponses={supplierResponses}
              suppliers={suppliers}
              rfqBatch={rfqBatch}
            />
          )}

          {/* ═══ TAB: Quote ══════════════════════════════════════════════ */}
          {activeTab === 'quote' && (
            <QuoteTab
              quote={quote}
              costCalculation={demo.costCalculation}
              customer={customer}
              opportunity={opportunity}
            />
          )}

          {/* ═══ TAB: Activity ════════════════════════════════════════════ */}
          {activeTab === 'activity' && (
            <Card title="Activity Timeline">
              <ActivityTimeline events={timelineEvents} />
            </Card>
          )}
        </div>

        {/* ═══ RIGHT COLUMN (sidebar) ════════════════════════════════════ */}
        <div className="space-y-4 xl:w-[35%] shrink-0">

          {/* Context Panel — ALWAYS shows current state and next action */}
          <SidebarCard title="Workflow State">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Current Stage</span>
                <span className="text-[12px] font-semibold" style={{ color: 'var(--accent)' }}>
                  {STAGES[stageIndex]?.en ?? 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Next Action</span>
                <span className="text-[12px] font-medium text-right max-w-[180px]" style={{ color: 'var(--text)' }}>
                  {nextActionMap[inquiry.status] ?? 'Review inquiry'}
                </span>
              </div>
              {missingFields.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Missing Info</span>
                  <span className="text-[12px] font-medium" style={{ color: 'var(--warning)' }}>
                    {missingFields.length} fields
                  </span>
                </div>
              )}
              {inferredFields.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Unverified</span>
                  <span className="text-[12px] font-medium" style={{ color: 'var(--warning)' }}>
                    {inferredFields.length} fields
                  </span>
                </div>
              )}
            </div>
          </SidebarCard>

          {/* 7. Customer Card */}
          <SidebarCard title="Customer">
            <div className="space-y-1">
              <InfoRow label="Name" value={customer?.contactName ?? '—'} />
              <InfoRow label="Company" value={customer?.companyName ?? '—'} />
              <InfoRow label="Email" value={
                <span className="truncate max-w-[180px] block">{customer?.email ?? '—'}</span>
              } />
              <InfoRow label="Phone" value={customer?.phone ?? '—'} />
              <InfoRow label="Country" value={customer?.country ?? '—'} />
            </div>
          </SidebarCard>

          {/* 8. Opportunity Card */}
          {opportunity && (
            <SidebarCard title="Opportunity">
              <div className="space-y-1">
                <InfoRow label="Value" value={
                  <span className="font-semibold" style={{ color: 'var(--accent)' }}>
                    {formatCurrency(opportunity.estimatedValue, opportunity.currency)}
                  </span>
                } />
                <InfoRow label="Target Margin" value={`${opportunity.targetMarginPercent}%`} />
                <InfoRow label="Next Action" value={
                  <span className="text-right max-w-[160px] block">{opportunity.nextAction}</span>
                } />
                <InfoRow label="Owner" value={
                  users.find((u) => u.id === opportunity.ownerId)?.name ?? '—'
                } />
              </div>
            </SidebarCard>
          )}

          {/* 9. Supplier RFQ Summary */}
          {rfqBatch && (
            <SidebarCard title="Supplier RFQ">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                    {rfqBatch.referenceNumber}
                  </span>
                  <ApprovalBadge status={rfqBatch.status} />
                </div>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Deadline: {formatDate(rfqBatch.responseDeadline)}
                </div>
                <div className="border-t pt-2 space-y-2" style={{ borderColor: 'var(--border)' }}>
                  {supplierSummaries.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[12px] font-medium truncate" style={{ color: 'var(--text)' }}>
                          {s.supplier?.name ?? 'Unknown'}
                        </div>
                        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {s.supplier?.country}
                        </div>
                      </div>
                      <ApprovalBadge status={s.status} />
                    </div>
                  ))}
                </div>
              </div>
            </SidebarCard>
          )}

          {/* 10. Quote Summary */}
          {quote && (
            <SidebarCard title="Quote">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                    {quote.referenceNumber}
                  </span>
                  <ApprovalBadge status={quote.status} />
                </div>
                <div className="space-y-1">
                  <InfoRow label="Customer Price" value={
                    <span className="font-semibold" style={{ color: 'var(--accent)' }}>
                      {formatCurrency(quote.customerPrice, quote.currency)}
                    </span>
                  } />
                  <InfoRow label="Margin" value={
                    <span style={{ color: quote.internalView.marginPercent >= 20 ? 'var(--success)' : 'var(--warning)' }}>
                      {quote.internalView.marginPercent.toFixed(1)}%
                    </span>
                  } />
                  <InfoRow label="Valid Until" value={formatDate(quote.validUntil)} />
                </div>
              </div>
            </SidebarCard>
          )}

          {/* 11. Follow-up Status */}
          {followUp && (
            <SidebarCard title="Follow-up">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium" style={{ color: 'var(--text)' }}>
                    Step {followUp.currentStep + 1}/{followUp.steps.length}
                  </span>
                  <ApprovalBadge status={followUp.status} />
                </div>
                <InfoRow label="Next Due" value={formatDate(followUp.nextDueAt)} />
                <div className="border-t pt-2 space-y-1.5" style={{ borderColor: 'var(--border)' }}>
                  {followUp.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{
                          background: step.status === 'completed' ? 'var(--success)' :
                            i === followUp.currentStep ? 'var(--accent)' : '#D1D5DB',
                        }}
                      />
                      <span
                        className="text-[11px] truncate"
                        style={{
                          color: step.status === 'completed' ? 'var(--text-muted)' : 'var(--text)',
                          textDecoration: step.status === 'completed' ? 'line-through' : 'none',
                        }}
                      >
                        Day {step.day}: {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </SidebarCard>
          )}

          {/* 12. Activity Timeline (mini) */}
          <SidebarCard title="Recent Activity">
            <ActivityTimeline events={timelineEvents.slice(0, 5)} />
          </SidebarCard>

          {/* 13. Primary Action Button */}
          <div className="space-y-3">
            {inquiry.status === 'new' && (
              <button
                onClick={() => advanceInquiryStatus('needs_clarification')}
                className="w-full rounded-lg px-4 py-3 text-[14px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'var(--accent)' }}
              >
                Start Qualification
              </button>
            )}
            {inquiry.status === 'needs_clarification' && (
              <button
                onClick={() => advanceInquiryStatus('clarification_sent')}
                className="w-full rounded-lg px-4 py-3 text-[14px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'var(--accent)' }}
              >
                Send Clarification
              </button>
            )}
            {inquiry.status === 'clarification_sent' && (
              <button
                onClick={() => advanceInquiryStatus('customer_replied')}
                className="w-full rounded-lg px-4 py-3 text-[14px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'var(--accent)' }}
              >
                Mark Customer Replied
              </button>
            )}
            {inquiry.status === 'customer_replied' && (
              <button
                onClick={() => advanceInquiryStatus('requirements_confirmed')}
                className="w-full rounded-lg px-4 py-3 text-[14px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'var(--accent)' }}
              >
                Confirm Requirements
              </button>
            )}
            {inquiry.status === 'requirements_confirmed' && (
              <button
                onClick={() => advanceInquiryStatus('qualified')}
                className="w-full rounded-lg px-4 py-3 text-[14px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'var(--accent)' }}
              >
                Find Suppliers
              </button>
            )}
            {inquiry.status === 'qualified' && (
              <button
                onClick={() => setActiveTab('suppliers')}
                className="w-full rounded-lg px-4 py-3 text-[14px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'var(--accent)' }}
              >
                Create RFQ Batch
              </button>
            )}
            {inquiry.status === 'on_hold' && (
              <button
                onClick={() => advanceInquiryStatus('requirements_confirmed')}
                className="w-full rounded-lg px-4 py-3 text-[14px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'var(--accent)' }}
              >
                Resume
              </button>
            )}
            <div className="text-center">
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Owner: {owner?.name ?? '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
