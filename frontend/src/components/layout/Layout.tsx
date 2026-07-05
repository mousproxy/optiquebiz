import { Outlet } from 'react-router-dom'
import { useAppStore } from '../../store/app.store'
import { cn } from '../../utils/cn'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  const { sidebarCollapsed } = useAppStore()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg">
      <Sidebar />
      <Header />
      <main
        className={cn(
          'main-content pt-16 min-h-screen',
          sidebarCollapsed ? 'sidebar-collapsed' : ''
        )}
      >
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
