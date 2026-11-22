import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/personal/machine';
import { stepInsteadOf } from '../../features/personal/route-guard';
import { AddressStep } from '../../features/personal/steps/address-step';

export const Route = createFileRoute('/personal/address')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('address', context.personal, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: AddressStep,
});
