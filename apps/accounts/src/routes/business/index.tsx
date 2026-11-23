import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/business/machine';
import { forgetWorkspace, stepInsteadOf } from '../../features/business/route-guard';

export const Route = createFileRoute('/business/')({
  beforeLoad: ({ context }) => {
    // The entry address is where sign-up starts: arriving here begins again, unless a workspace has already been made.
    forgetWorkspace(context.business, { unlessUnderway: true });
    throw redirect({ to: stepPath(stepInsteadOf('start', context.business, context.facts) ?? 'start'), replace: true });
  },
});
