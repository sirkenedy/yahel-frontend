import { createFileRoute } from '@tanstack/react-router';
import { CareersPage } from '../features/careers/careers-page';

export const Route = createFileRoute('/careers')({ component: CareersPage });
