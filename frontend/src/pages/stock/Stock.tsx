import { useState, useEffect } from 'react'
import { AlertTriangle, TrendingDown, TrendingUp, Package, BarChart3, RefreshCw } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import api from '../../utils/api'
import { formatCurrency, formatDateTime } from '../../utils/formatters'

const TABS = [
  { id: 'alerts', label: 'Alertes stock', icon: AlertTriangle },
  { id: 'movements', label: 'Mouvements', icon: TrendingUp },
  { id: 'valuation', label: 'Valorisation', icon: BarChart3 },
]

export default function Stock() {
  const [tab, setTab] = useState('alerts')
  const [alerts, setAlerts] = useState<any[]>([])
  const [movements, setMovements] = useState<any[]>([])
  const [valuation, setValuation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total_items: 0, low_stock: 0, out_of_stock: 0, total_value: 0 })

  useEffect(() => {
    Promise.all([
      api.get('/stock/alerts').catch(() => ({ data: demoAlerts() })),
      api.get('/stock/movements', { params: { limit: 50 } }).catch(() => ({ data: { data: demoMovements() } })),
      api.get('/stock/valuation').catch(() => ({ data: demoValuation() })),
    ]).then(([a, m, v]) => {
      const alertData = a.data?.data || a.data || []
      const movData = m.data?.data || []
      const valData = v.data || demoValuation()
      setAlerts(alertData)
      setMovements(movData)
      setValuation(valData)
      const out = alertData.filter((x: any) => x.stock_quantity === 0).length
      setStats({
        total_items: valData.total_items || 0,
        low_stock: alertData.length,
        out_of_stock: out,
        total_value: valData.total_value || 0,
      })
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title">Gestion du stock</h1>
        <button className="btn btn-outline" onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 500) }}>
          <RefreshCw className="h-4 w-4" /> Actualiser
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total articles" value={stats.total_items.toLocaleString('fr-CI')} icon={Package} color="blue" />
        <StatCard title="Stock faible" value={stats.low_stock} icon={AlertTriangle} color="yellow" />
        <StatCard title="Ruptures" value={stats.out_of_stock} icon={TrendingDown} color="red" />
        <StatCard title="Valeur du stock" value={formatCurrency(stats.total_value)} icon={BarChart3} color="green" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-dark-surface p-1 rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? 'bg-white dark:bg-dark-card shadow text-primary-700 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {id === 'alerts' && alerts.length > 0 && (
              <span className="ml-1 bg-red-100 text-red-700 text-xs font-bold px-1.5 py-0.5 rounded-full">{alerts.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Alerts Tab */}
      {tab === 'alerts' && (
        <div className="card">
          {loading ? (
            <div className="p-10 flex justify-center"><div className="loading-spinner h-6 w-6" /></div>
          ) : alerts.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>Aucune alerte de stock</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-th">Produit</th>
                    <th className="table-th">Catégorie</th>
                    <th className="table-th text-center">Stock actuel</th>
                    <th className="table-th text-center">Stock min.</th>
                    <th className="table-th">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                  {alerts.map((a, i) => (
                    <tr key={i} className={`table-row ${a.stock_quantity === 0 ? 'bg-red-50/50 dark:bg-red-900/10' : 'bg-yellow-50/50 dark:bg-yellow-900/10'}`}>
                      <td className="table-td">
                        <p className="font-medium">{a.name || a.product_name}</p>
                        <p className="text-xs text-slate-400 font-mono">{a.reference}</p>
                      </td>
                      <td className="table-td">
                        <Badge color="gray" size="sm">{a.category || a.type}</Badge>
                      </td>
                      <td className="table-td text-center">
                        <span className={`font-bold text-lg ${a.stock_quantity === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                          {a.stock_quantity}
                        </span>
                      </td>
                      <td className="table-td text-center text-slate-500">{a.min_stock}</td>
                      <td className="table-td">
                        {a.stock_quantity === 0
                          ? <Badge color="red" dot>Rupture de stock</Badge>
                          : <Badge color="yellow" dot>Stock faible</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Movements Tab */}
      {tab === 'movements' && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-th">Date</th>
                  <th className="table-th">Produit</th>
                  <th className="table-th">Type</th>
                  <th className="table-th text-center">Quantité</th>
                  <th className="table-th">Raison</th>
                  <th className="table-th">Référence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {movements.map((m, i) => (
                  <tr key={i} className="table-row">
                    <td className="table-td text-sm">{formatDateTime(m.created_at)}</td>
                    <td className="table-td">
                      <p className="font-medium text-sm">{m.product_name}</p>
                      <p className="text-xs text-slate-400 font-mono">{m.reference}</p>
                    </td>
                    <td className="table-td">
                      {m.movement_type === 'in' || m.quantity > 0
                        ? <Badge color="green" size="sm"><TrendingUp className="h-3 w-3 inline mr-1" />Entrée</Badge>
                        : <Badge color="red" size="sm"><TrendingDown className="h-3 w-3 inline mr-1" />Sortie</Badge>}
                    </td>
                    <td className="table-td text-center font-bold">
                      <span className={m.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                        {m.quantity > 0 ? '+' : ''}{m.quantity}
                      </span>
                    </td>
                    <td className="table-td text-sm text-slate-500">{m.reason || '—'}</td>
                    <td className="table-td">
                      {m.reference_doc ? <span className="font-mono text-xs text-primary-600">{m.reference_doc}</span> : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Valuation Tab */}
      {tab === 'valuation' && valuation && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Montures', value: valuation.frames_value, count: valuation.frames_count },
              { label: 'Verres', value: valuation.lenses_value, count: valuation.lenses_count },
              { label: 'Lentilles', value: valuation.contact_lenses_value, count: valuation.contact_lenses_count },
              { label: 'Accessoires', value: valuation.accessories_value, count: valuation.accessories_count },
            ].map((item) => (
              <div key={item.label} className="card p-5">
                <p className="text-sm text-slate-500 mb-1">{item.label}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(item.value || 0)}</p>
                <p className="text-xs text-slate-400 mt-1">{item.count || 0} références</p>
              </div>
            ))}
          </div>
          <div className="card p-5 border-2 border-primary-200 dark:border-primary-800">
            <p className="text-sm text-slate-500 mb-1">Valeur totale du stock</p>
            <p className="text-3xl font-bold text-primary-700 dark:text-primary-400">{formatCurrency(valuation.total_value || 0)}</p>
            <p className="text-xs text-slate-400 mt-1">
              Prix d'achat · {valuation.total_items || 0} articles en stock
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function demoAlerts() {
  return [
    { name: 'Ray-Ban Wayfarer RB2140', reference: 'RB2140-901-BLK', category: 'Monture', stock_quantity: 0, min_stock: 2 },
    { name: 'Varilux Comfort 3F', reference: 'ESS-VAR-CF3-160', category: 'Verre', stock_quantity: 1, min_stock: 5 },
    { name: 'Acuvue Oasys Daily', reference: 'ACV-OAS-30D', category: 'Lentille', stock_quantity: 3, min_stock: 10 },
    { name: 'Oakley Holbrook', reference: 'OAK-HOL-009102', category: 'Monture', stock_quantity: 0, min_stock: 3 },
    { name: 'Solution Bausch 360ml', reference: 'BSL-SOL-360', category: 'Accessoire', stock_quantity: 2, min_stock: 5 },
  ]
}

function demoMovements() {
  return Array.from({ length: 20 }, (_, i) => ({
    created_at: new Date(Date.now() - i * 3600000 * 6).toISOString(),
    product_name: ['Ray-Ban Wayfarer', 'Varilux Comfort', 'Acuvue Daily'][i % 3],
    reference: `REF-${1000 + i}`,
    movement_type: i % 3 === 0 ? 'in' : 'out',
    quantity: i % 3 === 0 ? Math.floor(Math.random() * 10 + 1) : -Math.floor(Math.random() * 3 + 1),
    reason: ['Vente', 'Réception commande', 'Ajustement inventaire', 'Retour client'][i % 4],
    reference_doc: i % 3 === 0 ? `BC-${String(100 + i).padStart(6, '0')}` : `FAC-${String(200 + i).padStart(6, '0')}`,
  }))
}

function demoValuation() {
  return {
    total_items: 487,
    total_value: 42850000,
    frames_value: 18500000, frames_count: 145,
    lenses_value: 15200000, lenses_count: 208,
    contact_lenses_value: 4200000, contact_lenses_count: 89,
    accessories_value: 4950000, accessories_count: 45,
  }
}
