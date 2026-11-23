import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/business/machine';
import { stepInsteadOf } from '../../features/business/route-guard';
import { StartStep } from '../../features/business/steps/start-step';

export const Route = createFileRoute('/business/start')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('start', context.business, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: StartStep,
});
