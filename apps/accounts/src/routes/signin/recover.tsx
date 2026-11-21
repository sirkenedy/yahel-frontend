import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/sign-in/machine';
import { stepInsteadOf } from '../../features/sign-in/route-guard';
import { RecoverStep } from '../../features/sign-in/steps/recover-step';

export const Route = createFileRoute('/signin/recover')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('recover', context.signIn, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: RecoverStep,
});
