export type AppIconName = 'mail' | 'calendar' | 'drive' | 'docs' | 'sheets' | 'slides' | 'chat' | 'meet' | 'admin';

/**
 * A product's icon tile, drawn from `assets/app-icons`. It is decoration: whatever it sits in carries the name.
 * It fills the inline size its container gives it.
 */
export function AppIcon({ app }: { app: AppIconName }) {
  return <span className="ws-app-icon" data-app={app} aria-hidden="true" />;
}
