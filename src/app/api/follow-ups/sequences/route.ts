import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAndSeedSequence } from '@/lib/workflow/follow-ups';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/follow-ups/sequences — create a sequence + seed first instance
export async function POST(request: NextRequest) {
  try {
    const { companyId, name, opportunityId, quoteId, steps } = await request.json();

    if (!companyId || !name || !opportunityId) {
      return NextResponse.json({ error: 'companyId, name, and opportunityId are required' }, { status: 400 });
    }

    const sequenceId = await createAndSeedSequence({ companyId, name, opportunityId, quoteId, steps });
    return NextResponse.json({ success: true, sequenceId });
  } catch (error: any) {
    console.error('Follow-up sequence create error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create sequence' },
      { status: 500 }
    );
  }
}