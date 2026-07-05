import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  TrendingUp, Users, Calendar, FileText, ShoppingCart,
  AlertTriangle, Package, Clock, CreditCard, Eye,
  ArrowUp, Truck, CheckCircle, DollarSign
} from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'
import api from '../../utils/api'
import { formatCurrency, formatCurrencyCompact, formatDate, formatTime, getAppointmentStatus, fullName } from '../../utils/formatters'
import { DashboardStats, ChartData } from '../../types'

const COLORS = ['#2563eb', '#0891b2', '#7c3aed', '#d97706', '#dc2626', '#16a34a']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl p-3 shadow-xl">
        <p className="text-xs text-slate-500 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
            {p.name}: {formatCurrencyCompact(p.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [salesChart, setSalesChart] = useState<ChartData[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([])
  const [topSellers, setTopSellers] = useState<any[]>([])
  const [todayAppointments, setTodayAppointments] = useState<any[]>([])
  const [recentSales, setRecentSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/dashboard/stats')
        setStats(data.stats)
        setSalesChart(data.salesChart || [])
        setMonthlyRevenue(data.monthlyRevenue || [])
        setTopSellers(data.topSellers || [])
        setTodayAppointments(data.todayAppointments || [])
        setRecentSales(data.recentSales || [])
      } catch {
        // Use demo data when API not available
        setStats({
          todayRevenue: 485000,
          todaySalesCount: 8,
          monthRevenue: 12750000,
          monthSalesCount: 187,
          todayAppointments: 14,
          totalPatients: 2847,
          newPrescriptions: 23,
          pendingOrders: 4,
          stockAlerts: 7,
          readyToPickup: 12,
          pendingPaymentsAmount: 1250000,
          pendingPaymentsCount: 18,
        })
        setSalesChart(generateDemoChart())
        setMonthlyRevenue(generateMonthlyRevenue())
        setTopSellers(generateTopSellers())
        setTodayAppointments(generateAppointments())
        setRecentSales(generateRecentSales())
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {formatDate(new Date(), "EEEE d MMMM yyyy")} • Vue d'ensemble
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm">
            <Calendar className="h-4 w-4" /> Cette semaine
          </button>
          <button className="btn btn-primary btn-sm">
            <TrendingUp className="h-4 w-4" /> Rapport
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4">
        <StatCard
          title="CA du jour"
          value={formatCurrencyCompact(stats?.todayRevenue || 0)}
          subtitle={`${stats?.todaySalesCount || 0} ventes`}
          icon={<DollarSign className="h-6 w-6" />}
          trend={12.5}
          trendLabel="vs. hier"
          color="blue"
          loading={loading}
        />
        <StatCard
          title="CA du mois"
          value={formatCurrencyCompact(stats?.monthRevenue || 0)}
          subtitle={`${stats?.monthSalesCount || 0} ventes`}
          icon={<TrendingUp className="h-6 w-6" />}
          trend={8.3}
          trendLabel="vs. mois dernier"
          color="green"
          loading={loading}
        />
        <StatCard
          title="Rendez-vous"
          value={stats?.todayAppointments || 0}
          subtitle="Aujourd'hui"
          icon={<Calendar className="h-6 w-6" />}
          color="purple"
          loading={loading}
        />
        <StatCard
          title="Patients"
          value={formatCurrencyCompact(stats?.totalPatients || 0).replace(' F', '')}
          subtitle="Total actifs"
          icon={<Users className="h-6 w-6" />}
          trend={3.2}
          trendLabel="ce mois"
          color="teal"
          loading={loading}
        />
        <StatCard
          title="Ordonnances"
          value={stats?.newPrescriptions || 0}
          subtitle="Ce mois"
          icon={<FileText className="h-6 w-6" />}
          color="indigo"
          loading={loading}
        />
        <StatCard
          title="Lunettes prêtes"
          value={stats?.readyToPickup || 0}
          subtitle="À récupérer"
          icon={<Eye className="h-6 w-6" />}
          color="cyan"
          loading={loading}
        />
        <StatCard
          title="Alertes stock"
          value={stats?.stockAlerts || 0}
          subtitle="Ruptures proches"
          icon={<AlertTriangle className="h-6 w-6" />}
          color="orange"
          loading={loading}
        />
        <StatCard
          title="Commandes"
          value={stats?.pendingOrders || 0}
          subtitle="En attente"
          icon={<Truck className="h-6 w-6" />}
          color="red"
          loading={loading}
        />
        <StatCard
          title="Paiements dus"
          value={formatCurrencyCompact(stats?.pendingPaymentsAmount || 0)}
          subtitle={`${stats?.pendingPaymentsCount || 0} clients`}
          icon={<CreditCard className="h-6 w-6" />}
          color="orange"
          loading={loading}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="xl:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Chiffre d'affaires</h3>
              <p className="text-xs text-slate-400 mt-0.5">30 derniers jours</p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-outline btn-sm">7j</button>
              <button className="btn btn-primary btn-sm">30j</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={salesChart}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="CA" stroke="#2563eb" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Today appointments */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Rendez-vous du jour</h3>
            <Badge color="blue">{todayAppointments.length}</Badge>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-[220px]">
            {todayAppointments.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Aucun rendez-vous aujourd'hui</p>
            ) : todayAppointments.map((appt, i) => {
              const status = getAppointmentStatus(appt.status)
              return (
                <div key={appt.id || i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-hover cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary-700 dark:text-primary-300">
                      {appt.patients?.first_name?.charAt(0)}{appt.patients?.last_name?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {appt.patients?.first_name} {appt.patients?.last_name}
                    </p>
                    <p className="text-xs text-slate-500">{formatTime(appt.start_time)} • {appt.reason || 'Consultation'}</p>
                  </div>
                  <Badge color={status.color as any} size="sm">{status.label}</Badge>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Monthly revenue bar */}
        <div className="xl:col-span-2 card p-5">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Évolution mensuelle</h3>
          <p className="text-xs text-slate-400 mb-4">12 derniers mois</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyRevenue} barSize={24} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1_000_000).toFixed(1)}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="CA" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top sellers */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Top Vendeurs</h3>
          <div className="space-y-3">
            {topSellers.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                  i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-orange-500' : 'bg-primary-200'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{s.name}</p>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-dark-border rounded-full mt-1">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${(s.revenue / (topSellers[0]?.revenue || 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex-shrink-0">
                  {formatCurrencyCompact(s.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent sales + Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent sales */}
        <div className="xl:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Dernières ventes</h3>
            <a href="/sales" className="text-sm text-primary-600 hover:underline">Voir tout</a>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Patient</th>
                  <th>Montant</th>
                  <th>Payé</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale, i) => (
                  <tr key={i} className="cursor-pointer">
                    <td className="font-mono text-xs text-primary-600">{sale.reference}</td>
                    <td className="font-medium">{sale.patient_name}</td>
                    <td className="font-semibold">{formatCurrency(sale.total)}</td>
                    <td className={sale.remaining > 0 ? 'text-orange-600' : 'text-green-600'}>
                      {formatCurrency(sale.paid)}
                    </td>
                    <td>
                      <Badge color={sale.remaining <= 0 ? 'green' : sale.paid > 0 ? 'blue' : 'yellow'} size="sm">
                        {sale.remaining <= 0 ? 'Soldé' : sale.paid > 0 ? 'Partiel' : 'En attente'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Alertes</h3>

          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">Stock insuffisant</span>
              <Badge color="red" size="sm">{stats?.stockAlerts || 7}</Badge>
            </div>
            <p className="text-xs text-red-600 dark:text-red-400">Produits sous le seuil minimum</p>
            <a href="/stock" className="text-xs text-red-700 dark:text-red-300 font-medium hover:underline mt-1 block">Voir les alertes →</a>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Paiements en attente</span>
              <Badge color="yellow" size="sm">{stats?.pendingPaymentsCount || 18}</Badge>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400">{formatCurrency(stats?.pendingPaymentsAmount || 1250000)} à encaisser</p>
            <a href="/sales" className="text-xs text-amber-700 dark:text-amber-300 font-medium hover:underline mt-1 block">Voir les impayés →</a>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Prêtes à récupérer</span>
              <Badge color="blue" size="sm">{stats?.readyToPickup || 12}</Badge>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400">Lunettes montées à livrer</p>
            <a href="/sales?filter=ready" className="text-xs text-blue-700 dark:text-blue-300 font-medium hover:underline mt-1 block">Voir la liste →</a>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-dark-hover rounded-xl border border-slate-200 dark:border-dark-border">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Commandes fournisseurs</span>
              <Badge color="gray" size="sm">{stats?.pendingOrders || 4}</Badge>
            </div>
            <p className="text-xs text-slate-500">Commandes en attente de réception</p>
            <a href="/purchases" className="text-xs text-slate-600 dark:text-slate-400 font-medium hover:underline mt-1 block">Voir les commandes →</a>
          </div>
        </div>
      </div>
    </div>
  )
}

// Demo data generators
function generateDemoChart(): ChartData[] {
  return Array.from({ length: 30 }, (_, i) => ({
    date: `${i + 1}/06`,
    revenue: Math.floor(Math.random() * 600000 + 200000),
    count: Math.floor(Math.random() * 10 + 2),
  }))
}

function generateMonthlyRevenue() {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
  return months.map((month, i) => ({
    month,
    revenue: Math.floor(Math.random() * 5000000 + 8000000),
    count: Math.floor(Math.random() * 50 + 100),
  }))
}

function generateTopSellers() {
  return [
    { name: 'Kouassi Ama', revenue: 3850000, count: 42 },
    { name: 'Traoré Ibrahim', revenue: 3200000, count: 38 },
    { name: 'Diallo Fatoumata', revenue: 2750000, count: 31 },
    { name: 'Bamba Seydou', revenue: 2100000, count: 25 },
    { name: 'Koné Mariama', revenue: 1850000, count: 22 },
  ]
}

function generateAppointments() {
  const statuses = ['scheduled', 'confirmed', 'present', 'completed', 'absent']
  return Array.from({ length: 8 }, (_, i) => ({
    id: `appt-${i}`,
    patients: { first_name: ['Kouassi', 'Traoré', 'Diallo', 'Bamba', 'Koné', 'Touré', 'Coulibaly', 'Sanogo'][i], last_name: ['M.', 'I.', 'F.', 'S.', 'A.', 'D.', 'K.', 'B.'][i] },
    start_time: `${8 + i}:00`,
    reason: ['Consultation', 'Contrôle', 'Renouvellement', 'Urgence'][i % 4],
    status: statuses[i % statuses.length],
  }))
}

function generateRecentSales() {
  return Array.from({ length: 8 }, (_, i) => ({
    reference: `FAC-${String(200 - i).padStart(6, '0')}`,
    patient_name: ['Kouassi A.', 'Traoré I.', 'Diallo F.', 'Bamba S.', 'Koné M.', 'Touré D.', 'Coulibaly K.', 'Sanogo B.'][i],
    total: Math.floor(Math.random() * 200000 + 50000),
    paid: Math.floor(Math.random() * 200000 + 30000),
    remaining: Math.random() > 0.5 ? Math.floor(Math.random() * 50000) : 0,
  }))
}
