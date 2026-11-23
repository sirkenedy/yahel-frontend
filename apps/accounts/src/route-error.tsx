import { useLocation, useRouter } from '@tanstack/react-router';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { PageError, StepError, errorExitFor } from './features/chrome/error-screen';
import { forgetAdmin } from './features/admin/route-guard';
import type { AdminStore } from './features/admin/store';
import { forgetWorkspace } from './features/business/route-guard';
import type { BusinessStore } from './features/business/store';
import { forgetSignUp } from './features/personal/route-guard';
import type { PersonalStore } from './features/personal/store';

/**
 * A screen that failed is not trusted with the password any longer: either sign-up starts from its answers
 * again, unless the account or the workspace already exists and only finishing it is left, and the admin
 * flow forgets everything (its guards pick up from what the server says).
 */
export const forgetOnRetry = ({ personal, business, admin }: { personal: PersonalStore; business: BusinessStore; admin: AdminStore }) => {
  forgetSignUp(personal, { unlessUnderway: true });
  forgetWorkspace(business, { unlessUnderway: true });
  forgetAdmin(admin);
};

const useRecovery = (reset: () => void) => {
  const router = useRouter();
  const exit = errorExitFor(useLocation({ select: (location) => location.pathname }));
  const onRetry = () => {
    forgetOnRetry(router.options.context);
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
