import { getComposio, COMPOSIO_USER_ID } from './client';

// ─── Types ───────────────────────────────────────────────────

export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  fromEmail: string;
  to: string;
  date: string;
  body: string;
  snippet: string;
  isUnread: boolean;
  labels: string[];
  hasAttachments: boolean;
}

// ─── Fetch recent emails ─────────────────────────────────────

export async function fetchRecentEmails(maxResults: number = 20): Promise<GmailMessage[]> {
  const composio = getComposio();
  const result = await composio.tools.execute('GMAIL_FETCH_EMAILS', {
    arguments: {
      max_results: maxResults,
      include_payload: true,
      verbose: true,
    },
    userId: COMPOSIO_USER_ID,
  });

  const data = result.data as any;
  if (!data?.messages) return [];

  return data.messages.map((msg: any) => ({
    id: msg.messageId || msg.id || '',
    threadId: msg.threadId || '',
    subject: msg.subject || '(no subject)',
    from: extractName(msg.sender || msg.from || ''),
    fromEmail: extractEmail(msg.sender || msg.from || ''),
    to: msg.to || '',
    date: msg.messageTimestamp || msg.internalDate || new Date().toISOString(),
    body: msg.body || msg.snippet || '',
    snippet: msg.snippet || '',
    isUnread: msg.isUnread || false,
    labels: msg.labelIds || [],
    hasAttachments: msg.hasAttachments || false,
  }));
}

// ─── Fetch a specific email ──────────────────────────────────

export async function fetchEmail(messageId: string): Promise<GmailMessage | null> {
  const composio = getComposio();
  const result = await composio.tools.execute('GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID', {
    arguments: {
      message_id: messageId,
      format: 'full',
    },
    userId: COMPOSIO_USER_ID,
  });

  const msg = result.data as any;
  if (!msg) return null;

  return {
    id: msg.messageId || msg.id || '',
    threadId: msg.threadId || '',
    subject: msg.subject || '(no subject)',
    from: extractName(msg.sender || msg.from || ''),
    fromEmail: extractEmail(msg.sender || msg.from || ''),
    to: msg.to || '',
    date: msg.messageTimestamp || msg.internalDate || new Date().toISOString(),
    body: msg.body || msg.snippet || '',
    snippet: msg.snippet || '',
    isUnread: msg.isUnread || false,
    labels: msg.labelIds || [],
    hasAttachments: msg.hasAttachments || false,
  };
}

// ─── Get profile / historyId ─────────────────────────────────

export async function getHistoryId(): Promise<string | null> {
  const composio = getComposio();
  const result = await composio.tools.execute('GMAIL_GET_PROFILE', {
    arguments: {},
    userId: COMPOSIO_USER_ID,
  });

  const data = result.data as any;
  return data?.historyId || null;
}

// ─── Mark as read ────────────────────────────────────────────

export async function markAsRead(messageIds: string[]): Promise<void> {
  const composio = getComposio();
  await composio.tools.execute('GMAIL_BATCH_MODIFY_MESSAGES', {
    arguments: {
      message_ids: messageIds,
      add_label_ids: ['READ'],
      remove_label_ids: ['UNREAD'],
    },
    userId: COMPOSIO_USER_ID,
  });
}

// ─── Send an email ───────────────────────────────────────────

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  threadId?: string;
  error?: string;
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  isHtml: boolean = false,
): Promise<SendEmailResult> {
  try {
    const composio = getComposio();
    const result = await composio.tools.execute('GMAIL_SEND_EMAIL', {
      arguments: {
        recipient_email: to,
        subject,
        body,
        is_html: isHtml,
      },
      userId: COMPOSIO_USER_ID,
    });

    const data = result.data as any;
    const response = data?.response_data || data || {};
    return {
      success: true,
      messageId: response.id || response.messageId || '',
      threadId: response.threadId || '',
    };
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    console.error('Gmail send failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function extractName(from: string): string {
  const match = from.match(/^"?([^"<]+)"?\s*</);
  return match ? match[1].trim() : from.split('@')[0];
}

function extractEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1] : from;
}
