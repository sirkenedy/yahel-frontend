import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/business/machine';
import { stepInsteadOf } from '../../features/business/route-guard';
import { DomainQuestionStep } from '../../features/business/steps/domain-question-step';

export const Route = createFileRoute('/business/domain-question')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('domain-question', context.business, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: DomainQuestionStep,
});
