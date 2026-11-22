import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/business/machine';
import { stepInsteadOf } from '../../features/business/route-guard';
import { CardCodeStep } from '../../features/business/steps/card-code-step';

export const Route = createFileRoute('/business/card-code')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('card-code', context.business, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: CardCodeStep,
});
