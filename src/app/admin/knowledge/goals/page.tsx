'use client';

import { useLang } from '@/lib/lang';

const GOALS = [
  {
    en: 'Target Response Time',
    zh: '目标响应时间',
    value: '3.2 hrs',
    target: '4 hrs',
    progress: 80,
    color: 'var(--success)',
  },
  {
    en: 'Average Margin Target',
    zh: '平均利润率目标',
    value: '22%',
    target: '25%',
    progress: 88,
    color: 'var(--accent)',
  },
  {
    en: 'Supplier Response Rate',
    zh: '供应商响应率',
    value: '78%',
    target: '85%',
    progress: 92,
    color: 'var(--warning)',
  },
  {
    en: 'Quote Win Rate',
    zh: '报价成功率',
    value: '54%',
    target: '60%',
    progress: 90,
    color: 'var(--accent)',
  },
];

export default function GoalsPage() {
  const { t } = useLang();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
        {t('Goals', '目标')}
      </h1>

      <div className="grid gap-4 sm:grid-cols-2">
        {GOALS.map((goal) => (
          <div
            key={goal.en}
            className="rounded-xl p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[14px] font-medium" style={{ color: 'var(--text)' }}>
                {t(goal.en, goal.zh)}
              </span>
              <span className="text-[13px] font-semibold" style={{ color: goal.color }}>
                {goal.value}
              </span>
            </div>
            <div className="mb-2 h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--border)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${goal.progress}%`, background: goal.color }}
              />
            </div>
            <div className="flex justify-between text-[12px]" style={{ color: 'var(--text-muted)' }}>
              <span>{t('Target', '目标')}: {goal.target}</span>
              <span>{goal.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
