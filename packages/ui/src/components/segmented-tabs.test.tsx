import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SegmentedTabs } from '../index';

const tabs = [
  { id: 'mail', label: 'Mail' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'drive', label: 'Drive' },
] as const;
type Id = (typeof tabs)[number]['id'];

const panel = (id: Id) => (
  <>
    <h3>{id} panel</h3>
    <a href="#top">Open {id}</a>
  </>
);

const tab = (name: string) => screen.getByRole('tab', { name });
/** The panels that can be reached: every panel stays in the page, and all but the selected one are inert. */
const reachablePanels = () => screen.getAllByRole('tabpanel', { hidden: true }).filter((element) => !element.hasAttribute('inert'));

describe('SegmentedTabs', () => {
  it('is a named tab list with the first tab selected, and shows only that tab’s panel', () => {
    render(
      <SegmentedTabs label="Products" tabs={tabs}>
        {panel}
      </SegmentedTabs>,
    );

    const list = screen.getByRole('tablist', { name: 'Products' });
    expect(within(list).getAllByRole('tab').map((element) => [element.textContent, element.getAttribute('aria-selected')])).toEqual([
      ['Mail', 'true'],
      ['Calendar', 'false'],
      ['Drive', 'false'],
    ]);
    expect(reachablePanels()).toHaveLength(1);
    expect(within(reachablePanels()[0]!).getByRole('heading', { name: 'mail panel' })).toBeInTheDocument();
  });

  it('draws a marker before a label without changing the tab’s name', () => {
    render(
      <SegmentedTabs label="Products" tabs={[{ id: 'mail', label: 'Mail', marker: <span data-testid="dot" aria-hidden="true" /> }]}>
        {() => null}
      </SegmentedTabs>,
    );

    expect(tab('Mail')).toContainElement(screen.getByTestId('dot'));
    expect(tab('Mail')).toHaveTextContent(/^Mail$/);
  });

  it('selects a pressed tab, reports it, and swaps the panel that can be reached', async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SegmentedTabs label="Products" tabs={tabs} onSelectionChange={onSelectionChange}>
        {panel}
      </SegmentedTabs>,
    );

    await user.click(tab('Calendar'));

    expect(onSelectionChange).toHaveBeenCalledWith('calendar');
    expect(tab('Calendar')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Mail')).toHaveAttribute('aria-selected', 'false');
    expect(reachablePanels()).toHaveLength(1);
    expect(within(reachablePanels()[0]!).getByRole('link', { name: 'Open calendar' })).toBeInTheDocument();
  });

  it('labels each panel by its tab', async () => {
    const user = userEvent.setup();
    render(
      <SegmentedTabs label="Products" tabs={tabs}>
        {panel}
      </SegmentedTabs>,
    );

    await user.click(tab('Drive'));

    expect(reachablePanels()[0]).toHaveAttribute('aria-labelledby', tab('Drive').id);
    expect(tab('Drive')).toHaveAttribute('aria-controls', reachablePanels()[0]!.id);
  });

  it('is one tab stop: arrow keys move and select, Home and End jump to the ends, and Tab leaves the list', async () => {
    const user = userEvent.setup();
    render(
      <SegmentedTabs label="Products" tabs={tabs}>
        {panel}
      </SegmentedTabs>,
    );

    await user.tab();
    expect(tab('Mail')).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(tab('Calendar')).toHaveFocus();
    expect(tab('Calendar')).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{End}');
    expect(tab('Drive')).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{Home}');
    expect(tab('Mail')).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowLeft}');
    expect(tab('Drive')).toHaveAttribute('aria-selected', 'true');

    // Which panel Tab lands in is the browser's doing (inert); the browser tests cover it.
    await user.tab();
    expect(screen.getAllByRole('tab').some((element) => element === document.activeElement)).toBe(false);
  });

  it('follows a selection held by the caller, and hands over the selected tab so focus can be moved to it', async () => {
    function Held() {
      const [selected, setSelected] = useState<Id>('mail');
      const selectedTab = useRef<HTMLDivElement>(null);
      return (
        <>
          <button
            type="button"
            onClick={() => {
              setSelected('drive');
              requestAnimationFrame(() => selectedTab.current?.focus());
            }}
          >
            Show Drive
          </button>
          <SegmentedTabs label="Products" tabs={tabs} selectedId={selected} onSelectionChange={setSelected} selectedTabRef={selectedTab}>
            {panel}
          </SegmentedTabs>
        </>
      );
    }
    const user = userEvent.setup();
    render(<Held />);

    await user.click(screen.getByRole('button', { name: 'Show Drive' }));

    expect(tab('Drive')).toHaveAttribute('aria-selected', 'true');
    await vi.waitFor(() => expect(tab('Drive')).toHaveFocus());

    await user.click(tab('Calendar'));
    expect(tab('Calendar')).toHaveAttribute('aria-selected', 'true');
  });
});
