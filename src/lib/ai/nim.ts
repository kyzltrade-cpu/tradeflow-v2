// Shared NVIDIA NIM helper. All AI calls route through here so the model,
// auth, and error handling stay consistent across workflows.

const NIM_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const MODEL = 'nvidia/llama-3.1-nemotron-70b-instruct';

export interface NimMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function callNim(
  messages: NimMessage[],
  opts: { temperature?: number; json?: boolean } = {}
): Promise<string> {
  const apiKey = process.env.NIM_API_KEY;
  if (!apiKey) {
    throw new Error('NIM_API_KEY is not configured. AI features are unavailable.');
  }

  const response = await fetch(NIM_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: opts.temperature ?? 0,
      ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`NIM API error: ${response.status}`);
  }

  const data = await response.json();
  return (data.choices?.[0]?.message?.content as string) || '';
}

export async function callNimJson<T>(
  messages: NimMessage[],
  opts: { temperature?: number } = {}
): Promise<T> {
  const content = await callNim(messages, { ...opts, json: true });
  try {
    return JSON.parse(content) as T;
  } catch {
    throw new Error('NIM returned invalid JSON');
  }
}