import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn, Glasses, Zap } from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

type FormData = z.infer<typeof schema>

export default function Login() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'admin@optigest.ci', password: 'Admin2024!' },
  })

  // Comptes démo (mode sans backend)
  // Remarque : 'admin@optigest.ci' n'est PAS ici — c'est le vrai compte admin
  // seedé en base, il doit toujours passer par le backend réel.
  const DEMO_ACCOUNTS: Record<string, { password: string; user: any }> = {
    'medecin@optigest.ci': {
      password: 'Demo2024!',
      user: { id: 'demo-2', firstName: 'Dr. Traoré', lastName: 'Ibrahim', email: 'medecin@optigest.ci', role: 'ophthalmologist', companyId: 'demo' },
    },
    'vendeur@optigest.ci': {
      password: 'Demo2024!',
      user: { id: 'demo-3', firstName: 'Koffi', lastName: 'Serge', email: 'vendeur@optigest.ci', role: 'seller', companyId: 'demo' },
    },
    'caisse@optigest.ci': {
      password: 'Demo2024!',
      user: { id: 'demo-4', firstName: 'N\'Guessan', lastName: 'Marie', email: 'caisse@optigest.ci', role: 'cashier', companyId: 'demo' },
    },
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)

    // 1. Vérifier les comptes démo en priorité (pas de réseau requis)
    const demo = DEMO_ACCOUNTS[data.email]
    if (demo) {
      await new Promise(r => setTimeout(r, 600)) // petite animation
      if (demo.password === data.password) {
        setAuth(demo.user as any, 'demo-token', 'demo-refresh')
        toast.success(`Bienvenue, ${demo.user.firstName} !`)
        navigate('/dashboard')
        setIsLoading(false)
        return
      } else {
        toast.error('Mot de passe incorrect')
        setIsLoading(false)
        return
      }
    }

    // 2. Sinon tenter le backend réel
    try {
      const res = await api.post('/auth/login', data)
      const { token, refreshToken, user } = res.data
      setAuth(user, token, refreshToken)
      toast.success(`Bienvenue, ${user.firstName} !`)
      navigate('/dashboard')
    } catch {
      toast.error('Identifiants invalides ou serveur indisponible')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-700/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-premium mb-4">
            <Glasses className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">OptiGest</h1>
          <p className="text-slate-400 mt-1">Gestion de Magasin d'Optique</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-2">Connexion</h2>
          <p className="text-slate-400 text-sm mb-6">Connectez-vous à votre compte</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Adresse email
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="admin@optigest.ci"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-white/30 bg-white/10 text-primary-500" />
                <span className="text-sm text-slate-300">Se souvenir de moi</span>
              </label>
              <button type="button" className="text-sm text-primary-400 hover:text-primary-300">
                Mot de passe oublié ?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-premium"
            >
              {isLoading ? (
                <div className="loading-spinner h-5 w-5" />
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Se connecter
                </>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-slate-500 mb-3 text-center flex items-center justify-center gap-1">
              <Zap className="h-3 w-3" /> Connexion rapide (mode démo) :
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { email: 'admin@optigest.ci', password: 'Admin2024!', role: 'Admin', color: 'bg-red-500/20 text-red-300 hover:bg-red-500/30' },
                { email: 'medecin@optigest.ci', password: 'Demo2024!', role: 'Médecin', color: 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' },
                { email: 'vendeur@optigest.ci', password: 'Demo2024!', role: 'Vendeur', color: 'bg-green-500/20 text-green-300 hover:bg-green-500/30' },
                { email: 'caisse@optigest.ci', password: 'Demo2024!', role: 'Caissier', color: 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30' },
              ].map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => { setValue('email', acc.email); setValue('password', acc.password) }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium ${acc.color} border border-white/10 transition-colors`}
                >
                  {acc.role}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          © 2024 OptiGest • Côte d'Ivoire • v1.0.0
        </p>
      </div>
    </div>
  )
}
