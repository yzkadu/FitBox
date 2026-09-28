import { useMemo, useState } from 'react';
import { useAppData } from '../hooks/useAppData';
import { PageHeader, Card } from '../components/ui';
import { AnatomyMap } from '../components/AnatomyMap';
import { ANATOMY_GROUP_LABELS, ANATOMY_GROUP_TO_MUSCLE_GROUP } from '../lib/anatomy';
import type { AnatomyGroup } from '../lib/anatomy';
import { MUSCLE_GROUP_LABELS } from '../lib/exercises';

/** Tela de navegação livre pelo mapa muscular: toca numa região (ou num chip
 * de grupo) do boneco pra ver os exercícios do catálogo relacionados.
 *
 * Nota de escopo (ver claude/fitbox-status.md, v19): o boneco tem 12 grupos
 * bem granulares (ex. "Posterior de coxa" e "Adutores" separados), mas o
 * catálogo de exercícios só marca o grupo grande (ex. "Perna") — por isso a
 * lista de exercícios abaixo é por grupo grande, não por região exata. Fica
 * um aviso na tela quando isso se aplica. */
export function MuscleMap() {
  const { exercises } = useAppData();
  const [activeGroups, setActiveGroups] = useState<AnatomyGroup[]>([]);

  const { matchedExercises, unmappedGroups } = useMemo(() => {
    if (activeGroups.length === 0) return { matchedExercises: [], unmappedGroups: [] as AnatomyGroup[] };

    const muscleGroups = new Set<string>();
    const unmapped: AnatomyGroup[] = [];
    activeGroups.forEach((g) => {
      const mg = ANATOMY_GROUP_TO_MUSCLE_GROUP[g];
      if (mg) muscleGroups.add(mg);
      else unmapped.push(g);
    });

    const matched = exercises
      .filter((e) => muscleGroups.has(e.muscleGroup))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    return { matchedExercises: matched, unmappedGroups: unmapped };
  }, [activeGroups, exercises]);

  const activeGroupLabel =
    activeGroups.length === 0
      ? null
      : activeGroups.map((g) => ANATOMY_GROUP_LABELS[g]).join(', ');

  return (
    <div className="px-4 lg:px-0">
      <PageHeader title="Mapa muscular" />

      <p className="text-xs mb-4" style={{ color: 'var(--text-faint)' }}>
        Toque num músculo (ou num chip de grupo) pra ver ele destacado no boneco e os exercícios do catálogo relacionados.
      </p>

      <Card className="mb-4">
        <AnatomyMap onActiveGroupsChange={setActiveGroups} />
      </Card>

      {activeGroups.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: 'var(--text-faint)' }}>
          Selecione um ou mais músculos acima pra ver os exercícios relacionados.
        </p>
      ) : (
        <>
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-dim)' }}>
            Exercícios de {activeGroupLabel}
          </p>

          {unmappedGroups.length > 0 && (
            <p className="text-xs mb-3 rounded-xl px-3 py-2.5" style={{ background: 'var(--surface-2)', color: 'var(--text-faint)' }}>
              {unmappedGroups.map((g) => ANATOMY_GROUP_LABELS[g]).join(', ')}: o catálogo de exercícios ainda não
              marca esse grupo especificamente — os exercícios que trabalham essa região aparecem hoje sob outro
              grupo do catálogo (ex. antebraço costuma entrar junto com bíceps/costas).
            </p>
          )}

          <div className="flex flex-col gap-2 pb-6">
            {matchedExercises.map((ex) => (
              <Card key={ex.id} className="!py-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{ex.name}</p>
                  {ex.equipment && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                      {ex.equipment}
                    </p>
                  )}
                </div>
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.06em] px-2 py-1 rounded-full shrink-0"
                  style={{ background: 'var(--brand-dim)', color: 'var(--brand)' }}
                >
                  {MUSCLE_GROUP_LABELS[ex.muscleGroup]}
                </span>
              </Card>
            ))}
            {matchedExercises.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-faint)' }}>
                Nenhum exercício do catálogo mapeado pra esse grupo ainda.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
