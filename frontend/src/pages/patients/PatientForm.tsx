import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Save, User, Phone, Shield, Heart } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/auth.store'

interface PatientFormData {
  firstName: string
  lastName: string
  gender: string
  dateOfBirth: string
  profession: string
  address: string
  city: string
  phone: string
  phone2: string
  email: string
  bloodGroup: string
  allergies: string
  insuranceName: string
  insuranceNumber: string
  mutualName: string
  mutualNumber: string
  mutualRate: number
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelation: string
  observations: string
}

// Données démo pour les patients existants (utilisées en mode démo en mode édition)
const DEMO_PATIENTS: Record<string, Partial<PatientFormData>> = {
  'pat-0': { firstName: 'Kouassi', lastName: 'Ama', gender: 'F', dateOfBirth: '1985-03-15', phone: '0707070707', city: 'Abidjan', profession: 'Enseignante', bloodGroup: 'A+', allergies: 'Pénicilline', insuranceName: 'CNPS', mutualName: 'MUGEF-CI', mutualRate: 80 },
  'pat-1': { firstName: 'Traoré', lastName: 'Ibrahim', gender: 'M', dateOfBirth: '1978-07-22', phone: '0505050505', city: 'Bouaké', profession: 'Commerçant', bloodGroup: 'O+' },
  'pat-2': { firstName: 'Diallo', lastName: 'Fatoumata', gender: 'F', dateOfBirth: '1990-11-08', phone: '0101010101', city: 'Yamoussoukro', profession: 'Fonctionnaire' },
}

export default function PatientForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  const isDemoMode = useAuthStore((s) => s.token === 'demo-token')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PatientFormData>({
    defaultValues: { city: 'Abidjan' }
  })

  useEffect(() => {
    if (!isEditing) return
    setLoading(true)

    if (isDemoMode) {
      // En mode démo, charger les données de démo pour ce patient
      const demoData = DEMO_PATIENTS[id] || {
        firstName: 'Patient', lastName: 'Demo',
        gender: 'M', phone: '0700000000', city: 'Abidjan',
      }
      reset(demoData as PatientFormData)
      setLoading(false)
      return
    }

    api.get(`/patients/${id}`)
      .then(({ data }) => {
        reset({
          firstName: data.first_name,
          lastName: data.last_name,
          gender: data.gender,
          dateOfBirth: data.date_of_birth,
          profession: data.profession,
          address: data.address,
          city: data.city,
          phone: data.phone,
          phone2: data.phone2,
          email: data.email,
          bloodGroup: data.blood_group,
          allergies: data.allergies,
          insuranceName: data.insurance_name,
          insuranceNumber: data.insurance_number,
          mutualName: data.mutual_name,
          mutualNumber: data.mutual_number,
          mutualRate: data.mutual_rate,
          emergencyContactName: data.emergency_contact_name,
          emergencyContactPhone: data.emergency_contact_phone,
          emergencyContactRelation: data.emergency_contact_relation,
          observations: data.observations,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id, isEditing, isDemoMode, reset])

  const onSubmit = async (data: PatientFormData) => {
    if (!data.lastName?.trim()) { toast.error('Le nom est requis'); return }
    if (!data.phone?.trim()) { toast.error('Le téléphone est requis'); return }

    setSaving(true)

    // Mode démo — simuler la sauvegarde
    if (isDemoMode) {
      await new Promise(r => setTimeout(r, 700))
      toast.success(isEditing ? `Patient ${data.firstName} ${data.lastName} mis à jour` : `Patient ${data.firstName} ${data.lastName} créé avec succès`)
      navigate(isEditing ? `/patients/${id}` : '/patients/pat-0')
      setSaving(false)
      return
    }

    try {
      const payload = {
        first_name: data.firstName,
        last_name: data.lastName,
        gender: data.gender || null,
        date_of_birth: data.dateOfBirth || null,
        profession: data.profession,
        address: data.address,
        city: data.city || 'Abidjan',
        phone: data.phone,
        phone2: data.phone2,
        email: data.email,
        blood_group: data.bloodGroup,
        allergies: data.allergies,
        insurance_name: data.insuranceName,
        insurance_number: data.insuranceNumber,
        mutual_name: data.mutualName,
        mutual_number: data.mutualNumber,
        mutual_rate: data.mutualRate,
        emergency_contact_name: data.emergencyContactName,
        emergency_contact_phone: data.emergencyContactPhone,
        emergency_contact_relation: data.emergencyContactRelation,
        observations: data.observations,
      }

      if (isEditing) {
        await api.put(`/patients/${id}`, payload)
        toast.success('Patient mis à jour avec succès')
        navigate(`/patients/${id}`)
      } else {
        const res = await api.post('/patients', payload)
        toast.success('Patient créé avec succès')
        navigate(`/patients/${res.data.id}`)
      }
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner h-10 w-10" />
      </div>
    )
  }

  const Section = ({ title, icon: Icon, children }: any) => (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-dark-border">
        <Icon className="h-4 w-4 text-primary-600" />
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{title}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
    </div>
  )

  const Field = ({ label, children, required, error, className }: any) => (
    <div className={className}>
      <label className="form-label">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="form-error">{error}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-5xl">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="page-title">{isEditing ? 'Modifier le patient' : 'Nouveau patient'}</h1>
            {isDemoMode && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Mode démo — données non persistées</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => navigate(-1)} className="btn btn-outline">Annuler</button>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? <div className="loading-spinner h-4 w-4" /> : <Save className="h-4 w-4" />}
            {isEditing ? 'Mettre à jour' : 'Créer le patient'}
          </button>
        </div>
      </div>

      <Section title="Informations personnelles" icon={User}>
        <Field label="Nom" required error={errors.lastName?.message}>
          <input
            {...register('lastName', { required: 'Le nom est requis' })}
            className="form-input"
            placeholder="Nom de famille"
          />
        </Field>
        <Field label="Prénom" required error={errors.firstName?.message}>
          <input
            {...register('firstName', { required: 'Le prénom est requis' })}
            className="form-input"
            placeholder="Prénom"
          />
        </Field>
        <Field label="Sexe">
          <select {...register('gender')} className="form-input">
            <option value="">-- Choisir --</option>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
            <option value="Autre">Autre</option>
          </select>
        </Field>
        <Field label="Date de naissance">
          <input {...register('dateOfBirth')} type="date" className="form-input" />
        </Field>
        <Field label="Profession">
          <input {...register('profession')} className="form-input" placeholder="Profession" />
        </Field>
        <Field label="Groupe sanguin">
          <select {...register('bloodGroup')} className="form-input">
            <option value="">-- Choisir --</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </Field>
      </Section>

      <Section title="Coordonnées" icon={Phone}>
        <Field label="Téléphone" required error={errors.phone?.message}>
          <input
            {...register('phone', { required: 'Le téléphone est requis' })}
            className="form-input"
            placeholder="+225 07 00 00 00 00"
          />
        </Field>
        <Field label="Téléphone 2">
          <input {...register('phone2')} className="form-input" placeholder="Téléphone secondaire" />
        </Field>
        <Field label="Email">
          <input {...register('email')} type="email" className="form-input" placeholder="email@exemple.ci" />
        </Field>
        <Field label="Adresse" className="sm:col-span-2">
          <input {...register('address')} className="form-input" placeholder="Adresse complète" />
        </Field>
        <Field label="Ville">
          <select {...register('city')} className="form-input">
            <option value="Abidjan">Abidjan</option>
            <option value="Bouaké">Bouaké</option>
            <option value="Yamoussoukro">Yamoussoukro</option>
            <option value="Korhogo">Korhogo</option>
            <option value="San-Pédro">San-Pédro</option>
            <option value="Daloa">Daloa</option>
            <option value="Man">Man</option>
            <option value="Autre">Autre</option>
          </select>
        </Field>
      </Section>

      <Section title="Assurance & Mutuelle" icon={Shield}>
        <Field label="Nom assurance">
          <input {...register('insuranceName')} className="form-input" placeholder="CNPS, MUGEF-CI..." />
        </Field>
        <Field label="N° assurance">
          <input {...register('insuranceNumber')} className="form-input" placeholder="Numéro d'assuré" />
        </Field>
        <Field label="Mutuelle">
          <input {...register('mutualName')} className="form-input" placeholder="Nom de la mutuelle" />
        </Field>
        <Field label="N° mutuelle">
          <input {...register('mutualNumber')} className="form-input" placeholder="Numéro adhérent" />
        </Field>
        <Field label="Taux prise en charge (%)">
          <input
            {...register('mutualRate', { valueAsNumber: true })}
            type="number" min="0" max="100"
            className="form-input"
            placeholder="80"
          />
        </Field>
      </Section>

      <Section title="Santé & Antécédents" icon={Heart}>
        <Field label="Allergies">
          <textarea {...register('allergies')} className="form-input" rows={3} placeholder="Allergies connues..." />
        </Field>
        <Field label="Observations médicales" className="sm:col-span-2">
          <textarea {...register('observations')} className="form-input" rows={3} placeholder="Observations générales, antécédents..." />
        </Field>
      </Section>

      <Section title="Personne à prévenir" icon={Phone}>
        <Field label="Nom & Prénom">
          <input {...register('emergencyContactName')} className="form-input" placeholder="Nom complet" />
        </Field>
        <Field label="Téléphone">
          <input {...register('emergencyContactPhone')} className="form-input" placeholder="+225 00 00 00 00 00" />
        </Field>
        <Field label="Relation">
          <select {...register('emergencyContactRelation')} className="form-input">
            <option value="">-- Choisir --</option>
            <option value="Conjoint(e)">Conjoint(e)</option>
            <option value="Parent">Parent</option>
            <option value="Enfant">Enfant</option>
            <option value="Frère/Sœur">Frère/Sœur</option>
            <option value="Ami(e)">Ami(e)</option>
            <option value="Autre">Autre</option>
          </select>
        </Field>
      </Section>

      <div className="flex justify-end gap-3 pb-6">
        <button type="button" onClick={() => navigate(-1)} className="btn btn-outline">Annuler</button>
        <button type="submit" disabled={saving} className="btn btn-primary btn-lg">
          {saving ? <div className="loading-spinner h-4 w-4" /> : <Save className="h-4 w-4" />}
          {isEditing ? 'Mettre à jour' : 'Créer le patient'}
        </button>
      </div>
    </form>
  )
}
