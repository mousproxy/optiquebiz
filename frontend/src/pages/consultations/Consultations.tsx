import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Edit, Printer } from 'lucide-react'
import DataTable, { Column } from '../../components/ui/DataTable'
import api from '../../utils/api'
import { formatDate, formatSph } from '../../utils/formatters'

export default function Consultations() {
  const navigate = useNavigate()
  const [consultations, setConsultations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    api.get('/consultations', { params: { page, limit: 20 } })
      .then(({ data }) => { setConsultations(data.data || demo()); setTotal(data.pagination?.total || 0) })
      .catch(() => { setConsultations(demo()); setTotal(20) })
      .finally(() => setLoading(false))
  }, [page])

  const columns: Column<any>[] = [
    { key: 'consultation_date', label: 'Date', render: (v) => formatDate(v) },
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
      label: 'OD SPH',
      className: 'text-center',
      render: (v) => <span className="font-mono">{formatSph(v)}</span>,
    },
    {
      key: 'og_sph',
      label: 'OG SPH',
      className: 'text-center',
      render: (v) => <span className="font-mono">{formatSph(v)}</span>,
    },
    { key: 'diagnosis', label: 'Diagnostic', render: (v) => <span className="truncate max-w-xs block">{v || '—'}</span> },
    {
      key: 'users_consultations_doctor_idTousers',
      label: 'Médecin',
      render: (v) => v ? `Dr. ${v.first_name} ${v.last_name}` : '—',
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); navigate(`/consultations/${row.id}`) }} className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg">
            <Eye className="h-4 w-4" />
          </button>
          <button className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg">
            <Printer className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="page-header">
        <h1 className="page-title">Consultations</h1>
        <button onClick={() => navigate('/consultations/new')} className="btn btn-primary">
          <Plus className="h-4 w-4" /> Nouvelle consultation
        </button>
      </div>
      <DataTable
        columns={columns}
        data={consultations}
        loading={loading}
        onRowClick={(row) => navigate(`/consultations/${row.id}`)}
        total={total}
        page={page}
        limit={20}
        onPageChange={setPage}
        searchable
        onSearch={setSearch}
        searchValue={search}
        emptyMessage="Aucune consultation"
      />
    </div>
  )
}

function demo() {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `c-${i}`,
    consultation_date: new Date(2024, i % 12, (i % 28) + 1).toISOString(),
    patients: { first_name: ['Kouassi', 'Traoré', 'Diallo'][i % 3], last_name: ['A.', 'I.', 'F.'][i % 3], phone: '0707070707' },
    od_sph: (-(i % 5) - 0.5),
    og_sph: (-(i % 4) - 0.25),
    diagnosis: ['Myopie légère', 'Hypermétropie', 'Astigmatisme'][i % 3],
    users_consultations_doctor_idTousers: { first_name: 'Koffi', last_name: 'Emmanuel' },
  }))
}
