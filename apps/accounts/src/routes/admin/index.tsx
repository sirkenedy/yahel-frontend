import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/admin/machine';
import { stepInsteadOf } from '../../features/admin/route-guard';

export const Route = createFileRoute('/admin/')({
  beforeLoad: ({ context }) => {
    throw redirect({ to: stepPath(stepInsteadOf('signin', context.admin, context.facts) ?? 'signin'), replace: true });
  },
});
