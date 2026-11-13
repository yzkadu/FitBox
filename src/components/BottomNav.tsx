import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Calendar, Dumbbell, LayoutGrid, TrendingUp, MoreHorizontal, Bike, History, Ruler, Bot, Activity, X } from 'lucide-react';

const primaryTabs = [
  { to: '/', label: 'Hoje', icon: Calendar, end: true },
  { to: '/treinos', label: 'Treinar', icon: Dumbbell, end: false },
  { to: '/programas', label: 'Explorar', icon: LayoutGrid, end: true },
  { to: '/evolucao', label: 'Evolução', icon: TrendingUp, end: false },
];

const moreLinks = [
  { to: '/treinador', label: 'Treinador IA', icon: Bot },
  { to: '/cardio', label: 'Cardio', icon: Bike },
  { to: '/historico', label: 'Histórico', icon: History },
  { to: '/medidas', label: 'Medidas corporais', icon: Ruler },
  { to: '/musculos', label: 'Mapa muscular', icon: Activity },
];

export function BottomNav() {
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const isMoreRoute = moreLinks.some(({ to }) => pathname === to || pathname.startsWith(to + '/'));

  useEffect(() => { setMoreOpen(false); }, [pathname]);

  return (
    <nav
      aria-label="Navegação principal"
      className="lg:hidden fixed bottom-0 left-0 right-0 mx-auto max-w-[560px] safe-bottom border-t z-40"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {moreOpen && (
        <div
          id="fitbox-more-menu"
          className="absolute left-3 right-3 bottom-full mb-2 rounded-2xl border p-2 shadow-xl"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm font-semibold">Mais recursos</span>
            <button type="button" onClick={() => setMoreOpen(false)} aria-label="Fechar menu">
              <X size={19} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {moreLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-3 text-xs font-medium"
                style={({ isActive }) => ({
                  background: isActive ? 'var(--brand-dim)' : 'var(--surface-2)',
                  color: isActive ? 'var(--brand)' : 'var(--text)',
                })}
              >
                <Icon size={17} className="shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-around items-stretch">
        {primaryTabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMoreOpen(false)}
            className="flex flex-col items-center gap-0.5 py-2 px-1 flex-1 min-w-0 text-[11px] leading-tight transition-colors"
            style={({ isActive }) => ({
              color: isActive ? 'var(--brand)' : 'var(--text-faint)',
            })}
          >
            <Icon size={20} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          aria-expanded={moreOpen}
          aria-controls="fitbox-more-menu"
          onClick={() => setMoreOpen((open) => !open)}
          className="flex flex-col items-center gap-0.5 py-2 px-1 flex-1 min-w-0 text-[11px] leading-tight transition-colors"
          style={{ color: moreOpen || isMoreRoute ? 'var(--brand)' : 'var(--text-faint)' }}
        >
          <MoreHorizontal size={20} strokeWidth={2} />
          <span>Mais</span>
        </button>
      </div>
    </nav>
  );
}
