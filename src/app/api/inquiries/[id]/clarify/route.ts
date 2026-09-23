import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  analyzeInquiryFields,
  draftClarification,
  saveClarificationDraft,
  setInquiryStatus,
} from '@/lib/workflow/clarification';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/inquiries/[id]/clarify — Steps 4-5: AI-draft clarification, queue for approval
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { data: inquiry } = await supabase
      .from('inquiries')
      .select('*')
      .eq('id', id)
      .single();

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    const { data: fields } = await supabase
      .from('inquiry_fields')
      .select('*')
      .eq('inquiry_id', id);

    const analysis = analyzeInquiryFields(fields || []);
    const missing = analysis.needs_clarification
      ? analysis.missing
      : analysis.missing.filter((m) => m.importance !== 'nice_to_have');

    if (missing.length === 0) {
      return NextResponse.json({
        success: true,
        needsClarification: false,
        message: 'No missing fields — requirements are complete',
      });
    }

    const draft = await draftClarification(inquiry, missing, inquiry.detected_language || 'en');
    const draftId = await saveClarificationDraft(id, inquiry.sender_email || '', draft);

    if (!draftId) {
      return NextResponse.json({ error: 'Failed to save clarification draft' }, { status: 500 });
    }

    await setInquiryStatus(id, 'needs_clarification');

    return NextResponse.json({
      success: true,
      needsClarification: true,
      draftId,
      draft,
    });
  } catch (error: any) {
    console.error('Clarify error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to draft clarification' },
      { status: 500 }
    );
  }
}