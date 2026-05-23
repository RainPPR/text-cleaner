import React, { useState, useEffect } from 'react';
import { ArrowRight, Wand2, Settings, Loader2, CheckCircle2, Copy, Trash2, Check, FileDiff, Eye, FileText, CheckSquare } from 'lucide-react';
import { diffChars, diffLines } from 'diff';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

// Custom Inline Diff Viewer component for character-level changes
function InlineDiff({ oldValue, newValue }: { oldValue: string; newValue: string }) {
  const diffs = diffChars(oldValue, newValue);

  return (
    <div id="inline-diff-content" className="p-4 overflow-auto font-mono text-sm leading-relaxed text-gray-800 whitespace-pre-wrap break-all h-full bg-[#fdfdfd] border border-gray-100 rounded-lg select-text selection:bg-indigo-100">
      {diffs.map((part, index) => {
        if (part.added) {
          return (
            <span
              key={index}
              className="bg-emerald-100 text-emerald-950 border-b-2 border-emerald-400 px-0.5 py-[1px] rounded-sm font-semibold mx-[1px]"
              title="新增内容"
            >
              {part.value}
            </span>
          );
        }
        if (part.removed) {
          return (
            <span
              key={index}
              className="bg-red-100 text-red-900 line-through decoration-red-400 decoration-2 px-0.5 py-[1px] rounded-sm opacity-80 mx-[1px]"
              title="删除内容"
            >
              {part.value}
            </span>
          );
        }
        return <span key={index}>{part.value}</span>;
      })}
    </div>
  );
}

// Custom Line Diff Viewer component
function UnifiedLineDiff({ oldValue, newValue }: { oldValue: string; newValue: string }) {
  const parts = diffLines(oldValue, newValue);
  
  let oldLineNo = 1;
  let newLineNo = 1;
  const renderedLines: React.ReactNode[] = [];
  
  parts.forEach((part, partIndex) => {
    const lines = part.value.split('\n');
    if (lines[lines.length - 1] === '') {
      lines.pop();
    }
    
    lines.forEach((line, lineIndex) => {
      const key = `${partIndex}-${lineIndex}`;
      
      if (part.added) {
        renderedLines.push(
          <div key={key} className="flex hover:bg-emerald-50/80 bg-emerald-50/40 border-l-4 border-emerald-500 py-0.5 text-xs font-mono">
            <div className="w-10 text-right pr-2 text-gray-400 select-none border-r border-gray-150 shrink-0"></div>
            <div className="w-10 text-right pr-2 text-emerald-600 select-none border-r border-gray-150 shrink-0">{newLineNo++}</div>
            <div className="w-6 text-center text-emerald-600 font-bold select-none shrink-0">+</div>
            <div className="flex-1 pl-2 text-emerald-900 whitespace-pre-wrap break-all">{line}</div>
          </div>
        );
      } else if (part.removed) {
        renderedLines.push(
          <div key={key} className="flex hover:bg-red-50/80 bg-red-50/40 border-l-4 border-red-500 py-0.5 text-xs font-mono">
            <div className="w-10 text-right pr-2 text-red-600 select-none border-r border-gray-150 shrink-0">{oldLineNo++}</div>
            <div className="w-10 text-right pr-2 text-gray-400 select-none border-r border-gray-150 shrink-0"></div>
            <div className="w-6 text-center text-red-600 font-bold select-none shrink-0">-</div>
            <div className="flex-1 pl-2 text-red-900 line-through decoration-red-300 decoration-1 whitespace-pre-wrap break-all opacity-75">{line}</div>
          </div>
        );
      } else {
        renderedLines.push(
          <div key={key} className="flex hover:bg-gray-100/60 py-0.5 text-xs font-mono">
            <div className="w-10 text-right pr-2 text-gray-400 select-none border-r border-gray-150 shrink-0">{oldLineNo++}</div>
            <div className="w-10 text-right pr-2 text-gray-400 select-none border-r border-gray-150 shrink-0">{newLineNo++}</div>
            <div className="w-6 text-center text-gray-300 select-none shrink-0"> </div>
            <div className="flex-1 pl-2 text-gray-700 whitespace-pre-wrap break-all">{line}</div>
          </div>
        );
      }
    });
  });

  return (
    <div className="overflow-auto h-full bg-[#fdfdfd] border border-gray-100 rounded-lg flex flex-col min-h-0 select-text">
      <div className="flex-1 overflow-auto py-2">
        {renderedLines.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">文本无任何明显差异</div>
        ) : (
          renderedLines
        )}
      </div>
    </div>
  );
}

// Master Custom Diff Viewer container component
function CustomDiffViewer({ oldValue, newValue }: { oldValue: string; newValue: string }) {
  const [diffViewMode, setDiffViewMode] = useState<'inline' | 'unified'>('inline');

  return (
    <div id="custom-diff-viewer-panel" className="flex flex-col h-full min-h-0 bg-white rounded-lg">
      {/* Mini diff toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2 shrink-0 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-500">对比方式:</span>
          <div className="inline-flex rounded-md shadow-xs bg-gray-100 p-0.5">
            <button
              onClick={() => setDiffViewMode('inline')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-sm transition-all focus:outline-none ${diffViewMode === 'inline' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-500 hover:text-gray-950'}`}
            >
              全文对比 (Inline)
            </button>
            <button
              onClick={() => setDiffViewMode('unified')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-sm transition-all focus:outline-none ${diffViewMode === 'unified' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-500 hover:text-gray-950'}`}
            >
              分行对照 (Unified)
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 select-none text-[11px] font-medium text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-red-100 border border-red-300 rounded inline-block"></span>
            <span>原文已删</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-emerald-100 border border-emerald-300 rounded inline-block"></span>
            <span>清洗已加</span>
          </span>
        </div>
      </div>
      
      {/* Content pane */}
      <div className="flex-1 min-h-0 mt-2">
        {diffViewMode === 'inline' ? (
          <InlineDiff oldValue={oldValue} newValue={newValue} />
        ) : (
          <UnifiedLineDiff oldValue={oldValue} newValue={newValue} />
        )}
      </div>
    </div>
  );
}

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
  const [copiedArea, setCopiedArea] = useState<string | null>(null);

  const copyToClipboard = async (text: string, area: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedArea(area);
      setTimeout(() => setCopiedArea(null), 2000);
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
        setIsDiffMode(true); // Automatically switch to diff mode to show the beautiful comparison!
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
      setIsDiffMode(true); // Automatically switch to diff mode to show the beautiful comparison!
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
        {/* 左侧：输入区 / Diff区域 */}
        <div className="flex-1 flex flex-col min-h-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-200 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 transition-all shadow-xs">
          <div className="p-3 bg-gray-100/50 border-b border-gray-200 flex justify-between items-center text-sm font-medium text-gray-600">
            <div className="flex items-center gap-3">
              <span>{isDiffMode ? '差异对比' : '原文输入'}</span>
              {processedText && (
                <button
                  onClick={() => setIsDiffMode(!isDiffMode)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${isDiffMode ? 'bg-indigo-600 text-white font-medium shadow-xs' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-905 shadow-3xs'}`}
                >
                  <FileDiff className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold tracking-wide">Diff 对比模式</span>
                </button>
              )}
            </div>
            <span className="text-xs text-gray-400 font-normal">
              {isDiffMode ? '' : `${originalText.length} 字符`}
            </span>
          </div>
          
          {isDiffMode ? (
            <div className="flex-1 w-full bg-[#fdfdfd] p-3 overflow-hidden flex flex-col min-h-0">
              <CustomDiffViewer
                oldValue={originalText}
                newValue={processedText}
              />
            </div>
          ) : (
            <textarea
              className="flex-1 w-full bg-transparent p-4 resize-none outline-none text-gray-805 leading-relaxed font-sans placeholder:text-gray-400 selection:bg-indigo-100"
              placeholder="请将需要清洗的文字粘贴到这里..."
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
            />
          )}

          <div className="p-2 border-t border-gray-200 bg-gray-100/50 flex justify-end items-center gap-2">
            {isDiffMode ? (
              <>
                <span className="text-xs text-gray-400 mr-auto pl-2">Diff 模式已开启，右侧展示原文对照</span>
                <button
                   onClick={() => copyToClipboard(processedText, 'cleaned_res')}
                   disabled={!processedText}
                   className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 transition-colors font-medium border border-indigo-100"
                   title="直接复制清洗后的最终结果"
                >
                   {copiedArea === 'cleaned_res' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <CheckSquare className="w-3.5 h-3.5" />}
                   <span>{copiedArea === 'cleaned_res' ? '已复制结果' : '复制清洗结果'}</span>
                </button>
              </>
            ) : (
              <button
                 onClick={() => copyToClipboard(originalText, 'original')}
                 disabled={!originalText}
                 className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md text-gray-650 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors font-medium"
                 title="复制原输入文本"
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
            className="group relative h-12 w-12 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
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
        <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl overflow-hidden border border-gray-200 shadow-xs">
          <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center text-sm font-medium text-gray-600">
            <div className="flex items-center gap-3">
              <span>{isDiffMode ? '原文对照 (ReadOnly)' : '清洗结果'}</span>
              {!isDiffMode && processedText && (
                <button
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${isPreviewMode ? 'bg-[#e0e7ff] text-indigo-700 font-medium' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {isPreviewMode ? <FileText className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span className="text-[11px] font-semibold tracking-wide">Markdown 预览</span>
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
              className="flex-1 w-full bg-transparent p-4 resize-none outline-none text-gray-805 leading-relaxed selection:bg-indigo-100 placeholder:text-gray-450"
              placeholder={isDiffMode ? "在这里对照原文..." : "清洗后的文字将显示在这里..."}
              value={isDiffMode ? originalText : processedText}
              readOnly
            />
          )}

          <div className="p-2 border-t border-gray-200 bg-gray-50 flex justify-end items-center">
            {isDiffMode ? (
              <button
                 onClick={() => copyToClipboard(originalText, 'original_right')}
                 disabled={!originalText}
                 className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md text-gray-600 hover:text-indigo-650 hover:bg-indigo-50 disabled:opacity-50 transition-colors font-medium"
                 title="复制原文文本以进行外部对比"
              >
                 {copiedArea === 'original_right' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                 <span>{copiedArea === 'original_right' ? '已复制原文' : '复制原文'}</span>
              </button>
            ) : (
              <button
                 onClick={() => copyToClipboard(processedText, 'processed_right')}
                 disabled={!processedText}
                 className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 disabled:opacity-50 transition-colors font-semibold"
                 title="复制清洗格式化后的结果"
              >
                 {copiedArea === 'processed_right' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                 <span>{copiedArea === 'processed_right' ? '已复制结果' : '复制结果'}</span>
              </button>
            )}
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
