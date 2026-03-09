import type {
  ReactNode,
  TableHTMLAttributes,
  HTMLAttributes,
  ThHTMLAttributes,
  TdHTMLAttributes,
} from "react";

type TableProps = TableHTMLAttributes<HTMLTableElement> & {
  children: ReactNode;
};

type SectionProps = HTMLAttributes<HTMLTableSectionElement> & {
  children: ReactNode;
};

type HeaderCellProps = ThHTMLAttributes<HTMLTableHeaderCellElement> & {
  children: ReactNode;
};

type RowProps = HTMLAttributes<HTMLTableRowElement> & {
  children: ReactNode;
};

type CellProps = TdHTMLAttributes<HTMLTableCellElement> & {
  children: ReactNode;
};

export function Table({ children, className, ...rest }: TableProps) {
  return (
    <div className="subtle-scrollbar overflow-hidden rounded-lg border border-slate-800/80 bg-slate-950/40">
      <table
        className={`min-w-full divide-y divide-slate-800 text-left text-xs text-slate-200 ${className ?? ""}`.trim()}
        {...rest}
      >
        {children}
      </table>
    </div>
  );
}

export function THead({ children, className, ...rest }: SectionProps) {
  return (
    <thead
      className={`bg-slate-950/70 text-[11px] uppercase tracking-wide text-slate-400 ${className ?? ""}`.trim()}
      {...rest}
    >
      {children}
    </thead>
  );
}

export function TBody({ children, className, ...rest }: SectionProps) {
  return (
    <tbody
      className={`divide-y divide-slate-900/80 ${className ?? ""}`.trim()}
      {...rest}
    >
      {children}
    </tbody>
  );
}

export function TH({ children, className, ...rest }: HeaderCellProps) {
  return (
    <th
      className={`px-3 py-2.5 font-semibold ${className ?? ""}`.trim()}
      {...rest}
    >
      {children}
    </th>
  );
}

export function TR({ children, className, ...rest }: RowProps) {
  return (
    <tr
      className={`hover:bg-slate-900/60 ${className ?? ""}`.trim()}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function TD({ children, className, ...rest }: CellProps) {
  return (
    <td
      className={`whitespace-nowrap px-3 py-2 align-middle ${className ?? ""}`.trim()}
      {...rest}
    >
      {children}
    </td>
  );
}

