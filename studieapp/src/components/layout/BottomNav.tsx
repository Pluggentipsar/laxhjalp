import { Home, BookOpen, GraduationCap, Gamepad2, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { icon: Home, label: 'Hem', path: '/' },
  { icon: BookOpen, label: 'Material', path: '/material' },
  { icon: GraduationCap, label: 'Studera', path: '/study' },
  { icon: Gamepad2, label: 'Spel', path: '/games' },
  { icon: User, label: 'Profil', path: '/profile' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-pb z-50">
      <div className="flex justify-around items-center h-16 max-w-screen-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 h-full touch-target relative"
            >
              <motion.div
                className="flex flex-col items-center"
                whileTap={{ scale: 0.9 }}
              >
                <div
                  className={`relative ${
                    isActive ? 'text-primary-500' : 'text-gray-500'
                  }`}
                >
                  <Icon
                    size={24}
                    strokeWidth={isActive ? 2.5 : 2}
                    className="transition-all"
                  />
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
                <span
                  className={`text-xs mt-1 ${
                    isActive
                      ? 'text-primary-500 font-semibold'
                      : 'text-gray-500'
                  }`}
                >
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
