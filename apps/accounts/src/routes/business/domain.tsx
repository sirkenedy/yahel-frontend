import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/business/machine';
import { stepInsteadOf } from '../../features/business/route-guard';
import { DomainStep } from '../../features/business/steps/domain-step';

export const Route = createFileRoute('/business/domain')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('domain', context.business, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: DomainStep,
});
