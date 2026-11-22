import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/personal/machine';
import { stepInsteadOf } from '../../features/personal/route-guard';
import { OwnCodeStep } from '../../features/personal/steps/own-code-step';

export const Route = createFileRoute('/personal/own-code')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('own-code', context.personal, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: OwnCodeStep,
});
