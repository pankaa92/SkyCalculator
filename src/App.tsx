import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Delete,
  Divide,
  History,
  Minus,
  Percent,
  Plus,
  X,
} from 'lucide-react';
import { HistoryTape } from './components/HistoryTape';
import { KeypadButton } from './components/KeypadButton';
import {
  CalculatorState,
  HistoryEntry,
  INITIAL_CALCULATOR_STATE,
  Operator,
  backspace,
  chooseOperator,
  evaluate,
  formatDisplayString,
  inputDecimal,
  inputDigit,
  inputPercent,
  recallValue,
  toggleSign,
} from './utils/calculatorEngine';

const STORAGE_KEY = 'skycalc_history_v1';
const MAX_HISTORY_ITEMS = 50;

function loadSavedHistory(): HistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is HistoryEntry =>
          Boolean(item) &&
          typeof item.id === 'string' &&
          typeof item.expression === 'string' &&
          typeof item.result === 'string' &&
          typeof item.numericResult === 'number' &&
          Number.isFinite(item.numericResult) &&
          typeof item.timestamp === 'number'
      )
      .slice(0, MAX_HISTORY_ITEMS);
  } catch {
    return [];
  }
}

export default function App() {
  const [calc, setCalc] = useState<CalculatorState>(INITIAL_CALCULATOR_STATE);
  const [history, setHistory] = useState<HistoryEntry[]>(loadSavedHistory);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mobileView, setMobileView] = useState<'calculator' | 'history'>('calculator');

  const keyTimeoutRef = useRef<number | null>(null);
  const copyTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Ignore storage quota or private browsing errors
    }
  }, [history]);

  const flashKey = useCallback((keyId: string) => {
    setActiveKey(keyId);
    if (keyTimeoutRef.current !== null) {
      window.clearTimeout(keyTimeoutRef.current);
    }
    keyTimeoutRef.current = window.setTimeout(() => {
      setActiveKey(null);
    }, 130);
  }, []);

  const handleDigit = useCallback((digit: string) => {
    setCalc((prev) => inputDigit(prev, digit));
  }, []);

  const handleDecimal = useCallback(() => {
    setCalc((prev) => inputDecimal(prev));
  }, []);

  const handleOperator = useCallback((op: Operator) => {
    setCalc((prev) => chooseOperator(prev, op));
  }, []);

  const handleEvaluate = useCallback(() => {
    setCalc((prev) => {
      const { nextState, historyEntry } = evaluate(prev);
      if (historyEntry) {
        setHistory((prevHistory) => [historyEntry, ...prevHistory].slice(0, MAX_HISTORY_ITEMS));
      }
      return nextState;
    });
  }, []);

  const handleBackspace = useCallback(() => {
    setCalc((prev) => backspace(prev));
  }, []);

  const handleToggleSign = useCallback(() => {
    setCalc((prev) => toggleSign(prev));
  }, []);

  const handlePercent = useCallback(() => {
    setCalc((prev) => inputPercent(prev));
  }, []);

  const handleClearAll = useCallback(() => {
    setCalc(INITIAL_CALCULATOR_STATE);
  }, []);

  const handleRecall = useCallback((entry: HistoryEntry) => {
    setCalc((prev) => recallValue(prev, entry.numericResult));
    setMobileView('calculator');
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const handleCopyDisplay = useCallback(async () => {
    if (calc.error) return;
    try {
      await navigator.clipboard.writeText(calc.displayValue);
      setCopied(true);
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      // Clipboard API unavailable in non-secure context
    }
  }, [calc.displayValue, calc.error]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const { key } = event;

      if (/^[0-9]$/.test(key)) {
        event.preventDefault();
        flashKey(key);
        handleDigit(key);
        return;
      }

      if (key === '.') {
        event.preventDefault();
        flashKey('.');
        handleDecimal();
        return;
      }

      if (key === '+' || key === '-' || key === '*' || key === '/') {
        event.preventDefault();
        flashKey(key);
        handleOperator(key as Operator);
        return;
      }

      if (key === '%') {
        event.preventDefault();
        flashKey('%');
        handlePercent();
        return;
      }

      if (key === 'Enter' || key === '=') {
        event.preventDefault();
        flashKey('=');
        handleEvaluate();
        return;
      }

      if (key === 'Backspace') {
        event.preventDefault();
        flashKey('backspace');
        handleBackspace();
        return;
      }

      if (key === 'Escape' || key === 'Delete' || key === 'c' || key === 'C') {
        event.preventDefault();
        flashKey('clear');
        handleClearAll();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    flashKey,
    handleBackspace,
    handleClearAll,
    handleDecimal,
    handleDigit,
    handleEvaluate,
    handleOperator,
    handlePercent,
  ]);

  const formattedDisplay = calc.error ? calc.error : formatDisplayString(calc.displayValue);
  const displayLength = formattedDisplay.length;

  let displaySizeClass = 'text-4xl sm:text-[2.75rem]';
  if (calc.error) {
    displaySizeClass = 'text-xl sm:text-2xl';
  } else if (displayLength > 15) {
    displaySizeClass = 'text-2xl sm:text-[1.75rem]';
  } else if (displayLength > 11) {
    displaySizeClass = 'text-3xl sm:text-[2.15rem]';
  }

  return (
    <div className="min-h-screen bg-[#080D14] text-slate-100 flex flex-col">
      {/* Subtle sky-blue atmospheric top glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(56,189,248,0.12),transparent)]"
      />

      {/* Minimal Header */}
      <header className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
              <span className="rounded-[2px] bg-slate-200" />
              <span className="rounded-[2px] bg-sky-400" />
              <span className="rounded-[2px] bg-slate-400" />
              <span className="rounded-[2px] bg-sky-400" />
            </div>
          </div>
          <h1 className="text-base font-semibold tracking-tight text-slate-100">SkyCalc</h1>
        </div>

        {/* Mobile view toggle between Keypad & Tape */}
        <div className="flex lg:hidden items-center gap-1 p-1 bg-[#0C1320] border border-slate-800/80 rounded-xl">
          <button
            type="button"
            onClick={() => setMobileView('calculator')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mobileView === 'calculator'
                ? 'bg-sky-500 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Keypad
          </button>
          <button
            type="button"
            onClick={() => setMobileView('history')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mobileView === 'history'
                ? 'bg-sky-500 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Tape ({history.length})</span>
          </button>
        </div>

        <p className="hidden lg:block text-xs text-slate-400">
          Keyboard ready · Esc to clear
        </p>
      </header>

      {/* Main Centered Workstation */}
      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] gap-6 items-stretch">
          {/* Calculator Chassis */}
          <section
            aria-label="Calculator"
            className={`${
              mobileView === 'calculator' ? 'block' : 'hidden lg:block'
            } bg-[#0B111C] border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-black/60`}
          >
            {/* Display Bezel */}
            <div className="bg-[#060A11] border border-slate-800/80 rounded-2xl px-5 py-4 mb-5 flex flex-col justify-between min-h-[124px]">
              <div className="flex items-center justify-between gap-3 min-h-[24px]">
                <button
                  type="button"
                  onClick={handleCopyDisplay}
                  disabled={Boolean(calc.error)}
                  aria-label="Copy result"
                  title={copied ? 'Copied' : 'Copy result'}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-sky-300 disabled:opacity-40 disabled:pointer-events-none transition-colors py-1 px-1.5 -ml-1.5 rounded-md hover:bg-slate-800/60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
                      <span className="text-sky-400 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <div
                  aria-live="polite"
                  className="font-mono tabular-nums text-sm text-sky-400/90 truncate text-right"
                >
                  {calc.expression || '\u00A0'}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-2 overflow-hidden">
                {calc.error && (
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" aria-hidden="true" />
                )}
                <output
                  aria-live="assertive"
                  className={`font-mono tabular-nums font-semibold tracking-tight leading-none text-right break-all ${
                    calc.error ? 'text-amber-400' : 'text-slate-50'
                  } ${displaySizeClass}`}
                >
                  {formattedDisplay}
                </output>
              </div>
            </div>

            {/* 4x5 Tactile Keypad */}
            <div className="grid grid-cols-4 gap-3" role="group" aria-label="Calculator keypad">
              <KeypadButton
                label="AC"
                ariaLabel="All clear"
                variant="function"
                onClick={handleClearAll}
                isPressed={activeKey === 'clear'}
                className="text-base font-semibold text-sky-300"
              />
              <KeypadButton
                label="+/−"
                ariaLabel="Toggle positive or negative sign"
                variant="function"
                onClick={handleToggleSign}
                className="text-lg"
              />
              <KeypadButton
                label={<Percent className="w-5 h-5" aria-hidden="true" />}
                ariaLabel="Percent"
                variant="function"
                onClick={handlePercent}
                isPressed={activeKey === '%'}
              />
              <KeypadButton
                label={<Divide className="w-5 h-5" aria-hidden="true" />}
                ariaLabel="Divide"
                variant="operator"
                onClick={() => handleOperator('/')}
                isActive={calc.operator === '/' && calc.waitingForOperand}
                isPressed={activeKey === '/'}
              />

              <KeypadButton
                label="7"
                ariaLabel="7"
                onClick={() => handleDigit('7')}
                isPressed={activeKey === '7'}
              />
              <KeypadButton
                label="8"
                ariaLabel="8"
                onClick={() => handleDigit('8')}
                isPressed={activeKey === '8'}
              />
              <KeypadButton
                label="9"
                ariaLabel="9"
                onClick={() => handleDigit('9')}
                isPressed={activeKey === '9'}
              />
              <KeypadButton
                label={<X className="w-5 h-5" aria-hidden="true" />}
                ariaLabel="Multiply"
                variant="operator"
                onClick={() => handleOperator('*')}
                isActive={calc.operator === '*' && calc.waitingForOperand}
                isPressed={activeKey === '*'}
              />

              <KeypadButton
                label="4"
                ariaLabel="4"
                onClick={() => handleDigit('4')}
                isPressed={activeKey === '4'}
              />
              <KeypadButton
                label="5"
                ariaLabel="5"
                onClick={() => handleDigit('5')}
                isPressed={activeKey === '5'}
              />
              <KeypadButton
                label="6"
                ariaLabel="6"
                onClick={() => handleDigit('6')}
                isPressed={activeKey === '6'}
              />
              <KeypadButton
                label={<Minus className="w-5 h-5" aria-hidden="true" />}
                ariaLabel="Subtract"
                variant="operator"
                onClick={() => handleOperator('-')}
                isActive={calc.operator === '-' && calc.waitingForOperand}
                isPressed={activeKey === '-'}
              />

              <KeypadButton
                label="1"
                ariaLabel="1"
                onClick={() => handleDigit('1')}
                isPressed={activeKey === '1'}
              />
              <KeypadButton
                label="2"
                ariaLabel="2"
                onClick={() => handleDigit('2')}
                isPressed={activeKey === '2'}
              />
              <KeypadButton
                label="3"
                ariaLabel="3"
                onClick={() => handleDigit('3')}
                isPressed={activeKey === '3'}
              />
              <KeypadButton
                label={<Plus className="w-5 h-5" aria-hidden="true" />}
                ariaLabel="Add"
                variant="operator"
                onClick={() => handleOperator('+')}
                isActive={calc.operator === '+' && calc.waitingForOperand}
                isPressed={activeKey === '+'}
              />

              <KeypadButton
                label="0"
                ariaLabel="0"
                onClick={() => handleDigit('0')}
                isPressed={activeKey === '0'}
              />
              <KeypadButton
                label="."
                ariaLabel="Decimal point"
                onClick={handleDecimal}
                isPressed={activeKey === '.'}
              />
              <KeypadButton
                label={<Delete className="w-5 h-5" aria-hidden="true" />}
                ariaLabel="Backspace"
                variant="function"
                onClick={handleBackspace}
                isPressed={activeKey === 'backspace'}
              />
              <KeypadButton
                label="="
                ariaLabel="Equals"
                variant="equals"
                onClick={handleEvaluate}
                isPressed={activeKey === '='}
                className="text-2xl"
              />
            </div>
          </section>

          {/* Calculation Tape Panel */}
          <div className={`${mobileView === 'history' ? 'block' : 'hidden lg:block'} h-full`}>
            <HistoryTape
              entries={history}
              onRecall={handleRecall}
              onClear={handleClearHistory}
            />
          </div>
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 pb-6 pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>Basic arithmetic · Static client-side build</span>
        <span className="font-mono">0–9 · + − × ÷ · % · Enter</span>
      </footer>
    </div>
  );
}
