import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NavMenu } from '../index';

const renderMenu = (onChoose = vi.fn()) => {
  render(
    <>
      <NavMenu label="Products">
        {(close) => (
          <>
            <a
              href="#products"
              onClick={() => {
                onChoose('mail');
                close();
              }}
            >
              Mail
            </a>
            <a href="#products">Calendar</a>
          </>
        )}
      </NavMenu>
      <a href="#plans">Plans</a>
    </>,
  );
  return userEvent.setup();
};

const button = () => screen.getByRole('button', { name: 'Products' });
/** The panel is out of reach while it is inert: no pointer, no keyboard, no screen reader. */
const reachable = (name: string) => screen.getByRole('link', { name }).closest('[inert]') === null;

describe('NavMenu', () => {
  it('starts closed, with its links out of reach', () => {
    renderMenu();

    expect(button()).toHaveAttribute('aria-expanded', 'false');
    expect(reachable('Mail')).toBe(false);
    expect(reachable('Calendar')).toBe(false);
  });

  it('opens and closes from its button, which says which state it is in and names the panel it controls', async () => {
    const user = renderMenu();

    await user.click(button());
    expect(button()).toHaveAttribute('aria-expanded', 'true');
    expect(reachable('Mail')).toBe(true);
    expect(document.getElementById(button().getAttribute('aria-controls')!)).toContainElement(screen.getByRole('link', { name: 'Mail' }));

    await user.click(button());
    expect(button()).toHaveAttribute('aria-expanded', 'false');
    expect(reachable('Mail')).toBe(false);
  });

  it('opens from the keyboard, and Tab then reaches its links in order', async () => {
    const user = renderMenu();

    await user.tab();
    await user.keyboard('{Enter}');
    await user.tab();
    expect(screen.getByRole('link', { name: 'Mail' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Calendar' })).toHaveFocus();
    expect(button()).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes on Escape and returns focus to the button', async () => {
    const user = renderMenu();
    await user.click(button());
    await user.tab();

    await user.keyboard('{Escape}');

    expect(button()).toHaveAttribute('aria-expanded', 'false');
    expect(button()).toHaveFocus();
  });

  it('closes when something outside it is pressed, and stays open for a press inside', async () => {
    const user = renderMenu();
    await user.click(button());

    await user.pointer({ keys: '[MouseLeft>]', target: screen.getByRole('link', { name: 'Calendar' }).parentElement! });
    expect(button()).toHaveAttribute('aria-expanded', 'true');

    await user.pointer({ keys: '[MouseLeft>]', target: document.body });
    expect(button()).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes when focus moves on past its last link', async () => {
    const user = renderMenu();
    await user.click(button());

    await user.tab();
    await user.tab();
    await user.tab();

    expect(screen.getByRole('link', { name: 'Plans' })).toHaveFocus();
    expect(button()).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes when a link asks it to', async () => {
    const onChoose = vi.fn();
    const user = renderMenu(onChoose);
    await user.click(button());

    await user.click(screen.getByRole('link', { name: 'Mail' }));

    expect(onChoose).toHaveBeenCalledWith('mail');
    expect(button()).toHaveAttribute('aria-expanded', 'false');
  });

  it('stops listening to the page once it is closed', async () => {
    const remove = vi.spyOn(document, 'removeEventListener');
    const user = renderMenu();
    await user.click(button());

    await user.click(button());

    expect(remove).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    remove.mockRestore();
  });
});
