'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useLang } from '@/lib/lang';

/* ── Add Supplier Modal ──────────────────────────────────────────────── */

function AddSupplierModal({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: () => void }) {
  const { t } = useLang();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [legalName, setLegalName] = useState('');
  const [tradingName, setTradingName] = useState('');
  const [location, setLocation] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactWechat, setContactWechat] = useState('');
  const [moqNotes, setMoqNotes] = useState('');
  const [leadTime, setLeadTime] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [certifications, setCertifications] = useState('');
  const [notes, setNotes] = useState('');

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!legalName.trim()) { setError('Legal name is required'); return; }
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not logged in'); setLoading(false); return; }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('email', user.email)
      .single();
    if (!userData) { setError('User not linked to company'); setLoading(false); return; }

    const certList = certifications
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const { error: insertErr } = await supabase.from('suppliers').insert({
      company_id: userData.company_id,
      legal_name: legalName.trim(),
      trading_name: tradingName.trim() || null,
      location: location.trim() || null,
      contact_name: contactName.trim() || null,
      contact_email: contactEmail.trim() || null,
      contact_phone: contactPhone.trim() || null,
      contact_wechat: contactWechat.trim() || null,
      moq_notes: moqNotes.trim() || null,
      typical_lead_time_days: leadTime ? parseInt(leadTime) : null,
      payment_terms: paymentTerms.trim() || null,
      certifications: certList.length > 0 ? certList : null,
      notes: notes.trim() || null,
      is_approved: false,
      performance_score: 0,
      total_orders: 0,
      on_time_rate: 0,
      quality_reject_rate: 0,
    });

    if (insertErr) {
      setError(insertErr.message);
      setLoading(false);
      return;
    }

    onAdded();
    onClose();
    setLegalName(''); setTradingName(''); setLocation(''); setContactName('');
    setContactEmail(''); setContactPhone(''); setContactWechat(''); setMoqNotes('');
    setLeadTime(''); setPaymentTerms(''); setCertifications(''); setNotes('');
    setLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid var(--border)',
    borderRadius: 4,
    fontSize: 13,
    color: 'var(--text)',
    background: 'var(--surface)',
    outline: 'none',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg shadow-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-[16px] font-bold" style={{ color: 'var(--text)' }}>
            {t('Add Supplier', '添加供应商')}
          </h2>
          <button onClick={onClose} className="text-[18px] font-bold" style={{ color: 'var(--text-muted)' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Company Name */}
          <div>
            <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
              Legal Name <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="e.g. Shenzhen Steel Works Manufacturing Co., Ltd"
              style={inputStyle}
            />
          </div>

          {/* Trading Name + Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Trading Name</label>
              <input value={tradingName} onChange={(e) => setTradingName(e.target.value)} placeholder="Short name (optional)" style={inputStyle} />
            </div>
            <div>
              <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Shenzhen, China" style={inputStyle} />
            </div>
          </div>

          {/* Contact */}
          <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-[13px] font-semibold mb-3" style={{ color: 'var(--text)' }}>
              {t('Contact Information', '联系信息')}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Contact Name</label>
                <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="e.g. Wei Zhang" style={inputStyle} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Email</label>
                <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} type="email" placeholder="e.g. wei@factory.cn" style={inputStyle} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Phone</label>
                <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="e.g. +86 138 0000 0000" style={inputStyle} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>WeChat</label>
                <input value={contactWechat} onChange={(e) => setContactWechat(e.target.value)} placeholder="WeChat ID" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Supply Details */}
          <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-[13px] font-semibold mb-3" style={{ color: 'var(--text)' }}>
              {t('Supply Details', '供应详情')}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>MOQ Notes</label>
                <input value={moqNotes} onChange={(e) => setMoqNotes(e.target.value)} placeholder="e.g. 500 pcs minimum" style={inputStyle} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Lead Time (days)</label>
                <input value={leadTime} onChange={(e) => setLeadTime(e.target.value)} type="number" placeholder="e.g. 25" style={inputStyle} />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Payment Terms</label>
              <input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="e.g. 30% deposit, 70% before shipment" style={inputStyle} />
            </div>
            <div className="mt-3">
              <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Certifications</label>
              <input value={certifications} onChange={(e) => setCertifications(e.target.value)} placeholder="Comma-separated: ISO 9001, FDA, BSCI" style={inputStyle} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional notes about this supplier..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {error && <p className="text-[12px] font-medium" style={{ color: '#EF4444' }}>{error}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-[13px] font-medium"
              style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              {loading ? 'Adding...' : t('Add Supplier', '添加供应商')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Suppliers Page ──────────────────────────────────────────────────── */

export default function SuppliersPage() {
  const { t } = useLang();
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="mx-auto max-w-5xl space-y-6" key={refreshKey}>
      <SuppliersHeader onAdd={() => setShowModal(true)} />
      <SuppliersGrid />
      <AddSupplierModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onAdded={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}

/* ── Header ──────────────────────────────────────────────────────────── */

function SuppliersHeader({ onAdd }: { onAdd: () => void }) {
  const { t } = useLang();
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-[22px] font-bold" style={{ color: 'var(--text)' }}>
          {t('Suppliers', '供应商')}
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
          {t('Manage your supplier directory and verification status.', '管理供应商目录和验证状态。')}
        </p>
      </div>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ background: 'var(--accent)' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        {t('Add Supplier', '添加供应商')}
      </button>
    </div>
  );
}

/* ── Supplier Grid (server data via client wrapper) ──────────────────── */

function SuppliersGrid() {
  const { t } = useLang();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: userData } = await supabase.from('users').select('company_id').eq('email', user.email).single();
      if (!userData) { setLoading(false); return; }
      const { data } = await supabase
        .from('suppliers')
        .select('*')
        .eq('company_id', userData.company_id)
        .order('created_at', { ascending: false });
      setSuppliers(data || []);
      setLoading(false);
    })();
  });

  if (loading) {
    return <div className="text-[13px] py-8 text-center" style={{ color: 'var(--text-muted)' }}>Loading...</div>;
  }

  if (suppliers.length === 0) {
    return (
      <div className="rounded-[4px] border p-12 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-auto h-12 w-12" style={{ color: 'var(--text-muted)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
        </svg>
        <h3 className="mt-4 text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
          {t('No suppliers yet', '暂无供应商')}
        </h3>
        <p className="mt-2 text-[13px]" style={{ color: 'var(--text-muted)' }}>
          {t('Add suppliers to your directory to start sourcing and comparing quotes.', '添加供应商到目录，开始寻源和比较报价。')}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {suppliers.map((supplier) => (
        <div
          key={supplier.id}
          className="rounded-[4px] border p-4 transition-all hover:shadow-md"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold truncate" style={{ color: 'var(--text)' }}>
                {supplier.legal_name}
              </h3>
              {supplier.location && (
                <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  {supplier.location}
                </p>
              )}
            </div>
            <span
              className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{
                background: supplier.is_approved ? '#ECFDF5' : '#FFFBEB',
                color: supplier.is_approved ? '#038153' : '#EA580C',
                border: `1px solid ${supplier.is_approved ? '#A7F3D0' : '#FED7AA'}`,
              }}
            >
              {supplier.is_approved ? t('Approved', '已批准') : t('Pending', '待审核')}
            </span>
          </div>

          {(supplier.contact_name || supplier.contact_email) && (
            <div className="mt-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>
              {supplier.contact_name && <span>{supplier.contact_name}</span>}
              {supplier.contact_name && supplier.contact_email && <span> &middot; </span>}
              {supplier.contact_email && <span>{supplier.contact_email}</span>}
            </div>
          )}

          {supplier.certifications && supplier.certifications.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {supplier.certifications.map((cert: string) => (
                <span
                  key={cert}
                  className="inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' }}
                >
                  {cert}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
            <Link
              href={`/admin/suppliers/${supplier.id}`}
              className="inline-flex items-center gap-1 text-[12px] font-medium transition-colors hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              {t('View Details', '查看详情')}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3 w-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
