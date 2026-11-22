import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/personal/machine';
import { stepInsteadOf } from '../../features/personal/route-guard';
import { NameStep } from '../../features/personal/steps/name-step';

export const Route = createFileRoute('/personal/name')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('name', context.personal, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: NameStep,
});
