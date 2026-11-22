import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/personal/machine';
import { stepInsteadOf } from '../../features/personal/route-guard';
import { BirthStep } from '../../features/personal/steps/birth-step';

export const Route = createFileRoute('/personal/birth')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('birth', context.personal, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: BirthStep,
});
