import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;

    const { data: pendingInquiries, error } = await supabase
      .from('inquiries')
      .select('id')
      .eq('processing_status', 'new')
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!pendingInquiries || pendingInquiries.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: 'No pending inquiries' });
    }

    const results = await Promise.allSettled(
      pendingInquiries.map(async (inquiry) => {
        const res = await fetch(`${request.nextUrl.origin}/api/ai/extract`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inquiry_id: inquiry.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Extraction failed');
        return { id: inquiry.id, success: true };
      }),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({ success: true, processed: pendingInquiries.length, succeeded, failed });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
