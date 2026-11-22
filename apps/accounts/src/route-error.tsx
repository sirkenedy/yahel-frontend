import { useRouter } from '@tanstack/react-router';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { PageError, StepError } from './error-screen';

const useRetry = (reset: () => void) => {
  const router = useRouter();
  return () => {
    reset();
    void router.invalidate();
  };
};

/** Shown in place of a step that threw, inside the flow's frame. */
export function StepRouteError({ error, reset }: ErrorComponentProps) {
  return <StepError error={error} onRetry={useRetry(reset)} />;
}

/** Shown in place of a whole flow, when its layout or its guard threw. */
export function PageRouteError({ error, reset }: ErrorComponentProps) {
  return <PageError error={error} onRetry={useRetry(reset)} />;
}
