import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function Layout() {
  return (
    <>
      <main className="flex-1 pb-24 safe-top">
        <Outlet />
      </main>
      <BottomNav />
    </>
  );
}
