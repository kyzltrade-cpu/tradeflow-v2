import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { analyzeInquiryFields, DEMO_COMPANY_ID } from '@/lib/workflow/clarification';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FOCUS_STATUSES = ['new', 'needs_clarification', 'clarification_sent', 'requirements_confirmed'];

// GET /api/workflow/clarifications — queue of inquiries needing human clarification work
export async function GET(_request: NextRequest) {
  try {
    const { data: inquiries } = await supabase
      .from('inquiries')
      .select('id, subject, sender_name, sender_email, status, processing_status, created_at')
      .eq('company_id', DEMO_COMPANY_ID)
      .in('status', FOCUS_STATUSES)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!inquiries) return NextResponse.json({ items: [] });

    const { data: fields } = await supabase
      .from('inquiry_fields')
      .select('id, inquiry_id, field_key, field_label, raw_value, normalized_value, confidence, status')
      .in('inquiry_id', inquiries.map((i) => i.id));

    const { data: drafts } = await supabase
      .from('outbound_messages')
      .select('inquiry_id')
      .eq('draft_status', 'pending_approval');

    const draftSet = new Set((drafts || []).map((d) => d.inquiry_id));
    const fieldsByInquiry = new Map<string, typeof fields>();
    (fields || []).forEach((f) => {
      if (!fieldsByInquiry.has(f.inquiry_id)) fieldsByInquiry.set(f.inquiry_id, []);
      fieldsByInquiry.get(f.inquiry_id)!.push(f);
    });

    const items = inquiries.map((inq) => {
      const inqFields = fieldsByInquiry.get(inq.id) || [];
      const analysis = analyzeInquiryFields(inqFields as any);
      return {
        id: inq.id,
        subject: inq.subject,
        sender_name: inq.sender_name,
        sender_email: inq.sender_email,
        status: inq.status,
        processing_status: inq.processing_status,
        created_at: inq.created_at,
        fields: inqFields,
        missingCount: analysis.missing.length,
        criticalMissing: analysis.missing.filter((m) => m.importance === 'critical').length,
        hasDraft: draftSet.has(inq.id),
      };
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Clarifications fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch clarifications' },
      { status: 500 }
    );
  }
}