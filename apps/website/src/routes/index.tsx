import { createFileRoute } from '@tanstack/react-router';
import { signInUrl } from '../config';
import { HomeHero } from '../features/home/home-hero';

export const Route = createFileRoute('/')({ component: () => <HomeHero signInUrl={signInUrl} /> });
