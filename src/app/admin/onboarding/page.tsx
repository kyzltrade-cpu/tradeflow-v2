'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/lang';

// ─── Types ───────────────────────────────────────────────────

type OnboardingStep = 'welcome' | 'company' | 'upload' | 'suppliers' | 'settings' | 'done';

interface CompanyInfo {
  name: string;
  industry: string;
  email: string;
  phone: string;
  website: string;
}

interface SupplierEntry {
  name: string;
  contactPerson: string;
  email: string;
  specialties: string;
}

interface MarginSettings {
  defaultMargin: number;
  minMargin: number;
  currency: string;
  incoterm: string;
}

const INDUSTRIES = [
  { value: 'food_beverage', en: 'Food & Beverage' },
  { value: 'electronics', en: 'Electronics' },
  { value: 'textiles', en: 'Textiles & Apparel' },
  { value: 'machinery', en: 'Machinery & Parts' },
  { value: 'consumer_goods', en: 'Consumer Goods' },
  { value: 'packaging', en: 'Packaging' },
  { value: 'building_materials', en: 'Building Materials' },
  { value: 'other', en: 'Other' },
];

const CURRENCIES = ['USD', 'HKD', 'CNY', 'EUR', 'GBP'];
const INCOTERMS = ['FOB', 'CIF', 'CFR', 'EXW', 'DDP', 'DAP'];

// ─── Page ────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { t } = useLang();
  const router = useRouter();

  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [company, setCompany] = useState<CompanyInfo>({ name: '', industry: '', email: '', phone: '', website: '' });
  const [suppliers, setSuppliers] = useState<SupplierEntry[]>([{ name: '', contactPerson: '', email: '', specialties: '' }]);
  const [margins, setMargins] = useState<MarginSettings>({ defaultMargin: 15, minMargin: 5, currency: 'USD', incoterm: 'FOB' });
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);

  const addSupplier = () => {
    setSuppliers((prev) => [...prev, { name: '', contactPerson: '', email: '', specialties: '' }]);
  };

  const updateSupplier = (idx: number, field: keyof SupplierEntry, value: string) => {
    setSuppliers((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const removeSupplier = (idx: number) => {
    if (suppliers.length > 1) {
      setSuppliers((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const STEPS: { key: OnboardingStep; label: string; num: number }[] = [
    { key: 'welcome', label: 'Welcome', num: 1 },
    { key: 'company', label: 'Company', num: 2 },
    { key: 'upload', label: 'Documents', num: 3 },
    { key: 'suppliers', label: 'Suppliers', num: 4 },
    { key: 'settings', label: 'Settings', num: 5 },
  ];

  const currentIdx = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-[14px]" style={{ background: '#0A6E5C' }}>
            TF
          </div>
          <span className="text-[14px] font-semibold">TradeFlow Setup</span>
        </div>
        <button onClick={() => router.push('/admin/inbox')} className="text-[12px] px-3 py-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}>
          Skip for now →
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Progress */}
          {step !== 'welcome' && step !== 'done' && (
            <div className="flex items-center gap-1 mb-8">
              {STEPS.filter((s) => s.key !== 'welcome').map((s, i) => {
                const sIdx = STEPS.findIndex((st) => st.key === s.key);
                const isCurrent = s.key === step;
                const isDone = sIdx < currentIdx;
                return (
                  <div key={s.key} className="flex items-center gap-1.5 flex-1">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{ background: isDone ? '#0A6E5C' : isCurrent ? 'var(--accent)' : 'var(--border)', color: isDone || isCurrent ? '#fff' : 'var(--text-muted)' }}
                    >
                      {isDone ? '✓' : s.num}
                    </div>
                    <span className={`text-[11px] font-medium ${isCurrent ? '' : 'hidden sm:inline'}`} style={{ color: isCurrent ? 'var(--text)' : 'var(--text-muted)' }}>
                      {s.label}
                    </span>
                    {i < 4 && <div className="flex-1 h-px mx-1" style={{ background: 'var(--border)' }} />}
                  </div>
                );
              })}
            </div>
          )}

          {/* Welcome */}
          {step === 'welcome' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center" style={{ background: '#0A6E5C' }}>
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <div>
                <h1 className="text-[28px] font-bold tracking-[-0.5px]">Welcome to TradeFlow</h1>
                <p className="text-[14px] mt-2 max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
                  Let&apos;s set up your Company Brain in 3 minutes. We&apos;ll configure your products, suppliers, and pricing so the AI can start drafting replies for you.
                </p>
              </div>
              <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <button onClick={() => setStep('company')} className="px-6 py-3 rounded-lg text-[14px] font-semibold text-white" style={{ background: 'var(--accent)' }}>
                  Let&apos;s Get Started →
                </button>
                <button onClick={() => router.push('/admin/inbox')} className="px-6 py-2 rounded-lg text-[13px]" style={{ color: 'var(--text-muted)' }}>
                  I&apos;ll set up later
                </button>
              </div>
            </div>
          )}

          {/* Company Info */}
          {step === 'company' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-[20px] font-semibold">Tell us about your company</h2>
                <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  This info appears in your outgoing messages and helps the AI personalize drafts.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Company Name *</label>
                  <input
                    value={company.name}
                    onChange={(e) => setCompany((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Pacific Trading Co."
                    className="w-full px-3 py-2 rounded-lg border text-[13px] focus:outline-none focus:ring-2"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Industry *</label>
                  <select
                    value={company.industry}
                    onChange={(e) => setCompany((p) => ({ ...p, industry: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-[13px] focus:outline-none focus:ring-2"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  >
                    <option value="">Select industry</option>
                    {INDUSTRIES.map((ind) => (
                      <option key={ind.value} value={ind.value}>{ind.en}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Business Email *</label>
                  <input
                    value={company.email}
                    onChange={(e) => setCompany((p) => ({ ...p, email: e.target.value }))}
                    placeholder="info@pacifictrading.com"
                    className="w-full px-3 py-2 rounded-lg border text-[13px] focus:outline-none focus:ring-2"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Phone</label>
                  <input
                    value={company.phone}
                    onChange={(e) => setCompany((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+852 2345 6789"
                    className="w-full px-3 py-2 rounded-lg border text-[13px] focus:outline-none focus:ring-2"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Website</label>
                  <input
                    value={company.website}
                    onChange={(e) => setCompany((p) => ({ ...p, website: e.target.value }))}
                    placeholder="pacifictrading.com"
                    className="w-full px-3 py-2 rounded-lg border text-[13px] focus:outline-none focus:ring-2"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep('upload')}
                  disabled={!company.name || !company.industry || !company.email}
                  className="px-6 py-2.5 rounded-lg text-[13px] font-semibold text-white disabled:opacity-40"
                  style={{ background: 'var(--accent)' }}
                >
                  Next: Upload Documents →
                </button>
              </div>
            </div>
          )}

          {/* Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-[20px] font-semibold">Upload your documents</h2>
                <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Product specs, price lists, certifications — the AI will extract and index everything. You can always upload more later.
                </p>
              </div>

              <label className="flex flex-col items-center gap-3 rounded-[4px] border-2 border-dashed p-10 cursor-pointer">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
                  <svg className="w-6 h-6" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-semibold">Drop files here or click to browse</p>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>PDF, Excel, CSV, Word, Images — up to 20MB each</p>
                </div>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => e.target.files && setUploadFiles(Array.from(e.target.files))}
                />
              </label>

              {uploadFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                      <span className="text-[14px]">📎</span>
                      <span className="text-[12px] font-medium flex-1 truncate">{f.name}</span>
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{(f.size / 1024).toFixed(0)} KB</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between">
                <button onClick={() => setStep('company')} className="px-4 py-2 rounded-lg text-[13px] font-semibold border" style={{ borderColor: 'var(--border)' }}>
                  ← Back
                </button>
                <button onClick={() => setStep('suppliers')} className="px-6 py-2.5 rounded-lg text-[13px] font-semibold text-white" style={{ background: 'var(--accent)' }}>
                  Next: Add Suppliers →
                </button>
              </div>
            </div>
          )}

          {/* Suppliers */}
          {step === 'suppliers' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-[20px] font-semibold">Add your suppliers</h2>
                <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  The AI uses supplier info to match products, compare prices, and draft RFQs. Add at least 1 supplier.
                </p>
              </div>

              <div className="space-y-4">
                {suppliers.map((supplier, idx) => (
                  <div key={idx} className="p-4 rounded-[4px] border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>Supplier {idx + 1}</span>
                      {suppliers.length > 1 && (
                        <button onClick={() => removeSupplier(idx)} className="text-[11px]" style={{ color: 'var(--danger)' }}>Remove</button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        value={supplier.name}
                        onChange={(e) => updateSupplier(idx, 'name', e.target.value)}
                        placeholder="Company name *"
                        className="px-3 py-2 rounded-lg border text-[12px] focus:outline-none focus:ring-2"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                      />
                      <input
                        value={supplier.contactPerson}
                        onChange={(e) => updateSupplier(idx, 'contactPerson', e.target.value)}
                        placeholder="Contact person"
                        className="px-3 py-2 rounded-lg border text-[12px] focus:outline-none focus:ring-2"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                      />
                      <input
                        value={supplier.email}
                        onChange={(e) => updateSupplier(idx, 'email', e.target.value)}
                        placeholder="Email or phone"
                        className="px-3 py-2 rounded-lg border text-[12px] focus:outline-none focus:ring-2"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                      />
                      <input
                        value={supplier.specialties}
                        onChange={(e) => updateSupplier(idx, 'specialties', e.target.value)}
                        placeholder="Specialties (e.g. stainless steel, bottles)"
                        className="px-3 py-2 rounded-lg border text-[12px] focus:outline-none focus:ring-2"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={addSupplier} className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: 'var(--accent)' }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[14px] font-bold" style={{ background: 'var(--accent)18', color: 'var(--accent)' }}>+</span>
                Add another supplier
              </button>

              <div className="flex justify-between">
                <button onClick={() => setStep('upload')} className="px-4 py-2 rounded-lg text-[13px] font-semibold border" style={{ borderColor: 'var(--border)' }}>
                  ← Back
                </button>
                <button onClick={() => setStep('settings')} className="px-6 py-2.5 rounded-lg text-[13px] font-semibold text-white" style={{ background: 'var(--accent)' }}>
                  Next: Pricing Settings →
                </button>
              </div>
            </div>
          )}

          {/* Settings */}
          {step === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-[20px] font-semibold">Pricing & margins</h2>
                <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  The AI uses these defaults when drafting quotes. You can always override per-quote.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Default Margin (%)</label>
                  <input
                    type="number"
                    value={margins.defaultMargin}
                    onChange={(e) => setMargins((p) => ({ ...p, defaultMargin: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg border text-[13px] focus:outline-none focus:ring-2"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Applied to all new quotes unless overridden</p>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Minimum Margin (%)</label>
                  <input
                    type="number"
                    value={margins.minMargin}
                    onChange={(e) => setMargins((p) => ({ ...p, minMargin: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg border text-[13px] focus:outline-none focus:ring-2"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>AI will flag quotes below this threshold</p>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Currency</label>
                  <select
                    value={margins.currency}
                    onChange={(e) => setMargins((p) => ({ ...p, currency: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-[13px] focus:outline-none focus:ring-2"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  >
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Default Incoterm</label>
                  <select
                    value={margins.incoterm}
                    onChange={(e) => setMargins((p) => ({ ...p, incoterm: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-[13px] focus:outline-none focus:ring-2"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  >
                    {INCOTERMS.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep('suppliers')} className="px-4 py-2 rounded-lg text-[13px] font-semibold border" style={{ borderColor: 'var(--border)' }}>
                  ← Back
                </button>
                <button onClick={() => setStep('done')} className="px-6 py-2.5 rounded-lg text-[13px] font-semibold text-white" style={{ background: 'var(--accent)' }}>
                  Complete Setup →
                </button>
              </div>
            </div>
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center" style={{ background: '#ECFDF5' }}>
                <svg className="w-10 h-10" style={{ color: '#038153' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <div>
                <h1 className="text-[28px] font-bold tracking-[-0.5px]">You&apos;re all set!</h1>
                <p className="text-[14px] mt-2 max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
                  Your Company Brain is configured. Forward your first RFQ email and watch the AI draft a reply in seconds.
                </p>
              </div>
              <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <button onClick={() => router.push('/admin/inbox')} className="px-6 py-3 rounded-lg text-[14px] font-semibold text-white" style={{ background: 'var(--accent)' }}>
                  Go to Inbox →
                </button>
                <button onClick={() => router.push('/admin/upload')} className="px-6 py-2 rounded-lg text-[13px] border" style={{ borderColor: 'var(--border)' }}>
                  Upload more documents
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
