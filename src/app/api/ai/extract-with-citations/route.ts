// API Route: AI Extraction with Citations
// POST /api/ai/extract-with-citations

import { NextRequest, NextResponse } from 'next/server';
import { extractFromInquiry, saveExtractedFields, saveCitations } from '@/lib/rfq-extraction';
import { detectMissingFields, needsClarification, draftClarificationEmail, saveClarificationDraft } from '@/lib/missing-fields';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { inquiryId, emailText, attachmentContents, category, companyId } = body;

    if (!inquiryId || !emailText || !companyId) {
      return NextResponse.json(
        { error: 'Missing required fields: inquiryId, emailText, companyId' },
        { status: 400 }
      );
    }

    // Step 1: Extract fields with citations
    const fields = await extractFromInquiry(
      emailText,
      attachmentContents || [],
      category || 'default',
      companyId
    );

    // Step 2: Save extracted fields and citations to DB
    await saveExtractedFields(fields, inquiryId, companyId);

    // Step 3: Check for missing fields
    const missing = detectMissingFields(fields, category);
    const clarificationNeeded = needsClarification(fields);

    // Step 4: If clarification needed, draft the email
    let clarificationDraft = null;
    if (clarificationNeeded.needed) {
      // Get inquiry context for the draft
      const { data: inquiry } = await supabase
        .from('inquiries')
        .select('customer_id, customers (name, email), conversations (subject)')
        .eq('id', inquiryId)
        .single();

      if (inquiry) {
        const customerName = (inquiry as any).customers?.name || 'Customer';
        const originalSubject = (inquiry as any).conversations?.subject || 'Inquiry';

        clarificationDraft = await draftClarificationEmail(
          customerName,
          companyId,
          fields.find(f => f.fieldName === 'product_type')?.value || 'products',
          fields,
          missing,
          originalSubject
        );

        // Save draft to outbound queue
        if (clarificationDraft) {
          const customerEmail = (inquiry as any).customers?.email;
          if (customerEmail) {
            await saveClarificationDraft(
              clarificationDraft,
              inquiryId,
              null,
              customerEmail,
              companyId
            );
          }
        }
      }
    }

    // Step 5: Update inquiry status
    await supabase
      .from('inquiries')
      .update({
        processing_status: clarificationNeeded.needed ? 'needs_clarification' : 'extracted',
        updated_at: new Date().toISOString()
      })
      .eq('id', inquiryId);

    // Step 6: Log the AI run
    await supabase.from('ai_runs').insert({
      company_id: companyId,
      inquiry_id: inquiryId,
      run_type: 'extraction_with_citations',
      model: 'nvidia/llama-3.1-nemotron-70b-instruct',
      input_tokens: 0,
      output_tokens: 0,
      confidence: fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length,
      result: {
        fieldsExtracted: fields.length,
        missingFields: missing.length,
        clarificationNeeded: clarificationNeeded.needed,
        clarificationDrafted: !!clarificationDraft
      }
    });

    return NextResponse.json({
      success: true,
      fields,
      missingFields: missing,
      clarificationNeeded: clarificationNeeded.needed,
      criticalMissing: clarificationNeeded.criticalMissing,
      importantMissing: clarificationNeeded.importantMissing,
      clarificationDraft: clarificationDraft ? {
        subject: clarificationDraft.emailSubject,
        bodyPreview: clarificationDraft.emailBody.substring(0, 200) + '...',
        fieldCount: clarificationDraft.fieldCount,
        criticalCount: clarificationDraft.criticalCount
      } : null,
      citations: fields
        .filter(f => f.value)
        .map(f => ({
          field: f.fieldName,
          value: f.value,
          confidence: Math.round(f.confidence * 100) + '%',
          source: f.sourceType,
          detail: f.sourceDetail,
          status: f.status
        }))
    });

  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json(
      { error: 'Extraction failed', details: String(error) },
      { status: 500 }
    );
  }
}
