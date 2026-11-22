import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/personal/machine';
import { stepInsteadOf } from '../../features/personal/route-guard';
import { TypeStep } from '../../features/personal/steps/type-step';

export const Route = createFileRoute('/personal/type')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('type', context.personal, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: TypeStep,
});
