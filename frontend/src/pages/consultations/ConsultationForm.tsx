import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save, Eye, Printer } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const OptField = ({ label, name, value, onChange }: any) => (
  <div>
    <label className="form-label text-xs">{label}</label>
    <input
      type="number"
      step="0.25"
      value={value || ''}
      onChange={(e) => onChange(name, e.target.value ? parseFloat(e.target.value) : null)}
      className="form-input text-center font-mono"
      placeholder="0.00"
    />
  </div>
)

export default function ConsultationForm() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    patient_id: params.get('patientId') || '',
    appointment_id: params.get('appointmentId') || '',
    consultation_date: new Date().toISOString().split('T')[0],
    va_od_sc: '', va_od_cc: '', va_og_sc: '', va_og_cc: '',
    od_sph: null, od_cyl: null, od_axe: null, od_add: null, od_prism: null,
    og_sph: null, og_cyl: null, og_axe: null, og_add: null, og_prism: null,
    np_od_sph: null, np_og_sph: null,
    iop_od: null, iop_og: null,
    fundus_od: '', fundus_og: '',
    diagnosis: '', treatment: '', comments: '',
    next_appointment: '',
  })

  const setField = (name: string, value: any) => setForm(f => ({ ...f, [name]: value }))

  const handleSave = async () => {
    if (!form.patient_id) { toast.error('Veuillez sélectionner un patient'); return }
    setSaving(true)
    try {
      const res = await api.post('/consultations', form)
      toast.success('Consultation enregistrée')
      navigate(`/consultations/${res.data.id}`)
    } catch {} finally { setSaving(false) }
  }

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="col-span-full border-b border-slate-200 dark:border-dark-border pb-2 mb-2">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
    </div>
  )

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm"><ArrowLeft className="h-4 w-4" /></button>
          <h1 className="page-title">Nouvelle consultation</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(-1)} className="btn btn-outline">Annuler</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? <div className="loading-spinner h-4 w-4" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </button>
        </div>
      </div>

      {/* Patient & Date */}
      <div className="card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Patient <span className="text-red-500">*</span></label>
            <input value={form.patient_id} onChange={(e) => setField('patient_id', e.target.value)} className="form-input" placeholder="ID ou nom du patient..." />
          </div>
          <div>
            <label className="form-label">Date de consultation</label>
            <input type="date" value={form.consultation_date} onChange={(e) => setField('consultation_date', e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Prochain RDV</label>
            <input type="date" value={form.next_appointment} onChange={(e) => setField('next_appointment', e.target.value)} className="form-input" />
          </div>
        </div>
      </div>

      {/* Acuité visuelle */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary-600" /> Acuité visuelle
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="form-label">VA OD (sans correction)</label>
            <input value={form.va_od_sc} onChange={(e) => setField('va_od_sc', e.target.value)} className="form-input text-center" placeholder="10/10" />
          </div>
          <div>
            <label className="form-label">VA OD (avec correction)</label>
            <input value={form.va_od_cc} onChange={(e) => setField('va_od_cc', e.target.value)} className="form-input text-center" placeholder="10/10" />
          </div>
          <div>
            <label className="form-label">VA OG (sans correction)</label>
            <input value={form.va_og_sc} onChange={(e) => setField('va_og_sc', e.target.value)} className="form-input text-center" placeholder="10/10" />
          </div>
          <div>
            <label className="form-label">VA OG (avec correction)</label>
            <input value={form.va_og_cc} onChange={(e) => setField('va_og_cc', e.target.value)} className="form-input text-center" placeholder="10/10" />
          </div>
        </div>
      </div>

      {/* Réfraction */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Réfraction</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-center">
                <th className="text-sm font-semibold text-slate-500 px-3 py-2 text-left">Œil</th>
                <th className="text-sm font-semibold text-slate-500 px-3 py-2">SPH</th>
                <th className="text-sm font-semibold text-slate-500 px-3 py-2">CYL</th>
                <th className="text-sm font-semibold text-slate-500 px-3 py-2">AXE (°)</th>
                <th className="text-sm font-semibold text-slate-500 px-3 py-2">ADD</th>
                <th className="text-sm font-semibold text-slate-500 px-3 py-2">PRISME</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              <tr>
                <td className="px-3 py-2">
                  <span className="font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg text-sm">OD</span>
                </td>
                {['od_sph', 'od_cyl', 'od_axe', 'od_add', 'od_prism'].map((f) => (
                  <td key={f} className="px-2 py-2">
                    <input
                      type="number"
                      step={f === 'od_axe' ? '1' : '0.25'}
                      value={(form as any)[f] || ''}
                      onChange={(e) => setField(f, e.target.value ? parseFloat(e.target.value) : null)}
                      className="form-input text-center font-mono w-24"
                      placeholder="0.00"
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2">
                  <span className="font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg text-sm">OG</span>
                </td>
                {['og_sph', 'og_cyl', 'og_axe', 'og_add', 'og_prism'].map((f) => (
                  <td key={f} className="px-2 py-2">
                    <input
                      type="number"
                      step={f === 'og_axe' ? '1' : '0.25'}
                      value={(form as any)[f] || ''}
                      onChange={(e) => setField(f, e.target.value ? parseFloat(e.target.value) : null)}
                      className="form-input text-center font-mono w-24"
                      placeholder="0.00"
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Pression oculaire & Fond d'œil */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Pression oculaire (mmHg)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">OD</label>
              <input type="number" step="0.5" value={form.iop_od || ''} onChange={(e) => setField('iop_od', parseFloat(e.target.value))} className="form-input" placeholder="12.0" />
            </div>
            <div>
              <label className="form-label">OG</label>
              <input type="number" step="0.5" value={form.iop_og || ''} onChange={(e) => setField('iop_og', parseFloat(e.target.value))} className="form-input" placeholder="12.0" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Fond d'œil</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">OD</label>
              <textarea value={form.fundus_od} onChange={(e) => setField('fundus_od', e.target.value)} className="form-input" rows={2} placeholder="Normal..." />
            </div>
            <div>
              <label className="form-label">OG</label>
              <textarea value={form.fundus_og} onChange={(e) => setField('fundus_og', e.target.value)} className="form-input" rows={2} placeholder="Normal..." />
            </div>
          </div>
        </div>
      </div>

      {/* Diagnostic */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Diagnostic & Traitement</h3>
        <div className="space-y-4">
          <div>
            <label className="form-label">Diagnostic</label>
            <textarea value={form.diagnosis} onChange={(e) => setField('diagnosis', e.target.value)} className="form-input" rows={3} placeholder="Myopie, Hypermétropie, Astigmatisme..." />
          </div>
          <div>
            <label className="form-label">Traitement / Prescription</label>
            <textarea value={form.treatment} onChange={(e) => setField('treatment', e.target.value)} className="form-input" rows={3} placeholder="Recommandations thérapeutiques..." />
          </div>
          <div>
            <label className="form-label">Commentaires</label>
            <textarea value={form.comments} onChange={(e) => setField('comments', e.target.value)} className="form-input" rows={2} placeholder="Notes complémentaires..." />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={() => navigate(-1)} className="btn btn-outline">Annuler</button>
        <div className="flex gap-2">
          <button className="btn btn-outline">
            <Printer className="h-4 w-4" /> Imprimer
          </button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-lg">
            {saving ? <div className="loading-spinner h-4 w-4" /> : <Save className="h-4 w-4" />}
            Enregistrer la consultation
          </button>
        </div>
      </div>
    </div>
  )
}
