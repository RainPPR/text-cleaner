import { CleanTextArgs, AICleanTextArgs } from '../types';

/**
 * Service to communicate with the text cleaning backend endpoints
 */
export async function formatBasicText(args: CleanTextArgs): Promise<string> {
  const response = await fetch('/api/format-basic', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || '基础清理处理失败');
  }
  return data.result || '';
}

export async function formatAIText(args: AICleanTextArgs): Promise<string> {
  const response = await fetch('/api/clean-text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'AI润色处理失败');
  }
  return data.result || '';
}
