import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    const { inquiry_id } = await request.json();

    const supabase = supabaseAdmin;

    const { data: inquiry } = await supabase
      .from('inquiries')
      .select('*')
      .eq('id', inquiry_id)
      .single();

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    await supabase
      .from('inquiries')
      .update({ processing_status: 'processing' })
      .eq('id', inquiry_id);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Extract structured inquiry data from this email. Return JSON with these fields:
- product_name: string (what they're buying)
- quantity: number (how many)
- unit: string (pcs, sets, kg, etc.)
- target_price: number (if mentioned, otherwise null)
- currency: string (USD, HKD, etc.)
- incoterm: string (FOB, CIF, EXW, DDP)
- delivery_date: string (if mentioned, otherwise null)
- specifications: object (any specs mentioned)
- language: string (detected language code)
Return ONLY valid JSON.`,
          },
          {
            role: 'user',
            content: `Subject: ${inquiry.subject}\n\n${inquiry.original_message}`,
          },
        ],
        temperature: 0,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      await supabase
        .from('inquiries')
        .update({ processing_status: 'failed', error_message: `OpenAI API error: ${response.status}` })
        .eq('id', inquiry_id);
      return NextResponse.json({ error: 'AI extraction failed' }, { status: 500 });
    }

    const data = await response.json();
    const extracted = JSON.parse(data.choices[0].message.content);

    await supabase
      .from('inquiries')
      .update({
        processing_status: 'completed',
        detected_language: extracted.language || 'en',
      })
      .eq('id', inquiry_id);

    await supabase.from('inquiry_fields').insert([
      { inquiry_id, field_key: 'product_name', field_label: 'Product Name', raw_value: extracted.product_name, source_type: 'ai_inference', confidence: 0.85, status: 'extracted', is_required: true },
      { inquiry_id, field_key: 'quantity', field_label: 'Quantity', raw_value: String(extracted.quantity ?? ''), normalized_value: String(extracted.quantity ?? ''), unit: extracted.unit, source_type: 'ai_inference', confidence: 0.8, status: extracted.quantity ? 'extracted' : 'missing', is_required: true },
      { inquiry_id, field_key: 'target_price', field_label: 'Target Price', raw_value: extracted.target_price != null ? String(extracted.target_price) : '', source_type: 'ai_inference', confidence: 0.7, status: extracted.target_price ? 'extracted' : 'missing', is_required: false },
      { inquiry_id, field_key: 'currency', field_label: 'Currency', raw_value: extracted.currency || '', source_type: 'ai_inference', confidence: 0.9, status: extracted.currency ? 'extracted' : 'missing', is_required: true },
      { inquiry_id, field_key: 'incoterm', field_label: 'Incoterm', raw_value: extracted.incoterm || '', source_type: 'ai_inference', confidence: 0.85, status: extracted.incoterm ? 'extracted' : 'missing', is_required: true },
    ]);

    return NextResponse.json({ success: true, extracted });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
