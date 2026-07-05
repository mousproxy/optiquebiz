import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Printer, CreditCard, CheckCircle, Package, User } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import api from '../../utils/api'
import { formatCurrency, formatDate, formatDateTime, getSaleStatus, getPaymentMethod } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function SaleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [sale, setSale] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [markingReady, setMarkingReady] = useState(false)

  useEffect(() => {
    api.get(`/sales/${id}`)
      .then(({ data }) => setSale(data))
      .catch(() => setSale(demoSale()))
      .finally(() => setLoading(false))
  }, [id])

  const markReady = async () => {
    setMarkingReady(true)
    try {
      await api.patch(`/sales/${id}`, { is_ready: true })
      setSale((s: any) => ({ ...s, is_ready: true }))
      toast.success('Commande marquée comme prête')
    } catch {} finally { setMarkingReady(false) }
  }

  if (loading) return <div className="flex justify-center p-20"><div className="loading-spinner h-8 w-8" /></div>
  if (!sale) return <div className="text-center p-20 text-slate-500">Vente introuvable</div>

  const status = getSaleStatus(sale.status)

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm"><ArrowLeft className="h-4 w-4" /></button>
          <div>
            <h1 className="page-title font-mono">{sale.reference}</h1>
            <p className="text-slate-500 text-sm">{formatDateTime(sale.sale_date)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!sale.is_ready && (
            <button onClick={markReady} disabled={markingReady} className="btn btn-success">
              {markingReady ? <div className="loading-spinner h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
              Marquer prête
            </button>
          )}
          <button className="btn btn-outline"><Printer className="h-4 w-4" /> Imprimer</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Patient */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-primary-600" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Patient</h3>
          </div>
          {sale.patients ? (
            <div className="space-y-1">
              <p className="font-semibold">{sale.patients.first_name} {sale.patients.last_name}</p>
              <p className="text-sm text-slate-500">{sale.patients.phone}</p>
              <p className="text-sm text-slate-500">{sale.patients.email}</p>
              <button onClick={() => navigate(`/patients/${sale.patient_id}`)} className="btn btn-ghost btn-sm mt-2 text-primary-600">
                Voir la fiche patient
              </button>
            </div>
          ) : (
            <p className="text-slate-400 italic">Client non enregistré</p>
          )}
        </div>

        {/* Statuts */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Statut</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Paiement</span>
              <Badge color={status.color as any}>{status.label}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Livraison</span>
              {sale.is_ready
                ? <Badge color="green" dot>Prête à retirer</Badge>
                : <Badge color="yellow" dot>En cours de préparation</Badge>}
            </div>
            {sale.prescription_id && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Ordonnance</span>
                <button onClick={() => navigate(`/prescriptions/${sale.prescription_id}`)} className="text-xs text-primary-600 hover:underline">
                  Voir l'ordonnance
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Totaux */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Récapitulatif</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Sous-total HT</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.discount_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Remise ({sale.discount_percent}%)</span>
                <span className="text-orange-600">-{formatCurrency(sale.discount_amount)}</span>
              </div>
            )}
            {sale.tax_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">TVA</span>
                <span>{formatCurrency(sale.tax_amount)}</span>
              </div>
            )}
            <div className="border-t border-slate-200 dark:border-dark-border pt-2 flex justify-between font-bold">
              <span>Total TTC</span>
              <span className="text-lg">{formatCurrency(sale.total_amount)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>Payé</span>
              <span className="font-semibold">{formatCurrency(sale.paid_amount)}</span>
            </div>
            {sale.remaining_amount > 0 && (
              <div className="flex justify-between text-sm text-orange-600">
                <span>Reste à payer</span>
                <span className="font-bold">{formatCurrency(sale.remaining_amount)}</span>
              </div>
            )}
          </div>
          {sale.remaining_amount > 0 && (
            <button className="btn btn-success w-full mt-4">
              <CreditCard className="h-4 w-4" /> Encaisser le reste
            </button>
          )}
        </div>
      </div>

      {/* Articles */}
      <div className="card">
        <div className="p-4 border-b border-slate-200 dark:border-dark-border flex items-center gap-2">
          <Package className="h-4 w-4 text-primary-600" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Articles ({sale.sale_items?.length || 0})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-th">Produit</th>
                <th className="table-th text-center">Qté</th>
                <th className="table-th text-right">Prix unit.</th>
                <th className="table-th text-right">Remise</th>
                <th className="table-th text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {(sale.sale_items || []).map((item: any) => (
                <tr key={item.id} className="table-row">
                  <td className="table-td">
                    <p className="font-medium">{item.product_name}</p>
                    {item.product_reference && <p className="text-xs text-slate-400 font-mono">{item.product_reference}</p>}
                    {item.lens_treatment && <p className="text-xs text-slate-400">{item.lens_treatment}</p>}
                  </td>
                  <td className="table-td text-center">{item.quantity}</td>
                  <td className="table-td text-right font-mono">{formatCurrency(item.unit_price)}</td>
                  <td className="table-td text-right">
                    {item.discount_percent > 0
                      ? <span className="text-orange-500 text-sm">{item.discount_percent}%</span>
                      : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="table-td text-right font-bold">{formatCurrency(item.total_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paiements */}
      {sale.payments && sale.payments.length > 0 && (
        <div className="card">
          <div className="p-4 border-b border-slate-200 dark:border-dark-border">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Paiements</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-dark-border">
            {sale.payments.map((p: any) => {
              const pm = getPaymentMethod(p.payment_method)
              return (
                <div key={p.id} className="px-4 py-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{pm.icon}</span>
                    <div>
                      <p className="font-medium text-sm">{pm.label}</p>
                      {p.transaction_ref && <p className="text-xs text-slate-400 font-mono">{p.transaction_ref}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(p.amount)}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(p.payment_date)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {sale.notes && (
        <div className="card p-4">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Notes</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">{sale.notes}</p>
        </div>
      )}
    </div>
  )
}

function demoSale() {
  return {
    id: 'demo',
    reference: 'FAC-000199',
    sale_date: new Date(2024, 11, 28).toISOString(),
    status: 'partial',
    is_ready: false,
    subtotal: 185000,
    discount_amount: 9250,
    discount_percent: 5,
    tax_amount: 0,
    total_amount: 175750,
    paid_amount: 100000,
    remaining_amount: 75750,
    prescription_id: null,
    patients: { first_name: 'Kouassi', last_name: 'Ange', phone: '0707070707', email: 'k.ange@email.ci' },
    notes: 'Monture à ajuster lors du retrait',
    sale_items: [
      { id: '1', product_name: 'Monture Ray-Ban RB5228', product_reference: 'RB5228-2034', quantity: 1, unit_price: 85000, discount_percent: 5, total_price: 80750 },
      { id: '2', product_name: 'Verre Essilor Varilux Comfort', product_reference: 'VAR-CM-165', quantity: 2, unit_price: 50000, discount_percent: 5, total_price: 95000, lens_treatment: 'Anti-reflets + Photochromique' },
    ],
    payments: [
      { id: '1', payment_method: 'cash', amount: 60000, payment_date: new Date(2024, 11, 28).toISOString() },
      { id: '2', payment_method: 'orange_money', amount: 40000, transaction_ref: 'OM-4892761', payment_date: new Date(2024, 11, 28).toISOString() },
    ],
  }
}
