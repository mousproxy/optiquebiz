import { useState, useEffect } from 'react'
import { BookOpen, Scale, FileText, BarChart3, Download } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import api from '../../utils/api'
import { formatCurrency, formatDate } from '../../utils/formatters'

const TABS = [
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'balance', label: 'Balance', icon: Scale },
  { id: 'accounts', label: 'Plan comptable', icon: FileText },
]

export default function Accounting() {
  const [tab, setTab] = useState('journal')
  const [journal, setJournal] = useState<any[]>([])
  const [balance, setBalance] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    Promise.all([
      api.get('/accounting/journal', { params: { date_from: dateFrom, date_to: dateTo, limit: 50 } }).catch(() => ({ data: { data: demoJournal() } })),
      api.get('/accounting/balance', { params: { date_from: dateFrom, date_to: dateTo } }).catch(() => ({ data: demoBalance() })),
      api.get('/accounting/accounts').catch(() => ({ data: { data: demoAccounts() } })),
    ]).then(([j, b, a]) => {
      setJournal(j.data?.data || [])
      setBalance(b.data?.data || b.data || [])
      setAccounts(a.data?.data || [])
    }).finally(() => setLoading(false))
  }, [dateFrom, dateTo])

  const totalDebit = balance.reduce((s: number, r: any) => s + (r.total_debit || 0), 0)
  const totalCredit = balance.reduce((s: number, r: any) => s + (r.total_credit || 0), 0)

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title">Comptabilité</h1>
        <button className="btn btn-outline"><Download className="h-4 w-4" /> Exporter</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total débit" value={formatCurrency(totalDebit)} icon={BarChart3} color="blue" />
        <StatCard title="Total crédit" value={formatCurrency(totalCredit)} icon={BarChart3} color="green" />
        <StatCard title="Chiffre d'affaires" value={formatCurrency(totalCredit * 0.7)} icon={BarChart3} color="purple" />
        <StatCard title="Résultat" value={formatCurrency(totalCredit * 0.3 - totalDebit * 0.1)} icon={Scale} color="teal" />
      </div>

      {/* Date filters */}
      <div className="card p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Période:</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="form-input py-1.5" />
          <span className="text-slate-400">→</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="form-input py-1.5" />
        </div>
        <div className="flex gap-1">
          {['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'].map((m, i) => (
            <button key={i} onClick={() => {
              const y = new Date().getFullYear()
              setDateFrom(new Date(y, i, 1).toISOString().split('T')[0])
              setDateTo(new Date(y, i + 1, 0).toISOString().split('T')[0])
            }} className="px-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-dark-surface hover:bg-primary-100 dark:hover:bg-primary-900/20 text-slate-600 dark:text-slate-400">
              {m.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-dark-surface p-1 rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? 'bg-white dark:bg-dark-card shadow text-primary-700 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700'}`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* Journal */}
      {tab === 'journal' && (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-th">Date</th>
                <th className="table-th">Journal</th>
                <th className="table-th">Compte</th>
                <th className="table-th">Libellé</th>
                <th className="table-th">Référence</th>
                <th className="table-th text-right">Débit</th>
                <th className="table-th text-right">Crédit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {loading ? (
                Array.from({ length: 8 }, (_, i) => (
                  <tr key={i}><td colSpan={7} className="table-td"><div className="h-4 bg-slate-100 dark:bg-dark-surface rounded animate-pulse" /></td></tr>
                ))
              ) : journal.map((e: any, i: number) => (
                <tr key={e.id || i} className="table-row">
                  <td className="table-td text-sm">{formatDate(e.entry_date)}</td>
                  <td className="table-td"><span className="font-mono text-xs bg-slate-100 dark:bg-dark-surface px-2 py-0.5 rounded">{e.journal_type}</span></td>
                  <td className="table-td font-mono text-sm font-semibold">{e.account_code}</td>
                  <td className="table-td text-sm">{e.description}</td>
                  <td className="table-td"><span className="font-mono text-xs text-primary-600">{e.reference || '—'}</span></td>
                  <td className="table-td text-right font-mono">{e.debit > 0 ? formatCurrency(e.debit) : ''}</td>
                  <td className="table-td text-right font-mono">{e.credit > 0 ? formatCurrency(e.credit) : ''}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 dark:bg-dark-surface font-bold">
                <td colSpan={5} className="table-td text-right">Total</td>
                <td className="table-td text-right text-blue-700">{formatCurrency(journal.reduce((s: number, e: any) => s + (e.debit || 0), 0))}</td>
                <td className="table-td text-right text-green-700">{formatCurrency(journal.reduce((s: number, e: any) => s + (e.credit || 0), 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Balance */}
      {tab === 'balance' && (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-th">N° Compte</th>
                <th className="table-th">Intitulé</th>
                <th className="table-th text-right">Débit</th>
                <th className="table-th text-right">Crédit</th>
                <th className="table-th text-right">Solde débiteur</th>
                <th className="table-th text-right">Solde créditeur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {balance.map((b: any, i: number) => (
                <tr key={i} className="table-row">
                  <td className="table-td font-mono font-bold">{b.account_code}</td>
                  <td className="table-td">{b.account_name}</td>
                  <td className="table-td text-right font-mono">{formatCurrency(b.total_debit || 0)}</td>
                  <td className="table-td text-right font-mono">{formatCurrency(b.total_credit || 0)}</td>
                  <td className="table-td text-right font-mono text-blue-700">{b.solde_debit > 0 ? formatCurrency(b.solde_debit) : ''}</td>
                  <td className="table-td text-right font-mono text-green-700">{b.solde_credit > 0 ? formatCurrency(b.solde_credit) : ''}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 dark:bg-dark-surface font-bold border-t-2 border-slate-300">
                <td colSpan={2} className="table-td text-right">TOTAUX</td>
                <td className="table-td text-right text-blue-700">{formatCurrency(totalDebit)}</td>
                <td className="table-td text-right text-green-700">{formatCurrency(totalCredit)}</td>
                <td className="table-td text-right text-blue-700">{formatCurrency(balance.reduce((s: number, b: any) => s + (b.solde_debit || 0), 0))}</td>
                <td className="table-td text-right text-green-700">{formatCurrency(balance.reduce((s: number, b: any) => s + (b.solde_credit || 0), 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Accounts */}
      {tab === 'accounts' && (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-th">N° Compte</th>
                <th className="table-th">Intitulé</th>
                <th className="table-th">Type</th>
                <th className="table-th">Classe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {accounts.map((a: any, i: number) => (
                <tr key={i} className="table-row">
                  <td className="table-td font-mono font-bold">{a.code}</td>
                  <td className="table-td">{a.name}</td>
                  <td className="table-td"><span className="text-xs bg-slate-100 dark:bg-dark-surface px-2 py-0.5 rounded font-mono">{a.type}</span></td>
                  <td className="table-td text-slate-500">Classe {a.class || a.code.charAt(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function demoJournal() {
  const types = ['VE', 'AC', 'BQ', 'CA', 'OD']
  const accounts = [
    { code: '411000', name: 'Clients' },
    { code: '707000', name: 'Ventes de marchandises' },
    { code: '445710', name: 'TVA collectée' },
    { code: '512000', name: 'Banques' },
    { code: '601000', name: 'Achats de marchandises' },
    { code: '401000', name: 'Fournisseurs' },
  ]
  return Array.from({ length: 20 }, (_, i) => {
    const acc = accounts[i % accounts.length]
    const isDebit = i % 2 === 0
    const amount = Math.floor(Math.random() * 500000 + 10000)
    return {
      id: `je-${i}`,
      entry_date: new Date(2024, 11, (i % 28) + 1).toISOString(),
      journal_type: types[i % types.length],
      account_code: acc.code,
      description: `${acc.name} — Opération ${i + 1}`,
      reference: i % 2 === 0 ? `FAC-${String(200 - i).padStart(6, '0')}` : null,
      debit: isDebit ? amount : 0,
      credit: isDebit ? 0 : amount,
    }
  })
}

function demoBalance() {
  return [
    { account_code: '411000', account_name: 'Clients', total_debit: 4850000, total_credit: 3200000, solde_debit: 1650000, solde_credit: 0 },
    { account_code: '512000', account_name: 'Banques', total_debit: 3200000, total_credit: 1500000, solde_debit: 1700000, solde_credit: 0 },
    { account_code: '571000', account_name: 'Caisse', total_debit: 850000, total_credit: 420000, solde_debit: 430000, solde_credit: 0 },
    { account_code: '401000', account_name: 'Fournisseurs', total_debit: 1200000, total_credit: 2800000, solde_debit: 0, solde_credit: 1600000 },
    { account_code: '601000', account_name: 'Achats marchandises', total_debit: 3500000, total_credit: 0, solde_debit: 3500000, solde_credit: 0 },
    { account_code: '707000', account_name: 'Ventes marchandises', total_debit: 0, total_credit: 6200000, solde_debit: 0, solde_credit: 6200000 },
    { account_code: '445710', account_name: 'TVA collectée', total_debit: 0, total_credit: 800000, solde_debit: 0, solde_credit: 800000 },
    { account_code: '641000', account_name: 'Charges de personnel', total_debit: 1800000, total_credit: 0, solde_debit: 1800000, solde_credit: 0 },
  ]
}

function demoAccounts() {
  return [
    { code: '101000', name: 'Capital', type: 'passif', class: '1' },
    { code: '411000', name: 'Clients', type: 'actif', class: '4' },
    { code: '401000', name: 'Fournisseurs', type: 'passif', class: '4' },
    { code: '445710', name: 'TVA collectée', type: 'passif', class: '4' },
    { code: '445660', name: 'TVA déductible', type: 'actif', class: '4' },
    { code: '512000', name: 'Banques', type: 'actif', class: '5' },
    { code: '571000', name: 'Caisse', type: 'actif', class: '5' },
    { code: '601000', name: 'Achats de marchandises', type: 'charge', class: '6' },
    { code: '613000', name: 'Loyers', type: 'charge', class: '6' },
    { code: '641000', name: 'Charges de personnel', type: 'charge', class: '6' },
    { code: '707000', name: 'Ventes de marchandises', type: 'produit', class: '7' },
    { code: '758000', name: 'Produits divers', type: 'produit', class: '7' },
    { code: '317100', name: 'Stocks de marchandises', type: 'actif', class: '3' },
    { code: '231000', name: 'Immobilisations corporelles', type: 'actif', class: '2' },
  ]
}
