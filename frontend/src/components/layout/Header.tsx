import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import { useAppStore } from '../../store/app.store'
import { cn } from '../../utils/cn'
import {
  Menu, Bell, Sun, Moon, Search, LogOut, User,
  Settings, ChevronDown, CheckCircle
} from 'lucide-react'
import { formatDate } from '../../utils/formatters'
import api from '../../utils/api'
import toast from 'react-hot-toast'

export default function Header() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme, toggleSidebar, setSidebarMobile } = useAppStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications] = useState([
    { id: '1', title: '3 produits en rupture de stock', type: 'warning', time: 'Il y a 5 min' },
    { id: '2', title: 'Nouveau rendez-vous: Patient Kouassi', type: 'info', time: 'Il y a 15 min' },
    { id: '3', title: 'Facture FAC-000123 soldée', type: 'success', time: 'Il y a 1h' },
  ])

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {}
    logout()
    navigate('/login')
    toast.success('Déconnexion réussie')
  }

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-[var(--sidebar-width)] z-30 h-16 bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border flex items-center px-4 gap-3 transition-all duration-300">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarMobile(true)}
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-hover"
      >
        <Menu className="h-5 w-5 text-slate-600 dark:text-slate-300" />
      </button>

      {/* Desktop sidebar toggle */}
      <button
        onClick={toggleSidebar}
        className="hidden lg:flex p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-hover"
      >
        <Menu className="h-5 w-5 text-slate-600 dark:text-slate-300" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher patient, vente, produit..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 dark:bg-dark-hover border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-slate-200 dark:placeholder-slate-500"
          />
        </div>
      </div>

      <div className="flex-1 sm:flex-none" />

      {/* Date */}
      <div className="hidden md:block text-sm text-slate-500 dark:text-slate-400">
        {formatDate(new Date(), 'EEEE d MMM yyyy')}
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-hover transition-colors"
        title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
      >
        {theme === 'dark' ? (
          <Sun className="h-5 w-5 text-amber-400" />
        ) : (
          <Moon className="h-5 w-5 text-slate-600" />
        )}
      </button>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-hover relative"
        >
          <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          {notifications.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>

        {showNotifications && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
            <div className="absolute right-0 top-12 z-20 w-80 bg-white dark:bg-dark-card rounded-xl shadow-2xl border border-slate-200 dark:border-dark-border overflow-hidden animate-scale-in">
              <div className="p-4 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                <button className="text-xs text-primary-600 hover:underline">Tout lire</button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-dark-border max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-4 hover:bg-slate-50 dark:hover:bg-dark-hover cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                        n.type === 'warning' ? 'bg-amber-500' :
                        n.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                      )} />
                      <div>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{n.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-slate-100 dark:border-dark-border">
                <button className="w-full text-center text-sm text-primary-600 hover:underline">
                  Voir toutes les notifications
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-hover transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </span>
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-none">
              {user?.firstName}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 capitalize mt-0.5">
              {user?.role}
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
        </button>

        {showUserMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
            <div className="absolute right-0 top-12 z-20 w-52 bg-white dark:bg-dark-card rounded-xl shadow-2xl border border-slate-200 dark:border-dark-border overflow-hidden animate-scale-in">
              <div className="p-3 border-b border-slate-100 dark:border-dark-border">
                <div className="font-medium text-slate-900 dark:text-white text-sm">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user?.email}</div>
              </div>
              <div className="p-1">
                <button
                  onClick={() => { navigate('/settings'); setShowUserMenu(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-hover rounded-lg"
                >
                  <User className="h-4 w-4" />
                  Mon profil
                </button>
                <button
                  onClick={() => { navigate('/settings'); setShowUserMenu(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-hover rounded-lg"
                >
                  <Settings className="h-4 w-4" />
                  Paramètres
                </button>
                <div className="border-t border-slate-100 dark:border-dark-border my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
