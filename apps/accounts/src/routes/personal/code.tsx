import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/personal/machine';
import { stepInsteadOf } from '../../features/personal/route-guard';
import { CodeStep } from '../../features/personal/steps/code-step';

export const Route = createFileRoute('/personal/code')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('code', context.personal, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: CodeStep,
});
