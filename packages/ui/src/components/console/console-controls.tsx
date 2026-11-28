import { Button, Menu, MenuItem, MenuTrigger, Popover, Text } from 'react-aria-components';
import { useEffect, useRef, useState } from 'react';
import type { ButtonProps } from 'react-aria-components';
import type { ReactNode } from 'react';
import { FlowIcon } from '../flow/flow-icon';
import type { FlowIconName } from '../flow/flow-icon';

export interface SelectBoxProps {
  /** Names what ticking it selects: "Select Kofi Mensah". */
  label: string;
  isSelected: boolean;
  /** Some but not all of what it stands for are selected. */
  isIndeterminate?: boolean;
  onChange: (isSelected: boolean) => void;
  isDisabled?: boolean;
}

/** A box that selects a row, or every row when some are already selected. */
export function SelectBox({ label, isSelected, isIndeterminate = false, onChange, isDisabled }: SelectBoxProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = isIndeterminate;
  }, [isIndeterminate]);
  return (
    <label className="ws-console-select">
      <input ref={ref} type="checkbox" aria-label={label} checked={isSelected} disabled={isDisabled} onChange={(event) => onChange(event.target.checked)} />
      <span className="ws-console-select__box" aria-hidden="true">
        <FlowIcon name="check" />
      </span>
    </label>
  );
}

export interface UnitTreeUnit {
  id: string;
  name: string;
  /** The unit it sits in; `null` for the organisation itself. */
  parentId: string | null;
  /** How many people are in it and the units inside it. */
  count?: number;
}

export interface UnitTreeProps {
  label: string;
  units: readonly UnitTreeUnit[];
  /** `one`: picking a unit replaces the choice. `several`: each unit is ticked on its own. */
  mode: 'one' | 'several';
  selected: readonly string[];
  onChange: (selected: string[]) => void;
  /** Names the button that folds a unit away or opens it again. */
  toggleLabel: (name: string, isOpen: boolean) => string;
  /** Text after a unit's name, such as "Now" for the unit someone is in. */
  note?: (unit: UnitTreeUnit) => ReactNode;
}

/** The organisation's units as a tree: each unit can be folded away, and picked alone or with others. */
export function UnitTree({ label, units, mode, selected, onChange, toggleLabel, note }: UnitTreeProps) {
  const [closed, setClosed] = useState<ReadonlySet<string>>(new Set());
  const ids = new Set(units.map((unit) => unit.id));
  const childrenOf = (parentId: string | null) => units.filter((unit) => (unit.parentId && ids.has(unit.parentId) ? unit.parentId : null) === parentId);
  const pick = (id: string) => {
    if (mode === 'one') return onChange([id]);
    onChange(selected.includes(id) ? selected.filter((one) => one !== id) : [...selected, id]);
  };

  const rows = (parentId: string | null, depth: number): ReactNode[] =>
    childrenOf(parentId).flatMap((unit) => {
      const inside = childrenOf(unit.id);
      const isOpen = !closed.has(unit.id);
      const isPicked = selected.includes(unit.id);
      return [
        <div key={unit.id} className="ws-console-tree__row" style={{ paddingInlineStart: `calc(var(--ws-space-16) * ${depth})` }}>
          {inside.length ? (
            <Button
              className="ws-console-tree__toggle"
              aria-expanded={isOpen}
              aria-label={toggleLabel(unit.name, isOpen)}
              onPress={() => {
                const next = new Set(closed);
                if (isOpen) next.add(unit.id);
                else next.delete(unit.id);
                setClosed(next);
              }}
            >
              <FlowIcon name="chevron-down" />
            </Button>
          ) : (
            <span className="ws-console-tree__spacer" />
          )}
          <button type="button" role={mode === 'one' ? 'radio' : 'checkbox'} aria-checked={isPicked} className="ws-console-tree__unit" data-multi={mode === 'several' || undefined} onClick={() => pick(unit.id)}>
            <span className="ws-console-tree__mark" aria-hidden="true">
              <FlowIcon name="check" />
            </span>
            <span className="ws-console-tree__name">{unit.name}</span>
            {note?.(unit)}
            {unit.count === undefined ? null : <span className="ws-console-tree__count">{unit.count}</span>}
          </button>
        </div>,
        ...(isOpen ? rows(unit.id, depth + 1) : []),
      ];
    });

  return (
    <div className="ws-console-tree" role={mode === 'one' ? 'radiogroup' : 'group'} aria-label={label}>
      {rows(null, 0)}
    </div>
  );
}

export interface FilterChipProps {
  /** The visible text: the unit or value being filtered by. */
  children: ReactNode;
  /** Said after the visible text, out of view: "stop filtering". */
  removeLabel: string;
  onRemove: () => void;
}

/** One active filter, removed by pressing it. */
export const FilterChip = ({ children, removeLabel, onRemove }: FilterChipProps) => (
  <Button className="ws-console-filter-chip" onPress={onRemove}>
    {children}
    <span className="ws-console-hidden">, {removeLabel}</span>
    <FlowIcon name="close" />
  </Button>
);

export interface BulkBarProps {
  /** Names the bar: "Actions for the selected people". */
  label: string;
  /** "2 people selected". */
  count: string;
  clearLabel: string;
  onClear: () => void;
  children: ReactNode;
}

/** What can be done to the selected rows, shown while any are selected. */
export const BulkBar = ({ label, count, clearLabel, onClear, children }: BulkBarProps) => (
  <div className="ws-console-bulk" role="toolbar" aria-label={label}>
    <span className="ws-console-bulk__count" aria-live="polite">
      {count}
    </span>
    {children}
    <Button className="ws-console-bulk__button ws-console-bulk__clear" aria-label={clearLabel} onPress={onClear}>
      <FlowIcon name="close" />
    </Button>
  </div>
);

/** A button in the selection bar. */
export const BulkButton = ({ children, ...props }: Omit<ButtonProps, 'className' | 'children'> & { children: ReactNode }) => (
  <Button {...props} className="ws-console-bulk__button">
    {children}
  </Button>
);

export interface ConsoleMenuItem {
  id: string;
  label: string;
  /** One line under the label. */
  detail?: string;
  isDisabled?: boolean;
}

export interface ConsoleMenuProps {
  /** The button's text. */
  label: string;
  icon?: FlowIconName;
  items: readonly ConsoleMenuItem[];
  onAction: (id: string) => void;
  /** `bulk`: a button in the selection bar. `quiet`: an outlined page action. */
  look?: 'quiet' | 'bulk';
  isDisabled?: boolean;
}

/** A button that opens a short list of choices. */
export function ConsoleMenu({ label, icon, items, onAction, look = 'quiet', isDisabled }: ConsoleMenuProps) {
  return (
    <MenuTrigger>
      <Button className={look === 'bulk' ? 'ws-console-bulk__button' : 'ws-flow-button ws-flow-button--quiet'} isDisabled={isDisabled}>
        {icon ? <FlowIcon name={icon} /> : null}
        {label}
        <FlowIcon name="chevron-down" />
      </Button>
      <Popover className="ws-console-menu" placement="bottom end">
        <Menu className="ws-console-menu__list" onAction={(key) => onAction(String(key))} disabledKeys={items.filter((item) => item.isDisabled).map((item) => item.id)}>
          {items.map((item) => (
            <MenuItem key={item.id} id={item.id} className="ws-console-menu__item" textValue={item.label}>
              <Text slot="label" className="ws-console-menu__text">
                <span>{item.label}</span>
                {item.detail ? <span className="ws-console-menu__detail">{item.detail}</span> : null}
              </Text>
            </MenuItem>
          ))}
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}
