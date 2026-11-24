import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/business/machine';
import { stepInsteadOf } from '../../features/business/route-guard';
import { PaidStep } from '../../features/business/steps/paid-step';

export const Route = createFileRoute('/business/paid')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('paid', context.business, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: PaidStep,
});
