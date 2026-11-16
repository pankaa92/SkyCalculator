export type Operator = '+' | '-' | '*' | '/';

export interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
  numericResult: number;
  timestamp: number;
}

export interface CalculatorState {
  displayValue: string;
  previousValue: number | null;
  operator: Operator | null;
  waitingForOperand: boolean;
  lastOperand: number | null;
  lastOperator: Operator | null;
  expression: string;
  error: string | null;
  justEvaluated: boolean;
}

export const INITIAL_CALCULATOR_STATE: CalculatorState = {
  displayValue: '0',
  previousValue: null,
  operator: null,
  waitingForOperand: false,
  lastOperand: null,
  lastOperator: null,
  expression: '',
  error: null,
  justEvaluated: false,
};

const MAX_INPUT_DIGITS = 15;

export function getOperatorSymbol(op: Operator): string {
  switch (op) {
    case '+':
      return '+';
    case '-':
      return '−';
    case '*':
      return '×';
    case '/':
      return '÷';
  }
}

export function formatResult(value: number): string {
  if (!Number.isFinite(value)) {
    return 'Error';
  }
  if (Object.is(value, -0)) {
    return '0';
  }

  const abs = Math.abs(value);
  if (abs >= 1e12 || (abs > 0 && abs < 1e-9)) {
    return value.toExponential(6).replace(/\.?0+e/, 'e');
  }

  const rounded = Number(value.toPrecision(12));
  return String(rounded);
}

export function formatDisplayString(raw: string): string {
  if (raw === 'Error' || raw === 'Cannot divide by 0' || raw === 'Overflow') {
    return raw;
  }
  if (raw.includes('e') || raw.includes('E')) {
    return raw;
  }

  const isNegative = raw.startsWith('-');
  const unsigned = isNegative ? raw.slice(1) : raw;
  const [intPart, decPart] = unsigned.split('.');

  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = isNegative ? '-' : '';

  if (decPart !== undefined) {
    return `${sign}${formattedInt}.${decPart}`;
  }
  return `${sign}${formattedInt}`;
}

function compute(left: number, right: number, op: Operator): { value?: number; error?: string } {
  let result: number;
  switch (op) {
    case '+':
      result = left + right;
      break;
    case '-':
      result = left - right;
      break;
    case '*':
      result = left * right;
      break;
    case '/':
      if (right === 0) {
        return { error: 'Cannot divide by 0' };
      }
      result = left / right;
      break;
  }

  if (!Number.isFinite(result)) {
    return { error: 'Overflow' };
  }

  return { value: Number(result.toPrecision(12)) };
}

export function inputDigit(state: CalculatorState, digit: string): CalculatorState {
  if (state.error) {
    return {
      ...INITIAL_CALCULATOR_STATE,
      displayValue: digit,
    };
  }

  if (state.waitingForOperand || state.justEvaluated) {
    return {
      ...state,
      displayValue: digit,
      waitingForOperand: false,
      justEvaluated: false,
      expression: state.justEvaluated ? '' : state.expression,
      previousValue: state.justEvaluated ? null : state.previousValue,
      operator: state.justEvaluated ? null : state.operator,
    };
  }

  const rawDigitsCount = state.displayValue.replace(/[^0-9]/g, '').length;
  if (rawDigitsCount >= MAX_INPUT_DIGITS) {
    return state;
  }

  const nextDisplay = state.displayValue === '0' ? digit : `${state.displayValue}${digit}`;
  return {
    ...state,
    displayValue: nextDisplay,
  };
}

export function inputDecimal(state: CalculatorState): CalculatorState {
  if (state.error) {
    return {
      ...INITIAL_CALCULATOR_STATE,
      displayValue: '0.',
    };
  }

  if (state.waitingForOperand || state.justEvaluated) {
    return {
      ...state,
      displayValue: '0.',
      waitingForOperand: false,
      justEvaluated: false,
      expression: state.justEvaluated ? '' : state.expression,
      previousValue: state.justEvaluated ? null : state.previousValue,
      operator: state.justEvaluated ? null : state.operator,
    };
  }

  if (state.displayValue.includes('.')) {
    return state;
  }

  return {
    ...state,
    displayValue: `${state.displayValue}.`,
  };
}

export function backspace(state: CalculatorState): CalculatorState {
  if (state.error) {
    return INITIAL_CALCULATOR_STATE;
  }
  if (state.waitingForOperand || state.justEvaluated) {
    return state;
  }

  if (
    state.displayValue.length <= 1 ||
    (state.displayValue.length === 2 && state.displayValue.startsWith('-'))
  ) {
    return {
      ...state,
      displayValue: '0',
    };
  }

  return {
    ...state,
    displayValue: state.displayValue.slice(0, -1),
  };
}

export function toggleSign(state: CalculatorState): CalculatorState {
  if (state.error || state.displayValue === '0') {
    return state;
  }

  const nextValue = state.displayValue.startsWith('-')
    ? state.displayValue.slice(1)
    : `-${state.displayValue}`;

  return {
    ...state,
    displayValue: nextValue,
    justEvaluated: false,
  };
}

export function inputPercent(state: CalculatorState): CalculatorState {
  if (state.error) {
    return state;
  }

  const current = parseFloat(state.displayValue);
  if (Number.isNaN(current)) {
    return state;
  }

  let percentVal: number;
  if (
    state.previousValue !== null &&
    (state.operator === '+' || state.operator === '-') &&
    !state.waitingForOperand
  ) {
    percentVal = (state.previousValue * current) / 100;
  } else {
    percentVal = current / 100;
  }

  return {
    ...state,
    displayValue: formatResult(percentVal),
    waitingForOperand: false,
    justEvaluated: false,
  };
}

export function chooseOperator(state: CalculatorState, nextOp: Operator): CalculatorState {
  if (state.error) {
    return INITIAL_CALCULATOR_STATE;
  }

  const inputValue = parseFloat(state.displayValue);

  if (state.operator && state.waitingForOperand) {
    return {
      ...state,
      operator: nextOp,
      expression: `${formatResult(state.previousValue ?? inputValue)} ${getOperatorSymbol(nextOp)}`,
      justEvaluated: false,
    };
  }

  if (state.previousValue === null || state.justEvaluated) {
    return {
      ...state,
      previousValue: inputValue,
      operator: nextOp,
      waitingForOperand: true,
      justEvaluated: false,
      lastOperand: null,
      lastOperator: null,
      expression: `${formatResult(inputValue)} ${getOperatorSymbol(nextOp)}`,
    };
  }

  if (state.operator) {
    const computed = compute(state.previousValue, inputValue, state.operator);
    if (computed.error || computed.value === undefined) {
      return {
        ...INITIAL_CALCULATOR_STATE,
        displayValue: computed.error ?? 'Error',
        error: computed.error ?? 'Error',
        expression: `${formatResult(state.previousValue)} ${getOperatorSymbol(state.operator)} ${formatResult(inputValue)}`,
      };
    }

    const formatted = formatResult(computed.value);
    return {
      ...state,
      displayValue: formatted,
      previousValue: computed.value,
      operator: nextOp,
      waitingForOperand: true,
      justEvaluated: false,
      expression: `${formatted} ${getOperatorSymbol(nextOp)}`,
    };
  }

  return state;
}

export function evaluate(state: CalculatorState): {
  nextState: CalculatorState;
  historyEntry?: HistoryEntry;
} {
  if (state.error) {
    return { nextState: INITIAL_CALCULATOR_STATE };
  }

  const currentValue = parseFloat(state.displayValue);

  // Standard evaluation when an operator is pending
  if (state.operator !== null && state.previousValue !== null) {
    const rightOperand = state.waitingForOperand ? state.previousValue : currentValue;
    const computed = compute(state.previousValue, rightOperand, state.operator);
    const expr = `${formatResult(state.previousValue)} ${getOperatorSymbol(state.operator)} ${formatResult(rightOperand)} =`;

    if (computed.error || computed.value === undefined) {
      return {
        nextState: {
          ...INITIAL_CALCULATOR_STATE,
          displayValue: computed.error ?? 'Error',
          error: computed.error ?? 'Error',
          expression: expr,
        },
      };
    }

    const formatted = formatResult(computed.value);
    return {
      nextState: {
        displayValue: formatted,
        previousValue: computed.value,
        operator: null,
        waitingForOperand: false,
        lastOperand: rightOperand,
        lastOperator: state.operator,
        expression: expr,
        error: null,
        justEvaluated: true,
      },
      historyEntry: {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        expression: expr.replace(/\s*=$/, ''),
        result: formatted,
        numericResult: computed.value,
        timestamp: Date.now(),
      },
    };
  }

  // Repeat equals behavior (e.g., 5 + 3 = = =)
  if (state.justEvaluated && state.lastOperator !== null && state.lastOperand !== null) {
    const computed = compute(currentValue, state.lastOperand, state.lastOperator);
    const expr = `${formatResult(currentValue)} ${getOperatorSymbol(state.lastOperator)} ${formatResult(state.lastOperand)} =`;

    if (computed.error || computed.value === undefined) {
      return {
        nextState: {
          ...INITIAL_CALCULATOR_STATE,
          displayValue: computed.error ?? 'Error',
          error: computed.error ?? 'Error',
          expression: expr,
        },
      };
    }

    const formatted = formatResult(computed.value);
    return {
      nextState: {
        ...state,
        displayValue: formatted,
        previousValue: computed.value,
        expression: expr,
        justEvaluated: true,
      },
      historyEntry: {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        expression: expr.replace(/\s*=$/, ''),
        result: formatted,
        numericResult: computed.value,
        timestamp: Date.now(),
      },
    };
  }

  return { nextState: state };
}

export function clearEntry(state: CalculatorState): CalculatorState {
  if (state.error) {
    return INITIAL_CALCULATOR_STATE;
  }
  return {
    ...state,
    displayValue: '0',
    waitingForOperand: false,
  };
}

export function recallValue(state: CalculatorState, numericResult: number): CalculatorState {
  const formatted = formatResult(numericResult);
  if (state.error || state.justEvaluated) {
    return {
      ...INITIAL_CALCULATOR_STATE,
      displayValue: formatted,
    };
  }
  return {
    ...state,
    displayValue: formatted,
    waitingForOperand: false,
  };
}
