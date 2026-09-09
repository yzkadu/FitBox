import { useMemo, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Sheet } from './Sheet';
import { useAppData } from '../hooks/useAppData';
import { addCustomExercise } from '../lib/actions';
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_ORDER } from '../lib/exercises';
import type { Exercise, MuscleGroup } from '../types';

export function ExercisePicker({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}) {
  const { exercises } = useAppData();
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState<MuscleGroup>('outro');

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = exercises.filter((e) => e.name.toLowerCase().includes(q));
    const map = new Map<string, Exercise[]>();
    for (const group of MUSCLE_GROUP_ORDER) map.set(group, []);
    for (const ex of filtered) {
      if (!map.has(ex.muscleGroup)) map.set(ex.muscleGroup, []);
      map.get(ex.muscleGroup)!.push(ex);
    }
    return Array.from(map.entries()).filter(([, list]) => list.length > 0);
  }, [exercises, query]);

  function handleCreate() {
    if (!newName.trim()) return;
    const ex = addCustomExercise(newName.trim(), newGroup);
    onSelect(ex);
    setNewName('');
    setCreating(false);
    setQuery('');
  }

  return (
    <Sheet open={open} onClose={onClose} title="Escolher exercício">
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar exercício..."
          className="w-full rounded-xl pl-9 pr-3 py-2.5 text-sm"
          style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
        />
      </div>

      {!creating ? (
        <button
          onClick={() => {
            setCreating(true);
            setNewName(query);
          }}
          className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 mb-3 text-sm font-medium"
          style={{ background: 'var(--brand-dim)', color: 'var(--brand)' }}
        >
          <Plus size={16} /> Criar exercício personalizado
        </button>
      ) : (
        <div className="rounded-xl p-3 mb-3 flex flex-col gap-2" style={{ background: 'var(--surface-2)' }}>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome do exercício"
            className="rounded-lg px-3 py-2 text-sm"
            style={{ background: 'var(--bg)', color: 'var(--text)' }}
          />
          <select
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value as MuscleGroup)}
            className="rounded-lg px-3 py-2 text-sm"
            style={{ background: 'var(--bg)', color: 'var(--text)' }}
          >
            {MUSCLE_GROUP_ORDER.map((g) => (
              <option key={g} value={g}>
                {MUSCLE_GROUP_LABELS[g]}
              </option>
            ))}
          </select>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => setCreating(false)}
              className="flex-1 rounded-lg py-2 text-sm"
              style={{ background: 'var(--surface)', color: 'var(--text-dim)' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              className="flex-1 rounded-lg py-2 text-sm font-medium text-white"
              style={{ background: 'var(--brand)' }}
            >
              Adicionar
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {grouped.map(([group, list]) => (
          <div key={group}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-faint)' }}>
              {MUSCLE_GROUP_LABELS[group]}
            </p>
            <div className="flex flex-col gap-1">
              {list.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => onSelect(ex)}
                  className="text-left px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
                >
                  {ex.name}
                </button>
              ))}
            </div>
          </div>
        ))}
        {grouped.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-faint)' }}>
            Nenhum exercício encontrado.
          </p>
        )}
      </div>
    </Sheet>
  );
}
