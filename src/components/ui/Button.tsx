import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'success' | 'ghost'
type Size = 'md' | 'sm' | 'lg'

export const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-poke-red-400 to-poke-red-600 text-white shadow-[0_4px_0_0_var(--color-poke-red-700),0_8px_16px_-4px_rgba(227,53,13,0.5)] hover:shadow-[0_4px_0_0_var(--color-poke-red-700),0_8px_20px_-2px_rgba(227,53,13,0.7)] hover:brightness-110',
  secondary:
    'bg-gradient-to-b from-poke-blue-400 to-poke-blue-600 text-white shadow-[0_4px_0_0_#1f2f8f,0_8px_16px_-4px_rgba(59,76,202,0.5)] hover:shadow-[0_4px_0_0_#1f2f8f,0_8px_20px_-2px_rgba(59,76,202,0.7)] hover:brightness-110',
  success:
    'bg-gradient-to-b from-poke-yellow-300 to-note-green text-stage-950 shadow-[0_4px_0_0_#1f8f52,0_8px_16px_-4px_rgba(61,220,132,0.5)] hover:shadow-[0_4px_0_0_#1f8f52,0_8px_20px_-2px_rgba(61,220,132,0.7)] hover:brightness-105',
  ghost:
    'bg-stage-700 text-white/90 shadow-[0_4px_0_0_var(--color-stage-950)] hover:bg-stage-600 hover:shadow-[0_4px_0_0_var(--color-stage-950)]',
}

const SIZE_CLASSES: Record<Size, string> = {
  md: 'px-6 py-3',
  sm: 'px-4 py-2 text-sm',
  lg: 'px-10 py-4 text-lg',
}

const BASE_CLASS =
  'glossy font-display font-700 rounded-xl transition-all duration-150 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:pointer-events-none disabled:active:translate-y-0'

/** Für Nicht-<button>-Elemente (z.B. <Link>), die denselben Look brauchen. */
export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className = ''): string {
  return `${BASE_CLASS} ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${className}`
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button {...props} className={buttonClass(variant, size, className)}>
      {children}
    </button>
  )
}
