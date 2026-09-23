import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/drafts - List all drafts with their status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let query = supabase
      .from('outbound_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('draft_status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ drafts: data || [] });
  } catch (error: any) {
    console.error('Drafts fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
}

// POST /api/drafts - Create a new draft
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channel, to, subject, body: draftBody, inquiryId, aiReasoning, citations } = body;

    const { data, error } = await supabase
      .from('outbound_messages')
      .insert({
        company_id: 'de16b018-a635-4b45-a5ee-101dea1d66a1',
        channel: channel || 'email',
        to_address: to,
        subject,
        body: draftBody,
        draft_status: 'pending_approval',
        ai_generated: true,
        ai_reasoning: aiReasoning || '',
        citations: citations || [],
        inquiry_id: inquiryId,
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, draftId: data.id });
  } catch (error: any) {
    console.error('Draft create error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create draft' },
      { status: 500 }
    );
  }
}

// PATCH /api/drafts - Update a draft (approve, reject, edit)
export async function PATCH(request: NextRequest) {
  try {
    const { id, status, body: draftBody } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const update: Record<string, any> = {};
    if (status) {
      update.draft_status = status;
      if (status === 'approved') update.approved_at = new Date().toISOString();
      if (status === 'sent') update.sent_at = new Date().toISOString();
    }
    if (draftBody) {
      update.body = draftBody;
    }

    const { error } = await supabase
      .from('outbound_messages')
      .update(update)
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Draft update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update draft' },
      { status: 500 }
    );
  }
}
