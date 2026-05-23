import React from 'react';
import { ArrowRight, Wand2, Loader2, Copy, Check, FileDiff, Eye, FileText, CheckSquare } from 'lucide-react';
import { useTextCleaner } from '../hooks/useTextCleaner';
import { CustomDiffViewer } from './DiffViewer';
import { MarkdownRenderer } from './MarkdownRenderer';
import { SettingsPanel } from './SettingsPanel';

export default function TextCleaner() {
  const {
    originalText,
    setOriginalText,
    processedText,
    options,
    updateOption,
    isDiffMode,
    setIsDiffMode,
    isPreviewMode,
    setIsPreviewMode,
    status,
    errorMessage,
    copiedArea,
    handleClear,
    handleClean,
    copyToClipboard,
  } = useTextCleaner();

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
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    isDiffMode
                      ? 'bg-indigo-600 text-white font-medium shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-950 shadow-3xs'
                  }`}
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
              <CustomDiffViewer oldValue={originalText} newValue={processedText} />
            </div>
          ) : (
            <textarea
              className="flex-1 w-full bg-transparent p-4 resize-none outline-none text-gray-800 leading-relaxed font-sans placeholder:text-gray-400 selection:bg-indigo-100"
              placeholder="请将需要清洗的文字粘贴到这里..."
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
            />
          )}

          <div className="p-2 border-t border-gray-200 bg-gray-100/50 flex justify-end items-center gap-2">
            {isDiffMode ? (
              <>
                <span className="text-xs text-gray-400 mr-auto pl-2">
                  Diff 模式已开启，右侧展示原文对照
                </span>
                <button
                  onClick={() => copyToClipboard(processedText, 'cleaned_res')}
                  disabled={!processedText}
                  className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 transition-colors font-medium border border-indigo-100 cursor-pointer"
                  title="直接复制清洗后的最终结果"
                >
                  {copiedArea === 'cleaned_res' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <CheckSquare className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedArea === 'cleaned_res' ? '已复制结果' : '复制清洗结果'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => copyToClipboard(originalText, 'original')}
                disabled={!originalText}
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md text-gray-650 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors font-medium cursor-pointer"
                title="复制原输入文本"
              >
                {copiedArea === 'original' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
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
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    isPreviewMode
                      ? 'bg-[#e0e7ff] text-indigo-700 font-medium'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {isPreviewMode ? <FileText className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span className="text-[11px] font-semibold tracking-wide">Markdown 预览</span>
                </button>
              )}
            </div>
            <span className="text-xs text-gray-400 font-normal">
              {isDiffMode ? originalText.length : processedText.length} 字符
            </span>
          </div>

          {isPreviewMode && !isDiffMode ? (
            <MarkdownRenderer content={processedText} />
          ) : (
            <textarea
              className="flex-1 w-full bg-transparent p-4 resize-none outline-none text-gray-800 leading-relaxed selection:bg-indigo-100 placeholder:text-gray-400"
              placeholder={isDiffMode ? '在这里对照原文...' : '清洗后的文字将显示在这里...'}
              value={isDiffMode ? originalText : processedText}
              readOnly
            />
          )}

          <div className="p-2 border-t border-gray-200 bg-gray-55 flex justify-end items-center">
            {isDiffMode ? (
              <button
                onClick={() => copyToClipboard(originalText, 'original_right')}
                disabled={!originalText}
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors font-medium cursor-pointer"
                title="复制原文文本以进行外部对比"
              >
                {copiedArea === 'original_right' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedArea === 'original_right' ? '已复制原文' : '复制原文'}</span>
              </button>
            ) : (
              <button
                onClick={() => copyToClipboard(processedText, 'processed_right')}
                disabled={!processedText}
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 disabled:opacity-50 transition-colors font-semibold cursor-pointer"
                title="复制清洗格式化后的结果"
              >
                {copiedArea === 'processed_right' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedArea === 'processed_right' ? '已复制结果' : '复制结果'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 选项 & 状态栏 (Bottom Controls) */}
      <SettingsPanel
        options={options}
        updateOption={updateOption}
        status={status}
        errorMessage={errorMessage}
        handleClear={handleClear}
      />
    </div>
  );
}
