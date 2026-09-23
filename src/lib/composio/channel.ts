import { sendEmail, type SendEmailResult } from './gmail';
import { sendTextMessage, getPhoneNumbers } from './whatsapp';

export interface ChannelSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export function normalizePhoneForWhatsApp(raw: string): string {
  if (!raw) return '';
  return raw.replace(/[^\d]/g, '');
}

// Send a message over the given channel. `to` is an email address for email,
// a phone number for whatsapp (digits only; "+/spaces/dashes stripped").
export async function sendViaChannel(
  channel: 'email' | 'whatsapp',
  to: string,
  subject: string | null,
  body: string,
): Promise<ChannelSendResult> {
  if (channel === 'whatsapp') {
    try {
      const numbers = await getPhoneNumbers();
      if (numbers.length === 0) {
        return { success: false, error: 'No WhatsApp phone numbers connected. Connect a WhatsApp Business number first.' };
      }
      const phoneId = numbers[0].id;
      const toNumber = normalizePhoneForWhatsApp(to);
      if (!toNumber) {
        return { success: false, error: 'No phone number provided for WhatsApp message' };
      }
      const res = await sendTextMessage(phoneId, toNumber, body);
      return { success: res.success, messageId: res.messageId, error: res.error };
    } catch (e: any) {
      return { success: false, error: e?.message || 'WhatsApp send failed' };
    }
  }

  return sendEmail(to, subject || 'TradeFlow', body, false);
}