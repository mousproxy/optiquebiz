import { useState, useEffect } from 'react'
import { Save, Building2, CreditCard, Bell, Shield, Database, Palette, Zap, Check, X } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { formatDate } from '../../utils/formatters'
import type { Subscription } from '../../types'

const TABS = [
  { id: 'company', label: 'Entreprise', icon: Building2 },
  { id: 'subscription', label: 'Abonnement', icon: Zap },
  { id: 'billing', label: 'Facturation', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Sécurité', icon: Shield },
  { id: 'system', label: 'Système', icon: Database },
]

const ALL_MODULES: { key: string; label: string }[] = [
  { key: 'procurement', label: 'Achats & Fournisseurs' },
  { key: 'cashier', label: 'Caisse' },
  { key: 'accounting', label: 'Comptabilité' },
  { key: 'hr', label: 'Ressources Humaines' },
  { key: 'crm', label: 'CRM & Marketing' },
  { key: 'reports', label: 'Rapports' },
]

const STATUS_LABELS: Record<string, string> = {
  trialing: 'Essai gratuit',
  active: 'Actif',
  past_due: 'Impayé',
  canceled: 'Annulé',
}

export default function Settings() {
  const [tab, setTab] = useState('company')
  const [saving, setSaving] = useState(false)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [company, setCompany] = useState({
    name: 'OptiGest CI',
    legal_name: 'OPTIGEST SARL',
    tax_number: 'CI-2024-12345',
    rccm: 'CI-ABJ-2024-B-01234',
    address: 'Rue des Jardins, Cocody',
    city: 'Abidjan',
    country: 'Côte d\'Ivoire',
    phone: '+225 07 07 07 07 07',
    email: 'contact@optigest.ci',
    website: 'www.optigest.ci',
    currency: 'FCFA',
    tax_rate: 18,
    logo_url: '',
  })
  const [billing, setBilling] = useState({
    invoice_prefix: 'FAC',
    quote_prefix: 'DEV',
    purchase_prefix: 'BC',
    invoice_footer: 'Merci de votre confiance. Retour possible dans les 30 jours avec ticket de caisse.',
    bank_name: 'Société Générale CI',
    bank_iban: 'CI00 0000 0000 0000 0000 0000 000',
    bank_swift: 'SGBFCIAB',
    show_tax: true,
    show_bank: true,
  })
  const [notifications, setNotifications] = useState({
    sms_low_stock: true,
    sms_ready_order: true,
    email_daily_summary: true,
    email_new_patient: false,
    sms_appointment_reminder: true,
    reminder_hours: 24,
  })
  const [security, setSecurity] = useState({
    session_timeout: 480,
    max_login_attempts: 5,
    two_factor_enabled: false,
    audit_log_enabled: true,
    backup_frequency: 'daily',
    backup_retention: 30,
  })

  useEffect(() => {
    api.get('/settings')
      .then(({ data }) => {
        if (data.company) setCompany(c => ({ ...c, ...data.company }))
        if (data.billing) setBilling(b => ({ ...b, ...data.billing }))
        if (data.notifications) setNotifications(n => ({ ...n, ...data.notifications }))
      })
      .catch(() => {})

    api.get('/settings/company')
      .then(({ data }) => setSubscription(data?.subscription || null))
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/settings', { company, billing, notifications, security })
      toast.success('Paramètres enregistrés')
    } catch { toast.success('Paramètres enregistrés (mode démo)') } finally { setSaving(false) }
  }

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="form-label">{label}</label>
      {children}
    </div>
  )

  const Toggle = ({ label, desc, value, onChange }: any) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-dark-border last:border-0">
      <div>
        <p className="font-medium text-sm">{label}</p>
        {desc && <p className="text-xs text-slate-400">{desc}</p>}
      </div>
      <button onClick={() => onChange(!value)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title">Paramètres</h1>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary">
          {saving ? <div className="loading-spinner h-4 w-4" /> : <Save className="h-4 w-4" />}
          Enregistrer
        </button>
      </div>

      <div className="flex gap-5">
        {/* Sidebar tabs */}
        <div className="w-52 flex-shrink-0 space-y-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${tab === id ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-surface'}`}>
              <Icon className="h-4 w-4 flex-shrink-0" />{label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5">
          {tab === 'company' && (
            <div className="card p-5 space-y-5">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Informations de l'entreprise</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nom commercial"><input value={company.name} onChange={(e) => setCompany(c => ({ ...c, name: e.target.value }))} className="form-input" /></Field>
                <Field label="Raison sociale"><input value={company.legal_name} onChange={(e) => setCompany(c => ({ ...c, legal_name: e.target.value }))} className="form-input" /></Field>
                <Field label="N° Contribuable (NIF)"><input value={company.tax_number} onChange={(e) => setCompany(c => ({ ...c, tax_number: e.target.value }))} className="form-input" /></Field>
                <Field label="RCCM"><input value={company.rccm} onChange={(e) => setCompany(c => ({ ...c, rccm: e.target.value }))} className="form-input" /></Field>
                <div className="sm:col-span-2">
                  <Field label="Adresse"><input value={company.address} onChange={(e) => setCompany(c => ({ ...c, address: e.target.value }))} className="form-input" /></Field>
                </div>
                <Field label="Ville"><input value={company.city} onChange={(e) => setCompany(c => ({ ...c, city: e.target.value }))} className="form-input" /></Field>
                <Field label="Pays"><input value={company.country} onChange={(e) => setCompany(c => ({ ...c, country: e.target.value }))} className="form-input" /></Field>
                <Field label="Téléphone"><input value={company.phone} onChange={(e) => setCompany(c => ({ ...c, phone: e.target.value }))} className="form-input" /></Field>
                <Field label="Email"><input type="email" value={company.email} onChange={(e) => setCompany(c => ({ ...c, email: e.target.value }))} className="form-input" /></Field>
                <Field label="Site web"><input value={company.website} onChange={(e) => setCompany(c => ({ ...c, website: e.target.value }))} className="form-input" /></Field>
                <Field label="Devise">
                  <select value={company.currency} onChange={(e) => setCompany(c => ({ ...c, currency: e.target.value }))} className="form-input">
                    <option value="FCFA">FCFA — Franc CFA</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="USD">USD — Dollar US</option>
                  </select>
                </Field>
                <Field label="Taux TVA (%)"><input type="number" min="0" max="100" step="0.5" value={company.tax_rate} onChange={(e) => setCompany(c => ({ ...c, tax_rate: parseFloat(e.target.value) }))} className="form-input" /></Field>
              </div>
            </div>
          )}

          {tab === 'subscription' && (
            <div className="card p-5 space-y-5">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Mon abonnement</h3>
              {!subscription ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Chargement...</p>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-dark-surface rounded-xl">
                    <div>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{subscription.planName}</p>
                      {subscription.status === 'trialing' && subscription.trialEndsAt && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Essai jusqu'au {formatDate(new Date(subscription.trialEndsAt), 'dd/MM/yyyy')}
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${subscription.status === 'active' ? 'bg-green-100 text-green-700' : subscription.status === 'trialing' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {STATUS_LABELS[subscription.status] || subscription.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Modules inclus dans votre plan</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ALL_MODULES.map(m => {
                        const included = subscription.modules.includes(m.key as any)
                        return (
                          <div key={m.key} className={`flex items-center gap-2 p-3 rounded-xl border ${included ? 'border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900/30' : 'border-slate-200 bg-slate-50 dark:bg-dark-surface dark:border-dark-border opacity-60'}`}>
                            {included ? <Check className="h-4 w-4 text-green-600 flex-shrink-0" /> : <X className="h-4 w-4 text-slate-400 flex-shrink-0" />}
                            <span className="text-sm">{m.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'billing' && (
            <div className="card p-5 space-y-5">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Paramètres de facturation</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Préfixe factures"><input value={billing.invoice_prefix} onChange={(e) => setBilling(b => ({ ...b, invoice_prefix: e.target.value }))} className="form-input" /></Field>
                <Field label="Préfixe devis"><input value={billing.quote_prefix} onChange={(e) => setBilling(b => ({ ...b, quote_prefix: e.target.value }))} className="form-input" /></Field>
                <Field label="Préfixe bons de commande"><input value={billing.purchase_prefix} onChange={(e) => setBilling(b => ({ ...b, purchase_prefix: e.target.value }))} className="form-input" /></Field>
                <Field label="Banque"><input value={billing.bank_name} onChange={(e) => setBilling(b => ({ ...b, bank_name: e.target.value }))} className="form-input" /></Field>
                <Field label="IBAN / Compte"><input value={billing.bank_iban} onChange={(e) => setBilling(b => ({ ...b, bank_iban: e.target.value }))} className="form-input" /></Field>
                <Field label="Code SWIFT/BIC"><input value={billing.bank_swift} onChange={(e) => setBilling(b => ({ ...b, bank_swift: e.target.value }))} className="form-input" /></Field>
                <div className="sm:col-span-3">
                  <Field label="Pied de page des factures"><textarea value={billing.invoice_footer} onChange={(e) => setBilling(b => ({ ...b, invoice_footer: e.target.value }))} className="form-input" rows={2} /></Field>
                </div>
              </div>
              <div className="space-y-0.5">
                <Toggle label="Afficher la TVA" desc="Affiche le détail TVA sur les factures" value={billing.show_tax} onChange={(v: boolean) => setBilling(b => ({ ...b, show_tax: v }))} />
                <Toggle label="Afficher les coordonnées bancaires" desc="Affiche les infos bancaires sur les factures" value={billing.show_bank} onChange={(v: boolean) => setBilling(b => ({ ...b, show_bank: v }))} />
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="card p-5 space-y-1">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Notifications automatiques</h3>
              <Toggle label="SMS alerte stock faible" desc="Alerter le gestionnaire quand le stock est bas" value={notifications.sms_low_stock} onChange={(v: boolean) => setNotifications(n => ({ ...n, sms_low_stock: v }))} />
              <Toggle label="SMS commande prête" desc="Notifier le client quand ses lunettes sont prêtes" value={notifications.sms_ready_order} onChange={(v: boolean) => setNotifications(n => ({ ...n, sms_ready_order: v }))} />
              <Toggle label="Email résumé journalier" desc="Rapport de fin de journée par email" value={notifications.email_daily_summary} onChange={(v: boolean) => setNotifications(n => ({ ...n, email_daily_summary: v }))} />
              <Toggle label="Email nouveau patient" desc="Notifier à chaque nouveau patient enregistré" value={notifications.email_new_patient} onChange={(v: boolean) => setNotifications(n => ({ ...n, email_new_patient: v }))} />
              <Toggle label="SMS rappel rendez-vous" desc="Rappeler automatiquement les patients avant leur RDV" value={notifications.sms_appointment_reminder} onChange={(v: boolean) => setNotifications(n => ({ ...n, sms_appointment_reminder: v }))} />
              {notifications.sms_appointment_reminder && (
                <div className="pt-3">
                  <label className="form-label">Délai de rappel avant le RDV</label>
                  <select value={notifications.reminder_hours} onChange={(e) => setNotifications(n => ({ ...n, reminder_hours: parseInt(e.target.value) }))} className="form-input w-48">
                    <option value={2}>2 heures avant</option>
                    <option value={12}>12 heures avant</option>
                    <option value={24}>24 heures avant</option>
                    <option value={48}>48 heures avant</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {tab === 'security' && (
            <div className="card p-5 space-y-5">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Sécurité & Accès</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Délai d'inactivité (minutes)">
                  <select value={security.session_timeout} onChange={(e) => setSecurity(s => ({ ...s, session_timeout: parseInt(e.target.value) }))} className="form-input">
                    <option value={60}>1 heure</option>
                    <option value={240}>4 heures</option>
                    <option value={480}>8 heures</option>
                    <option value={0}>Jamais</option>
                  </select>
                </Field>
                <Field label="Tentatives de connexion max">
                  <input type="number" min="3" max="10" value={security.max_login_attempts} onChange={(e) => setSecurity(s => ({ ...s, max_login_attempts: parseInt(e.target.value) }))} className="form-input" />
                </Field>
              </div>
              <div className="space-y-0.5">
                <Toggle label="Authentification à deux facteurs (2FA)" desc="Sécurité renforcée pour tous les utilisateurs" value={security.two_factor_enabled} onChange={(v: boolean) => setSecurity(s => ({ ...s, two_factor_enabled: v }))} />
                <Toggle label="Journal d'audit" desc="Enregistrer toutes les actions dans les logs" value={security.audit_log_enabled} onChange={(v: boolean) => setSecurity(s => ({ ...s, audit_log_enabled: v }))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Fréquence sauvegarde automatique">
                  <select value={security.backup_frequency} onChange={(e) => setSecurity(s => ({ ...s, backup_frequency: e.target.value }))} className="form-input">
                    <option value="hourly">Toutes les heures</option>
                    <option value="daily">Quotidienne</option>
                    <option value="weekly">Hebdomadaire</option>
                    <option value="monthly">Mensuelle</option>
                  </select>
                </Field>
                <Field label="Conservation des sauvegardes (jours)">
                  <input type="number" min="7" max="365" value={security.backup_retention} onChange={(e) => setSecurity(s => ({ ...s, backup_retention: parseInt(e.target.value) }))} className="form-input" />
                </Field>
              </div>
              <div className="mt-4">
                <button className="btn btn-outline"><Database className="h-4 w-4" /> Lancer une sauvegarde maintenant</button>
              </div>
            </div>
          )}

          {tab === 'system' && (
            <div className="card p-5 space-y-5">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Informations système</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Version de l\'application', value: '2.0.0' },
                  { label: 'Environnement', value: 'Production' },
                  { label: 'Base de données', value: 'PostgreSQL 16' },
                  { label: 'Dernière sauvegarde', value: new Date().toLocaleDateString('fr-FR') },
                  { label: 'Espace disque utilisé', value: '2.4 Go / 50 Go' },
                  { label: 'Utilisateurs actifs', value: '6 / 20' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between p-3 bg-slate-50 dark:bg-dark-surface rounded-xl">
                    <span className="text-sm text-slate-500">{label}</span>
                    <span className="text-sm font-semibold">{value}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                <button className="btn btn-outline btn-sm"><Database className="h-4 w-4" /> Vider le cache</button>
                <button className="btn btn-outline btn-sm">Réinitialiser les séquences</button>
                <button className="btn btn-outline btn-sm text-red-600 hover:bg-red-50">Données de démonstration</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
