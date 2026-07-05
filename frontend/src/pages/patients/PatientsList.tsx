import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Edit, Phone, MapPin, Calendar, Download } from 'lucide-react'
import DataTable, { Column } from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import api from '../../utils/api'
import { Patient } from '../../types'
import { formatDate, genderLabels } from '../../utils/formatters'
import { useDebounce } from '../../hooks/useDebounce'
import toast from 'react-hot-toast'

export default function PatientsList() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const debouncedSearch = useDebounce(search, 400)
  const LIMIT = 20

  const loadPatients = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/patients', {
        params: { search: debouncedSearch || undefined, page, limit: LIMIT },
      })
      setPatients(data.data || filterDemoPatients(debouncedSearch))
      setTotal(data.pagination?.total || filterDemoPatients(debouncedSearch).length)
    } catch {
      const demo = filterDemoPatients(debouncedSearch)
      setPatients(demo)
      setTotal(demo.length)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page])

  useEffect(() => { loadPatients() }, [loadPatients])
  useEffect(() => { setPage(1) }, [debouncedSearch])

  const handleExport = () => {
    const headers = ['Code', 'Prénom', 'Nom', 'Sexe', 'Téléphone', 'Ville', 'Date création']
    const rows = patients.map(p => [
      p.code,
      p.firstName,
      p.lastName,
      p.gender === 'M' ? 'Masculin' : p.gender === 'F' ? 'Féminin' : p.gender || '',
      p.phone,
      p.city || 'Abidjan',
      formatDate(p.createdAt),
    ])
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `patients-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${patients.length} patients exportés`)
  }

  const columns: Column<Patient>[] = [
    {
      key: 'code',
      label: 'Code',
      className: 'w-28',
      render: (val) => <span className="font-mono text-xs text-primary-600 dark:text-primary-400 font-semibold">{val}</span>,
    },
    {
      key: 'lastName',
      label: 'Patient',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
            {row.photoUrl ? (
              <img src={row.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-primary-700 dark:text-primary-300">
                {row.firstName?.charAt(0)}{row.lastName?.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-200">
              {row.firstName} {row.lastName}
            </p>
            <p className="text-xs text-slate-400">
              {row.age ? `${row.age} ans` : ''} {row.gender ? `• ${genderLabels[row.gender]}` : ''}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Téléphone',
      render: (val) => (
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <Phone className="h-3.5 w-3.5 text-slate-400" />
          {val}
        </div>
      ),
    },
    {
      key: 'city',
      label: 'Ville',
      className: 'hidden md:table-cell',
      render: (val) => (
        <div className="flex items-center gap-1.5 text-slate-500">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          {val || 'Abidjan'}
        </div>
      ),
    },
    {
      key: '_count',
      label: 'Consultations',
      className: 'hidden lg:table-cell text-center',
      render: (val) => (
        <Badge color="blue" size="sm">{val?.consultations || 0}</Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Créé le',
      className: 'hidden xl:table-cell',
      render: (val) => <span className="text-slate-400 text-xs">{formatDate(val)}</span>,
    },
    {
      key: 'id',
      label: 'Actions',
      className: 'w-24',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/patients/${row.id}`) }}
            className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 dark:hover:bg-blue-900/30"
            title="Voir la fiche"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/patients/${row.id}/edit`) }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 dark:hover:bg-dark-hover"
            title="Modifier"
          >
            <Edit className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {total} patient{total > 1 ? 's' : ''} enregistré{total > 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => navigate('/patients/new')} className="btn btn-primary">
          <Plus className="h-4 w-4" />
          Nouveau patient
        </button>
      </div>

      <DataTable
        columns={columns}
        data={patients}
        loading={loading}
        onRowClick={(row) => navigate(`/patients/${row.id}`)}
        total={total}
        page={page}
        limit={LIMIT}
        onPageChange={setPage}
        searchable
        onSearch={setSearch}
        searchValue={search}
        emptyMessage="Aucun patient trouvé"
        actions={
          <button onClick={handleExport} className="btn btn-outline btn-sm">
            <Download className="h-4 w-4" /> Exporter CSV
          </button>
        }
      />
    </div>
  )
}

// Filtre les données de démo selon la recherche
function filterDemoPatients(search: string): Patient[] {
  const all = generateDemoPatients()
  if (!search) return all
  const s = search.toLowerCase()
  return all.filter(p =>
    p.firstName.toLowerCase().includes(s) ||
    p.lastName.toLowerCase().includes(s) ||
    p.phone.includes(s) ||
    p.code.toLowerCase().includes(s) ||
    (p.city || '').toLowerCase().includes(s)
  )
}

function generateDemoPatients(): Patient[] {
  const firstNames = ['Kouassi', 'Traoré', 'Diallo', 'Bamba', 'Koné', 'Touré', 'Coulibaly', 'Sanogo', 'Ouédraogo', 'Dembélé']
  const lastNames = ['Ama', 'Ibrahim', 'Fatoumata', 'Seydou', 'Mariama', 'Dramane', 'Kadiatou', 'Brahima', 'Mamadou', 'Aïssatou']
  const cities = ['Abidjan', 'Bouaké', 'Yamoussoukro', 'Korhogo']

  return Array.from({ length: 50 }, (_, i) => ({
    id: `pat-${i}`,
    code: `PAT-${String(1001 + i).padStart(6, '0')}`,
    firstName: firstNames[i % firstNames.length],
    lastName: lastNames[i % lastNames.length],
    gender: (i % 2 === 0 ? 'M' : 'F') as any,
    dateOfBirth: `${1970 + (i % 35)}-${String((i % 12) + 1).padStart(2, '0')}-15`,
    age: 25 + (i % 35),
    phone: `07${String(70000000 + i * 137).padStart(8, '0')}`,
    email: `patient${i}@gmail.com`,
    city: cities[i % 4],
    profession: ['Enseignant', 'Commerçant', 'Fonctionnaire', 'Étudiant'][i % 4],
    isActive: true,
    createdAt: new Date(2024, i % 12, (i % 28) + 1).toISOString(),
    updatedAt: new Date().toISOString(),
    _count: {
      consultations: Math.floor((i * 7) % 10),
      prescriptions: Math.floor((i * 3) % 5),
      sales: Math.floor((i * 5) % 8),
      appointments: Math.floor((i * 4) % 12),
    },
  }))
}
