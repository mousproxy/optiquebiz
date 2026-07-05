import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, ShoppingCart, Phone, Mail, Globe } from 'lucide-react'
import DataTable, { Column } from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import api from '../../utils/api'
import { formatCurrency, formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'

const defaultForm = {
  company_name: '', contact_name: '', email: '', phone: '', address: '',
  city: '', country: 'Côte d\'Ivoire', website: '', tax_number: '',
  payment_terms: 30, discount_percent: 0, notes: '', is_active: true,
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/suppliers', { params: { page, limit: 20, search: search || undefined } })
      .then(({ data }) => { setSuppliers(data.data || demoData()); setTotal(data.pagination?.total || 0) })
      .catch(() => { setSuppliers(demoData()); setTotal(15) })
      .finally(() => setLoading(false))
  }, [page, search])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const openCreate = () => { setEditing(null); setForm(defaultForm); setShowModal(true) }
  const openEdit = (row: any) => { setEditing(row); setForm({ ...defaultForm, ...row }); setShowModal(true) }

  const handleSave = async () => {
    if (!form.company_name) { toast.error('Nom de la société requis'); return }
    setSaving(true)
    try {
      editing ? await api.put(`/suppliers/${editing.id}`, form) : await api.post('/suppliers', form)
      toast.success(editing ? 'Fournisseur modifié' : 'Fournisseur créé')
      setShowModal(false)
      api.get('/suppliers', { params: { page, limit: 20 } }).then(({ data }) => setSuppliers(data.data || demoData()))
    } catch {} finally { setSaving(false) }
  }

  const handleDelete = async (row: any) => {
    if (!confirm(`Supprimer ${row.company_name} ?`)) return
    try {
      await api.delete(`/suppliers/${row.id}`)
      setSuppliers(s => s.filter(x => x.id !== row.id))
      toast.success('Fournisseur supprimé')
    } catch {}
  }

  const columns: Column<any>[] = [
    {
      key: 'company_name',
      label: 'Fournisseur',
      render: (v, row) => (
        <div>
          <p className="font-semibold">{v}</p>
          {row.contact_name && <p className="text-xs text-slate-400">{row.contact_name}</p>}
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Contact',
      render: (_, row) => (
        <div className="space-y-0.5">
          {row.phone && <p className="text-sm flex items-center gap-1"><Phone className="h-3 w-3 text-slate-400" />{row.phone}</p>}
          {row.email && <p className="text-xs text-slate-400 flex items-center gap-1"><Mail className="h-3 w-3" />{row.email}</p>}
        </div>
      ),
    },
    {
      key: 'city',
      label: 'Ville',
      render: (v, row) => <span>{v}{row.country ? `, ${row.country}` : ''}</span>,
    },
    {
      key: 'payment_terms',
      label: 'Délai paiement',
      render: (v) => <span className="text-sm">{v} jours</span>,
    },
    {
      key: 'discount_percent',
      label: 'Remise',
      render: (v) => v > 0 ? <Badge color="green" size="sm">{v}%</Badge> : <span className="text-slate-400">—</span>,
    },
    {
      key: 'total_orders',
      label: 'Commandes',
      render: (v) => <span className="font-medium">{v || 0}</span>,
    },
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
        <div>
          <h1 className="page-title">Fournisseurs</h1>
          <p className="text-slate-500 text-sm">{total} fournisseur{total > 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary"><Plus className="h-4 w-4" /> Nouveau fournisseur</button>
      </div>

      <DataTable columns={columns} data={suppliers} loading={loading} onRowClick={openEdit} total={total} page={page} limit={20} onPageChange={setPage} searchable onSearch={setSearch} searchValue={search} emptyMessage="Aucun fournisseur" />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Modifier le fournisseur' : 'Nouveau fournisseur'} size="xl"
        footer={<div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn btn-outline">Annuler</button><button onClick={handleSave} disabled={saving} className="btn btn-primary">{saving && <div className="loading-spinner h-4 w-4" />} Enregistrer</button></div>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="form-label">Nom de la société <span className="text-red-500">*</span></label>
            <input value={form.company_name} onChange={(e) => set('company_name', e.target.value)} className="form-input" placeholder="Luxottica Afrique SARL" />
          </div>
          <div>
            <label className="form-label">Nom du contact</label>
            <input value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} className="form-input" placeholder="Jean Dupont" />
          </div>
          <div>
            <label className="form-label">Téléphone</label>
            <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className="form-input" placeholder="+225 0707070707" />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Site web</label>
            <input value={form.website} onChange={(e) => set('website', e.target.value)} className="form-input" placeholder="www.example.com" />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Adresse</label>
            <input value={form.address} onChange={(e) => set('address', e.target.value)} className="form-input" placeholder="Rue des palmiers, Cocody" />
          </div>
          <div>
            <label className="form-label">Ville</label>
            <input value={form.city} onChange={(e) => set('city', e.target.value)} className="form-input" placeholder="Abidjan" />
          </div>
          <div>
            <label className="form-label">Pays</label>
            <input value={form.country} onChange={(e) => set('country', e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">N° fiscal / RCCM</label>
            <input value={form.tax_number} onChange={(e) => set('tax_number', e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Délai de paiement (jours)</label>
            <input type="number" min="0" value={form.payment_terms} onChange={(e) => set('payment_terms', parseInt(e.target.value))} className="form-input" />
          </div>
          <div>
            <label className="form-label">Remise habituelle (%)</label>
            <input type="number" min="0" max="100" step="0.5" value={form.discount_percent} onChange={(e) => set('discount_percent', parseFloat(e.target.value))} className="form-input" />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer mt-6">
              <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="w-4 h-4 rounded" />
              <span className="text-sm">Fournisseur actif</span>
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Notes</label>
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} className="form-input" rows={2} placeholder="Conditions particulières, catalogue, représentant..." />
          </div>
        </div>
      </Modal>
    </div>
  )
}

function demoData() {
  const companies = [
    { company_name: 'Luxottica Afrique', city: 'Abidjan', country: 'Côte d\'Ivoire', phone: '+225 0202030405', email: 'contact@luxottica-ci.com', total_orders: 24 },
    { company_name: 'Essilor Distribution CI', city: 'Abidjan', country: 'Côte d\'Ivoire', phone: '+225 0505060708', email: 'orders@essilor-ci.com', total_orders: 18 },
    { company_name: 'Optic Wholesale Dakar', city: 'Dakar', country: 'Sénégal', phone: '+221 338883333', email: 'commerce@owdakar.sn', total_orders: 7 },
    { company_name: 'Bausch & Lomb CI', city: 'Abidjan', country: 'Côte d\'Ivoire', phone: '+225 0101020304', email: 'info@bausch-ci.com', total_orders: 12 },
    { company_name: 'Zeiss Vision Center', city: 'Abidjan', country: 'Côte d\'Ivoire', phone: '+225 0606070809', email: 'sales@zeiss-ci.com', total_orders: 9 },
  ]
  return companies.map((c, i) => ({ id: `s-${i}`, ...c, contact_name: 'M. Koné', payment_terms: [30, 45, 60][i % 3], discount_percent: i % 3 === 0 ? 5 : 0, is_active: i !== 4 }))
}
