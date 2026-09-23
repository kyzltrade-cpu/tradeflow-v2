import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/analytics - Fetch analytics data
export async function GET() {
  try {
    const companyId = 'de16b018-a635-4b45-a5ee-101dea1d66a1';

    // Get counts
    const [inquiriesRes, draftsRes, quotesRes, customersRes] = await Promise.all([
      supabase.from('inquiries').select('id, processing_status, created_at').eq('company_id', companyId),
      supabase.from('outbound_messages').select('id, draft_status, channel, created_at, ai_generated').eq('company_id', companyId),
      supabase.from('quotes').select('id, status, customer_price, currency, created_at').eq('company_id', companyId),
      supabase.from('customers').select('id, created_at').eq('company_id', companyId),
    ]);

    const inquiries = inquiriesRes.data || [];
    const drafts = draftsRes.data || [];
    const quotes = quotesRes.data || [];
    const customers = customersRes.data || [];

    // Calculate metrics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentInquiries = inquiries.filter(i => new Date(i.created_at) >= thirtyDaysAgo);
    const recentDrafts = drafts.filter(d => new Date(d.created_at) >= thirtyDaysAgo);
    const sentDrafts = recentDrafts.filter(d => d.draft_status === 'sent');
    const pendingDrafts = recentDrafts.filter(d => d.draft_status === 'pending_approval');
    const aiDrafts = recentDrafts.filter(d => d.ai_generated);

    // Channel breakdown
    const emailDrafts = recentDrafts.filter(d => d.channel === 'email');
    const whatsappDrafts = recentDrafts.filter(d => d.channel === 'whatsapp');

    return NextResponse.json({
      metrics: {
        totalInquiries: recentInquiries.length,
        totalDrafts: recentDrafts.length,
        sentDrafts: sentDrafts.length,
        pendingDrafts: pendingDrafts.length,
        aiDrafts: aiDrafts.length,
        totalQuotes: quotes.length,
        totalCustomers: customers.length,
      },
      channels: {
        email: emailDrafts.length,
        whatsapp: whatsappDrafts.length,
      },
      recentActivity: recentDrafts.slice(0, 10).map(d => ({
        id: d.id,
        channel: d.channel,
        status: d.draft_status,
        aiGenerated: d.ai_generated,
        createdAt: d.created_at,
      })),
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
