import { ComboBox, Input, Label, ListBox, ListBoxItem, Popover, Text } from 'react-aria-components';
import { useState } from 'react';
import type { Key } from 'react-aria-components';
import { FlowIcon } from '../flow/flow-icon';

/** Something the search can jump to: a page, or a person. */
export interface ConsoleSearchItem {
  id: string;
  label: string;
  /** Where it is, or what it is: "Directory › Users". */
  detail?: string;
  /** Extra words that should find it, such as an address. */
  keywords?: string;
}

export interface ConsoleSearchProps {
  /** For assistive technology: "Search the Admin console". */
  label: string;
  placeholder: string;
  items: readonly ConsoleSearchItem[];
  /** Said in the list when nothing matches. */
  emptyLabel: string;
  onSelect: (id: string) => void;
}

const normalise = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

/** The bar's search: type, then pick a page or a person to go there. It searches only what the console already holds. */
export function ConsoleSearch({ label, placeholder, items, emptyLabel, onSelect }: ConsoleSearchProps) {
  const [query, setQuery] = useState('');
  const words = normalise(query).split(/\s+/).filter(Boolean);
  const matches = words.length ? items.filter((item) => words.every((word) => normalise(`${item.label} ${item.detail ?? ''} ${item.keywords ?? ''}`).includes(word))).slice(0, 8) : [];

  const choose = (key: Key | null) => {
    if (key === null) return;
    setQuery('');
    onSelect(String(key));
  };

  return (
    <ComboBox className="ws-console-search" inputValue={query} onInputChange={setQuery} onSelectionChange={choose} selectedKey={null} items={matches} menuTrigger="input" allowsEmptyCollection>
      <Label className="ws-flow-hidden">{label}</Label>
      <div className="ws-console-search__field">
        <FlowIcon name="search" />
        <Input className="ws-console-search__input" placeholder={placeholder} />
      </div>
      <Popover className="ws-console-search__panel" placement="bottom start" offset={8} isNonModal>
        <ListBox<ConsoleSearchItem> className="ws-console-search__list" renderEmptyState={() => <p className="ws-console-search__empty">{emptyLabel}</p>}>
          {(item) => (
            <ListBoxItem id={item.id} textValue={item.label} className="ws-console-search__option">
              <Text slot="label" className="ws-console-search__name">
                {item.label}
              </Text>
              {item.detail ? (
                <Text slot="description" className="ws-console-search__detail">
                  {item.detail}
                </Text>
              ) : null}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </ComboBox>
  );
}
