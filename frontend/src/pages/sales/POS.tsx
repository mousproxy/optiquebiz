import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Search, Plus, Minus, Trash2, ShoppingCart, CreditCard,
  User, FileText, Glasses, Eye, Package, X, CheckCircle,
  Printer, QrCode, Phone
} from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { formatCurrency, getPaymentMethod } from '../../utils/formatters'
import { SaleItem, Payment, PaymentMethod } from '../../types'

interface CartItem extends SaleItem {
  tempId: string
}

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: string }[] = [
  { key: 'cash', label: 'Espèces', icon: '💵' },
  { key: 'orange_money', label: 'Orange Money', icon: '🟠' },
  { key: 'mtn_money', label: 'MTN Money', icon: '🟡' },
  { key: 'moov_money', label: 'Moov Money', icon: '🔵' },
  { key: 'card', label: 'Carte', icon: '💳' },
  { key: 'transfer', label: 'Virement', icon: '🏦' },
  { key: 'check', label: 'Chèque', icon: '📝' },
]

export default function POS() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const barcodeRef = useRef<HTMLInputElement>(null)

  const [cart, setCart] = useState<CartItem[]>([])
  const [patient, setPatient] = useState<any>(null)
  const [prescription, setPrescription] = useState<any>(null)
  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState<any[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState<any[]>([])
  const [productTab, setProductTab] = useState<'frame' | 'lens' | 'contact_lens' | 'accessory' | 'service'>('frame')

  const [discountPercent, setDiscountPercent] = useState(0)
  const [notes, setNotes] = useState('')
  const [showPayModal, setShowPayModal] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([{ amount: 0, method: 'cash' }])
  const [saving, setSaving] = useState(false)
  const [saleComplete, setSaleComplete] = useState<any>(null)

  // Totals
  const subtotal = cart.reduce((s, i) => s + i.totalPrice, 0)
  const discountAmount = subtotal * discountPercent / 100
  const total = subtotal - discountAmount
  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0)
  const remaining = total - totalPaid

  useEffect(() => {
    const pid = searchParams.get('patientId')
    const prid = searchParams.get('prescriptionId')
    if (pid) loadPatient(pid)
    if (prid) loadPrescription(prid)
    barcodeRef.current?.focus()
  }, [])

  const loadPatient = async (id: string) => {
    try {
      const { data } = await api.get(`/patients/${id}`)
      setPatient(data)
    } catch {}
  }

  const loadPrescription = async (id: string) => {
    try {
      const { data } = await api.get(`/prescriptions/${id}`)
      setPrescription(data)
    } catch {}
  }

  const searchPatients = useCallback(async (q: string) => {
    if (q.length < 2) { setPatientResults([]); return }
    try {
      const { data } = await api.get('/patients', { params: { search: q, limit: 5 } })
      setPatientResults(data.data || [])
    } catch {
      setPatientResults(demoPatients().filter(p =>
        p.name.toLowerCase().includes(q.toLowerCase()) || p.phone.includes(q)
      ))
    }
  }, [])

  const searchProducts = useCallback(async (q: string, type: string) => {
    if (q.length < 1) { setProductResults([]); return }
    try {
      const endpoint = type === 'frame' ? '/frames/search' : type === 'lens' ? '/lenses' : type === 'contact_lens' ? '/contact-lenses' : '/accessories'
      const { data } = await api.get(endpoint, { params: { search: q, limit: 10 } })
      const items = Array.isArray(data) ? data : data.data || []
      setProductResults(items.map((p: any) => ({ ...p, product_type: type })))
    } catch {
      setProductResults(demoProducts(type).filter(p =>
        p.name.toLowerCase().includes(q.toLowerCase()) || p.reference?.includes(q) || (p as any).barcode?.includes(q)
      ))
    }
  }, [])

  useEffect(() => { searchPatients(patientSearch) }, [patientSearch, searchPatients])
  useEffect(() => { searchProducts(productSearch, productTab) }, [productSearch, productTab, searchProducts])

  const addToCart = (product: any) => {
    const existing = cart.find(i => i.productId === product.id && i.productType === product.product_type)
    if (existing) {
      updateQty(existing.tempId, existing.quantity + 1)
    } else {
      const newItem: CartItem = {
        tempId: `tmp-${Date.now()}-${Math.random()}`,
        productType: product.product_type,
        productId: product.id,
        productName: product.name || `${product.reference}`,
        productRef: product.reference || product.barcode,
        quantity: 1,
        unitPrice: product.sale_price || product.salePrice || 0,
        discountPercent: 0,
        totalPrice: product.sale_price || product.salePrice || 0,
      }
      setCart(c => [...c, newItem])
    }
    setProductSearch('')
    setProductResults([])
    barcodeRef.current?.focus()
  }

  const updateQty = (tempId: string, qty: number) => {
    if (qty <= 0) { removeItem(tempId); return }
    setCart(c => c.map(i => i.tempId === tempId
      ? { ...i, quantity: qty, totalPrice: qty * i.unitPrice * (1 - (i.discountPercent || 0) / 100) }
      : i
    ))
  }

  const updatePrice = (tempId: string, price: number) => {
    setCart(c => c.map(i => i.tempId === tempId
      ? { ...i, unitPrice: price, totalPrice: i.quantity * price * (1 - (i.discountPercent || 0) / 100) }
      : i
    ))
  }

  const removeItem = (tempId: string) => setCart(c => c.filter(i => i.tempId !== tempId))

  const updatePayment = (idx: number, field: string, value: any) => {
    setPayments(p => p.map((pay, i) => i === idx ? { ...pay, [field]: value } : pay))
  }

  const handleCompleteSale = async () => {
    if (cart.length === 0) { toast.error('Panier vide'); return }
    setSaving(true)
    try {
      const payload = {
        patient_id: patient?.id || patient?.patient_id,
        prescription_id: prescription?.id,
        discount_percent: discountPercent,
        notes,
        items: cart.map(({ tempId, ...item }) => item),
        payments: payments.filter(p => p.amount > 0),
        sale_date: new Date().toISOString().split('T')[0],
      }
      const { data } = await api.post('/sales', payload)
      setSaleComplete(data)
      toast.success('Vente enregistrée avec succès !')
      setShowPayModal(false)
    } catch {} finally { setSaving(false) }
  }

  const resetSale = () => {
    setCart([])
    setPatient(null)
    setPrescription(null)
    setDiscountPercent(0)
    setNotes('')
    setPayments([{ amount: 0, method: 'cash' }])
    setSaleComplete(null)
    barcodeRef.current?.focus()
  }

  // ==========================================
  // SALE COMPLETE SCREEN
  // ==========================================
  if (saleComplete) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Vente enregistrée !</h2>
          <p className="text-slate-500 mb-1">Référence: <strong className="text-primary-600">{saleComplete.reference}</strong></p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-4">{formatCurrency(saleComplete.total_amount)}</p>
          {saleComplete.remaining_amount > 0 && (
            <p className="text-orange-600 font-medium mt-1">Reste à payer: {formatCurrency(saleComplete.remaining_amount)}</p>
          )}
          <div className="flex gap-3 mt-6">
            <button onClick={() => navigate(`/sales/${saleComplete.id}`)} className="btn btn-outline flex-1">
              <Eye className="h-4 w-4" /> Voir la vente
            </button>
            <button className="btn btn-outline flex-1">
              <Printer className="h-4 w-4" /> Imprimer facture
            </button>
          </div>
          <button onClick={resetSale} className="btn btn-primary w-full mt-3 btn-lg">
            <Plus className="h-4 w-4" /> Nouvelle vente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Left panel - Products */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Patient search */}
        <div className="card p-3">
          {patient ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">
                  {patient.first_name?.charAt(0)}{patient.last_name?.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">{patient.first_name} {patient.last_name}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1"><Phone className="h-3 w-3" />{patient.phone}</p>
              </div>
              {prescription && (
                <Badge color="green" size="sm">Ordonnance: {prescription.reference}</Badge>
              )}
              <button onClick={() => { setPatient(null); setPrescription(null) }} className="btn btn-ghost p-1.5">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="form-input pl-9"
                placeholder="Rechercher un patient par nom, téléphone..."
              />
              {patientResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl shadow-xl z-20 overflow-hidden">
                  {patientResults.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => { setPatient(p); setPatientSearch(''); setPatientResults([]) }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-dark-hover text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary-700">{p.first_name?.charAt(0)}{p.last_name?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{p.first_name} {p.last_name}</p>
                        <p className="text-xs text-slate-400">{p.phone} • {p.city}</p>
                      </div>
                      <Badge color="blue" size="sm">{p.code}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Barcode / Product search */}
        <div className="card p-3 flex flex-col gap-3 flex-shrink-0">
          <div className="relative">
            <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              ref={barcodeRef}
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="form-input pl-9"
              placeholder="Scanner code-barres ou rechercher un produit..."
            />
            {productSearch && (
              <button onClick={() => { setProductSearch(''); setProductResults([]) }} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-slate-400" />
              </button>
            )}
          </div>

          {/* Product category tabs */}
          <div className="flex gap-1 overflow-x-auto">
            {[
              { key: 'frame', label: 'Montures', icon: Glasses },
              { key: 'lens', label: 'Verres', icon: Eye },
              { key: 'contact_lens', label: 'Lentilles', icon: Eye },
              { key: 'accessory', label: 'Accessoires', icon: Package },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setProductTab(key as any); setProductSearch(''); setProductResults([]) }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  productTab === key ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-dark-hover text-slate-600 dark:text-slate-300'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Search results */}
          {productResults.length > 0 && (
            <div className="border border-slate-200 dark:border-dark-border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              {productResults.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-left border-b border-slate-100 dark:border-dark-border last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{p.name}</p>
                    <p className="text-xs text-slate-400 truncate">{p.reference} {p.barcode ? `• ${p.barcode}` : ''} • Stock: {p.stock_quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-primary-600 flex-shrink-0">{formatCurrency(p.sale_price || p.salePrice)}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="card flex-1 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-dark-border flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" /> Panier
              {cart.length > 0 && <Badge color="blue" size="sm">{cart.length}</Badge>}
            </h3>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="btn btn-ghost btn-sm text-red-500">
                <Trash2 className="h-4 w-4" /> Vider
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-12">
                <ShoppingCart className="h-10 w-10" />
                <p>Panier vide</p>
                <p className="text-xs">Scannez ou recherchez un produit</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-dark-border">
                {cart.map((item) => (
                  <div key={item.tempId} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{item.productName}</p>
                      <p className="text-xs text-slate-400 truncate">{item.productRef}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => updateQty(item.tempId, item.quantity - 1)} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-dark-hover flex items-center justify-center hover:bg-slate-200">
                        <Minus className="h-3.5 w-3.5 text-slate-600" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQty(item.tempId, item.quantity + 1)} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-dark-hover flex items-center justify-center hover:bg-slate-200">
                        <Plus className="h-3.5 w-3.5 text-slate-600" />
                      </button>
                    </div>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updatePrice(item.tempId, parseFloat(e.target.value) || 0)}
                      className="w-28 text-right form-input py-1 text-sm font-mono"
                    />
                    <p className="w-24 text-right font-semibold text-slate-800 dark:text-slate-200 flex-shrink-0">
                      {formatCurrency(item.totalPrice)}
                    </p>
                    <button onClick={() => removeItem(item.tempId)} className="p-1.5 hover:bg-red-100 text-red-500 rounded-lg">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right panel - Totals & Payment */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-3">
        <div className="card p-4 space-y-3">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Récapitulatif</h3>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Sous-total</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 flex-shrink-0">Remise</span>
              <div className="flex items-center gap-1 ml-auto">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                  className="w-16 form-input py-1 text-sm text-right"
                />
                <span className="text-sm text-slate-500">%</span>
              </div>
              <span className="text-sm font-medium text-red-600">-{formatCurrency(discountAmount)}</span>
            </div>
            <div className="border-t border-slate-200 dark:border-dark-border pt-2 flex justify-between">
              <span className="font-semibold">TOTAL</span>
              <span className="text-xl font-bold text-primary-600">{formatCurrency(total)}</span>
            </div>
          </div>

          <div>
            <label className="form-label text-xs">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-input text-sm"
              rows={2}
              placeholder="Notes sur la commande..."
            />
          </div>

          <button
            onClick={() => {
              setPayments([{ amount: total, method: 'cash' }])
              setShowPayModal(true)
            }}
            disabled={cart.length === 0}
            className="btn btn-primary w-full btn-lg"
          >
            <CreditCard className="h-5 w-5" />
            Encaisser {formatCurrency(total)}
          </button>
        </div>

        {/* Quick actions */}
        <div className="card p-3 space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Actions rapides</p>
          <button onClick={() => navigate('/prescriptions/new')} className="btn btn-outline w-full btn-sm">
            <FileText className="h-4 w-4" /> Nouvelle ordonnance
          </button>
          <button onClick={() => navigate('/patients/new')} className="btn btn-outline w-full btn-sm">
            <User className="h-4 w-4" /> Nouveau patient
          </button>
        </div>
      </div>

      {/* Payment modal */}
      <Modal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        title="Encaissement"
        size="lg"
        footer={
          <div className="flex gap-3 justify-end items-center">
            <div className="flex-1">
              <p className="text-sm text-slate-500">Total: <strong className="text-slate-800 dark:text-white">{formatCurrency(total)}</strong></p>
              <p className={`text-sm font-semibold ${remaining <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                {remaining <= 0 ? `Monnaie: ${formatCurrency(Math.abs(remaining))}` : `Reste: ${formatCurrency(remaining)}`}
              </p>
            </div>
            <button onClick={() => setShowPayModal(false)} className="btn btn-outline">Annuler</button>
            <button onClick={handleCompleteSale} disabled={saving} className="btn btn-success btn-lg">
              {saving ? <div className="loading-spinner h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
              Valider la vente
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {payments.map((pay, idx) => (
            <div key={idx} className="p-4 bg-slate-50 dark:bg-dark-hover rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">Paiement {idx + 1}</p>
                {idx > 0 && (
                  <button onClick={() => setPayments(p => p.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-600">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label text-xs">Montant</label>
                  <input
                    type="number"
                    value={pay.amount || ''}
                    onChange={(e) => updatePayment(idx, 'amount', parseFloat(e.target.value) || 0)}
                    className="form-input text-lg font-bold text-right"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="form-label text-xs">Mode de paiement</label>
                  <select value={pay.method} onChange={(e) => updatePayment(idx, 'method', e.target.value)} className="form-input">
                    {PAYMENT_METHODS.map(m => <option key={m.key} value={m.key}>{m.icon} {m.label}</option>)}
                  </select>
                </div>
              </div>

              {['orange_money', 'mtn_money', 'moov_money', 'transfer'].includes(pay.method || '') && (
                <div>
                  <label className="form-label text-xs">Référence transaction</label>
                  <input
                    value={pay.transactionRef || ''}
                    onChange={(e) => updatePayment(idx, 'transactionRef', e.target.value)}
                    className="form-input"
                    placeholder="N° de transaction"
                  />
                </div>
              )}
            </div>
          ))}

          {remaining > 0 && (
            <button
              onClick={() => setPayments(p => [...p, { amount: remaining, method: 'cash' }])}
              className="btn btn-outline w-full btn-sm"
            >
              <Plus className="h-4 w-4" /> Ajouter un paiement partiel
            </button>
          )}

          {/* Method shortcuts */}
          <div className="grid grid-cols-4 gap-2">
            {PAYMENT_METHODS.map(m => (
              <button
                key={m.key}
                onClick={() => setPayments([{ amount: total, method: m.key }])}
                className={`p-2 rounded-xl border text-center transition-colors text-xs font-medium ${
                  payments[0]?.method === m.key
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700'
                    : 'border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-hover text-slate-600 dark:text-slate-300'
                }`}
              >
                <span className="text-xl block mb-1">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}

function demoPatients() {
  return [
    { id: 'p1', first_name: 'Kouassi', last_name: 'Ama', phone: '0707070707', city: 'Abidjan', code: 'PAT-000001', name: 'Kouassi Ama' },
    { id: 'p2', first_name: 'Traoré', last_name: 'Ibrahim', phone: '0505050505', city: 'Abidjan', code: 'PAT-000002', name: 'Traoré Ibrahim' },
  ]
}

function demoProducts(type: string) {
  const products = {
    frame: [
      { id: 'f1', name: 'Ray-Ban RB5154 Noir', reference: 'RB5154-BLK', barcode: '1234567890', sale_price: 45000, stock_quantity: 5, product_type: 'frame' },
      { id: 'f2', name: 'Silhouette Pure 5515 Or', reference: 'SP5515-GLD', barcode: '2345678901', sale_price: 85000, stock_quantity: 3, product_type: 'frame' },
      { id: 'f3', name: 'Essilor EF380 Argent', reference: 'EF380-SLV', barcode: '3456789012', sale_price: 32000, stock_quantity: 8, product_type: 'frame' },
    ],
    lens: [
      { id: 'l1', name: 'Essilor Varilux Comfort', reference: 'VAR-CMFT', sale_price: 120000, stock_quantity: 20, product_type: 'lens' },
      { id: 'l2', name: 'Zeiss Single Vision 1.67', reference: 'ZS-167', sale_price: 95000, stock_quantity: 15, product_type: 'lens' },
      { id: 'l3', name: 'Crizal Forte UV', reference: 'CRIZ-UV', sale_price: 45000, stock_quantity: 30, product_type: 'lens' },
    ],
    contact_lens: [
      { id: 'cl1', name: 'Acuvue Oasys 1 Jour', reference: 'AO1J', sale_price: 25000, stock_quantity: 50, product_type: 'contact_lens' },
    ],
    accessory: [
      { id: 'a1', name: 'Étui lunettes cuir', reference: 'ETU-CUI', barcode: '4567890123', sale_price: 5000, stock_quantity: 20, product_type: 'accessory' },
      { id: 'a2', name: 'Solution nettoyante 100ml', reference: 'SOL-100', barcode: '5678901234', sale_price: 3500, stock_quantity: 35, product_type: 'accessory' },
    ],
  }
  return (products[type as keyof typeof products] || [])
}
