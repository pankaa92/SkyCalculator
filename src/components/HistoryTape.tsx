import { Trash2, RotateCcw } from 'lucide-react';
import { HistoryEntry, formatDisplayString } from '../utils/calculatorEngine';

interface HistoryTapeProps {
  entries: HistoryEntry[];
  onRecall: (entry: HistoryEntry) => void;
  onClear: () => void;
}

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function HistoryTape({ entries, onRecall, onClear }: HistoryTapeProps) {
  return (
    <aside
      aria-label="Calculation history"
      className="flex flex-col h-full bg-[#0C1320] border border-slate-800/80 rounded-3xl p-5 sm:p-6"
    >
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 tracking-tight">Calculation Tape</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {entries.length === 0
              ? 'Ready to record'
              : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} · Click to recall`}
          </p>
        </div>

        {entries.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-sky-300 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-3">
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-slate-300">No calculations yet</p>
          <p className="text-xs text-slate-500 mt-1 max-w-[22ch] leading-relaxed">
            Evaluate an expression with = or Enter to save it to your tape.
          </p>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto divide-y divide-slate-800/60 mt-2 -mx-2 px-2 max-h-[420px] lg:max-h-[452px]">
          {entries.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => onRecall(entry)}
                className="w-full text-right py-3.5 px-3 my-0.5 rounded-xl hover:bg-sky-500/10 border border-transparent hover:border-sky-500/25 transition-colors group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                title="Recall this result into calculator"
              >
                <div className="flex items-center justify-between gap-3 text-xs text-slate-400 mb-1">
                  <span className="text-[11px] text-slate-500 group-hover:text-sky-400/80 transition-colors">
                    {formatTime(entry.timestamp)}
                  </span>
                  <span className="font-mono tabular-nums truncate">
                    {entry.expression} =
                  </span>
                </div>
                <div className="font-mono tabular-nums text-lg font-semibold text-slate-100 group-hover:text-sky-300 transition-colors truncate">
                  {formatDisplayString(entry.result)}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
