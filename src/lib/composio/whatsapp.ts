import { getComposio, COMPOSIO_USER_ID } from './client';

// ─── Types ───────────────────────────────────────────────────

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ─── Get available phone numbers ─────────────────────────────

export async function getPhoneNumbers(): Promise<{ id: string; displayPhoneNumber: string; verifiedName: string }[]> {
  const composio = getComposio();
  const result = await composio.tools.execute('WHATSAPP_GET_PHONE_NUMBERS', {
    arguments: {},
    userId: COMPOSIO_USER_ID,
  });

  const data = result.data as any;
  return data?.data || [];
}

// ─── Send a text message ─────────────────────────────────────

export async function sendTextMessage(
  phoneNumberId: string,
  toNumber: string,
  text: string,
  replyToMessageId?: string,
): Promise<WhatsAppSendResult> {
  try {
    const composio = getComposio();
    const result = await composio.tools.execute('WHATSAPP_SEND_MESSAGE', {
      arguments: {
        phone_number_id: phoneNumberId,
        to_number: toNumber,
        text,
        ...(replyToMessageId ? { message_id: replyToMessageId } : {}),
      },
      userId: COMPOSIO_USER_ID,
    });

    const data = result.data as any;
    const messageId = data?.data?.messages?.[0]?.id;
    return { success: true, messageId };
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    console.error('WhatsApp send failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
