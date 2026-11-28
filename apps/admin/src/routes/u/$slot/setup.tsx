import { createFileRoute } from '@tanstack/react-router';
import { DomainSetup, setupSteps } from '../../../features/workspace/domain-setup';
import type { SetupStep } from '../../../features/workspace/domain-setup';

interface SetupSearch {
  step?: SetupStep;
  domain?: string;
}

const isStep = (value: unknown): value is SetupStep => typeof value === 'string' && (setupSteps as readonly string[]).includes(value);

// Domain setup runs full screen, outside the console's frame.
export const Route = createFileRoute('/u/$slot/setup')({
  validateSearch: (search: Record<string, unknown>): SetupSearch => ({
    step: isStep(search.step) ? search.step : undefined,
    domain: typeof search.domain === 'string' ? search.domain : undefined,
  }),
  component: Setup,
});

function Setup() {
  const { session, workspace, config } = Route.useRouteContext();
  const { slot } = Route.useParams();
  const { step, domain } = Route.useSearch();
  return <DomainSetup key={step ?? 'intro'} session={session} tenantId={workspace.tenantId} slot={slot} step={step ?? 'intro'} domainId={domain} links={config} />;
}
