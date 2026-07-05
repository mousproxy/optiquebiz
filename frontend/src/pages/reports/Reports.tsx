import { useState } from 'react'
import { FileText, Printer, Download, BarChart3, Users, ShoppingCart, Package, DollarSign, TrendingUp } from 'lucide-react'
import api from '../../utils/api'
import { formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

const REPORT_GROUPS = [
  {
    title: 'Ventes & Facturation',
    icon: ShoppingCart,
    color: 'blue',
    reports: [
      { id: 'sales_daily', name: 'Ventes du jour', description: 'Liste des ventes de la journée', hasDate: false },
      { id: 'sales_monthly', name: 'Ventes du mois', description: 'Synthèse mensuelle des ventes', hasDate: true },
      { id: 'sales_by_seller', name: 'Ventes par vendeur', description: 'Classement des vendeurs', hasDate: true },
      { id: 'invoice_list', name: 'Liste des factures', description: 'Toutes les factures sur une période', hasDate: true },
      { id: 'pending_payments', name: 'Paiements en attente', description: 'Clients avec solde dû', hasDate: false },
      { id: 'sales_by_product', name: 'Ventes par produit', description: 'Top produits vendus', hasDate: true },
    ],
  },
  {
    title: 'Patients & Consultations',
    icon: Users,
    color: 'green',
    reports: [
      { id: 'patient_list', name: 'Liste des patients', description: 'Registre complet des patients', hasDate: false },
      { id: 'new_patients', name: 'Nouveaux patients', description: 'Patients enregistrés sur la période', hasDate: true },
      { id: 'consultations', name: 'Consultations', description: 'Journal des consultations', hasDate: true },
      { id: 'prescriptions', name: 'Ordonnances', description: 'Ordonnances délivrées', hasDate: true },
      { id: 'appointments', name: 'Rendez-vous', description: 'Planning et statistiques RDV', hasDate: true },
    ],
  },
  {
    title: 'Stock & Inventaire',
    icon: Package,
    color: 'purple',
    reports: [
      { id: 'stock_alert', name: 'Alertes de stock', description: 'Produits en rupture ou stock faible', hasDate: false },
      { id: 'stock_valuation', name: 'Valorisation du stock', description: 'Valeur du stock par catégorie', hasDate: false },
      { id: 'stock_movements', name: 'Mouvements de stock', description: 'Entrées et sorties de stock', hasDate: true },
      { id: 'inventory', name: 'Inventaire complet', description: 'État complet du stock au format inventaire', hasDate: false },
      { id: 'frames_catalog', name: 'Catalogue montures', description: 'Toutes les montures avec prix', hasDate: false },
    ],
  },
  {
    title: 'Achats & Fournisseurs',
    icon: TrendingUp,
    color: 'orange',
    reports: [
      { id: 'purchase_orders', name: 'Commandes fournisseurs', description: 'Liste des bons de commande', hasDate: true },
      { id: 'supplier_list', name: 'Liste des fournisseurs', description: 'Répertoire des fournisseurs', hasDate: false },
      { id: 'supplier_balance', name: 'Solde fournisseurs', description: 'Dettes envers les fournisseurs', hasDate: false },
    ],
  },
  {
    title: 'Comptabilité & Caisse',
    icon: DollarSign,
    color: 'teal',
    reports: [
      { id: 'cash_journal', name: 'Journal de caisse', description: 'Tous les mouvements de caisse', hasDate: true },
      { id: 'cash_summary', name: 'Synthèse caisse', description: 'Bilan journalier de caisse', hasDate: true },
      { id: 'accounting_journal', name: 'Journal comptable', description: 'Journal des écritures comptables', hasDate: true },
      { id: 'balance_sheet', name: 'Balance des comptes', description: 'Balance générale sur la période', hasDate: true },
      { id: 'income_statement', name: 'Compte de résultat', description: 'Résultat d\'exploitation', hasDate: true },
    ],
  },
  {
    title: 'Statistiques',
    icon: BarChart3,
    color: 'pink',
    reports: [
      { id: 'revenue_stats', name: 'Chiffre d\'affaires', description: 'Évolution du CA sur la période', hasDate: true },
      { id: 'top_brands', name: 'Top marques', description: 'Marques les plus vendues', hasDate: true },
      { id: 'margin_analysis', name: 'Analyse des marges', description: 'Marge par catégorie de produit', hasDate: true },
      { id: 'payment_methods', name: 'Moyens de paiement', description: 'Répartition par mode de paiement', hasDate: true },
    ],
  },
]

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
  green: 'bg-green-50 text-green-600 dark:bg-green-900/20',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20',
  orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20',
  teal: 'bg-teal-50 text-teal-600 dark:bg-teal-900/20',
  pink: 'bg-pink-50 text-pink-600 dark:bg-pink-900/20',
}

export default function Reports() {
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [loadingReport, setLoadingReport] = useState<string | null>(null)

  const generateReport = async (report: any, format: 'pdf' | 'excel' = 'pdf') => {
    setLoadingReport(report.id)
    try {
      const params: any = { format }
      if (report.hasDate) { params.date_from = dateFrom; params.date_to = dateTo }
      await api.get(`/reports/${report.id}`, { params, responseType: 'blob' })
        .then(res => {
          const url = URL.createObjectURL(new Blob([res.data]))
          const a = document.createElement('a')
          a.href = url
          a.download = `${report.id}_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
          a.click()
          URL.revokeObjectURL(url)
          toast.success('Rapport généré')
        })
    } catch {
      toast.error('Rapport disponible en production (backend requis)')
    } finally { setLoadingReport(null) }
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rapports & États</h1>
          <p className="text-slate-500 text-sm">{REPORT_GROUPS.reduce((s, g) => s + g.reports.length, 0)} rapports disponibles</p>
        </div>
      </div>

      {/* Date filter */}
      <div className="card p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Période par défaut:</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="form-input py-1.5" />
          <span className="text-slate-400">→</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="form-input py-1.5" />
        </div>
        <div className="flex gap-1.5">
          {[
            { label: 'Aujourd\'hui', get: () => [new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0]] },
            { label: 'Ce mois', get: () => [new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], new Date().toISOString().split('T')[0]] },
            { label: 'Mois précédent', get: () => [new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0], new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0]] },
            { label: 'Cette année', get: () => [new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], new Date().toISOString().split('T')[0]] },
          ].map(({ label, get }) => (
            <button key={label} onClick={() => { const [f, t] = get(); setDateFrom(f); setDateTo(t) }} className="px-3 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-dark-surface hover:bg-primary-100 dark:hover:bg-primary-900/20 text-slate-600 dark:text-slate-400 font-medium">
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Report groups */}
      <div className="space-y-6">
        {REPORT_GROUPS.map((group) => {
          const Icon = group.icon
          return (
            <div key={group.title} className="card">
              <div className={`p-4 border-b border-slate-200 dark:border-dark-border flex items-center gap-3`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${COLOR_MAP[group.color]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">{group.title}</h3>
                <span className="ml-auto text-xs text-slate-400">{group.reports.length} rapports</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-dark-border">
                {group.reports.map((report) => (
                  <div key={report.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-dark-surface/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{report.name}</p>
                        <p className="text-xs text-slate-400">{report.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => generateReport(report, 'pdf')}
                        disabled={loadingReport === report.id}
                        className="btn btn-outline btn-sm flex items-center gap-1"
                      >
                        {loadingReport === report.id ? <div className="loading-spinner h-3 w-3" /> : <Printer className="h-3.5 w-3.5" />}
                        PDF
                      </button>
                      <button
                        onClick={() => generateReport(report, 'excel')}
                        disabled={loadingReport === report.id}
                        className="btn btn-outline btn-sm flex items-center gap-1"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Excel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
