import type { ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50'

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300',
  secondary:
    'border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800',
  ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100',
}

function buttonClass(variant: ButtonVariant = 'primary', className = ''): string {
  return `${BASE} ${VARIANTS[variant]} ${className}`
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export function Button({ variant = 'primary', className = '', type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />
}

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant
}

export function ButtonLink({ variant = 'primary', className = '', ...props }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, className)} {...props} />
}
