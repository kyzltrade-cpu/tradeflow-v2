import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: quote } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    const { data: costComponents } = await supabase
      .from('quote_cost_components')
      .select('*')
      .eq('quote_id', id)
      .order('sort_order');

    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', quote.customer_id)
      .single();

    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', quote.company_id)
      .single();

    // Generate HTML for PDF
    const html = generateQuoteHTML({
      quote,
      costComponents: costComponents || [],
      customer,
      company,
    });

    // Return HTML that can be printed to PDF
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="quote-${quote.quote_number || quote.id}.html"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function generateQuoteHTML({
  quote,
  costComponents,
  customer,
  company,
}: {
  quote: Record<string, unknown>;
  costComponents: Record<string, unknown>[];
  customer: Record<string, unknown> | null;
  company: Record<string, unknown> | null;
}) {
  const companyName = (company?.name as string) || 'TradeFlow Sourcing';
  const customerName = (customer?.legal_name as string) || (customer?.trading_name as string) || 'Valued Customer';
  const contactName = (customer?.contact_name as string) || '';
  const quoteNumber = (quote.quote_number as string) || quote.id;
  const totalAmount = quote.total_amount as number;
  const currency = (quote.currency as string) || 'USD';
  const validUntil = quote.valid_until ? new Date(quote.valid_until as string).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const paymentTerms = (quote.payment_terms as string) || '50% on order confirmation, 50% on delivery';
  const incoterm = (quote.incoterm as string) || 'CIF';
  const notes = (quote.notes as string) || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quote ${quoteNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; line-height: 1.5; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #2563EB; padding-bottom: 20px; }
    .company-name { font-size: 24px; font-weight: 700; color: #2563EB; }
    .quote-title { font-size: 14px; color: #666; margin-top: 4px; }
    .quote-number { font-size: 18px; font-weight: 600; color: #111; text-align: right; }
    .quote-date { font-size: 13px; color: #666; text-align: right; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .customer-info { font-size: 14px; }
    .customer-info p { margin-bottom: 4px; }
    .line-items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .line-items th { text-align: left; padding: 10px 12px; background: #F3F4F6; font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E5E7EB; }
    .line-items td { padding: 12px; font-size: 14px; border-bottom: 1px solid #E5E7EB; }
    .line-items .amount { text-align: right; font-weight: 500; }
    .line-items .total-row td { border-top: 2px solid #2563EB; font-weight: 700; font-size: 16px; color: #2563EB; }
    .terms { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .term-item { font-size: 13px; }
    .term-label { font-weight: 600; color: #666; margin-bottom: 4px; }
    .notes { font-size: 13px; color: #666; padding: 15px; background: #F9FAFB; border-radius: 6px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 11px; color: #999; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">${companyName}</div>
      <div class="quote-title">QUOTATION</div>
    </div>
    <div>
      <div class="quote-number">${quoteNumber}</div>
      <div class="quote-date">Date: ${new Date(quote.created_at as string).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      ${validUntil ? `<div class="quote-date">Valid Until: ${validUntil}</div>` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-title">To</div>
    <div class="customer-info">
      <p><strong>${customerName}</strong></p>
      ${contactName ? `<p>${contactName}</p>` : ''}
      ${customer?.email ? `<p>${customer.email}</p>` : ''}
      ${customer?.country ? `<p>${customer.country}</p>` : ''}
    </div>
  </div>

  <table class="line-items">
    <thead>
      <tr>
        <th>Description</th>
        <th class="amount">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${costComponents.map((comp) => `
        <tr>
          <td>${comp.label || comp.component_name}</td>
          <td class="amount">${formatCurrencyAmount(comp.amount as number, currency)}</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td>Total</td>
        <td class="amount">${formatCurrencyAmount(totalAmount, currency)}</td>
      </tr>
    </tbody>
  </table>

  <div class="terms">
    <div class="term-item">
      <div class="term-label">Payment Terms</div>
      <div>${paymentTerms}</div>
    </div>
    <div class="term-item">
      <div class="term-label">Delivery Terms</div>
      <div>${incoterm}</div>
    </div>
    ${validUntil ? `
    <div class="term-item">
      <div class="term-label">Validity</div>
      <div>${validUntil}</div>
    </div>` : ''}
  </div>

  ${notes ? `
  <div class="section">
    <div class="section-title">Notes</div>
    <div class="notes">${notes}</div>
  </div>` : ''}

  <div class="footer">
    <p>This quote is subject to our standard terms and conditions.</p>
    <p>Generated by TradeFlow Sourcing</p>
  </div>
</body>
</html>`;
}

function formatCurrencyAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}
