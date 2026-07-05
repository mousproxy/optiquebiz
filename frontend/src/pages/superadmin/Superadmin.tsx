import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { formatDate } from '../../utils/formatters'

interface Plan {
  id: string
  key: string
  name: string
  price: number
}

interface CompanyRow {
  id: string
  name: string
  is_active: boolean
  created_at: string
  subscriptions: {
    status: string
    trial_ends_at: string | null
    current_period_end: string | null
    plans: { id: string; key: string; name: string }
  } | null
}

export default function Superadmin() {
  const [companies, setCompanies] = useState<CompanyRow[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [selection, setSelection] = useState<Record<string, { planKey: string; status: string }>>({})

  const load = () => {
    setLoading(true)
    Promise.all([api.get('/superadmin/companies'), api.get('/superadmin/plans')])
      .then(([companiesRes, plansRes]) => {
        setCompanies(companiesRes.data)
        setPlans(plansRes.data)
        const initial: Record<string, { planKey: string; status: string }> = {}
        companiesRes.data.forEach((c: CompanyRow) => {
          initial[c.id] = {
            planKey: c.subscriptions?.plans.key || plansRes.data[0]?.key,
            status: c.subscriptions?.status || 'active',
          }
        })
        setSelection(initial)
      })
      .catch(() => toast.error('Erreur lors du chargement'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const save = async (companyId: string) => {
    setSavingId(companyId)
    try {
      await api.patch(`/superadmin/companies/${companyId}/subscription`, selection[companyId])
      toast.success('Abonnement mis à jour')
      load()
    } catch {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner h-10 w-10" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary-600" />
          <div>
            <h1 className="page-title">Administration des sociétés</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gérer les abonnements de chaque société cliente</p>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-dark-border text-left text-slate-500 dark:text-slate-400">
              <th className="px-4 py-3 font-medium">Société</th>
              <th className="px-4 py-3 font-medium">Créée le</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Fin d'essai</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
            {companies.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{c.name}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(new Date(c.created_at), 'dd/MM/yyyy')}</td>
                <td className="px-4 py-3">
                  <select
                    className="form-input !py-1.5"
                    value={selection[c.id]?.planKey}
                    onChange={(e) => setSelection((s) => ({ ...s, [c.id]: { ...s[c.id], planKey: e.target.value } }))}
                  >
                    {plans.map((p) => (
                      <option key={p.key} value={p.key}>{p.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    className="form-input !py-1.5"
                    value={selection[c.id]?.status}
                    onChange={(e) => setSelection((s) => ({ ...s, [c.id]: { ...s[c.id], status: e.target.value } }))}
                  >
                    <option value="trialing">Essai</option>
                    <option value="active">Actif</option>
                    <option value="past_due">Impayé</option>
                    <option value="canceled">Annulé</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                  {c.subscriptions?.trial_ends_at ? formatDate(new Date(c.subscriptions.trial_ends_at), 'dd/MM/yyyy') : '—'}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => save(c.id)}
                    disabled={savingId === c.id}
                    className="btn btn-primary btn-sm"
                  >
                    {savingId === c.id ? <div className="loading-spinner h-4 w-4" /> : 'Enregistrer'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
