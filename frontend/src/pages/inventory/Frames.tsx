import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Package, Filter } from 'lucide-react'
import DataTable, { Column } from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import api from '../../utils/api'
import { formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

const MATERIALS = ['Acétate', 'Métal', 'Titane', 'Plastique', 'Mixte', 'TR-90', 'Acier inoxydable']
const SHAPES = ['Rectangulaire', 'Ronde', 'Ovale', 'Carrée', 'Papillon', 'Aviateur', 'Cat-Eye']
const GENDERS = [{ value: 'male', label: 'Homme' }, { value: 'female', label: 'Femme' }, { value: 'unisex', label: 'Mixte' }, { value: 'child', label: 'Enfant' }]

const defaultForm = {
  brand: '', model_name: '', reference: '', barcode: '', color: '', material: '', shape: '',
  gender: 'unisex', rim_type: 'full', bridge_size: '', lens_width: '', temple_length: '',
  sale_price: '', purchase_price: '', stock_quantity: 0, min_stock: 2,
  is_active: true, is_featured: false, description: '',
}

export default function Frames() {
  const [frames, setFrames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [filterBrand, setFilterBrand] = useState('')

  useEffect(() => {
    api.get('/frames', { params: { page, limit: 20, search: search || undefined, brand: filterBrand || undefined } })
      .then(({ data }) => { setFrames(data.data || demoFrames()); setTotal(data.pagination?.total || 0) })
      .catch(() => { setFrames(demoFrames()); setTotal(40) })
      .finally(() => setLoading(false))
  }, [page, search, filterBrand])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const openCreate = () => { setEditing(null); setForm(defaultForm); setShowModal(true) }
  const openEdit = (row: any) => {
    setEditing(row)
    setForm({ ...defaultForm, ...row, sale_price: String(row.sale_price || ''), purchase_price: String(row.purchase_price || '') })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.brand || !form.reference) { toast.error('Marque et référence sont requis'); return }
    setSaving(true)
    try {
      const payload = { ...form, sale_price: parseFloat(form.sale_price) || 0, purchase_price: parseFloat(form.purchase_price) || 0 }
      if (editing) {
        await api.put(`/frames/${editing.id}`, payload)
        toast.success('Monture modifiée')
      } else {
        await api.post('/frames', payload)
        toast.success('Monture créée')
      }
      setShowModal(false)
      setLoading(true)
      api.get('/frames', { params: { page, limit: 20 } })
        .then(({ data }) => setFrames(data.data || demoFrames()))
        .finally(() => setLoading(false))
    } catch {} finally { setSaving(false) }
  }

  const handleDelete = async (row: any) => {
    if (!confirm(`Supprimer ${row.brand} ${row.model_name} ?`)) return
    try {
      await api.delete(`/frames/${row.id}`)
      setFrames(f => f.filter(x => x.id !== row.id))
      toast.success('Monture supprimée')
    } catch {}
  }

  const columns: Column<any>[] = [
    {
      key: 'brand',
      label: 'Monture',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-dark-surface flex items-center justify-center text-slate-400">
            {row.photo_url
              ? <img src={row.photo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
              : <Package className="h-5 w-5" />}
          </div>
          <div>
            <p className="font-semibold">{row.brand}</p>
            <p className="text-sm text-slate-500">{row.model_name}</p>
          </div>
        </div>
      ),
    },
    { key: 'reference', label: 'Référence', render: (v) => <span className="font-mono text-xs text-slate-500">{v}</span> },
    { key: 'color', label: 'Couleur' },
    { key: 'material', label: 'Matière', render: (v) => v || '—' },
    {
      key: 'gender',
      label: 'Genre',
      render: (v) => {
        const g = GENDERS.find(x => x.value === v)
        return <Badge color={v === 'male' ? 'blue' : v === 'female' ? 'pink' : v === 'child' ? 'yellow' : 'gray'} size="sm">{g?.label || v}</Badge>
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
    {
      key: 'is_active',
      label: 'Statut',
      render: (v) => <Badge color={v ? 'green' : 'gray'} size="sm">{v ? 'Actif' : 'Inactif'}</Badge>,
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEdit(row) }} className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg">
            <Edit2 className="h-4 w-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(row) }} className="p-1.5 hover:bg-red-100 text-red-500 rounded-lg">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Montures</h1>
          <p className="text-slate-500 text-sm">{total} monture{total > 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary">
          <Plus className="h-4 w-4" /> Ajouter une monture
        </button>
      </div>

      <DataTable
        columns={columns}
        data={frames}
        loading={loading}
        onRowClick={openEdit}
        total={total}
        page={page}
        limit={20}
        onPageChange={setPage}
        searchable
        onSearch={setSearch}
        searchValue={search}
        emptyMessage="Aucune monture"
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Modifier la monture' : 'Nouvelle monture'} size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowModal(false)} className="btn btn-outline">Annuler</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              {saving ? <div className="loading-spinner h-4 w-4" /> : null} Enregistrer
            </button>
          </div>
        }>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Marque <span className="text-red-500">*</span></label>
            <input value={form.brand} onChange={(e) => set('brand', e.target.value)} className="form-input" placeholder="Ray-Ban, Oakley..." />
          </div>
          <div>
            <label className="form-label">Modèle</label>
            <input value={form.model_name} onChange={(e) => set('model_name', e.target.value)} className="form-input" placeholder="Wayfarer RB2140" />
          </div>
          <div>
            <label className="form-label">Référence <span className="text-red-500">*</span></label>
            <input value={form.reference} onChange={(e) => set('reference', e.target.value)} className="form-input" placeholder="RB2140-901" />
          </div>
          <div>
            <label className="form-label">Code-barres</label>
            <input value={form.barcode} onChange={(e) => set('barcode', e.target.value)} className="form-input" placeholder="805289756450" />
          </div>
          <div>
            <label className="form-label">Couleur</label>
            <input value={form.color} onChange={(e) => set('color', e.target.value)} className="form-input" placeholder="Noir mat, Havane..." />
          </div>
          <div>
            <label className="form-label">Matière</label>
            <select value={form.material} onChange={(e) => set('material', e.target.value)} className="form-input">
              <option value="">Choisir...</option>
              {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Forme</label>
            <select value={form.shape} onChange={(e) => set('shape', e.target.value)} className="form-input">
              <option value="">Choisir...</option>
              {SHAPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Genre</label>
            <select value={form.gender} onChange={(e) => set('gender', e.target.value)} className="form-input">
              {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Type de cerclage</label>
            <select value={form.rim_type} onChange={(e) => set('rim_type', e.target.value)} className="form-input">
              <option value="full">Cerclé complet</option>
              <option value="semi">Semi-cerclé</option>
              <option value="rimless">Sans cerclage</option>
            </select>
          </div>
          <div>
            <label className="form-label">Largeur verre (mm)</label>
            <input type="number" value={form.lens_width} onChange={(e) => set('lens_width', e.target.value)} className="form-input" placeholder="50" />
          </div>
          <div>
            <label className="form-label">Pont (mm)</label>
            <input type="number" value={form.bridge_size} onChange={(e) => set('bridge_size', e.target.value)} className="form-input" placeholder="20" />
          </div>
          <div>
            <label className="form-label">Branche (mm)</label>
            <input type="number" value={form.temple_length} onChange={(e) => set('temple_length', e.target.value)} className="form-input" placeholder="145" />
          </div>
          <div>
            <label className="form-label">Prix d'achat (FCFA)</label>
            <input type="number" value={form.purchase_price} onChange={(e) => set('purchase_price', e.target.value)} className="form-input" placeholder="0" />
          </div>
          <div>
            <label className="form-label">Prix de vente (FCFA) <span className="text-red-500">*</span></label>
            <input type="number" value={form.sale_price} onChange={(e) => set('sale_price', e.target.value)} className="form-input" placeholder="0" />
          </div>
          <div>
            <label className="form-label">Stock initial</label>
            <input type="number" min="0" value={form.stock_quantity} onChange={(e) => set('stock_quantity', parseInt(e.target.value))} className="form-input" />
          </div>
          <div>
            <label className="form-label">Stock min. alerte</label>
            <input type="number" min="0" value={form.min_stock} onChange={(e) => set('min_stock', parseInt(e.target.value))} className="form-input" />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="form-label">Description</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} className="form-input" rows={2} placeholder="Description optionnelle..." />
          </div>
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="w-4 h-4 rounded" />
              <span className="text-sm">Actif</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => set('is_featured', e.target.checked)} className="w-4 h-4 rounded" />
              <span className="text-sm">Mis en avant</span>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function demoFrames() {
  const brands = ['Ray-Ban', 'Oakley', 'Persol', 'Tom Ford', 'Gucci', 'Prada', 'Silhouette', 'Essilor']
  const models = ['Wayfarer', 'Clubmaster', 'Classic', 'Square', 'Oval', 'Round', 'Pilot']
  const colors = ['Noir mat', 'Havane', 'Argent', 'Or', 'Bleu', 'Marron', 'Transparent']
  const genders = ['male', 'female', 'unisex', 'child']
  return Array.from({ length: 20 }, (_, i) => ({
    id: `frame-${i}`,
    brand: brands[i % brands.length],
    model_name: models[i % models.length],
    reference: `REF-${String(1000 + i).padStart(6, '0')}`,
    barcode: `${Math.floor(Math.random() * 9e12 + 1e12)}`,
    color: colors[i % colors.length],
    material: MATERIALS[i % MATERIALS.length],
    shape: SHAPES[i % SHAPES.length],
    gender: genders[i % genders.length],
    rim_type: ['full', 'semi', 'rimless'][i % 3],
    sale_price: Math.floor(Math.random() * 200000 + 30000),
    purchase_price: Math.floor(Math.random() * 80000 + 10000),
    stock_quantity: Math.floor(Math.random() * 15),
    min_stock: 2,
    is_active: i % 10 !== 0,
    is_featured: i % 5 === 0,
  }))
}
