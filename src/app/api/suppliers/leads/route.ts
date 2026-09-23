import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { callNimJson } from '@/lib/ai/nim';
import { DEMO_COMPANY_ID } from '@/lib/workflow/clarification';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface LeadPayload {
  legal_name: string;
  website?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  location?: string;
  note?: string;
}

// POST /api/suppliers/leads — capture an external supplier lead
// (from web research, trade shows, referrals). Optionally AI-enriches facts.
export async function POST(request: NextRequest) {
  try {
    const body: LeadPayload = await request.json();

    if (!body.legal_name || typeof body.legal_name !== 'string') {
      return NextResponse.json({ error: 'legal_name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        company_id: DEMO_COMPANY_ID,
        legal_name: body.legal_name.trim(),
        website: body.website || null,
        contact_name: body.contact_name || null,
        contact_email: body.contact_email || null,
        contact_phone: body.contact_phone || null,
        location: body.location || null,
        notes: `LEAD: ${body.note || 'External lead captured'}`,
        is_approved: false,
        performance_score: 0,
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with AI facts from website if provided and NIM is available
    let factSummary: string[] = [];
    if (body.website && process.env.NIM_API_KEY) {
      try {
        const facts = await callNimJson<{ facts: string[] }>(
          [
            {
              role: 'system',
              content: `You enrich supplier profiles for a HK-based sourcing company using the provided company name and website.
Return JSON: {"facts": string[]} — 3-6 concise sourcing-relevant facts (products, certifications, location, scale, MOQ behavior). If the input is too thin, still return reasonable profile notes from the name.`,
            },
            {
              role: 'user',
              content: `Company: ${body.legal_name}\nWebsite: ${body.website}\nLocation: ${body.location || 'unknown'}`,
            },
          ],
          { temperature: 0.2 }
        );
        factSummary = facts.facts || [];
      } catch (err) {
        console.error('Lead enrichment failed:', err);
      }
    }

    if (factSummary.length > 0) {
      await supabase.from('knowledge_documents').insert({
        company_id: DEMO_COMPANY_ID,
        title: `Supplier profile — ${body.legal_name}`,
        content: factSummary.join('\n'),
        source_type: 'url_scrape',
        source_url: body.website || null,
        category: 'supplier_info',
        tags: ['supplier_lead', 'ai_enriched'],
      });
    }

    return NextResponse.json({
      success: true,
      supplierId: data.id,
      enriched: factSummary.length > 0,
      facts: factSummary,
    });
  } catch (error: any) {
    console.error('Lead capture error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to capture lead' },
      { status: 500 }
    );
  }
}