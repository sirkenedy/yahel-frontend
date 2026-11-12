import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LinkButton } from '../index';

describe('LinkButton', () => {
  it.each(['filled', 'inverse', 'plain'] as const)('is a link named by its text in the %s variant', (variant) => {
    render(
      <LinkButton href="https://app.yahel.example/sign-in" variant={variant}>
        Create account
      </LinkButton>,
    );

    const link = screen.getByRole('link', { name: 'Create account' });
    expect(link).toHaveAttribute('href', 'https://app.yahel.example/sign-in');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('keeps the arrow of a plain link out of its name', () => {
    render(
      <LinkButton href="#accounts" variant="plain">
        Set up your business
      </LinkButton>,
    );

    const link = screen.getByRole('link', { name: 'Set up your business' });
    expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('passes link attributes through', () => {
    render(
      <LinkButton href="/careers" size="large" aria-current="page">
        See open roles
      </LinkButton>,
    );

    expect(screen.getByRole('link', { name: 'See open roles' })).toHaveAttribute('aria-current', 'page');
  });
});
