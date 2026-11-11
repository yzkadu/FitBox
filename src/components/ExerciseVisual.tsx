import { useEffect, useState } from 'react';
import { Dumbbell, Info, ImageOff, Maximize2, Minimize2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { AnatomyMap } from './AnatomyMap';
import { ANATOMY_GROUP_LABELS } from '../lib/anatomy';
import type { AnatomyGender } from '../lib/anatomy';
import type { Exercise } from '../types';
import { MUSCLE_GROUP_LABELS } from '../lib/exercises';
import { exerciseMedia, exerciseGuidance } from '../lib/exerciseMedia';
import { ExerciseAnatomy, getExerciseAnatomicalFocus, preferredAnatomicalView } from './ExerciseAnatomy';
import { getExerciseAnatomicalProfile, getRegionLabel } from '../lib/anatomicalProfiles';

function ExercisePhoto({ src, alt, spriteIndex, spriteRows = 8, spriteAspectRatio = '280 / 205', standaloneCard = false }: {
  src: string; alt: string; spriteIndex?: number; spriteRows?: number; spriteAspectRatio?: string; standaloneCard?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  useEffect(() => { setBroken(false); }, [src, spriteIndex, spriteRows]);
  const invalidSprite = spriteIndex !== undefined && (!Number.isInteger(spriteIndex) || spriteIndex < 0 || spriteIndex >= spriteRows * 5);
  if (spriteIndex !== undefined) {
    // Quadro n de atlas com 5 colunas e quantidade variável de linhas.
    // Evita fotos antigas e URLs inexistentes: o binário está no próprio deploy.
    const column = spriteIndex % 5;
    const row = Math.floor(spriteIndex / 5);
    return (
      <div className="w-full flex items-center justify-center relative"
        style={{ background: 'white', minHeight: 32 }}>
        {broken || invalidSprite ? (
          <div role="img" aria-label={alt + ': ilustração indisponível'}
            className="flex items-center justify-center gap-1 px-1 py-3 text-center"
            style={{color:'var(--text-faint)'}}>
            <ImageOff size={17} aria-hidden="true" />
            <span className="text-[10px]">Ilustração indisponível</span>
          </div>
        ) : (
          <>
            {/* O CSS não emite onError. Uma imagem de verificação permite detectar
                assets removidos ou falhas na rede sem exibir um cartão vazio. */}
            <img src={src} alt="" aria-hidden="true" loading="lazy"
              onError={() => setBroken(true)}
              className="absolute w-px h-px opacity-0 pointer-events-none" />
            <div role="img" aria-label={alt} style={{
              width: '100%', aspectRatio: spriteAspectRatio,
              backgroundImage: `url("${src}")`,
              backgroundSize: `500% ${spriteRows * 100}%`,
              backgroundPosition: `${column * 25}% ${spriteRows > 1 ? row * 100 / (spriteRows - 1) : 0}%`,
              backgroundRepeat: 'no-repeat',
            }}/>
          </>
        )}
      </div>
    );
  }
  return (
    <div className={standaloneCard ? "w-full" : "w-full h-full"} style={{ background: 'var(--surface)' }}>
      {broken ? (
        <div className="flex flex-col items-center justify-center h-full gap-1 p-2"
          style={{ color: 'var(--text-faint)' }}>
          <ImageOff size={18}/>
          <span className="text-[10px] text-center">Foto indisponível</span>
        </div>
      ) : (
        <img src={src} alt={alt} loading="lazy" decoding="async"
          referrerPolicy="no-referrer" onError={() => setBroken(true)}
          className={standaloneCard ? "block w-full h-auto object-contain p-1" : "w-full h-full object-contain p-1"}
          style={{ objectPosition: 'center center' }}/>
      )}
    </div>
  );
}

/** Todas as miniaturas seguem a identidade preta/roxa do mapa muscular FitBox.
 * As fotos de execução são usadas somente onde o movimento foi vinculado por ID.
 */
export function ExerciseThumbnail({ exercise, size = 60 }: { exercise?: Exercise | null; size?: number }) {
  const focus = getExerciseAnatomicalFocus(exercise);
  const media = exerciseMedia(exercise);
  return (
    <div className="rounded-xl shrink-0 overflow-hidden flex items-center justify-center"
      style={{ width: size, height: size, background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
      {media ? (
        <ExercisePhoto
          src={media.first}
          spriteIndex={media.spriteIndex}
          spriteRows={media.spriteRows}
          spriteAspectRatio={media.spriteAspectRatio}
          alt={exercise?.name ? 'Execução: ' + exercise.name : 'Ilustração de exercício'}
        />
      ) : focus ? (
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
  const [showSecondPosition, setShowSecondPosition] = useState(false);

  const focus = getExerciseAnatomicalFocus(exercise);
  const anatomicalProfile = getExerciseAnatomicalProfile(exercise ?? undefined);
  const images = exerciseMedia(exercise);
  const steps = exerciseGuidance(exercise);

  // A segunda fotografia continua disponível, sem ocupar espaço por padrão.
  useEffect(() => { setShowSecondPosition(false); }, [exercise?.id]);

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
          {images ? (images.kind === 'ilustracao' ? 'Ilustração do exercício' : images.second ? 'Foto real · posição extra' : 'Foto real') : 'Sem foto validada'}
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
            <p className="text-[10px] font-semibold">{focus ? "Músculos" : "Atividade"}</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--brand)' }}>
              {focus ? ANATOMY_GROUP_LABELS[focus] : exercise.muscleGroup === 'cardio' ? 'Condicionamento' : MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
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
              <div className="grid grid-cols-1 gap-1.5 min-w-0">
                {[images.first].map((src, index) => (
                  <div key={src} className="rounded-lg overflow-hidden min-w-0"
                    style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                    <div className={(images.spriteIndex !== undefined && index === 0) || (images.standaloneCard && index === 0)
                      ? 'w-full'
                      : compact ? 'h-[130px] sm:h-[162px]' : 'h-[172px] sm:h-[205px]'}>
                      <ExercisePhoto src={src} spriteIndex={index === 0 ? images.spriteIndex : undefined}
                        spriteRows={images.spriteRows} spriteAspectRatio={images.spriteAspectRatio}
                        standaloneCard={images.standaloneCard}
                        alt={exercise.name + (images.kind === 'ilustracao' ? ' — ilustração do movimento' : ' — fotografia real ' + (index + 1))}/>
                    </div>
                    <p className="text-[10px] py-1.5 text-center"
                      style={{ color: 'var(--text-faint)' }}>
                      {images.kind === 'ilustracao' ? 'Ilustração de execução' : images.second ? 'Posição ' + (index + 1) : 'Foto real do exercício'}
                    </p>
                  </div>
                ))}
              </div>
              {images.second && (
                <div className="flex flex-col gap-2">
                  <button type="button" onClick={() => setShowSecondPosition(value => !value)}
                    aria-expanded={showSecondPosition}
                    aria-label={showSecondPosition ? 'Ocultar segunda posição do exercício' : 'Ver segunda posição do exercício'}
                    className="self-start text-xs font-medium rounded-lg px-3 py-2"
                    style={{ background:'var(--surface)',color:'var(--brand)',border:'1px solid var(--border)' }}>
                    {showSecondPosition ? 'Ocultar segunda posição' : 'Ver segunda posição'}
                  </button>
                  {showSecondPosition && (
                    <div className="rounded-lg overflow-hidden min-w-0"
                      style={{border:'1px solid var(--border)',background:'var(--surface)'}}>
                      <div className={compact ? 'h-[130px] sm:h-[162px]' : 'h-[172px] sm:h-[205px]'}>
                        <ExercisePhoto src={images.second}
                          alt={exercise.name + ' — segunda fotografia da execução'}/>
                      </div>
                      <p className="text-[10px] py-1.5 text-center" style={{color:'var(--text-faint)'}}>
                        Posição complementar (2 de 2)
                      </p>
                    </div>
                  )}
                </div>
              )}
              <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-faint)' }}>
                {images.kind === 'ilustracao'
                  ? 'Representação ilustrada de uma posição do exercício. Consulte o passo a passo e ajuste a execução ao seu nível.'
                  : images.second
                    ? 'Uma fotografia principal; a segunda posição está disponível acima. Confira também o passo a passo.'
                    : 'Fotografia real mostrando uma posição do exercício. Para executar o movimento completo, siga as instruções abaixo.'}
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

      {anatomicalProfile && (
        <div className="rounded-lg p-3 text-xs" style={{background:'var(--surface)',border:'1px solid var(--border)'}}>
          <p className="font-semibold mb-1">Músculos trabalhados</p>
          <p><strong>Principal:</strong> {anatomicalProfile.primaryMuscles.join('; ')}</p>
          {anatomicalProfile.secondaryMuscles.length>0 && <p className="mt-1"><strong>Secundários:</strong> {anatomicalProfile.secondaryMuscles.join('; ')}</p>}
          {!compact && anatomicalProfile.stabilizers.length>0 && <p className="mt-1"><strong>Estabilizadores:</strong> {anatomicalProfile.stabilizers.join('; ')}</p>}
          {anatomicalProfile.regionTags.length>0 && <p className="mt-1" style={{color:'var(--text-dim)'}}>
            <strong>Ênfase:</strong> {anatomicalProfile.regionTags.map(getRegionLabel).join('; ')}
          </p>}
          <p className="mt-1 text-[10px]" style={{color:'var(--text-faint)'}}>Participação estimada pela biomecânica; não equivale a porcentagem de ativação.</p>
        </div>
      )}

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
            {images ? images.credit + ' ' : 'Ainda não há demonstração de execução revisada para esta variação. '}
            A técnica deve ser adaptada ao seu nível e às orientações profissionais.
            {images?.kind === 'foto' && (
              <a className="underline ml-1" href={images.sourceUrl ?? 'https://github.com/yuhonas/free-exercise-db'}
                target="_blank" rel="noopener noreferrer">Ver fotografia original e licença</a>
            )}
          </p>
        </div>
      )}
    </section>
  );
}
