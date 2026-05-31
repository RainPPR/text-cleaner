import { format as autocorrectFormat } from '@huacnlee/autocorrect';
import { CleanTextArgs } from '../types';

/**
 * Runs text formatting completely on the client side.
 * This guarantees offline support, sub-millisecond response times, and
 * 100% compatibility with static deploys like Cloudflare Workers / Pages
 * by avoiding network POST requests to api routes.
 */
export async function formatBasicText(args: CleanTextArgs): Promise<string> {
  const { text, removeFigureNotes, strictNowrap } = args;
  if (typeof text !== 'string') {
    return '';
  }

  let result = text;

  // Handle line merging and paragraph restructuring
  const lines = result.split('\n');
  const blocks: { type: 'code' | 'math' | 'html' | 'table' | 'empty_line' | 'prose'; line: string }[] = [];
  
  let inCodeBlock = false;
  let inMathBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code blocks
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      blocks.push({ type: 'code', line });
      continue;
    }
    if (inCodeBlock) {
      blocks.push({ type: 'code', line });
      continue;
    }

    // Math block formulas ($$)
    if (trimmed.startsWith('$$')) {
      const hasClosing = trimmed.length > 2 && trimmed.endsWith('$$');
      if (!hasClosing) {
        inMathBlock = !inMathBlock;
      }
      blocks.push({ type: 'math', line });
      continue;
    }
    if (inMathBlock) {
      if (trimmed.endsWith('$$')) {
        inMathBlock = false;
      }
      blocks.push({ type: 'math', line });
      continue;
    }

    // HTML block or line
    const hasHtml = /<[a-zA-Z\/][^>]*>/.test(line);
    if (hasHtml) {
      blocks.push({ type: 'html', line });
      continue;
    }

    // Table lines - any line containing a table character '|' (excluding code and math blocks)
    if (line.includes('|')) {
      blocks.push({ type: 'table', line });
      continue;
    }

    // Empty line
    if (trimmed === '') {
      blocks.push({ type: 'empty_line', line: '' });
      continue;
    }

    // Regular prose line
    blocks.push({ type: 'prose', line });
  }

  // 1. Strict line merging inside prose (merging consecutive non-empty prose lines of the same paragraph)
  const mergedBlocks: typeof blocks = [];

  for (let i = 0; i < blocks.length; i++) {
    const current = blocks[i];

    // If current block is not prose, we can't merge it.
    if (current.type !== 'prose') {
      mergedBlocks.push(current);
      continue;
    }

    if (mergedBlocks.length > 0) {
      const prevIndex = mergedBlocks.length - 1;
      const prev = mergedBlocks[prevIndex];

      if (prev.type === 'prose') {
        const currentTrimmed = current.line.trim();
        const prevTrimmed = prev.line.trim();

        const isCurrentListOrHeading = /^\s*([-*+>]|\d+\.|#+)\s+/.test(current.line);
        const isPrevListOrHeading = /^\s*([-*+>]|\d+\.|#+)\s+/.test(prev.line);
        const prevEndsWithTwoSpaces = prev.line.endsWith('  ');

        if (
          strictNowrap &&
          !isCurrentListOrHeading &&
          !isPrevListOrHeading &&
          !prevEndsWithTwoSpaces &&
          currentTrimmed.length > 0 &&
          prevTrimmed.length > 0
        ) {
          // Merge current line into previous line
          const lastCharOfPrev = prevTrimmed.slice(-1);
          const firstCharOfCurrent = currentTrimmed.charAt(0);
          
          const isChinese = (char: string) => /[\u4e00-\u9fa5]/.test(char);
          const needsSpace = !(isChinese(lastCharOfPrev) && isChinese(firstCharOfCurrent));

          mergedBlocks[prevIndex] = {
            type: 'prose',
            line: prev.line + (needsSpace ? ' ' : '') + current.line.trim(),
          };
          continue;
        }
      }
    }

    mergedBlocks.push(current);
  }

  // 2. Collapse consecutive empty lines: >=3 newlines are compressed down to 2 newlines (1 empty line).
  // We keep at most 1 empty_line block in any run of consecutive empty_lines.
  const finalBlocks: typeof mergedBlocks = [];
  let consecutiveEmptyCount = 0;

  for (let i = 0; i < mergedBlocks.length; i++) {
    const block = mergedBlocks[i];

    if (block.type === 'empty_line') {
      consecutiveEmptyCount++;
    } else {
      consecutiveEmptyCount = 0;
    }

    if (block.type === 'empty_line' && consecutiveEmptyCount >= 2) {
      // Discard this extra empty line block to compress >= 3 newlines down to 2 newlines
      continue;
    }

    finalBlocks.push(block);
  }

  // 3. Apply CJK / English auto-spacing to prose blocks only
  for (let i = 0; i < finalBlocks.length; i++) {
    const block = finalBlocks[i];
    if (block.type === 'prose') {
      let formattedLine = block.line;

      // Use the official autocorrect WASM spacing
      formattedLine = autocorrectFormat(formattedLine);

      // CJK Clean spacing between double fullwidth characters
      const FULLWIDTH = '[\\u4E00-\\u9FFF\\u3400-\\u4DBF\\u3000-\\u303F\\u3040-\\u309F\\u30A0-\\u30FF\\uFF00-\\uFFEF]';
      const spaceRegex = new RegExp(`(${FULLWIDTH})[ \\t\\u3000]+(?=${FULLWIDTH})`, 'g');
      formattedLine = formattedLine.replace(spaceRegex, '$1');
      formattedLine = formattedLine.replace(spaceRegex, '$1');

      block.line = formattedLine;
    }
  }

  // Re-join back the blocks to reconstruct the text
  result = finalBlocks.map((b) => b.line).join('\n');

  if (removeFigureNotes) {
    result = result.replace(/[（\(]\s*图\s*\d+(?:-\d+)?\s*[）\)]/g, '');
  }

  return result;
}

