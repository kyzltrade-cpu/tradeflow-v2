// Module 6: Follow-Up Automation with Stop-on-Reply
// Auto-schedules follow-ups, stops when customer responds

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Types ───────────────────────────────────────────────────

export interface FollowUpStep {
  day: number;
  type: 'check_in' | 'needs_update' | 'value_add' | 'close' | 'custom';
  subject: string;
  bodyTemplate: string;
  channel: 'email' | 'whatsapp';
}

export interface FollowUpSequence {
  id: string;
  name: string;
  steps: FollowUpStep[];
  stopOnReply: boolean;
  stopOnOutcome: boolean;
  language: string;
}

export interface FollowUpInstance {
  id: string;
  sequence_id: string;
  inquiry_id: string;
  quote_id: string;
  current_step: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled' | 'stopped_on_reply';
  next_scheduled_at: string;
  ai_draft_message?: string;
  approval_status: 'pending' | 'approved' | 'sent' | 'cancelled' | 'skipped';
}

// ─── Default Sequences ───────────────────────────────────────

export const DEFAULT_SEQUENCES: Record<string, FollowUpStep[]> = {
  standard: [
    {
      day: 3,
      type: 'check_in',
      subject: 'Following up on your inquiry',
      bodyTemplate: 'Hi {customer_name},\n\nI wanted to follow up on your recent inquiry about {product_type}. We\'ve received your requirements and are preparing a detailed quotation.\n\nIs there anything else you\'d like us to consider?\n\nBest regards,\n{sender_name}',
      channel: 'email'
    },
    {
      day: 7,
      type: 'needs_update',
      subject: 'Quick update on your quote',
      bodyTemplate: 'Hi {customer_name},\n\nWe\'re finalizing the quotation for your {product_type} order. A few details we\'d like to confirm:\n\n{missing_fields_list}\n\nOnce we have these, we can provide a final price.\n\nBest regards,\n{sender_name}',
      channel: 'email'
    },
    {
      day: 14,
      type: 'value_add',
      subject: 'Market update for {product_type}',
      bodyTemplate: 'Hi {customer_name},\n\nI wanted to share a quick market update. Current pricing for {product_type} in {material} is trending {trend}. We can lock in current prices if you confirm by {deadline}.\n\nLet me know if you have any questions.\n\nBest regards,\n{sender_name}',
      channel: 'email'
    },
    {
      day: 21,
      type: 'close',
      subject: 'Final follow-up — your quote expires soon',
      bodyTemplate: 'Hi {customer_name},\n\nYour quotation (Reference: {quote_number}) is valid until {valid_until}. After this date, we may need to reconfirm pricing with our suppliers.\n\nWould you like to proceed, or shall we extend the validity?\n\nBest regards,\n{sender_name}',
      channel: 'email'
    }
  ],
  aggressive: [
    { day: 1, type: 'check_in', subject: 'Following up', bodyTemplate: 'Hi {customer_name},\n\nJust checking in on your inquiry. Any updates?\n\nBest regards,\n{sender_name}', channel: 'email' },
    { day: 3, type: 'needs_update', subject: 'Your quote is ready', bodyTemplate: 'Hi {customer_name},\n\nYour quotation is ready for review. Shall I walk you through the details?\n\nBest regards,\n{sender_name}', channel: 'email' },
    { day: 5, type: 'value_add', subject: 'Special offer', bodyTemplate: 'Hi {customer_name},\n\nWe can offer a {discount}% discount if you confirm within 48 hours. Interested?\n\nBest regards,\n{sender_name}', channel: 'email' },
    { day: 7, type: 'close', subject: 'Last chance for discount', bodyTemplate: 'Hi {customer_name},\n\nThe special pricing expires tomorrow. Let me know if you\'d like to proceed.\n\nBest regards,\n{sender_name}', channel: 'email' }
  ],
  gentle: [
    { day: 7, type: 'check_in', subject: 'Just checking in', bodyTemplate: 'Hi {customer_name},\n\nHope you\'re well. Just a friendly reminder about your inquiry. No rush — just let me know when you\'re ready.\n\nBest regards,\n{sender_name}', channel: 'email' },
    { day: 21, type: 'value_add', subject: 'Market insights', bodyTemplate: 'Hi {customer_name},\n\nThought you might find this interesting — {market_insight}. Happy to discuss when you\'re ready.\n\nBest regards,\n{sender_name}', channel: 'email' }
  ]
};

// ─── Create Follow-Up Sequence ───────────────────────────────

export async function createFollowUpSequence(
  companyId: string,
  inquiryId: string,
  quoteId: string,
  sequenceName: string = 'standard',
  customSteps?: FollowUpStep[]
): Promise<string | null> {
  const steps = customSteps || DEFAULT_SEQUENCES[sequenceName] || DEFAULT_SEQUENCES.standard;

  // Get inquiry details for template variables
  const inquiry = await getInquiryContext(inquiryId);
  if (!inquiry) return null;

  // Save the sequence
  const { data: seqData, error: seqError } = await supabase
    .from('follow_up_sequences')
    .insert({
      company_id: companyId,
      name: `${sequenceName} - ${inquiry.customer_name || 'Unknown'}`,
      steps,
      stop_on_reply: true,
      stop_on_outcome: true,
      ai_generated: true
    })
    .select('id')
    .single();

  if (seqError || !seqData) {
    console.error('Failed to create follow-up sequence:', seqError);
    return null;
  }

  // Create instances for each step
  const instances = steps.map((step, index) => {
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + step.day);

    const messageBody = interpolateTemplate(step.bodyTemplate, inquiry);

    return {
      sequence_id: seqData.id,
      inquiry_id: inquiryId,
      quote_id: quoteId,
      current_step: index,
      status: 'active',
      next_scheduled_at: scheduledDate.toISOString(),
      ai_draft_message: messageBody,
      approval_status: 'pending'
    };
  });

  const { error: instError } = await supabase
    .from('follow_up_instances')
    .insert(instances);

  if (instError) {
    console.error('Failed to create follow-up instances:', instError);
  }

  return seqData.id;
}

// ─── Stop on Reply ───────────────────────────────────────────

export async function checkAndStopOnReply(
  conversationId: string,
  companyId: string
): Promise<number> {
  // Check if there's a new inbound message
  const { data: messages } = await supabase
    .from('messages')
    .select('id, direction')
    .eq('conversation_id', conversationId)
    .eq('direction', 'inbound')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!messages || messages.length === 0) return 0;

  // Find active follow-up instances for this conversation's inquiry
  const { data: instances } = await supabase
    .from('follow_up_instances')
    .select('id, sequence_id')
    .eq('status', 'active')
    .in('inquiry_id', await getInquiryIdFromConversation(conversationId));

  if (!instances || instances.length === 0) return 0;

  // Stop all active instances
  const stoppedCount = instances.length;

  await supabase
    .from('follow_up_instances')
    .update({
      status: 'stopped_on_reply',
      stop_reason: 'Customer replied',
      approval_status: 'cancelled'
    })
    .in('id', instances.map(i => i.id));

  return stoppedCount;
}

// ─── Get Pending Approvals ───────────────────────────────────

export async function getPendingFollowUps(
  companyId: string
): Promise<FollowUpInstance[]> {
  const { data } = await supabase
    .from('follow_up_instances')
    .select(`
      *,
      follow_up_sequences!inner (name, company_id),
      inquiries!inner (customer_id, customers (name, email))
    `)
    .eq('follow_up_sequences.company_id', companyId)
    .eq('status', 'active')
    .eq('approval_status', 'pending')
    .lte('next_scheduled_at', new Date().toISOString())
    .order('next_scheduled_at');

  return (data || []) as any;
}

// ─── Approve and Send ────────────────────────────────────────

export async function approveAndSendFollowUp(
  instanceId: string,
  userId: string,
  customMessage?: string
): Promise<boolean> {
  // Get the instance
  const { data: instance } = await supabase
    .from('follow_up_instances')
    .select('*, follow_up_sequences (steps)')
    .eq('id', instanceId)
    .single();

  if (!instance) return false;

  // Update approval status
  await supabase
    .from('follow_up_instances')
    .update({
      approval_status: 'approved',
      approved_by: userId,
      approved_at: new Date().toISOString(),
      ai_draft_message: customMessage || instance.ai_draft_message
    })
    .eq('id', instanceId);

  // Queue for sending
  await supabase
    .from('outbound_messages')
    .insert({
      company_id: (instance as any).follow_up_sequences?.company_id,
      inquiry_id: instance.inquiry_id,
      quote_id: instance.quote_id,
      channel: 'email',
      to_address: '', // Will be filled from inquiry context
      subject: `Follow-up: ${instance.follow_up_sequences?.name || 'Check-in'}`,
      body: customMessage || instance.ai_draft_message || '',
      draft_status: 'approved',
      ai_generated: true,
      approved_by: userId,
      approved_at: new Date().toISOString()
    });

  // Advance to next step
  const nextStep = (instance as any).current_step + 1;
  const steps = (instance as any).follow_up_sequences?.steps || [];

  if (nextStep >= steps.length) {
    // Sequence complete
    await supabase
      .from('follow_up_instances')
      .update({ status: 'completed' })
      .eq('id', instanceId);
  } else {
    // Schedule next step
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + steps[nextStep].day);

    await supabase
      .from('follow_up_instances')
      .update({
        current_step: nextStep,
        next_scheduled_at: nextDate.toISOString(),
        approval_status: 'pending',
        ai_draft_message: '' // Will be regenerated
      })
      .eq('id', instanceId);
  }

  return true;
}

// ─── Cancel Follow-Up ────────────────────────────────────────

export async function cancelFollowUp(instanceId: string, reason: string): Promise<boolean> {
  const { error } = await supabase
    .from('follow_up_instances')
    .update({
      status: 'cancelled',
      stop_reason: reason,
      approval_status: 'cancelled'
    })
    .eq('id', instanceId);

  return !error;
}

// ─── Helpers ─────────────────────────────────────────────────

async function getInquiryContext(inquiryId: string) {
  const { data } = await supabase
    .from('inquiries')
    .select(`
      *,
      customers (name, email),
      companies (name)
    `)
    .eq('id', inquiryId)
    .single();

  return data as any;
}

async function getInquiryIdFromConversation(conversationId: string): Promise<string[]> {
  const { data } = await supabase
    .from('inquiries')
    .select('id')
    .eq('conversation_id', conversationId);

  return (data || []).map((d: any) => d.id);
}

function interpolateTemplate(template: string, context: any): string {
  const vars: Record<string, string> = {
    customer_name: context.customers?.name || 'Customer',
    product_type: context.product_type || 'your requested products',
    material: context.material || '',
    sender_name: context.companies?.name || 'TradeFlow',
    quote_number: context.quote_number || '[Quote #]',
    valid_until: context.valid_until || '[Date]',
    missing_fields_list: (context.missing_fields || []).join('\n- ') || 'None',
    trend: context.market_trend || 'stable',
    deadline: context.price_deadline || '[Date]',
    discount: context.discount_percentage || '5',
    market_insight: context.market_insight || 'market conditions are favorable'
  };

  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, value);
  }
  return result;
}
