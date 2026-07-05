import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Building2 } from 'lucide-react'
import DataTable, { Column } from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const defaultForm = {
  code: '', name: '', address: '', city: 'Abidjan', phone: '', manager_name: '', is_default: false,
}

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/warehouses')
      .then(({ data }) => setWarehouses(data))
      .catch(() => toast.error('Erreur lors du chargement des entrepôts'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const openCreate = () => { setEditing(null); setForm(defaultForm); setShowModal(true) }
  const openEdit = (row: any) => { setEditing(row); setForm({ ...defaultForm, ...row }); setShowModal(true) }

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) { toast.error('Code et nom requis'); return }
    setSaving(true)
    try {
      if (editing) await api.put(`/warehouses/${editing.id}`, form)
      else await api.post('/warehouses', form)
      toast.success(editing ? 'Entrepôt modifié' : 'Entrepôt créé')
      setShowModal(false)
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row: any) => {
    if (!confirm(`Désactiver l'entrepôt ${row.name} ?`)) return
    try {
      await api.delete(`/warehouses/${row.id}`)
      toast.success('Entrepôt désactivé')
      load()
    } catch {
      toast.error('Erreur lors de la désactivation')
    }
  }

  const columns: Column<any>[] = [
    {
      key: 'name',
      label: 'Entrepôt',
      render: (v, row) => (
        <div>
          <p className="font-semibold">{v}</p>
          <p className="text-xs text-slate-400 font-mono">{row.code}</p>
        </div>
      ),
    },
    { key: 'city', label: 'Ville' },
    { key: 'manager_name', label: 'Responsable', render: (v) => v || '—' },
    { key: 'phone', label: 'Téléphone', render: (v) => v || '—' },
    { key: 'is_default', label: 'Par défaut', render: (v) => v ? <Badge color="blue" size="sm">Par défaut</Badge> : null },
    { key: 'is_active', label: 'Statut', render: (v) => <Badge color={v ? 'green' : 'gray'} size="sm">{v ? 'Actif' : 'Inactif'}</Badge> },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEdit(row) }} className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg"><Edit2 className="h-4 w-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(row) }} className="p-1.5 hover:bg-red-100 text-red-500 rounded-lg"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-primary-600" />
          <div>
            <h1 className="page-title">Entrepôts</h1>
            <p className="text-slate-500 text-sm">{warehouses.length} entrepôt{warehouses.length > 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={openCreate} className="btn btn-primary"><Plus className="h-4 w-4" /> Nouvel entrepôt</button>
      </div>

      <DataTable columns={columns} data={warehouses} loading={loading} onRowClick={openEdit} emptyMessage="Aucun entrepôt" />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Modifier l\'entrepôt' : 'Nouvel entrepôt'} size="lg"
        footer={<div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn btn-outline">Annuler</button><button onClick={handleSave} disabled={saving} className="btn btn-primary">{saving && <div className="loading-spinner h-4 w-4" />} Enregistrer</button></div>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Code <span className="text-red-500">*</span></label>
            <input value={form.code} onChange={(e) => set('code', e.target.value)} className="form-input" placeholder="WH-02" />
          </div>
          <div>
            <label className="form-label">Nom <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} className="form-input" placeholder="Boutique Marcory" />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Adresse</label>
            <input value={form.address} onChange={(e) => set('address', e.target.value)} className="form-input" placeholder="Rue du commerce, Marcory" />
          </div>
          <div>
            <label className="form-label">Ville</label>
            <input value={form.city} onChange={(e) => set('city', e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Téléphone</label>
            <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Responsable</label>
            <input value={form.manager_name} onChange={(e) => set('manager_name', e.target.value)} className="form-input" placeholder="Nom du responsable" />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer mt-6">
              <input type="checkbox" checked={form.is_default} onChange={(e) => set('is_default', e.target.checked)} className="w-4 h-4 rounded" />
              <span className="text-sm">Entrepôt par défaut</span>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  )
}
