import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const from = body.from || body.sender || body.From || body.Sender || '';
    const subject = body.subject || body.Subject || 'No Subject';
    const text = body.text || body.body || body.Text || body.Body || '';
    const html = body.html || body.Html || '';

    const senderEmail = typeof from === 'string' ? from : from.address || from.email || '';
    const senderName = typeof from === 'string' ? senderEmail.split('@')[0] : from.name || senderEmail.split('@')[0];

    const supabase = supabaseAdmin;

    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', senderEmail)
      .limit(1)
      .single();

    let customerId = existingCustomer?.id;

    if (!customerId) {
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          company_id: 'de16b018-a635-4b45-a5ee-101dea1d66a1',
          legal_name: senderEmail.split('@')[1] || senderEmail,
          email: senderEmail,
          contact_name: senderName,
        })
        .select('id')
        .single();
      customerId = newCustomer?.id;
    }

    const { data: inquiry, error } = await supabase
      .from('inquiries')
      .insert({
        company_id: 'de16b018-a635-4b45-a5ee-101dea1d66a1',
        source_channel: 'email',
        sender_name: senderName,
        sender_email: senderEmail,
        subject,
        original_message: text,
        raw_html: html,
        customer_id: customerId,
        processing_status: 'new',
        priority: 'normal',
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, inquiry_id: inquiry.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
