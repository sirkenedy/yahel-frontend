import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/sign-in/machine';
import { stepInsteadOf } from '../../features/sign-in/route-guard';
import { CodeStep } from '../../features/sign-in/steps/code-step';

export const Route = createFileRoute('/signin/code')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('code', context.signIn, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: CodeStep,
});
