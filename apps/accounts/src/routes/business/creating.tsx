import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/business/machine';
import { stepInsteadOf } from '../../features/business/route-guard';
import { CreatingStep } from '../../features/business/steps/creating-step';

export const Route = createFileRoute('/business/creating')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('creating', context.business, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: CreatingStep,
});
