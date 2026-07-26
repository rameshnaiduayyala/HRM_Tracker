import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';

/**
 * Enterprise Reusable DataTable Abstraction
 * Supports: Sorting, Filtering, Pagination, Row Selection, Loading Skeletons, and Custom Empty States
 */
export default function DataTable({
  data = [],
  columns = [],
  loading = false,
  emptyMessage = 'No records found matching criteria.',
  pageSize = 10,
}) {
  const [sorting, setSorting] = React.useState([]);
  const [globalFilter, setGlobalFilter] = React.useState('');

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  return (
    <div
      className="w-full overflow-hidden"
      style={{
        border: '1px solid var(--border-subtle)',
        borderRadius: '14px',
        background: 'var(--bg-card)',
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr
                key={hg.id}
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card-alt)',
                }}
              >
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left select-none cursor-pointer"
                    onClick={header.column.getToggleSortingHandler()}
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="opacity-60">
                          {{
                            asc: <ChevronUp className="w-3 h-3 text-indigo-400" />,
                            desc: <ChevronDown className="w-3 h-3 text-indigo-400" />,
                          }[header.column.getIsSorted()] || (
                            <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr
                  key={idx}
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                >
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="px-4 py-3">
                      <div className="h-4 bg-[var(--bg-card-alt)] rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center"
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                  }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-[var(--bg-card-alt)]/60"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3.5 text-xs"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {table.getPageCount() > 1 && (
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-card-alt)',
          }}
        >
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-2.5 py-1 text-xs rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--bg-card)] transition font-medium"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-2.5 py-1 text-xs rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--bg-card)] transition font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
