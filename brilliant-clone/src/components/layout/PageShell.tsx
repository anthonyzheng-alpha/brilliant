import type { ReactNode } from 'react'
import { Header } from './Header'
import './PageShell.css'

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="page-shell">
      <Header />
      <main className="page-shell__main">{children}</main>
    </div>
  )
}
