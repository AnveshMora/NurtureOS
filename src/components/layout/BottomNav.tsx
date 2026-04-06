import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Home', icon: '📊' },
  { to: '/week', label: 'Week', icon: '📅' },
  { to: '/activities', label: 'Activities', icon: '📚' },
  { to: '/review', label: 'Review', icon: '✍️' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-surface-200 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14 max-w-3xl mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex flex-col items-center justify-center gap-0.5 w-16 py-1 rounded-md transition-colors
              ${isActive
                ? 'text-primary-600'
                : 'text-surface-400 hover:text-surface-600'
              }
            `}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
