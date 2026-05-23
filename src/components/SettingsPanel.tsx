import React from 'react';
import { Settings, Loader2, CheckCircle2, Trash2 } from 'lucide-react';
import { CleanerOptions, ProcessingStatus } from '../types';

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
    <div id="settings-control-panel" className="flex-shrink-0 bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
      {/* Options Selection Menu */}
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2 pr-4 border-r border-gray-200">
          <Settings className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">清洗规则配置</span>
        </div>

        {/* Strict Line Merging Checkbox */}
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={options.strictNowrap}
              onChange={(e) => updateOption('strictNowrap', e.target.checked)}
            />
            <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500/25 peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-800 group-hover:text-indigo-600 select-none transition-colors">
              严格换行
            </span>
            <span className="text-[10px] text-gray-400 select-none">
              自动合并段内换行、多空行压缩 (跳过HTML、公式及代码块)
            </span>
          </div>
        </label>

        {/* Figure Notes Removal Checkbox */}
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={options.removeFigureNotes}
              onChange={(e) => updateOption('removeFigureNotes', e.target.checked)}
            />
            <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500/25 peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-800 group-hover:text-indigo-600 select-none transition-colors">
              过滤图表注记
            </span>
            <span className="text-[10px] text-gray-400 select-none">
              移出文中的“（图 1-1）”或“(图3)”等标示符号
            </span>
          </div>
        </label>
      </div>

      {/* Processing Status & Clear button */}
      <div className="flex items-center gap-4 text-sm w-full md:w-auto justify-between md:justify-end border-t md:border-none pt-3 md:pt-0">
        <div className="flex items-center gap-2 truncate max-w-[200px]">
          {status === 'idle' && (
            <span className="text-gray-400 text-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
              准备就绪
            </span>
          )}
          {status === 'cleaning' && (
            <span className="text-indigo-600 flex items-center gap-1.5 text-xs font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              排版清洗中...
            </span>
          )}
          {status === 'success' && (
            <span className="text-emerald-600 flex items-center gap-1 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              清洗完成
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
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-650 bg-red-50 rounded-lg hover:bg-red-100/85 active:bg-red-100 transition-all shrink-0 cursor-pointer"
          title="清空文本框"
        >
          <Trash2 className="w-3.5 h-3.5" /> 清空
        </button>
      </div>
    </div>
  );
}
