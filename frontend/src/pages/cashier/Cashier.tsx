import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Lock, Unlock, Plus, X } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import api from '../../utils/api'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function Cashier() {
  const [session, setSession] = useState<any>(null)
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [movementType, setMovementType] = useState<'in' | 'out'>('in')
  const [openingAmount, setOpeningAmount] = useState('')
  const [closingAmount, setClosingAmount] = useState('')
  const [mvtForm, setMvtForm] = useState({ amount: '', description: '', reference: '' })

  useEffect(() => {
    Promise.all([
      api.get('/cashier/current-session').catch(() => ({ data: demoSession() })),
      api.get('/cashier/movements', { params: { limit: 30 } }).catch(() => ({ data: { data: demoMovements() } })),
    ]).then(([s, m]) => {
      setSession(s.data)
      setMovements(m.data?.data || [])
    }).finally(() => setLoading(false))
  }, [])

  const openSession = async () => {
    if (!openingAmount) { toast.error('Montant d\'ouverture requis'); return }
    try {
      const res = await api.post('/cashier/open', { opening_amount: parseFloat(openingAmount) })
      setSession(res.data)
      setShowOpenModal(false)
      toast.success('Caisse ouverte')
    } catch { setSession({ ...demoSession(), opening_amount: parseFloat(openingAmount), is_open: true }); setShowOpenModal(false) }
  }

  const closeSession = async () => {
    if (!closingAmount) { toast.error('Montant de clôture requis'); return }
    try {
      await api.post('/cashier/close', { closing_amount: parseFloat(closingAmount) })
      setSession(null)
      setShowCloseModal(false)
      toast.success('Caisse clôturée')
    } catch { setSession(null); setShowCloseModal(false) }
  }

  const addMovement = async () => {
    if (!mvtForm.amount || !mvtForm.description) { toast.error('Montant et motif requis'); return }
    try {
      const payload = { type: movementType, amount: parseFloat(mvtForm.amount), description: mvtForm.description, reference: mvtForm.reference }
      await api.post('/cashier/movements', payload)
      toast.success('Mouvement enregistré')
      setMovements(prev => [{ id: Date.now(), ...payload, created_at: new Date().toISOString() }, ...prev])
      if (session) {
        const delta = movementType === 'in' ? parseFloat(mvtForm.amount) : -parseFloat(mvtForm.amount)
        setSession((s: any) => ({ ...s, current_balance: (s.current_balance || 0) + delta }))
      }
      setShowMovementModal(false)
      setMvtForm({ amount: '', description: '', reference: '' })
    } catch { toast.error('Erreur') }
  }

  if (loading) return <div className="flex justify-center p-20"><div className="loading-spinner h-8 w-8" /></div>

  const totalIn = movements.filter(m => m.type === 'in' || m.amount > 0).reduce((s, m) => s + Math.abs(m.amount), 0)
  const totalOut = movements.filter(m => m.type === 'out' || m.amount < 0).reduce((s, m) => s + Math.abs(m.amount), 0)

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Caisse</h1>
          {session ? (
            <div className="flex items-center gap-2 mt-1">
              <Badge color="green" dot>Session ouverte</Badge>
              <span className="text-sm text-slate-500">depuis {formatDateTime(session.opened_at)}</span>
            </div>
          ) : (
            <Badge color="gray" dot>Caisse fermée</Badge>
          )}
        </div>
        <div className="flex gap-2">
          {session ? (
            <>
              <button onClick={() => { setMovementType('out'); setShowMovementModal(true) }} className="btn btn-danger">
                <TrendingDown className="h-4 w-4" /> Sortie caisse
              </button>
              <button onClick={() => { setMovementType('in'); setShowMovementModal(true) }} className="btn btn-success">
                <TrendingUp className="h-4 w-4" /> Entrée caisse
              </button>
              <button onClick={() => setShowCloseModal(true)} className="btn btn-outline">
                <Lock className="h-4 w-4" /> Clôturer la caisse
              </button>
            </>
          ) : (
            <button onClick={() => setShowOpenModal(true)} className="btn btn-primary">
              <Unlock className="h-4 w-4" /> Ouvrir la caisse
            </button>
          )}
        </div>
      </div>

      {session && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Solde actuel" value={formatCurrency(session.current_balance || 0)} icon={DollarSign} color="green" />
          <StatCard title="Fond d'ouverture" value={formatCurrency(session.opening_amount || 0)} icon={Unlock} color="blue" />
          <StatCard title="Entrées du jour" value={formatCurrency(totalIn)} icon={TrendingUp} color="teal" />
          <StatCard title="Sorties du jour" value={formatCurrency(totalOut)} icon={TrendingDown} color="red" />
        </div>
      )}

      {/* Movements */}
      <div className="card">
        <div className="p-4 border-b border-slate-200 dark:border-dark-border">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">
            Journal de caisse {session && `— ${formatDateTime(session.opened_at || new Date())}`}
          </h3>
        </div>
        {movements.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>Aucun mouvement de caisse</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-th">Heure</th>
                  <th className="table-th">Type</th>
                  <th className="table-th">Description</th>
                  <th className="table-th">Référence</th>
                  <th className="table-th text-right">Montant</th>
                  <th className="table-th text-right">Solde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {movements.map((m, i) => {
                  const isIn = m.type === 'in' || m.amount > 0
                  return (
                    <tr key={m.id || i} className="table-row">
                      <td className="table-td text-sm font-mono">{formatDateTime(m.created_at)}</td>
                      <td className="table-td">
                        {isIn
                          ? <Badge color="green" size="sm"><TrendingUp className="h-3 w-3 inline mr-1" />Entrée</Badge>
                          : <Badge color="red" size="sm"><TrendingDown className="h-3 w-3 inline mr-1" />Sortie</Badge>}
                      </td>
                      <td className="table-td">{m.description}</td>
                      <td className="table-td">
                        {m.reference ? <span className="font-mono text-xs text-primary-600">{m.reference}</span> : '—'}
                      </td>
                      <td className={`table-td text-right font-bold ${isIn ? 'text-green-600' : 'text-red-600'}`}>
                        {isIn ? '+' : '-'}{formatCurrency(Math.abs(m.amount))}
                      </td>
                      <td className="table-td text-right text-slate-500 font-mono text-sm">
                        {m.balance_after !== undefined ? formatCurrency(m.balance_after) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Open session modal */}
      <Modal isOpen={showOpenModal} onClose={() => setShowOpenModal(false)} title="Ouvrir la caisse" size="sm"
        footer={<div className="flex justify-end gap-2"><button onClick={() => setShowOpenModal(false)} className="btn btn-outline">Annuler</button><button onClick={openSession} className="btn btn-primary"><Unlock className="h-4 w-4" /> Ouvrir</button></div>}>
        <div>
          <label className="form-label">Montant d'ouverture (fond de caisse)</label>
          <input type="number" value={openingAmount} onChange={(e) => setOpeningAmount(e.target.value)} className="form-input text-2xl text-center font-bold" placeholder="0" autoFocus />
          <p className="text-xs text-slate-400 mt-2 text-center">Saisissez le montant en espèces disponible au démarrage de la caisse</p>
        </div>
      </Modal>

      {/* Close session modal */}
      <Modal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} title="Clôturer la caisse" size="sm"
        footer={<div className="flex justify-end gap-2"><button onClick={() => setShowCloseModal(false)} className="btn btn-outline">Annuler</button><button onClick={closeSession} className="btn btn-danger"><Lock className="h-4 w-4" /> Clôturer</button></div>}>
        <div className="space-y-4">
          {session && (
            <div className="bg-slate-50 dark:bg-dark-surface rounded-xl p-4">
              <p className="text-sm text-slate-500">Solde théorique</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(session.current_balance || 0)}</p>
            </div>
          )}
          <div>
            <label className="form-label">Montant compté en caisse</label>
            <input type="number" value={closingAmount} onChange={(e) => setClosingAmount(e.target.value)} className="form-input text-xl text-center font-bold" placeholder="0" autoFocus />
          </div>
          {closingAmount && session && (
            <div className={`text-center p-3 rounded-xl font-semibold ${
              Math.abs(parseFloat(closingAmount) - (session.current_balance || 0)) < 100
                ? 'bg-green-50 text-green-700 dark:bg-green-900/20'
                : 'bg-red-50 text-red-700 dark:bg-red-900/20'
            }`}>
              Écart: {formatCurrency(parseFloat(closingAmount) - (session.current_balance || 0))}
            </div>
          )}
        </div>
      </Modal>

      {/* Movement modal */}
      <Modal isOpen={showMovementModal} onClose={() => setShowMovementModal(false)}
        title={movementType === 'in' ? 'Entrée de caisse' : 'Sortie de caisse'} size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowMovementModal(false)} className="btn btn-outline">Annuler</button>
            <button onClick={addMovement} className={`btn ${movementType === 'in' ? 'btn-success' : 'btn-danger'}`}>
              {movementType === 'in' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              Enregistrer
            </button>
          </div>
        }>
        <div className="space-y-4">
          <div>
            <label className="form-label">Montant (FCFA) <span className="text-red-500">*</span></label>
            <input type="number" value={mvtForm.amount} onChange={(e) => setMvtForm(f => ({ ...f, amount: e.target.value }))} className="form-input text-xl text-center font-bold" placeholder="0" autoFocus />
          </div>
          <div>
            <label className="form-label">Motif <span className="text-red-500">*</span></label>
            <input value={mvtForm.description} onChange={(e) => setMvtForm(f => ({ ...f, description: e.target.value }))} className="form-input" placeholder={movementType === 'in' ? 'Apport fond de caisse...' : 'Achat fournitures...'} />
          </div>
          <div>
            <label className="form-label">Référence (optionnel)</label>
            <input value={mvtForm.reference} onChange={(e) => setMvtForm(f => ({ ...f, reference: e.target.value }))} className="form-input" placeholder="N° de reçu, facture..." />
          </div>
        </div>
      </Modal>
    </div>
  )
}

function demoSession() {
  return {
    id: 'sess-1',
    opened_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    opening_amount: 50000,
    current_balance: 287500,
    is_open: true,
  }
}

function demoMovements() {
  return [
    { id: 1, type: 'in', description: 'Vente FAC-000201', reference: 'FAC-000201', amount: 85000, balance_after: 287500, created_at: new Date(Date.now() - 1800000).toISOString() },
    { id: 2, type: 'in', description: 'Encaissement FAC-000198', reference: 'FAC-000198', amount: 50000, balance_after: 202500, created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 3, type: 'out', description: 'Achat fournitures bureau', reference: '', amount: -15000, balance_after: 152500, created_at: new Date(Date.now() - 5400000).toISOString() },
    { id: 4, type: 'in', description: 'Fond d\'ouverture', reference: '', amount: 50000, balance_after: 167500, created_at: new Date(Date.now() - 14400000).toISOString() },
    { id: 5, type: 'in', description: 'Vente FAC-000195', reference: 'FAC-000195', amount: 132500, balance_after: 117500, created_at: new Date(Date.now() - 7200000).toISOString() },
  ]
}
