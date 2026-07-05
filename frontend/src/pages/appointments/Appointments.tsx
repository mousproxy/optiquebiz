import { useState, useEffect, useCallback, useRef } from 'react'
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Plus, Calendar, ChevronLeft, ChevronRight, List, Grid3X3, Search, X, User } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { formatDate, getAppointmentStatus } from '../../utils/formatters'

const locales = { fr }
const localizer = dateFnsLocalizer({
  format, parse,
  startOfWeek: (d: Date) => startOfWeek(d, { weekStartsOn: 1 }),
  getDay, locales,
})

const STATUS_COLORS: Record<string, string> = {
  scheduled:   '#3b82f6',
  confirmed:   '#22c55e',
  present:     '#06b6d4',
  in_progress: '#8b5cf6',
  completed:   '#64748b',
  absent:      '#ef4444',
  cancelled:   '#dc2626',
  rescheduled: '#f59e0b',
}

// ─── Composant recherche patient ─────────────────────────────────────────────

interface PatientResult {
  id: string
  code: string
  first_name: string
  last_name: string
  phone: string
  city?: string
}

interface PatientSearchProps {
  value: PatientResult | null
  onChange: (patient: PatientResult | null) => void
}

function PatientSearch({ value, onChange }: PatientSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PatientResult[]>([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Fermer le dropdown en cliquant dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    try {
      const { data } = await api.get('/patients', { params: { search: q, limit: 8 } })
      const list: PatientResult[] = (data.data || []).map((p: any) => ({
        id: p.id,
        code: p.code,
        first_name: p.firstName ?? p.first_name,
        last_name: p.lastName ?? p.last_name,
        phone: p.phone,
        city: p.city,
      }))
      setResults(list.length ? list : demoSearch(q))
    } catch {
      setResults(demoSearch(q))
    } finally {
      setSearching(false)
    }
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    setOpen(true)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(q), 300)
  }

  const handleSelect = (patient: PatientResult) => {
    onChange(patient)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  const handleClear = () => {
    onChange(null)
    setQuery('')
    setResults([])
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  // Affichage quand un patient est sélectionné
  if (value) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-300 dark:border-primary-700 rounded-lg">
        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-white">
            {value.first_name?.charAt(0)}{value.last_name?.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">
            {value.first_name} {value.last_name}
          </p>
          <p className="text-xs text-slate-500">{value.code} • {value.phone}</p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="p-1 rounded hover:bg-primary-200 dark:hover:bg-primary-800 text-slate-400 hover:text-slate-600 flex-shrink-0"
          title="Changer de patient"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => { if (query.length >= 1) setOpen(true) }}
          placeholder="Rechercher par nom, téléphone, code..."
          className="form-input pl-9 pr-8"
          autoComplete="off"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="loading-spinner h-4 w-4" />
          </div>
        )}
        {query && !searching && (
          <button
            type="button"
            onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown résultats */}
      {open && (results.length > 0 || (query.length >= 2 && !searching)) && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl shadow-2xl overflow-hidden">
          {results.length === 0 && query.length >= 2 ? (
            <div className="flex items-center gap-3 px-4 py-3 text-slate-500 text-sm">
              <User className="h-4 w-4 text-slate-400" />
              Aucun patient trouvé pour «&nbsp;{query}&nbsp;»
            </div>
          ) : (
            <ul className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-dark-border">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()} // évite blur avant click
                    onClick={() => handleSelect(p)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-xs font-bold text-white">
                        {p.first_name?.charAt(0)}{p.last_name?.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                        {p.first_name} {p.last_name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        <span className="font-mono text-primary-600 dark:text-primary-400">{p.code}</span>
                        {p.phone ? ` • ${p.phone}` : ''}
                        {p.city ? ` • ${p.city}` : ''}
                      </p>
                    </div>
                    <span className="text-xs text-primary-600 dark:text-primary-400 font-medium flex-shrink-0">
                      Sélectionner →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="px-4 py-2 bg-slate-50 dark:bg-dark-surface border-t border-slate-100 dark:border-dark-border">
            <p className="text-xs text-slate-400">
              {results.length > 0
                ? `${results.length} résultat${results.length > 1 ? 's' : ''} — Cliquez pour sélectionner`
                : 'Tapez au moins 2 caractères pour rechercher'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Recherche locale sur les données de démo
function demoSearch(q: string): PatientResult[] {
  const firstNames = ['Kouassi', 'Traoré', 'Diallo', 'Bamba', 'Koné', 'Touré', 'Coulibaly', 'Sanogo', 'Ouédraogo', 'Dembélé']
  const lastNames  = ['Ama', 'Ibrahim', 'Fatoumata', 'Seydou', 'Mariama', 'Dramane', 'Kadiatou', 'Brahima', 'Mamadou', 'Aïssatou']
  const cities = ['Abidjan', 'Bouaké', 'Yamoussoukro', 'Korhogo']
  const all: PatientResult[] = Array.from({ length: 50 }, (_, i) => ({
    id: `pat-${i}`,
    code: `PAT-${String(1001 + i).padStart(6, '0')}`,
    first_name: firstNames[i % firstNames.length],
    last_name:  lastNames[i % lastNames.length],
    phone: `07${String(70000000 + i * 137).padStart(8, '0')}`,
    city: cities[i % 4],
  }))
  const s = q.toLowerCase()
  return all
    .filter(p =>
      p.first_name.toLowerCase().includes(s) ||
      p.last_name.toLowerCase().includes(s) ||
      p.phone.includes(s) ||
      p.code.toLowerCase().includes(s)
    )
    .slice(0, 8)
}

// ─── Page principale Rendez-vous ──────────────────────────────────────────────

interface AppointmentModal { open: boolean; appointment?: any; slot?: any }

export default function Appointments() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<string>(Views.WEEK)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [modal, setModal] = useState<AppointmentModal>({ open: false })
  const [formData, setFormData] = useState<any>({})
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null)
  const [saving, setSaving] = useState(false)

  const loadAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/appointments', {
        params: { date: format(currentDate, 'yyyy-MM-dd'), view },
      })
      setAppointments(Array.isArray(data) ? data : generateDemoAppointments())
    } catch {
      setAppointments(generateDemoAppointments())
    } finally {
      setLoading(false)
    }
  }, [currentDate, view])

  useEffect(() => { loadAppointments() }, [loadAppointments])

  const openModal = (opts: AppointmentModal) => {
    setModal(opts)
    if (opts.appointment) {
      setFormData(opts.appointment)
      const p = opts.appointment.patients
      if (p) {
        setSelectedPatient({
          id: opts.appointment.patient_id || `pat-${opts.appointment.id}`,
          code: p.code || '—',
          first_name: p.first_name,
          last_name: p.last_name,
          phone: p.phone || '',
        })
      } else {
        setSelectedPatient(null)
      }
    } else {
      setFormData(opts.slot ? {
        appointment_date: format(opts.slot.start, 'yyyy-MM-dd'),
        start_time: format(opts.slot.start, 'HH:mm'),
        end_time: format(opts.slot.end, 'HH:mm'),
        duration: 30,
      } : { duration: 30 })
      setSelectedPatient(null)
    }
  }

  const handleSave = async () => {
    if (!selectedPatient) { toast.error('Veuillez sélectionner un patient'); return }
    if (!formData.appointment_date) { toast.error('Veuillez choisir une date'); return }
    if (!formData.start_time) { toast.error('Veuillez choisir une heure'); return }

    setSaving(true)
    const payload = { ...formData, patient_id: selectedPatient.id }
    try {
      if (modal.appointment?.id) {
        await api.put(`/appointments/${modal.appointment.id}`, payload)
        toast.success('Rendez-vous mis à jour')
      } else {
        await api.post('/appointments', payload)
        toast.success(`Rendez-vous créé pour ${selectedPatient.first_name} ${selectedPatient.last_name}`)
      }
      setModal({ open: false })
      loadAppointments()
    } catch {
      // En mode démo : simuler le succès
      toast.success(`Rendez-vous créé pour ${selectedPatient.first_name} ${selectedPatient.last_name} (démo)`)
      setModal({ open: false })
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status })
      toast.success('Statut mis à jour')
      loadAppointments()
    } catch {}
  }

  const calendarEvents = appointments.map((a) => ({
    id: a.id,
    title: `${a.patients?.first_name || ''} ${a.patients?.last_name || ''}`.trim() || 'Patient',
    start: new Date(`${a.appointment_date?.split('T')[0]}T${a.start_time}`),
    end: new Date(`${a.appointment_date?.split('T')[0]}T${a.end_time}`),
    resource: a,
  }))

  const eventStyleGetter = (event: any) => ({
    style: {
      backgroundColor: STATUS_COLORS[event.resource?.status] || '#2563eb',
      border: 'none',
      borderRadius: '6px',
      color: '#fff',
      fontSize: '12px',
      fontWeight: '500',
    },
  })

  const set = (k: string, v: any) => setFormData((f: any) => ({ ...f, [k]: v }))

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rendez-vous</h1>
          <p className="text-slate-500 text-sm mt-0.5">Calendrier de l'équipe</p>
        </div>
        <button onClick={() => openModal({ open: true })} className="btn btn-primary">
          <Plus className="h-4 w-4" /> Nouveau RDV
        </button>
      </div>

      {/* Barre de navigation calendrier */}
      <div className="card p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentDate(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })}
            className="btn btn-ghost btn-sm p-1.5"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="btn btn-outline btn-sm">
            Aujourd'hui
          </button>
          <button
            onClick={() => setCurrentDate(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })}
            className="btn btn-ghost btn-sm p-1.5"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <h2 className="font-semibold text-slate-800 dark:text-slate-200 flex-1">
          {format(currentDate, 'MMMM yyyy', { locale: fr })}
        </h2>

        <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-dark-border">
          {[
            { key: Views.DAY,    label: 'Jour',     icon: Calendar  },
            { key: Views.WEEK,   label: 'Semaine',  icon: Grid3X3   },
            { key: Views.MONTH,  label: 'Mois',     icon: Grid3X3   },
            { key: Views.AGENDA, label: 'Agenda',   icon: List      },
          ].map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                view === v.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-dark-card text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-hover'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(STATUS_COLORS).slice(0, 5).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-slate-500">{getAppointmentStatus(status).label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendrier */}
      <div className="card p-4">
        <BigCalendar
          localizer={localizer}
          events={calendarEvents}
          view={view as any}
          onView={(v) => setView(v)}
          date={currentDate}
          onNavigate={setCurrentDate}
          onSelectSlot={(slot) => openModal({ open: true, slot })}
          onSelectEvent={(event) => openModal({ open: true, appointment: event.resource })}
          selectable
          style={{ height: 650 }}
          eventPropGetter={eventStyleGetter}
          culture="fr"
          messages={{
            next: 'Suivant', previous: 'Précédent', today: "Aujourd'hui",
            month: 'Mois', week: 'Semaine', day: 'Jour', agenda: 'Agenda',
            date: 'Date', time: 'Heure', event: 'Événement',
            noEventsInRange: 'Aucun rendez-vous sur cette période',
          }}
        />
      </div>

      {/* Modal création / modification RDV */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.appointment ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
        size="lg"
        footer={
          <div className="flex gap-2 justify-end w-full">
            {modal.appointment && (
              <div className="flex flex-wrap gap-1.5 mr-auto">
                {['confirmed', 'present', 'completed', 'absent', 'cancelled'].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(modal.appointment.id, s)}
                    className="btn btn-outline btn-sm text-xs"
                  >
                    {getAppointmentStatus(s).label}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setModal({ open: false })} className="btn btn-outline">Annuler</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              {saving && <div className="loading-spinner h-4 w-4" />}
              {modal.appointment ? 'Mettre à jour' : 'Créer le RDV'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">

          {/* Recherche patient */}
          <div>
            <label className="form-label">
              Patient <span className="text-red-500">*</span>
            </label>
            <PatientSearch
              value={selectedPatient}
              onChange={setSelectedPatient}
            />
            {!selectedPatient && (
              <p className="text-xs text-slate-400 mt-1.5">
                Tapez le nom, le prénom, le numéro de téléphone ou le code patient pour rechercher
              </p>
            )}
          </div>

          {/* Date, heure, durée */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="form-label">Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={formData.appointment_date?.split('T')[0] || ''}
                onChange={(e) => set('appointment_date', e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Heure début <span className="text-red-500">*</span></label>
              <input
                type="time"
                value={formData.start_time?.substring(0, 5) || ''}
                onChange={(e) => set('start_time', e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Durée</label>
              <select
                value={formData.duration || 30}
                onChange={(e) => set('duration', parseInt(e.target.value))}
                className="form-input"
              >
                {[15, 20, 30, 45, 60, 90, 120].map((d) => (
                  <option key={d} value={d}>{d} min</option>
                ))}
              </select>
            </div>
          </div>

          {/* Motif et salle */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Motif</label>
              <select
                value={formData.reason || ''}
                onChange={(e) => set('reason', e.target.value)}
                className="form-input"
              >
                <option value="">Sélectionner...</option>
                <option>Consultation de vue</option>
                <option>Contrôle annuel</option>
                <option>Renouvellement ordonnance</option>
                <option>Montage lunettes</option>
                <option>Adaptation lentilles</option>
                <option>Urgence oculaire</option>
                <option>Fond d'œil</option>
              </select>
            </div>
            <div>
              <label className="form-label">Médecin / Opticien</label>
              <select
                value={formData.doctor_name || ''}
                onChange={(e) => set('doctor_name', e.target.value)}
                className="form-input"
              >
                <option value="">Sélectionner...</option>
                <option>Dr. Koffi Emmanuel</option>
                <option>Dr. Traoré Ibrahim</option>
                <option>Opticien Coulibaly</option>
              </select>
            </div>
            <div>
              <label className="form-label">Salle</label>
              <select
                value={formData.room || ''}
                onChange={(e) => set('room', e.target.value)}
                className="form-input"
              >
                <option value="">—</option>
                <option>Salle 1</option>
                <option>Salle 2</option>
                <option>Salle Réfraction</option>
              </select>
            </div>
            <div>
              <label className="form-label">Type de RDV</label>
              <select
                value={formData.appointment_type || ''}
                onChange={(e) => set('appointment_type', e.target.value)}
                className="form-input"
              >
                <option value="">—</option>
                <option value="first">Première consultation</option>
                <option value="followup">Suivi</option>
                <option value="urgent">Urgence</option>
                <option value="delivery">Livraison lunettes</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="form-label">Notes</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => set('notes', e.target.value)}
              className="form-input"
              rows={2}
              placeholder="Informations complémentaires..."
            />
          </div>

        </div>
      </Modal>
    </div>
  )
}

function generateDemoAppointments() {
  const today = new Date()
  const statuses = ['scheduled', 'confirmed', 'present', 'completed', 'absent']
  const reasons = ['Consultation de vue', 'Contrôle annuel', 'Renouvellement ordonnance', 'Montage lunettes']
  const names = [
    { first_name: 'Kouassi', last_name: 'Ama' },
    { first_name: 'Traoré', last_name: 'Ibrahim' },
    { first_name: 'Diallo', last_name: 'Fatoumata' },
    { first_name: 'Bamba', last_name: 'Seydou' },
    { first_name: 'Koné', last_name: 'Mariama' },
    { first_name: 'Touré', last_name: 'Dramane' },
    { first_name: 'Coulibaly', last_name: 'Kadiatou' },
    { first_name: 'Sanogo', last_name: 'Brahima' },
  ]

  return Array.from({ length: 20 }, (_, i) => ({
    id: `appt-${i}`,
    appointment_date: format(addDays(today, i % 7 - 3), "yyyy-MM-dd'T'HH:mm:ss"),
    start_time: `${String(8 + (i % 10)).padStart(2, '0')}:00:00`,
    end_time:   `${String(8 + (i % 10)).padStart(2, '0')}:30:00`,
    status: statuses[i % statuses.length],
    reason: reasons[i % reasons.length],
    patients: names[i % names.length],
  }))
}
