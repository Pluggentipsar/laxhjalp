import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { useAppStore } from '../../store/appStore';

interface MainLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
  title?: string;
  headerAction?: ReactNode;
}

const GRADIENTS: Record<string, string> = {
  ocean: 'from-blue-400 via-cyan-500 to-teal-400',
  sunset: 'from-orange-400 via-pink-500 to-purple-600',
  forest: 'from-green-400 via-emerald-500 to-teal-500',
  lavender: 'from-purple-400 via-pink-400 to-rose-400',
  fire: 'from-red-500 via-orange-500 to-yellow-400',
  night: 'from-indigo-900 via-purple-900 to-pink-800',
  mint: 'from-emerald-300 via-teal-300 to-cyan-300',
  candy: 'from-pink-300 via-purple-300 to-indigo-400',
  autumn: 'from-amber-500 via-orange-600 to-red-600',
  nordic: 'from-slate-400 via-blue-300 to-cyan-200',
};

export function MainLayout({
  children,
  showBottomNav = true,
  title,
  headerAction,
}: MainLayoutProps) {
  const user = useAppStore((state) => state.user);
  const background = user?.settings?.background;

  // Generate background style
  let backgroundStyle: React.CSSProperties = {};
  let backgroundClass = 'bg-gray-50 dark:bg-gray-950';

  if (background) {
    if (background.type === 'gradient' && GRADIENTS[background.value]) {
      backgroundClass = `bg-gradient-to-br ${GRADIENTS[background.value]}`;
    } else if (background.type === 'image' || background.type === 'custom') {
      backgroundStyle = {
        backgroundImage: `url(${background.value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      };
      backgroundClass = '';
    }
  }

  return (
    <div className={`flex flex-col min-h-screen ${backgroundClass}`} style={backgroundStyle}>
      {/* Background overlay for better readability */}
      {background && (
        <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm" style={{ zIndex: 0 }} />
      )}

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        {title && (
          <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 safe-area-pt">
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
    </div>
  );
}
