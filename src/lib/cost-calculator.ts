// Deterministic cost calculation engine - the moat
// No AI needed - pure math

export interface CostInputs {
  // Supplier costs
  unit_price: number;
  currency: string;
  moq: number;
  quantity: number;
  tooling_cost: number;
  sample_cost: number;
  packaging_cost: number;

  // Freight & logistics
  incoterm: string;
  estimated_freight_per_unit: number;
  insurance_rate: number;

  // Duties & taxes
  hs_code?: string;
  duty_rate: number;
  vat_rate: number;

  // Exchange rates
  exchange_rate: number;
  target_currency: string;
  customer_exchange_rate: number;

  // Company settings
  target_margin_percentage: number;
  minimum_margin_percentage: number;

  // Volume
  order_quantity: number;
}

export interface CostBreakdown {
  // Base costs
  unit_price_usd: number;
  tooling_per_unit: number;
  sample_per_unit: number;
  packaging_per_unit: number;
  subtotal_per_unit: number;

  // Logistics
  freight_per_unit: number;
  insurance_per_unit: number;

  // Duties & taxes
  duty_per_unit: number;
  vat_per_unit: number;

  // Total cost
  total_cost_per_unit: number;
  total_cost_order: number;

  // Pricing
  minimum_selling_price: number;
  recommended_selling_price: number;
  customer_price: number;

  // Margins
  actual_margin: number;
  actual_margin_pct: number;

  // Currency
  final_currency: string;
  final_price: number;

  // Warnings
  warnings: string[];
}

export function calculateCosts(inputs: CostInputs): CostBreakdown {
  const warnings: string[] = [];

  // Convert supplier price to USD
  const unit_price_usd = inputs.unit_price / inputs.exchange_rate;

  // Per-unit amortized costs
  const tooling_per_unit = inputs.tooling_cost / inputs.order_quantity;
  const sample_per_unit = inputs.sample_cost / inputs.order_quantity;
  const packaging_per_unit = inputs.packaging_cost / inputs.order_quantity;

  // Subtotal before logistics
  const subtotal_per_unit = unit_price_usd + tooling_per_unit + sample_per_unit + packaging_per_unit;

  // Freight & insurance
  const freight_per_unit = inputs.estimated_freight_per_unit;
  const insurance_per_unit = subtotal_per_unit * (inputs.insurance_rate / 100);

  // Duties (usually on CIF value)
  const cif_value = subtotal_per_unit + freight_per_unit + insurance_per_unit;
  const duty_per_unit = cif_value * (inputs.duty_rate / 100);

  // VAT (usually on CIF + duty)
  const vat_per_unit = (cif_value + duty_per_unit) * (inputs.vat_rate / 100);

  // Total cost per unit
  const total_cost_per_unit = subtotal_per_unit + freight_per_unit + insurance_per_unit + duty_per_unit + vat_per_unit;
  const total_cost_order = total_cost_per_unit * inputs.order_quantity;

  // Minimum selling price (at minimum margin)
  const minimum_selling_price = total_cost_per_unit / (1 - inputs.minimum_margin_percentage / 100);

  // Recommended selling price (at target margin)
  const recommended_selling_price = total_cost_per_unit / (1 - inputs.target_margin_percentage / 100);

  // Customer price (using recommended)
  const customer_price = recommended_selling_price;

  // Actual margin
  const actual_margin = customer_price - total_cost_per_unit;
  const actual_margin_pct = (actual_margin / customer_price) * 100;

  // Convert to customer currency
  const final_price = customer_price * inputs.customer_exchange_rate;

  // Warnings
  if (inputs.order_quantity < inputs.moq) {
    warnings.push(`Order quantity (${inputs.order_quantity}) is below MOQ (${inputs.moq})`);
  }
  if (actual_margin_pct < inputs.minimum_margin_percentage) {
    warnings.push(`Margin (${actual_margin_pct.toFixed(1)}%) is below minimum (${inputs.minimum_margin_percentage}%)`);
  }
  if (!inputs.hs_code) {
    warnings.push('No HS code provided - duty rate may be inaccurate');
  }

  return {
    unit_price_usd,
    tooling_per_unit,
    sample_per_unit,
    packaging_per_unit,
    subtotal_per_unit,
    freight_per_unit,
    insurance_per_unit,
    duty_per_unit,
    vat_per_unit,
    total_cost_per_unit,
    total_cost_order,
    minimum_selling_price,
    recommended_selling_price,
    customer_price,
    actual_margin,
    actual_margin_pct,
    final_currency: inputs.target_currency,
    final_price,
    warnings,
  };
}

// Exchange rate fetching (with cache)
const rateCache = new Map<string, { rate: number; fetched_at: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;

  const key = `${from}-${to}`;
  const cached = rateCache.get(key);
  if (cached && Date.now() - cached.fetched_at < CACHE_TTL) {
    return cached.rate;
  }

  try {
    const res = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${from}`
    );
    const data = await res.json();
    const rate = data.rates[to];
    if (rate) {
      rateCache.set(key, { rate, fetched_at: Date.now() });
      return rate;
    }
  } catch (e) {
    console.error('Failed to fetch exchange rate:', e);
  }

  // Fallback rates
  const fallbackRates: Record<string, Record<string, number>> = {
    USD: { HKD: 7.8, CNY: 7.2, EUR: 0.92, GBP: 0.79, JPY: 149.5 },
    HKD: { USD: 0.128, CNY: 0.923, EUR: 0.118, GBP: 0.101, JPY: 19.17 },
    CNY: { USD: 0.139, HKD: 1.083, EUR: 0.128, GBP: 0.11, JPY: 20.76 },
  };

  return fallbackRates[from]?.[to] ?? 1;
}
