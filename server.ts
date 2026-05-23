import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { format as autocorrectFormat } from 'autocorrect-node';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Route for Text Processing
  app.post('/api/format-basic', async (req, res) => {
    try {
      const { text, removeFigureNotes, strictNowrap } = req.body;
      if (typeof text !== 'string') {
        return res.status(400).json({ error: 'Missing text' });
      }

      let result = text;

      // Handle the strict line merge (Nowrap) and Multi-newline compression
      if (strictNowrap) {
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

        // 2. Collapse consecutive empty lines: keep at most a single empty_line block in any run of consecutive empty_lines.
        const finalBlocks: typeof mergedBlocks = [];

        for (let i = 0; i < mergedBlocks.length; i++) {
          const block = mergedBlocks[i];

          if (block.type === 'empty_line') {
            // If the last block in finalBlocks is already an empty line, discard this duplicate empty line
            if (finalBlocks.length > 0 && finalBlocks[finalBlocks.length - 1].type === 'empty_line') {
              continue;
            }
          }

          finalBlocks.push(block);
        }

        result = finalBlocks.map((b) => b.line).join('\n');
      }

      // Autocorrect format
      result = autocorrectFormat(result);

      // CJK Clean spacing between double fullwidth characters
      const FULLWIDTH = '[\\u4E00-\\u9FFF\\u3400-\\u4DBF\\u3000-\\u303F\\u3040-\\u309F\\u30A0-\\u30FF\\uFF00-\\uFFEF]';
      const spaceRegex = new RegExp(`(${FULLWIDTH})[ \\t\\u3000]+(?=${FULLWIDTH})`, 'g');
      result = result.replace(spaceRegex, '$1');
      result = result.replace(spaceRegex, '$1');

      if (removeFigureNotes) {
        result = result.replace(/[（\(]\s*图\s*\d+(?:-\d+)?\s*[）\)]/g, '');
      }

      res.json({ result });
    } catch (error: any) {
      console.error('Text formatting error:', error);
      res.status(500).json({ error: error.message || 'Error occurred while text formatting' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
