import { createFileRoute, useLinkProps } from '@tanstack/react-router';
import { AboutPage } from '../features/about/about-page';

function About() {
  return <AboutPage rolesLink={useLinkProps({ to: '/careers' })} />;
}

export const Route = createFileRoute('/about')({ component: About });
