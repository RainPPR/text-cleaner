import { CleanTextArgs } from '../types';

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
    throw new Error(data.error || '文本清理处理失败');
  }
  return data.result || '';
}
