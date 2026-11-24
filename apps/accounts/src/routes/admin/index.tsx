import { createFileRoute, redirect } from '@tanstack/react-router';
import { pathOf, stepInsteadOf } from '../../features/admin/route-guard';

export const Route = createFileRoute('/admin/')({
  beforeLoad: ({ context }) => {
    throw redirect({ to: pathOf(stepInsteadOf('phone', context.admin, context.facts) ?? 'phone'), replace: true });
  },
});
