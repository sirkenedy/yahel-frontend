import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/sign-in/machine';
import { stepInsteadOf } from '../../features/sign-in/route-guard';
import { DoneStep } from '../../features/sign-in/steps/done-step';

export const Route = createFileRoute('/signin/done')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('done', context.signIn, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: DoneStep,
});
