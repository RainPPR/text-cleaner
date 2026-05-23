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

// Custom Line Diff Viewer component (Unified view with smart context-aware folding like git diff)
function UnifiedLineDiff({ oldValue, newValue }: DiffProps) {
  const parts = diffLines(oldValue, newValue);

  const allLines: {
    type: 'added' | 'removed' | 'normal';
    content: string;
    oldNo: number | null;
    newNo: number | null;
  }[] = [];

  let oldLineNo = 1;
  let newLineNo = 1;

  parts.forEach((part) => {
    const lines = part.value.split('\n');
    if (lines[lines.length - 1] === '') {
      lines.pop();
    }

    lines.forEach((line) => {
      if (part.added) {
        allLines.push({
          type: 'added',
          content: line,
          oldNo: null,
          newNo: newLineNo++,
        });
      } else if (part.removed) {
        allLines.push({
          type: 'removed',
          content: line,
          oldNo: oldLineNo++,
          newNo: null,
        });
      } else {
        allLines.push({
          type: 'normal',
          content: line,
          oldNo: oldLineNo++,
          newNo: newLineNo++,
        });
      }
    });
  });

  const contextSize = 3;
  const showFlags = new Array(allLines.length).fill(false);

  for (let i = 0; i < allLines.length; i++) {
    if (allLines[i].type !== 'normal') {
      const start = Math.max(0, i - contextSize);
      const end = Math.min(allLines.length - 1, i + contextSize);
      for (let j = start; j <= end; j++) {
        showFlags[j] = true;
      }
    }
  }

  // If there are no changes, show everything
  const hasChanges = allLines.some(line => line.type !== 'normal');
  const finalShowFlags = hasChanges ? showFlags : new Array(allLines.length).fill(true);

  // Keep track of which hidden keys have been expanded by user click
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  const renderedLines: React.ReactNode[] = [];
  let idx = 0;

  while (idx < allLines.length) {
    if (finalShowFlags[idx]) {
      const line = allLines[idx];
      const key = `line-${idx}`;

      if (line.type === 'added') {
        renderedLines.push(
          <div
            key={key}
            className="flex hover:bg-emerald-50/80 bg-emerald-50/40 border-l-4 border-emerald-500 py-0.5 text-xs font-mono"
          >
            <div className="w-10 text-right pr-2 text-gray-400 select-none border-r border-gray-150 shrink-0"></div>
            <div className="w-10 text-right pr-2 text-emerald-600 select-none border-r border-gray-150 shrink-0">
              {line.newNo}
            </div>
            <div className="w-6 text-center text-emerald-600 font-bold select-none shrink-0">+</div>
            <div className="flex-1 pl-3 text-emerald-950 whitespace-pre-wrap break-all">{line.content}</div>
          </div>
        );
      } else if (line.type === 'removed') {
        renderedLines.push(
          <div
            key={key}
            className="flex hover:bg-red-50/80 bg-red-50/40 border-l-4 border-red-500 py-0.5 text-xs font-mono"
          >
            <div className="w-10 text-right pr-2 text-red-600 select-none border-r border-gray-150 shrink-0">
              {line.oldNo}
            </div>
            <div className="w-10 text-right pr-2 text-gray-400 select-none border-r border-gray-150 shrink-0"></div>
            <div className="w-6 text-center text-red-600 font-bold select-none shrink-0">-</div>
            <div className="flex-1 pl-3 text-red-950 line-through decoration-red-300 decoration-1 whitespace-pre-wrap break-all opacity-75">
              {line.content}
            </div>
          </div>
        );
      } else {
        renderedLines.push(
          <div key={key} className="flex hover:bg-gray-100/60 py-0.5 text-xs font-mono">
            <div className="w-10 text-right pr-2 text-gray-400 select-none border-r border-gray-150 shrink-0">
              {line.oldNo}
            </div>
            <div className="w-10 text-right pr-2 text-gray-400 select-none border-r border-gray-150 shrink-0">
              {line.newNo}
            </div>
            <div className="w-6 text-center text-gray-300 select-none shrink-0"> </div>
            <div className="flex-1 pl-3 text-gray-700 whitespace-pre-wrap break-all">{line.content}</div>
          </div>
        );
      }
      idx++;
    } else {
      // Find range of contiguous hidden lines
      const startIdx = idx;
      let hiddenCount = 0;
      while (idx < allLines.length && !finalShowFlags[idx]) {
        hiddenCount++;
        idx++;
      }

      const key = `hidden-${startIdx}-${idx}`;
      const isExpanded = !!expandedKeys[key];

      if (isExpanded) {
        // Render them as normal unchanged lines with a subtle blue/indigo indicator bar to show they are expanded
        for (let j = startIdx; j < idx; j++) {
          const line = allLines[j];
          const lineKey = `line-${j}`;
          renderedLines.push(
            <div key={lineKey} className="flex hover:bg-blue-50/45 bg-indigo-50/15 py-0.5 text-xs font-mono border-l-4 border-indigo-200">
              <div className="w-10 text-right pr-2 text-gray-400 select-none border-r border-gray-150 shrink-0">
                {line.oldNo}
              </div>
              <div className="w-10 text-right pr-2 text-gray-400 select-none border-r border-gray-150 shrink-0">
                {line.newNo}
              </div>
              <div className="w-6 text-center text-gray-300 select-none shrink-0"> </div>
              <div className="flex-1 pl-3 text-gray-600 whitespace-pre-wrap break-all">{line.content}</div>
            </div>
          );
        }
      } else {
        const firstHiddenLine = allLines[startIdx];
        const startOld = firstHiddenLine.oldNo || 0;
        const startNew = firstHiddenLine.newNo || 0;

        renderedLines.push(
          <div
            key={key}
            className="flex bg-indigo-50/40 border-l-4 border-indigo-400 py-1.5 text-xs font-mono text-indigo-600 font-medium select-none items-center"
          >
            <div className="w-20 text-center text-[10px] text-indigo-400 select-none border-r border-gray-150 shrink-0 tracking-widest font-bold">
              •••
            </div>
            <div className="flex-1 pl-4 flex items-center justify-between pr-4">
              <span className="text-indigo-700/90 text-[11px]">
                {`@@ -${startOld} +${startNew} @@ 已折叠 ${hiddenCount} 行无变化文本`}
              </span>
              <button
                onClick={() => setExpandedKeys(prev => ({ ...prev, [key]: true }))}
                className="text-[10px] font-semibold text-indigo-700 hover:text-indigo-900 bg-white border border-indigo-200 hover:border-indigo-400 px-2 py-0.5 rounded shadow-3xs cursor-pointer hover:bg-indigo-50 active:scale-[0.98] transition-all"
                type="button"
              >
                展开 {hiddenCount} 行
              </button>
            </div>
          </div>
        );
      }
    }
  }

  return (
    <div className="overflow-auto h-full bg-[#fdfdfd] border border-gray-100 rounded-lg flex flex-col min-h-0 select-text">
      <div className="flex-1 overflow-auto py-2">
        {allLines.length === 0 ? (
          <div className="p-8 text-center text-gray-450 text-sm">暂无文本进行对比</div>
        ) : renderedLines.length === 0 ? (
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
