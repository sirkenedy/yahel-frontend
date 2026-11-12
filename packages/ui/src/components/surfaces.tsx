import type { HTMLAttributes, ReactNode } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={['ws-card', className].filter(Boolean).join(' ')} />;
}

export type BannerTone = 'neutral' | 'warning' | 'danger';

export interface BannerProps {
  tone?: BannerTone;
  children: ReactNode;
}

export function Banner({ tone = 'neutral', children }: BannerProps) {
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={['ws-banner', tone !== 'neutral' && `ws-banner--${tone}`].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

export interface AvatarProps {
  name: string;
  /** People are circles; organisations are rounded squares. */
  kind?: 'person' | 'organisation';
  src?: string | null;
}

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export function Avatar({ name, kind = 'person', src }: AvatarProps) {
  return (
    <span className={['ws-avatar', kind === 'organisation' && 'ws-avatar--organisation'].filter(Boolean).join(' ')} role="img" aria-label={name}>
      {src ? <img src={src} alt="" width="100%" height="100%" /> : initials(name)}
    </span>
  );
}
