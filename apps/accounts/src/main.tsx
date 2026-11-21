import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import displayFont from '@yahel/ui/assets/fonts/bricolage-grotesque-latin-opsz-normal.woff2?url';
import '@yahel/ui/styles.css';
import '@yahel/ui/daylight.css';
import { StrictMode } from 'react';
import { preload } from 'react-dom';
import { createRoot } from 'react-dom/client';
import './app.css';
import { chromeMessages } from './features/chrome/messages';
import { followSystemThemeColour } from './features/chrome/theme-colour';
import { createAppRouter, queryClient } from './router';
import { loadCapabilities, session } from './session';

// Headlines are the first thing read on every screen, so their font is fetched alongside the script.
preload(displayFont, { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });

followSystemThemeColour();

const root = createRoot(document.getElementById('root')!);

root.render(
  <div className="app-loading" role="status" aria-label={chromeMessages.loading}>
    <div className="ws-skeleton app-loading__bar" />
  </div>,
);

// Restoring the session and loading capabilities do not depend on each other; start both at once.
void Promise.all([loadCapabilities(), session.init()]).then(([loaded]) => {
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={createAppRouter(loaded)} />
      </QueryClientProvider>
    </StrictMode>,
  );
});
