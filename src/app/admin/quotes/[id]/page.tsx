'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useDemo } from '@/lib/demo-store';
import { useLang } from '@/lib/lang';
import { formatDate, formatDateTime, formatCurrency, formatNumber } from '@/lib/utils';
import type { CostSource } from '@/lib/types';

/* ── Status badges ──────────────────────────────────────────────────────── */

const QUOTE_STATUS: Record<string, { en: string; zh: string; bg: string; fg: string; border: string }> = {
  draft: { en: 'Draft', zh: '草稿', bg: '#F3F4F6', fg: '#6B7280', border: '#D1D5DB' },
  pending_approval: { en: 'Pending Approval', zh: '待审批', bg: '#FFFBEB', fg: '#D97706', border: '#FDE68A' },
  approved: { en: 'Approved', zh: '已批准', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
  sending: { en: 'Sending', zh: '发送中', bg: '#F0F9FF', fg: '#0369A1', border: '#BAE6FD' },
  sent: { en: 'Sent', zh: '已发送', bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
  viewed: { en: 'Viewed', zh: '已查看', bg: '#F5F3FF', fg: '#7C3AED', border: '#DDD6FE' },
  negotiation: { en: 'Negotiation', zh: '谈判中', bg: '#FFFBEB', fg: '#D97706', border: '#FDE68A' },
  accepted: { en: 'Accepted', zh: '已接受', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
  rejected: { en: 'Rejected', zh: '已拒绝', bg: '#FEF2F2', fg: '#CC3340', border: '#FECACA' },
  expired: { en: 'Expired', zh: '已过期', bg: '#F3F4F6', fg: '#9CA3AF', border: '#D1D5DB' },
};

function QuoteStatusBadge({ status }: { status: string }) {
  const { t } = useLang();
  const b = QUOTE_STATUS[status] ?? QUOTE_STATUS.draft;
  return (
    <span
      className="inline-flex items-center rounded-md px-2.5 py-0.5 text-[12px] font-semibold"
      style={{ background: b.bg, color: b.fg, border: `1px solid ${b.border}` }}
    >
      {t(b.en, b.zh)}
    </span>
  );
}

/* ── Cost source badge ──────────────────────────────────────────────────── */

const SOURCE_BADGE: Record<CostSource, { en: string; zh: string; bg: string; fg: string }> = {
  supplier_quote: { en: 'Supplier Quote', zh: '供应商报价', bg: '#EFF6FF', fg: '#2563EB' },
  user_entered: { en: 'User Entered', zh: '用户输入', bg: '#ECFDF5', fg: '#038153' },
  system_default: { en: 'System Default', zh: '系统默认', bg: '#F3F4F6', fg: '#6B7280' },
  external_estimate: { en: 'External Estimate', zh: '外部估算', bg: '#FFFBEB', fg: '#D97706' },
  unverified: { en: 'Unverified', zh: '未验证', bg: '#FEF2F2', fg: '#CC3340' },
};

function SourceBadge({ source }: { source: CostSource }) {
  const { t } = useLang();
  const b = SOURCE_BADGE[source] ?? SOURCE_BADGE.system_default;
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium"
      style={{ background: b.bg, color: b.fg }}
    >
      {t(b.en, b.zh)}
    </span>
  );
}

/* ── Card wrapper ────────────────────────────────────────────────────────── */

function Card({ title, titleZh, children, className = '' }: { title: string; titleZh: string; children: React.ReactNode; className?: string }) {
  const { t } = useLang();
  return (
    <div className={`rounded-[4px] border ${className}`} style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{t(title, titleZh)}</h3>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

/* ── Info row ────────────────────────────────────────────────────────────── */

function InfoRow({ label, value, zh }: { label: string; value: React.ReactNode; zh?: string }) {
  const { t } = useLang();
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-[12px] shrink-0" style={{ color: 'var(--text-muted)' }}>{t(label, zh ?? label)}</span>
      <span className="text-[12px] font-medium text-right" style={{ color: 'var(--text)' }}>{value}</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
/* ── Tab 1: Internal Review ─────────────────────────────────────────────── */
/* ════════════════════════════════════════════════════════════════════════════ */

function InternalReviewTab() {
  const { t } = useLang();
  const demo = useDemo();
  const { quote, suppliers, users, customers, opportunity, approveQuote, sendQuote } = demo;
  const supplier = suppliers.find((s) => s.id === quote.internalView.supplierId);
  const customer = customers.find((c) => c.id === opportunity.customerId);
  const creator = users.find((u) => u.id === quote.createdBy);
  const approver = users.find((u) => u.id === quote.approvedBy);

  const handleApprove = () => approveQuote(quote.id);
  const handleSend = () => sendQuote(quote.id);

  return (
    <div className="space-y-6">
      {/* Quote header */}
      <div className="rounded-[4px] border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-[18px] font-bold" style={{ color: 'var(--text)' }}>
                {quote.referenceNumber}
              </h2>
              <QuoteStatusBadge status={quote.status} />
            </div>
            <div className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
              {t('Customer', '客户')}: <span className="font-medium" style={{ color: 'var(--text)' }}>{customer?.companyName}</span>
              {customer?.contactName && <span> — {customer.contactName}</span>}
            </div>
          </div>
          <div className="text-right space-y-0.5">
            <div className="text-[20px] font-bold tabular-nums" style={{ color: 'var(--accent)' }}>
              {formatCurrency(quote.customerPrice, quote.currency)}
            </div>
            <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
              {t('Created', '创建')}: {formatDateTime(quote.createdAt)}
            </div>
            {quote.sentAt && (
              <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                {t('Sent', '发送')}: {formatDateTime(quote.sentAt)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cost breakdown */}
      <Card title="Cost Breakdown" titleZh="成本明细">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>
                  {t('Line Item', '明细项目')}
                </th>
                <th className="px-3 py-2 text-right font-semibold" style={{ color: 'var(--text-muted)' }}>
                  {t('Amount', '金额')}
                </th>
                <th className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>
                  {t('Source', '来源')}
                </th>
                <th className="px-3 py-2 text-center font-semibold" style={{ color: 'var(--text-muted)' }}>
                  {t('Confirmed', '已确认')}
                </th>
              </tr>
            </thead>
            <tbody>
              {quote.internalView.costBreakdown.map((line) => (
                <tr
                  key={line.key}
                  className="border-b last:border-b-0"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--text)' }}>
                    {line.label}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold" style={{ color: 'var(--text)' }}>
                    {formatCurrency(line.amount)}
                  </td>
                  <td className="px-3 py-2.5">
                    <SourceBadge source={line.source} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {line.confirmed ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4 mx-auto" style={{ color: 'var(--success)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 mx-auto" style={{ color: '#D1D5DB' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary */}
      <Card title="Summary" titleZh="摘要">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Cost', zh: '总成本', value: formatCurrency(quote.internalView.supplierCost + quote.internalView.costBreakdown.reduce((s, l) => s + l.amount, 0) - (quote.internalView.costBreakdown.find(l => l.key === 'unit_cost')?.amount ?? 0) - (quote.internalView.costBreakdown.find(l => l.key === 'packaging')?.amount ?? 0)), color: 'var(--text)' },
            { label: 'Customer Price', zh: '客户价格', value: formatCurrency(quote.customerPrice), color: 'var(--accent)' },
            { label: 'Gross Profit', zh: '毛利', value: formatCurrency(quote.customerPrice - quote.internalView.supplierCost - quote.internalView.costBreakdown.reduce((s, l) => s + l.amount, 0) + (quote.internalView.costBreakdown.find(l => l.key === 'unit_cost')?.amount ?? 0)), color: 'var(--success)' },
            { label: 'Gross Margin', zh: '毛利率', value: `${quote.internalView.marginPercent.toFixed(1)}%`, color: quote.internalView.marginPercent >= 20 ? 'var(--success)' : 'var(--warning)' },
            { label: 'Cost per Unit', zh: '单位成本', value: formatCurrency(quote.internalView.supplierCost / 10000), color: 'var(--text)' },
            { label: 'Price per Unit', zh: '单位价格', value: formatCurrency(quote.customerPrice / 10000), color: 'var(--accent)' },
          ].map((item) => (
            <div key={item.label} className="rounded-[4px] border p-3" style={{ borderColor: 'var(--border)' }}>
              <div className="text-[11px] uppercase tracking-wide font-medium" style={{ color: 'var(--text-muted)' }}>
                {t(item.label, item.zh)}
              </div>
              <div className="text-[18px] font-bold mt-1 tabular-nums" style={{ color: item.color }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Warnings */}
      {quote.internalView.warnings.length > 0 && (
        <Card title="Warnings" titleZh="警告">
          <div className="space-y-2">
            {quote.internalView.warnings.map((w, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-[4px] border px-3 py-2"
                style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#D97706' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <span className="text-[12px]" style={{ color: '#92400E' }}>{w}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Assumptions */}
      {quote.internalView.assumptions.length > 0 && (
        <Card title="Assumptions" titleZh="假设">
          <ul className="space-y-1.5">
            {quote.internalView.assumptions.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px]" style={{ color: 'var(--text)' }}>
                <span className="shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>•</span>
                {a}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Validation with Citations */}
      <Card title="Pre-Send Validation" titleZh="发送前验证">
        <div className="space-y-3">
          {/* Blocking issues */}
          {quote.internalView.warnings.length > 0 ? (
            <div className="rounded-[4px] border-l-4 px-3 py-2" style={{ background: '#FEF2F2', borderColor: '#EF4444' }}>
              <p className="text-[12px] font-medium" style={{ color: '#991B1B' }}>
                🔴 {t('Blocking Issues', '阻断问题')}: {quote.internalView.warnings.length}
              </p>
              <p className="text-[11px] mt-1" style={{ color: '#B91C1C' }}>
                {t('Resolve these before sending', '发送前请解决这些问题')}
              </p>
            </div>
          ) : (
            <div className="rounded-[4px] border-l-4 px-3 py-2" style={{ background: '#D1FAE5', borderColor: '#10B981' }}>
              <p className="text-[12px] font-medium" style={{ color: '#065F46' }}>
                ✅ {t('All checks passed', '所有检查通过')}
              </p>
            </div>
          )}

          {/* Citation table */}
          <div>
            <p className="text-[11px] font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
              {t('Price Citations', '价格来源')} — {t('Every price must cite its source', '每个价格必须注明来源')}
            </p>
            <div className="rounded-[4px] border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b" style={{ background: 'var(--surface-alt)', borderColor: 'var(--border)' }}>
                    <th className="px-3 py-1.5 text-left font-medium" style={{ color: 'var(--text-muted)' }}>{t('Field', '字段')}</th>
                    <th className="px-3 py-1.5 text-left font-medium" style={{ color: 'var(--text-muted)' }}>{t('Value', '值')}</th>
                    <th className="px-3 py-1.5 text-left font-medium" style={{ color: 'var(--text-muted)' }}>{t('Source', '来源')}</th>
                    <th className="px-3 py-1.5 text-center font-medium" style={{ color: 'var(--text-muted)' }}>{t('Confidence', '置信度')}</th>
                    <th className="px-3 py-1.5 text-left font-medium" style={{ color: 'var(--text-muted)' }}>{t('Status', '状态')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { field: 'Unit Price', value: formatCurrency(3.85), source: 'Supplier Quote (SSW-2026-112)', confidence: 95, status: 'confirmed' },
                    { field: 'Quantity', value: '10,000 units', source: 'Customer email', confidence: 100, status: 'confirmed' },
                    { field: 'Exchange Rate', value: '1 USD = 7.82 HKD', source: 'Exchange rate API', confidence: 99, status: 'confirmed' },
                    { field: 'Freight', value: formatCurrency(0.12), source: 'Internal estimate', confidence: 70, status: 'inferred' },
                    { field: 'Margin', value: '18.5%', source: 'Company policy', confidence: 100, status: 'confirmed' },
                  ].map((row, i) => (
                    <tr key={i} className="border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                      <td className="px-3 py-1.5 font-medium" style={{ color: 'var(--text)' }}>{row.field}</td>
                      <td className="px-3 py-1.5 font-semibold" style={{ color: 'var(--text)' }}>{row.value}</td>
                      <td className="px-3 py-1.5">
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px]"
                          style={{
                            background: row.source.includes('Customer') ? '#DBEAFE' : row.source.includes('Supplier') ? '#D1FAE5' : row.source.includes('estimate') ? '#FEF3C7' : '#F3F4F6',
                            color: row.source.includes('Customer') ? '#1D4ED8' : row.source.includes('Supplier') ? '#065F46' : row.source.includes('estimate') ? '#D97706' : '#6B7280'
                          }}
                        >
                          {row.source}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <span
                          className="font-medium"
                          style={{ color: row.confidence >= 90 ? '#10B981' : row.confidence >= 70 ? '#F59E0B' : '#EF4444' }}
                        >
                          {row.confidence}%
                        </span>
                      </td>
                      <td className="px-3 py-1.5">
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px]"
                          style={{
                            background: row.status === 'confirmed' ? '#D1FAE5' : row.status === 'inferred' ? '#FEF3C7' : '#FEE2E2',
                            color: row.status === 'confirmed' ? '#065F46' : row.status === 'inferred' ? '#D97706' : '#991B1B'
                          }}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Low confidence warning */}
          {quote.internalView.costBreakdown.some(l => l.source === 'external_estimate') && (
            <div className="rounded-[4px] px-3 py-2" style={{ background: '#FEF3C7' }}>
              <p className="text-[11px] font-medium" style={{ color: '#92400E' }}>
                ⚠️ {t('Some costs are estimates — verify with actual supplier quotes before sending', '部分成本为估算——发送前请与实际供应商报价核实')}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Supplier info */}
      {supplier && (
        <Card title="Supplier" titleZh="供应商">
          <div className="space-y-1">
            <InfoRow label="Name" zh="名称" value={<span className="font-semibold">{supplier.name}</span>} />
            <InfoRow label="Location" zh="位置" value={`${supplier.city}, ${supplier.country}`} />
            <InfoRow label="Verification" zh="验证状态" value={
              <span
                className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium"
                style={{
                  background: supplier.verificationStatus === 'verified' ? '#ECFDF5' : '#FFFBEB',
                  color: supplier.verificationStatus === 'verified' ? '#038153' : '#D97706',
                  border: `1px solid ${supplier.verificationStatus === 'verified' ? '#A7F3D0' : '#FDE68A'}`,
                }}
              >
                {supplier.verificationStatus}
              </span>
            } />
            <InfoRow label="Rating" zh="评分" value={`${supplier.internalRating}/5`} />
            <InfoRow label="Lead Time" zh="交货周期" value={`${supplier.leadTimeDays} days`} />
            <InfoRow label="MOQ" zh="最低起订量" value={formatNumber(supplier.moq)} />
          </div>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 pt-2">
        <button
          className="rounded-lg px-4 py-2.5 text-[13px] font-medium transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: '#F3F4F6', color: 'var(--text)', border: '1px solid var(--border)' }}
        >
          {t('Edit Draft', '编辑草稿')}
        </button>
        {(quote.status === 'pending_approval') && (
          <button
            onClick={handleApprove}
            className="rounded-lg px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'var(--success)' }}
          >
            {t('Approve Quote', '批准报价')}
          </button>
        )}
        {(quote.status === 'approved') && (
          <button
            onClick={handleSend}
            className="rounded-lg px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'var(--accent)' }}
          >
            {t('Approve & Send to Customer', '批准并发送给客户')}
          </button>
        )}
        {(quote.status === 'pending_approval' || quote.status === 'approved') && (
          <button
            className="rounded-lg px-4 py-2.5 text-[13px] font-medium transition-all"
            style={{ background: '#FEF2F2', color: '#CC3340', border: '1px solid #FECACA' }}
          >
            {t('Reject', '拒绝')}
          </button>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
/* ── Tab 2: Customer Preview ────────────────────────────────────────────── */
/* ════════════════════════════════════════════════════════════════════════════ */

function CustomerPreviewTab() {
  const { t } = useLang();
  const demo = useDemo();
  const { quote, customers, tenant, opportunity } = demo;
  const customer = customers.find((c) => c.id === opportunity.customerId);
  const cv = quote.customerView;

  const handleDownloadPdf = () => {
    alert(t('PDF generated', 'PDF 已生成'));
  };

  return (
    <div className="space-y-6">
      {/* PDF action */}
      <div className="flex justify-end">
        <button
          onClick={handleDownloadPdf}
          className="rounded-lg px-4 py-2 text-[13px] font-medium transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          {t('Download PDF', '下载 PDF')}
        </button>
      </div>

      {/* Quote document preview */}
      <div
        className="rounded-[4px] border p-6 sm:p-8 max-w-2xl mx-auto"
        style={{ background: '#fff', borderColor: '#E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
      >
        {/* Company header */}
        <div className="text-center border-b pb-6 mb-6" style={{ borderColor: '#E5E7EB' }}>
          <h1 className="text-[20px] font-bold text-gray-900">
            Pacific Trading Company Limited
          </h1>
          <p className="text-[12px] text-gray-500 mt-1">
            Unit 1205, 12/F, Tower 1, Lippo Centre, 89 Queensway, Admiralty, Hong Kong
          </p>
          <p className="text-[12px] text-gray-500">
            Tel: +852 2520 1234 | Fax: +852 2520 1235 | info@pacifictrading.com.hk
          </p>
        </div>

        {/* Quote title */}
        <div className="text-center mb-6">
          <h2 className="text-[22px] font-bold text-gray-900">
            {t('QUOTATION', '报价单')}
          </h2>
        </div>

        {/* Quote details grid */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <div className="text-[11px] uppercase tracking-wide font-semibold text-gray-400 mb-1">
              {t('To', '致')}
            </div>
            <div className="text-[13px] font-semibold text-gray-900">{customer?.companyName}</div>
            <div className="text-[12px] text-gray-600">{customer?.contactName}</div>
            <div className="text-[12px] text-gray-600">{customer?.email}</div>
            <div className="text-[12px] text-gray-600">{customer?.phone}</div>
          </div>
          <div className="text-right space-y-2">
            <div>
              <span className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">
                {t('Quote No.', '报价编号')}{' '}
              </span>
              <span className="text-[13px] font-semibold text-gray-900">{quote.referenceNumber}</span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">
                {t('Date', '日期')}{' '}
              </span>
              <span className="text-[13px] text-gray-700">{formatDate(quote.createdAt)}</span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">
                {t('Valid Until', '有效期至')}{' '}
              </span>
              <span className="text-[13px] text-gray-700">{cv.validityDate}</span>
            </div>
          </div>
        </div>

        {/* Product table */}
        <table className="w-full text-[12px] mb-6 border-collapse">
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-600">
                {t('Description', '描述')}
              </th>
              <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-gray-600 w-20">
                {t('Qty', '数量')}
              </th>
              <th className="border border-gray-200 px-3 py-2 text-right font-semibold text-gray-600 w-28">
                {t('Unit Price', '单价')}
              </th>
              <th className="border border-gray-200 px-3 py-2 text-right font-semibold text-gray-600 w-28">
                {t('Total', '合计')}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-200 px-3 py-3 text-gray-900">
                {cv.productName}
              </td>
              <td className="border border-gray-200 px-3 py-3 text-center text-gray-700 tabular-nums">
                {formatNumber(cv.quantity)}
              </td>
              <td className="border border-gray-200 px-3 py-3 text-right text-gray-700 tabular-nums">
                USD {cv.unitPrice.toFixed(2)}
              </td>
              <td className="border border-gray-200 px-3 py-3 text-right text-gray-900 font-semibold tabular-nums">
                {formatCurrency(cv.totalPrice)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Terms */}
        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">
                {t('Delivery', '交货')}{' '}
              </span>
              <span className="text-[12px] text-gray-700">{cv.deliveryEstimate}</span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">
                {t('Incoterm', '贸易条款')}{' '}
              </span>
              <span className="text-[12px] text-gray-700">{cv.incoterm}</span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">
                {t('Payment', '付款条件')}{' '}
              </span>
              <span className="text-[12px] text-gray-700">{cv.paymentTerms}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {cv.notes && (
          <div className="mb-6">
            <div className="text-[11px] uppercase tracking-wide font-semibold text-gray-400 mb-1">
              {t('Notes', '备注')}
            </div>
            <p className="text-[12px] text-gray-700 leading-relaxed">{cv.notes}</p>
          </div>
        )}

        {/* Exclusions */}
        {cv.exclusions.length > 0 && (
          <div className="mb-6">
            <div className="text-[11px] uppercase tracking-wide font-semibold text-gray-400 mb-1">
              {t('Exclusions', '除外条款')}
            </div>
            <ul className="space-y-1">
              {cv.exclusions.map((ex, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[12px] text-gray-600">
                  <span className="shrink-0 mt-0.5 text-gray-400">•</span>
                  {ex}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="border-t pt-4 mt-6 text-center" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-[11px] text-gray-400">
            {t(
              'This quotation is subject to our standard terms and conditions.',
              '本报价受我们标准条款和条件约束。',
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
/* ── Tab 3: Audit Trail ─────────────────────────────────────────────────── */
/* ════════════════════════════════════════════════════════════════════════════ */

function AuditTrailTab() {
  const { t } = useLang();
  const demo = useDemo();
  const { quote, users } = demo;

  const actionLabels: Record<string, { en: string; zh: string; color: string }> = {
    created: { en: 'Created', zh: '创建', color: 'var(--accent)' },
    submitted_for_approval: { en: 'Submitted for Approval', zh: '提交审批', color: '#D97706' },
    approved: { en: 'Approved', zh: '已批准', color: 'var(--success)' },
    sent: { en: 'Sent', zh: '已发送', color: '#2563EB' },
    rejected: { en: 'Rejected', zh: '已拒绝', color: '#CC3340' },
    edited: { en: 'Edited', zh: '已编辑', color: '#7C3AED' },
  };

  return (
    <div className="space-y-4">
      <div
        className="rounded-[4px] border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {quote.auditTrail.length === 0 ? (
          <div className="p-8 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
            {t('No audit entries.', '暂无审计记录。')}
          </div>
        ) : (
          quote.auditTrail.map((entry, i) => {
            const action = actionLabels[entry.action] ?? { en: entry.action, zh: entry.action, color: 'var(--text-muted)' };
            const actor = users.find((u) => u.id === entry.actor);
            return (
              <div
                key={i}
                className="flex gap-3 border-b px-4 py-3 last:border-b-0"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="flex flex-col items-center">
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0 mt-1"
                    style={{ background: action.color }}
                  />
                  {i < quote.auditTrail.length - 1 && (
                    <div className="w-px flex-1 my-1" style={{ background: 'var(--border)' }} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold"
                      style={{ background: action.color + '18', color: action.color }}
                    >
                      {t(action.en, action.zh)}
                    </span>
                    <span className="text-[12px] font-medium" style={{ color: 'var(--text)' }}>
                      {actor?.name ?? entry.actor}
                    </span>
                  </div>
                  {entry.details && (
                    <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
                      {entry.details}
                    </p>
                  )}
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {formatDateTime(entry.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
/* ── Page ───────────────────────────────────────────────────────────────── */
/* ════════════════════════════════════════════════════════════════════════════ */

type TabKey = 'internal' | 'customer' | 'audit';

const TABS: { key: TabKey; en: string; zh: string }[] = [
  { key: 'internal', en: 'Internal Review', zh: '内部审核' },
  { key: 'customer', en: 'Customer Preview', zh: '客户预览' },
  { key: 'audit', en: 'Audit Trail', zh: '审计记录' },
];

export default function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState<TabKey>('internal');

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back link */}
      <Link
        href="/admin/quotes"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {t('Back to Quotes', '返回报价列表')}
      </Link>

      {/* Tabs */}
      <div
        className="flex gap-1 rounded-[4px] border p-1"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 rounded-[4px] px-4 py-2 text-[13px] font-medium transition-colors"
              style={{
                background: active ? 'var(--accent)' : 'transparent',
                color: active ? '#fff' : 'var(--text-muted)',
              }}
            >
              {t(tab.en, tab.zh)}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'internal' && <InternalReviewTab />}
      {activeTab === 'customer' && <CustomerPreviewTab />}
      {activeTab === 'audit' && <AuditTrailTab />}
    </div>
  );
}
