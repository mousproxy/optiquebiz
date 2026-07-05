import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Trash2, Search } from 'lucide-react'
import api from '../../utils/api'
import { formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

interface PurchaseItem {
  product_type: string
  product_id: string
  product_name: string
  reference: string
  quantity: number
  unit_price: number
  total_price: number
}

export default function PurchaseForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [suppliers, setSuppliers] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    supplier_id: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_date: '',
    notes: '',
    tax_rate: 0,
  })
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    api.get('/suppliers', { params: { limit: 100 } })
      .then(({ data }) => setSuppliers(data.data || []))
      .catch(() => setSuppliers(demoSuppliers()))
  }, [])

  const setField = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const searchProducts = async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return }
    setSearching(true)
    try {
      const [frames, lenses] = await Promise.all([
        api.get('/frames', { params: { search: q, limit: 5 } }),
        api.get('/lenses', { params: { search: q, limit: 5 } }),
      ])
      const results = [
        ...(frames.data.data || []).map((f: any) => ({ ...f, product_type: 'frame', product_name: `${f.brand} ${f.model_name}` })),
        ...(lenses.data.data || []).map((l: any) => ({ ...l, product_type: 'lens', product_name: `${l.brand} ${l.product_name}` })),
      ]
      setSearchResults(results)
    } catch {
      setSearchResults(demoProducts().filter(p => p.product_name.toLowerCase().includes(q.toLowerCase())))
    } finally { setSearching(false) }
  }

  const addItem = (product: any) => {
    const existing = items.find(i => i.product_id === product.id && i.product_type === product.product_type)
    if (existing) {
      updateItem(items.indexOf(existing), 'quantity', existing.quantity + 1)
    } else {
      const price = product.purchase_price || 0
      setItems(prev => [...prev, {
        product_type: product.product_type,
        product_id: product.id,
        product_name: product.product_name,
        reference: product.reference || '',
        quantity: 1,
        unit_price: price,
        total_price: price,
      }])
    }
    setProductSearch('')
    setSearchResults([])
  }

  const updateItem = (idx: number, field: string, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const updated = { ...item, [field]: value }
      updated.total_price = updated.quantity * updated.unit_price
      return updated
    }))
  }

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx))

  const subtotal = items.reduce((s, i) => s + i.total_price, 0)
  const taxAmount = subtotal * (form.tax_rate / 100)
  const total = subtotal + taxAmount

  const handleSave = async () => {
    if (!form.supplier_id) { toast.error('Veuillez sélectionner un fournisseur'); return }
    if (items.length === 0) { toast.error('Ajoutez au moins un article'); return }
    setSaving(true)
    try {
      const payload = { ...form, items, total_amount: total, tax_amount: taxAmount }
      const res = isEdit
        ? await api.put(`/purchases/${id}`, payload)
        : await api.post('/purchases', payload)
      toast.success(isEdit ? 'Commande modifiée' : 'Commande créée')
      navigate(`/purchases/${res.data.id}`)
    } catch {} finally { setSaving(false) }
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm"><ArrowLeft className="h-4 w-4" /></button>
          <h1 className="page-title">{isEdit ? 'Modifier la commande' : 'Nouvelle commande fournisseur'}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(-1)} className="btn btn-outline">Annuler</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? <div className="loading-spinner h-4 w-4" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </button>
        </div>
      </div>

      {/* Header form */}
      <div className="card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="form-label">Fournisseur <span className="text-red-500">*</span></label>
            <select value={form.supplier_id} onChange={(e) => setField('supplier_id', e.target.value)} className="form-input">
              <option value="">Choisir un fournisseur...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Date de commande</label>
            <input type="date" value={form.order_date} onChange={(e) => setField('order_date', e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Livraison prévue</label>
            <input type="date" value={form.expected_date} onChange={(e) => setField('expected_date', e.target.value)} className="form-input" />
          </div>
        </div>
      </div>

      {/* Product search */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Rechercher des produits</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={productSearch}
            onChange={(e) => { setProductSearch(e.target.value); searchProducts(e.target.value) }}
            className="form-input pl-10"
            placeholder="Tapez une marque, référence ou nom..."
          />
          {(searchResults.length > 0 || searching) && (
            <div className="absolute z-10 left-0 right-0 mt-1 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl shadow-xl max-h-60 overflow-y-auto">
              {searching && <div className="p-3 text-center"><div className="loading-spinner h-4 w-4 mx-auto" /></div>}
              {searchResults.map((p) => (
                <button key={`${p.product_type}-${p.id}`} onClick={() => addItem(p)} className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-dark-surface flex justify-between items-center border-b border-slate-100 dark:border-dark-border last:border-0">
                  <div>
                    <p className="font-medium text-sm">{p.product_name}</p>
                    <p className="text-xs text-slate-400 font-mono">{p.reference}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">{p.product_type === 'frame' ? 'Monture' : 'Verre'}</p>
                    <p className="text-sm font-semibold">{formatCurrency(p.purchase_price)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="card">
        <div className="p-4 border-b border-slate-200 dark:border-dark-border">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Articles commandés ({items.length})</h3>
        </div>
        {items.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <Plus className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>Ajoutez des produits via la recherche ci-dessus</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-th">Produit</th>
                  <th className="table-th text-center">Quantité</th>
                  <th className="table-th text-right">Prix unit. (FCFA)</th>
                  <th className="table-th text-right">Total</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {items.map((item, idx) => (
                  <tr key={idx} className="table-row">
                    <td className="table-td">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-xs text-slate-400 font-mono">{item.reference}</p>
                    </td>
                    <td className="table-td">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => updateItem(idx, 'quantity', Math.max(1, item.quantity - 1))} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold">-</button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button onClick={() => updateItem(idx, 'quantity', item.quantity + 1)} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold">+</button>
                      </div>
                    </td>
                    <td className="table-td">
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="form-input text-right w-32 ml-auto"
                      />
                    </td>
                    <td className="table-td text-right font-bold">{formatCurrency(item.total_price)}</td>
                    <td className="table-td">
                      <button onClick={() => removeItem(idx)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        {items.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-dark-border">
            <div className="flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Sous-total HT</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-slate-500">TVA (%)</span>
                  <input type="number" min="0" max="100" step="0.5" value={form.tax_rate} onChange={(e) => setField('tax_rate', parseFloat(e.target.value) || 0)} className="form-input w-24 text-right py-1" />
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Montant TVA</span>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t border-slate-200 dark:border-dark-border pt-2">
                  <span>Total TTC</span>
                  <span className="text-primary-700 dark:text-primary-400">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card p-4">
        <label className="form-label">Notes / Instructions</label>
        <textarea value={form.notes} onChange={(e) => setField('notes', e.target.value)} className="form-input" rows={2} placeholder="Instructions de livraison, notes particulières..." />
      </div>

      <div className="flex justify-between">
        <button onClick={() => navigate(-1)} className="btn btn-outline">Annuler</button>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-lg">
          {saving ? <div className="loading-spinner h-4 w-4" /> : <Save className="h-4 w-4" />}
          {isEdit ? 'Mettre à jour' : 'Créer la commande'}
        </button>
      </div>
    </div>
  )
}

function demoSuppliers() {
  return [
    { id: 's1', company_name: 'Luxottica Afrique' },
    { id: 's2', company_name: 'Essilor Côte d\'Ivoire' },
    { id: 's3', company_name: 'Optic Distribution CI' },
  ]
}

function demoProducts() {
  return [
    { id: 'f1', product_type: 'frame', product_name: 'Ray-Ban Wayfarer RB2140', reference: 'RB2140-901', purchase_price: 45000 },
    { id: 'f2', product_type: 'frame', product_name: 'Oakley Holbrook OO9102', reference: 'OAK-9102-55', purchase_price: 60000 },
    { id: 'l1', product_type: 'lens', product_name: 'Essilor Varilux Comfort 3F', reference: 'ESS-VAR-CF3', purchase_price: 35000 },
    { id: 'l2', product_type: 'lens', product_name: 'Zeiss Single Vision', reference: 'ZSS-SV-160', purchase_price: 28000 },
  ]
}
