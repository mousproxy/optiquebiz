import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import DataTable, { Column } from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import api from '../../utils/api'
import { formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

const LENS_TYPES = [
  { value: 'unifocal', label: 'Unifocal' },
  { value: 'progressive', label: 'Progressif' },
  { value: 'bifocal', label: 'Bifocal' },
  { value: 'degressive', label: 'Dégressif' },
]
const TREATMENTS = ['Anti-reflets', 'Anti-lumière bleue', 'Photochromique', 'Transitions', 'Polarisé', 'Anti-rayures', 'UV400']
const INDICES = ['1.50', '1.56', '1.60', '1.67', '1.74', '1.76']
const BRANDS = ['Essilor', 'Zeiss', 'Hoya', 'Nikon', 'Shamir', 'Indo', 'Optiswiss', 'Bbgr']

const defaultForm = {
  brand: '', product_name: '', reference: '', lens_type: 'unifocal', index: '1.50',
  treatment: '', min_sph: '', max_sph: '', min_cyl: '', max_cyl: '',
  sale_price: '', purchase_price: '',
  stock_quantity: 0, min_stock: 5, warehouse_id: '', is_active: true, description: '',
}

export default function Lenses() {
  const [lenses, setLenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [warehouses, setWarehouses] = useState<any[]>([])

  useEffect(() => {
    api.get('/lenses', { params: { page, limit: 20, search: search || undefined } })
      .then(({ data }) => { setLenses(data.data || demoLenses()); setTotal(data.pagination?.total || 0) })
      .catch(() => { setLenses(demoLenses()); setTotal(30) })
      .finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => {
    api.get('/warehouses').then(({ data }) => setWarehouses(data)).catch(() => {})
  }, [])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const openCreate = () => {
    setEditing(null)
    setForm({ ...defaultForm, warehouse_id: warehouses.find(w => w.is_default)?.id || warehouses[0]?.id || '' })
    setShowModal(true)
  }
  const openEdit = (row: any) => {
    setEditing(row)
    setForm({ ...defaultForm, ...row, sale_price: String(row.sale_price || ''), purchase_price: String(row.purchase_price || '') })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.brand || !form.product_name) { toast.error('Marque et nom requis'); return }
    setSaving(true)
    try {
      const payload = { ...form, sale_price: parseFloat(form.sale_price) || 0, purchase_price: parseFloat(form.purchase_price) || 0 }
      editing ? await api.put(`/lenses/${editing.id}`, payload) : await api.post('/lenses', payload)
      toast.success(editing ? 'Verre modifié' : 'Verre créé')
      setShowModal(false)
      api.get('/lenses', { params: { page, limit: 20 } }).then(({ data }) => setLenses(data.data || demoLenses()))
    } catch {} finally { setSaving(false) }
  }

  const columns: Column<any>[] = [
    {
      key: 'brand',
      label: 'Verre',
      render: (_, row) => (
        <div>
          <p className="font-semibold">{row.brand}</p>
          <p className="text-sm text-slate-500">{row.product_name}</p>
        </div>
      ),
    },
    { key: 'reference', label: 'Référence', render: (v) => <span className="font-mono text-xs">{v}</span> },
    {
      key: 'lens_type',
      label: 'Type',
      render: (v) => {
        const t = LENS_TYPES.find(x => x.value === v)
        const colors: Record<string, any> = { unifocal: 'blue', progressive: 'purple', bifocal: 'teal', degressive: 'orange' }
        return <Badge color={colors[v] || 'gray'} size="sm">{t?.label || v}</Badge>
      },
    },
    { key: 'index', label: 'Indice', render: (v) => <span className="font-mono text-center">{v}</span> },
    { key: 'treatment', label: 'Traitement', render: (v) => v || '—' },
    {
      key: 'min_sph',
      label: 'Plage SPH',
      render: (_, row) => (
        <span className="font-mono text-xs text-slate-500">
          {row.min_sph ?? '—'} / {row.max_sph ?? '—'}
        </span>
      ),
    },
    { key: 'sale_price', label: 'Prix', sortable: true, render: (v) => <span className="font-bold">{formatCurrency(v)}</span> },
    {
      key: 'stock_quantity',
      label: 'Stock',
      render: (v, row) => (
        <Badge color={v === 0 ? 'red' : v <= row.min_stock ? 'yellow' : 'green'} size="sm">
          {v} paire{v > 1 ? 's' : ''}
        </Badge>
      ),
    },
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
          <h1 className="page-title">Verres optiques</h1>
          <p className="text-slate-500 text-sm">{total} référence{total > 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary"><Plus className="h-4 w-4" /> Ajouter un verre</button>
      </div>

      <DataTable columns={columns} data={lenses} loading={loading} onRowClick={openEdit} total={total} page={page} limit={20} onPageChange={setPage} searchable onSearch={setSearch} searchValue={search} emptyMessage="Aucun verre" />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Modifier le verre' : 'Nouveau verre'} size="xl"
        footer={<div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn btn-outline">Annuler</button><button onClick={handleSave} disabled={saving} className="btn btn-primary">{saving && <div className="loading-spinner h-4 w-4" />} Enregistrer</button></div>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Marque <span className="text-red-500">*</span></label>
            <select value={form.brand} onChange={(e) => set('brand', e.target.value)} className="form-input">
              <option value="">Choisir...</option>
              {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Nom du produit <span className="text-red-500">*</span></label>
            <input value={form.product_name} onChange={(e) => set('product_name', e.target.value)} className="form-input" placeholder="Varilux Comfort 3F" />
          </div>
          <div>
            <label className="form-label">Référence</label>
            <input value={form.reference} onChange={(e) => set('reference', e.target.value)} className="form-input" placeholder="ESS-VAR-CF3-160" />
          </div>
          <div>
            <label className="form-label">Type de verre</label>
            <select value={form.lens_type} onChange={(e) => set('lens_type', e.target.value)} className="form-input">
              {LENS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Indice de réfraction</label>
            <select value={form.index} onChange={(e) => set('index', e.target.value)} className="form-input">
              {INDICES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Traitement principal</label>
            <select value={form.treatment} onChange={(e) => set('treatment', e.target.value)} className="form-input">
              <option value="">Aucun</option>
              {TREATMENTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">SPH min (D)</label>
            <input type="number" step="0.25" value={form.min_sph} onChange={(e) => set('min_sph', e.target.value)} className="form-input font-mono" placeholder="-20.00" />
          </div>
          <div>
            <label className="form-label">SPH max (D)</label>
            <input type="number" step="0.25" value={form.max_sph} onChange={(e) => set('max_sph', e.target.value)} className="form-input font-mono" placeholder="+8.00" />
          </div>
          <div>
            <label className="form-label">CYL min (D)</label>
            <input type="number" step="0.25" value={form.min_cyl} onChange={(e) => set('min_cyl', e.target.value)} className="form-input font-mono" placeholder="-6.00" />
          </div>
          <div>
            <label className="form-label">CYL max (D)</label>
            <input type="number" step="0.25" value={form.max_cyl} onChange={(e) => set('max_cyl', e.target.value)} className="form-input font-mono" placeholder="0.00" />
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
          <div>
            <label className="form-label">Entrepôt</label>
            <select value={form.warehouse_id} onChange={(e) => set('warehouse_id', e.target.value)} className="form-input">
              <option value="">-- Choisir --</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="form-label">Description</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} className="form-input" rows={2} />
          </div>
        </div>
      </Modal>
    </div>
  )
}

function demoLenses() {
  const brands = BRANDS
  const types = LENS_TYPES.map(t => t.value)
  return Array.from({ length: 20 }, (_, i) => ({
    id: `lens-${i}`,
    brand: brands[i % brands.length],
    product_name: ['Varilux Comfort', 'Zeiss Progressive', 'Hoya MyStyle', 'Nikon SeeMax', 'Univis Pro'][i % 5],
    reference: `VER-${String(1000 + i).padStart(5, '0')}`,
    lens_type: types[i % types.length],
    index: INDICES[i % INDICES.length],
    treatment: TREATMENTS[i % TREATMENTS.length],
    min_sph: -(i % 5 + 2) * 2,
    max_sph: (i % 3 + 1) * 2,
    min_cyl: -(i % 3 + 1),
    max_cyl: 0,
    sale_price: Math.floor(Math.random() * 80000 + 20000),
    purchase_price: Math.floor(Math.random() * 30000 + 8000),
    stock_quantity: Math.floor(Math.random() * 20 + 1),
    min_stock: 5,
    is_active: true,
  }))
}
