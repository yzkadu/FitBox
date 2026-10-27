import { useEffect, useState } from 'react';
import { Check, Repeat, Trash2 } from 'lucide-react';
import type { SetLog } from '../types';

interface SessionSetRowProps {
  series: SetLog;
  previous?: { weight: number; reps: number };
  onUpdate: (patch: Partial<SetLog>) => void;
  onToggle: () => void;
  onRemove: () => void;
  onRepeat: () => void;
}

/** Cada série é um registro independente. Inputs mantêm seu texto em edição
 * (incluindo vírgula decimal), mas atualizam o estado persistido enquanto digita.
 */
export function SessionSetRow({
  series, previous, onUpdate, onToggle, onRemove, onRepeat,
}: SessionSetRowProps) {
  const [weightText, setWeightText] = useState(series.weight ? String(series.weight) : '');
  const [repsText, setRepsText] = useState(series.reps ? String(series.reps) : '');

  useEffect(() => {
    setWeightText(series.weight ? String(series.weight) : '');
  }, [series.weight]);
  useEffect(() => {
    setRepsText(series.reps ? String(series.reps) : '');
  }, [series.reps]);

  function changeWeight(text: string) {
    if (!/^\d*(?:[.,]\d{0,2})?$/.test(text)) return;
    setWeightText(text);
    const amount = Number(text.replace(',', '.'));
    if (Number.isFinite(amount) && amount <= 9999) onUpdate({ weight: amount });
  }

  function changeReps(text: string) {
    if (!/^\d{0,4}$/.test(text)) return;
    setRepsText(text);
    onUpdate({ reps: Number(text) || 0 });
  }

  return (
    <div className="rounded-xl border p-3 mb-2.5"
      style={{
        background: series.completed ? 'var(--success-dim)' : 'var(--surface-2)',
        borderColor: series.completed ? 'var(--success)' : 'var(--border-soft)',
      }}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold flex-1" style={{ color: 'var(--text)' }}>
          Série {series.setNumber}
        </span>
        <button type="button" onClick={onToggle} aria-pressed={series.completed}
          aria-label={series.completed ? `Desmarcar série ${series.setNumber}` : `Concluir série ${series.setNumber}`}
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold min-h-9"
          style={{
            background: series.completed ? 'var(--success)' : 'var(--brand-dim)',
            color: series.completed ? '#08251c' : 'var(--brand)',
          }}>
          <Check size={15} strokeWidth={2.5}/>
          {series.completed ? 'Concluída' : 'Concluir'}
        </button>
        <button type="button" onClick={onRemove}
          aria-label={`Excluir série ${series.setNumber}`}
          className="flex items-center justify-center rounded-lg w-9 h-9"
          style={{ color: 'var(--text-faint)' }}>
          <Trash2 size={15}/>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <label className="flex flex-col gap-1.5 min-w-0">
          <span className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>Peso (kg)</span>
          <input type="text" inputMode="decimal" autoComplete="off" value={weightText}
            aria-label={`Peso em kg da série ${series.setNumber}`}
            onChange={e => changeWeight(e.target.value)}
            onBlur={() => setWeightText(series.weight ? String(series.weight) : '')}
            placeholder="0" className="w-full min-w-0 rounded-lg px-3 py-3 text-base text-center font-semibold"
            style={{ background: 'var(--surface)', color: 'var(--text)' }}/>
        </label>
        <label className="flex flex-col gap-1.5 min-w-0">
          <span className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>Repetições</span>
          <input type="text" inputMode="numeric" autoComplete="off" value={repsText}
            aria-label={`Repetições da série ${series.setNumber}`}
            onChange={e => changeReps(e.target.value)}
            onBlur={() => setRepsText(series.reps ? String(series.reps) : '')}
            placeholder="0" className="w-full min-w-0 rounded-lg px-3 py-3 text-base text-center font-semibold"
            style={{ background: 'var(--surface)', color: 'var(--text)' }}/>
        </label>
      </div>
      {previous && !series.completed && (
        <button type="button" onClick={onRepeat}
          className="mt-2 flex items-center gap-1.5 text-xs py-1 text-left"
          style={{ color: 'var(--text-faint)' }}>
          <Repeat size={12}/>
          Última sessão, série {series.setNumber}: {previous.weight} kg × {previous.reps} reps · Repetir
        </button>
      )}
    </div>
  );
}
