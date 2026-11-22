import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/personal/machine';
import { stepInsteadOf } from '../../features/personal/route-guard';
import { RecoveryStep } from '../../features/personal/steps/recovery-step';

export const Route = createFileRoute('/personal/recovery')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('recovery', context.personal, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: RecoveryStep,
});
