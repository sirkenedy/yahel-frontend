import tokens from '@yahel/tokens/tokens.json';
import { Tooltip as AriaTooltip, TooltipTrigger } from 'react-aria-components';
import { cloneElement } from 'react';
import type { ReactElement } from 'react';

const toMs = (duration: string) => Number.parseFloat(duration) * (duration.trim().endsWith('ms') ? 1 : 1000);
const hoverDelay = toMs(tokens.scale['duration.hover-delay']);
const offset = Number.parseFloat(tokens.scale['space.8']);

export interface TooltipProps {
  /** The control's name, shown to people who can see it. The control must carry the same text as its accessible name. */
  label: string;
  /** One focusable control. */
  children: ReactElement;
}

/**
 * A name tooltip for an icon-only control. It is the visible form of the control's accessible name.
 * The control is told it has no description, so assistive technology announces the name once, from
 * the control, and not a second time from the tooltip. Do not use this for a description tooltip.
 */
export function Tooltip({ label, children }: TooltipProps) {
  return (
    <TooltipTrigger delay={hoverDelay}>
      {cloneElement(children as ReactElement<{ 'aria-describedby'?: string }>, { 'aria-describedby': '' })}
      <AriaTooltip className="ws-tooltip" placement="bottom" offset={offset}>
        {label}
      </AriaTooltip>
    </TooltipTrigger>
  );
}
