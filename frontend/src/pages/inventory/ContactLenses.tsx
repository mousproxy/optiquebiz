import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import DataTable, { Column } from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import api from '../../utils/api'
import { formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

const LENS_TYPES = [
  { value: 'daily', label: 'Journalière', color: 'blue' },
  { value: 'biweekly', label: 'Bimensuelle', color: 'teal' },
  { value: 'monthly', label: 'Mensuelle', color: 'green' },
  { value: 'quarterly', label: 'Trimestrielle', color: 'purple' },
  { value: 'annual', label: 'Annuelle', color: 'orange' },
]
const BRANDS = ['Acuvue', 'Dailies', 'Air Optix', 'Biofinity', 'PureVision', 'SofLens', 'CooperVision', 'Alcon']

const defaultForm = {
  brand: '', product_name: '', reference: '', lens_type: 'monthly', is_toric: false,
  is_multifocal: false, is_colored: false, material: '', water_content: '',
  min_power: '', max_power: '', min_cylinder: '', max_cylinder: '',
  base_curve: '', diameter: '', units_per_box: 6,
  sale_price: '', purchase_price: '', stock_boxes: 0, min_stock: 3, warehouse_id: '', is_active: true,
}

export default function ContactLenses() {
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
    api.get('/contact-lenses', { params: { page, limit: 20, search: search || undefined } })
      .then(({ data }) => { setLenses(data.data || demoData()); setTotal(data.pagination?.total || 0) })
      .catch(() => { setLenses(demoData()); setTotal(25) })
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
      editing ? await api.put(`/contact-lenses/${editing.id}`, payload) : await api.post('/contact-lenses', payload)
      toast.success(editing ? 'Lentille modifiée' : 'Lentille créée')
      setShowModal(false)
      api.get('/contact-lenses', { params: { page, limit: 20 } }).then(({ data }) => setLenses(data.data || demoData()))
    } catch {} finally { setSaving(false) }
  }

  const columns: Column<any>[] = [
    {
      key: 'brand',
      label: 'Lentille',
      render: (_, row) => (
        <div>
          <p className="font-semibold">{row.brand}</p>
          <p className="text-sm text-slate-500">{row.product_name}</p>
        </div>
      ),
    },
    { key: 'reference', label: 'Réf.', render: (v) => <span className="font-mono text-xs">{v}</span> },
    {
      key: 'lens_type',
      label: 'Type',
      render: (v) => {
        const t = LENS_TYPES.find(x => x.value === v)
        return <Badge color={t?.color as any || 'gray'} size="sm">{t?.label || v}</Badge>
      },
    },
    {
      key: 'is_toric',
      label: 'Options',
      render: (_, row) => (
        <div className="flex gap-1 flex-wrap">
          {row.is_toric && <Badge color="blue" size="sm">Torique</Badge>}
          {row.is_multifocal && <Badge color="purple" size="sm">Multifocale</Badge>}
          {row.is_colored && <Badge color="pink" size="sm">Colorée</Badge>}
        </div>
      ),
    },
    { key: 'base_curve', label: 'BC', render: (v) => v ? <span className="font-mono text-xs">{v}</span> : '—' },
    { key: 'units_per_box', label: 'U/boîte', render: (v) => <span className="text-center">{v}</span> },
    { key: 'sale_price', label: 'Prix boîte', sortable: true, render: (v) => <span className="font-bold">{formatCurrency(v)}</span> },
    {
      key: 'stock_boxes',
      label: 'Stock',
      render: (v, row) => (
        <Badge color={v === 0 ? 'red' : v <= row.min_stock ? 'yellow' : 'green'} size="sm">
          {v} boîte{v > 1 ? 's' : ''}
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
          <h1 className="page-title">Lentilles de contact</h1>
          <p className="text-slate-500 text-sm">{total} référence{total > 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary"><Plus className="h-4 w-4" /> Ajouter</button>
      </div>

      <DataTable columns={columns} data={lenses} loading={loading} onRowClick={openEdit} total={total} page={page} limit={20} onPageChange={setPage} searchable onSearch={setSearch} searchValue={search} emptyMessage="Aucune lentille" />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Modifier la lentille' : 'Nouvelle lentille'} size="xl"
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
            <label className="form-label">Nom <span className="text-red-500">*</span></label>
            <input value={form.product_name} onChange={(e) => set('product_name', e.target.value)} className="form-input" placeholder="Acuvue Oasys 1-Day" />
          </div>
          <div>
            <label className="form-label">Référence</label>
            <input value={form.reference} onChange={(e) => set('reference', e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Fréquence de remplacement</label>
            <select value={form.lens_type} onChange={(e) => set('lens_type', e.target.value)} className="form-input">
              {LENS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Matériau</label>
            <input value={form.material} onChange={(e) => set('material', e.target.value)} className="form-input" placeholder="Silicone hydrogel" />
          </div>
          <div>
            <label className="form-label">Teneur en eau (%)</label>
            <input type="number" value={form.water_content} onChange={(e) => set('water_content', e.target.value)} className="form-input" placeholder="38" />
          </div>
          <div>
            <label className="form-label">Puissance min (D)</label>
            <input type="number" step="0.25" value={form.min_power} onChange={(e) => set('min_power', e.target.value)} className="form-input font-mono" />
          </div>
          <div>
            <label className="form-label">Puissance max (D)</label>
            <input type="number" step="0.25" value={form.max_power} onChange={(e) => set('max_power', e.target.value)} className="form-input font-mono" />
          </div>
          <div>
            <label className="form-label">Rayon de base (mm)</label>
            <input type="number" step="0.1" value={form.base_curve} onChange={(e) => set('base_curve', e.target.value)} className="form-input" placeholder="8.60" />
          </div>
          <div>
            <label className="form-label">Diamètre (mm)</label>
            <input type="number" step="0.1" value={form.diameter} onChange={(e) => set('diameter', e.target.value)} className="form-input" placeholder="14.20" />
          </div>
          <div>
            <label className="form-label">Unités par boîte</label>
            <input type="number" min="1" value={form.units_per_box} onChange={(e) => set('units_per_box', parseInt(e.target.value))} className="form-input" />
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
            <label className="form-label">Stock (boîtes)</label>
            <input type="number" min="0" value={form.stock_boxes} onChange={(e) => set('stock_boxes', parseInt(e.target.value))} className="form-input" />
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
          <div className="sm:col-span-2 lg:col-span-3 flex gap-6">
            {[{ key: 'is_toric', label: 'Torique (astigmates)' }, { key: 'is_multifocal', label: 'Multifocale' }, { key: 'is_colored', label: 'Colorée / Fantaisie' }].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={(form as any)[key]} onChange={(e) => set(key, e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}

function demoData() {
  return Array.from({ length: 15 }, (_, i) => ({
    id: `cl-${i}`,
    brand: BRANDS[i % BRANDS.length],
    product_name: ['Oasys 1-Day', 'Total30', 'Biofinity', 'PureVision 2', 'SofLens Daily'][i % 5],
    reference: `CL-${String(1000 + i).padStart(5, '0')}`,
    lens_type: ['daily', 'monthly', 'monthly', 'biweekly', 'annual'][i % 5],
    is_toric: i % 4 === 0,
    is_multifocal: i % 7 === 0,
    is_colored: i % 6 === 0,
    material: ['Silicone hydrogel', 'Hydrogel'][i % 2],
    water_content: 38 + (i % 5) * 5,
    base_curve: (8.5 + (i % 3) * 0.1).toFixed(1),
    diameter: '14.20',
    units_per_box: [6, 30, 90][i % 3],
    sale_price: Math.floor(Math.random() * 25000 + 5000),
    purchase_price: Math.floor(Math.random() * 10000 + 2000),
    stock_boxes: Math.floor(Math.random() * 20 + 1),
    min_stock: 3,
    is_active: true,
  }))
}
