// API Route: Knowledge Base Operations
// POST /api/knowledge/upload — Upload documents
// GET /api/knowledge/search — Search knowledge base
// POST /api/knowledge/faq — Create/manage FAQ rules

import { NextRequest, NextResponse } from 'next/server';
import { ingestDocument, matchFaqRules, buildBrainPrompt } from '@/lib/knowledge-base';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET — Search knowledge base or build brain prompt
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const action = searchParams.get('action') || 'search';
    const query = searchParams.get('q');
    const category = searchParams.get('category');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId required' }, { status: 400 });
    }

    if (action === 'brain-prompt') {
      // Build the full brain prompt for AI calls
      const prompt = await buildBrainPrompt(companyId);
      return NextResponse.json({ prompt, tokenEstimate: Math.ceil(prompt.length / 4) });
    }

    if (action === 'faq-match' && query) {
      // Match incoming message against FAQ rules
      const matches = await matchFaqRules(companyId, query);
      return NextResponse.json({ matches });
    }

    // Default: search knowledge documents
    let queryBuilder = supabase
      .from('knowledge_documents')
      .select('id, title, content, source_type, category, tags, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    if (query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ documents: data });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST — Upload document or create FAQ rule
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyId, action } = body;

    if (!companyId) {
      return NextResponse.json({ error: 'companyId required' }, { status: 400 });
    }

    if (action === 'upload-document') {
      const { title, content, sourceType, category, sourceUrl, fileName, fileType, tags } = body;

      if (!title || !content) {
        return NextResponse.json({ error: 'title and content required' }, { status: 400 });
      }

      const docId = await ingestDocument(
        companyId,
        title,
        content,
        sourceType || 'manual_entry',
        category || 'general',
        { sourceUrl, fileName, fileType, tags }
      );

      return NextResponse.json({ success: true, documentId: docId });
    }

    if (action === 'create-faq') {
      const { keywords, responseTemplate, category, priority, language } = body;

      if (!keywords || !responseTemplate) {
        return NextResponse.json({ error: 'keywords and responseTemplate required' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('faq_rules')
        .insert({
          company_id: companyId,
          keywords,
          response_template: responseTemplate,
          category: category || 'general',
          priority: priority || 0,
          language: language || 'en'
        })
        .select('id')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, faqId: data.id });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE — Remove document or FAQ rule
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    if (!companyId || !id) {
      return NextResponse.json({ error: 'companyId and id required' }, { status: 400 });
    }

    if (action === 'document') {
      await supabase
        .from('knowledge_documents')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);
    }

    if (action === 'faq') {
      await supabase
        .from('faq_rules')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
