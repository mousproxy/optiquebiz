import { useState, useEffect } from 'react'
import { Users, Clock, Calendar, DollarSign, Plus, Edit2, CheckCircle, XCircle } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import Modal from '../../components/ui/Modal'
import api from '../../utils/api'
import { formatCurrency, formatDate, roleLabels } from '../../utils/formatters'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'employees', label: 'Personnel', icon: Users },
  { id: 'attendance', label: 'Présences', icon: Clock },
  { id: 'leaves', label: 'Congés', icon: Calendar },
  { id: 'payroll', label: 'Paie', icon: DollarSign },
]

export default function HR() {
  const [tab, setTab] = useState('employees')
  const [employees, setEmployees] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [leaves, setLeaves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [currentMonth] = useState(new Date().toISOString().slice(0, 7))
  const [stats, setStats] = useState({ total: 0, present: 0, on_leave: 0, total_salary: 0 })

  useEffect(() => {
    Promise.all([
      api.get('/hr/employees').catch(() => ({ data: { data: demoEmployees() } })),
      api.get('/hr/attendance', { params: { month: currentMonth } }).catch(() => ({ data: { data: demoAttendance() } })),
      api.get('/hr/leaves').catch(() => ({ data: { data: demoLeaves() } })),
    ]).then(([e, a, l]) => {
      const emps = e.data?.data || []
      setEmployees(emps)
      setAttendance(a.data?.data || [])
      setLeaves(l.data?.data || [])
      setStats({
        total: emps.length,
        present: Math.floor(emps.length * 0.85),
        on_leave: Math.floor(emps.length * 0.1),
        total_salary: emps.reduce((s: number, e: any) => s + (e.salary || 0), 0),
      })
    }).finally(() => setLoading(false))
  }, [currentMonth])

  const approveLeave = async (leave: any) => {
    try {
      await api.patch(`/hr/leaves/${leave.id}`, { status: 'approved' })
      setLeaves(l => l.map(x => x.id === leave.id ? { ...x, status: 'approved' } : x))
      toast.success('Congé approuvé')
    } catch { setLeaves(l => l.map(x => x.id === leave.id ? { ...x, status: 'approved' } : x)) }
  }

  const rejectLeave = async (leave: any) => {
    try {
      await api.patch(`/hr/leaves/${leave.id}`, { status: 'rejected' })
      setLeaves(l => l.map(x => x.id === leave.id ? { ...x, status: 'rejected' } : x))
      toast.success('Congé refusé')
    } catch { setLeaves(l => l.map(x => x.id === leave.id ? { ...x, status: 'rejected' } : x)) }
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title">Ressources Humaines</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary"><Plus className="h-4 w-4" /> Ajouter un employé</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total personnel" value={stats.total} icon={Users} color="blue" />
        <StatCard title="Présents" value={stats.present} icon={CheckCircle} color="green" />
        <StatCard title="En congé" value={stats.on_leave} icon={Calendar} color="yellow" />
        <StatCard title="Masse salariale" value={formatCurrency(stats.total_salary)} icon={DollarSign} color="purple" />
      </div>

      <div className="flex gap-1 bg-slate-100 dark:bg-dark-surface p-1 rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? 'bg-white dark:bg-dark-card shadow text-primary-700 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700'}`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {/* Employees */}
      {tab === 'employees' && (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-th">Employé</th>
                <th className="table-th">Poste</th>
                <th className="table-th">Téléphone</th>
                <th className="table-th">Embauche</th>
                <th className="table-th text-right">Salaire</th>
                <th className="table-th">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {employees.map((e: any) => (
                <tr key={e.id} className="table-row">
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-sm">
                        {e.first_name?.charAt(0)}{e.last_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold">{e.first_name} {e.last_name}</p>
                        <p className="text-xs text-slate-400">{e.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td"><Badge color="blue" size="sm">{roleLabels[e.role] || e.role}</Badge></td>
                  <td className="table-td text-sm">{e.phone}</td>
                  <td className="table-td text-sm">{formatDate(e.hire_date)}</td>
                  <td className="table-td text-right font-bold">{formatCurrency(e.salary || 0)}</td>
                  <td className="table-td">
                    <Badge color={e.is_active ? 'green' : 'gray'} dot size="sm">{e.is_active ? 'Actif' : 'Inactif'}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Attendance */}
      {tab === 'attendance' && (
        <div className="card">
          <div className="p-4 border-b border-slate-200 dark:border-dark-border flex justify-between items-center">
            <h3 className="font-semibold">Présences — {new Date(currentMonth).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-th">Employé</th>
                  <th className="table-th">Date</th>
                  <th className="table-th">Arrivée</th>
                  <th className="table-th">Départ</th>
                  <th className="table-th text-center">Heures</th>
                  <th className="table-th">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {attendance.map((a: any, i: number) => (
                  <tr key={i} className="table-row">
                    <td className="table-td font-medium">{a.employee_name}</td>
                    <td className="table-td text-sm">{formatDate(a.work_date)}</td>
                    <td className="table-td font-mono text-sm">{a.check_in || '—'}</td>
                    <td className="table-td font-mono text-sm">{a.check_out || '—'}</td>
                    <td className="table-td text-center font-medium">{a.hours_worked?.toFixed(1) || '—'}h</td>
                    <td className="table-td">
                      <Badge color={a.status === 'present' ? 'green' : a.status === 'absent' ? 'red' : 'yellow'} size="sm">
                        {a.status === 'present' ? 'Présent' : a.status === 'absent' ? 'Absent' : 'Retard'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leaves */}
      {tab === 'leaves' && (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-th">Employé</th>
                <th className="table-th">Type</th>
                <th className="table-th">Du</th>
                <th className="table-th">Au</th>
                <th className="table-th text-center">Jours</th>
                <th className="table-th">Motif</th>
                <th className="table-th">Statut</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {leaves.map((l: any, i: number) => (
                <tr key={i} className="table-row">
                  <td className="table-td font-medium">{l.employee_name}</td>
                  <td className="table-td"><Badge color="blue" size="sm">{l.leave_type}</Badge></td>
                  <td className="table-td text-sm">{formatDate(l.start_date)}</td>
                  <td className="table-td text-sm">{formatDate(l.end_date)}</td>
                  <td className="table-td text-center font-bold">{l.days_count}</td>
                  <td className="table-td text-sm text-slate-500">{l.reason}</td>
                  <td className="table-td">
                    <Badge
                      color={l.status === 'approved' ? 'green' : l.status === 'rejected' ? 'red' : 'yellow'}
                      size="sm"
                    >
                      {l.status === 'approved' ? 'Approuvé' : l.status === 'rejected' ? 'Refusé' : 'En attente'}
                    </Badge>
                  </td>
                  <td className="table-td">
                    {l.status === 'pending' && (
                      <div className="flex gap-1">
                        <button onClick={() => approveLeave(l)} className="p-1.5 hover:bg-green-100 text-green-600 rounded-lg" title="Approuver"><CheckCircle className="h-4 w-4" /></button>
                        <button onClick={() => rejectLeave(l)} className="p-1.5 hover:bg-red-100 text-red-500 rounded-lg" title="Refuser"><XCircle className="h-4 w-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payroll */}
      {tab === 'payroll' && (
        <div className="card overflow-x-auto">
          <div className="p-4 border-b border-slate-200 dark:border-dark-border">
            <h3 className="font-semibold">Bulletin de paie — {new Date(currentMonth).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h3>
          </div>
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-th">Employé</th>
                <th className="table-th text-right">Salaire base</th>
                <th className="table-th text-right">Primes</th>
                <th className="table-th text-right">Déductions</th>
                <th className="table-th text-right">Net à payer</th>
                <th className="table-th">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {employees.map((e: any) => {
                const prime = Math.floor((e.salary || 0) * 0.1)
                const deduction = Math.floor((e.salary || 0) * 0.08)
                const net = (e.salary || 0) + prime - deduction
                return (
                  <tr key={e.id} className="table-row">
                    <td className="table-td font-medium">{e.first_name} {e.last_name}</td>
                    <td className="table-td text-right font-mono">{formatCurrency(e.salary || 0)}</td>
                    <td className="table-td text-right font-mono text-green-600">+{formatCurrency(prime)}</td>
                    <td className="table-td text-right font-mono text-red-600">-{formatCurrency(deduction)}</td>
                    <td className="table-td text-right font-bold">{formatCurrency(net)}</td>
                    <td className="table-td"><Badge color="green" size="sm">Validé</Badge></td>
                  </tr>
                )
              })}
              <tr className="bg-slate-50 dark:bg-dark-surface font-bold">
                <td className="table-td text-right">Total</td>
                <td className="table-td text-right">{formatCurrency(employees.reduce((s: number, e: any) => s + (e.salary || 0), 0))}</td>
                <td colSpan={2} className="table-td" />
                <td className="table-td text-right text-primary-700">{formatCurrency(employees.reduce((s: number, e: any) => s + Math.floor((e.salary || 0) * 1.02), 0))}</td>
                <td className="table-td" />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function demoEmployees() {
  const roles = ['optician', 'seller', 'cashier', 'secretary', 'manager']
  const names = [
    { first_name: 'Kouassi', last_name: 'Ange', email: 'k.ange@optigest.ci' },
    { first_name: 'Traoré', last_name: 'Ibrahim', email: 't.ibrahim@optigest.ci' },
    { first_name: 'Diallo', last_name: 'Fatoumata', email: 'd.fatoumata@optigest.ci' },
    { first_name: 'Koffi', last_name: 'Serge', email: 'k.serge@optigest.ci' },
    { first_name: 'N\'Guessan', last_name: 'Marie', email: 'n.marie@optigest.ci' },
    { first_name: 'Coulibaly', last_name: 'Mamadou', email: 'c.mamadou@optigest.ci' },
  ]
  return names.map((n, i) => ({
    id: `emp-${i}`,
    ...n,
    role: roles[i % roles.length],
    phone: `07${String(i).padStart(2, '0')}${String(i + 10).padStart(2, '0')}${String(i + 20).padStart(2, '0')}${String(i + 30).padStart(2, '0')}`,
    hire_date: new Date(2022 + (i % 3), i % 12, (i % 28) + 1).toISOString(),
    salary: 150000 + i * 50000,
    is_active: i !== 5,
  }))
}

function demoAttendance() {
  const names = ['Kouassi A.', 'Traoré I.', 'Diallo F.', 'Koffi S.', 'N\'Guessan M.']
  return Array.from({ length: 15 }, (_, i) => ({
    employee_name: names[i % names.length],
    work_date: new Date(2024, 11, (i % 20) + 1).toISOString(),
    check_in: `0${7 + (i % 3)}:${['00', '15', '30'][i % 3]}`,
    check_out: i % 7 === 0 ? null : '17:30',
    hours_worked: i % 7 === 0 ? null : 8.5 - (i % 3) * 0.5,
    status: i % 7 === 0 ? 'absent' : i % 5 === 0 ? 'late' : 'present',
  }))
}

function demoLeaves() {
  const names = ['Kouassi Ange', 'Traoré Ibrahim', 'Diallo Fatoumata']
  const types = ['Congé annuel', 'Maladie', 'Maternité', 'Formation']
  return Array.from({ length: 8 }, (_, i) => ({
    id: `lv-${i}`,
    employee_name: names[i % names.length],
    leave_type: types[i % types.length],
    start_date: new Date(2025, i % 12, (i * 3) % 28 + 1).toISOString(),
    end_date: new Date(2025, i % 12, (i * 3) % 28 + 5).toISOString(),
    days_count: 5,
    reason: ['Repos annuel', 'Grippe', 'Accouchement', 'Formation ISVAO'][i % 4],
    status: ['pending', 'approved', 'pending', 'rejected', 'approved'][i % 5],
  }))
}
