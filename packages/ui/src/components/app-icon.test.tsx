import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppIcon } from '../index';

describe('AppIcon', () => {
  it('is decoration for the product it is asked for: whatever holds it carries the name', () => {
    const { container } = render(
      <a href="#products" aria-label="Mail">
        <AppIcon app="mail" />
      </a>,
    );
    const icon = container.querySelector('[data-app]')!;

    expect(icon).toHaveAttribute('data-app', 'mail');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toBeEmptyDOMElement();
  });
});
