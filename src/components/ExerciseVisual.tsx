import { useEffect, useState } from 'react';
import { Dumbbell, Info, ImageOff, Maximize2, Minimize2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { AnatomyMap } from './AnatomyMap';
import { ANATOMY_GROUP_LABELS } from '../lib/anatomy';
import type { AnatomyGender } from '../lib/anatomy';
import type { Exercise } from '../types';
import { MUSCLE_GROUP_LABELS } from '../lib/exercises';
import { exerciseMedia, exerciseGuidance, MOVEMENT_GROUP_LABELS } from '../lib/exerciseMedia';
import { ExerciseAnatomy, getExerciseAnatomicalFocus, preferredAnatomicalView } from './ExerciseAnatomy';

function ExercisePhoto({ src, alt }: { src: string; alt: string }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className="w-full h-full" style={{ background: 'var(--surface)' }}>
      {broken ? (
        <div className="flex flex-col items-center justify-center h-full gap-1 p-2"
          style={{ color: 'var(--text-faint)' }}>
          <ImageOff size={18}/>
          <span className="text-[10px] text-center">Foto indisponível</span>
        </div>
      ) : (
        <img src={src} alt={alt} loading="lazy" decoding="async"
          referrerPolicy="no-referrer" onError={() => setBroken(true)}
          className="w-full h-full object-contain p-1"/>
      )}
    </div>
  );
}

/** Todas as miniaturas seguem a identidade preta/roxa do mapa muscular FitBox.
 * As fotos de execução são usadas somente onde o movimento foi vinculado por ID.
 */
export function ExerciseThumbnail({ exercise, size = 60 }: { exercise?: Exercise | null; size?: number }) {
  const focus = getExerciseAnatomicalFocus(exercise);
  return (
    <div className="rounded-xl shrink-0 overflow-hidden flex items-center justify-center"
      style={{ width: size, height: size, background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
      {focus ? (
        <ExerciseAnatomy focus={focus} view={preferredAnatomicalView(focus)} compact
          title={'Região muscular de ' + (exercise?.name ?? 'exercício')}/>
      ) : (
        <Dumbbell size={size > 50 ? 22 : 17} style={{ color: 'var(--brand)' }}/>
      )}
    </div>
  );
}

/** Visualização simultânea: 1) COMO EXECUTAR em destaque e
 * 2) MÚSCULOS TRABALHADOS em um mini-mapa lateral sempre visível.
 *
 * As duas posições fotografadas são da biblioteca com ID explicitamente
 * mapeado; o personagem anatômico NÃO simula o movimento. A expansão do mapa
 * é optativa, não toma o espaço principal por padrão.
 */
export function ExerciseGuide({ exercise, compact = false }: { exercise?: Exercise | null; compact?: boolean }) {
  const { user } = useAuth();
  const [profile] = useProfile(user?.id);
  const [model, setModel] = useState<AnatomyGender>('masculino');
  const [muscleExpanded, setMuscleExpanded] = useState(false);
  const [fullMapOpen, setFullMapOpen] = useState(false);
  const [stepsExpanded, setStepsExpanded] = useState(false);

  const focus = getExerciseAnatomicalFocus(exercise);
  const images = exerciseMedia(exercise);
  const steps = exerciseGuidance(exercise);

  useEffect(() => {
    if (profile?.gender) setModel(profile.gender);
  }, [profile?.gender]);

  if (!exercise) return null;

  return (
    <section className="rounded-xl border p-3 flex flex-col gap-3"
      style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Como executar</p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
            {exercise.name}
            {exercise.equipment ? ' · ' + exercise.equipment : ''}
          </p>
        </div>
        <span className="text-[10px] rounded-full px-2 py-1 shrink-0 font-semibold"
          style={{ background: 'var(--brand-dim)', color: 'var(--brand)' }}>
          {images ? '2 fases' : 'Guia'}
        </span>
      </div>

      <div className="grid grid-cols-[88px_minmax(0,1fr)] sm:grid-cols-[120px_minmax(0,1fr)] gap-2.5 items-stretch">
        <aside className="rounded-xl overflow-hidden flex flex-col min-w-0"
          style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
          <div className="h-[125px] sm:h-[158px]">
            {focus ? (
              <ExerciseAnatomy focus={focus} gender={model} view={preferredAnatomicalView(focus)}
                title={'Mapa muscular: ' + ANATOMY_GROUP_LABELS[focus]}/>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Dumbbell size={25} style={{ color: 'var(--brand)' }}/>
              </div>
            )}
          </div>
          <div className="px-1.5 pb-2 text-center">
            <p className="text-[10px] font-semibold">Músculos</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--brand)' }}>
              {focus ? ANATOMY_GROUP_LABELS[focus] : MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
            </p>
            {focus && !compact && (
              <button type="button" onClick={() => setMuscleExpanded(v => !v)}
                aria-expanded={muscleExpanded}
                className="mt-1 text-[10px] font-medium underline underline-offset-2"
                style={{ color: 'var(--text-dim)' }}>
                {muscleExpanded ? 'Reduzir' : 'Ampliar'}
              </button>
            )}
          </div>
        </aside>

        <div className="min-w-0 flex flex-col gap-2">
          {images ? (
            <>
              <div className="grid grid-cols-2 gap-1.5 min-w-0">
                {[images.first, images.second].map((src, index) => (
                  <div key={src} className="rounded-lg overflow-hidden min-w-0"
                    style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                    <div className={compact ? 'h-[96px] sm:h-[132px]' : 'h-[125px] sm:h-[158px]'}>
                      <ExercisePhoto src={src}
                        alt={exercise.name + ' — fotografia da fase ' + (index + 1)}/>
                    </div>
                    <p className="text-[10px] py-1.5 text-center"
                      style={{ color: 'var(--text-faint)' }}>
                      {index === 0 ? 'Fase 1' : 'Fase 2'}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-faint)' }}>
                Posições de referência; as fotografias não são uma animação do movimento.
              </p>
            </>
          ) : (
            <div className="flex-1 rounded-lg p-3 flex flex-col justify-center gap-1.5"
              style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                Orientação do movimento
              </p>
              {steps ? (
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                  {steps[0]}
                </p>
              ) : (
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                  Demonstração visual específica ainda não revisada. Consulte orientação
                  profissional antes de executar uma variação desconhecida.
                </p>
              )}
              <span className="text-[10px]" style={{ color: 'var(--brand)' }}>Sem fotos verificadas</span>
            </div>
          )}
        </div>
      </div>

      {steps && (
        <div className="rounded-lg p-3" style={{ background: 'var(--surface)' }}>
          <p className="text-xs font-semibold mb-2">Passo a passo</p>
          <ol className="list-decimal pl-4 flex flex-col gap-1.5 text-xs leading-relaxed"
            style={{ color: 'var(--text-dim)' }}>
            {(compact && !stepsExpanded ? steps.slice(0, 2) : steps).map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
          {compact && steps.length > 2 && (
            <button type="button" onClick={() => setStepsExpanded(v => !v)}
              className="text-xs mt-2" style={{ color: 'var(--brand)' }}>
              {stepsExpanded ? 'Mostrar menos' : 'Ver todos os passos'}
            </button>
          )}
        </div>
      )}

      {!compact && focus && muscleExpanded && (
        <div className="rounded-xl p-3 flex flex-col gap-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold">Músculos trabalhados</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--brand)' }}>
                {ANATOMY_GROUP_LABELS[focus]} · destaque predominante
              </p>
            </div>
            <button type="button" onClick={() => setMuscleExpanded(false)}
              aria-label="Reduzir mapa muscular" style={{ color: 'var(--brand)' }}>
              <Minimize2 size={17}/>
            </button>
          </div>
          <div className="flex gap-1.5">
            {(['masculino', 'feminino'] as const).map(gender => (
              <button type="button" key={gender} aria-pressed={model === gender}
                onClick={() => setModel(gender)} className="px-3 py-1.5 rounded-full text-xs"
                style={{
                  background: model === gender ? 'var(--brand)' : 'var(--surface-2)',
                  color: model === gender ? 'white' : 'var(--text-dim)',
                }}>
                {gender === 'masculino' ? 'Masculino' : 'Feminino'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['front', 'back'] as const).map(view => (
              <div key={view} className="rounded-xl overflow-hidden"
                style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
                <div className="h-[160px] sm:h-[200px]">
                  <ExerciseAnatomy focus={focus} gender={model} view={view}/>
                </div>
                <p className="text-[10px] text-center py-1.5"
                  style={{ color: 'var(--text-faint)' }}>
                  {view === 'front' ? 'Frente' : 'Costas'}
                </p>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setFullMapOpen(v => !v)}
            aria-expanded={fullMapOpen}
            className="text-xs font-medium flex items-center gap-1.5"
            style={{ color: 'var(--brand)' }}>
            <Maximize2 size={13}/>
            {fullMapOpen ? 'Ocultar mapa completo' : 'Abrir mapa completo'}
          </button>
          {fullMapOpen && (
            <AnatomyMap key={exercise.id + model} variant="compact"
              gender={model} initialSelectedGroups={[focus]}/>
          )}
          <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
            Personagem original do FitBox. O destaque muscular é aproximado e
            não representa a execução ou intensidade de ativação.
          </p>
        </div>
      )}

      {!compact && (
        <div className="flex items-start gap-1.5">
          <Info size={13} className="shrink-0 mt-0.5"
            style={{ color: 'var(--text-faint)' }}/>
          <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
            {images
              ? 'Fotografias de referência da biblioteca aberta free-exercise-db. '
              : 'Ainda não há fotografia de execução revisada para esta variação. '}
            A técnica deve ser adaptada ao seu nível e às orientações profissionais.
            {images && (
              <a className="underline ml-1" href="https://github.com/yuhonas/free-exercise-db"
                target="_blank" rel="noopener noreferrer">Fonte das fotos</a>
            )}
          </p>
        </div>
      )}
    </section>
  );
}
