import { NavLink } from 'react-router-dom';
import { Dumbbell, Calendar, History, TrendingUp, Ruler } from 'lucide-react';

const tabs = [
  { to: '/', label: 'Hoje', icon: Calendar, end: true },
  { to: '/treinos', label: 'Treinos', icon: Dumbbell, end: false },
  { to: '/historico', label: 'Histórico', icon: History, end: false },
  { to: '/evolucao', label: 'Evolução', icon: TrendingUp, end: false },
  { to: '/medidas', label: 'Medidas', icon: Ruler, end: false },
];

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 mx-auto max-w-[560px] safe-bottom border-t"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex justify-around items-stretch">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2.5 px-2 flex-1 text-xs transition-colors ${
                isActive ? '' : ''
              }`
            }
            style={({ isActive }) => ({
              color: isActive ? 'var(--brand)' : 'var(--text-faint)',
            })}
          >
            <Icon size={22} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
