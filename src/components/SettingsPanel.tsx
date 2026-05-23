import React from 'react';
import { Settings, Loader2, CheckCircle2, Trash2 } from 'lucide-react';
import { CleanerOptions, ProcessingStatus, ModeType } from '../types';

interface SettingsPanelProps {
  options: CleanerOptions;
  updateOption: <K extends keyof CleanerOptions>(key: K, value: CleanerOptions[K]) => void;
  status: ProcessingStatus;
  errorMessage: string;
  handleClear: () => void;
}

export function SettingsPanel({
  options,
  updateOption,
  status,
  errorMessage,
  handleClear,
}: SettingsPanelProps) {
  return (
    <div className="flex-shrink-0 bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
      {/* Options Selection Menu */}
      <div className="flex flex-wrap items-center gap-5">
        <div className="flex items-center gap-2 pr-4 border-r border-gray-200">
          <Settings className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">处理选项</span>
        </div>

        {/* Round 1 Options */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">首轮中英文加空格:</span>
          <select
            value={options.round1Mode}
            onChange={(e) => updateOption('round1Mode', e.target.value as ModeType)}
            className="text-xs border border-gray-200 rounded outline-none bg-gray-50 px-2 py-1 text-gray-700 focus:border-indigo-400 cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <option value="none">无</option>
            <option value="pangu">pangu.js</option>
            <option value="autocorrect">autocorrect</option>
          </select>
        </div>

        {/* Round 2 Options */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">末轮中英文兜底:</span>
          <select
            value={options.round2Mode}
            onChange={(e) => updateOption('round2Mode', e.target.value as ModeType)}
            className="text-xs border border-gray-200 rounded outline-none bg-gray-50 px-2 py-1 text-gray-700 focus:border-indigo-400 cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <option value="none">无</option>
            <option value="pangu">pangu.js</option>
            <option value="autocorrect">autocorrect</option>
          </select>
        </div>

        {/* Strict Line Merging Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer group ml-2">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={options.strictNowrap}
              onChange={(e) => updateOption('strictNowrap', e.target.checked)}
            />
            <div className="w-8 h-4 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
          </div>
          <span className="text-xs text-gray-600 group-hover:text-gray-900 select-none transition-colors">
            严格换行 (跳过HTML)
          </span>
        </label>

        {/* Figure Notes Removal Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer group ml-2">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={options.removeFigureNotes}
              onChange={(e) => updateOption('removeFigureNotes', e.target.checked)}
            />
            <div className="w-8 h-4 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
          </div>
          <span className="text-xs text-gray-600 group-hover:text-gray-900 select-none transition-colors">
            移除图表注记
          </span>
        </label>

        {/* GEMINI AI Cleaner Engine Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer group ml-2">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={options.useAIMode}
              onChange={(e) => updateOption('useAIMode', e.target.checked)}
            />
            <div className="w-8 h-4 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600"></div>
          </div>
          <span className="text-xs text-gray-600 group-hover:text-gray-900 select-none transition-colors">
            <span className="flex items-center gap-1.5 font-medium text-purple-750">
              AI 润色{' '}
              <span className="bg-purple-100 text-purple-700 text-[9px] font-bold px-1 py-0.5 rounded ml-0.5">
                Flash Lite
              </span>
            </span>
          </span>
        </label>
      </div>

      {/* Processing Status & Clear button */}
      <div className="flex items-center gap-4 text-sm w-full md:w-auto justify-between md:justify-end border-t md:border-none pt-3 md:pt-0">
        <div className="flex items-center gap-2 truncate max-w-[200px]">
          {status === 'idle' && <span className="text-gray-400 text-xs">准备就绪</span>}
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
            <span className="text-red-500 truncate text-xs font-medium" title={errorMessage}>
              {errorMessage || '处理出错'}
            </span>
          )}
        </div>

        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-650 bg-red-50 rounded-md hover:bg-red-100/80 active:bg-red-100 transition-all shrink-0 cursor-pointer"
          title="清空左右文本状态"
        >
          <Trash2 className="w-3.5 h-3.5" /> 清空文本
        </button>
      </div>
    </div>
  );
}
