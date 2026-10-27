import { useEffect, useState } from 'react';
import { Dumbbell, Info, ImageOff, Images, Scan } from 'lucide-react';
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
        <div className="flex flex-col items-center justify-center h-full gap-1"
          style={{color:'var(--text-faint)'}}>
          <ImageOff size={19}/><span className="text-[10px]">Foto indisponível</span>
        </div>
      ) : (
        <img src={src} alt={alt} loading="lazy" decoding="async"
          referrerPolicy="no-referrer" onError={() => setBroken(true)}
          className="w-full h-full object-contain p-1"/>
      )}
    </div>
  );
}

/** Thumbnail igual à identidade do mapa de medidas — não se usa fotografia
 * externa na capa dos exercícios. Imagens de execução ficam em seção separada.
 */
export function ExerciseThumbnail({ exercise, size = 60 }: { exercise?: Exercise | null; size?: number }) {
  const focus = getExerciseAnatomicalFocus(exercise);
  return (
    <div className="rounded-xl shrink-0 overflow-hidden flex items-center justify-center"
      style={{width:size, height:size, background:'var(--surface-0)', border:'1px solid var(--border)'}}>
      {focus ? (
        <ExerciseAnatomy focus={focus} view={preferredAnatomicalView(focus)} compact
          title={`Região muscular de ${exercise?.name}`}/>
      ) : (
        <Dumbbell size={size > 50 ? 22 : 17} style={{color:'var(--brand)'}}/>
      )}
    </div>
  );
}

/** A anatomia do FitBox é a visualização principal. Fotografias de duas fases
 * são materiais complementares e NÃO alteram o estilo dos cards.
 */
export function ExerciseGuide({ exercise, compact = false }: { exercise?: Exercise | null; compact?: boolean }) {
  const { user } = useAuth();
  const [profile] = useProfile(user?.id);
  const [model, setModel] = useState<AnatomyGender>('masculino');
  const [showPhotos, setShowPhotos] = useState(false);
  const [showFullMap, setShowFullMap] = useState(false);
  const focus = getExerciseAnatomicalFocus(exercise);
  const images = exerciseMedia(exercise);
  const steps = exerciseGuidance(exercise);

  useEffect(() => {
    if (profile?.gender) setModel(profile.gender);
  }, [profile?.gender]);

  if (!exercise) return null;

  return (
    <section className="rounded-xl overflow-hidden p-3 flex flex-col gap-3"
      style={{ background:'var(--surface-2)', border:'1px solid var(--border)' }}>
      <div>
        <p className="text-xs font-semibold" style={{color:'var(--brand)'}}>Exercício e execução</p>
        <p className="text-[11px] mt-1" style={{color:'var(--text-dim)'}}>
          {MUSCLE_GROUP_LABELS[exercise.muscleGroup]} · {exercise.equipment || MOVEMENT_GROUP_LABELS[exercise.muscleGroup]}
        </p>
      </div>

      {focus && (
        <>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold">Mapa muscular</p>
              <p className="text-[11px] mt-0.5" style={{color:'var(--text-faint)'}}>
                Destaque: {ANATOMY_GROUP_LABELS[focus]}
              </p>
            </div>
            <div className="flex gap-1">
              <button type="button" onClick={()=>setModel('masculino')}
                aria-pressed={model==='masculino'}
                className="text-[11px] rounded-full px-2 py-1.5"
                style={{color:model==='masculino'?'white':'var(--text-faint)',
                  background:model==='masculino'?'var(--brand)':'var(--surface)'}}>Masc.</button>
              <button type="button" onClick={()=>setModel('feminino')}
                aria-pressed={model==='feminino'}
                className="text-[11px] rounded-full px-2 py-1.5"
                style={{color:model==='feminino'?'white':'var(--text-faint)',
                  background:model==='feminino'?'var(--brand)':'var(--surface)'}}>Fem.</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['front','back'] as const).map((view)=>(
              <div key={view} className="rounded-xl overflow-hidden flex flex-col"
                style={{background:'var(--surface-0)',border:'1px solid var(--border)'}}>
                <div style={{height:compact ? 115 : 175}}>
                  <ExerciseAnatomy focus={focus} gender={model} view={view}/>
                </div>
                <p className="text-[10px] text-center py-2" style={{color:'var(--text-faint)'}}>
                  {view==='front'?'Frente':'Costas'}
                </p>
              </div>
            ))}
          </div>
          {!compact && (
            <button type="button" onClick={()=>setShowFullMap(v=>!v)}
              aria-expanded={showFullMap}
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{color:'var(--brand)'}}>
              <Scan size={14}/> {showFullMap ? 'Fechar mapa ampliado' : 'Ampliar personagem e mapa muscular'}
            </button>
          )}
          {showFullMap && !compact && (
            <AnatomyMap key={exercise.id+model} variant="compact"
              gender={model} initialSelectedGroups={[focus]}/>
          )}
          <p className="text-[10px]" style={{color:'var(--text-faint)'}}>
            Personagem original do FitBox. O destaque é aproximado e indica a região predominante,
            não uma medição de ativação muscular nem um movimento animado.
          </p>
        </>
      )}

      {!focus && (
        <div className="rounded-xl p-3 flex gap-2"
          style={{background:'var(--surface)'}}>
          <Dumbbell size={19} style={{color:'var(--brand)'}}/>
          <p className="text-xs" style={{color:'var(--text-dim)'}}>
            Atividade funcional, cardiovascular ou de mobilidade: não há um único músculo
            predominante para destacar no personagem.
          </p>
        </div>
      )}

      {!compact && (
        <>
          {steps ? (
            <ol className="list-decimal pl-4 flex flex-col gap-1.5 text-xs"
              style={{color:'var(--text-dim)'}}>
              {steps.map((step,index)=><li key={index}>{step}</li>)}
            </ol>
          ) : (
            <p className="text-xs" style={{color:'var(--text-faint)'}}>
              Instruções técnicas específicas ainda não revisadas para esta variação.
            </p>
          )}

          <button type="button" onClick={()=>setShowPhotos(v=>!v)}
            aria-expanded={showPhotos}
            className="rounded-xl px-3 py-2.5 flex items-center justify-between gap-2 text-xs font-semibold"
            style={{background:'var(--surface)',color:'var(--brand)'}}>
            <span className="flex items-center gap-2"><Images size={15}/>
              {showPhotos ? 'Ocultar fotografias de apoio' : 'Ver fotografias de execução (quando disponíveis)'}
            </span>
            <span style={{color:'var(--text-faint)'}}>{images ? '2 fases' : 'Sem fotos'}</span>
          </button>
          {showPhotos && (
            images ? (
              <div className="grid grid-cols-2 gap-2">
                {[images.first,images.second].map((src,index)=>(
                  <div key={src} className="overflow-hidden rounded-xl" style={{border:'1px solid var(--border)'}}>
                    <div style={{height:150}}>
                      <ExercisePhoto src={src} alt={`${exercise.name}: fotografia da fase ${index+1}`}/>
                    </div>
                    <p className="text-[10px] text-center py-1.5" style={{color:'var(--text-faint)'}}>
                      Fase {index+1}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs rounded-lg p-3" style={{background:'var(--surface)',color:'var(--text-faint)'}}>
                Ainda não há fotografias de execução conferidas para esta variação.
                O mapa anatômico indica somente os músculos, sem simular o exercício.
              </p>
            )
          )}
          <div className="flex gap-1.5">
            <Info size={13} className="shrink-0 mt-0.5" style={{color:'var(--text-faint)'}}/>
            <p className="text-[10px]" style={{color:'var(--text-faint)'}}>
              Fotografias complementares, quando existentes, vêm da biblioteca
              <a className="underline ml-1" href="https://github.com/yuhonas/free-exercise-db"
                target="_blank" rel="noopener noreferrer">free-exercise-db</a>.
              Confira a técnica com orientação adequada antes de aumentar a carga.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
