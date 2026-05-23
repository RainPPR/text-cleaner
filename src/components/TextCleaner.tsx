import React, { useState, useEffect } from 'react';
import { ArrowRight, Wand2, Settings, Loader2, CheckCircle2, Copy, Trash2, Check, FileDiff, Eye, FileText } from 'lucide-react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';

export default function TextCleaner() {
  const [originalText, setOriginalText] = useState('');
  const [processedText, setProcessedText] = useState('');
  
  const [useAIMode, setUseAIMode] = useState(false);
  const [removeFigureNotes, setRemoveFigureNotes] = useState(true);
  const [strictNowrap, setStrictNowrap] = useState(false);
  const [isDiffMode, setIsDiffMode] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  const [round1Mode, setRound1Mode] = useState<'pangu' | 'autocorrect' | 'none'>('pangu');
  const [round2Mode, setRound2Mode] = useState<'pangu' | 'autocorrect' | 'none'>('autocorrect');

  const [status, setStatus] = useState<'idle' | 'cleaning' | 'ai-thinking' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedArea, setCopiedArea] = useState<'original' | 'processed' | 'diff'>('original');

  const copyToClipboard = async (text: string, area: 'original' | 'processed' | 'diff') => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedArea(area);
      setTimeout(() => setCopiedArea('original'), 2000);
    } catch (err) {}
  };

  const handleClear = () => {
    setOriginalText('');
    setProcessedText('');
    setStatus('idle');
    setErrorMessage('');
    setIsDiffMode(false);
    setIsPreviewMode(false);
  };

  const highlightSyntax = (str: string) => {
    if (!str) return undefined;
    try {
      const language = Prism.languages.markdown || Prism.languages.markup;
      if (!language) return <span>{str}</span>;
      
      const html = Prism.highlight(str, language, 'markdown');
      return (
        <span
          style={{ display: 'inline', whiteSpace: 'pre-wrap' }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } catch (err) {
      return <span>{str}</span>;
    }
  };

  const handleClean = async () => {
    if (!originalText.trim()) return;

    setErrorMessage('');
    setStatus('cleaning');
    
    try {
      // 基础清理与格式化API调用
      const basicRes = await fetch('/api/format-basic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: originalText,
          removeFigureNotes,
          round1: round1Mode,
          round2: round2Mode,
          strictNowrap,
        }),
      });

      const basicData = await basicRes.json();
      if (!basicRes.ok) {
        throw new Error(basicData.error || '基础清理处理失败');
      }

      let finalResult = basicData.result;
      
      if (!useAIMode) {
        setStatus('success');
        setProcessedText(finalResult);
        return;
      }

      // AI模式
      setStatus('ai-thinking');
      const aiRes = await fetch('/api/clean-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalText,
          basicProcessedText: finalResult,
          removeFigureNotes,
        }),
      });

      const aiData = await aiRes.json();

      if (!aiRes.ok) {
        throw new Error(aiData.error || 'AI润色失败');
      }

      setProcessedText(aiData.result);
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || '网络错误，请稍后再试');
    }
  };

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => setStatus('idle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return (
    <div className="w-full max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col p-4 md:p-6 space-y-4">
      {/* 头部标题区域 */}
      <header className="flex-shrink-0 flex items-center justify-between border-b pb-4 border-gray-200">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-indigo-600" />
            文字清洗助手
          </h1>
          <p className="text-sm text-gray-500 mt-1">自动清理文本排版、异常空格与错误符号</p>
        </div>
      </header>

      {/* 主工作区 */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* 左侧：输入区 */}
        <div className="flex-1 flex flex-col min-h-0 group bg-gray-50 rounded-xl overflow-hidden border border-gray-200 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 transition-all">
          <div className="p-3 bg-gray-100/50 border-b border-gray-200 flex justify-between items-center text-sm font-medium text-gray-600">
            <div className="flex items-center gap-3">
              <span>{isDiffMode ? '差异对比' : '原文输入'}</span>
              {status === 'success' && (
                <button
                  onClick={() => setIsDiffMode(!isDiffMode)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${isDiffMode ? 'bg-indigo-100 text-indigo-700' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <FileDiff className="w-3 h-3" />
                  <span className="text-[11px] font-semibold tracking-wide">Diff</span>
                </button>
              )}
            </div>
            <span className="text-xs text-gray-400 font-normal">
              {isDiffMode ? '' : `${originalText.length} 字符`}
            </span>
          </div>
          
          {isDiffMode && status === 'success' ? (
            <div className="flex-1 w-full bg-[#fdfdfd] overflow-auto text-sm font-sans">
              <ReactDiffViewer
                oldValue={originalText}
                newValue={processedText}
                splitView={false}
                hideLineNumbers={false}
                useDarkTheme={false}
                compareMethod={DiffMethod.CHARS}
                renderContent={highlightSyntax}
                styles={{
                  variables: {
                    light: {
                      diffViewerBackground: '#fdfdfd',
                    }
                  }
                }}
              />
            </div>
          ) : (
            <textarea
              className="flex-1 w-full bg-transparent p-4 resize-none outline-none text-gray-800 leading-relaxed"
              placeholder="请将需要清洗的文字粘贴到这里..."
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
            />
          )}

          <div className="p-2 border-t border-gray-200 bg-gray-100/50 flex justify-end items-center">
            {isDiffMode ? (
              <span className="text-xs text-gray-400 px-3 py-1.5">Diff 模式下无法编辑</span>
            ) : (
              <button
                 onClick={() => copyToClipboard(originalText, 'original')}
                 disabled={!originalText}
                 className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
                 title="复制原文"
              >
                 {copiedArea === 'original' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                 <span>{copiedArea === 'original' ? '已复制' : '复制原文'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 中间操作按钮 (桌面端) */}
        <div className="hidden lg:flex items-center justify-center p-2">
          <button
            onClick={handleClean}
            disabled={status === 'cleaning' || status === 'ai-thinking' || !originalText.trim()}
            className="group relative h-12 w-12 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            title="开始清洗"
          >
            {status === 'cleaning' || status === 'ai-thinking' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            )}
          </button>
        </div>

        {/* 右侧：输出区 */}
        <div className="flex-1 flex flex-col min-h-0 group bg-white rounded-xl overflow-hidden border border-gray-200">
          <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center text-sm font-medium text-gray-600">
            <div className="flex items-center gap-3">
              <span>{isDiffMode ? '原文内容' : '清洗结果'}</span>
              {status === 'success' && !isDiffMode && (
                <button
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${isPreviewMode ? 'bg-indigo-100 text-indigo-700' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {isPreviewMode ? <FileText className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span className="text-[11px] font-semibold tracking-wide">预览</span>
                </button>
              )}
            </div>
            <span className="text-xs text-gray-400 font-normal">{isDiffMode ? originalText.length : processedText.length} 字符</span>
          </div>

          {isPreviewMode && !isDiffMode ? (
            <div className="flex-1 w-full bg-[#fcfcfc] p-4 overflow-auto">
              <div className="prose prose-sm prose-indigo max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus as any}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {processedText}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <textarea
              className="flex-1 w-full bg-transparent p-4 resize-none outline-none text-gray-800 leading-relaxed selection:bg-indigo-100"
              placeholder={isDiffMode ? "在此查看原文..." : "清洗后的文字将显示在这里..."}
              value={isDiffMode ? originalText : processedText}
              readOnly
            />
          )}

          <div className="p-2 border-t border-gray-200 bg-gray-50 flex justify-end items-center">
            <button
               onClick={() => copyToClipboard(isDiffMode ? originalText : processedText, isDiffMode ? 'original' : 'processed')}
               disabled={isDiffMode ? !originalText : !processedText}
               className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
               title={isDiffMode ? "复制原文" : "复制结果"}
            >
               {copiedArea === (isDiffMode ? 'original' : 'processed') ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
               <span>{copiedArea === (isDiffMode ? 'original' : 'processed') ? '已复制' : (isDiffMode ? "复制原文" : "复制结果")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 选项 & 状态栏 */}
      <div className="flex-shrink-0 bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        
        {/* 选项区 */}
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2 pr-4 border-r border-gray-200">
            <Settings className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">处理选项</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">首轮中英文加空格:</span>
            <select
              value={round1Mode}
              onChange={(e) => setRound1Mode(e.target.value as any)}
              className="text-xs border border-gray-200 rounded outline-none bg-gray-50 px-2 py-1 text-gray-700 focus:border-indigo-400 cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <option value="none">无</option>
              <option value="pangu">pangu.js</option>
              <option value="autocorrect">autocorrect</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">末轮中英文兜底:</span>
            <select
              value={round2Mode}
              onChange={(e) => setRound2Mode(e.target.value as any)}
              className="text-xs border border-gray-200 rounded outline-none bg-gray-50 px-2 py-1 text-gray-700 focus:border-indigo-400 cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <option value="none">无</option>
              <option value="pangu">pangu.js</option>
              <option value="autocorrect">autocorrect</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer group ml-2">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                className="peer sr-only" 
                checked={strictNowrap} 
                onChange={(e) => setStrictNowrap(e.target.checked)}
              />
              <div className="w-8 h-4 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
            </div>
            <span className="text-xs text-gray-600 group-hover:text-gray-900 select-none transition-colors">严格换行 (跳过HTML)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group ml-2">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                className="peer sr-only" 
                checked={removeFigureNotes} 
                onChange={(e) => setRemoveFigureNotes(e.target.checked)}
              />
              <div className="w-8 h-4 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
            </div>
            <span className="text-xs text-gray-600 group-hover:text-gray-900 select-none transition-colors">移除图表注记</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group ml-2">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                className="peer sr-only"
                checked={useAIMode}
                onChange={(e) => setUseAIMode(e.target.checked)}
              />
              <div className="w-8 h-4 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600"></div>
            </div>
            <span className="text-xs text-gray-600 group-hover:text-gray-900 select-none transition-colors">
              <span className="flex items-center gap-1.5">
                AI 润色 <span className="bg-purple-100 text-purple-700 text-[9px] font-bold px-1 py-0.5 rounded ml-0.5">Flash Lite</span>
              </span>
            </span>
          </label>
        </div>

        {/* 状态区与清空按钮 */}
        <div className="flex items-center gap-4 text-sm w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2 truncate max-w-[200px]">
            {status === 'idle' && (
              <span className="text-gray-400 text-xs">准备就绪</span>
            )}
            {status === 'cleaning' && (
              <span className="text-indigo-600 flex items-center gap-1.5 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> 基础清洗中...
              </span>
            )}
            {status === 'ai-thinking' && (
              <span className="text-purple-600 flex items-center gap-1.5 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> AI 处理中...
              </span>
            )}
            {status === 'success' && (
              <span className="text-emerald-600 flex items-center gap-1 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> 清洗完成
              </span>
            )}
            {status === 'error' && (
              <span className="text-red-500 truncate text-xs" title={errorMessage}>
                {errorMessage || '处理出错'}
              </span>
            )}
          </div>

          <button
             onClick={handleClear}
             className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors shrink-0"
          >
             <Trash2 className="w-3.5 h-3.5" /> 清空文本
          </button>
        </div>
      </div>
    </div>
  );
}
