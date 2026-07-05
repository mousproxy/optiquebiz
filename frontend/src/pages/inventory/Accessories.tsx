import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import DataTable, { Column } from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import api from '../../utils/api'
import { formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { value: 'case', label: 'Étui' },
  { value: 'cloth', label: 'Chiffon' },
  { value: 'solution', label: 'Solution nettoyante' },
  { value: 'cord', label: 'Cordon' },
  { value: 'repair', label: 'Réparation / Pièce' },
  { value: 'tool', label: 'Outil' },
  { value: 'other', label: 'Autre' },
]

const defaultForm = {
  name: '', reference: '', barcode: '', category: 'case', brand: '',
  sale_price: '', purchase_price: '', stock_quantity: 0, min_stock: 5,
  is_active: true, description: '',
}

export default function Accessories() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/accessories', { params: { page, limit: 20, search: search || undefined } })
      .then(({ data }) => { setItems(data.data || demoData()); setTotal(data.pagination?.total || 0) })
      .catch(() => { setItems(demoData()); setTotal(20) })
      .finally(() => setLoading(false))
  }, [page, search])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const openCreate = () => { setEditing(null); setForm(defaultForm); setShowModal(true) }
  const openEdit = (row: any) => {
    setEditing(row)
    setForm({ ...defaultForm, ...row, sale_price: String(row.sale_price || ''), purchase_price: String(row.purchase_price || '') })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name) { toast.error('Nom requis'); return }
    setSaving(true)
    try {
      const payload = { ...form, sale_price: parseFloat(form.sale_price) || 0, purchase_price: parseFloat(form.purchase_price) || 0 }
      editing ? await api.put(`/accessories/${editing.id}`, payload) : await api.post('/accessories', payload)
      toast.success(editing ? 'Accessoire modifié' : 'Accessoire créé')
      setShowModal(false)
      api.get('/accessories', { params: { page, limit: 20 } }).then(({ data }) => setItems(data.data || demoData()))
    } catch {} finally { setSaving(false) }
  }

  const CATEGORY_ICONS: Record<string, string> = { case: '🕶️', cloth: '🧹', solution: '🧴', cord: '🔗', repair: '🔧', tool: '⚙️', other: '📦' }

  const columns: Column<any>[] = [
    {
      key: 'name',
      label: 'Accessoire',
      render: (v, row) => (
        <div className="flex items-center gap-3">
          <span className="text-2xl">{CATEGORY_ICONS[row.category] || '📦'}</span>
          <div>
            <p className="font-semibold">{v}</p>
            {row.brand && <p className="text-xs text-slate-400">{row.brand}</p>}
          </div>
        </div>
      ),
    },
    { key: 'reference', label: 'Référence', render: (v) => v ? <span className="font-mono text-xs">{v}</span> : '—' },
    {
      key: 'category',
      label: 'Catégorie',
      render: (v) => {
        const cat = CATEGORIES.find(c => c.value === v)
        return <Badge color="blue" size="sm">{cat?.label || v}</Badge>
      },
    },
    { key: 'sale_price', label: 'Prix vente', sortable: true, render: (v) => <span className="font-bold">{formatCurrency(v)}</span> },
    {
      key: 'stock_quantity',
      label: 'Stock',
      render: (v, row) => (
        <Badge color={v === 0 ? 'red' : v <= row.min_stock ? 'yellow' : 'green'} size="sm">
          {v} unité{v > 1 ? 's' : ''}
        </Badge>
      ),
    },
    { key: 'is_active', label: 'Statut', render: (v) => <Badge color={v ? 'green' : 'gray'} size="sm">{v ? 'Actif' : 'Inactif'}</Badge> },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEdit(row) }} className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg"><Edit2 className="h-4 w-4" /></button>
          <button onClick={(e) => { e.stopPropagation() }} className="p-1.5 hover:bg-red-100 text-red-500 rounded-lg"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Accessoires</h1>
          <p className="text-slate-500 text-sm">{total} article{total > 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary"><Plus className="h-4 w-4" /> Ajouter</button>
      </div>

      <DataTable columns={columns} data={items} loading={loading} onRowClick={openEdit} total={total} page={page} limit={20} onPageChange={setPage} searchable onSearch={setSearch} searchValue={search} emptyMessage="Aucun accessoire" />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? "Modifier l'accessoire" : 'Nouvel accessoire'} size="lg"
        footer={<div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn btn-outline">Annuler</button><button onClick={handleSave} disabled={saving} className="btn btn-primary">{saving && <div className="loading-spinner h-4 w-4" />} Enregistrer</button></div>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="form-label">Nom <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} className="form-input" placeholder="Étui rigide à fermeture aimantée" />
          </div>
          <div>
            <label className="form-label">Catégorie</label>
            <select value={form.category} onChange={(e) => set('category', e.target.value)} className="form-input">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Marque</label>
            <input value={form.brand} onChange={(e) => set('brand', e.target.value)} className="form-input" placeholder="Essilor, generic..." />
          </div>
          <div>
            <label className="form-label">Référence</label>
            <input value={form.reference} onChange={(e) => set('reference', e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Code-barres</label>
            <input value={form.barcode} onChange={(e) => set('barcode', e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Prix d'achat (FCFA)</label>
            <input type="number" value={form.purchase_price} onChange={(e) => set('purchase_price', e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Prix de vente (FCFA)</label>
            <input type="number" value={form.sale_price} onChange={(e) => set('sale_price', e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Stock initial</label>
            <input type="number" min="0" value={form.stock_quantity} onChange={(e) => set('stock_quantity', parseInt(e.target.value))} className="form-input" />
          </div>
          <div>
            <label className="form-label">Stock min. alerte</label>
            <input type="number" min="0" value={form.min_stock} onChange={(e) => set('min_stock', parseInt(e.target.value))} className="form-input" />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Description</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} className="form-input" rows={2} />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="w-4 h-4 rounded" />
              <span className="text-sm">Actif</span>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function demoData() {
  const cats = CATEGORIES.map(c => c.value)
  const names = ['Étui rigide premium', 'Chiffon microfibre', 'Solution nettoyante 60ml', 'Cordon sport', 'Vis de rechange', 'Tournevis optique', 'Kit entretien']
  return Array.from({ length: 15 }, (_, i) => ({
    id: `acc-${i}`,
    name: names[i % names.length],
    reference: `ACC-${String(1000 + i).padStart(5, '0')}`,
    brand: i % 3 === 0 ? 'Essilor' : i % 3 === 1 ? 'Bausch' : '',
    category: cats[i % cats.length],
    sale_price: Math.floor(Math.random() * 15000 + 500),
    purchase_price: Math.floor(Math.random() * 5000 + 200),
    stock_quantity: Math.floor(Math.random() * 30 + 2),
    min_stock: 5,
    is_active: i % 8 !== 0,
  }))
}
