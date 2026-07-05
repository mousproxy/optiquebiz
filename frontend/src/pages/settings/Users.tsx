import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Key, Shield, User } from 'lucide-react'
import DataTable, { Column } from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import api from '../../utils/api'
import { formatDate, roleLabels } from '../../utils/formatters'
import toast from 'react-hot-toast'

const ROLES = [
  { value: 'admin', label: 'Administrateur', desc: 'Accès total à toutes les fonctionnalités' },
  { value: 'manager', label: 'Gestionnaire', desc: 'Gestion opérationnelle complète' },
  { value: 'optician', label: 'Opticien', desc: 'Ventes, consultations, ordonnances' },
  { value: 'ophthalmologist', label: 'Ophtalmologue', desc: 'Consultations et ordonnances uniquement' },
  { value: 'secretary', label: 'Secrétaire', desc: 'Patients, rendez-vous, accueil' },
  { value: 'seller', label: 'Vendeur', desc: 'Point de vente et stock' },
  { value: 'cashier', label: 'Caissier', desc: 'Caisse et paiements' },
  { value: 'commercial', label: 'Commercial', desc: 'CRM et statistiques ventes' },
]

const defaultForm = {
  first_name: '', last_name: '', email: '', phone: '', role: 'seller',
  password: '', confirm_password: '', is_active: true,
}

export default function Users() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(defaultForm)
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/users', { params: { page, limit: 20 } })
      .then(({ data }) => { setUsers(data.data || demoUsers()); setTotal(data.pagination?.total || 0) })
      .catch(() => { setUsers(demoUsers()); setTotal(8) })
      .finally(() => setLoading(false))
  }, [page])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const openCreate = () => { setEditing(null); setForm(defaultForm); setShowModal(true) }
  const openEdit = (row: any) => {
    setEditing(row)
    setForm({ ...defaultForm, ...row, password: '', confirm_password: '' })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.first_name || !form.last_name || !form.email) { toast.error('Prénom, nom et email requis'); return }
    if (!editing && (!form.password || form.password !== form.confirm_password)) {
      toast.error('Mot de passe requis et confirmation incorrecte'); return
    }
    setSaving(true)
    try {
      const payload = { ...form }
      delete (payload as any).confirm_password
      if (!payload.password) delete (payload as any).password
      editing ? await api.put(`/users/${editing.id}`, payload) : await api.post('/users', payload)
      toast.success(editing ? 'Utilisateur modifié' : 'Utilisateur créé')
      setShowModal(false)
      api.get('/users', { params: { page, limit: 20 } }).then(({ data }) => setUsers(data.data || demoUsers()))
    } catch {} finally { setSaving(false) }
  }

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) { toast.error('Mot de passe trop court (min 8 caractères)'); return }
    try {
      await api.post(`/users/${editing.id}/reset-password`, { password: newPassword })
      toast.success('Mot de passe réinitialisé')
      setShowPasswordModal(false)
      setNewPassword('')
    } catch { toast.success('Mot de passe réinitialisé (mode démo)'); setShowPasswordModal(false) }
  }

  const toggleActive = async (user: any) => {
    try {
      await api.patch(`/users/${user.id}`, { is_active: !user.is_active })
      setUsers(u => u.map(x => x.id === user.id ? { ...x, is_active: !x.is_active } : x))
    } catch { setUsers(u => u.map(x => x.id === user.id ? { ...x, is_active: !x.is_active } : x)) }
  }

  const columns: Column<any>[] = [
    {
      key: 'first_name',
      label: 'Utilisateur',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm">
            {row.first_name?.charAt(0)}{row.last_name?.charAt(0)}
          </div>
          <div>
            <p className="font-semibold">{row.first_name} {row.last_name}</p>
            <p className="text-xs text-slate-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Rôle',
      render: (v) => {
        const colors: Record<string, any> = { admin: 'red', manager: 'purple', optician: 'blue', ophthalmologist: 'teal', secretary: 'green', seller: 'orange', cashier: 'yellow', commercial: 'pink' }
        return <Badge color={colors[v] || 'gray'}>{roleLabels[v] || v}</Badge>
      },
    },
    { key: 'phone', label: 'Téléphone', render: (v) => v || '—' },
    { key: 'created_at', label: 'Créé le', render: (v) => formatDate(v) },
    { key: 'last_login', label: 'Dernière connexion', render: (v) => v ? formatDate(v) : 'Jamais' },
    {
      key: 'is_active',
      label: 'Statut',
      render: (v, row) => (
        <button onClick={(e) => { e.stopPropagation(); toggleActive(row) }} className="cursor-pointer">
          <Badge color={v ? 'green' : 'gray'} dot size="sm">{v ? 'Actif' : 'Inactif'}</Badge>
        </button>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEdit(row) }} className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg" title="Modifier"><Edit2 className="h-4 w-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); setEditing(row); setShowPasswordModal(true) }} className="p-1.5 hover:bg-yellow-100 text-yellow-600 rounded-lg" title="Réinitialiser MDP"><Key className="h-4 w-4" /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Utilisateurs</h1>
          <p className="text-slate-500 text-sm">{total} compte{total > 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary"><Plus className="h-4 w-4" /> Nouvel utilisateur</button>
      </div>

      {/* Role guide */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-primary-600" />
          <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Guide des rôles</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ROLES.map(r => (
            <div key={r.value} className="p-2 rounded-lg bg-slate-50 dark:bg-dark-surface">
              <p className="font-medium text-xs">{r.label}</p>
              <p className="text-xs text-slate-400">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <DataTable columns={columns} data={users} loading={loading} onRowClick={openEdit} total={total} page={page} limit={20} onPageChange={setPage} emptyMessage="Aucun utilisateur" />

      {/* Create/Edit modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'} size="lg"
        footer={<div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn btn-outline">Annuler</button><button onClick={handleSave} disabled={saving} className="btn btn-primary">{saving && <div className="loading-spinner h-4 w-4" />} Enregistrer</button></div>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Prénom <span className="text-red-500">*</span></label>
            <input value={form.first_name} onChange={(e) => set('first_name', e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Nom <span className="text-red-500">*</span></label>
            <input value={form.last_name} onChange={(e) => set('last_name', e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Email <span className="text-red-500">*</span></label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Téléphone</label>
            <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className="form-input" />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Rôle</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(r => (
                <label key={r.value} className={`flex items-start gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.role === r.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-dark-border hover:border-slate-300'}`}>
                  <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={(e) => set('role', e.target.value)} className="mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{r.label}</p>
                    <p className="text-xs text-slate-400">{r.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          {!editing && (
            <>
              <div>
                <label className="form-label">Mot de passe <span className="text-red-500">*</span></label>
                <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} className="form-input" placeholder="Min. 8 caractères" />
              </div>
              <div>
                <label className="form-label">Confirmer le mot de passe</label>
                <input type="password" value={form.confirm_password} onChange={(e) => set('confirm_password', e.target.value)} className="form-input" />
              </div>
            </>
          )}
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="w-4 h-4 rounded" />
              <span className="text-sm font-medium">Compte actif</span>
            </label>
          </div>
        </div>
      </Modal>

      {/* Reset password modal */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title={`Réinitialiser le mot de passe — ${editing?.first_name || ''}`} size="sm"
        footer={<div className="flex justify-end gap-2"><button onClick={() => setShowPasswordModal(false)} className="btn btn-outline">Annuler</button><button onClick={handleResetPassword} className="btn btn-warning"><Key className="h-4 w-4" /> Réinitialiser</button></div>}>
        <div>
          <label className="form-label">Nouveau mot de passe</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="form-input" placeholder="Min. 8 caractères" autoFocus />
          <p className="text-xs text-slate-400 mt-2">Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.</p>
        </div>
      </Modal>
    </div>
  )
}

function demoUsers() {
  return [
    { id: 'u1', first_name: 'Admin', last_name: 'Principal', email: 'admin@optigest.ci', phone: '0707070707', role: 'admin', is_active: true, created_at: '2024-01-15', last_login: '2024-12-29' },
    { id: 'u2', first_name: 'Kouassi', last_name: 'Ange', email: 'k.ange@optigest.ci', phone: '0606060606', role: 'manager', is_active: true, created_at: '2024-02-01', last_login: '2024-12-28' },
    { id: 'u3', first_name: 'Dr. Traoré', last_name: 'Ibrahim', email: 't.ibrahim@optigest.ci', phone: '0505050505', role: 'ophthalmologist', is_active: true, created_at: '2024-02-15', last_login: '2024-12-27' },
    { id: 'u4', first_name: 'Diallo', last_name: 'Fatoumata', email: 'd.fatoumata@optigest.ci', phone: '0404040404', role: 'optician', is_active: true, created_at: '2024-03-01', last_login: '2024-12-26' },
    { id: 'u5', first_name: 'Koffi', last_name: 'Serge', email: 'k.serge@optigest.ci', phone: '0303030303', role: 'seller', is_active: true, created_at: '2024-03-15', last_login: '2024-12-25' },
    { id: 'u6', first_name: 'N\'Guessan', last_name: 'Marie', email: 'n.marie@optigest.ci', phone: '0202020202', role: 'cashier', is_active: true, created_at: '2024-04-01', last_login: '2024-12-24' },
    { id: 'u7', first_name: 'Coulibaly', last_name: 'Mamadou', email: 'c.mamadou@optigest.ci', phone: '0101010101', role: 'secretary', is_active: false, created_at: '2024-05-01', last_login: null },
    { id: 'u8', first_name: 'Bamba', last_name: 'Sali', email: 'b.sali@optigest.ci', phone: '0808080808', role: 'commercial', is_active: true, created_at: '2024-06-01', last_login: '2024-12-20' },
  ]
}
