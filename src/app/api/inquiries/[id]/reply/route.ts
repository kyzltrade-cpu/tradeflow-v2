import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { registerCustomerReply, setInquiryStatus } from '@/lib/workflow/clarification';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/inquiries/[id]/reply — Step 6: record customer reply,
// bump requirement version, advance status to requirements_confirmed
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { reply_text } = await request.json();

    if (!reply_text || typeof reply_text !== 'string') {
      return NextResponse.json({ error: 'reply_text is required' }, { status: 400 });
    }

    const { replyId, version } = await registerCustomerReply(id, reply_text);

    await setInquiryStatus(id, 'requirements_confirmed');

    const { data: inquiry } = await supabase
      .from('inquiries')
      .select('*')
      .eq('id', id)
      .single();

    return NextResponse.json({
      success: true,
      replyId,
      versionId: version?.id,
      versionNumber: version?.version_number,
      status: inquiry?.status,
    });
  } catch (error: any) {
    console.error('Reply error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to register reply' },
      { status: 500 }
    );
  }
}