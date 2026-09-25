import { NavLink } from 'react-router-dom';
import { Dumbbell, Calendar, History, TrendingUp, Ruler, Bike, Bot, ChevronDown } from 'lucide-react';
import { AppIcon } from './ui';

const links = [
  { to: '/', label: 'Hoje', icon: Calendar, end: true },
  { to: '/treinos', label: 'Treinos', icon: Dumbbell, end: false },
  { to: '/treinador', label: 'Treinador IA', icon: Bot, end: false },
  { to: '/cardio', label: 'Cardio', icon: Bike, end: false },
  { to: '/historico', label: 'Histórico', icon: History, end: false },
  { to: '/evolucao', label: 'Evolução', icon: TrendingUp, end: false },
  { to: '/medidas', label: 'Medidas', icon: Ruler, end: false },
];

/** Rail de navegação — só aparece em telas ≥1024px (ver .app-shell__rail no
 * index.css). No mobile a navegação continua sendo o BottomNav de sempre. */
export function Sidebar({
  name,
  emoji,
  onOpenAccount,
}: {
  name: string;
  emoji?: string | null;
  onOpenAccount: () => void;
}) {
  return (
    <div
      className="w-[236px] shrink-0 border-r flex flex-col"
      style={{ background: 'var(--bg-0)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-2 px-5 pt-6 pb-5">
        <span
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--brand-dim)' }}
        >
          <Dumbbell size={16} style={{ color: 'var(--brand)' }} />
        </span>
        <span className="font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
          FitBox
        </span>
      </div>

      <nav className="flex-1 flex flex-col gap-0.5 px-3">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
            style={({ isActive }) => ({
              background: isActive ? 'var(--surface)' : 'transparent',
              color: isActive ? 'var(--text)' : 'var(--text-dim)',
            })}
          >
            <Icon size={17} strokeWidth={2} style={{ color: 'inherit' }} />
            {label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={onOpenAccount}
        className="flex items-center gap-2 mx-3 mb-5 rounded-xl px-2.5 py-2 text-left"
        style={{ background: 'var(--surface)' }}
      >
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'var(--brand-dim)', color: 'var(--brand)' }}
        >
          <AppIcon value={emoji} size={16} />
        </span>
        <span className="text-xs font-medium flex-1 min-w-0 truncate" style={{ color: 'var(--text)' }}>
          {name}
        </span>
        <ChevronDown size={13} style={{ color: 'var(--text-faint)' }} />
      </button>
    </div>
  );
}
