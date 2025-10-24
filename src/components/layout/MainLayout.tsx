import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

interface MainLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
  title?: string;
  headerAction?: ReactNode;
}

export function MainLayout({
  children,
  showBottomNav = true,
  title,
  headerAction,
}: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      {title && (
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 safe-area-pt">
          <div className="flex items-center justify-between h-16 px-4 max-w-screen-lg mx-auto">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
            {headerAction && <div>{headerAction}</div>}
          </div>
        </header>
      )}

      {/* Main content */}
      <main
        className={`flex-1 overflow-y-auto ${
          showBottomNav ? 'pb-20' : 'pb-4'
        } ${title ? 'pt-0' : 'pt-4'}`}
      >
        <div className="max-w-screen-lg mx-auto px-4">{children}</div>
      </main>

      {/* Bottom navigation */}
      {showBottomNav && <BottomNav />}
    </div>
  );
}
