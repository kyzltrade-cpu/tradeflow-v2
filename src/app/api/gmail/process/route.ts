import { NextRequest, NextResponse } from 'next/server';
import { fetchEmail, markAsRead } from '@/lib/composio/gmail';
import { createClient } from '@supabase/supabase-js';
import { pauseFollowUpsForRecipient } from '@/lib/workflow/follow-ups';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/gmail/process - Process a Gmail message into an RFQ inquiry
export async function POST(request: NextRequest) {
  try {
    const { messageId, autoMarkRead = true } = await request.json();

    if (!messageId) {
      return NextResponse.json({ error: 'messageId is required' }, { status: 400 });
    }

    // Fetch the full email
    const email = await fetchEmail(messageId);
    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Check if we already processed this email
    const { data: existing } = await supabase
      .from('inquiries')
      .select('id')
      .eq('source_message_id', messageId)
      .limit(1)
      .maybeSingle();

    if (existing) {
      // Customer reply to an existing inquiry: pause active follow-up sequences
      const paused = await pauseFollowUpsForRecipient(email.fromEmail).catch(() => ({ paused: 0 }));
      return NextResponse.json({
        success: true,
        inquiryId: existing.id,
        message: 'Already processed',
        followUpsPaused: paused.paused,
      });
    }

    // Create or find customer
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email.fromEmail)
      .limit(1)
      .maybeSingle();

    let customerId = existingCustomer?.id;
    if (!customerId) {
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          company_id: 'de16b018-a635-4b45-a5ee-101dea1d66a1',
          legal_name: email.fromEmail.split('@')[1] || email.fromEmail,
          email: email.fromEmail,
          contact_name: email.from,
        })
        .select('id')
        .single();
      customerId = newCustomer?.id;
    }

    // Create inquiry
    const { data: inquiry, error } = await supabase
      .from('inquiries')
      .insert({
        company_id: 'de16b018-a635-4b45-a5ee-101dea1d66a1',
        source_channel: 'email',
        source_message_id: messageId,
        sender_name: email.from,
        sender_email: email.fromEmail,
        subject: email.subject,
        original_message: email.body,
        customer_id: customerId,
        processing_status: 'new',
        priority: 'normal',
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Optionally mark as read
    if (autoMarkRead) {
      await markAsRead([messageId]).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      inquiryId: inquiry.id,
      email: {
        id: email.id,
        subject: email.subject,
        from: email.from,
        fromEmail: email.fromEmail,
      },
    });
  } catch (error: any) {
    console.error('Gmail process error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process email' },
      { status: 500 }
    );
  }
}
