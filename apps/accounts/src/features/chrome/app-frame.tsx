import { BrandMark, FlowButton, FlowIcon, FlowLink, FlowShell } from '@yahel/ui';
import type { ReactNode } from 'react';
import { chromeMessages as m } from './messages';
import { useTheme } from './use-theme';

export interface AppFrameLinks {
  home: string;
  /** Shown as "New to Yahel? Create an account" when given. */
  signUp?: string | null;
  help: string | null;
  privacy: string | null;
  terms: string | null;
}

export interface AppFrameProps {
  links: AppFrameLinks;
  children: ReactNode;
}

/** The frame around every account screen: brand, theme control, the question, and the footer. */
export function AppFrame({ links, children }: AppFrameProps) {
  const { theme, toggle } = useTheme();
  return (
    <FlowShell skipLabel={m.skipToQuestion}>
      <FlowShell.Header
        brand={
          <FlowShell.BrandLink href={links.home} label={m.brandHome}>
            <BrandMark label={m.brand} />
          </FlowShell.BrandLink>
        }
      >
        {links.signUp ? (
          <>
            <span className="ws-flow__prompt">{m.newHere}</span>
            <FlowLink href={links.signUp}>{m.createAccount}</FlowLink>
          </>
        ) : null}
        <FlowButton variant="round" aria-label={theme === 'dark' ? m.switchToLight : m.switchToDark} onPress={toggle}>
          <FlowIcon name={theme === 'dark' ? 'sun' : 'moon'} />
        </FlowButton>
      </FlowShell.Header>
      <FlowShell.Main>
        <FlowShell.Question>{children}</FlowShell.Question>
      </FlowShell.Main>
      <FlowShell.Footer dataLocation={m.dataLocation}>
        <FlowShell.Language label={m.language}>{m.currentLanguage}</FlowShell.Language>
        {links.help ? <FlowShell.FooterLink href={links.help}>{m.help}</FlowShell.FooterLink> : null}
        {links.privacy ? <FlowShell.FooterLink href={links.privacy}>{m.privacy}</FlowShell.FooterLink> : null}
        {links.terms ? <FlowShell.FooterLink href={links.terms}>{m.terms}</FlowShell.FooterLink> : null}
      </FlowShell.Footer>
    </FlowShell>
  );
}
