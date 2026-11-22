import type { FlowDirection } from '@yahel/ui';
import { useState } from 'react';

/**
 * Which way the person moved to reach the step on screen, and how many steps they have seen. Derived
 * during render when the step changes, so a request can tell the visit it began in from a later one.
 */
export function useStepTravel<Step>(step: Step, directionOf: (from: Step, to: Step) => FlowDirection) {
  const [travel, setTravel] = useState<{ step: Step; direction: FlowDirection; visit: number }>({ step, direction: 'forward', visit: 0 });
  if (travel.step !== step) setTravel({ step, direction: directionOf(travel.step, step), visit: travel.visit + 1 });
  return travel;
}
