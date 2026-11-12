import tokens from '@yahel/tokens/tokens.json';
import { Tooltip as AriaTooltip, TooltipTrigger } from 'react-aria-components';
import type { ReactElement } from 'react';

const hoverDelay = Number.parseInt(tokens.scale['duration.hover-delay'], 10);

export interface TooltipProps {
  /** Names the control it belongs to. Sentence case, no full stop. */
  label: string;
  /** One focusable control. */
  children: ReactElement;
}

export function Tooltip({ label, children }: TooltipProps) {
  return (
    <TooltipTrigger delay={hoverDelay}>
      {children}
      <AriaTooltip className="ws-tooltip" offset={8}>
        {label}
      </AriaTooltip>
    </TooltipTrigger>
  );
}
