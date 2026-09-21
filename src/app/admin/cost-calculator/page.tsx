'use client';

import { useState } from 'react';
import { calculateCosts, type CostInputs, type CostBreakdown } from '@/lib/cost-calculator';
import { formatCurrency } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const PRESETS: { name: string; inputs: Partial<CostInputs> }[] = [
  {
    name: 'FOB China → US',
    inputs: {
      unit_price: 12.50,
      currency: 'CNY',
      moq: 500,
      quantity: 1000,
      tooling_cost: 800,
      sample_cost: 150,
      packaging_cost: 0.80,
      incoterm: 'FOB',
      estimated_freight_per_unit: 2.10,
      insurance_rate: 0.5,
      duty_rate: 4.2,
      vat_rate: 0,
      exchange_rate: 7.2,
      target_currency: 'USD',
      customer_exchange_rate: 1,
      target_margin_percentage: 35,
      minimum_margin_percentage: 25,
      order_quantity: 1000,
    },
  },
  {
    name: 'CIF Hong Kong',
    inputs: {
      unit_price: 85,
      currency: 'USD',
      moq: 100,
      quantity: 500,
      tooling_cost: 2000,
      sample_cost: 300,
      packaging_cost: 3.50,
      incoterm: 'CIF',
      estimated_freight_per_unit: 0,
      insurance_rate: 0.3,
      duty_rate: 0,
      vat_rate: 0,
      exchange_rate: 1,
      target_currency: 'HKD',
      customer_exchange_rate: 7.8,
      target_margin_percentage: 30,
      minimum_margin_percentage: 20,
      order_quantity: 500,
    },
  },
  {
    name: 'EXW + Air Freight',
    inputs: {
      unit_price: 45,
      currency: 'CNY',
      moq: 200,
      quantity: 300,
      tooling_cost: 500,
      sample_cost: 100,
      packaging_cost: 1.20,
      incoterm: 'EXW',
      estimated_freight_per_unit: 8.50,
      insurance_rate: 1.0,
      duty_rate: 5.0,
      vat_rate: 13,
      exchange_rate: 7.2,
      target_currency: 'USD',
      customer_exchange_rate: 1,
      target_margin_percentage: 40,
      minimum_margin_percentage: 30,
      order_quantity: 300,
    },
  },
];

const INPUT_FIELDS = [
  { key: 'unit_price' as const, label: 'Unit Price', type: 'number', step: '0.01' },
  { key: 'currency' as const, label: 'Currency', type: 'text' },
  { key: 'moq' as const, label: 'MOQ', type: 'number', step: '1' },
  { key: 'quantity' as const, label: 'Quantity', type: 'number', step: '1' },
  { key: 'tooling_cost' as const, label: 'Tooling Cost', type: 'number', step: '0.01' },
  { key: 'sample_cost' as const, label: 'Sample Cost', type: 'number', step: '0.01' },
  { key: 'packaging_cost' as const, label: 'Packaging Cost', type: 'number', step: '0.01' },
  { key: 'incoterm' as const, label: 'Incoterm', type: 'text' },
  { key: 'estimated_freight_per_unit' as const, label: 'Freight/Unit', type: 'number', step: '0.01' },
  { key: 'insurance_rate' as const, label: 'Insurance %', type: 'number', step: '0.1' },
  { key: 'hs_code' as const, label: 'HS Code', type: 'text' },
  { key: 'duty_rate' as const, label: 'Duty %', type: 'number', step: '0.1' },
  { key: 'vat_rate' as const, label: 'VAT %', type: 'number', step: '0.1' },
  { key: 'exchange_rate' as const, label: 'Exchange Rate', type: 'number', step: '0.001' },
  { key: 'target_currency' as const, label: 'Target Currency', type: 'text' },
  { key: 'customer_exchange_rate' as const, label: 'Customer FX Rate', type: 'number', step: '0.001' },
  { key: 'target_margin_percentage' as const, label: 'Target Margin %', type: 'number', step: '0.1' },
  { key: 'minimum_margin_percentage' as const, label: 'Min Margin %', type: 'number', step: '0.1' },
  { key: 'order_quantity' as const, label: 'Order Quantity', type: 'number', step: '1' },
];

const DEFAULT_INPUTS: CostInputs = {
  unit_price: 0,
  currency: 'USD',
  moq: 0,
  quantity: 0,
  tooling_cost: 0,
  sample_cost: 0,
  packaging_cost: 0,
  incoterm: 'FOB',
  estimated_freight_per_unit: 0,
  insurance_rate: 0.5,
  duty_rate: 0,
  vat_rate: 0,
  exchange_rate: 1,
  target_currency: 'USD',
  customer_exchange_rate: 1,
  target_margin_percentage: 30,
  minimum_margin_percentage: 20,
  order_quantity: 1,
};

function BreakdownRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
      <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-[13px] font-semibold tabular-nums" style={{ color: highlight ? 'var(--accent)' : 'var(--text)' }}>
        {value}
      </span>
    </div>
  );
}

export default function CostCalculatorPage() {
  const [inputs, setInputs] = useState<CostInputs>({ ...DEFAULT_INPUTS });
  const [result, setResult] = useState<CostBreakdown | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCalculate = () => {
    const breakdown = calculateCosts(inputs);
    setResult(breakdown);
  };

  const handlePreset = (preset: typeof PRESETS[number]) => {
    const merged = { ...DEFAULT_INPUTS, ...preset.inputs } as CostInputs;
    setInputs(merged);
    setResult(calculateCosts(merged));
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('email', user.email)
        .single();

      if (!userData) return;

      await supabase.from('cost_calculations').insert({
        company_id: userData.company_id,
        created_by: user.id,
        formula_version: '1.0',
        currency: inputs.target_currency,
        inputs_json: inputs as unknown as Record<string, unknown>,
        outputs_json: result as unknown as Record<string, unknown>,
        warnings_json: result.warnings,
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: keyof CostInputs, value: string) => {
    setInputs((prev) => ({
      ...prev,
      [key]: ['currency', 'incoterm', 'hs_code', 'target_currency'].includes(key)
        ? value
        : parseFloat(value) || 0,
    }));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-[22px] font-bold" style={{ color: 'var(--text)' }}>Cost Calculator</h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
          Calculate landed costs, margins, and pricing for your products.
        </p>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => handlePreset(preset)}
            className="rounded-[4px] border px-3 py-1.5 text-[12px] font-medium transition-colors hover:bg-[var(--accent-light)]"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Inputs */}
        <div
          className="rounded-[4px] border p-5"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <h2 className="mb-4 text-[14px] font-semibold" style={{ color: 'var(--text)' }}>Inputs</h2>
          <div className="grid grid-cols-2 gap-3">
            {INPUT_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="mb-1 block text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  step={field.step}
                  value={inputs[field.key] ?? ''}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  className="w-full rounded-[4px] border px-3 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  style={{
                    background: 'var(--bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleCalculate}
            className="mt-4 w-full rounded-[4px] px-4 py-2 text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'var(--accent)' }}
          >
            Calculate
          </button>
        </div>

        {/* Results */}
        <div
          className="rounded-[4px] border p-5"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <h2 className="mb-4 text-[14px] font-semibold" style={{ color: 'var(--text)' }}>Cost Breakdown</h2>

          {result ? (
            <div>
              <BreakdownRow label="Unit Price (converted)" value={formatCurrency(result.unit_price_usd, 'USD')} />
              <BreakdownRow label="Tooling/Unit" value={formatCurrency(result.tooling_per_unit, 'USD')} />
              <BreakdownRow label="Sample/Unit" value={formatCurrency(result.sample_per_unit, 'USD')} />
              <BreakdownRow label="Packaging/Unit" value={formatCurrency(result.packaging_per_unit, 'USD')} />
              <BreakdownRow label="Subtotal/Unit" value={formatCurrency(result.subtotal_per_unit, 'USD')} />
              <BreakdownRow label="Freight/Unit" value={formatCurrency(result.freight_per_unit, 'USD')} />
              <BreakdownRow label="Insurance/Unit" value={formatCurrency(result.insurance_per_unit, 'USD')} />
              <BreakdownRow label="Duty/Unit" value={formatCurrency(result.duty_per_unit, 'USD')} />
              <BreakdownRow label="VAT/Unit" value={formatCurrency(result.vat_per_unit, 'USD')} />

              <div className="my-2 border-t" style={{ borderColor: 'var(--border)' }} />

              <BreakdownRow label="Total Cost/Unit" value={formatCurrency(result.total_cost_per_unit, 'USD')} highlight />
              <BreakdownRow label="Total Cost (Order)" value={formatCurrency(result.total_cost_order, 'USD')} highlight />

              <div className="my-2 border-t" style={{ borderColor: 'var(--border)' }} />

              <BreakdownRow label="Min Selling Price" value={formatCurrency(result.minimum_selling_price, 'USD')} />
              <BreakdownRow label="Recommended Price" value={formatCurrency(result.recommended_selling_price, 'USD')} />
              <BreakdownRow label="Customer Price" value={formatCurrency(result.final_price, result.final_currency)} highlight />
              <BreakdownRow
                label="Margin"
                value={`${formatCurrency(result.actual_margin, 'USD')} (${result.actual_margin_pct.toFixed(1)}%)`}
                highlight
              />

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="mt-4 rounded-[4px] p-3" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  {result.warnings.map((w, i) => (
                    <p key={i} className="text-[12px]" style={{ color: '#92400E' }}>{w}</p>
                  ))}
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="mt-4 w-full rounded-[4px] border px-4 py-2 text-[13px] font-semibold transition-all hover:bg-[var(--accent-light)] disabled:opacity-50"
                style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
              >
                {saving ? 'Saving...' : 'Save Calculation'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-10 w-10" style={{ color: 'var(--text-muted)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008H18v-.008zm0 2.25H18V13.5zm0 2.25H18v-.008zm0 2.25H18V18z" />
              </svg>
              <p className="mt-3 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                Fill in the inputs and click Calculate to see the cost breakdown.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
