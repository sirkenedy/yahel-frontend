import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { I18nProvider, Tab, TabList, TabPanel, Tabs } from 'react-aria-components';
import type { Key } from 'react-aria-components';

export interface SegmentedTab<Id extends string> {
  id: Id;
  label: string;
}

export interface SegmentedTabsProps<Id extends string> {
  /** Names the tab list for what it switches, for example "Team". */
  label: string;
  /** Two to five short labels. The first is selected to begin with. */
  tabs: readonly SegmentedTab<Id>[];
  /** What a tab shows. Only the selected tab's panel is in the page. */
  children: (id: Id) => ReactNode;
}

/**
 * The locale of the page around an element: its language, with the script that reads in its direction. React Aria
 * otherwise takes both from the browser's own language, so the arrow keys would follow the visitor's settings and
 * not the direction the tabs are laid out in.
 */
const pageLocale = (element: Element | null) => {
  const language = element?.closest('[lang]')?.getAttribute('lang') || 'und';
  const script = element?.closest('[dir]')?.getAttribute('dir') === 'rtl' ? 'Arab' : 'Latn';
  return new Intl.Locale(language, { script }).toString();
};

/**
 * A segmented control that switches the view below it: a tab list in a track, with the selected tab raised.
 * One tab stop; the arrow keys move and select, Home and End jump to the ends.
 */
export function SegmentedTabs<Id extends string>({ label, tabs, children }: SegmentedTabsProps<Id>) {
  // A panel arrives with movement only after a switch: the first one is already there when the page is read.
  const [{ selected, switched }, setSelection] = useState<{ selected: Key | undefined; switched: boolean }>({ selected: tabs[0]?.id, switched: false });
  const tabsRef = useRef<HTMLDivElement>(null);
  // Before the page can be read (on the server, and in the first draw) it is taken to read left to right.
  const [locale, setLocale] = useState(() => pageLocale(null));
  // Read when the tabs are drawn, and again whenever focus comes in: that is before any arrow key can be pressed.
  useLayoutEffect(() => {
    const element = tabsRef.current!;
    const followPage = () => setLocale(pageLocale(element));
    followPage();
    element.addEventListener('focusin', followPage);
    return () => element.removeEventListener('focusin', followPage);
  }, []);
  return (
    <I18nProvider locale={locale}>
      <Tabs ref={tabsRef} className="ws-segmented-tabs" selectedKey={selected} onSelectionChange={(key) => setSelection((now) => (key === now.selected ? now : { selected: key, switched: true }))}>
        <TabList aria-label={label} className="ws-segmented-tabs__list">
          {tabs.map((tab) => (
            <Tab key={tab.id} id={tab.id} className="ws-segmented-tabs__tab" data-label={tab.label}>
              {tab.label}
            </Tab>
          ))}
        </TabList>
        {tabs.map((tab) => (
          <TabPanel key={tab.id} id={tab.id} className="ws-segmented-tabs__panel" data-switched={switched ? '' : undefined}>
            {children(tab.id)}
          </TabPanel>
        ))}
      </Tabs>
    </I18nProvider>
  );
}
