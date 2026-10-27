import type { Exercise } from '../types';
import type { AnatomyGender, AnatomyGroup, AnatomyView } from '../lib/anatomy';
import { ANATOMY_VIEWBOX } from '../lib/anatomy';
import maleFrontRegions from '../assets/anatomy/male-front.regions.svg?raw';
import maleBackRegions from '../assets/anatomy/male-back.regions.svg?raw';
import femaleFrontRegions from '../assets/anatomy/female-front.regions.svg?raw';
import femaleBackRegions from '../assets/anatomy/female-back.regions.svg?raw';

const MARKUP = {
  'male-front': maleFrontRegions,
  'male-back': maleBackRegions,
  'female-front': femaleFrontRegions,
  'female-back': femaleBackRegions,
} as const;

const FOCUS_BY_GROUP: Partial<Record<Exercise['muscleGroup'], AnatomyGroup>> = {
  peito: 'chest',
  costas: 'back',
  ombro: 'shoulders',
  biceps: 'biceps',
  triceps: 'triceps',
  perna: 'quadriceps',
  gluteo: 'glutes',
  abdomen: 'core',
};

export function getExerciseAnatomicalFocus(exercise?: Exercise | null): AnatomyGroup | null {
  if (!exercise) return null;
  const name = exercise.name.toLowerCase();
  if (/panturrilha|tibial/.test(name)) return 'calves';
  if (/flexora|stiff|romeno|nordic|nórdico|posterior de coxa/.test(name)) return 'hamstrings';
  if (/adutora|adutor|adução/.test(name)) return 'adductors';
  if (/punho|antebraço|wrist|pronação|supinação|farmer/.test(name)) return 'forearms';
  return FOCUS_BY_GROUP[exercise.muscleGroup] ?? null;
}

export function preferredAnatomicalView(focus: AnatomyGroup | null): AnatomyView {
  return focus && ['back','triceps','glutes','hamstrings','calves'].includes(focus) ? 'back' : 'front';
}

type Props = {
  focus: AnatomyGroup | null;
  gender?: AnatomyGender;
  view?: AnatomyView;
  compact?: boolean;
  title?: string;
};

/** Usa EXATAMENTE as imagens e os recortes SVG já existentes no mapa de
 * medidas. Não desenha um personagem diferente e não simula movimento.
 */
export function ExerciseAnatomy({ focus, gender = 'masculino', view = 'front', compact = false, title }: Props) {
  const model = gender === 'feminino' ? 'female' : 'male';
  const key = `${model}-${view}` as keyof typeof MARKUP;
  const fullViewBox = ANATOMY_VIEWBOX[key];
  const [, , width, height] = fullViewBox.split(' ').map(Number);

  // O recorte aproxima a área alvo sem cortar os músculos principais.
  // Para o guia detalhado, mantém a anatomia inteira.
  const crop = compact && focus
    ? focus === 'quadriceps' || focus === 'adductors' || focus === 'hamstrings' || focus === 'glutes'
      ? `25 390 ${width - 50} 470`
      : focus === 'calves' ? `45 660 ${width - 90} 345`
      : focus === 'core' ? `65 230 ${width - 130} 430`
      : `30 105 ${width - 60} 465`
    : fullViewBox;

  return (
    <svg role="img" aria-label={title ?? (focus ? `Modelo anatômico do grupo ${focus}` : 'Modelo anatômico')}
      viewBox={crop} preserveAspectRatio="xMidYMid meet" data-focus={focus ?? 'none'}
      className="exercise-anatomy w-full h-full" style={{ display:'block', background:'transparent' }}>
      <image href={`/anatomy/${model}-${view}.png`}
        x="0" y="0" width={width} height={height} preserveAspectRatio="xMidYMid meet" />
      {/* Conteúdo local SVG do próprio mapa de medidas, não fornecido pelo usuário. */}
      <g dangerouslySetInnerHTML={{ __html: MARKUP[key] }} />
    </svg>
  );
}
