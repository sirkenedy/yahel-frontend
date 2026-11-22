import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/personal/machine';
import { stepInsteadOf } from '../../features/personal/route-guard';
import { ContactStep } from '../../features/personal/steps/contact-step';

export const Route = createFileRoute('/personal/contact')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('contact', context.personal, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: ContactStep,
});
