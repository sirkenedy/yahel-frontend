import { Link } from 'react-aria-components';
import type { ReactNode } from 'react';
import { SelectBox } from './console-controls';

export interface DataTableColumn<Row> {
  id: string;
  header: string;
  cell: (row: Row) => ReactNode;
  /** Left out on a narrow screen, where the row shows only its name and the most useful values. */
  secondary?: boolean;
}

export interface DataTableProps<Row> {
  /** Names the table: "Users". */
  label: string;
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  rowKey: (row: Row) => string;
  /** Each row opens its own page. The first column becomes the link; the whole row can be pressed. */
  rowHref: (row: Row) => string;
  /** What the row's link is called, when the first cell's text does not name the row on its own. */
  rowLabel?: (row: Row) => string;
  /** Shown in place of the rows when there are none. */
  empty?: ReactNode;
  /** Rows can be ticked to act on several at once. */
  selection?: DataTableSelection<Row>;
}

export interface DataTableSelection<Row> {
  selected: ReadonlySet<string>;
  onChange: (selected: Set<string>) => void;
  /** Names the box in the header: "Select everyone shown". */
  allLabel: string;
  /** Names a row's box: "Select Kofi Mensah". */
  rowLabel: (row: Row) => string;
}

/** A table of things that each open a page of their own: a sticky first column that names the row, tabular figures. */
export function DataTable<Row>({ label, columns, rows, rowKey, rowHref, rowLabel, empty, selection }: DataTableProps<Row>) {
  const [first, ...rest] = columns;
  if (!first) return null;
  const keys = rows.map(rowKey);
  const ticked = selection ? keys.filter((key) => selection.selected.has(key)).length : 0;
  const tick = (key: string, on: boolean) => {
    if (!selection) return;
    const next = new Set(selection.selected);
    if (on) next.add(key);
    else next.delete(key);
    selection.onChange(next);
  };
  return (
    <div className="ws-console-table-wrap">
      <table className="ws-console-table" aria-label={label}>
        <thead>
          <tr>
            {selection ? (
              <td className="ws-console-table__select">
                <SelectBox
                  label={selection.allLabel}
                  isSelected={rows.length > 0 && ticked === rows.length}
                  isIndeterminate={ticked > 0 && ticked < rows.length}
                  isDisabled={rows.length === 0}
                  onChange={(on) => selection.onChange(on ? new Set([...selection.selected, ...keys]) : new Set([...selection.selected].filter((key) => !keys.includes(key))))}
                />
              </td>
            ) : null}
            {columns.map((column) => (
              <th key={column.id} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} data-picked={selection?.selected.has(rowKey(row)) || undefined}>
              {selection ? (
                <td className="ws-console-table__select">
                  <SelectBox label={selection.rowLabel(row)} isSelected={selection.selected.has(rowKey(row))} onChange={(on) => tick(rowKey(row), on)} />
                </td>
              ) : null}
              <th scope="row" className="ws-console-table__name">
                <Link className="ws-console-table__link" href={rowHref(row)} aria-label={rowLabel?.(row)}>
                  {first.cell(row)}
                </Link>
              </th>
              {rest.map((column) => (
                <td key={column.id} data-secondary={column.secondary || undefined}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? <div className="ws-console-table__empty">{empty}</div> : null}
    </div>
  );
}
