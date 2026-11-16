import React from 'react';

export type ButtonVariant = 'digit' | 'function' | 'operator' | 'equals';

interface KeypadButtonProps {
  label: React.ReactNode;
  ariaLabel: string;
  onClick: () => void;
  variant?: ButtonVariant;
  isActive?: boolean;
  isPressed?: boolean;
  className?: string;
}

export function KeypadButton({
  label,
  ariaLabel,
  onClick,
  variant = 'digit',
  isActive = false,
  isPressed = false,
  className = '',
}: KeypadButtonProps) {
  const baseStyles =
    'relative select-none flex items-center justify-center rounded-2xl min-h-[58px] sm:min-h-[64px] text-xl font-medium transition-all duration-100 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B111C]';

  let variantStyles = '';
  if (variant === 'digit') {
    variantStyles =
      'bg-[#131C2B] text-slate-100 border border-slate-800/80 hover:bg-[#192538] hover:border-slate-700/80 active:scale-[0.96] active:bg-[#1E2C42] font-mono tabular-nums';
  } else if (variant === 'function') {
    variantStyles =
      'bg-[#0E1624] text-slate-300 border border-slate-800/70 hover:bg-[#152134] hover:text-sky-300 hover:border-slate-700/80 active:scale-[0.96]';
  } else if (variant === 'operator') {
    variantStyles = isActive
      ? 'bg-sky-500/25 text-sky-300 border border-sky-400/70 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.2)] active:scale-[0.96]'
      : 'bg-[#101C2E] text-sky-400 border border-sky-900/50 hover:bg-sky-500/15 hover:text-sky-300 hover:border-sky-500/40 active:scale-[0.96]';
  } else if (variant === 'equals') {
    variantStyles =
      'bg-sky-500 text-slate-950 font-semibold border border-sky-400 hover:bg-sky-400 active:scale-[0.97] active:bg-sky-300 shadow-lg shadow-sky-500/20';
  }

  const pressedStyle = isPressed ? 'scale-[0.95] brightness-110 ring-2 ring-sky-400/60' : '';

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles} ${pressedStyle} ${className}`}
    >
      {label}
    </button>
  );
}
