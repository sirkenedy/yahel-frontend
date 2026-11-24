import { createFileRoute, redirect } from '@tanstack/react-router';
import { pathOf, stepInsteadOf } from '../../features/admin/route-guard';
import { CodeStep } from '../../features/admin/steps/code-step';

export const Route = createFileRoute('/admin/code')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('code', context.admin, context.facts);
    if (instead) throw redirect({ to: pathOf(instead), replace: true });
  },
  component: CodeStep,
});
