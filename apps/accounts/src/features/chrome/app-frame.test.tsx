import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { AppFrame } from './app-frame';
import { chromeMessages as m } from './messages';

const links = { home: '/signin', signUp: 'https://yahel.example/create', help: 'https://yahel.example/help', privacy: 'https://yahel.example/privacy', terms: null };

afterEach(() => delete document.documentElement.dataset.theme);

describe('AppFrame', () => {
  it('shows the brand, the question, the data-location promise and only the links it was given', () => {
    render(<AppFrame links={links}>the question</AppFrame>);

    expect(screen.getByRole('link', { name: m.brandHome })).toHaveAttribute('href', '/signin');
    expect(screen.getByRole('main')).toHaveTextContent('the question');
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveTextContent(m.dataLocation);
    expect(within(footer).getByRole('link', { name: m.help })).toHaveAttribute('href', links.help);
    expect(within(footer).getByRole('link', { name: m.privacy })).toHaveAttribute('href', links.privacy);
    expect(within(footer).queryByRole('link', { name: m.terms })).not.toBeInTheDocument();
  });

  it('offers account creation only when there is somewhere to send people', () => {
    const { rerender } = render(<AppFrame links={links}>q</AppFrame>);
    expect(screen.getByRole('link', { name: m.createAccount })).toHaveAttribute('href', links.signUp);

    rerender(<AppFrame links={{ ...links, signUp: null }}>q</AppFrame>);
    expect(screen.queryByRole('link', { name: m.createAccount })).not.toBeInTheDocument();
    expect(screen.queryByText(m.newHere)).not.toBeInTheDocument();
  });

  it('switches between light and dark, naming the control for what it will do', async () => {
    render(<AppFrame links={links}>q</AppFrame>);

    await userEvent.click(screen.getByRole('button', { name: m.switchToDark }));
    expect(document.documentElement.dataset.theme).toBe('dark');

    await userEvent.click(screen.getByRole('button', { name: m.switchToLight }));
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
