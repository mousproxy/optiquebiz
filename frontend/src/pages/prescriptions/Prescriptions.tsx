import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Printer, QrCode, ShoppingCart } from 'lucide-react'
import DataTable, { Column } from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import api from '../../utils/api'
import { formatDate, formatSph, formatCyl, formatAxe, formatAdd } from '../../utils/formatters'

export default function Prescriptions() {
  const navigate = useNavigate()
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    api.get('/prescriptions', { params: { page, limit: 20 } })
      .then(({ data }) => { setPrescriptions(data.data || demo()); setTotal(data.pagination?.total || 0) })
      .catch(() => { setPrescriptions(demo()); setTotal(20) })
      .finally(() => setLoading(false))
  }, [page])

  const columns: Column<any>[] = [
    { key: 'reference', label: 'Référence', render: (v) => <span className="font-mono text-xs text-primary-600 font-semibold">{v}</span> },
    { key: 'prescription_date', label: 'Date', render: (v) => formatDate(v) },
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
      key: 'od_sph',
      label: 'OD',
      className: 'text-center',
      render: (_, row) => (
        <span className="font-mono text-xs">
          {formatSph(row.od_sph)} / {formatCyl(row.od_cyl)} x {formatAxe(row.od_axe)}
        </span>
      ),
    },
    {
      key: 'og_sph',
      label: 'OG',
      className: 'text-center',
      render: (_, row) => (
        <span className="font-mono text-xs">
          {formatSph(row.og_sph)} / {formatCyl(row.og_cyl)} x {formatAxe(row.og_axe)}
        </span>
      ),
    },
    { key: 'od_add', label: 'ADD', className: 'text-center', render: (v) => <span className="font-mono text-xs">{formatAdd(v)}</span> },
    {
      key: 'expiry_date',
      label: 'Validité',
      render: (v) => {
        if (!v) return '—'
        const expired = new Date(v) < new Date()
        return <Badge color={expired ? 'red' : 'green'} size="sm">{expired ? 'Expirée' : formatDate(v)}</Badge>
      },
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); }} className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg" title="Imprimer">
            <Printer className="h-4 w-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); navigate(`/pos?prescriptionId=${row.id}&patientId=${row.patient_id}`) }} className="p-1.5 hover:bg-green-100 text-green-600 rounded-lg" title="Créer vente">
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="page-header">
        <h1 className="page-title">Ordonnances</h1>
        <button onClick={() => navigate('/prescriptions/new')} className="btn btn-primary">
          <Plus className="h-4 w-4" /> Nouvelle ordonnance
        </button>
      </div>
      <DataTable
        columns={columns}
        data={prescriptions}
        loading={loading}
        onRowClick={(row) => navigate(`/prescriptions/${row.id}`)}
        total={total}
        page={page}
        limit={20}
        onPageChange={setPage}
        searchable
        emptyMessage="Aucune ordonnance"
      />
    </div>
  )
}

function demo() {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `p-${i}`,
    reference: `ORD-${String(100 + i).padStart(6, '0')}`,
    prescription_date: new Date(2024, i % 12, (i % 28) + 1).toISOString(),
    patients: { first_name: ['Kouassi', 'Traoré', 'Diallo'][i % 3], last_name: ['A.', 'I.', 'F.'][i % 3], phone: '0707070707' },
    patient_id: `pat-${i}`,
    od_sph: -(i % 5) - 0.5,
    od_cyl: -(i % 3) * 0.5,
    od_axe: (i % 4) * 45,
    og_sph: -(i % 4) - 0.25,
    og_cyl: -(i % 2) * 0.5,
    og_axe: (i % 3) * 60,
    od_add: i % 3 === 0 ? 1.5 : null,
    expiry_date: new Date(2025, (i + 6) % 12, 15).toISOString(),
  }))
}
