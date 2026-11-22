import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/business/machine';
import { stepInsteadOf } from '../../features/business/route-guard';
import { FindStep } from '../../features/business/steps/find-step';

export const Route = createFileRoute('/business/find')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('find', context.business, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: FindStep,
});
