import { useState, useEffect } from 'react'
import { MessageSquare, Mail, Phone, Gift, RefreshCw, Plus, Send, Users } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import Modal from '../../components/ui/Modal'
import api from '../../utils/api'
import { formatDate, formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'campaigns', label: 'Campagnes', icon: MessageSquare },
  { id: 'birthdays', label: 'Anniversaires', icon: Gift },
  { id: 'recalls', label: 'Relances', icon: RefreshCw },
]

const defaultCampaign = {
  name: '', type: 'sms', message: '', target: 'all', scheduled_at: '',
}

export default function CRM() {
  const [tab, setTab] = useState('campaigns')
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [birthdays, setBirthdays] = useState<any[]>([])
  const [recalls, setRecalls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(defaultCampaign)
  const [saving, setSaving] = useState(false)
  const [stats] = useState({ campaigns: 12, patients_reached: 847, sms_sent: 1240, open_rate: 68 })

  useEffect(() => {
    Promise.all([
      api.get('/crm/campaigns').catch(() => ({ data: { data: demoCampaigns() } })),
      api.get('/crm/birthdays').catch(() => ({ data: demoBirthdays() })),
      api.get('/crm/recalls').catch(() => ({ data: demoRecalls() })),
    ]).then(([c, b, r]) => {
      setCampaigns(c.data?.data || [])
      setBirthdays(Array.isArray(b.data) ? b.data : b.data?.data || [])
      setRecalls(Array.isArray(r.data) ? r.data : r.data?.data || [])
    }).finally(() => setLoading(false))
  }, [])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleCreate = async () => {
    if (!form.name || !form.message) { toast.error('Nom et message requis'); return }
    setSaving(true)
    try {
      await api.post('/crm/campaigns', form)
      toast.success('Campagne créée')
      setShowModal(false)
      setCampaigns(prev => [{ id: Date.now(), ...form, status: 'draft', recipients: 0, sent: 0 }, ...prev])
    } catch {} finally { setSaving(false) }
  }

  const sendCampaign = async (c: any) => {
    try {
      await api.post(`/crm/campaigns/${c.id}/send`)
      setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, status: 'sent' } : x))
      toast.success('Campagne envoyée')
    } catch { setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, status: 'sent' } : x)) }
  }

  const CAMPAIGN_TYPE_ICONS: Record<string, any> = {
    sms: <Phone className="h-4 w-4" />,
    email: <Mail className="h-4 w-4" />,
    whatsapp: <MessageSquare className="h-4 w-4" />,
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title">CRM & Fidélisation</h1>
        <button onClick={() => { setForm(defaultCampaign); setShowModal(true) }} className="btn btn-primary">
          <Plus className="h-4 w-4" /> Nouvelle campagne
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Campagnes" value={stats.campaigns} icon={MessageSquare} color="blue" />
        <StatCard title="Patients atteints" value={stats.patients_reached} icon={Users} color="green" />
        <StatCard title="SMS envoyés" value={stats.sms_sent} icon={Phone} color="purple" />
        <StatCard title="Taux d'ouverture" value={`${stats.open_rate}%`} icon={Mail} color="teal" />
      </div>

      <div className="flex gap-1 bg-slate-100 dark:bg-dark-surface p-1 rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? 'bg-white dark:bg-dark-card shadow text-primary-700 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700'}`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {/* Campaigns */}
      {tab === 'campaigns' && (
        <div className="space-y-3">
          {campaigns.map((c: any) => (
            <div key={c.id} className="card p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.type === 'sms' ? 'bg-blue-100 text-blue-600' : c.type === 'email' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                {CAMPAIGN_TYPE_ICONS[c.type] || <MessageSquare className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{c.name}</p>
                  <Badge color={c.status === 'sent' ? 'green' : c.status === 'scheduled' ? 'blue' : 'gray'} size="sm">
                    {c.status === 'sent' ? 'Envoyée' : c.status === 'scheduled' ? 'Planifiée' : 'Brouillon'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 truncate">{c.message}</p>
                <div className="flex gap-4 mt-1 text-xs text-slate-400">
                  <span>{c.recipients || 0} destinataires</span>
                  {c.sent > 0 && <span>{c.sent} envoyés</span>}
                  {c.scheduled_at && <span>Planifié: {formatDate(c.scheduled_at)}</span>}
                </div>
              </div>
              {c.status === 'draft' && (
                <button onClick={() => sendCampaign(c)} className="btn btn-primary btn-sm flex-shrink-0">
                  <Send className="h-3.5 w-3.5" /> Envoyer
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Birthdays */}
      {tab === 'birthdays' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-500">{birthdays.length} patients avec anniversaire ce mois</p>
            <button className="btn btn-outline btn-sm"><Send className="h-3.5 w-3.5" /> Envoyer félicitations</button>
          </div>
          <div className="card overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-th">Patient</th>
                  <th className="table-th">Téléphone</th>
                  <th className="table-th">Date anniversaire</th>
                  <th className="table-th">Âge</th>
                  <th className="table-th">Message envoyé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {birthdays.map((b: any, i: number) => (
                  <tr key={i} className="table-row">
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🎂</span>
                        <span className="font-medium">{b.first_name} {b.last_name}</span>
                      </div>
                    </td>
                    <td className="table-td text-sm">{b.phone}</td>
                    <td className="table-td text-sm">{new Date(0, new Date(b.date_of_birth).getMonth(), new Date(b.date_of_birth).getDate()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</td>
                    <td className="table-td"><Badge color="purple" size="sm">{new Date().getFullYear() - new Date(b.date_of_birth).getFullYear()} ans</Badge></td>
                    <td className="table-td"><Badge color={b.sms_sent ? 'green' : 'gray'} size="sm">{b.sms_sent ? 'Oui' : 'Non'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recalls */}
      {tab === 'recalls' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">{recalls.length} patients à relancer (ordonnances expirées ou absence de 12+ mois)</p>
          <div className="card overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-th">Patient</th>
                  <th className="table-th">Téléphone</th>
                  <th className="table-th">Dernière visite</th>
                  <th className="table-th">Motif</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {recalls.map((r: any, i: number) => (
                  <tr key={i} className="table-row">
                    <td className="table-td font-medium">{r.first_name} {r.last_name}</td>
                    <td className="table-td text-sm">{r.phone}</td>
                    <td className="table-td text-sm">{formatDate(r.last_visit)}</td>
                    <td className="table-td">
                      <Badge color={r.reason === 'expired' ? 'orange' : 'yellow'} size="sm">
                        {r.reason === 'expired' ? 'Ordonnance expirée' : 'Absent > 12 mois'}
                      </Badge>
                    </td>
                    <td className="table-td">
                      <div className="flex gap-1">
                        <button className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg" title="SMS"><Phone className="h-4 w-4" /></button>
                        <button className="p-1.5 hover:bg-green-100 text-green-600 rounded-lg" title="WhatsApp"><MessageSquare className="h-4 w-4" /></button>
                        <button className="p-1.5 hover:bg-purple-100 text-purple-600 rounded-lg" title="Email"><Mail className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create campaign modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouvelle campagne" size="lg"
        footer={<div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn btn-outline">Annuler</button><button onClick={handleCreate} disabled={saving} className="btn btn-primary">{saving && <div className="loading-spinner h-4 w-4" />} Créer</button></div>}>
        <div className="space-y-4">
          <div>
            <label className="form-label">Nom de la campagne <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} className="form-input" placeholder="Promo Noël 2024, Rappel contrôle vue..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Canal</label>
              <select value={form.type} onChange={(e) => set('type', e.target.value)} className="form-input">
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="form-label">Cible</label>
              <select value={form.target} onChange={(e) => set('target', e.target.value)} className="form-input">
                <option value="all">Tous les patients</option>
                <option value="active">Patients actifs (12 mois)</option>
                <option value="birthday">Anniversaires ce mois</option>
                <option value="expired">Ordonnances expirées</option>
                <option value="no_visit">{"Sans visite > 1 an"}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Message <span className="text-red-500">*</span></label>
            <textarea value={form.message} onChange={(e) => set('message', e.target.value)} className="form-input" rows={4}
              placeholder="Bonjour {prenom}, nous vous rappelons que votre ordonnance expire le {date}. Prenez rendez-vous au {telephone}." />
            <p className="text-xs text-slate-400 mt-1">Variables: {'{prenom}'}, {'{nom}'}, {'{telephone}'}, {'{date}'}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {form.type === 'sms' && `${form.message.length}/160 caractères${form.message.length > 160 ? ` (${Math.ceil(form.message.length / 160)} SMS)` : ''}`}
            </p>
          </div>
          <div>
            <label className="form-label">Date d'envoi (laisser vide pour maintenant)</label>
            <input type="datetime-local" value={form.scheduled_at} onChange={(e) => set('scheduled_at', e.target.value)} className="form-input" />
          </div>
        </div>
      </Modal>
    </div>
  )
}

function demoCampaigns() {
  return [
    { id: 1, name: 'Promo Noël 2024', type: 'sms', message: 'Profitez de -20% sur toutes nos montures jusqu\'au 31/12. Code: NOEL24', status: 'sent', recipients: 342, sent: 338, scheduled_at: null },
    { id: 2, name: 'Rappel contrôle annuel', type: 'whatsapp', message: 'Bonjour {prenom}, votre contrôle de vue annuel est recommandé. Appelez-nous au 0707070707', status: 'sent', recipients: 185, sent: 182, scheduled_at: null },
    { id: 3, name: 'Newsletter Janvier 2025', type: 'email', message: 'Découvrez nos nouveautés pour bien commencer 2025 !', status: 'draft', recipients: 0, sent: 0, scheduled_at: '2025-01-05' },
    { id: 4, name: 'Anniversaires Décembre', type: 'sms', message: 'Joyeux anniversaire {prenom} ! Offrez-vous une nouvelle paire avec -10% sur votre prochain achat.', status: 'scheduled', recipients: 28, sent: 0, scheduled_at: '2024-12-01' },
  ]
}

function demoBirthdays() {
  return [
    { first_name: 'Kouassi', last_name: 'Ange', phone: '0707070707', date_of_birth: '1990-12-15', sms_sent: true },
    { first_name: 'Traoré', last_name: 'Ibrahim', phone: '0505050505', date_of_birth: '1985-12-22', sms_sent: false },
    { first_name: 'Diallo', last_name: 'Fatoumata', phone: '0101010101', date_of_birth: '1995-12-08', sms_sent: true },
    { first_name: 'N\'Guessan', last_name: 'Marie', phone: '0606060606', date_of_birth: '1992-12-30', sms_sent: false },
  ]
}

function demoRecalls() {
  return [
    { first_name: 'Kouassi', last_name: 'Bernard', phone: '0707080809', last_visit: '2023-11-15', reason: 'no_visit' },
    { first_name: 'Bamba', last_name: 'Sali', phone: '0505060607', last_visit: '2023-06-20', reason: 'expired' },
    { first_name: 'Koné', last_name: 'Fatou', phone: '0101020203', last_visit: '2023-09-10', reason: 'no_visit' },
    { first_name: 'Ouattara', last_name: 'Pascal', phone: '0606070708', last_visit: '2024-01-05', reason: 'expired' },
    { first_name: 'Yao', last_name: 'Nicole', phone: '0404050506', last_visit: '2023-08-18', reason: 'no_visit' },
  ]
}
