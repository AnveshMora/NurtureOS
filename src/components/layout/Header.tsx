import { ChildSwitcher } from './ChildSwitcher';

const APP_VERSION = '0.1.0';

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-surface-200">
      <div className="flex items-center justify-between h-12 px-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary-600">🌱</span>
          <span className="text-sm font-semibold text-surface-800">NurtureOS</span>
          <span className="text-[10px] text-surface-400 font-mono">v{APP_VERSION}</span>
        </div>

        <ChildSwitcher />
      </div>
    </header>
  );
}
