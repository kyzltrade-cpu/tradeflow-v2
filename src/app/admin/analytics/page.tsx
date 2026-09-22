'use client';

import { useState } from 'react';
import Link from 'next/link';

// ─── Mock Data ───────────────────────────────────────────────

const METRICS = {
  quotesSent: { value: 47, change: +12, period: 'vs last month' },
  winRate: { value: 34, change: +5, period: 'vs last month', suffix: '%' },
  avgMargin: { value: 18.5, change: +2.1, period: 'vs last month', suffix: '%' },
  avgTimeToQuote: { value: 2.3, change: -0.8, period: 'vs last month', suffix: 'h' },
  totalRevenue: { value: 284500, change: +32000, period: 'vs last month', prefix: '$' },
  activeInquiries: { value: 12, change: 0, period: '' },
};

const MONTHLY_DATA = [
  { month: 'Jul', quotes: 32, won: 10, revenue: 186000 },
  { month: 'Aug', quotes: 38, won: 12, revenue: 212000 },
  { month: 'Sep', quotes: 41, won: 14, revenue: 248000 },
  { month: 'Oct', quotes: 35, won: 11, revenue: 198000 },
  { month: 'Nov', quotes: 44, won: 15, revenue: 265000 },
  { month: 'Dec', quotes: 47, won: 16, revenue: 284500 },
];

const TOP_PRODUCTS = [
  { name: 'SS Water Bottle 500ml', quotes: 18, winRate: 42, avgMargin: 21.3 },
  { name: 'Glass Jar 250ml', quotes: 12, winRate: 33, avgMargin: 16.8 },
  { name: 'Bamboo Container Set', quotes: 8, winRate: 50, avgMargin: 24.1 },
  { name: 'Copper Mug 350ml', quotes: 5, winRate: 20, avgMargin: 14.2 },
  { name: 'Silicone Lunch Box', quotes: 4, winRate: 50, avgMargin: 19.7 },
];

const SUPPLIER_PERF = [
  { name: 'Shenzhen Steel Co.', quotes: 22, avgResponseTime: '4.2h', winRate: 38, rating: 4.5 },
  { name: 'Dongguan Glass Ltd.', quotes: 15, avgResponseTime: '6.1h', winRate: 33, rating: 4.2 },
  { name: 'Yiwu Bamboo Crafts', quotes: 8, avgResponseTime: '3.8h', winRate: 50, rating: 4.7 },
  { name: 'Foshan Ceramics', quotes: 4, avgResponseTime: '8.3h', winRate: 25, rating: 3.9 },
];

const AI_SAVINGS = [
  { metric: 'Time per quote', before: '45 min', after: '8 min', improvement: '82%' },
  { metric: 'Draft accuracy', before: '—', after: '91%', improvement: '—' },
  { metric: 'Follow-up response rate', before: '12%', after: '34%', improvement: '+183%' },
  { metric: 'Missed deadlines', before: '23%', after: '4%', improvement: '-83%' },
];

// ─── Components ──────────────────────────────────────────────

function MetricCard({ label, value, change, period, suffix, prefix, accent }: {
  label: string; value: string | number; change: number; period: string; suffix?: string; prefix?: string; accent: string;
}) {
  return (
    <div className="p-4 rounded-[4px] border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <div className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="flex items-end gap-2">
        <span className="text-[28px] font-bold" style={{ color: 'var(--text)' }}>
          {prefix || ''}{typeof value === 'number' ? value.toLocaleString() : value}{suffix || ''}
        </span>
        {change !== 0 && (
          <span className="text-[11px] font-semibold mb-1" style={{ color: change > 0 ? '#038153' : '#CC3340' }}>
            {change > 0 ? '↑' : '↓'} {Math.abs(change)}{suffix === '%' ? 'pp' : suffix === 'h' ? 'h' : ''}
          </span>
        )}
      </div>
      {period && <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{period}</div>}
    </div>
  );
}

function BarChart({ data, maxVal }: { data: typeof MONTHLY_DATA; maxVal: number }) {
  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((d) => {
        const wonH = (d.won / maxVal) * 100;
        const lostH = ((d.quotes - d.won) / maxVal) * 100;
        return (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col justify-end" style={{ height: '140px' }}>
              <div className="w-full rounded-t" style={{ height: `${wonH}%`, background: 'var(--accent)' }} />
              <div className="w-full rounded-b" style={{ height: `${lostH}%`, background: 'var(--border)' }} />
            </div>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className="w-3 h-3" style={{ color: s <= Math.round(rating) ? '#F59E0B' : 'var(--border)' }} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-[10px] ml-1" style={{ color: 'var(--text-muted)' }}>{rating}</span>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const maxQuotes = Math.max(...MONTHLY_DATA.map((d) => d.quotes));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] md:text-[24px] font-semibold tracking-[-0.5px]">Analytics</h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Track AI performance, win rates, and revenue impact
          </p>
        </div>
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--surface)' }}>
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-3 py-1 rounded text-[11px] font-medium"
              style={{ background: period === p ? 'var(--accent)' : 'transparent', color: period === p ? '#fff' : 'var(--text-muted)' }}
            >
              {p === '7d' ? '7 days' : p === '30d' ? '30 days' : '90 days'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard label="Quotes Sent" value={METRICS.quotesSent.value} change={METRICS.quotesSent.change} period={METRICS.quotesSent.period} accent="var(--accent)" />
        <MetricCard label="Win Rate" value={METRICS.winRate.value} change={METRICS.winRate.change} period={METRICS.winRate.period} suffix="%" accent="var(--accent)" />
        <MetricCard label="Avg Margin" value={METRICS.avgMargin.value} change={METRICS.avgMargin.change} period={METRICS.avgMargin.period} suffix="%" accent="var(--accent)" />
        <MetricCard label="Time to Quote" value={METRICS.avgTimeToQuote.value} change={METRICS.avgTimeToQuote.change} period={METRICS.avgTimeToQuote.period} suffix="h" accent="var(--accent)" />
        <MetricCard label="Total Revenue" value={METRICS.totalRevenue.value} change={METRICS.totalRevenue.change} period={METRICS.totalRevenue.period} prefix="$" accent="var(--accent)" />
        <MetricCard label="Active Inquiries" value={METRICS.activeInquiries.value} change={0} period="" accent="var(--accent)" />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Quote Win Chart */}
        <div className="col-span-12 lg:col-span-8 rounded-[4px] border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold">Quotes Sent vs Won</h3>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded" style={{ background: 'var(--accent)' }} /> Won</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded" style={{ background: 'var(--border)' }} /> Lost/No Response</span>
            </div>
          </div>
          <BarChart data={MONTHLY_DATA} maxVal={maxQuotes} />
        </div>

        {/* AI Impact */}
        <div className="col-span-12 lg:col-span-4 rounded-[4px] border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <h3 className="text-[13px] font-semibold mb-4">AI Impact</h3>
          <div className="space-y-3">
            {AI_SAVINGS.map((item) => (
              <div key={item.metric} className="p-3 rounded-lg" style={{ background: 'var(--bg)' }}>
                <div className="text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{item.metric}</div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{item.before}</span>
                  <svg className="w-3 h-3" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                  <span className="text-[12px] font-semibold">{item.after}</span>
                  {item.improvement !== '—' && (
                    <span className="text-[10px] font-bold ml-auto" style={{ color: '#038153' }}>{item.improvement}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="col-span-12 lg:col-span-6 rounded-[4px] border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-[13px] font-semibold">Top Products</h3>
          </div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="px-4 py-2.5 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>Product</th>
                <th className="px-4 py-2.5 text-right font-semibold" style={{ color: 'var(--text-muted)' }}>Quotes</th>
                <th className="px-4 py-2.5 text-right font-semibold" style={{ color: 'var(--text-muted)' }}>Win Rate</th>
                <th className="px-4 py-2.5 text-right font-semibold" style={{ color: 'var(--text-muted)' }}>Avg Margin</th>
              </tr>
            </thead>
            <tbody>
              {TOP_PRODUCTS.map((p) => (
                <tr key={p.name} className="border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-right">{p.quotes}</td>
                  <td className="px-4 py-3 text-right">
                    <span style={{ color: p.winRate >= 40 ? '#038153' : p.winRate >= 30 ? '#D97706' : '#CC3340' }}>
                      {p.winRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{p.avgMargin}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Supplier Performance */}
        <div className="col-span-12 lg:col-span-6 rounded-[4px] border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-[13px] font-semibold">Supplier Performance</h3>
          </div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="px-4 py-2.5 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>Supplier</th>
                <th className="px-4 py-2.5 text-right font-semibold" style={{ color: 'var(--text-muted)' }}>Avg Response</th>
                <th className="px-4 py-2.5 text-right font-semibold" style={{ color: 'var(--text-muted)' }}>Win Rate</th>
                <th className="px-4 py-2.5 text-right font-semibold" style={{ color: 'var(--text-muted)' }}>Rating</th>
              </tr>
            </thead>
            <tbody>
              {SUPPLIER_PERF.map((s) => (
                <tr key={s.name} className="border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-right">{s.avgResponseTime}</td>
                  <td className="px-4 py-3 text-right">
                    <span style={{ color: s.winRate >= 40 ? '#038153' : s.winRate >= 30 ? '#D97706' : '#CC3340' }}>
                      {s.winRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right"><StarRating rating={s.rating} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Actions */}
        <div className="col-span-12 rounded-[4px] border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <h3 className="text-[13px] font-semibold mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/upload" className="px-4 py-2 rounded-lg text-[12px] font-semibold border" style={{ borderColor: 'var(--border)' }}>
              Upload Documents →
            </Link>
            <Link href="/admin/draft-review" className="px-4 py-2 rounded-lg text-[12px] font-semibold border" style={{ borderColor: 'var(--border)' }}>
              Review Drafts ({METRICS.activeInquiries.value}) →
            </Link>
            <Link href="/admin/knowledge" className="px-4 py-2 rounded-lg text-[12px] font-semibold border" style={{ borderColor: 'var(--border)' }}>
              View Knowledge Base →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
