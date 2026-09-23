import { NextRequest, NextResponse } from 'next/server';
import { sendTextMessage, getPhoneNumbers } from '@/lib/composio/whatsapp';

// POST /api/whatsapp/send - Send a WhatsApp message
export async function POST(request: NextRequest) {
  try {
    const { to, text, phoneNumberId, replyToMessageId } = await request.json();

    if (!to || !text) {
      return NextResponse.json({ error: 'to and text are required' }, { status: 400 });
    }

    // Get phone number ID if not provided
    let phoneId = phoneNumberId;
    if (!phoneId) {
      const numbers = await getPhoneNumbers();
      if (numbers.length === 0) {
        return NextResponse.json({ error: 'No WhatsApp phone numbers configured' }, { status: 400 });
      }
      phoneId = numbers[0].id;
    }

    const result = await sendTextMessage(phoneId, to, text, replyToMessageId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error: any) {
    console.error('WhatsApp send error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send WhatsApp message' },
      { status: 500 }
    );
  }
}

// GET /api/whatsapp/send - Get available phone numbers
export async function GET() {
  try {
    const numbers = await getPhoneNumbers();
    return NextResponse.json({ numbers });
  } catch (error: any) {
    console.error('WhatsApp phone numbers error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get phone numbers' },
      { status: 500 }
    );
  }
}
