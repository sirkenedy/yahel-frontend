import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/business/machine';
import { stepInsteadOf } from '../../features/business/route-guard';
import { CheckoutStep } from '../../features/business/steps/checkout-step';

export const Route = createFileRoute('/business/checkout')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('checkout', context.business, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: CheckoutStep,
});
