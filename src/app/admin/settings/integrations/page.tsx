'use client';

import { useLang } from '@/lib/lang';

const INTEGRATIONS = [
  {
    name: 'Email Forwarding',
    zhName: '邮件转发',
    description: 'Forward inbound RFQ emails to TradeFlow',
    connected: true,
  },
  {
    name: 'Gmail',
    zhName: 'Gmail',
    description: 'Send and receive emails via Gmail',
    connected: false,
  },
  {
    name: 'WhatsApp',
    zhName: 'WhatsApp',
    description: 'Message suppliers via WhatsApp Business',
    connected: false,
  },
  {
    name: 'WeChat',
    zhName: '微信',
    description: 'WeChat supplier communication',
    connected: true,
  },
];

export default function IntegrationsPage() {
  const { t } = useLang();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
        {t('Integrations', '集成')}
      </h1>

      <div className="grid gap-4 sm:grid-cols-2">
        {INTEGRATIONS.map((integration) => (
          <div
            key={integration.name}
            className="flex items-center justify-between rounded-xl p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg font-bold text-white text-sm"
                style={{ background: integration.connected ? 'var(--success)' : 'var(--text-muted)' }}
              >
                {integration.name[0]}
              </div>
              <div>
                <div className="text-[14px] font-medium" style={{ color: 'var(--text)' }}>
                  {t(integration.name, integration.zhName)}
                </div>
                <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  {integration.description}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="inline-block rounded-full px-2.5 py-0.5 text-[12px] font-medium"
                style={{
                  background: integration.connected ? 'var(--success-light)' : 'var(--border)',
                  color: integration.connected ? 'var(--success)' : 'var(--text-muted)',
                }}
              >
                {t(integration.connected ? 'Connected' : 'Not Connected', integration.connected ? '已连接' : '未连接')}
              </span>
              <button
                className="rounded-md px-3 py-1 text-[12px] font-medium transition-colors"
                style={{
                  color: integration.connected ? 'var(--error)' : 'var(--accent)',
                  background: integration.connected ? 'var(--error-light)' : 'var(--accent-light)',
                }}
              >
                {t(integration.connected ? 'Disconnect' : 'Connect', integration.connected ? '断开' : '连接')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
