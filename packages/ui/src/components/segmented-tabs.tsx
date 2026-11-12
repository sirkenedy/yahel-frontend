import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode, Ref } from 'react';
import { I18nProvider, Tab, TabList, TabPanel, Tabs } from 'react-aria-components';

export interface SegmentedTab<Id extends string> {
  id: Id;
  label: string;
  /** Decoration drawn before the label, for example a dot in a product's colour. It carries no meaning of its own. */
  marker?: ReactNode;
}

export interface SegmentedTabsProps<Id extends string> {
  /** Names the tab list for what it switches, for example "Team". */
  label: string;
  /** Short labels. The first is selected to begin with, unless the caller holds the selection. */
  tabs: readonly SegmentedTab<Id>[];
  /** The selected tab, when something outside the tabs can change it. Leave out to let the tabs hold it. */
  selectedId?: Id;
  onSelectionChange?: (id: Id) => void;
  /** Receives the selected tab's element, so a caller that changes the selection from elsewhere can move focus to it. It follows a change of selection by the next frame. */
  selectedTabRef?: Ref<HTMLDivElement>;
  /**
   * Keeps every panel in the page, so the outgoing one fades under the incoming one; all but the selected are inert
   * and hidden. Without it only the selected tab's panel is in the page, and it arrives with movement after a switch.
   */
  crossFade?: boolean;
  /** What a tab shows. */
  children: (id: Id) => ReactNode;
}

/**
 * The locale of the page around an element: its language, with the script that reads in its direction. React Aria
 * otherwise takes both from the browser's own language, so the arrow keys would follow the visitor's settings and
 * not the direction the tabs are laid out in. A language tag that cannot be read counts as no language at all.
 */
const pageLocale = (element: Element | null) => {
  const script = element?.closest('[dir]')?.getAttribute('dir') === 'rtl' ? 'Arab' : 'Latn';
  try {
    return new Intl.Locale(element?.closest('[lang]')?.getAttribute('lang') || 'und', { script }).toString();
  } catch {
    return new Intl.Locale('und', { script }).toString();
  }
};

/**
 * A segmented control that switches the view below it: a tab list in a track, with the selected tab raised.
 * One tab stop; the arrow keys move and select, Home and End jump to the ends.
 */
export function SegmentedTabs<Id extends string>({ label, tabs, selectedId, onSelectionChange, selectedTabRef, crossFade = false, children }: SegmentedTabsProps<Id>) {
  // A panel arrives with movement only after a switch: the first one is already there when the page is read.
  const [{ held, switched }, setSelection] = useState<{ held: Id | undefined; switched: boolean }>({ held: tabs[0]?.id, switched: false });
  const selected = selectedId ?? held;
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
  const panels = tabs.map((tab) => (
    <TabPanel key={tab.id} id={tab.id} className="ws-segmented-tabs__panel" shouldForceMount={crossFade} data-switched={switched && !crossFade ? '' : undefined}>
      {children(tab.id)}
    </TabPanel>
  ));
  return (
    <I18nProvider locale={locale}>
      <Tabs
        ref={tabsRef}
        className="ws-segmented-tabs"
        selectedKey={selected}
        onSelectionChange={(key) => {
          if (key === selected) return;
          setSelection({ held: key as Id, switched: true });
          onSelectionChange?.(key as Id);
        }}
      >
        <TabList aria-label={label} className="ws-segmented-tabs__list">
          {tabs.map((tab) => (
            <Tab key={tab.id} id={tab.id} className="ws-segmented-tabs__tab" data-label={tab.label} data-marked={tab.marker ? '' : undefined} ref={tab.id === selected ? selectedTabRef : undefined}>
              {tab.marker}
              {tab.label}
            </Tab>
          ))}
        </TabList>
        {crossFade ? <div className="ws-segmented-tabs__panels">{panels}</div> : panels}
      </Tabs>
    </I18nProvider>
  );
}
