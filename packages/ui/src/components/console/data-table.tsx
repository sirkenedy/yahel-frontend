import { Link } from 'react-aria-components';
import type { ReactNode } from 'react';

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
}

/** A table of things that each open a page of their own: a sticky first column that names the row, tabular figures. */
export function DataTable<Row>({ label, columns, rows, rowKey, rowHref, rowLabel, empty }: DataTableProps<Row>) {
  const [first, ...rest] = columns;
  if (!first) return null;
  return (
    <div className="ws-console-table-wrap">
      <table className="ws-console-table" aria-label={label}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.id} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
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
