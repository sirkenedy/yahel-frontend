import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/personal/machine';
import { stepInsteadOf } from '../../features/personal/route-guard';
import { ReviewStep } from '../../features/personal/steps/review-step';

export const Route = createFileRoute('/personal/review')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('review', context.personal, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: ReviewStep,
});
