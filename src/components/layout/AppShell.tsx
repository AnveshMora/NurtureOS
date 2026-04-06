import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { useActiveChild } from '../../hooks/useActiveChild';

export function AppShell() {
  const { hasChildren } = useActiveChild();

  return (
    <div className="min-h-dvh flex flex-col bg-surface-50">
      <Header />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 pt-4 pb-20">
        <Outlet />
      </main>
      {hasChildren && <BottomNav />}
    </div>
  );
}
