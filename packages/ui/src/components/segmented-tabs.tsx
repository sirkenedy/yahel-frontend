import { useState } from 'react';
import type { ReactNode } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components';
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
 * A segmented control that switches the view below it: a tab list in a track, with the selected tab raised.
 * One tab stop; the arrow keys move and select, Home and End jump to the ends.
 */
export function SegmentedTabs<Id extends string>({ label, tabs, children }: SegmentedTabsProps<Id>) {
  // A panel arrives with movement only after a switch: the first one is already there when the page is read.
  const [{ selected, switched }, setSelection] = useState<{ selected: Key | undefined; switched: boolean }>({ selected: tabs[0]?.id, switched: false });
  return (
    <Tabs className="ws-segmented-tabs" selectedKey={selected} onSelectionChange={(key) => setSelection((now) => (key === now.selected ? now : { selected: key, switched: true }))}>
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
  );
}
