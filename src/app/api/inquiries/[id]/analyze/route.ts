import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { analyzeInquiryFields } from '@/lib/workflow/clarification';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/inquiries/[id]/analyze — Step 3: detect missing/conflicting fields
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

    return NextResponse.json({ success: true, analysis });
  } catch (error: any) {
    console.error('Analyze error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze inquiry' },
      { status: 500 }
    );
  }
}