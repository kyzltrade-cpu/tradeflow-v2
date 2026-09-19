'use client';

import { useDemo } from '@/lib/demo-store';
import { useLang } from '@/lib/lang';
import type { CategoryField } from '@/lib/types';

/* ── Field type badge ───────────────────────────────────────────────────── */

function TypeBadge({ type }: { type: CategoryField['type'] }) {
  const map: Record<string, { bg: string; fg: string; border: string }> = {
    text: { bg: '#F3F4F6', fg: '#374151', border: '#E5E7EB' },
    number: { bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
    select: { bg: '#F5F3FF', fg: '#7C3AED', border: '#DDD6FE' },
    boolean: { bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
  };
  const b = map[type] ?? map.text;
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium"
      style={{ background: b.bg, color: b.fg, border: `1px solid ${b.border}` }}
    >
      {type}
    </span>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function ProductsPage() {
  const { t } = useLang();
  const { categories } = useDemo();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold" style={{ color: 'var(--text)' }}>
          {t('Products & Categories', '產品與分類')}
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
          {t(
            'Configure product categories and their required fields for inquiry qualification.',
            '配置产品分类及其询价所需字段。',
          )}
        </p>
      </div>

      {/* Category cards */}
      <div className="space-y-4">
        {categories.map((cat) => {
          const requiredFields = cat.fields.filter((f) => f.required);
          const optionalFields = cat.fields.filter((f) => !f.required);

          return (
            <div
              key={cat.id}
              className="rounded-[4px] border p-5"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              {/* Category header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[16px] font-semibold" style={{ color: 'var(--text)' }}>
                    {cat.name}
                  </h2>
                  <p className="mt-0.5 text-[12px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    /{cat.slug}
                  </p>
                </div>
                <span
                  className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{
                    background: cat.active ? '#ECFDF5' : '#F3F4F6',
                    color: cat.active ? '#038153' : '#6B7280',
                    border: `1px solid ${cat.active ? '#A7F3D0' : '#D1D5DB'}`,
                  }}
                >
                  {cat.active ? t('Active', '启用') : t('Inactive', '停用')}
                </span>
              </div>

              {/* Field counts */}
              <div className="mt-3 flex items-center gap-4 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                <span>
                  <span className="font-medium" style={{ color: 'var(--text)' }}>{t('Required', '必填')}</span>{' '}
                  {requiredFields.length}
                </span>
                <span>
                  <span className="font-medium" style={{ color: 'var(--text)' }}>{t('Optional', '选填')}</span>{' '}
                  {optionalFields.length}
                </span>
                <span>
                  <span className="font-medium" style={{ color: 'var(--text)' }}>{t('Total', '总计')}</span>{' '}
                  {cat.fields.length}
                </span>
              </div>

              {/* Field list */}
              <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                <table className="w-full text-[12px]">
                  <thead>
                    <tr style={{ color: 'var(--text-muted)' }}>
                      <th className="pb-2 text-left font-medium">{t('Field', '字段')}</th>
                      <th className="pb-2 text-left font-medium">{t('Label', '标签')}</th>
                      <th className="pb-2 text-left font-medium">{t('Type', '类型')}</th>
                      <th className="pb-2 text-left font-medium">{t('Required', '必填')}</th>
                      <th className="pb-2 text-left font-medium">{t('Options', '选项')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.fields.map((field) => (
                      <tr key={field.key} className="border-t" style={{ borderColor: 'var(--border)' }}>
                        <td className="py-2 font-mono text-[11px]" style={{ color: 'var(--text)' }}>
                          {field.key}
                        </td>
                        <td className="py-2" style={{ color: 'var(--text)' }}>
                          {field.label}
                          {field.unit && (
                            <span className="ml-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              ({field.unit})
                            </span>
                          )}
                        </td>
                        <td className="py-2">
                          <TypeBadge type={field.type} />
                        </td>
                        <td className="py-2">
                          {field.required ? (
                            <span
                              className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold"
                              style={{ background: '#FEF2F2', color: '#CC3340', border: '1px solid #FECACA' }}
                            >
                              {t('Required', '必填')}
                            </span>
                          ) : (
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              —
                            </span>
                          )}
                        </td>
                        <td className="py-2">
                          {field.options ? (
                            <div className="flex flex-wrap gap-1">
                              {field.options.map((opt) => (
                                <span
                                  key={opt}
                                  className="inline-flex rounded px-1 py-0.5 text-[10px]"
                                  style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' }}
                                >
                                  {opt}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
