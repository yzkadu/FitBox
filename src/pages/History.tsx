import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Trophy, Trash2, Camera } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { getPersonalRecord, getTrainedExerciseIds } from '../lib/stats';
import { deleteSession } from '../lib/actions';
import { PageHeader, Card, EmptyState, Pill } from '../components/ui';

export function History() {
  const { sessions, exercises } = useAppData();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const exerciseById = new Map(exercises.map((e) => [e.id, e]));
  const finished = sessions
    .filter((s) => s.finishedAt)
    .sort((a, b) => Date.parse(b.finishedAt as string) - Date.parse(a.finishedAt as string));

  const records = useMemo(() => {
    return getTrainedExerciseIds(sessions)
      .map((id) => ({ exercise: exerciseById.get(id), pr: getPersonalRecord(sessions, id) }))
      .filter((r) => r.exercise && r.pr)
      .sort((a, b) => (b.pr!.estimated1RM ?? 0) - (a.pr!.estimated1RM ?? 0))
      .slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, exerciseById]);

  if (finished.length === 0) {
    return (
      <div className="px-4">
        <PageHeader title="Histórico" />
        <EmptyState title="Nenhum treino concluído ainda" subtitle="Complete um treino para ver seu histórico aqui." />
      </div>
    );
  }

  return (
    <div className="px-4">
      <PageHeader title="Histórico" />

      {records.length > 0 && (
        <div className="mb-5">
          <p className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}>
            <Trophy size={14} style={{ color: 'var(--warn)' }} /> Recordes pessoais
          </p>
          <div className="flex flex-col gap-2">
            {records.map(({ exercise, pr }) => (
              <button
                key={exercise!.id}
                onClick={() => navigate(`/exercicio/${exercise!.id}`)}
                className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left"
                style={{ background: 'var(--surface)' }}
              >
                <span className="text-sm">{exercise!.name}</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>
                  {pr!.maxWeight}kg × {pr!.maxWeightReps}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-dim)' }}>
        Sessões
      </p>
      <div className="flex flex-col gap-2.5 pb-6">
        {finished.map((s) => {
          const isOpen = expanded === s.id;
          const totalVolume = s.exercises.reduce(
            (sum, se) => sum + se.sets.reduce((sv, st) => sv + st.weight * st.reps, 0),
            0,
          );
          const totalSets = s.exercises.reduce((sum, se) => sum + se.sets.length, 0);
          const mins = s.durationSeconds ? Math.round(s.durationSeconds / 60) : null;

          return (
            <Card key={s.id} className="!p-0 overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : s.id)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left"
              >
                <div>
                  <p className="text-sm font-medium">{s.workoutName}</p>
                  <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                    {new Date(s.finishedAt as string).toLocaleDateString('pt-BR', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                    })}
                    {mins !== null && ` · ${mins} min`} · {totalSets} séries
                    {s.rpe != null && ` · RPE ${s.rpe}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {s.proofPhotoDataUrl && <Camera size={14} style={{ color: 'var(--success)' }} />}
                  <ChevronDown
                    size={18}
                    style={{ color: 'var(--text-faint)', transform: isOpen ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }}
                  />
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex flex-col gap-3 mt-3">
                    {s.exercises.map((se) => {
                      const ex = exerciseById.get(se.exerciseId);
                      return (
                        <div key={se.id}>
                          <p className="text-xs font-medium mb-1">{ex?.name ?? 'Exercício'}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {se.sets.map((st) => (
                              <Pill key={st.id} tone={st.completed ? 'success' : 'default'}>
                                {st.weight}kg × {st.reps}
                              </Pill>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-xs pt-1" style={{ color: 'var(--text-faint)' }}>
                      Volume total: {Math.round(totalVolume)}kg
                    </p>

                    {s.proofPhotoDataUrl && (
                      <img src={s.proofPhotoDataUrl} alt="Prova do treino" className="w-20 h-20 rounded-lg object-cover" />
                    )}

                    {confirmDelete === s.id ? (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="flex-1 text-xs py-2 rounded-lg"
                          style={{ background: 'var(--surface-2)' }}
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => {
                            deleteSession(s.id);
                            setConfirmDelete(null);
                          }}
                          className="flex-1 text-xs py-2 rounded-lg text-white"
                          style={{ background: 'var(--danger)' }}
                        >
                          Confirmar exclusão
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(s.id)}
                        className="flex items-center gap-1.5 text-xs pt-1"
                        style={{ color: 'var(--text-faint)' }}
                      >
                        <Trash2 size={12} /> Excluir sessão
                      </button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
