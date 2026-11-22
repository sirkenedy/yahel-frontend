import { useLocation, useRouter } from '@tanstack/react-router';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { PageError, StepError, errorExitFor } from './features/chrome/error-screen';
import { forgetSignUp } from './features/personal/route-guard';

const useRecovery = (reset: () => void) => {
  const router = useRouter();
  const exit = errorExitFor(useLocation({ select: (location) => location.pathname }));
  const onRetry = () => {
    // A screen that failed is not trusted with the password any longer: sign-up starts from its answers
    // again, unless the account already exists and only finishing it is left.
    forgetSignUp(router.options.context.personal, { unlessUnderway: true });
    reset();
    void router.invalidate();
  };
  return { exit, onRetry };
};

/** Shown in place of a step that threw, inside the flow's frame. */
export function StepRouteError({ error, reset }: ErrorComponentProps) {
  return <StepError error={error} {...useRecovery(reset)} />;
}

/** Shown in place of a whole flow, when its layout or its guard threw. */
export function PageRouteError({ error, reset }: ErrorComponentProps) {
  return <PageError error={error} {...useRecovery(reset)} />;
}
