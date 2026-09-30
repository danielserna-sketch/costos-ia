import { forwardRef, type InputHTMLAttributes } from 'react'

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'md' | 'lg'
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { size = 'md', className = '', ...props },
  ref,
) {
  const sizing = size === 'lg' ? 'py-3.5 pl-11 text-base' : 'py-2 pl-9 text-sm'
  return (
    <div className={`relative ${className}`}>
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400 ${
          size === 'lg' ? 'left-4 h-5 w-5' : 'left-3 h-4 w-4'
        }`}
      >
        <circle cx="9" cy="9" r="6" />
        <path d="m14 14 4 4" strokeLinecap="round" />
      </svg>
      <input
        ref={ref}
        type="search"
        className={`w-full rounded-full border border-slate-300 bg-white pr-4 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${sizing}`}
        {...props}
      />
    </div>
  )
})
