import type { ReactNode } from 'react'

type Page = 'tasks' | 'company';

interface LayoutProps {
  children: ReactNode
  currentPage: Page
  onPageChange: (page: Page) => void
}

export function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  return (
    <div>
      <header>
        <div className="header-container">
          <div className="flex items-center gap-2">
            <h1 className="header-title">Task Manager</h1>
          </div>
          <nav>
            <button
              className={`nav-link ${currentPage === 'tasks' ? 'active' : ''}`}
              onClick={() => onPageChange('tasks')}
            >
              Tasks
            </button>
            <button
              className={`nav-link ${currentPage === 'company' ? 'active' : ''}`}
              onClick={() => onPageChange('company')}
            >
              Company
            </button>
          </nav>
        </div>
      </header>
      <main className="py-8">
        <div className="container">
          {children}
        </div>
      </main>
    </div>
  )
} 