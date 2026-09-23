import { Composio } from '@composio/core';

export const COMPOSIO_USER_ID = process.env.COMPOSIO_USER_ID || 'tradeflow-hk';

let _composio: Composio | null = null;

export function getComposio(): Composio {
  if (_composio) return _composio;

  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) {
    throw new Error('COMPOSIO_API_KEY is not set. Add it to your environment.');
  }

  _composio = new Composio({ apiKey });
  return _composio;
}