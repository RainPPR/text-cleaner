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
    <div className="w-full max-w-7xl mx-auto lg:h-[calc(100vh-3rem)] lg:min-h-[750px] flex flex-col p-4 md:p-6 space-y-5 overflow-hidden">
      {/* 头部标题区域 */}
      <header className="flex-shrink-0 flex flex-col md:flex-row md:items-center md:justify-between border-b pb-5 border-gray-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-indigo-600" />
            排版与段落清洗工具 (Autocorrect)
          </h1>
          <p className="text-sm text-gray-500 mt-1.5">
            采用中英文智能空格混排、空行过滤、OCR 冗余空字符压缩以及图表引用符号清洗。
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleClean}
            disabled={status === 'cleaning' || !originalText.trim()}
            className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer w-full md:w-auto"
          >
            {status === 'cleaning' ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                正在智能清洗中...
              </>
            ) : (
              <>
                <Wand2 className="w-4.5 h-4.5" />
                开始清洗文本
              </>
            )}
          </button>
        </div>
      </header>

      {/* 主工作区 - min-h-0 prevents the flexbox from flowing offscreen on desktop */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0">
        {/* 左侧：输入区 / Diff区域 */}
        <div className="flex-1 h-[380px] md:h-[480px] lg:h-full flex flex-col min-h-0 bg-gray-55 rounded-xl overflow-hidden border border-gray-200 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 transition-all shadow-xs">
          <div className="p-3.5 bg-gray-100/60 border-b border-gray-200 flex justify-between items-center text-sm font-medium text-gray-655 shrink-0 select-none">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-700">{isDiffMode ? '排版对照对比 (Diff Mode)' : '原文粘贴物理输入区'}</span>
              {processedText && (
                <button
                  onClick={() => setIsDiffMode(!isDiffMode)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                    isDiffMode
                      ? 'bg-indigo-600 text-white font-medium shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-950 shadow-3xs'
                  }`}
                >
                  <FileDiff className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold tracking-wide">
                    {isDiffMode ? '返回常规编辑' : '查看差异 (Diff)'}
                  </span>
                </button>
              )}
            </div>
            <span className="text-xs text-gray-400 font-normal">
              {isDiffMode ? '' : `${originalText.length} 字符`}
            </span>
          </div>

          {isDiffMode ? (
            <div className="flex-1 w-full bg-[#fdfdfd] p-4 overflow-hidden flex flex-col min-h-0">
              <CustomDiffViewer oldValue={originalText} newValue={processedText} />
            </div>
          ) : (
            <textarea
              className="flex-1 w-full bg-transparent p-5 outline-none text-gray-800 leading-relaxed font-sans placeholder:text-gray-400 selection:bg-indigo-100 text-sm md:text-[15px] overflow-y-auto resize-none"
              placeholder="请在此粘贴需要清洗、排版和消除多余空格的原始文本 (支持 Markdown / PDF 粘贴段落 / 一键格式化)..."
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
            />
          )}

          <div className="p-3 border-t border-gray-200 bg-gray-100/50 flex justify-end items-center gap-2 shrink-0">
            {isDiffMode ? (
              <>
                <span className="text-xs text-gray-400 mr-auto pl-2">
                  已经进入差异对比模式试读，无法修改输入。可通过右侧拷贝最终清洗结果
                </span>
                <button
                  onClick={() => copyToClipboard(processedText, 'cleaned_res')}
                  disabled={!processedText}
                  className="text-xs flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-indigo-50 text-indigo-750 hover:bg-indigo-100 disabled:opacity-50 transition-colors font-medium border border-indigo-100 cursor-pointer"
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
                className="text-xs flex items-center gap-1.5 px-3.5 py-2 rounded-md text-gray-655 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors font-medium cursor-pointer"
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

        {/* 中间快捷执行圆钮 (支持直接在大屏过渡) */}
        <div className="hidden lg:flex items-center justify-center py-2 shrink-0">
          <button
            onClick={handleClean}
            disabled={status === 'cleaning' || !originalText.trim()}
            className="group relative h-12 w-12 flex items-center justify-center rounded-full bg-indigo-650 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
            title="开始清洗"
          >
            {status === 'cleaning' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            )}
          </button>
        </div>

        {/* 右侧：输出区 */}
        <div className="flex-1 h-[380px] md:h-[480px] lg:h-full flex flex-col min-h-0 bg-white rounded-xl overflow-hidden border border-gray-200 shadow-xs">
          <div className="p-3.5 bg-gray-50 border-b border-gray-200 flex justify-between items-center text-sm font-medium text-gray-655 shrink-0 select-none">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-700">{isDiffMode ? '原文原貌只读参考' : '清洗后最终排版输出'}</span>
              {!isDiffMode && processedText && (
                <button
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                    isPreviewMode
                      ? 'bg-indigo-50 border border-indigo-200 text-indigo-750 font-medium'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-3xs'
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
              className="flex-1 w-full bg-transparent p-5 outline-none text-gray-800 leading-relaxed selection:bg-indigo-100 placeholder:text-gray-400 text-sm md:text-[15px] overflow-y-auto resize-none"
              placeholder={isDiffMode ? '差异模式开启中。左侧显示合并对比图示，此处展示修改前的原文内容作为参考。' : '经过中文格式化混排、空格清洗与标记过滤后的文本将即时渲染并显示在此处...'}
              value={isDiffMode ? originalText : processedText}
              readOnly
            />
          )}

          <div className="p-3 border-t border-gray-200 bg-gray-55 flex justify-end items-center shrink-0">
            {isDiffMode ? (
              <button
                onClick={() => copyToClipboard(originalText, 'original_right')}
                disabled={!originalText}
                className="text-xs flex items-center gap-1.5 px-3.5 py-2 rounded-md text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors font-medium cursor-pointer"
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
                className="text-xs flex items-center gap-1.5 px-4 py-2.5 rounded-md text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 disabled:opacity-50 transition-all font-semibold cursor-pointer shadow-3xs"
                title="复制清洗格式化后的结果"
              >
                {copiedArea === 'processed_right' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedArea === 'processed_right' ? '已复制结果' : '一键复制清洗结果'}</span>
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
