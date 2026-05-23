import React, { useState } from 'react';
import { diffChars, diffLines } from 'diff';

interface DiffProps {
  oldValue: string;
  newValue: string;
}

// Custom Inline Diff Viewer component for character-level changes
function InlineDiff({ oldValue, newValue }: DiffProps) {
  const diffs = diffChars(oldValue, newValue);

  return (
    <div
      id="inline-diff-content"
      className="p-4 overflow-auto font-mono text-sm leading-relaxed text-gray-800 whitespace-pre-wrap break-all h-full bg-[#fdfdfd] border border-gray-100 rounded-lg select-text selection:bg-indigo-100"
    >
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

// Custom Line Diff Viewer component (Unified view)
function UnifiedLineDiff({ oldValue, newValue }: DiffProps) {
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
          <div
            key={key}
            className="flex hover:bg-emerald-50/80 bg-emerald-50/40 border-l-4 border-emerald-500 py-0.5 text-xs font-mono"
          >
            <div className="w-10 text-right pr-2 text-gray-400 select-none border-r border-gray-150 shrink-0"></div>
            <div className="w-10 text-right pr-2 text-emerald-600 select-none border-r border-gray-150 shrink-0">
              {newLineNo++}
            </div>
            <div className="w-6 text-center text-emerald-600 font-bold select-none shrink-0">+</div>
            <div className="flex-1 pl-2 text-emerald-900 whitespace-pre-wrap break-all">{line}</div>
          </div>
        );
      } else if (part.removed) {
        renderedLines.push(
          <div
            key={key}
            className="flex hover:bg-red-50/80 bg-red-50/40 border-l-4 border-red-500 py-0.5 text-xs font-mono"
          >
            <div className="w-10 text-right pr-2 text-red-600 select-none border-r border-gray-150 shrink-0">
              {oldLineNo++}
            </div>
            <div className="w-10 text-right pr-2 text-gray-400 select-none border-r border-gray-150 shrink-0"></div>
            <div className="w-6 text-center text-red-600 font-bold select-none shrink-0">-</div>
            <div className="flex-1 pl-2 text-red-900 line-through decoration-red-300 decoration-1 whitespace-pre-wrap break-all opacity-75">
              {line}
            </div>
          </div>
        );
      } else {
        renderedLines.push(
          <div key={key} className="flex hover:bg-gray-100/60 py-0.5 text-xs font-mono">
            <div className="w-10 text-right pr-2 text-gray-400 select-none border-r border-gray-150 shrink-0">
              {oldLineNo++}
            </div>
            <div className="w-10 text-right pr-2 text-gray-400 select-none border-r border-gray-150 shrink-0">
              {newLineNo++}
            </div>
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
export function CustomDiffViewer({ oldValue, newValue }: DiffProps) {
  const [diffViewMode, setDiffViewMode] = useState<'inline' | 'unified'>('inline');

  return (
    <div id="custom-diff-viewer-panel" className="flex flex-col h-full min-h-0 bg-white rounded-lg">
      {/* Mini diff toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2 shrink-0 text-xs rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-500">对比方式:</span>
          <div className="inline-flex rounded-md shadow-xs bg-gray-100 p-0.5">
            <button
              onClick={() => setDiffViewMode('inline')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-sm transition-all focus:outline-none cursor-pointer ${
                diffViewMode === 'inline'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-gray-500 hover:text-gray-950'
              }`}
            >
              全文对比 (Inline)
            </button>
            <button
              onClick={() => setDiffViewMode('unified')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-sm transition-all focus:outline-none cursor-pointer ${
                diffViewMode === 'unified'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-gray-500 hover:text-gray-950'
              }`}
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
