import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Truck, CheckCircle } from 'lucide-react'
import DataTable, { Column } from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import api from '../../utils/api'
import { formatCurrency, formatDate, getOrderStatus } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function Purchases() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/purchases', { params: { page, limit: 20, search: search || undefined } })
      .then(({ data }) => { setOrders(data.data || demoData()); setTotal(data.pagination?.total || 0) })
      .catch(() => { setOrders(demoData()); setTotal(30) })
      .finally(() => setLoading(false))
  }, [page, search])

  const handleReceive = async (order: any) => {
    try {
      await api.patch(`/purchases/${order.id}/receive`)
      setOrders(o => o.map(x => x.id === order.id ? { ...x, status: 'received' } : x))
      toast.success('Commande marquée comme reçue')
    } catch {}
  }

  const columns: Column<any>[] = [
    { key: 'reference', label: 'Référence', render: (v) => <span className="font-mono text-xs text-primary-600 font-semibold">{v}</span> },
    { key: 'order_date', label: 'Date', render: (v) => formatDate(v) },
    { key: 'expected_date', label: 'Livraison prévue', render: (v) => v ? formatDate(v) : '—' },
    {
      key: 'suppliers',
      label: 'Fournisseur',
      render: (_, row) => (
        <div>
          <p className="font-medium">{row.suppliers?.company_name}</p>
          <p className="text-xs text-slate-400">{row.suppliers?.phone}</p>
        </div>
      ),
    },
    { key: 'total_amount', label: 'Total', sortable: true, render: (v) => <span className="font-bold">{formatCurrency(v)}</span> },
    {
      key: 'paid_amount',
      label: 'Payé',
      render: (v, row) => (
        <div>
          <p className="text-green-600 font-medium">{formatCurrency(v)}</p>
          {row.remaining_amount > 0 && <p className="text-xs text-orange-500">Reste: {formatCurrency(row.remaining_amount)}</p>}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      render: (v) => {
        const s = getOrderStatus(v)
        return <Badge color={s.color as any} size="sm">{s.label}</Badge>
      },
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); navigate(`/purchases/${row.id}`) }} className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg" title="Voir"><Eye className="h-4 w-4" /></button>
          {row.status === 'sent' && (
            <button onClick={(e) => { e.stopPropagation(); handleReceive(row) }} className="p-1.5 hover:bg-green-100 text-green-600 rounded-lg" title="Marquer reçue">
              <Truck className="h-4 w-4" />
            </button>
          )}
          {row.status === 'received' && <CheckCircle className="h-4 w-4 text-green-500 m-1.5" />}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Commandes fournisseurs</h1>
          <p className="text-slate-500 text-sm">{total} commande{total > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => navigate('/purchases/new')} className="btn btn-primary">
          <Plus className="h-4 w-4" /> Nouvelle commande
        </button>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        onRowClick={(row) => navigate(`/purchases/${row.id}`)}
        total={total}
        page={page}
        limit={20}
        onPageChange={setPage}
        searchable
        onSearch={setSearch}
        searchValue={search}
        emptyMessage="Aucune commande"
      />
    </div>
  )
}

function demoData() {
  const statuses = ['draft', 'sent', 'partial', 'received', 'cancelled']
  const suppliers = [
    { company_name: 'Luxottica Afrique', phone: '0202020202' },
    { company_name: 'Essilor Côte d\'Ivoire', phone: '0505050505' },
    { company_name: 'Optic Distribution CI', phone: '0707070707' },
  ]
  return Array.from({ length: 15 }, (_, i) => ({
    id: `po-${i}`,
    reference: `BC-${String(100 + i).padStart(6, '0')}`,
    order_date: new Date(2024, 11, 20 - i).toISOString(),
    expected_date: new Date(2024, 11, 27 - i).toISOString(),
    suppliers: suppliers[i % suppliers.length],
    total_amount: Math.floor(Math.random() * 2000000 + 200000),
    paid_amount: Math.floor(Math.random() * 1500000 + 100000),
    remaining_amount: i % 3 === 0 ? Math.floor(Math.random() * 500000) : 0,
    status: statuses[i % statuses.length],
  }))
}
