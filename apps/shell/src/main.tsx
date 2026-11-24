import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import '@yahel/ui/styles.css';
import '@yahel/ui/accounts.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './app.css';
import { slotInPath } from './features/account/slot';
import { queryClient, router } from './router';
import { session } from './session';

const root = createRoot(document.getElementById('root')!);

root.render(
  <div className="app-loading" role="status" aria-label="Loading">
    <div className="ws-skeleton app-loading__bar" />
  </div>,
);

// The address names the account (`/u/<slot>/`); with none, the first slot is tried.
void session.init(slotInPath(window.location.pathname) ?? 0).then(() => {
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
});
