import { ReactNode, useState } from 'react'
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'

export interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  className?: string
  render?: (value: any, row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  onRowClick?: (row: T) => void
  emptyMessage?: string
  total?: number
  page?: number
  limit?: number
  onPageChange?: (page: number) => void
  searchable?: boolean
  onSearch?: (query: string) => void
  searchValue?: string
  actions?: ReactNode
  title?: string
}

function LoadingSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-slate-200 dark:bg-dark-border rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export default function DataTable<T extends { id?: string }>({
  columns,
  data,
  loading,
  onRowClick,
  emptyMessage = 'Aucune donnée',
  total,
  page = 1,
  limit = 20,
  onPageChange,
  searchable,
  onSearch,
  searchValue = '',
  actions,
  title,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const totalPages = total && limit ? Math.ceil(total / limit) : 1

  return (
    <div className="card">
      {(title || searchable || actions) && (
        <div className="px-4 py-3 border-b border-slate-200 dark:border-dark-border flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {title && <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex-shrink-0">{title}</h3>}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {searchable && (
              <div className="relative flex-1 min-w-0 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => onSearch?.(e.target.value)}
                  placeholder="Rechercher..."
                  className="form-input pl-9"
                />
              </div>
            )}
            {actions && <div className="flex items-center gap-2 ml-auto">{actions}</div>}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(col.className, col.sortable && 'cursor-pointer select-none')}
                  onClick={() => handleSort(String(col.key), col.sortable)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <span className="flex flex-col ml-1">
                        <ChevronUp className={cn('h-3 w-3', sortKey === col.key && sortDir === 'asc' ? 'text-primary-600' : 'text-slate-300')} />
                        <ChevronDown className={cn('h-3 w-3 -mt-1', sortKey === col.key && sortDir === 'desc' ? 'text-primary-600' : 'text-slate-300')} />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingSkeleton cols={columns.length} />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={(row as any).id || idx}
                  onClick={() => onRowClick?.(row)}
                  className={cn(onRowClick && 'cursor-pointer')}
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className={col.className}>
                      {col.render
                        ? col.render((row as any)[col.key], row)
                        : (row as any)[col.key] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total !== undefined && onPageChange && (
        <div className="px-4 py-3 border-t border-slate-200 dark:border-dark-border flex items-center justify-between gap-2">
          <p className="text-sm text-slate-500">
            {total} résultat{total !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-hover disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 text-slate-500" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                    pageNum === page
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-hover'
                  )}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-hover disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
