import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Lock, Unlock, Plus } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import api from '../../utils/api'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import toast from 'react-hot-toast'

interface Register {
  id: string
  code: string
  name: string
  location?: string
  current_balance: number
  is_open: boolean
  cash_sessions: { id: string; opened_at: string; opening_amount: number }[]
}

export default function Cashier() {
  const [registers, setRegisters] = useState<Register[]>([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [register, setRegister] = useState<Register | null>(null)
  const [movements, setMovements] = useState<any[]>([])
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [movementType, setMovementType] = useState<'in' | 'out'>('in')
  const [selectedRegisterId, setSelectedRegisterId] = useState('')
  const [openingAmount, setOpeningAmount] = useState('')
  const [closingAmount, setClosingAmount] = useState('')
  const [mvtForm, setMvtForm] = useState({ amount: '', description: '', reference: '' })
  const [registerForm, setRegisterForm] = useState({ code: '', name: '', location: '' })
  const [savingRegister, setSavingRegister] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/cashier/registers')
      .then(({ data }) => {
        setRegisters(data)
        const open = data.find((r: Register) => r.cash_sessions?.length > 0)
        if (open) {
          setRegister(open)
          setSession(open.cash_sessions[0])
          loadMovements(open.cash_sessions[0].id)
        } else {
          setRegister(null)
          setSession(null)
          setMovements([])
        }
      })
      .catch(() => toast.error('Erreur lors du chargement des caisses'))
      .finally(() => setLoading(false))
  }

  const loadMovements = (sessionId: string) => {
    api.get(`/cashier/session/${sessionId}/movements`)
      .then(({ data }) => setMovements(data))
      .catch(() => {})
  }

  useEffect(load, [])

  const openSession = async () => {
    if (!selectedRegisterId) { toast.error('Choisissez une caisse'); return }
    if (!openingAmount) { toast.error('Montant d\'ouverture requis'); return }
    try {
      await api.post('/cashier/open', { registerId: selectedRegisterId, openingAmount: parseFloat(openingAmount) })
      toast.success('Caisse ouverte')
      setShowOpenModal(false)
      setOpeningAmount('')
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de l\'ouverture')
    }
  }

  const closeSession = async () => {
    if (!closingAmount || !session) { toast.error('Montant de clôture requis'); return }
    try {
      await api.post(`/cashier/close/${session.id}`, { closingAmount: parseFloat(closingAmount) })
      toast.success('Caisse clôturée')
      setShowCloseModal(false)
      setClosingAmount('')
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la clôture')
    }
  }

  const addMovement = async () => {
    if (!mvtForm.amount || !mvtForm.description || !session) { toast.error('Montant et motif requis'); return }
    try {
      await api.post('/cashier/movements', {
        sessionId: session.id,
        type: movementType,
        amount: parseFloat(mvtForm.amount),
        description: mvtForm.description,
        reference: mvtForm.reference,
      })
      toast.success('Mouvement enregistré')
      setShowMovementModal(false)
      setMvtForm({ amount: '', description: '', reference: '' })
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de l\'enregistrement')
    }
  }

  const createRegister = async () => {
    if (!registerForm.code.trim() || !registerForm.name.trim()) { toast.error('Code et nom requis'); return }
    setSavingRegister(true)
    try {
      await api.post('/cashier/registers', registerForm)
      toast.success('Caisse créée')
      setShowRegisterModal(false)
      setRegisterForm({ code: '', name: '', location: '' })
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la création')
    } finally {
      setSavingRegister(false)
    }
  }

  if (loading) return <div className="flex justify-center p-20"><div className="loading-spinner h-8 w-8" /></div>

  const totalIn = movements.filter(m => m.amount > 0 && m.movement_type !== 'opening').reduce((s, m) => s + m.amount, 0)
  const totalOut = movements.filter(m => m.amount < 0).reduce((s, m) => s + Math.abs(m.amount), 0)

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Caisse</h1>
          {session ? (
            <div className="flex items-center gap-2 mt-1">
              <Badge color="green" dot>{register?.name} — Session ouverte</Badge>
              <span className="text-sm text-slate-500">depuis {formatDateTime(session.opened_at)}</span>
            </div>
          ) : (
            <Badge color="gray" dot>Aucune caisse ouverte</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowRegisterModal(true)} className="btn btn-outline">
            <Plus className="h-4 w-4" /> Nouvelle caisse
          </button>
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
            <button onClick={() => { setSelectedRegisterId(registers[0]?.id || ''); setShowOpenModal(true) }} className="btn btn-primary" disabled={registers.length === 0}>
              <Unlock className="h-4 w-4" /> Ouvrir une caisse
            </button>
          )}
        </div>
      </div>

      {registers.length === 0 && !loading && (
        <div className="card p-10 text-center text-slate-400">
          <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p>Aucune caisse enregistrée pour cette société. Créez-en une avec le bouton ci-dessus.</p>
        </div>
      )}

      {session && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Solde actuel" value={formatCurrency(register?.current_balance || 0)} icon={DollarSign} color="green" />
          <StatCard title="Fond d'ouverture" value={formatCurrency(session.opening_amount || 0)} icon={Unlock} color="blue" />
          <StatCard title="Entrées de la session" value={formatCurrency(totalIn)} icon={TrendingUp} color="teal" />
          <StatCard title="Sorties de la session" value={formatCurrency(totalOut)} icon={TrendingDown} color="red" />
        </div>
      )}

      {/* Movements */}
      {session && (
        <div className="card">
          <div className="p-4 border-b border-slate-200 dark:border-dark-border">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
              Journal de caisse — {formatDateTime(session.opened_at)}
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
                  {movements.map((m) => {
                    const isIn = m.amount >= 0
                    return (
                      <tr key={m.id} className="table-row">
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
      )}

      {/* Open session modal */}
      <Modal isOpen={showOpenModal} onClose={() => setShowOpenModal(false)} title="Ouvrir la caisse" size="sm"
        footer={<div className="flex justify-end gap-2"><button onClick={() => setShowOpenModal(false)} className="btn btn-outline">Annuler</button><button onClick={openSession} className="btn btn-primary"><Unlock className="h-4 w-4" /> Ouvrir</button></div>}>
        <div className="space-y-4">
          <div>
            <label className="form-label">Caisse</label>
            <select value={selectedRegisterId} onChange={(e) => setSelectedRegisterId(e.target.value)} className="form-input">
              {registers.map(r => <option key={r.id} value={r.id}>{r.name} ({r.code})</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Montant d'ouverture (fond de caisse)</label>
            <input type="number" value={openingAmount} onChange={(e) => setOpeningAmount(e.target.value)} className="form-input text-2xl text-center font-bold" placeholder="0" autoFocus />
          </div>
        </div>
      </Modal>

      {/* Close session modal */}
      <Modal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} title="Clôturer la caisse" size="sm"
        footer={<div className="flex justify-end gap-2"><button onClick={() => setShowCloseModal(false)} className="btn btn-outline">Annuler</button><button onClick={closeSession} className="btn btn-danger"><Lock className="h-4 w-4" /> Clôturer</button></div>}>
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-dark-surface rounded-xl p-4">
            <p className="text-sm text-slate-500">Solde théorique</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(register?.current_balance || 0)}</p>
          </div>
          <div>
            <label className="form-label">Montant compté en caisse</label>
            <input type="number" value={closingAmount} onChange={(e) => setClosingAmount(e.target.value)} className="form-input text-xl text-center font-bold" placeholder="0" autoFocus />
          </div>
          {closingAmount && (
            <div className={`text-center p-3 rounded-xl font-semibold ${
              Math.abs(parseFloat(closingAmount) - (register?.current_balance || 0)) < 100
                ? 'bg-green-50 text-green-700 dark:bg-green-900/20'
                : 'bg-red-50 text-red-700 dark:bg-red-900/20'
            }`}>
              Écart: {formatCurrency(parseFloat(closingAmount) - (register?.current_balance || 0))}
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

      {/* Create register modal */}
      <Modal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)} title="Nouvelle caisse" size="sm"
        footer={<div className="flex justify-end gap-2"><button onClick={() => setShowRegisterModal(false)} className="btn btn-outline">Annuler</button><button onClick={createRegister} disabled={savingRegister} className="btn btn-primary">{savingRegister && <div className="loading-spinner h-4 w-4" />} Créer</button></div>}>
        <div className="space-y-4">
          <div>
            <label className="form-label">Code <span className="text-red-500">*</span></label>
            <input value={registerForm.code} onChange={(e) => setRegisterForm(f => ({ ...f, code: e.target.value }))} className="form-input" placeholder="CR-02" />
          </div>
          <div>
            <label className="form-label">Nom <span className="text-red-500">*</span></label>
            <input value={registerForm.name} onChange={(e) => setRegisterForm(f => ({ ...f, name: e.target.value }))} className="form-input" placeholder="Caisse secondaire" />
          </div>
          <div>
            <label className="form-label">Emplacement</label>
            <input value={registerForm.location} onChange={(e) => setRegisterForm(f => ({ ...f, location: e.target.value }))} className="form-input" placeholder="Accueil, comptoir 2..." />
          </div>
        </div>
      </Modal>
    </div>
  )
}
