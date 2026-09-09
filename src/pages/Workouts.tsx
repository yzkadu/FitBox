import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Dumbbell, ChevronRight, Trash2 } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { createWorkout, deleteWorkout } from '../lib/actions';
import { PageHeader, Card, Button, EmptyState } from '../components/ui';

const EMOJIS = ['💪', '🏋️', '🔥', '🦵', '🫁', '🏃', '⚡', '🎯'];

export function Workouts() {
  const { workouts } = useAppData();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const active = workouts.filter((w) => !w.archived);

  function handleCreate() {
    if (!name.trim()) return;
    const w = createWorkout(name.trim(), emoji);
    setCreating(false);
    setName('');
    navigate(`/treinos/${w.id}`);
  }

  return (
    <div className="px-4">
      <PageHeader
        title="Meus treinos"
        right={
          <button
            onClick={() => setCreating(true)}
            aria-label="Novo treino"
            className="p-2 rounded-full"
            style={{ background: 'var(--brand-dim)', color: 'var(--brand)' }}
          >
            <Plus size={20} />
          </button>
        }
      />

      {creating && (
        <Card className="mb-4">
          <p className="text-sm font-medium mb-2">Novo treino</p>
          <div className="flex gap-2 mb-3">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className="w-9 h-9 rounded-lg text-lg flex items-center justify-center"
                style={{
                  background: emoji === e ? 'var(--brand)' : 'var(--surface-2)',
                }}
              >
                {e}
              </button>
            ))}
          </div>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Ex: Treino A - Peito e Tríceps"
            className="w-full rounded-xl px-3 py-2.5 text-sm mb-3"
            style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
          />
          <div className="flex gap-2">
            <Button variant="secondary" full onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            <Button full onClick={handleCreate}>
              Criar
            </Button>
          </div>
        </Card>
      )}

      {active.length === 0 && !creating ? (
        <EmptyState
          title="Nenhum treino criado ainda"
          subtitle="Monte seu primeiro treino para começar a registrar seu progresso."
          action={
            <Button onClick={() => setCreating(true)}>
              <span className="flex items-center gap-2">
                <Plus size={16} /> Criar treino
              </span>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2.5 pb-4">
          {active.map((w) =>
            confirmDeleteId === w.id ? (
              <Card key={w.id} className="flex items-center justify-between gap-3">
                <p className="text-sm">Excluir "{w.name}"? O histórico de treinos realizados é mantido.</p>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-xs px-2 py-1.5 rounded-lg"
                    style={{ background: 'var(--surface-2)' }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      deleteWorkout(w.id);
                      setConfirmDeleteId(null);
                    }}
                    className="text-xs px-2 py-1.5 rounded-lg text-white flex items-center gap-1"
                    style={{ background: 'var(--danger)' }}
                  >
                    <Trash2 size={12} /> Excluir
                  </button>
                </div>
              </Card>
            ) : (
              <Card key={w.id} className="!p-0 overflow-hidden">
                <div className="flex items-center">
                  <button
                    onClick={() => navigate(`/treinos/${w.id}`)}
                    className="flex-1 flex items-center gap-3 px-4 py-3.5 text-left"
                  >
                    <span className="text-2xl">{w.emoji ?? '💪'}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{w.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                        {w.exercises.length} exercício{w.exercises.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <ChevronRight size={18} style={{ color: 'var(--text-faint)' }} />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(w.id)}
                    className="px-3 self-stretch flex items-center"
                    style={{ color: 'var(--text-faint)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            ),
          )}
        </div>
      )}

      {active.length > 0 && (
        <div className="flex items-center gap-2 mt-2 mb-6 text-xs" style={{ color: 'var(--text-faint)' }}>
          <Dumbbell size={14} />
          <span>Toque em um treino para editar os exercícios</span>
        </div>
      )}
    </div>
  );
}
