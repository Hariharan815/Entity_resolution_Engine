import { useEffect, useMemo, useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import useStore from '../../store/useStore'

const initialForm = {
  name: '',
  email: '',
  password: '',
}

const getInitials = (name) => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'U'
  return parts.map((p) => p[0].toUpperCase()).join('').slice(0, 2)
}

export default function AuthModal() {
  const { showAuthModal, closeAuthModal, openAuthModal, setUser } = useStore()
  const [form, setForm] = useState(initialForm)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isSignup = showAuthModal === 'signup'

  useEffect(() => {
    if (!showAuthModal) {
      setForm(initialForm)
      setShowPassword(false)
      setError('')
      setLoading(false)
    }
  }, [showAuthModal])

  const title = useMemo(() => (isSignup ? 'Create account' : 'Welcome back'), [isSignup])

  if (!showAuthModal) return null

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError('')
  }

  const validate = () => {
    if (isSignup && !form.name.trim()) return 'Name is required.'
    if (!form.email.trim()) return 'Email is required.'
    if (!form.password) return 'Password is required.'
    if (form.password.length < 4) return 'Password must be at least 4 characters.'
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')
    try {
      await new Promise((r) => setTimeout(r, 800))
      const fullName = isSignup ? form.name.trim() : (form.email.split('@')[0] || 'User')
      setUser({
        name: fullName,
        email: form.email.trim(),
        plan: 'Free',
        initials: getInitials(fullName),
      })
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    openAuthModal(isSignup ? 'login' : 'signup')
    setForm(initialForm)
    setError('')
    setShowPassword(false)
  }

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeAuthModal} />

      <div className="relative h-full w-full flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />

          <div className="p-5">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500 mt-1">Use your account to sync sessions across devices.</p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              {isSignup && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                    placeholder="Your name"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-500 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setField('password', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 pr-10 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                    placeholder="••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-none text-gray-500 hover:bg-gray-100"
                  >
                    {showPassword ? <EyeOff size={14} className="mx-auto" /> : <Eye size={14} className="mx-auto" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-xs text-rose-500 bg-rose-50 border border-rose-100 px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-none px-3.5 py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {isSignup ? 'Create Account' : 'Log In'}
              </button>
            </form>

            <button type="button" onClick={switchMode} className="w-full mt-3 text-xs text-gray-500 hover:text-indigo-600">
              {isSignup ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
