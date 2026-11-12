import { createBrowserSession } from '@yahel/auth';

export const session = createBrowserSession(import.meta.env.VITE_API_URL ?? 'http://localhost:3200/api');
