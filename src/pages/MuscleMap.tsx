import { useMemo, useState } from 'react';
import { useAppData } from '../hooks/useAppData';
import { PageHeader, Card } from '../components/ui';
import { BodySilhouette } from '../components/BodySilhouette';
import type { SilhouetteGender } from '../components/BodySilhouette';
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_ORDER } from '../lib/exercises';
import type { MuscleGroup } from '../types';

const SILHOUETTE_GENDER_KEY = 'fitbox-silhouette-gender';

function loadSilhouetteGender(): SilhouetteGender {
  try {
    const saved = localStorage.getItem(SILHOUETTE_GENDER_KEY);
    return saved === 'masculino' || saved === 'feminino' ? saved : 'feminino';
  } catch {
    return 'feminino';
  }
}

// Cardio e "outro" não têm uma região de músculo desenhável no boneco (ver
// FRONT_GROUPS/BACK_GROUPS em BodySilhouette.tsx) — ficam de fora dos chips
// de filtro aqui, já que essa tela é especificamente sobre grupos musculares.
const FILTERABLE_GROUPS = MUSCLE_GROUP_ORDER.filter((g) => g !== 'cardio' && g !== 'outro') as MuscleGroup[];

/** Tela de navegação livre pelo mapa muscular: toca num grupo (ou na legenda)
 * pra ver esse músculo destacado nos dois bonecos (frente + costas) e a lista
 * de exercícios do catálogo que trabalham ele — pensada pra consultar antes
 * de montar o treino, complementando o destaque automático do treino do dia
 * que já existe na aba Medidas. Reaproveita o mesmo BodySilhouette/mapa
 * muscular original construído pra Medidas, sem nenhuma arte nova. */
export function MuscleMap() {
  const { exercises } = useAppData();
  const [gender, setGender] = useState<SilhouetteGender>(loadSilhouetteGender);
  const [selected, setSelected] = useState<MuscleGroup | null>(null);

  function changeGender(g: SilhouetteGender) {
    setGender(g);
    try {
      localStorage.setItem(SILHOUETTE_GENDER_KEY, g);
    } catch {
      // localStorage indisponível — segue só no estado da sessão
    }
  }

  const highlightGroups = selected ? [selected] : [];

  const filteredExercises = useMemo(() => {
    if (!selected) return [];
    return exercises.filter((e) => e.muscleGroup === selected).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [exercises, selected]);

  return (
    <div className="px-4">
      <PageHeader title="Mapa muscular" />

      <p className="text-xs mb-4" style={{ color: 'var(--text-faint)' }}>
        Toque num grupo muscular pra ver ele destacado no boneco e os exercícios do catálogo que trabalham ele.
      </p>

      <Card className="mb-4">
        <div className="flex items-center justify-center mb-3">
          <div className="flex gap-1 rounded-full p-0.5" style={{ background: 'var(--surface-2)' }}>
            {(['feminino', 'masculino'] as SilhouetteGender[]).map((g) => (
              <button
                key={g}
                onClick={() => changeGender(g)}
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{
                  background: gender === g ? 'var(--brand)' : 'transparent',
                  color: gender === g ? 'white' : 'var(--text-faint)',
                }}
              >
                {g === 'feminino' ? 'Feminino' : 'Masculino'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-start justify-center gap-2">
          <div className="flex flex-col items-center flex-1" style={{ height: 220 }}>
            <BodySilhouette measurement={null} gender={gender} view="frente" highlightGroups={highlightGroups} />
          </div>
          <div className="flex flex-col items-center flex-1" style={{ height: 220 }}>
            <BodySilhouette measurement={null} gender={gender} view="costas" highlightGroups={highlightGroups} />
          </div>
        </div>
        <div className="flex justify-center gap-2 mt-1">
          <p className="text-xs flex-1 text-center" style={{ color: 'var(--text-faint)' }}>
            Frente
          </p>
          <p className="text-xs flex-1 text-center" style={{ color: 'var(--text-faint)' }}>
            Costas
          </p>
        </div>
      </Card>

      <div className="flex flex-wrap gap-1.5 mb-4">
        <FilterChip label="Todos" active={selected === null} onClick={() => setSelected(null)} />
        {FILTERABLE_GROUPS.map((g) => (
          <FilterChip key={g} label={MUSCLE_GROUP_LABELS[g]} active={selected === g} onClick={() => setSelected(g)} />
        ))}
      </div>

      {selected ? (
        <>
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-dim)' }}>
            Exercícios de {MUSCLE_GROUP_LABELS[selected]}
          </p>
          <div className="flex flex-col gap-2 pb-6">
            {filteredExercises.map((ex) => (
              <Card key={ex.id} className="!py-3">
                <p className="text-sm font-medium">{ex.name}</p>
                {ex.equipment && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                    {ex.equipment}
                  </p>
                )}
              </Card>
            ))}
            {filteredExercises.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-faint)' }}>
                Nenhum exercício de {MUSCLE_GROUP_LABELS[selected].toLowerCase()} no catálogo ainda.
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-center py-8" style={{ color: 'var(--text-faint)' }}>
          Escolha um grupo acima pra ver os exercícios dele.
        </p>
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-3 py-1.5 rounded-full font-medium"
      style={{
        background: active ? 'var(--brand)' : 'var(--surface-2)',
        color: active ? 'white' : 'var(--text-dim)',
      }}
    >
      {label}
    </button>
  );
}
