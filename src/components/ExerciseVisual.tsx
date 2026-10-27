import { useState } from 'react';
import { Dumbbell, Info, ImageOff, Scan } from 'lucide-react';
import { AnatomyMap } from './AnatomyMap';
import type { AnatomyGroup, AnatomyGender } from '../lib/anatomy';
import type { Exercise } from '../types';
import { MUSCLE_GROUP_LABELS } from '../lib/exercises';
import { exerciseMedia, exerciseGuidance, MOVEMENT_GROUP_LABELS } from '../lib/exerciseMedia';

function ExercisePhoto({ src, alt, compact = false }: { src: string; alt: string; compact?: boolean }) {
  const [broken, setBroken] = useState(false);
  if (broken) return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2"
      style={{ color:'var(--text-faint)' }}>
      <ImageOff size={20} /><span className="text-[10px]">Imagem indisponível</span>
    </div>
  );
  return <img src={src} alt={alt} loading="lazy" decoding="async"
    referrerPolicy="no-referrer" onError={() => setBroken(true)}
    className={compact ? 'w-full h-full object-contain' : 'w-full h-full object-contain p-1'} />;
}

/** Miniatura apenas quando existe correspondência exata verificada.
 * Sem imagem -> ícone neutro, nunca uma foto de outro exercício. */
export function ExerciseThumbnail({ exercise, size = 60 }: { exercise?: Exercise | null; size?: number }) {
  const images = exerciseMedia(exercise);
  return (
    <div className="rounded-xl shrink-0 overflow-hidden flex items-center justify-center"
      style={{ width:size, height:size, background:'#121416', border:'1px solid var(--border)' }}>
      {images ? <ExercisePhoto src={images.first} alt={`Demonstração de ${exercise?.name}: fase 1`} compact/> :
        <div className="flex flex-col items-center gap-1" style={{ color:'var(--brand)' }}>
          <Dumbbell size={size > 58 ? 20:16}/>
          {size > 58 && <span className="text-[8px] font-semibold">SEM FOTO</span>}
        </div>}
    </div>
  );
}

/** Mapa anatômico: foco predominante, não percentuais de ativação muscular. */
function anatomicalFocus(exercise: Exercise): AnatomyGroup | null {
  const name = exercise.name.toLowerCase();
  if (/panturrilha|tibial/.test(name)) return 'calves';
  if (/flexora|stiff|romeno|nordic|nórdico|posterior de coxa/.test(name)) return 'hamstrings';
  if (/adutora|adutor|adução/.test(name)) return 'adductors';
  if (/punho|antebraço|wrist|pronação|supinação/.test(name)) return 'forearms';
  const groups: Record<string, AnatomyGroup> = {
    peito:'chest',costas:'back',ombro:'shoulders',biceps:'biceps',
    triceps:'triceps',perna:'quadriceps',gluteo:'glutes',abdomen:'core',
  };
  return groups[exercise.muscleGroup] ?? null;
}

/** Duas fases estáticas do movimento, com rótulos claros e instruções
 * individuais somente quando validadas. A foto não é uma animação. */
export function ExerciseGuide({ exercise, compact = false }: { exercise?: Exercise | null; compact?: boolean }) {
  const [showAnatomy, setShowAnatomy] = useState(false);
  const [model, setModel] = useState<AnatomyGender>('masculino');
  const images = exerciseMedia(exercise);
  const steps = exerciseGuidance(exercise);
  if (!exercise) return null;
  const focus = anatomicalFocus(exercise);
  return (
    <section className="rounded-xl overflow-hidden p-3 flex flex-col gap-3"
      style={{ background:'var(--surface-2)', border:'1px solid var(--border)' }}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold" style={{ color:'var(--brand)' }}>Como executar</p>
          <p className="text-[11px] mt-0.5" style={{ color:'var(--text-faint)' }}>
            {MUSCLE_GROUP_LABELS[exercise.muscleGroup]} · {exercise.equipment || MOVEMENT_GROUP_LABELS[exercise.muscleGroup]}
          </p>
        </div>
        {images && <span className="text-[10px] px-2 py-1 rounded-full"
          style={{ background:'var(--brand-dim)', color:'var(--brand)' }}>2 fases</span>}
      </div>
      {images ? (
        <div className="grid grid-cols-2 gap-2">
          {[images.first,images.second].map((url,index)=>(
            <div key={url} className="rounded-xl overflow-hidden"
              style={{ background:'#101214', border:'1px solid var(--border)' }}>
              <div style={{ height:compact ? 106 : 156 }}>
                <ExercisePhoto src={url} alt={`${exercise.name} — referência visual ${index+1}`} />
              </div>
              <p className="text-[10px] text-center py-1.5"
                style={{ color:'var(--text-faint)' }}>Fase {index+1}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl px-3 py-3"
          style={{ background:'var(--surface)' }}>
          <ImageOff size={22} style={{color:'var(--text-faint)'}}/>
          <p className="text-xs" style={{color:'var(--text-dim)'}}>
            Ainda não há imagem de execução conferida para esta variação.
            Não exibimos imagens de exercícios diferentes.
          </p>
        </div>
      )}
      {!compact && focus && (
        <div>
          <button type="button" onClick={() => setShowAnatomy(v => !v)}
            className="flex items-center gap-2 text-xs font-semibold"
            style={{color:'var(--brand)'}} aria-expanded={showAnatomy}>
            <Scan size={14}/>{showAnatomy ? 'Ocultar modelo muscular' : 'Ver personagem anatômico e região predominante'}
          </button>
          {showAnatomy && (
            <div className="mt-2">
              <div className="flex gap-2 justify-center mb-2">
                <button type="button" onClick={() => setModel('masculino')}
                  aria-pressed={model==='masculino'} className="rounded-full px-3 py-1.5 text-xs"
                  style={{background:model==='masculino'?'var(--brand)':'var(--surface)',color:model==='masculino'?'white':'var(--text-dim)'}}>Modelo masculino</button>
                <button type="button" onClick={() => setModel('feminino')}
                  aria-pressed={model==='feminino'} className="rounded-full px-3 py-1.5 text-xs"
                  style={{background:model==='feminino'?'var(--brand)':'var(--surface)',color:model==='feminino'?'white':'var(--text-dim)'}}>Modelo feminino</button>
              </div>
              <AnatomyMap key={exercise.id+'-'+model} variant="compact" gender={model}
                initialSelectedGroups={[focus]}/>
              <p className="text-[10px] mt-1" style={{color:'var(--text-faint)'}}>
                Destaque aproximado do grupo muscular predominante; o exercício também pode recrutar outros músculos.
              </p>
            </div>
          )}
        </div>
      )}
      {steps && !compact && (
        <ol className="flex flex-col gap-1.5 list-decimal pl-4 text-xs" style={{ color:'var(--text-dim)' }}>
          {steps.map((step,index)=><li key={index}>{step}</li>)}
        </ol>
      )}
      {!compact && (
        <div className="flex items-start gap-1.5">
          <Info size={13} className="shrink-0 mt-0.5" style={{color:'var(--text-faint)'}}/>
          <p className="text-[10px]" style={{color:'var(--text-faint)'}}>
            Fotos estáticas, não animações. Imagens de exercícios da biblioteca aberta
            <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noopener noreferrer"
              className="underline ml-1">free-exercise-db</a>.
            A execução deve ser adaptada à sua mobilidade e à orientação profissional.
          </p>
        </div>
      )}
    </section>
  );
}
