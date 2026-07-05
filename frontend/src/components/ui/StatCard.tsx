import { ReactNode, isValidElement } from 'react'
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react'
import { cn } from '../../utils/cn'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: ReactNode | LucideIcon
  trend?: number
  trendLabel?: string
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'teal' | 'indigo' | 'cyan' | 'yellow'
  loading?: boolean
  onClick?: () => void
}

const colorConfig = {
  blue: { bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400', icon: 'from-blue-500 to-blue-600' },
  green: { bg: 'bg-green-500/10 dark:bg-green-500/20', text: 'text-green-600 dark:text-green-400', icon: 'from-green-500 to-green-600' },
  orange: { bg: 'bg-orange-500/10 dark:bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400', icon: 'from-orange-500 to-orange-600' },
  purple: { bg: 'bg-purple-500/10 dark:bg-purple-500/20', text: 'text-purple-600 dark:text-purple-400', icon: 'from-purple-500 to-purple-600' },
  red: { bg: 'bg-red-500/10 dark:bg-red-500/20', text: 'text-red-600 dark:text-red-400', icon: 'from-red-500 to-red-600' },
  teal: { bg: 'bg-teal-500/10 dark:bg-teal-500/20', text: 'text-teal-600 dark:text-teal-400', icon: 'from-teal-500 to-teal-600' },
  indigo: { bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400', icon: 'from-indigo-500 to-indigo-600' },
  cyan: { bg: 'bg-cyan-500/10 dark:bg-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-400', icon: 'from-cyan-500 to-cyan-600' },
  yellow: { bg: 'bg-yellow-500/10 dark:bg-yellow-500/20', text: 'text-yellow-600 dark:text-yellow-400', icon: 'from-yellow-500 to-yellow-600' },
}

export default function StatCard({ title, value, subtitle, icon, trend, trendLabel, color = 'blue', loading, onClick }: StatCardProps) {
  const cfg = colorConfig[color]
  const iconNode = typeof icon === 'function'
    ? (() => { const Icon = icon as LucideIcon; return <Icon /> })()
    : isValidElement(icon) || icon == null
    ? icon
    : null

  return (
    <div
      className={cn(
        'stat-card card-hover',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <div className={cn('stat-icon', cfg.bg)}>
        <div className={cn('text-2xl', cfg.text)}>{iconNode}</div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate">{title}</p>
        {loading ? (
          <div className="mt-1 h-8 w-32 bg-slate-200 dark:bg-dark-border rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 truncate">{value}</p>
        )}
        {(subtitle || trend !== undefined) && (
          <div className="flex items-center gap-2 mt-1">
            {trend !== undefined && (
              <span className={cn(
                'flex items-center gap-0.5 text-xs font-medium',
                trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-slate-500'
              )}>
                {trend > 0 ? <TrendingUp className="h-3 w-3" /> :
                 trend < 0 ? <TrendingDown className="h-3 w-3" /> :
                 <Minus className="h-3 w-3" />}
                {Math.abs(trend)}%
              </span>
            )}
            {subtitle && <p className="text-xs text-slate-400 truncate">{subtitle}</p>}
            {trendLabel && <p className="text-xs text-slate-400">{trendLabel}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
