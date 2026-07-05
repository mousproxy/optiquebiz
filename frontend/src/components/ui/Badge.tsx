import { cn } from '../../utils/cn'

type BadgeColor = 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'purple' | 'orange' | 'teal' | 'pink'

interface BadgeProps {
  color?: BadgeColor
  children: React.ReactNode
  size?: 'sm' | 'md'
  dot?: boolean
}

const colorMap: Record<BadgeColor, string> = {
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  gray: 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
}

const dotColorMap: Record<BadgeColor, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  gray: 'bg-slate-400',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  teal: 'bg-teal-500',
  pink: 'bg-pink-500',
}

export default function Badge({ color = 'gray', children, size = 'md', dot = false }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-medium',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
      colorMap[color]
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColorMap[color])} />}
      {children}
    </span>
  )
}
