import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Trophy, Trash2, Camera, Pencil } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { getPersonalRecord, getTrainedExerciseIds } from '../lib/stats';
import { getSessionHistory, quickActivityName } from '../lib/sessionHistory';
import { deleteSession } from '../lib/actions';
import { PageHeader, Card, EmptyState, Pill } from '../components/ui';

export function History() {
  const { sessions, exercises, activityLogs } = useAppData();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting,setDeleting] = useState<string | null>(null);
  const [deleteError,setDeleteError] = useState('');

  const exerciseById = new Map(exercises.map((e) => [e.id, e]));
  const timeline = getSessionHistory(sessions, activityLogs);

  const records = useMemo(() => {
    return getTrainedExerciseIds(sessions)
      .map((id) => ({ exercise: exerciseById.get(id), pr: getPersonalRecord(sessions, id) }))
      .filter((r) => r.exercise && r.pr)
      .sort((a, b) => (b.pr!.estimated1RM ?? 0) - (a.pr!.estimated1RM ?? 0))
      .slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, exerciseById]);

  if (timeline.length === 0) {
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
      {deleteError && <p role="alert" className="text-xs rounded-lg px-3 py-2 mb-3"
        style={{color:'var(--danger)',background:'var(--surface-2)'}}>{deleteError}</p>}

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
      <p className="text-xs mb-3" style={{color:'var(--text-faint)'}}>
        Musculação, HYROX e outras atividades registradas no mesmo histórico.
      </p>
      <div className="flex flex-col gap-2.5 pb-6">
        {timeline.map((entry) => {
          if (entry.kind === 'activity') {
            const a = entry.activity;
            const key = 'quick-' + a.id;
            const isOpen = expanded === key;
            return (
              <Card key={key} className="!p-0 overflow-hidden">
                <button type="button" onClick={() => setExpanded(isOpen ? null : key)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{quickActivityName(a)}</p>
                    <p className="text-xs mt-1" style={{color:'var(--text-faint)'}}>
                      {new Date(a.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                        weekday:'short',day:'2-digit',month:'short',
                      })}
                      {' · '}{a.durationMin} min
                      {a.caloriesKcal != null ? ' · ' + a.caloriesKcal + ' kcal' : ''}
                      {a.rpe != null ? ' · RPE ' + a.rpe : ''}
                    </p>
                    <span className="text-[11px] font-medium" style={{color:'var(--brand)'}}>
                      Registro rápido
                    </span>
                  </div>
                  <ChevronDown size={18} style={{
                    color:'var(--text-faint)',transform:isOpen?'rotate(180deg)':undefined,
                    transition:'transform 0.15s',
                  }}/>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 border-t pt-3 flex flex-col gap-2 text-xs"
                    style={{borderColor:'var(--border)',color:'var(--text-dim)'}}>
                    <p>Atividade concluída · {a.durationMin} minutos
                      {a.caloriesKcal != null ? ' · ' + a.caloriesKcal + ' kcal' : ''}
                    </p>
                    {a.avgHeartRate != null && <p>FC média: {a.avgHeartRate} bpm</p>}
                    {a.rpe != null && <p>Esforço: {a.rpe}/10</p>}
                    {a.notes && <p className="whitespace-pre-wrap">{a.notes}</p>}
                    <button type="button" onClick={() => navigate('/atividades')}
                      className="text-xs font-semibold text-left mt-1" style={{color:'var(--brand)'}}>
                      Gerenciar registro rápido
                    </button>
                  </div>
                )}
              </Card>
            );
          }
          const s = entry.session;
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
                          disabled={deleting === s.id}
                          onClick={async () => {
                            if (deleting) return;
                            setDeleting(s.id);
                            setDeleteError('');
                            const result=await deleteSession(s.id);
                            setDeleting(null);
                            if (result.ok) setConfirmDelete(null);
                            else setDeleteError(result.error);
                          }}
                          className="flex-1 text-xs py-2 rounded-lg text-white"
                          style={{ background: 'var(--danger)' }}
                        >
                          {deleting === s.id ? 'Excluindo...' : 'Confirmar exclusão'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 pt-1">
                        <button
                          onClick={() => navigate(`/sessao/${s.id}/editar`)}
                          className="flex items-center gap-1.5 text-xs"
                          style={{ color: 'var(--brand)' }}
                        >
                          <Pencil size={12} /> Editar
                        </button>
                        <button
                          onClick={() => setConfirmDelete(s.id)}
                          className="flex items-center gap-1.5 text-xs"
                          style={{ color: 'var(--text-faint)' }}
                        >
                          <Trash2 size={12} /> Excluir sessão
                        </button>
                      </div>
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
