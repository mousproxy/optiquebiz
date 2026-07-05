import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Edit, Plus, Phone, Mail, MapPin, Calendar,
  Eye, FileText, ShoppingCart, AlertCircle, Shield, Heart,
  Printer, User, Clock
} from 'lucide-react'
import Badge from '../../components/ui/Badge'
import api from '../../utils/api'
import { formatDate, formatCurrency, genderLabels, getAppointmentStatus, getSaleStatus } from '../../utils/formatters'
import { Patient } from '../../types'

const tabs = [
  { id: 'info', label: 'Informations', icon: User },
  { id: 'consultations', label: 'Consultations', icon: Eye },
  { id: 'prescriptions', label: 'Ordonnances', icon: FileText },
  { id: 'sales', label: 'Achats', icon: ShoppingCart },
  { id: 'appointments', label: 'Rendez-vous', icon: Calendar },
]

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')

  useEffect(() => {
    api.get(`/patients/${id}`)
      .then(({ data }) => setPatient(data))
      .catch(() => setPatient(generateDemoPatient()))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner h-10 w-10" />
      </div>
    )
  }

  if (!patient) return null

  const handlePrint = () => {
    const dob = patient.date_of_birth
      ? new Date(patient.date_of_birth).toLocaleDateString('fr-CI')
      : '—'
    const today = new Date().toLocaleDateString('fr-CI')
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Fiche Patient — ${patient.first_name} ${patient.last_name}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;font-size:12px;color:#111;padding:20mm;background:#fff}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1e40af;padding-bottom:12px;margin-bottom:16px}
    .logo{font-size:20px;font-weight:700;color:#1e40af;letter-spacing:-0.5px}
    .logo span{font-size:11px;font-weight:400;color:#555;display:block;margin-top:2px}
    .patient-name{font-size:22px;font-weight:700;margin-bottom:4px}
    .badge{display:inline-block;background:#dbeafe;color:#1e40af;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:600;margin-left:8px}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
    .field dt{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
    .field dd{font-size:13px;font-weight:600}
    .section{margin-top:16px;border-top:1px solid #e5e7eb;padding-top:12px}
    .section-title{font-size:11px;font-weight:700;text-transform:uppercase;color:#1e40af;letter-spacing:.5px;margin-bottom:10px}
    .alert{background:#fef3c7;border:1px solid #fcd34d;border-radius:6px;padding:8px 12px;margin-top:12px}
    .alert dt{font-size:10px;color:#92400e;font-weight:700;text-transform:uppercase;margin-bottom:4px}
    .alert dd{font-size:12px;color:#78350f}
    .footer{margin-top:24px;border-top:1px solid #e5e7eb;padding-top:8px;font-size:10px;color:#9ca3af;text-align:center}
  </style>
</head>
<body>
<div class="header">
  <div>
    <div class="patient-name">${patient.first_name} ${patient.last_name} <span class="badge">${patient.code}</span></div>
    <div style="color:#555;font-size:12px;margin-top:4px">
      ${patient.gender === 'M' ? 'Masculin' : patient.gender === 'F' ? 'Féminin' : patient.gender || ''}
      ${patient.age ? `• ${patient.age} ans` : ''}
      ${patient.date_of_birth ? `• Né(e) le ${dob}` : ''}
    </div>
  </div>
  <div style="text-align:right">
    <div class="logo">OptiGest<span>Magasin d'Optique</span></div>
    <div style="font-size:11px;color:#555;margin-top:4px">Fiche imprimée le ${today}</div>
  </div>
</div>

<div class="section">
  <div class="section-title">Coordonnées</div>
  <div class="grid3">
    <div class="field"><dt>Téléphone</dt><dd>${patient.phone || '—'}</dd></div>
    <div class="field"><dt>Email</dt><dd>${patient.email || '—'}</dd></div>
    <div class="field"><dt>Ville</dt><dd>${patient.city || '—'}</dd></div>
    <div class="field"><dt>Profession</dt><dd>${patient.profession || '—'}</dd></div>
    <div class="field"><dt>Groupe sanguin</dt><dd>${patient.blood_group || '—'}</dd></div>
    <div class="field"><dt>Allergies</dt><dd>${patient.allergies || '—'}</dd></div>
  </div>
</div>

<div class="section">
  <div class="section-title">Assurance & Mutuelle</div>
  <div class="grid2">
    <div class="field"><dt>Assurance</dt><dd>${patient.insurance_name || '—'} ${patient.insurance_number ? '(N°' + patient.insurance_number + ')' : ''}</dd></div>
    <div class="field"><dt>Mutuelle</dt><dd>${patient.mutual_name || '—'} ${patient.mutual_rate ? '— ' + patient.mutual_rate + '%' : ''}</dd></div>
  </div>
</div>

${patient.observations ? `
<div class="alert">
  <dt>Observations médicales</dt>
  <dd>${patient.observations}</dd>
</div>` : ''}

<div class="section">
  <div class="section-title">Historique</div>
  <div class="grid3">
    <div class="field"><dt>Consultations</dt><dd>${patient._count?.consultations || 0}</dd></div>
    <div class="field"><dt>Ordonnances</dt><dd>${patient._count?.prescriptions || 0}</dd></div>
    <div class="field"><dt>Achats</dt><dd>${patient._count?.sales || 0}</dd></div>
  </div>
</div>

<div class="footer">OptiGest — Système de gestion de magasin d'optique — Côte d'Ivoire</div>
</body>
</html>`

    const win = window.open('', '_blank', 'width=800,height=600')
    if (win) {
      win.document.write(html)
      win.document.close()
      win.focus()
      setTimeout(() => { win.print(); win.close() }, 300)
    }
  }

  const InfoItem = ({ label, value, icon: Icon }: any) => (
    <div>
      <dt className="text-xs text-slate-400 dark:text-slate-500 mb-1 flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </dt>
      <dd className="text-sm text-slate-800 dark:text-slate-200 font-medium">{value || <span className="text-slate-400">—</span>}</dd>
    </div>
  )

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/patients')} className="btn btn-ghost btn-sm">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="page-title">{patient.first_name} {patient.last_name}</h1>
            <Badge color="blue" size="sm">{patient.code}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="btn btn-outline btn-sm">
            <Printer className="h-4 w-4" /> Imprimer fiche
          </button>
          <button
            onClick={() => navigate(`/pos?patientId=${id}`)}
            className="btn btn-success btn-sm"
          >
            <ShoppingCart className="h-4 w-4" /> Nouvelle vente
          </button>
          <button
            onClick={() => navigate(`/patients/${id}/edit`)}
            className="btn btn-primary btn-sm"
          >
            <Edit className="h-4 w-4" /> Modifier
          </button>
        </div>
      </div>

      {/* Profile card */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row gap-5">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-premium">
              {patient.photo_url ? (
                <img src={patient.photo_url} alt="" className="w-20 h-20 rounded-2xl object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {patient.first_name?.charAt(0)}{patient.last_name?.charAt(0)}
                </span>
              )}
            </div>
          </div>

          {/* Quick info */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <InfoItem label="Téléphone" value={patient.phone} icon={Phone} />
            <InfoItem label="Email" value={patient.email} icon={Mail} />
            <InfoItem label="Ville" value={patient.city} icon={MapPin} />
            <InfoItem label="Âge" value={patient.age ? `${patient.age} ans` : null} icon={Calendar} />
            <InfoItem label="Sexe" value={patient.gender ? genderLabels[patient.gender] : null} icon={User} />
          </div>

          {/* Counts */}
          <div className="flex gap-4 sm:gap-3 flex-wrap">
            {[
              { label: 'Consultations', value: patient._count?.consultations || 0, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' },
              { label: 'Ordonnances', value: patient._count?.prescriptions || 0, color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' },
              { label: 'Achats', value: patient._count?.sales || 0, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' },
              { label: 'RDV', value: patient._count?.appointments || 0, color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' },
            ].map((item) => (
              <div key={item.label} className={`px-3 py-2 rounded-xl text-center ${item.color}`}>
                <div className="text-xl font-bold">{item.value}</div>
                <div className="text-xs font-medium">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-dark-border">
        <div className="flex gap-0.5 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card p-5">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-primary-600" /> Informations personnelles
            </h3>
            <dl className="grid grid-cols-2 gap-4">
              <InfoItem label="Nom complet" value={`${patient.first_name} ${patient.last_name}`} />
              <InfoItem label="Code patient" value={patient.code} />
              <InfoItem label="Date de naissance" value={formatDate(patient.date_of_birth)} />
              <InfoItem label="Âge" value={patient.age ? `${patient.age} ans` : null} />
              <InfoItem label="Sexe" value={patient.gender ? genderLabels[patient.gender] : null} />
              <InfoItem label="Profession" value={patient.profession} />
              <InfoItem label="Groupe sanguin" value={patient.blood_group} />
              <InfoItem label="Allergies" value={patient.allergies} />
            </dl>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary-600" /> Assurance & Mutuelle
            </h3>
            <dl className="grid grid-cols-2 gap-4">
              <InfoItem label="Assurance" value={patient.insurance_name} />
              <InfoItem label="N° assurance" value={patient.insurance_number} />
              <InfoItem label="Mutuelle" value={patient.mutual_name} />
              <InfoItem label="N° mutuelle" value={patient.mutual_number} />
              <InfoItem label="Taux prise en charge" value={patient.mutual_rate ? `${patient.mutual_rate}%` : null} />
            </dl>
            {patient.observations && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">Observations</p>
                <p className="text-sm text-amber-800 dark:text-amber-200">{patient.observations}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'consultations' && (
        <div className="card">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-dark-border flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Historique des consultations</h3>
            <button onClick={() => navigate(`/consultations/new?patientId=${id}`)} className="btn btn-primary btn-sm">
              <Plus className="h-4 w-4" /> Nouvelle
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-dark-border">
            {(patient.consultations || []).map((c: any, i: number) => (
              <div key={i} className="p-4 hover:bg-slate-50 dark:hover:bg-dark-hover cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{formatDate(c.consultation_date)}</p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Dr. {c.users_consultations_doctor_idTousers?.first_name} {c.users_consultations_doctor_idTousers?.last_name}
                    </p>
                    {c.diagnosis && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{c.diagnosis}</p>}
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-slate-600 dark:text-slate-400">OD: {c.od_sph > 0 ? '+' : ''}{c.od_sph?.toFixed(2)}</p>
                    <p className="text-slate-600 dark:text-slate-400">OG: {c.og_sph > 0 ? '+' : ''}{c.og_sph?.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
            {(!patient.consultations || patient.consultations.length === 0) && (
              <p className="text-center text-slate-400 py-8">Aucune consultation</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="card">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-dark-border flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Historique des achats</h3>
            <button onClick={() => navigate(`/pos?patientId=${id}`)} className="btn btn-success btn-sm">
              <Plus className="h-4 w-4" /> Nouvelle vente
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Payé</th>
                  <th>Reste</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {(patient.sales || []).map((s: any, i: number) => {
                  const status = getSaleStatus(s.status)
                  return (
                    <tr key={i}>
                      <td className="font-mono text-xs text-primary-600">{s.reference}</td>
                      <td>{formatDate(s.sale_date)}</td>
                      <td className="font-semibold">{formatCurrency(s.total_amount)}</td>
                      <td className="text-green-600">{formatCurrency(s.paid_amount)}</td>
                      <td className={s.remaining_amount > 0 ? 'text-red-600 font-semibold' : 'text-slate-400'}>
                        {formatCurrency(s.remaining_amount)}
                      </td>
                      <td><Badge color={status.color as any} size="sm">{status.label}</Badge></td>
                    </tr>
                  )
                })}
                {(!patient.sales || patient.sales.length === 0) && (
                  <tr><td colSpan={6} className="text-center py-8 text-slate-400">Aucun achat</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="card">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-dark-border flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Historique des rendez-vous</h3>
            <button onClick={() => navigate(`/appointments?patientId=${id}`)} className="btn btn-primary btn-sm">
              <Plus className="h-4 w-4" /> Nouveau RDV
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-dark-border">
            {(patient.appointments || []).map((a: any, i: number) => {
              const status = getAppointmentStatus(a.status)
              return (
                <div key={i} className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-primary-700 dark:text-primary-300">
                      {new Date(a.appointment_date).getDate()}
                    </span>
                    <span className="text-xs text-primary-500">
                      {new Date(a.appointment_date).toLocaleString('fr', { month: 'short' })}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800 dark:text-slate-200">{a.reason || 'Consultation'}</p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {a.start_time?.substring(0, 5)} - {a.end_time?.substring(0, 5)}
                    </p>
                  </div>
                  <Badge color={status.color as any} size="sm">{status.label}</Badge>
                </div>
              )
            })}
            {(!patient.appointments || patient.appointments.length === 0) && (
              <p className="text-center text-slate-400 py-8">Aucun rendez-vous</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'prescriptions' && (
        <div className="card">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-dark-border flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Ordonnances</h3>
            <button onClick={() => navigate(`/prescriptions/new?patientId=${id}`)} className="btn btn-primary btn-sm">
              <Plus className="h-4 w-4" /> Nouvelle
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Date</th>
                  <th>OD SPH</th>
                  <th>OD CYL</th>
                  <th>OG SPH</th>
                  <th>OG CYL</th>
                  <th>Médecin</th>
                </tr>
              </thead>
              <tbody>
                {(patient.prescriptions || []).map((p: any, i: number) => (
                  <tr key={i} className="cursor-pointer">
                    <td className="font-mono text-xs text-primary-600">{p.reference}</td>
                    <td>{formatDate(p.prescription_date)}</td>
                    <td className="text-center">{p.od_sph > 0 ? '+' : ''}{p.od_sph?.toFixed(2)}</td>
                    <td className="text-center">{p.od_cyl > 0 ? '+' : ''}{p.od_cyl?.toFixed(2)}</td>
                    <td className="text-center">{p.og_sph > 0 ? '+' : ''}{p.og_sph?.toFixed(2)}</td>
                    <td className="text-center">{p.og_cyl > 0 ? '+' : ''}{p.og_cyl?.toFixed(2)}</td>
                    <td className="text-sm">
                      {p.users_prescriptions_doctor_idTousers?.first_name} {p.users_prescriptions_doctor_idTousers?.last_name}
                    </td>
                  </tr>
                ))}
                {(!patient.prescriptions || patient.prescriptions.length === 0) && (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-400">Aucune ordonnance</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function generateDemoPatient() {
  return {
    id: 'demo-1',
    code: 'PAT-000001',
    first_name: 'Kouassi',
    last_name: 'Ama',
    gender: 'F',
    date_of_birth: '1985-03-15',
    age: 39,
    phone: '0707070707',
    email: 'kouassi.ama@gmail.com',
    city: 'Abidjan',
    profession: 'Enseignante',
    blood_group: 'A+',
    allergies: 'Pénicilline',
    insurance_name: 'CNPS',
    mutual_name: 'MUGEF-CI',
    mutual_rate: 80,
    observations: 'Diabétique type 2 - surveiller la pression oculaire',
    _count: { consultations: 5, prescriptions: 3, sales: 4, appointments: 8 },
    consultations: [],
    prescriptions: [],
    sales: [],
    appointments: [],
    documents: [],
  }
}
