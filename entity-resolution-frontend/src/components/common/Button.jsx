import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

export const Button = ({ children, variant = 'primary', className, loading, ...props }) => {
  const cls = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 font-medium px-5 py-2.5 rounded-none transition-all duration-200 flex items-center gap-2',
    success: 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-medium px-5 py-2.5 rounded-none transition-all duration-200 flex items-center gap-2',
  }
  return (
    <button className={clsx(cls[variant], className)} disabled={loading || props.disabled} {...props}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : null}
      {children}
    </button>
  )
}

export const Badge = ({ children, variant = 'gray', className }) => (
  <span className={clsx(`badge-${variant}`, className)}>{children}</span>
)

export const Spinner = ({ size = 'md', label = 'Loading...' }) => {
  const s = size === 'sm' ? 16 : size === 'lg' ? 40 : 24
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Loader2 size={s} className="animate-spin text-brand-400" />
      {label && <p className="text-ink-400 text-sm">{label}</p>}
    </div>
  )
}

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
    {Icon && (
      <div className="w-16 h-16 rounded-2xl bg-ink-800 border border-ink-700/60 flex items-center justify-center mb-5">
        <Icon size={28} className="text-ink-500" />
      </div>
    )}
    <h3 className="font-display text-lg font-semibold text-ink-200 mb-2">{title}</h3>
    {description && <p className="text-ink-500 text-sm max-w-xs mb-6">{description}</p>}
    {action}
  </div>
)
