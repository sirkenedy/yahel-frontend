import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LaterPage } from './later-page';

describe('LaterPage', () => {
  it('names the page, what it is for, and that it comes later', () => {
    render(<LaterPage slot="0" page="alerts" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Alert center' })).toBeInTheDocument();
    expect(screen.getByText('Suspicious sign-ins, phishing and other warnings that need a look.')).toBeInTheDocument();
    expect(screen.getByText('Coming in a later version')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Home' })).toHaveAttribute('href', '/u/0/');
  });
});
