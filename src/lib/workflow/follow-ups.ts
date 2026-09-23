// Schema-correct follow-up automation for the 002 schema.
// follow_up_instances: id, sequence_id, opportunity_id, quote_id, status
//   ('active','paused','completed','cancelled'), current_step, next_due_at,
//   paused_reason, ai_draft_message, approval_status, approved_by/at, sent_at, stop_reason
// follow_up_sequences.steps_json holds the step list.

import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/composio/gmail';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface FollowUpStepRow {
  day: number;
  type: 'check_in' | 'needs_update' | 'value_add' | 'close' | 'custom';
  subject: string;
  body: string;
  channel?: 'email' | 'whatsapp';
}

// ─── Seed ────────────────────────────────────────────────────

export const DEFAULT_STEPS: FollowUpStepRow[] = [
  { day: 3, type: 'check_in', subject: 'Following up on your inquiry', body: 'Hi {customer_name},\n\nJust checking in on your inquiry. Any updates?\n\nBest regards,\n{sender_name}' },
  { day: 7, type: 'needs_update', subject: 'Your quote is being prepared', body: 'Hi {customer_name},\n\nWe are finalizing your quotation and will send it shortly.\n\nBest regards,\n{sender_name}' },
  { day: 14, type: 'value_add', subject: 'Market update', body: 'Hi {customer_name},\n\nWe have a market update that may affect pricing. Happy to share details.\n\nBest regards,\n{sender_name}' },
  { day: 21, type: 'close', subject: 'Final follow-up', body: 'Hi {customer_name},\n\nPlease let us know if you would like to proceed before the current pricing window closes.\n\nBest regards,\n{sender_name}' },
];

export async function createAndSeedSequence(input: {
  companyId: string;
  name: string;
  opportunityId: string;
  quoteId?: string;
  steps?: FollowUpStepRow[];
}): Promise<string> {
  const steps = input.steps || DEFAULT_STEPS;

  const { data: seq, error: seqErr } = await supabase
    .from('follow_up_sequences')
    .insert({
      company_id: input.companyId,
      name: input.name,
      trigger_type: 'quote_sent',
      status: 'active',
      steps_json: steps,
      stop_on_reply: true,
    })
    .select('id')
    .single();

  if (seqErr || !seq) throw seqErr || new Error('Failed to create sequence');

  // Seed the first step's instance
  const { error: instErr } = await supabase.from('follow_up_instances').insert({
    sequence_id: seq.id,
    opportunity_id: input.opportunityId,
    quote_id: input.quoteId || null,
    status: 'active',
    current_step: 0,
    next_due_at: new Date(Date.now() + steps[0].day * 86400000).toISOString(),
    approval_status: 'pending',
  });

  if (instErr) throw instErr;

  return seq.id;
}

// ─── Due queue ───────────────────────────────────────────────

export async function listDueFollowUps(companyId: string, dueOnly = true) {
  const { data: sequences } = await supabase.from('follow_up_sequences').select('*').eq('company_id', companyId).eq('status', 'active');

  if (!sequences || sequences.length === 0) return [];

  const seqById = new Map(sequences.map((s) => [s.id, s]));

  let query = supabase
    .from('follow_up_instances')
    .select('id, sequence_id, opportunity_id, quote_id, status, current_step, next_due_at, ai_draft_message, approval_status')
    .in('sequence_id', sequences.map((s) => s.id));

  if (dueOnly) {
    query = query.lte('next_due_at', new Date().toISOString());
  }

  const { data: instances } = await query
    .eq('approval_status', 'pending')
    .eq('status', 'active')
    .order('next_due_at', { ascending: true });

  return (instances || []).map((inst) => ({
    ...inst,
    sequence: seqById.get(inst.sequence_id),
    steps: (seqById.get(inst.sequence_id)?.steps_json || []) as FollowUpStepRow[],
  }));
}

// ─── Approve + send ──────────────────────────────────────────

export async function approveAndSendFollowUp(instanceId: string, userId?: string, customMessage?: string) {
  const { data: inst } = await supabase.from('follow_up_instances').select('*').eq('id', instanceId).single();
  if (!inst) throw new Error('Follow-up instance not found');

  const { data: seq } = await supabase.from('follow_up_sequences').select('*').eq('id', inst.sequence_id).single();
  if (!seq) throw new Error('Sequence not found');

  const steps = (seq.steps_json || []) as FollowUpStepRow[];
  const step = steps[inst.current_step];
  const body = customMessage || inst.ai_draft_message || step?.body || 'Follow-up message';

  // Resolve recipient + sender name via opportunity -> inquiry -> customer
  let toAddress: string | null = null;
  let customerName = 'Customer';
  const senderName = 'TradeFlow';

  if (inst.opportunity_id) {
    const { data: opp } = await supabase
      .from('opportunities')
      .select('inquiry_id, customers(legal_name, email, contact_name)')
      .eq('id', inst.opportunity_id)
      .single();

    const customer: any = (opp as any)?.customers;
    if (customer) {
      toAddress = customer.email || null;
      customerName = customer.contact_name || customer.legal_name || 'Customer';
    }
  }

  if (!toAddress) throw new Error('No recipient resolved for follow-up');

  const finalBody = body.replaceAll('{customer_name}', customerName).replaceAll('{sender_name}', senderName);

  const emailRes = await sendEmail(toAddress, step?.subject || 'Follow-up', finalBody, false);

  if (emailRes.success) {
    // Log the sent message
    await supabase.from('outbound_messages').insert({
      company_id: seq.company_id,
      inquiry_id: inst.opportunity_id ? (await supabase.from('opportunities').select('inquiry_id').eq('id', inst.opportunity_id).single()).data?.inquiry_id : null,
      quote_id: inst.quote_id,
      channel: 'email',
      to_address: toAddress,
      subject: step?.subject || 'Follow-up',
      body: finalBody,
      draft_status: 'sent',
      ai_generated: false,
      sent_at: new Date().toISOString(),
      approved_by: userId || null,
      approved_at: new Date().toISOString(),
    });

    await supabase
      .from('follow_up_instances')
      .update({ approval_status: 'sent', sent_at: new Date().toISOString(), approved_by: userId || null, approved_at: new Date().toISOString() })
      .eq('id', instanceId);

    // Advance or complete
    const nextStep = inst.current_step + 1;
    if (nextStep >= steps.length) {
      await supabase.from('follow_up_instances').update({ status: 'completed' }).eq('id', instanceId);
    } else {
      await supabase
        .from('follow_up_instances')
        .update({
          status: 'active',
          current_step: nextStep,
          next_due_at: new Date(Date.now() + steps[nextStep].day * 86400000).toISOString(),
          approval_status: 'pending',
          ai_draft_message: steps[nextStep].body,
        })
        .eq('id', instanceId);
    }

    return { sent: true };
  }

  await supabase.from('follow_up_instances').update({ approval_status: 'pending' }).eq('id', instanceId);
  return { sent: false, error: emailRes.error };
}

// ─── Pause on reply ──────────────────────────────────────────

export async function pauseFollowUpsForRecipient(email: string, reason = 'Customer replied') {
  if (!email) return { paused: 0 };

  const { data: customer } = await supabase.from('customers').select('id').eq('email', email).maybeSingle();
  if (!customer) return { paused: 0 };

  const { data: inquiries } = await supabase.from('inquiries').select('id').eq('customer_id', customer.id);
  if (!inquiries || inquiries.length === 0) return { paused: 0 };

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('id')
    .in('inquiry_id', inquiries.map((i) => i.id));

  if (!opportunities || opportunities.length === 0) return { paused: 0 };

  const { data: instances } = await supabase
    .from('follow_up_instances')
    .select('id')
    .in('opportunity_id', opportunities.map((o) => o.id))
    .eq('status', 'active')
    .not('approval_status', 'eq', 'sent');

  if (!instances || instances.length === 0) return { paused: 0 };

  await supabase
    .from('follow_up_instances')
    .update({
      status: 'paused',
      stop_reason: reason,
      approval_status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .in('id', instances.map((i) => i.id));

  return { paused: instances.length };
}