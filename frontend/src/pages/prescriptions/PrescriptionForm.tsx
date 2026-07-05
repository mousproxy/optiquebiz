import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save, Printer, ShoppingCart } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

export default function PrescriptionForm() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    patient_id: params.get('patientId') || '',
    prescription_date: new Date().toISOString().split('T')[0],
    od_sph: '', od_cyl: '', od_axe: '', od_add: '',
    og_sph: '', og_cyl: '', og_axe: '', og_add: '',
    pupillary_distance_od: '', pupillary_distance_og: '',
    pupillary_distance_total: '', near_pupillary_distance: '',
    height_od: '', height_og: '',
    is_progressive: false, distance_vision: true, near_vision: false,
    comments: '', validity_months: 12,
  })

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.patient_id) { toast.error('Patient requis'); return }
    setSaving(true)
    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v === '' ? null : (typeof v === 'string' && !isNaN(Number(v)) ? parseFloat(v) : v)])
      )
      const res = await api.post('/prescriptions', { ...payload, patient_id: form.patient_id })
      toast.success('Ordonnance créée')
      navigate(`/prescriptions/${res.data.id}`)
    } catch {} finally { setSaving(false) }
  }

  const Row = ({ eye, prefix }: { eye: string; prefix: 'od' | 'og' }) => (
    <tr>
      <td className="px-3 py-2">
        <span className={`font-bold px-2 py-1 rounded-lg text-sm ${eye === 'OD' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 'bg-green-50 text-green-600 dark:bg-green-900/20'}`}>{eye}</span>
      </td>
      {(['sph', 'cyl', 'axe', 'add'] as const).map((f) => (
        <td key={f} className="px-2 py-2">
          <input
            type="number"
            step={f === 'axe' ? '1' : '0.25'}
            value={(form as any)[`${prefix}_${f}`]}
            onChange={(e) => set(`${prefix}_${f}`, e.target.value)}
            className="form-input text-center font-mono w-24"
            placeholder={f === 'axe' ? '0' : '0.00'}
          />
        </td>
      ))}
    </tr>
  )

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm"><ArrowLeft className="h-4 w-4" /></button>
          <h1 className="page-title">Nouvelle ordonnance</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(-1)} className="btn btn-outline">Annuler</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? <div className="loading-spinner h-4 w-4" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </button>
        </div>
      </div>

      <div className="card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Patient <span className="text-red-500">*</span></label>
            <input value={form.patient_id} onChange={(e) => set('patient_id', e.target.value)} className="form-input" placeholder="ID patient..." />
          </div>
          <div>
            <label className="form-label">Date</label>
            <input type="date" value={form.prescription_date} onChange={(e) => set('prescription_date', e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Validité</label>
            <select value={form.validity_months} onChange={(e) => set('validity_months', parseInt(e.target.value))} className="form-input">
              <option value={6}>6 mois</option>
              <option value={12}>12 mois</option>
              <option value={18}>18 mois</option>
              <option value={24}>24 mois</option>
            </select>
          </div>
        </div>
      </div>

      {/* Prescription table */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Correction optique</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-center">
                <th className="px-3 py-2 text-left text-sm text-slate-500">Œil</th>
                <th className="px-3 py-2 text-sm text-slate-500">SPH (D)</th>
                <th className="px-3 py-2 text-sm text-slate-500">CYL (D)</th>
                <th className="px-3 py-2 text-sm text-slate-500">AXE (°)</th>
                <th className="px-3 py-2 text-sm text-slate-500">ADD (D)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              <Row eye="OD" prefix="od" />
              <Row eye="OG" prefix="og" />
            </tbody>
          </table>
        </div>
      </div>

      {/* Mesures */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Mesures</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'EP OD (mm)', key: 'pupillary_distance_od' },
            { label: 'EP OG (mm)', key: 'pupillary_distance_og' },
            { label: 'EP Total (mm)', key: 'pupillary_distance_total' },
            { label: 'EP Près (mm)', key: 'near_pupillary_distance' },
            { label: 'Hauteur OD', key: 'height_od' },
            { label: 'Hauteur OG', key: 'height_og' },
          ].map((f) => (
            <div key={f.key}>
              <label className="form-label text-xs">{f.label}</label>
              <input type="number" step="0.5" value={(form as any)[f.key]} onChange={(e) => set(f.key, e.target.value)} className="form-input text-center" placeholder="0.0" />
            </div>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Options</h3>
        <div className="flex flex-wrap gap-4">
          {[
            { key: 'distance_vision', label: 'Vision de loin' },
            { key: 'near_vision', label: 'Vision de près' },
            { key: 'is_progressive', label: 'Verres progressifs' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={(form as any)[key]} onChange={(e) => set(key, e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-primary-600" />
              <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
            </label>
          ))}
        </div>
        <div className="mt-4">
          <label className="form-label">Commentaires / Recommandations</label>
          <textarea value={form.comments} onChange={(e) => set('comments', e.target.value)} className="form-input" rows={3} placeholder="Instructions pour le monteur, notes particulières..." />
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={() => navigate(-1)} className="btn btn-outline">Annuler</button>
        <div className="flex gap-2">
          <button className="btn btn-outline"><Printer className="h-4 w-4" /> Imprimer</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-lg">
            {saving ? <div className="loading-spinner h-4 w-4" /> : <Save className="h-4 w-4" />}
            Créer l'ordonnance
          </button>
        </div>
      </div>
    </div>
  )
}
