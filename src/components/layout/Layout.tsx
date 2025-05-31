import type { ReactNode } from 'react'

type Page = 'tasks' | 'companies';

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
              className={`nav-link ${currentPage === 'companies' ? 'active' : ''}`}
              onClick={() => onPageChange('companies')}
            >
              Companies
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