import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/sign-in/machine';
import { stepInsteadOf } from '../../features/sign-in/route-guard';
import { HelpSentStep } from '../../features/sign-in/steps/help-sent-step';

export const Route = createFileRoute('/signin/help-sent')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('help-sent', context.signIn, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: HelpSentStep,
});
