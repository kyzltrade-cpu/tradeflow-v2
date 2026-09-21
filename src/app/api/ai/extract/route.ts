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
            content: `You are a trade inquiry field extractor. Extract structured data from the customer message.

CRITICAL RULES:
1. NEVER make commercial claims or guarantees without evidence from the source text
2. ALWAYS show the source type for each field: "customer_message", "supplier_record", "historical_quote", "user_assumption", or "unverified_inference"
3. Distinguish between what the customer EXPLICITLY stated vs what you INFERENCE
4. Mark fields as "missing" when not mentioned in the source
5. Mark fields as "inferred" when based on inference rather than explicit mention
6. Mark fields as "confirmed" ONLY when explicitly stated by the customer

Return JSON with this structure:
{
  "fields": [
    {
      "field_key": "product_name",
      "field_label": "Product Name",
      "raw_value": "what the customer said",
      "normalized_value": "cleaned value",
      "unit": "unit if applicable",
      "source_type": "customer_message|supplier_record|historical_quote|user_assumption|unverified_inference",
      "confidence": 0.95,
      "status": "confirmed|inferred|missing",
      "is_required": true|false
    }
  ],
  "language": "en",
  "missing_fields": ["field_key1", "field_key2"],
  "inferred_fields": ["field_key1"]
}

Fields to extract (if present):
- product_name: what they're buying
- quantity: how many
- unit: pcs, sets, kg, etc.
- target_price: if mentioned
- currency: USD, HKD, etc.
- incoterm: FOB, CIF, EXW, DDP
- delivery_date: when they need it
- specifications: any specs mentioned
- certifications: required certifications
- destination: delivery destination
- packaging: packaging requirements
- payment_terms: payment preferences
- colour: color preferences

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

    // Insert extracted fields with proper source tracking
    const fieldsToInsert = extracted.fields.map((field: Record<string, unknown>) => ({
      inquiry_id,
      field_key: field.field_key,
      field_label: field.field_label,
      raw_value: field.raw_value,
      normalized_value: field.normalized_value,
      unit: field.unit,
      source_type: field.source_type,
      confidence: field.confidence,
      status: field.status,
      is_required: field.is_required,
    }));

    await supabase.from('inquiry_fields').insert(fieldsToInsert);

    return NextResponse.json({
      success: true,
      extracted,
      summary: {
        total_fields: fieldsToInsert.length,
        confirmed: extracted.fields.filter((f: Record<string, unknown>) => f.status === 'confirmed').length,
        inferred: extracted.fields.filter((f: Record<string, unknown>) => f.status === 'inferred').length,
        missing: extracted.missing_fields?.length || 0,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
