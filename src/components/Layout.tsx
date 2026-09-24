import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { Header } from '@/components/Header'
import { PortalStateProvider } from '@/state/PortalState'
import { generatedAt, qualityMeta } from '@/data/models'
import { formatDate } from '@/utils/format'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export function Layout() {
  return (
    <PortalStateProvider>
      <ScrollToTop />
      <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          <Outlet />
        </main>
        <footer className="border-t border-slate-200 dark:border-slate-800">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-slate-400 sm:flex-row sm:justify-between dark:text-slate-500">
            <p>
              Precios: dataset de LiteLLM
              {generatedAt ? ` (actualizado ${formatDate(generatedAt)})` : ''}. Calidad:
              LMArena, CC BY 4.0
              {qualityMeta?.publishedAt ? ` (publicado ${formatDate(qualityMeta.publishedAt)})` : ''}.
            </p>
            <Link to="/metodologia" className="underline hover:text-slate-600 dark:hover:text-slate-300">
              Cómo calculamos esto
            </Link>
          </div>
        </footer>
      </div>
    </PortalStateProvider>
  )
}
