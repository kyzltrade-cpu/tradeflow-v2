'use client';

import type { SupplierComparison, SupplierResponse, Supplier, SupplierRfqBatch } from '@/lib/types';

/* ── Comparison flag badge ────────────────────────────────────────────────── */

function FlagBadge({ flag }: { flag: { type: string; description: string; severity: string } }) {
  const severityMap: Record<string, { icon: string; bg: string; fg: string; border: string }> = {
    warning: { icon: '⚠️', bg: '#FFFBEB', fg: '#92400E', border: '#FDE68A' },
    error: { icon: '🚨', bg: '#FEF2F2', fg: '#991B1B', border: '#FCA5A5' },
    info: { icon: 'ℹ️', bg: '#EFF6FF', fg: '#1E40AF', border: '#BFDBFE' },
  };
  const s = severityMap[flag.severity] ?? severityMap.info;
  return (
    <div
      className="flex items-start gap-2 rounded-[4px] border px-3 py-2"
      style={{ background: s.bg, borderColor: s.border }}
    >
      <span>{s.icon}</span>
      <span className="text-[12px]" style={{ color: s.fg }}>{flag.description}</span>
    </div>
  );
}

/* ── Comparison table cell ────────────────────────────────────────────────── */

function ComparisonCell({ value, warning }: { value: string; warning?: string }) {
  return (
    <div>
      <div className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>{value}</div>
      {warning && (
        <div className="text-[11px] mt-0.5" style={{ color: 'var(--warning)' }}>{warning}</div>
      )}
    </div>
  );
}

export function ComparisonTab({
  comparison,
  supplierResponses,
  suppliers,
  rfqBatch,
}: {
  comparison: SupplierComparison | null;
  supplierResponses: SupplierResponse[];
  suppliers: Supplier[];
  rfqBatch: SupplierRfqBatch | null;
}) {
  if (!comparison) {
    return (
      <div className="rounded-[4px] border p-12 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-auto h-12 w-12" style={{ color: 'var(--text-muted)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
        <h3 className="mt-4 text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
          No comparison yet
        </h3>
        <p className="mt-2 text-[13px]" style={{ color: 'var(--text-muted)' }}>
          Collect responses from at least 2 suppliers to see a comparison.
        </p>
      </div>
    );
  }

  // Build comparison data
  const respondedSuppliers = supplierResponses.filter((r) => r.status === 'reviewed' || r.status === 'normalized');
  const comparedSuppliers = respondedSuppliers.map((resp) => {
    const supplier = suppliers.find((s) => s.id === resp.supplierId);
    return { response: resp, supplier };
  });

  // Comparison fields
  const comparisonFields = [
    { key: 'unit_price', label: 'Unit Price', format: (v: string, c: string) => `${c} ${v}` },
    { key: 'incoterm', label: 'Incoterm' },
    { key: 'lead_time_days', label: 'Lead Time', format: (v: string) => `${v} days` },
    { key: 'moq', label: 'MOQ', format: (v: string) => `${Number(v).toLocaleString()} pcs` },
    { key: 'payment_terms', label: 'Payment Terms' },
    { key: 'packaging_cost', label: 'Packaging', format: (v: string) => v === '0' || v === 'Included' ? 'Included' : `$${v}/pc` },
    { key: 'sample_available', label: 'Samples' },
  ];

  // Get value for a supplier's field
  const getFieldValue = (resp: SupplierResponse, fieldKey: string): string => {
    const field = resp.fields.find((f) => f.fieldKey === fieldKey);
    if (!field) return '—';
    if (fieldKey === 'unit_price') return `$${field.normalizedValue}`;
    if (fieldKey === 'packaging_cost') return field.normalizedValue === '0' ? 'Included' : `$${field.normalizedValue}`;
    return field.normalizedValue || field.rawValue || '—';
  };

  // Get currency for a supplier
  const getCurrency = (resp: SupplierResponse): string => {
    const priceField = resp.fields.find((f) => f.fieldKey === 'unit_price');
    return priceField?.currency || 'USD';
  };

  // Detect warnings
  const getWarnings = (fieldKey: string): string[] => {
    const warnings: string[] = [];
    if (comparedSuppliers.length < 2) return warnings;

    const values = comparedSuppliers.map((s) => getFieldValue(s.response, fieldKey));
    const uniqueValues = [...new Set(values.filter((v) => v !== '—'))];

    // Currency mismatch
    if (fieldKey === 'unit_price') {
      const currencies = comparedSuppliers.map((s) => getCurrency(s.response));
      const uniqueCurrencies = [...new Set(currencies)];
      if (uniqueCurrencies.length > 1) {
        warnings.push(`⚠️ Currency mismatch: ${uniqueCurrencies.join(', ')}`);
      }
    }

    // Different incoterms
    if (fieldKey === 'incoterm' && uniqueValues.length > 1) {
      warnings.push(`⚠️ Different Incoterms: ${uniqueValues.join(', ')}`);
    }

    // MOQ exceeding quantity
    if (fieldKey === 'moq') {
      comparedSuppliers.forEach((s) => {
        const moqField = s.response.fields.find((f) => f.fieldKey === 'moq');
        if (moqField && Number(moqField.normalizedValue) > 10000) {
          warnings.push(`MOQ exceeds requested quantity`);
        }
      });
    }

    // Price outliers
    if (fieldKey === 'unit_price') {
      const numericValues = comparedSuppliers
        .map((s) => {
          const field = s.response.fields.find((f) => f.fieldKey === 'unit_price');
          return field ? Number(field.normalizedValue) : 0;
        })
        .filter((v) => v > 0);

      if (numericValues.length >= 2) {
        const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        const hasOutlier = numericValues.some((v) => Math.abs(v - mean) / mean > 0.2);
        if (hasOutlier) {
          warnings.push(`Price outlier detected (>20% deviation from mean)`);
        }
      }
    }

    return warnings;
  };

  return (
    <div className="space-y-6">
      {/* Comparison Table */}
      <div className="rounded-[4px] border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
            Supplier Comparison
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="px-4 py-2.5 text-left font-semibold" style={{ color: 'var(--text-muted)', width: 140 }}>Field</th>
                {comparedSuppliers.map((s) => (
                  <th key={s.response.id} className="px-4 py-2.5 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {s.supplier?.name ?? 'Unknown'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonFields.map((field) => {
                const warnings = getWarnings(field.key);
                return (
                  <tr key={field.key} className="border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text)' }}>{field.label}</td>
                    {comparedSuppliers.map((s) => (
                      <td key={s.response.id} className="px-4 py-3">
                        <ComparisonCell
                          value={getFieldValue(s.response, field.key)}
                          warning={warnings.length > 0 ? warnings[0] : undefined}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
              {/* Certifications row */}
              <tr className="border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--text)' }}>Certifications</td>
                {comparedSuppliers.map((s) => (
                  <td key={s.response.id} className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {s.supplier?.certifications.map((cert) => (
                        <span
                          key={cert.name}
                          className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium"
                          style={{
                            background: cert.status === 'verified' ? '#ECFDF5' : cert.status === 'claimed' ? '#FEFCE8' : '#F3F4F6',
                            color: cert.status === 'verified' ? '#038153' : cert.status === 'claimed' ? '#854D0E' : '#6B7280',
                          }}
                        >
                          {cert.name}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparison Flags */}
      {comparison.flags.length > 0 && (
        <div className="rounded-[4px] border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
              Warnings & Flags ({comparison.flags.length})
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {comparison.flags.map((flag, i) => (
              <FlagBadge key={i} flag={flag} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div className="rounded-[4px] border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
            Recommendation
          </h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold" style={{ color: 'var(--accent)' }}>
              Recommended:
            </span>
            <span className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>
              {suppliers.find((s) => s.id === comparison.recommendation.recommendedSupplierId)?.name ?? 'Unknown'}
            </span>
          </div>
          <div className="space-y-1">
            {comparison.recommendation.reasons.map((reason, i) => (
              <div key={i} className="flex items-start gap-2 text-[12px]" style={{ color: 'var(--text)' }}>
                <span style={{ color: 'var(--success)' }}>✓</span>
                {reason}
              </div>
            ))}
          </div>
          {comparison.recommendation.risks.length > 0 && (
            <div className="space-y-1">
              {comparison.recommendation.risks.map((risk, i) => (
                <div key={i} className="flex items-start gap-2 text-[12px]" style={{ color: 'var(--warning)' }}>
                  <span>⚠️</span>
                  {risk}
                </div>
              ))}
            </div>
          )}
          {comparison.recommendation.missingInformation.length > 0 && (
            <div className="space-y-1">
              {comparison.recommendation.missingInformation.map((info, i) => (
                <div key={i} className="flex items-start gap-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  <span>❓</span>
                  {info}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
