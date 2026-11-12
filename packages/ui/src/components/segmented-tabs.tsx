import { useState } from 'react';
import type { ReactNode, Ref } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components';

export interface SegmentedTab<Id extends string> {
  id: Id;
  label: string;
  /** Decoration drawn before the label, for example a dot in a product's colour. It carries no meaning of its own. */
  marker?: ReactNode;
}

export interface SegmentedTabsProps<Id extends string> {
  /** Names the tab list for what it switches, for example "Products". */
  label: string;
  /** Short labels. The first is selected to begin with, unless the caller holds the selection. */
  tabs: readonly SegmentedTab<Id>[];
  /** The selected tab, when something outside the tabs can change it. Leave out to let the tabs hold it. */
  selectedId?: Id;
  onSelectionChange?: (id: Id) => void;
  /** Receives the selected tab's element, so a caller that changes the selection from elsewhere can move focus to it. It follows a change of selection by the next frame. */
  selectedTabRef?: Ref<HTMLDivElement>;
  /** What a tab shows. Every panel stays in the page so they can cross-fade; all but the selected one are inert and hidden. */
  children: (id: Id) => ReactNode;
}

/**
 * A segmented control that switches the view below it: a tab list in a track, with the selected tab raised.
 * One tab stop; the arrow keys move and select, Home and End jump to the ends.
 */
export function SegmentedTabs<Id extends string>({ label, tabs, selectedId, onSelectionChange, selectedTabRef, children }: SegmentedTabsProps<Id>) {
  const [held, setHeld] = useState(tabs[0]?.id);
  const selected = selectedId ?? held;
  return (
    <Tabs
      className="ws-segmented-tabs"
      selectedKey={selected}
      onSelectionChange={(key) => {
        setHeld(key as Id);
        onSelectionChange?.(key as Id);
      }}
    >
      <TabList aria-label={label} className="ws-segmented-tabs__list">
        {tabs.map((tab) => (
          <Tab key={tab.id} id={tab.id} className="ws-segmented-tabs__tab" ref={tab.id === selected ? selectedTabRef : undefined}>
            {tab.marker}
            {tab.label}
          </Tab>
        ))}
      </TabList>
      <div className="ws-segmented-tabs__panels">
        {tabs.map((tab) => (
          <TabPanel key={tab.id} id={tab.id} className="ws-segmented-tabs__panel" shouldForceMount>
            {children(tab.id)}
          </TabPanel>
        ))}
      </div>
    </Tabs>
  );
}
