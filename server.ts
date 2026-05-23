import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import pangu from 'pangu';
import { format as autocorrectFormat } from 'autocorrect-node';

// AI initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Route for Basic Processing (Pangu/Autocorrect + Fullwidth Spacing removal)
  app.post('/api/format-basic', async (req, res) => {
    try {
      const { text, removeFigureNotes, round1, round2, strictNowrap } = req.body;
      if (typeof text !== 'string') {
        return res.status(400).json({ error: 'Missing text' });
      }

      let result = text;

      // Handle the strict line merge (Nowrap)
      if (strictNowrap) {
        const lines = result.split('\n');
        const newLines: string[] = [];
        let inCodeBlock = false;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.trim().startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            newLines.push(line);
            continue;
          }

          if (inCodeBlock) {
            newLines.push(line);
            continue;
          }

          const trimmedLine = line.trim();
          const isLineListOrHeading = /^\s*([-*+>]|\d+\.|#+)\s+/.test(line);
          const hasHtml = /<[a-zA-Z\/][^>]*>/.test(line);

          if (
            newLines.length > 0 &&
            trimmedLine.length > 5 &&
            !isLineListOrHeading &&
            !hasHtml
          ) {
            const prevLine = newLines[newLines.length - 1];
            const trimmedPrev = prevLine.trim();
            const isPrevListOrHeading = /^\s*([-*+>]|\d+\.|#+)\s+/.test(prevLine);
            const prevHasHtml = /<[a-zA-Z\/][^>]*>/.test(prevLine);
            
            if (trimmedPrev.length > 5 && !isPrevListOrHeading && !prevLine.endsWith('  ') && !prevHasHtml) {
              // Merge with previous line (strip newline), add a space if needed, or just append
              // Usually for Chinese we might not need a space, but Autocorrect will handle it later
              newLines[newLines.length - 1] = prevLine + line;
              continue;
            }
          }
          
          newLines.push(line);
        }
        result = newLines.join('\n');
      }

      // Round 1
      if (round1 === 'pangu') {
        result = pangu.spacingText(result);
      } else if (round1 === 'autocorrect') {
        result = autocorrectFormat(result);
      }

      // Basic cleanup (remove spaces between fullwidth characters)
      // Including CJK ideographs, extension A, CJK punctuation, Hiragana, Katakana, Fullwidth characters
      const FULLWIDTH = '[\\u4E00-\\u9FFF\\u3400-\\u4DBF\\u3000-\\u303F\\u3040-\\u309F\\u30A0-\\u30FF\\uFF00-\\uFFEF]';
      const spaceRegex = new RegExp(`(${FULLWIDTH})[ \\t\\u3000]+(?=${FULLWIDTH})`, 'g');
      result = result.replace(spaceRegex, '$1');
      result = result.replace(spaceRegex, '$1');

      if (removeFigureNotes) {
        result = result.replace(/[（\(]\s*图\s*\d+(?:-\d+)?\s*[）\)]/g, '');
      }

      // Round 2
      if (round2 === 'pangu') {
        result = pangu.spacingText(result);
      } else if (round2 === 'autocorrect') {
        result = autocorrectFormat(result);
      }

      res.json({ result });
    } catch (error: any) {
      console.error('Basic formatting error:', error);
      res.status(500).json({ error: error.message || 'Error occurred while basic formatting' });
    }
  });

  // API Route for AI Processing
  app.post('/api/clean-text', async (req, res) => {
    try {
      const { originalText, basicProcessedText, removeFigureNotes } = req.body;

      if (!originalText) {
        return res.status(400).json({ error: 'Missing originalText' });
      }

      let systemInstruction = `你是一个专业的文字清理润色助手。你的任务是对输入的文本进行清理，尤其是修复复杂的排版、数学乱码、由于OCR或者转换导致的多余空格、错乱的换行等问题。`;
      if (removeFigureNotes) {
        systemInstruction += ` 并且还需要清理文中的图表注记，例如“（图1）”、“(图 3-1)”等内容。`;
      }
      
      const prompt = `这里是原文：\n\n${originalText}\n\n这里是经过基础模式清理（删除了所有中文间的空格并处理了注记）版本的文字，供你参考：\n\n${basicProcessedText}\n\n请你基于这些信息，仔细修复文本中更复杂的排版、数学公式乱码和分割问题，并输出最终清理好的纯文本。请只输出处理后的文本，不要输出任何额外的解释或对话。`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      const processedText = response.text || '';
      res.json({ result: processedText });
    } catch (error: any) {
      console.error('Error calling Gemini:', error);
      res.status(500).json({ error: error.message || 'Error occurred while processing text' });
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
