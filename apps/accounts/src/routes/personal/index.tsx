import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/personal/machine';
import { stepInsteadOf } from '../../features/personal/route-guard';

export const Route = createFileRoute('/personal/')({
  beforeLoad: ({ context }) => {
    throw redirect({ to: stepPath(stepInsteadOf('type', context.personal, context.facts) ?? 'type'), replace: true });
  },
});
