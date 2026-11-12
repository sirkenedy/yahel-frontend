import { RouterProvider } from '@tanstack/react-router';
import '@yahel/ui/styles.css';
import '@yahel/ui/site.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createSiteRouter } from './router';
import './site.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={createSiteRouter()} />
  </StrictMode>,
);
