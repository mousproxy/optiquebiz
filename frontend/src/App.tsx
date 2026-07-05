import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/auth.store'
import { useAppStore } from './store/app.store'
import { useEffect } from 'react'

import Layout from './components/layout/Layout'

// Auth
import Login from './pages/auth/Login'

// Dashboard
import Dashboard from './pages/dashboard/Dashboard'

// Patients
import PatientsList from './pages/patients/PatientsList'
import PatientDetail from './pages/patients/PatientDetail'
import PatientForm from './pages/patients/PatientForm'

// Appointments
import Appointments from './pages/appointments/Appointments'

// Consultations
import Consultations from './pages/consultations/Consultations'
import ConsultationForm from './pages/consultations/ConsultationForm'

// Prescriptions
import Prescriptions from './pages/prescriptions/Prescriptions'
import PrescriptionForm from './pages/prescriptions/PrescriptionForm'

// Sales
import POS from './pages/sales/POS'
import SalesList from './pages/sales/SalesList'
import SaleDetail from './pages/sales/SaleDetail'

// Inventory
import Frames from './pages/inventory/Frames'
import Lenses from './pages/inventory/Lenses'
import ContactLenses from './pages/inventory/ContactLenses'
import Accessories from './pages/inventory/Accessories'

// Stock
import Stock from './pages/stock/Stock'

// Purchases
import Purchases from './pages/purchases/Purchases'
import PurchaseForm from './pages/purchases/PurchaseForm'

// Suppliers
import Suppliers from './pages/suppliers/Suppliers'

// Cashier
import Cashier from './pages/cashier/Cashier'

// Accounting
import Accounting from './pages/accounting/Accounting'

// HR
import HR from './pages/hr/HR'

// CRM
import CRM from './pages/crm/CRM'

// Reports
import Reports from './pages/reports/Reports'

// Settings
import Settings from './pages/settings/Settings'
import Users from './pages/settings/Users'

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  const { theme } = useAppStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: '!font-sans !text-sm !rounded-xl',
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Patients */}
          <Route path="patients" element={<PatientsList />} />
          <Route path="patients/new" element={<PatientForm />} />
          <Route path="patients/:id" element={<PatientDetail />} />
          <Route path="patients/:id/edit" element={<PatientForm />} />

          {/* Rendez-vous */}
          <Route path="appointments" element={<Appointments />} />

          {/* Consultations */}
          <Route path="consultations" element={<Consultations />} />
          <Route path="consultations/new" element={<ConsultationForm />} />
          <Route path="consultations/:id" element={<ConsultationForm />} />

          {/* Ordonnances */}
          <Route path="prescriptions" element={<Prescriptions />} />
          <Route path="prescriptions/new" element={<PrescriptionForm />} />
          <Route path="prescriptions/:id" element={<PrescriptionForm />} />

          {/* Ventes */}
          <Route path="pos" element={<POS />} />
          <Route path="sales" element={<SalesList />} />
          <Route path="sales/:id" element={<SaleDetail />} />

          {/* Inventaire */}
          <Route path="inventory/frames" element={<Frames />} />
          <Route path="inventory/lenses" element={<Lenses />} />
          <Route path="inventory/contact-lenses" element={<ContactLenses />} />
          <Route path="inventory/accessories" element={<Accessories />} />

          {/* Stock */}
          <Route path="stock" element={<Stock />} />

          {/* Achats */}
          <Route path="purchases" element={<Purchases />} />
          <Route path="purchases/new" element={<PurchaseForm />} />
          <Route path="purchases/:id" element={<PurchaseForm />} />

          {/* Fournisseurs */}
          <Route path="suppliers" element={<Suppliers />} />

          {/* Caisse */}
          <Route path="cashier" element={<Cashier />} />

          {/* Comptabilité */}
          <Route path="accounting" element={<Accounting />} />

          {/* RH */}
          <Route path="hr" element={<HR />} />

          {/* CRM */}
          <Route path="crm" element={<CRM />} />

          {/* Rapports */}
          <Route path="reports" element={<Reports />} />

          {/* Paramétrage */}
          <Route path="settings" element={<Settings />} />
          <Route path="settings/users" element={<Users />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
