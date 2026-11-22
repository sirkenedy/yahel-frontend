import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/personal/machine';
import { stepInsteadOf } from '../../features/personal/route-guard';
import { CreatingStep } from '../../features/personal/steps/creating-step';

export const Route = createFileRoute('/personal/creating')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('creating', context.personal, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: CreatingStep,
});
