import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/admin/machine';
import { stepInsteadOf } from '../../features/admin/route-guard';
import { CodeStep } from '../../features/admin/steps/code-step';

export const Route = createFileRoute('/admin/code')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('code', context.admin, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: CodeStep,
});
