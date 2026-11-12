import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from 'react-aria-components';
import { afterEach, describe, expect, it } from 'vitest';
import { SegmentedTabs } from '../index';

const teams = [
  { id: 'all', label: 'All' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'design', label: 'Design' },
  { id: 'operations', label: 'Operations' },
] as const;

const renderTabs = () => {
  render(
    <>
      <a href="#before">Before</a>
      <SegmentedTabs label="Team" tabs={teams}>
        {(team) => <a href="#roles">{`Roles in ${team}`}</a>}
      </SegmentedTabs>
    </>,
  );
  return userEvent.setup();
};

const tab = (name: string) => screen.getByRole('tab', { name });
const selected = () => screen.getAllByRole('tab', { selected: true }).map((item) => item.textContent);

describe('SegmentedTabs', () => {
  it('is a tab list named for what it switches, with the first tab selected', () => {
    renderTabs();

    const list = screen.getByRole('tablist', { name: 'Team' });
    expect(within(list).getAllByRole('tab').map((item) => item.textContent)).toEqual(['All', 'Engineering', 'Design', 'Operations']);
    expect(selected()).toEqual(['All']);
    expect(tab('Engineering')).toHaveAttribute('aria-selected', 'false');
  });

  it('shows the panel of the tab that is pressed', async () => {
    const user = renderTabs();

    await user.click(tab('Design'));

    expect(selected()).toEqual(['Design']);
    expect(screen.getByRole('link', { name: 'Roles in design' })).toBeInTheDocument();
  });

  it('labels the panel by its tab', async () => {
    const user = renderTabs();
    expect(screen.getByRole('tabpanel', { name: 'All' })).toContainElement(screen.getByRole('link', { name: 'Roles in all' }));

    await user.click(tab('Operations'));

    expect(screen.getByRole('tabpanel', { name: 'Operations' })).toContainElement(screen.getByRole('link', { name: 'Roles in operations' }));
  });

  it('keeps the panels of the other tabs out of the page', async () => {
    const user = renderTabs();

    await user.click(tab('Engineering'));

    expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual(['Before', 'Roles in engineering']);
  });

  it('is one tab stop: Tab enters at the selected tab and leaves for the panel', async () => {
    const user = renderTabs();
    await user.click(tab('Design'));
    screen.getByRole('link', { name: 'Before' }).focus();

    await user.tab();
    expect(tab('Design')).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('link', { name: 'Roles in design' })).toHaveFocus();
  });

  it('moves and selects with the arrow keys, and wraps at the ends', async () => {
    const user = renderTabs();
    tab('All').focus();

    await user.keyboard('{ArrowRight}');
    expect(selected()).toEqual(['Engineering']);
    expect(tab('Engineering')).toHaveFocus();

    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(selected()).toEqual(['Operations']);
    expect(tab('Operations')).toHaveFocus();
  });

  it('jumps to the ends with Home and End', async () => {
    const user = renderTabs();
    tab('All').focus();

    await user.keyboard('{End}');
    expect(selected()).toEqual(['Operations']);

    await user.keyboard('{Home}');
    expect(selected()).toEqual(['All']);
  });

  describe('direction', () => {
    afterEach(() => document.documentElement.removeAttribute('dir'));

    it('follows the page, not the language of the browser: on a left-to-right page Right goes to the next tab', async () => {
      const user = userEvent.setup();
      render(
        <I18nProvider locale="ar">
          <SegmentedTabs label="Team" tabs={teams}>
            {(team) => team}
          </SegmentedTabs>
        </I18nProvider>,
      );
      tab('All').focus();

      await user.keyboard('{ArrowRight}');

      expect(selected()).toEqual(['Engineering']);
    });

    it('mirrors on a right-to-left page, whatever the language of the browser', async () => {
      document.documentElement.setAttribute('dir', 'rtl');
      const user = userEvent.setup();
      render(
        <I18nProvider locale="en-US">
          <SegmentedTabs label="Team" tabs={teams}>
            {(team) => team}
          </SegmentedTabs>
        </I18nProvider>,
      );
      tab('All').focus();

      await user.keyboard('{ArrowLeft}');

      expect(selected()).toEqual(['Engineering']);
    });

    it('takes up a direction the page is given after it was drawn', async () => {
      const user = renderTabs();
      document.documentElement.setAttribute('dir', 'rtl');
      act(() => tab('All').focus());

      await user.keyboard('{ArrowLeft}');

      expect(selected()).toEqual(['Engineering']);
    });

    it('follows the nearest direction set around it', async () => {
      document.documentElement.setAttribute('dir', 'rtl');
      const user = userEvent.setup();
      render(
        <div dir="ltr">
          <SegmentedTabs label="Team" tabs={teams}>
            {(team) => team}
          </SegmentedTabs>
        </div>,
      );
      tab('All').focus();

      await user.keyboard('{ArrowRight}');

      expect(selected()).toEqual(['Engineering']);
    });
  });

  it('marks a panel as arriving only once the selection has moved', async () => {
    const user = renderTabs();
    expect(screen.getByRole('tabpanel')).not.toHaveAttribute('data-switched');

    await user.click(tab('Engineering'));

    expect(screen.getByRole('tabpanel')).toHaveAttribute('data-switched');
  });
});
