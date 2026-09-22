'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLang } from '@/lib/lang';

// ─── Types ───────────────────────────────────────────────────

type DraftStatus = 'draft' | 'pending_approval' | 'approved' | 'sent' | 'rejected';

interface Draft {
  id: string;
  channel: 'email' | 'whatsapp';
  toName: string;
  toEmail: string;
  subject: string;
  body: string;
  aiReasoning: string;
  citations: { field: string; source: string; confidence: number; snippet: string }[];
  status: DraftStatus;
  inquiryId: string;
  inquiryTitle: string;
  createdAt: string;
  sentAt?: string;
}

const MOCK_DRAFTS: Draft[] = [
  {
    id: 'd1',
    channel: 'email',
    toName: 'James Wilson',
    toEmail: 'james@goldenimports.com',
    subject: 'Re: Stainless Steel Water Bottle RFQ',
    body: `Hi James,

Thank you for your inquiry about stainless steel water bottles.

Based on your requirements (500ml, 10,000 pcs, FOB Shenzhen), here's our preliminary pricing:

• Unit Price: $3.85/pc (FOB Shenzhen)
• Lead Time: 25-30 days after deposit
• MOQ: 1,000 pcs
• Payment: 30% T/T deposit, 70% before shipment

This pricing includes single-color screen printing. For laser engraving, add $0.15/pc.

Let me know if you'd like samples or have any questions.

Best regards,
Pacific Trading Co.`,
    aiReasoning: 'Drafted quote using knowledge base: similar 500ml SS bottle priced at $3.85 (ref: product_spec_ss_bottle_001). Supplier base price $2.40 + $0.60 margin + $0.85 overhead. Confidence: high — 3 similar quotes sent in past 60 days at this price point.',
    citations: [
      { field: 'unit_price', source: 'Product Spec: SS Bottle 500ml', confidence: 0.92, snippet: 'FOB price range: $3.60-$4.20 depending on finish' },
      { field: 'lead_time', source: 'Supplier Profile: Shenzhen Steel', confidence: 0.88, snippet: 'Standard lead time 25-30 days for orders >5000pcs' },
      { field: 'payment_terms', source: 'Terms & Conditions', confidence: 0.95, snippet: 'Standard: 30% deposit, 70% balance before shipment' },
      { field: 'moq', source: 'Supplier Profile: Shenzhen Steel', confidence: 0.90, snippet: 'MOQ 1000pcs for standard items' },
    ],
    status: 'pending_approval',
    inquiryId: 'inq-001',
    inquiryTitle: 'Stainless Steel Water Bottle RFQ',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'd2',
    channel: 'whatsapp',
    toName: 'Sarah Chen',
    toEmail: '+85291234567',
    subject: '',
    body: `Hi Sarah,

Thanks for the quick reply! I've checked with our supplier:

• Logo: Laser engraving is available at no extra cost for orders >5,000pc
• Color: Matte black is in stock, ships within 2 weeks
• Sample: Can ship 2 samples this week, free of charge

Want me to send the sample? I can have it at your office by Thursday.`,
    aiReasoning: 'Follow-up draft for WhatsApp. Knowledge base indicates this supplier offers free engraving above 5k units (ref: supplier_profile_shenzhen_002). Sample policy: 2 free samples for qualified leads (ref: process_sample_policy). Confidence: high.',
    citations: [
      { field: 'logo', source: 'Supplier Profile: Shenzhen Steel', confidence: 0.94, snippet: 'Free laser engraving for orders >5000 units' },
      { field: 'sample', source: 'Process: Sample Policy', confidence: 0.91, snippet: '2 free samples for qualified leads, ship within 3 business days' },
    ],
    status: 'pending_approval',
    inquiryId: 'inq-002',
    inquiryTitle: 'Custom Water Bottle Follow-up',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'd3',
    channel: 'email',
    toName: 'Mike Johnson',
    toEmail: 'mike@eurobuyers.de',
    subject: 'Re: Glass Jar Order - 20,000 pcs',
    body: `Hi Mike,

Following up on our previous conversation about the glass jar order.

I wanted to let you know that we can confirm:
• 20,000 pcs at $1.25/pc (FOB Shenzhen)
• Lead time: 35-40 days
• Custom label printing included
• Individual box packaging

The deposit would be $7,500 (30%), with the balance due before shipment.

Please let me know if you'd like to proceed.

Best regards,
Pacific Trading Co.`,
    aiReasoning: 'Quote follow-up. Previous draft was sent 3 days ago but customer hasn\'t responded. This is a gentle reminder with confirmed pricing. Knowledge base: glass jar supplier confirmed availability (ref: supplier_profile_glass_001). Confidence: medium — price was confirmed verbally but not in writing.',
    citations: [
      { field: 'unit_price', source: 'Supplier Profile: Glass Jars', confidence: 0.78, snippet: 'Verbal confirmation: $1.25/pc for 20k+ orders' },
    ],
    status: 'sent',
    inquiryId: 'inq-003',
    inquiryTitle: 'Glass Jar Order Follow-up',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

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
    pending_approval: { label: 'Pending Approval', bg: '#FFFBEB', fg: '#AD5918', border: '#FDE68A' },
    approved: { label: 'Approved', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
    sent: { label: 'Sent', bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
    rejected: { label: 'Rejected', bg: '#FEF2F2', fg: '#CC3340', border: '#FECACA' },
  };
  const s = map[status];
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ background: s.bg, color: s.fg, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

// ─── Page ────────────────────────────────────────────────────

export default function DraftReviewPage() {
  const { t } = useLang();
  const [drafts, setDrafts] = useState<Draft[]>(MOCK_DRAFTS);
  const [selectedId, setSelectedId] = useState<string | null>(drafts[0]?.id || null);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState('');
  const [filter, setFilter] = useState<'all' | DraftStatus>('all');

  const selected = drafts.find((d) => d.id === selectedId);

  const startEdit = () => {
    if (selected) {
      setEditBody(selected.body);
      setEditing(true);
    }
  };

  const saveEdit = () => {
    if (selected) {
      setDrafts((prev) => prev.map((d) => (d.id === selected.id ? { ...d, body: editBody } : d)));
      setEditing(false);
    }
  };

  const approveDraft = (id: string) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'approved' as const } : d)));
  };

  const rejectDraft = (id: string) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'rejected' as const } : d)));
  };

  const sendDraft = (id: string) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'sent' as const, sentAt: new Date().toISOString() } : d)));
  };

  const filteredDrafts = filter === 'all' ? drafts : drafts.filter((d) => d.status === filter);

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] md:text-[24px] font-semibold tracking-[-0.5px]">Draft Review</h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Review, edit, and approve AI-drafted messages before sending
          </p>
        </div>
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
                  ({f === 'all' ? drafts.length : drafts.filter((d) => d.status === f).length})
                </span>
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filteredDrafts.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                No drafts in this category
              </div>
            )}
            {filteredDrafts.map((draft) => (
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
                  <span className="text-[12px] font-semibold truncate flex-1">{draft.toName}</span>
                  <StatusPill status={draft.status} />
                </div>
                {draft.subject && <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{draft.subject}</p>}
                <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {draft.body.slice(0, 80)}...
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {new Date(draft.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--accent)' }}>
                    {draft.citations.length} citations
                  </span>
                </div>
              </button>
            ))}
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
                      <span className="text-[14px] font-semibold">{selected.toName}</span>
                      <StatusPill status={selected.status} />
                    </div>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {selected.channel === 'email' ? selected.toEmail : `WhatsApp: ${selected.toEmail}`}
                      {' · '}
                      <Link href={`/admin/inquiries/${selected.inquiryId}`} className="hover:underline" style={{ color: 'var(--accent)' }}>
                        {selected.inquiryTitle}
                      </Link>
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {selected.status === 'pending_approval' && (
                    <>
                      <button onClick={startEdit} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border" style={{ borderColor: 'var(--border)' }}>
                        Edit
                      </button>
                      <button onClick={() => rejectDraft(selected.id)} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                        Reject
                      </button>
                      <button onClick={() => approveDraft(selected.id)} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: 'var(--accent)' }}>
                        Approve
                      </button>
                    </>
                  )}
                  {selected.status === 'approved' && (
                    <button onClick={() => sendDraft(selected.id)} className="px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: '#2563EB' }}>
                      Send Now →
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
                          <button onClick={saveEdit} className="text-[11px] px-2 py-1 rounded text-white" style={{ background: 'var(--accent)' }}>
                            Save
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

                    {selected.subject && !editing && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Subject:</span>
                        <span className="text-[12px]">{selected.subject}</span>
                      </div>
                    )}
                  </div>

                  {/* Right panel: AI reasoning + citations */}
                  <div className="xl:col-span-2 p-4 space-y-4">
                    {/* AI Reasoning */}
                    <div>
                      <h3 className="text-[12px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                        🧠 AI Reasoning
                      </h3>
                      <p className="text-[12px] leading-relaxed p-3 rounded-lg" style={{ background: 'var(--bg)' }}>
                        {selected.aiReasoning}
                      </p>
                    </div>

                    {/* Citations */}
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
                            <p className="text-[10px] italic" style={{ color: 'var(--text-muted)' }}>&ldquo;{cite.snippet}&rdquo;</p>
                          </div>
                        ))}
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
