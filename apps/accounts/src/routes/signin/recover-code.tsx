import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/sign-in/machine';
import { stepInsteadOf } from '../../features/sign-in/route-guard';
import { RecoverCodeStep } from '../../features/sign-in/steps/recover-code-step';

export const Route = createFileRoute('/signin/recover-code')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('recover-code', context.signIn, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: RecoverCodeStep,
});
