import { NavLink, useLocation } from 'react-router-dom'
import { useAppStore } from '../../store/app.store'
import { useAuthStore } from '../../store/auth.store'
import { cn } from '../../utils/cn'
import {
  LayoutDashboard, Users, Calendar, Eye, FileText, ShoppingCart,
  Glasses, Package, TrendingUp, Truck, Building2, CreditCard,
  BookOpen, Users2, MessageSquare, BarChart3, Settings,
  ChevronDown, ChevronRight, X, User, ShieldCheck, Database,
  Layers, AlertTriangle, Send
} from 'lucide-react'
import { useState } from 'react'
import type { ModuleKey } from '../../types'

interface NavItemConfig {
  label: string
  icon: React.ComponentType<any>
  href?: string
  badge?: number | string
  badgeColor?: string
  children?: NavItemConfig[]
  roles?: string[]
  moduleKey?: ModuleKey
}

const navConfig: NavItemConfig[] = [
  {
    label: 'Tableau de bord',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    label: 'Patients',
    icon: Users,
    children: [
      { label: 'Liste des patients', icon: Users, href: '/patients' },
      { label: 'Nouveau patient', icon: User, href: '/patients/new' },
    ],
  },
  {
    label: 'Rendez-vous',
    icon: Calendar,
    href: '/appointments',
  },
  {
    label: 'Consultations',
    icon: Eye,
    children: [
      { label: 'Toutes les consultations', icon: Eye, href: '/consultations' },
      { label: 'Nouvelle consultation', icon: Eye, href: '/consultations/new' },
    ],
  },
  {
    label: 'Ordonnances',
    icon: FileText,
    children: [
      { label: 'Toutes les ordonnances', icon: FileText, href: '/prescriptions' },
      { label: 'Nouvelle ordonnance', icon: FileText, href: '/prescriptions/new' },
    ],
  },
  {
    label: 'Point de Vente',
    icon: ShoppingCart,
    href: '/pos',
    badgeColor: 'green',
  },
  {
    label: 'Ventes',
    icon: TrendingUp,
    children: [
      { label: 'Liste des ventes', icon: TrendingUp, href: '/sales' },
    ],
  },
  {
    label: 'Inventaire',
    icon: Glasses,
    children: [
      { label: 'Montures', icon: Glasses, href: '/inventory/frames' },
      { label: 'Verres', icon: Eye, href: '/inventory/lenses' },
      { label: 'Lentilles', icon: Eye, href: '/inventory/contact-lenses' },
      { label: 'Accessoires', icon: Package, href: '/inventory/accessories' },
    ],
  },
  {
    label: 'Stock',
    icon: Layers,
    href: '/stock',
  },
  {
    label: 'Entrepôts',
    icon: Building2,
    href: '/warehouses',
    roles: ['admin', 'manager'],
  },
  {
    label: 'Achats',
    icon: Truck,
    moduleKey: 'procurement',
    children: [
      { label: 'Commandes', icon: Truck, href: '/purchases' },
      { label: 'Nouvelle commande', icon: Truck, href: '/purchases/new' },
    ],
  },
  {
    label: 'Fournisseurs',
    icon: Building2,
    href: '/suppliers',
    moduleKey: 'procurement',
  },
  {
    label: 'Caisse',
    icon: CreditCard,
    href: '/cashier',
    moduleKey: 'cashier',
  },
  {
    label: 'Comptabilité',
    icon: BookOpen,
    href: '/accounting',
    moduleKey: 'accounting',
  },
  {
    label: 'Ressources Humaines',
    icon: Users2,
    href: '/hr',
    roles: ['admin', 'manager'],
    moduleKey: 'hr',
  },
  {
    label: 'CRM & Marketing',
    icon: Send,
    href: '/crm',
    moduleKey: 'crm',
  },
  {
    label: 'Rapports',
    icon: BarChart3,
    href: '/reports',
    moduleKey: 'reports',
  },
  {
    label: 'Paramétrage',
    icon: Settings,
    children: [
      { label: 'Paramètres', icon: Settings, href: '/settings' },
      { label: 'Utilisateurs', icon: User, href: '/settings/users', roles: ['admin', 'manager'] },
    ],
  },
  {
    label: 'Administration',
    icon: ShieldCheck,
    href: '/superadmin',
    roles: ['superadmin'],
  },
]

function filterNavItems(items: NavItemConfig[], role: string, modules: string[]): NavItemConfig[] {
  return items.reduce<NavItemConfig[]>((acc, item) => {
    if (item.roles && !item.roles.includes(role)) return acc
    if (item.moduleKey && !modules.includes(item.moduleKey)) return acc

    if (item.children) {
      const children = filterNavItems(item.children, role, modules)
      if (children.length === 0) return acc
      acc.push({ ...item, children })
      return acc
    }

    acc.push(item)
    return acc
  }, [])
}

interface NavItemProps {
  item: NavItemConfig
  collapsed: boolean
  depth?: number
}

function NavItem({ item, collapsed, depth = 0 }: NavItemProps) {
  const location = useLocation()
  const [open, setOpen] = useState(() => {
    if (item.children) {
      return item.children.some(c => c.href && location.pathname.startsWith(c.href))
    }
    return false
  })

  const isChildActive = item.children?.some(c => c.href && location.pathname.startsWith(c.href))

  if (item.href) {
    return (
      <NavLink
        to={item.href}
        className={({ isActive }) =>
          cn(
            'nav-item group',
            depth > 0 ? 'pl-8 text-xs' : 'text-sm',
            isActive ? 'nav-item-active' : 'nav-item-inactive'
          )
        }
        title={collapsed ? item.label : undefined}
      >
        <item.icon className={cn('flex-shrink-0', depth > 0 ? 'h-3.5 w-3.5' : 'h-5 w-5')} />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge && (
              <span className={cn(
                'ml-auto px-2 py-0.5 text-xs rounded-full font-medium',
                item.badgeColor === 'green' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              )}>
                {item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    )
  }

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            'nav-item w-full group',
            isChildActive ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 'nav-item-inactive'
          )}
          title={collapsed ? item.label : undefined}
        >
          <item.icon className="flex-shrink-0 h-5 w-5" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left truncate">{item.label}</span>
              {open ? (
                <ChevronDown className="h-4 w-4 opacity-60" />
              ) : (
                <ChevronRight className="h-4 w-4 opacity-60" />
              )}
            </>
          )}
        </button>

        {!collapsed && open && (
          <div className="mt-0.5 space-y-0.5 animate-fade-in">
            {item.children.map((child) => (
              <NavItem key={child.label} item={child} collapsed={false} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return null
}

export default function Sidebar() {
  const { sidebarCollapsed, sidebarMobileOpen, toggleSidebar, setSidebarMobile } = useAppStore()
  const { user } = useAuthStore()

  const filteredNav = filterNavItems(navConfig, user?.role || '', user?.company?.subscription?.modules || [])

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-slate-200 dark:border-dark-border flex-shrink-0',
        sidebarCollapsed ? 'justify-center' : ''
      )}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center flex-shrink-0 shadow-premium">
          <Eye className="w-5 h-5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="animate-fade-in overflow-hidden">
            <div className="font-bold text-slate-900 dark:text-white leading-none text-base">OptiGest</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Gestion d'Optique</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 custom-scrollbar">
        {filteredNav.map((item) => (
          <NavItem
            key={item.label}
            item={item}
            collapsed={sidebarCollapsed}
          />
        ))}
      </nav>

      {/* User section */}
      <div className={cn(
        'border-t border-slate-200 dark:border-dark-border p-3 flex-shrink-0',
        sidebarCollapsed ? 'flex justify-center' : ''
      )}>
        <div className={cn(
          'flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-hover cursor-pointer transition-colors',
          sidebarCollapsed ? 'justify-center' : ''
        )}>
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </span>
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 capitalize truncate">
                {user?.role}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collapse button */}
      <button
        onClick={toggleSidebar}
        className="hidden lg:flex items-center justify-center h-8 w-8 mx-auto mb-3 rounded-lg bg-slate-100 dark:bg-dark-hover hover:bg-slate-200 dark:hover:bg-dark-border transition-colors"
        title={sidebarCollapsed ? 'Développer' : 'Réduire'}
      >
        <ChevronRight className={cn('h-4 w-4 text-slate-500 transition-transform', !sidebarCollapsed && 'rotate-180')} />
      </button>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'sidebar fixed left-0 top-0 bottom-0 z-40',
          'bg-white dark:bg-dark-surface border-r border-slate-200 dark:border-dark-border',
          'hidden lg:flex flex-col',
          sidebarCollapsed ? 'collapsed' : ''
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarMobile(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-dark-surface border-r border-slate-200 dark:border-dark-border flex flex-col animate-slide-in">
            <button
              onClick={() => setSidebarMobile(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-hover"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
