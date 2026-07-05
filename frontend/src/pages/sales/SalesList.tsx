import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Printer, CreditCard } from 'lucide-react'
import DataTable, { Column } from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import api from '../../utils/api'
import { formatCurrency, formatDate, getSaleStatus } from '../../utils/formatters'

export default function SalesList() {
  const navigate = useNavigate()
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/sales', { params: { page, limit: 20, search: search || undefined } })
      .then(({ data }) => { setSales(data.data || demoSales()); setTotal(data.pagination?.total || 0) })
      .catch(() => { setSales(demoSales()); setTotal(50) })
      .finally(() => setLoading(false))
  }, [page, search])

  const columns: Column<any>[] = [
    {
      key: 'reference',
      label: 'Référence',
      render: (v) => <span className="font-mono text-xs text-primary-600 font-semibold">{v}</span>,
    },
    { key: 'sale_date', label: 'Date', render: (v) => formatDate(v) },
    {
      key: 'patients',
      label: 'Patient',
      render: (_, row) => (
        <div>
          <p className="font-medium">{row.patients?.first_name} {row.patients?.last_name}</p>
          <p className="text-xs text-slate-400">{row.patients?.phone}</p>
        </div>
      ),
    },
    {
      key: 'total_amount',
      label: 'Total',
      sortable: true,
      render: (v) => <span className="font-bold">{formatCurrency(v)}</span>,
    },
    {
      key: 'paid_amount',
      label: 'Payé',
      render: (v) => <span className="text-green-600 font-medium">{formatCurrency(v)}</span>,
    },
    {
      key: 'remaining_amount',
      label: 'Reste',
      render: (v) => v > 0
        ? <span className="text-orange-600 font-semibold">{formatCurrency(v)}</span>
        : <span className="text-slate-400">—</span>,
    },
    {
      key: 'status',
      label: 'Statut',
      render: (v) => {
        const s = getSaleStatus(v)
        return <Badge color={s.color as any} size="sm">{s.label}</Badge>
      },
    },
    {
      key: 'is_ready',
      label: 'Prêt',
      render: (v) => v ? <Badge color="green" size="sm">Prêt</Badge> : <Badge color="gray" size="sm">En cours</Badge>,
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); navigate(`/sales/${row.id}`) }} className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg" title="Voir">
            <Eye className="h-4 w-4" />
          </button>
          <button className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg" title="Imprimer">
            <Printer className="h-4 w-4" />
          </button>
          {row.remaining_amount > 0 && (
            <button className="p-1.5 hover:bg-green-100 text-green-600 rounded-lg" title="Encaisser">
              <CreditCard className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ventes</h1>
          <p className="text-slate-500 text-sm">{total} vente{total > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => navigate('/pos')} className="btn btn-primary">
          <Plus className="h-4 w-4" /> Nouvelle vente
        </button>
      </div>

      <DataTable
        columns={columns}
        data={sales}
        loading={loading}
        onRowClick={(row) => navigate(`/sales/${row.id}`)}
        total={total}
        page={page}
        limit={20}
        onPageChange={setPage}
        searchable
        onSearch={setSearch}
        searchValue={search}
        emptyMessage="Aucune vente"
      />
    </div>
  )
}

function demoSales() {
  const statuses = ['completed', 'partial', 'pending', 'completed', 'completed']
  return Array.from({ length: 15 }, (_, i) => ({
    id: `sale-${i}`,
    reference: `FAC-${String(200 - i).padStart(6, '0')}`,
    sale_date: new Date(2024, 11, 28 - i).toISOString(),
    patients: { first_name: ['Kouassi', 'Traoré', 'Diallo'][i % 3], last_name: ['A.', 'I.', 'F.'][i % 3], phone: '0707070707' },
    total_amount: Math.floor(Math.random() * 300000 + 50000),
    paid_amount: Math.floor(Math.random() * 250000 + 40000),
    remaining_amount: i % 3 === 0 ? Math.floor(Math.random() * 50000) : 0,
    status: statuses[i % statuses.length],
    is_ready: i % 4 !== 0,
  }))
}
