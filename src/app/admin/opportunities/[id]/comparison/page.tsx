'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { useDemo } from '@/lib/demo-store';
import { useLang } from '@/lib/lang';

const ICONS = {
  warn: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
  info: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z',
  check: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  star: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
};

function CompStatusBadge({ status, t }: { status: string; t: (en: string, zh: string) => string }) {
  const map: Record<string, { label: string; zh: string; bg: string; fg: string; border: string }> = {
    comparable: { label: 'Comparable', zh: '可比较', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
    partially_comparable: { label: 'Partially Comparable', zh: '部分可比较', bg: '#FFFBEB', fg: '#AD5918', border: '#FDE68A' },
    not_comparable: { label: 'Not Comparable', zh: '不可比较', bg: '#FEF2F2', fg: '#CC3340', border: '#FECACA' },
  };
  const b = map[status] ?? map.not_comparable;
  return (
    <span
      className="inline-flex items-center rounded-md px-2.5 py-0.5 text-[12px] font-semibold"
      style={{ background: b.bg, color: b.fg, border: `1px solid ${b.border}` }}
    >
      {t(b.label, b.zh)}
    </span>
  );
}

function FlagIcon({ severity }: { severity: string }) {
  const color = severity === 'error' ? '#CC3340' : severity === 'warning' ? '#D97706' : '#2563EB';
  const d = severity === 'error' || severity === 'warning' ? ICONS.warn : ICONS.info;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 shrink-0" style={{ color }}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function Section({ title, titleZh }: { title: string; titleZh: string }) {
  const { t } = useLang();
  return (
    <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
      {t(title, titleZh)}
    </h2>
  );
}

export default function ComparisonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useLang();
  const demo = useDemo();
  const { suppliers, supplierResponses, comparison, opportunity } = demo;

  const [selectedSupplier, setSelectedSupplier] = useState<string>(comparison.selectedSupplierId ?? 's1');
  const [approved, setApproved] = useState(comparison.status === 'approved');

  const alternativeId = comparison.recommendation.alternativeSupplierId;

  // Derive comparability from responses
  const hasIncomplete = supplierResponses.some((r) => r.status === 'incomplete');
  const comparabilityStatus = hasIncomplete ? 'partially_comparable' : 'comparable';

  const handleApprove = () => setApproved(true);

  const resp1 = supplierResponses.find((r) => r.supplierId === 's1');
  const resp2 = supplierResponses.find((r) => r.supplierId === 's2');
  const resp3 = supplierResponses.find((r) => r.supplierId === 's3');

  const s1 = suppliers.find((s) => s.id === 's1');
  const s2 = suppliers.find((s) => s.id === 's2');
  const s3 = suppliers.find((s) => s.id === 's3');

  const comparisonRows = [
    { label: 'Unit Price', zh: '单价', values: [resp1 ? `$${resp1.normalizedData.unit_price}` : '—', resp2 ? `$${resp2.normalizedData.unit_price}` : '—', resp3 ? `$${resp3.normalizedData.unit_price}` : '—'] },
    { label: 'Currency', zh: '货币', values: [resp1?.normalizedData.currency ?? '—', resp2?.normalizedData.currency ?? '—', resp3?.normalizedData.currency ?? '—'] },
    { label: 'MOQ', zh: '最低起订量', values: [resp1 ? `${Number(resp1.normalizedData.moq).toLocaleString()} pcs` : '—', resp2 ? `${Number(resp2.normalizedData.moq).toLocaleString()} pcs` : '—', resp3 ? `${Number(resp3.normalizedData.moq).toLocaleString()} pcs` : '—'] },
    { label: 'Lead Time', zh: '交货期', values: [resp1 ? `${resp1.normalizedData.lead_time_days} days` : '—', resp2 ? `${resp2.normalizedData.lead_time_days} days` : '—', resp3 ? `${resp3.normalizedData.lead_time_days} days` : '—'] },
    { label: 'Incoterm', zh: '贸易术语', values: [resp1 ? `${resp1.normalizedData.incoterm} ${s1?.city}` : '—', resp2 ? `${resp2.normalizedData.incoterm} ${s2?.city}` : '—', resp3 ? `${resp3.normalizedData.incoterm} ${s3?.city}` : '—'] },
    { label: 'Packaging', zh: '包装', values: [resp1?.normalizedData.packaging_cost ? `$${resp1.normalizedData.packaging_cost}/pc gift box` : '—', resp2?.normalizedData.packaging_cost ?? null, resp3?.normalizedData.packaging_cost ? `$${resp3.normalizedData.packaging_cost}/pc gift box` : '—'] },
    { label: 'Payment Terms', zh: '付款条件', values: [resp1?.normalizedData.payment_terms ?? '—', resp2?.normalizedData.payment_terms ?? null, resp3?.normalizedData.payment_terms ?? '—'] },
    { label: 'Certifications', zh: '认证', values: ['ISO 9001, FDA, BSCI', 'ISO 9001 (claimed)', 'ISO 9001, FDA, BSCI (claimed)'] },
    { label: 'Quote Validity', zh: '报价有效期', values: ['30 days', '—', '14 days'] },
  ];

  const flags = [
    { description: 'FOB Shenzhen \u2014 does not include freight to London', descriptionZh: 'FOB深圳 \u2014 不含至伦敦运费', severity: 'info' },
    { description: 'Guangdong response incomplete \u2014 packaging cost missing', descriptionZh: '广东回复不完整 \u2014 缺少包装费用', severity: 'warning' },
    { description: 'Yiwu is a new supplier \u2014 no internal history', descriptionZh: '义乌是新供应商 \u2014 无内部历史', severity: 'warning' },
    { description: 'Different MOQ across suppliers', descriptionZh: '各供应商最低起订量不同', severity: 'info' },
  ];

  return (
    <div className="space-y-6">
      <Link href={`/admin/opportunities/${id}`} className="inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors" style={{ color: 'var(--text-muted)' }}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {t('Back to Opportunity', '返回商机')}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: 'var(--text)' }}>
            {t('Supplier Comparison', '供应商比较')}
          </h1>
          <div className="mt-1 flex items-center gap-3">
            <span className="text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>
              {opportunity.referenceNumber}
            </span>
            <CompStatusBadge status={comparabilityStatus} t={t} />
          </div>
        </div>
      </div>

      <Section title="Side-by-Side Comparison" titleZh="并排比较" />
      <div className="rounded-[4px] border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="px-4 py-3 text-left font-semibold min-w-[140px]" style={{ color: 'var(--text-muted)' }}>
                  {t('Field', '字段')}
                </th>
                {[s1, s2, s3].map((s) => (
                  <th key={s?.id} className="px-4 py-3 text-left font-semibold min-w-[180px]" style={{ color: 'var(--text)' }}>
                    <div>{s?.name ?? '\u2014'}</div>
                    <div className="text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>{s?.city}, {s?.country}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.label} className="border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--text)' }}>{t(row.label, row.zh)}</td>
                  {row.values.map((val, i) => {
                    const isMissing = val === null;
                    return (
                      <td key={i} className="px-4 py-2.5">
                        {isMissing ? (
                          <span className="inline-flex items-center gap-1 text-[12px] font-medium" style={{ color: '#D97706' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d={ICONS.warn} />
                            </svg>
                            {t('Missing', '缺失')}
                          </span>
                        ) : (
                          <span className="text-[12px]" style={{ color: 'var(--text)' }}>{val}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Section title="Flags" titleZh="标记" />
      <div className="rounded-[4px] border divide-y" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        {flags.map((flag, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3">
            <FlagIcon severity={flag.severity} />
            <span className="text-[13px]" style={{ color: 'var(--text)' }}>{t(flag.description, flag.descriptionZh)}</span>
          </div>
        ))}
      </div>

      <Section title="Recommendation" titleZh="推荐" />
      <div className="rounded-[4px] border p-4 space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4" style={{ color: '#038153' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d={ICONS.check} />
            </svg>
            <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{t('Recommended Supplier', '推荐供应商')}:</span>
            <span className="text-[13px] font-semibold" style={{ color: 'var(--accent)' }}>{s1?.name}</span>
          </div>
          <ul className="mt-1 space-y-0.5 ml-6">
            {comparison.recommendation.reasons.map((reason, i) => (
              <li key={i} className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{reason}</li>
            ))}
          </ul>
        </div>

        {alternativeId && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{t('Alternative', '备选')}:</span>
              <span className="text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>{suppliers.find((s) => s.id === alternativeId)?.name}</span>
            </div>
            <p className="text-[12px] ml-6" style={{ color: 'var(--text-muted)' }}>{t('Lowest price but unverified \u2014 no internal history or site visit completed.', '最低价格但未验证 \u2014 无内部历史或现场审核。')}</p>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4" style={{ color: '#D97706' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d={ICONS.warn} />
            </svg>
            <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{t('Risks', '风险')}:</span>
          </div>
          <ul className="mt-1 space-y-0.5 ml-6">
            {comparison.recommendation.risks.map((risk, i) => (
              <li key={i} className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{risk}</li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4" style={{ color: '#2563EB' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d={ICONS.info} />
            </svg>
            <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{t('Missing Information', '缺失信息')}:</span>
          </div>
          <ul className="mt-1 space-y-0.5 ml-6">
            {comparison.recommendation.missingInformation.map((item, i) => (
              <li key={i} className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <Section title="Decision" titleZh="决策" />
      <div className="rounded-[4px] border p-4 space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>{t('Select a supplier to proceed:', '选择供应商以继续：')}</p>
        <div className="space-y-2">
          {[s1, s2, s3].map((s) => s && (
            <label key={s.id} className="flex items-center gap-3 rounded-[4px] border p-3 cursor-pointer transition-all" style={{ borderColor: selectedSupplier === s.id ? 'var(--accent)' : 'var(--border)', background: selectedSupplier === s.id ? 'var(--accent-light)' : 'transparent' }}>
              <input type="radio" name="supplier" value={s.id} checked={selectedSupplier === s.id} onChange={() => setSelectedSupplier(s.id)} className="accent-current" style={{ color: 'var(--accent)' }} />
              <div className="min-w-0 flex-1">
                <span className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>{s.name}</span>
                <span className="ml-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>{s.city}, {s.country}</span>
              </div>
              {s.id === comparison.recommendation.recommendedSupplierId && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: '#ECFDF5', color: '#038153', border: '1px solid #A7F3D0' }}>
                  {t('Recommended', '推荐')}
                </span>
              )}
            </label>
          ))}
        </div>

        {!approved ? (
          <button
            onClick={handleApprove}
            className="rounded-[4px] px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'var(--accent)' }}
          >
            {t('Approve Supplier Selection', '批准供应商选择')}
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-[4px] px-4 py-3" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5" style={{ color: '#038153' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d={ICONS.check} />
            </svg>
            <span className="text-[13px] font-semibold" style={{ color: '#038153' }}>{t('Supplier selection approved', '供应商选择已批准')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
