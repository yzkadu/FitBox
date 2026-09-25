import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { AccountSheet } from './AccountSheet';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';

/** Shell v16: no mobile é exatamente o de sempre (conteúdo + BottomNav). A
 * partir de 1024px ganha uma rail de navegação fixa (ver Sidebar) e o
 * conteúdo de cada página passa a rodar dentro de um canvas central — sem
 * mexer no que cada página já renderiza. */
export function Layout() {
  const { user } = useAuth();
  const [profile, refetchProfile] = useProfile(user?.id);
  const [accountOpen, setAccountOpen] = useState(false);
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <div className="app-shell">
      <aside className="app-shell__rail">
        <Sidebar name={profile?.name ?? 'Conta'} emoji={profile?.emoji} onOpenAccount={() => setAccountOpen(true)} />
      </aside>

      <div className="app-shell__main">
        <main className={`flex-1 pb-24 safe-top lg:pb-4 shell-content ${isHome ? 'shell-content--wide' : ''}`}>
          <Outlet />
        </main>
        <BottomNav />
      </div>

      <AccountSheet
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        name={profile?.name ?? 'Conta'}
        emoji={profile?.emoji}
        email={user?.email}
        userId={user?.id}
        heightCm={profile?.heightCm ?? null}
        age={profile?.age ?? null}
        gender={profile?.gender ?? null}
        initialWeightKg={profile?.initialWeightKg ?? null}
        onSaved={refetchProfile}
      />
    </div>
  );
}
