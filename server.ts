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
        const blocks: { type: 'code' | 'math' | 'html' | 'prose'; line: string }[] = [];
        
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

          // Regular prose line (can be text or empty)
          blocks.push({ type: 'prose', line });
        }

        // 1. Compress consecutive empty prose lines (2 or more empty lines -> 1 empty line)
        const compressedBlocks: typeof blocks = [];
        let consecutiveEmptyCount = 0;

        for (let i = 0; i < blocks.length; i++) {
          const block = blocks[i];
          if (block.type === 'prose' && block.line.trim() === '') {
            consecutiveEmptyCount++;
            if (consecutiveEmptyCount === 1) {
              compressedBlocks.push(block);
            }
          } else {
            consecutiveEmptyCount = 0;
            compressedBlocks.push(block);
          }
        }

        // 2. Strict line merging inside prose
        const finalBlocks: typeof compressedBlocks = [];

        for (let i = 0; i < compressedBlocks.length; i++) {
          const current = compressedBlocks[i];

          // If current block is not prose, or is an empty prose line, we can't merge it.
          if (current.type !== 'prose' || current.line.trim() === '') {
            finalBlocks.push(current);
            continue;
          }

          if (finalBlocks.length > 0) {
            const prevIndex = finalBlocks.length - 1;
            const prev = finalBlocks[prevIndex];

            if (prev.type === 'prose' && prev.line.trim() !== '') {
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
                // Determine whether to add a space when joining.
                const lastCharOfPrev = prevTrimmed.slice(-1);
                const firstCharOfCurrent = currentTrimmed.charAt(0);
                
                const isChinese = (char: string) => /[\u4e00-\u9fa5]/.test(char);
                const needsSpace = !(isChinese(lastCharOfPrev) && isChinese(firstCharOfCurrent));

                finalBlocks[prevIndex] = {
                  type: 'prose',
                  line: prev.line + (needsSpace ? ' ' : '') + current.line.trim(),
                };
                continue;
              }
            }
          }

          finalBlocks.push(current);
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
