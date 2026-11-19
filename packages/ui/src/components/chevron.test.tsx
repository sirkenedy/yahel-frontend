import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Chevron } from '../index';

describe('Chevron', () => {
  it('is decoration: it adds nothing to the name of the link it sits in', () => {
    render(
      <a href="#roles">
        View role
        <Chevron />
      </a>,
    );

    const link = screen.getByRole('link', { name: 'View role' });
    expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
