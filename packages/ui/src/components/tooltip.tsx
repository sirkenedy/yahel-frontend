import { Tooltip as AriaTooltip, TooltipTrigger } from 'react-aria-components';
import type { ReactElement } from 'react';

export interface TooltipProps {
  /** Names the control it belongs to. Sentence case, no full stop. */
  label: string;
  /** One focusable control. */
  children: ReactElement;
}

export function Tooltip({ label, children }: TooltipProps) {
  return (
    <TooltipTrigger>
      {children}
      <AriaTooltip className="ws-tooltip" offset={8}>
        {label}
      </AriaTooltip>
    </TooltipTrigger>
  );
}
