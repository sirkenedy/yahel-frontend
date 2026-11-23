import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/business/machine';
import { stepInsteadOf } from '../../features/business/route-guard';
import { RegistrantStep } from '../../features/business/steps/registrant-step';

export const Route = createFileRoute('/business/registrant')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('registrant', context.business, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: RegistrantStep,
});
