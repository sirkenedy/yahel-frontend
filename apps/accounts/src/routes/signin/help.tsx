import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/sign-in/machine';
import { stepInsteadOf } from '../../features/sign-in/route-guard';
import { HelpStep } from '../../features/sign-in/steps/help-step';

export const Route = createFileRoute('/signin/help')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('help', context.signIn, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: HelpStep,
});
