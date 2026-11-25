import { useEffect, useId, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, ReactNode, Ref } from 'react';
import { FlowIcon } from './flow-icon';

export interface FlowSearchSelectItem {
  id: string;
  /** The name in the list. */
  label: string;
  /** Before the name, such as a flag. Decorative in the list, where the name says it. */
  leading?: ReactNode;
  /** Muted, after the name: an ISO code or a dialling code. */
  detail?: string;
  /** What the closed field shows after `leading`; the label when not given. */
  display?: string;
  /** Everything a search matches, such as the name, ISO code and dialling code; the label when not given. */
  textValue?: string;
}

export interface FlowSearchSelectProps {
  /** Always visible. */
  label: string;
  items: readonly FlowSearchSelectItem[];
  /** The chosen item's id, or `''` for none. */
  value: string;
  onChange: (id: string) => void;
  /** Shown, muted, while nothing is chosen. */
  placeholder: string;
  /** The search field's accessible name, such as "Search country". */
  searchLabel: string;
  /** The search field's visible placeholder, such as "Search". */
  searchPlaceholder: string;
  /** Said in the list when nothing matches. */
  emptyText: string;
  /** Says what is wrong and how to fix it. Setting it marks the field invalid. */
  error?: string;
  /** The value is personal: it is blurred, unless focused, while the shell is hiding private details. */
  isSensitive?: boolean;
  /** The trigger, for moving focus to the field when it needs attention. */
  inputRef?: Ref<HTMLButtonElement>;
}

const folded = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/**
 * A choice from a long list, the size and shape of a flow field. It opens a compact panel under the field with a
 * search at the top; the list scrolls inside it, so it never fills the page the way a platform list of hundreds does.
 * Written with no overlay library: the general-purpose select, popover and list cost several times this app's budget.
 */
export function FlowSearchSelect({ label, items, value, onChange, placeholder, searchLabel, searchPlaceholder, emptyText, error, isSensitive, inputRef }: FlowSearchSelectProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [alignEnd, setAlignEnd] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(inputRef, () => triggerRef.current as HTMLButtonElement, []);

  const keyed = useMemo(() => items.map((item) => ({ item, key: folded(item.textValue ?? item.label) })), [items]);
  const shown = useMemo(() => {
    const wanted = folded(query.trim());
    return wanted ? keyed.filter(({ key }) => key.includes(wanted)).map(({ item }) => item) : items;
  }, [keyed, items, query]);
  const chosen = items.find((item) => item.id === value);
  const optionId = (item: FlowSearchSelectItem) => `${id}o${item.id}`;
  const activeItem = open ? shown[active] : undefined;
  const activeId = activeItem ? optionId(activeItem) : undefined;

  const show = (typed = '') => {
    setQuery(typed);
    setActive(typed ? 0 : Math.max(0, items.findIndex((item) => item.id === value)));
    setAlignEnd(false);
    setOpen(true);
  };
  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };
  const pick = (item: FlowSearchSelectItem | undefined) => {
    if (!item) return;
    onChange(item.id);
    close(true);
  };

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  // A field near the inline end of a narrow screen opens its panel toward the start, so it never runs off the screen.
  useLayoutEffect(() => {
    searchRef.current?.focus();
    const box = open ? panelRef.current?.getBoundingClientRect() : undefined;
    if (box && (box.right > document.documentElement.clientWidth || box.left < 0)) setAlignEnd(true);
  }, [open]);

  useEffect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView?.({ block: 'nearest' });
  }, [activeId]);

  const onTriggerKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      show();
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      show(event.key);
    }
  };

  const onListKey = (event: KeyboardEvent<HTMLElement>) => {
    const last = shown.length - 1;
    const moves: Record<string, number> = { ArrowDown: Math.min(active + 1, last), ArrowUp: Math.max(active - 1, 0), PageDown: Math.min(active + 6, last), PageUp: Math.max(active - 6, 0), Home: 0, End: last };
    if (event.key in moves) {
      event.preventDefault();
      setActive(Math.max(0, moves[event.key] ?? 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      pick(activeItem);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    } else if (event.key === 'Tab') {
      close(false);
    }
  };

  // One handler for the whole list rather than one per row: there can be hundreds.
  const rowOf = (event: MouseEvent<HTMLElement>) => Number((event.target as HTMLElement).closest<HTMLElement>('[data-index]')?.dataset.index ?? -1);
  const hover = (event: MouseEvent<HTMLElement>) => {
    const row = rowOf(event);
    if (row >= 0 && row !== active) setActive(row);
  };

  return (
    <div ref={rootRef} className="ws-flow-field ws-flow-search-select" data-invalid={error ? true : undefined} data-sensitive={isSensitive || undefined}>
      <span id={`${id}l`} className="ws-flow-field__label">
        {label}
      </span>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        role="combobox"
        className="ws-flow-search-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}x` : undefined}
        aria-labelledby={`${id}l ${id}v`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}e` : undefined}
        onClick={() => (open ? close(false) : show())}
        onKeyDown={onTriggerKey}
      >
        <span id={`${id}v`} className="ws-flow-search-select__value" data-placeholder={chosen ? undefined : true}>
          {chosen ? (
            <>
              {chosen.leading}
              {chosen.leading ? ' ' : null}
              {chosen.display ?? chosen.label}
            </>
          ) : (
            placeholder
          )}
        </span>
        <FlowIcon name="chevron-down" />
      </button>
      {open ? (
        <div ref={panelRef} className="ws-flow-search-select__panel" data-align={alignEnd ? 'end' : undefined}>
          <div className="ws-flow-search-select__search">
            <FlowIcon name="search" />
            <input
              className="ws-flow-search-select__input"
              type="text"
              ref={searchRef}
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="done"
              placeholder={searchPlaceholder}
              aria-label={searchLabel}
              aria-controls={`${id}x`}
              aria-activedescendant={activeId}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onListKey}
            />
          </div>
          <ul id={`${id}x`} role="listbox" className="ws-flow-search-select__list" aria-labelledby={`${id}l`} tabIndex={-1} hidden={shown.length === 0} onKeyDown={onListKey} onMouseDown={(event) => event.preventDefault()} onPointerMove={hover} onClick={(event) => pick(shown[rowOf(event)])}>
            {shown.map((item, index) => (
              <li
                key={item.id}
                id={optionId(item)}
                role="option"
                className="ws-flow-search-select__option"
                aria-selected={item.id === value}
                data-index={index}
                data-active={index === active || undefined}
              >
                {item.leading ? <span aria-hidden="true">{item.leading}</span> : null}
                <span className="ws-flow-search-select__name">{item.label}</span>
                {/* The space keeps the name and detail apart when read out; a flex row does not draw it. */}
                {item.detail ? <> <span className="ws-flow-search-select__detail">{item.detail}</span></> : null}
                <span className="ws-flow-search-select__check">
                  <FlowIcon name="check" />
                </span>
              </li>
            ))}
          </ul>
          {shown.length === 0 ? (
            <p className="ws-flow-search-select__empty" role="status">
              {emptyText}
            </p>
          ) : null}
        </div>
      ) : null}
      {error ? (
        <span id={`${id}e`} className="ws-flow-field__error">
          <FlowIcon name="alert" />
          <span>{error}</span>
        </span>
      ) : null}
    </div>
  );
}
