import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/business/machine';
import { stepInsteadOf } from '../../features/business/route-guard';
import { DomainOkStep } from '../../features/business/steps/domain-ok-step';

export const Route = createFileRoute('/business/domain-ok')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('domain-ok', context.business, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: DomainOkStep,
});
