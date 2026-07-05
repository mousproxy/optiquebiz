import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'
import { fr } from 'date-fns/locale'

// =====================================================
// CURRENCY
// =====================================================

export const formatCurrency = (amount: number, currency = 'FCFA'): string => {
  return new Intl.NumberFormat('fr-CI', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' ' + currency
}

export const formatCurrencyCompact = (amount: number): string => {
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1) + 'M F'
  if (amount >= 1_000) return (amount / 1_000).toFixed(0) + 'K F'
  return formatCurrency(amount)
}

// =====================================================
// DATES
// =====================================================

export const formatDate = (dateStr?: string | Date | null, fmt = 'dd/MM/yyyy'): string => {
  if (!dateStr) return '-'
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    if (!isValid(date)) return '-'
    return format(date, fmt, { locale: fr })
  } catch {
    return '-'
  }
}

export const formatDateTime = (dateStr?: string | Date | null): string => {
  return formatDate(dateStr, 'dd/MM/yyyy HH:mm')
}

export const formatTime = (timeStr?: string | null): string => {
  if (!timeStr) return '-'
  return timeStr.substring(0, 5)
}

export const formatDateRelative = (dateStr?: string | null): string => {
  if (!dateStr) return '-'
  try {
    const date = parseISO(dateStr)
    return formatDistanceToNow(date, { addSuffix: true, locale: fr })
  } catch {
    return '-'
  }
}

export const formatDateLong = (dateStr?: string | null): string => {
  return formatDate(dateStr, "EEEE d MMMM yyyy")
}

export const today = (): string => format(new Date(), 'yyyy-MM-dd')
export const thisMonth = (): string => format(new Date(), 'yyyy-MM')

// =====================================================
// NAMES
// =====================================================

export const fullName = (obj?: { firstName?: string; lastName?: string; first_name?: string; last_name?: string } | null): string => {
  if (!obj) return '-'
  const fn = obj.firstName || obj.first_name || ''
  const ln = obj.lastName || obj.last_name || ''
  return `${fn} ${ln}`.trim() || '-'
}

export const initials = (obj?: { firstName?: string; lastName?: string; first_name?: string; last_name?: string } | null): string => {
  if (!obj) return '?'
  const fn = obj.firstName || obj.first_name || ''
  const ln = obj.lastName || obj.last_name || ''
  return `${fn.charAt(0)}${ln.charAt(0)}`.toUpperCase()
}

// =====================================================
// OPTICAL VALUES
// =====================================================

export const formatOptical = (val?: number | null, prefix = ''): string => {
  if (val === null || val === undefined) return '-'
  const sign = val > 0 ? '+' : ''
  return `${prefix}${sign}${val.toFixed(2)}`
}

export const formatSph = (val?: number | null): string => formatOptical(val, '')
export const formatCyl = (val?: number | null): string => formatOptical(val, '')
export const formatAxe = (val?: number | null): string => val ? `${val}°` : '-'
export const formatAdd = (val?: number | null): string => val ? `+${val.toFixed(2)}` : '-'
export const formatPd = (val?: number | null): string => val ? `${val}` : '-'

// =====================================================
// STATUS
// =====================================================

const appointmentStatusMap: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Planifié', color: 'blue' },
  confirmed: { label: 'Confirmé', color: 'green' },
  present: { label: 'Présent', color: 'teal' },
  in_progress: { label: 'En cours', color: 'purple' },
  completed: { label: 'Terminé', color: 'gray' },
  absent: { label: 'Absent', color: 'red' },
  cancelled: { label: 'Annulé', color: 'red' },
  rescheduled: { label: 'Reporté', color: 'yellow' },
}

const saleStatusMap: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'gray' },
  pending: { label: 'En attente', color: 'yellow' },
  completed: { label: 'Soldé', color: 'green' },
  cancelled: { label: 'Annulé', color: 'red' },
  refunded: { label: 'Remboursé', color: 'orange' },
  partial: { label: 'Partial', color: 'blue' },
}

const orderStatusMap: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'gray' },
  sent: { label: 'Envoyée', color: 'blue' },
  confirmed: { label: 'Confirmée', color: 'green' },
  partial: { label: 'Partielle', color: 'yellow' },
  received: { label: 'Reçue', color: 'teal' },
  cancelled: { label: 'Annulée', color: 'red' },
}

const paymentMethodMap: Record<string, { label: string; icon: string }> = {
  cash: { label: 'Espèces', icon: '💵' },
  card: { label: 'Carte bancaire', icon: '💳' },
  orange_money: { label: 'Orange Money', icon: '🟠' },
  mtn_money: { label: 'MTN Money', icon: '🟡' },
  moov_money: { label: 'Moov Money', icon: '🔵' },
  transfer: { label: 'Virement', icon: '🏦' },
  check: { label: 'Chèque', icon: '📝' },
  mixed: { label: 'Mixte', icon: '🔀' },
}

export const getAppointmentStatus = (status: string) => appointmentStatusMap[status] || { label: status, color: 'gray' }
export const getSaleStatus = (status: string) => saleStatusMap[status] || { label: status, color: 'gray' }
export const getOrderStatus = (status: string) => orderStatusMap[status] || { label: status, color: 'gray' }
export const getPaymentMethod = (method: string) => paymentMethodMap[method] || { label: method, icon: '💰' }

// Role labels
export const roleLabels: Record<string, string> = {
  admin: 'Administrateur',
  manager: 'Gestionnaire',
  optician: 'Opticien',
  ophthalmologist: 'Ophtalmologue',
  secretary: 'Secrétaire',
  seller: 'Vendeur',
  cashier: 'Caissier',
  commercial: 'Commercial',
}

// Gender labels
export const genderLabels: Record<string, string> = {
  M: 'Masculin',
  F: 'Féminin',
  Autre: 'Autre',
}

// =====================================================
// NUMBERS
// =====================================================

export const formatPercent = (val?: number | null): string => {
  if (val === null || val === undefined) return '-'
  return `${val.toFixed(1)}%`
}

export const formatNumber = (val?: number | null): string => {
  if (val === null || val === undefined) return '-'
  return new Intl.NumberFormat('fr-FR').format(val)
}

export const clamp = (val: number, min: number, max: number): number => Math.min(Math.max(val, min), max)
