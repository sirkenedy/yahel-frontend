import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/business/machine';
import { stepInsteadOf } from '../../features/business/route-guard';
import { GatewayStep } from '../../features/business/steps/gateway-step';

export const Route = createFileRoute('/business/gateway')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('gateway', context.business, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: GatewayStep,
});
