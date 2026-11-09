import { READY_PROGRAMS, programPlace, programModality, type ReadyProgram, type ProgramPlace, type ProgramLevel } from './readyPrograms';
import { BUILTIN_EXERCISES } from './exercises';
import { createWorkout, addExerciseToWorkout, replaceWeeklySchedule } from './actions';
import { getActivitiesForDay } from './nextTraining';
import { WEEKDAY_ORDER, type Exercise, type Weekday, type WeeklySchedule } from '../types';
import { equipmentMatches, type EquipmentCategory } from './equipmentCategories';

export type BuilderGoal = 'emagrecimento' | 'hipertrofia' | 'hibrido' | 'corrida' | 'condicionamento';
export type BuilderMode = 'forca' | 'cardio' | 'hyrox';

export interface BuilderPrefs {
  goal: BuilderGoal;
  place: ProgramPlace;
  level: ProgramLevel;
  minutes: number;
  weekdays: Weekday[];
  modes: BuilderMode[];
  equipmentCategories: EquipmentCategory[];
}
export interface BuilderExercise {
  id: string;
  sets: number;
  reps: string;
  notes?: string;
  restSeconds?: number;
}
export interface BuilderWorkout {
  title: string;
  emoji: string;
  exercises: BuilderExercise[];
}
export interface BuilderSlot {
  weekday: Weekday;
  workoutIndex: number | null;
  cardio: boolean;
  cardioMinutes: number;
  cardioLabel: string;
}
export interface BuilderDraft {
  sourceIds: string[];
  workouts: BuilderWorkout[];
  slots: BuilderSlot[];
  warnings: string[];
}

export const DEFAULT_BUILDER_PREFS: BuilderPrefs = {
  goal: 'emagrecimento',
  place: 'academia',
  level: 'iniciante',
  minutes: 45,
  weekdays: ['seg','ter','qui','sex'],
  modes: ['forca','cardio'],
  equipmentCategories: [],
};
export const BUILDER_GOALS: Record<BuilderGoal,string> = {
  emagrecimento: 'Emagrecimento',
  hipertrofia: 'Ganhar massa e força',
  hibrido: 'Híbrido / HYROX',
  corrida: 'Corrida e resistência',
  condicionamento: 'Condicionamento geral',
};
export const BUILDER_MODES: Record<BuilderMode,string> = {
  forca: 'Musculação / força',
  cardio: 'Corrida / cardio',
  hyrox: 'HYROX / funcional',
};

export function placeCompatible(program: ReadyProgram, place: ProgramPlace): boolean {
  const source = programPlace(program);
  if (place === 'academia' || place === 'misto') return source === 'academia' || source === 'misto' || source === 'peso_corporal' || source === 'ar_livre';
  if (place === 'casa_equipamento') return source === 'casa_equipamento' || source === 'peso_corporal' || source === 'ar_livre';
  if (place === 'peso_corporal') return source === 'peso_corporal' || source === 'ar_livre';
  return source === 'ar_livre' || source === 'peso_corporal';
}
const workoutIds = new Set(BUILTIN_EXERCISES.map(e => e.id));

function rankProgram(p: ReadyProgram, prefs: BuilderPrefs): number {
  let score = 0;
  if (p.goal === prefs.goal) score += 12;
  if (prefs.goal === 'emagrecimento' && ['hibrido','corrida'].includes(p.goal)) score += 4;
  if (prefs.goal === 'condicionamento' && ['funcional','hibrido','emagrecimento'].includes(p.goal)) score += 8;
  if (prefs.goal === 'hibrido' && p.goal === 'hibrido') score += 8;
  if (prefs.goal === 'corrida' && p.goal === 'corrida') score += 9;
  if (prefs.modes.includes('hyrox') && /hyrox/i.test(p.id + ' ' + p.title)) score += 18;
  if (prefs.modes.includes('cardio') && ['hibrido','corrida'].includes(p.goal)) score += 3;
  if (prefs.modes.includes('forca') && ['forca','hibrido'].includes(programModality(p))) score += 3;
  if (p.level === prefs.level) score += 6;
  if (prefs.level === 'iniciante' && p.level === 'avancado') score -= 40;
  if (prefs.level === 'iniciante' && p.level === 'intermediario') score -= 10;
  if (p.sessionMinutes) score -= Math.min(8, Math.round(Math.abs(p.sessionMinutes - prefs.minutes)/10));
  score -= Math.min(5,Math.abs(p.days.length-prefs.weekdays.length));
  return score;
}

/** Choices are actual existing programs, filtered by equipment and real exercise IDs. */
export function findBuilderPrograms(prefs: BuilderPrefs): ReadyProgram[] {
  return READY_PROGRAMS
    .filter(p => !p.cardioPresetId && p.days.length > 0 && placeCompatible(p,prefs.place))
    .filter(p => prefs.level !== 'iniciante' || p.level !== 'avancado')
    .filter(p => p.days.some(d=>d.exercises.some(entry => {
      const ex=BUILTIN_EXERCISES.find(e=>e.id===entry.id);
      return ex && exerciseMatchesPlace(ex,prefs.place) && equipmentMatches(ex,prefs.equipmentCategories);
    })))
    .map((p,index) => ({p,index,score:rankProgram(p,prefs)}))
    .sort((a,b)=>b.score-a.score || a.index-b.index)
    .map(x=>x.p);
}

export function exerciseMatchesPlace(exercise: Exercise, place: ProgramPlace): boolean {
  if (place === 'academia' || place === 'misto') return true;
  const equipment = (exercise.equipment ?? '').toLocaleLowerCase('pt-BR');
  const name = exercise.name.toLocaleLowerCase('pt-BR');
  const restricted = /máquina|cabo|polia|smith|leg press|halter|kettlebell|barra w|barra reta|barra olímpica|peso livre|anilha|elástico|trx|step|ski|sled|trenó|sandbag|medicine|remo ergométrico|esteira|bike|bicicleta|corda naval/i;
  if (place === 'casa_equipamento') {
    if (/máquina|polia|cabo|smith|leg press|hack squat|ski|trenó|sled|remo ergométrico|esteira|bike|stairmaster/i.test(name+' '+equipment)) return false;
    return true;
  }
  if (restricted.test(name+' '+equipment)) return false;
  if (/barra fixa|argola|paralela|banco romano|banco inclinado|banco com|banco de/i.test(name+' '+equipment)) return false;
  return true;
}

function safeExercises(day: ReadyProgram['days'][number], prefs: BuilderPrefs): BuilderExercise[] {
  // Do not assign movements whose equipment is unavailable.
  const maxExercises = Math.max(3,Math.min(8,Math.floor(prefs.minutes / 8)));
  const available = day.exercises
    .filter(e => workoutIds.has(e.id))
    .filter(e => {
      const exercise = BUILTIN_EXERCISES.find(x => x.id === e.id);
      return exercise && exerciseMatchesPlace(exercise,prefs.place) && equipmentMatches(exercise,prefs.equipmentCategories);
    }).slice(0,maxExercises);
  return available.map(e=>({
    id:e.id,
    sets:Math.min(e.sets,prefs.level==='iniciante'?2:3),
    reps:e.reps,
    notes:e.notes,
    restSeconds:e.restSeconds,
  }));
}

export function createBuilderDraft(prefs: BuilderPrefs, mainId: string, inspirationId?: string): BuilderDraft {
  const primary = findBuilderPrograms(prefs).find(p=>p.id===mainId);
  if (!primary) throw new Error('Escolha um programa compatível com o local e seu nível.');
  const secondary = inspirationId && inspirationId !== primary.id
    ? findBuilderPrograms(prefs).find(p=>p.id===inspirationId)
    : undefined;
  const wantsStrength = prefs.modes.includes('forca') || prefs.modes.includes('hyrox');
  const days = WEEKDAY_ORDER.filter(day=>prefs.weekdays.includes(day));
  if (!days.length) throw new Error('Escolha pelo menos um dia.');
  if (!prefs.modes.length) throw new Error('Escolha pelo menos uma modalidade.');

  let desired = wantsStrength
    ? Math.min(days.length,primary.days.length,prefs.level==='iniciante'?3:5)
    : 0;
  if (prefs.modes.includes('cardio') && desired === days.length && days.length>=3) desired--;
  const workouts: BuilderWorkout[] = primary.days.map(day=>({
    title:day.name,
    emoji:day.emoji,
    exercises:safeExercises(day,prefs),
  })).filter(w=>w.exercises.length>0).slice(0,desired);

  const warnings: string[] = [];
  if (wantsStrength && !workouts.length) {
    warnings.push('Este programa não contém exercícios compatíveis. Escolha outro ou altere os equipamentos.');
  }
  if (secondary?.days.length && workouts.length >= 2) {
    const candidate = secondary.days.map(day=>({
      title:day.name, emoji:day.emoji, exercises:safeExercises(day,prefs),
    })).find(d=>d.exercises.length>=3);
    if (candidate) {
      // Nunca substituir uma ficha existente sem a escolha explícita da pessoa.
      // Acrescentar uma sessão separada somente quando há dia e recuperação
      // disponíveis; reservar um dia livre para cardio caso esteja habilitado.
      const strengthCap = Math.min(
        prefs.level==='iniciante'?3:5,
        Math.max(0, days.length - (prefs.modes.includes('cardio') ? 1 : 0)),
      );
      if (workouts.length < strengthCap) {
        const ids=new Set(workouts.map(w=>w.exercises.map(e=>e.id).join('|')));
        const signature=candidate.exercises.map(e=>e.id).join('|');
        if (!ids.has(signature)) {
          workouts.push({...candidate,title:candidate.title+' · segundo programa'});
          warnings.push('O segundo programa foi acrescentado como ficha independente. Confira dias de recuperação e volume semanal antes de salvar.');
        } else {
          warnings.push('O segundo programa repetiria uma ficha já incluída; não adicionamos uma duplicata.');
        }
      } else {
        warnings.push('Não há um dia de força disponível para combinar os dois programas sem sobrecarga. Mantivemos todas as fichas do programa-base; libere um dia de treino ou ajuste as modalidades.');
      }
    } else {
      warnings.push('O segundo programa não tinha uma ficha compatível com este equipamento; mantivemos o programa-base.');
    }
  }
  if (prefs.modes.includes('hyrox') && prefs.place!=='academia' && prefs.place!=='misto') {
    warnings.push('Estações oficiais HYROX exigem equipamentos específicos. Em casa, o app sugere força/condicionamento, não simula as estações oficiais.');
  }
  if (prefs.level === 'iniciante') {
    warnings.push('Início progressivo: até 3 sessões de força e até 2 séries por exercício. Ajuste a intensidade ao seu condicionamento.');
  }
  const slots: BuilderSlot[] = days.map((weekday,i)=>{
    const strengthIndex = workouts.length && i<workouts.length ? i : null;
    const cardioOnly = prefs.modes.includes('cardio') && (strengthIndex === null);
    return {weekday,workoutIndex:strengthIndex,cardio:cardioOnly,
      cardioMinutes:Math.max(10,Math.min(40,Math.round(prefs.minutes*0.55))),
      cardioLabel:prefs.modes.includes('hyrox') && prefs.place==='academia'
        ? 'Cardio leve / remo ou SkiErg' : 'Corrida ou caminhada confortável',
    };
  });
  // If strength-only, leave extra selected days free for recovery.
  // If only HYROX/strength without free cardio, no hidden extra workload.
  if (prefs.modes.includes('cardio') && slots.every(x=>!x.cardio)) {
    warnings.push('Você pode ativar cardio opcional em qualquer dia na próxima tela, sem ordem obrigatória.');
  }
  if (workouts.some(w=>w.exercises.length<3)) {
    warnings.push('Algumas fichas têm menos de 3 exercícios compatíveis; revise antes de salvar.');
  }
  return {sourceIds:[primary.id,...(secondary?[secondary.id]:[])],workouts,slots,warnings};
}

/** Apply only after explicit UI confirmation; does not remove old training/history.
 * Agenda mode APPENDS independent options to selected days instead of
 * replacing the user's whole week.
 */
export function saveBuilderDraft(draft: BuilderDraft, existingSchedule: WeeklySchedule, withSchedule: boolean): number {
  const referenced = new Set(draft.slots.map(x=>x.workoutIndex).filter((i):i is number=>i!==null));
  const newIds: Record<number,string> = {};
  for (const index of [...referenced].sort((a,b)=>a-b)) {
    const day = draft.workouts[index];
    if (!day || !day.exercises.length) continue;
    const w = createWorkout(day.title,day.emoji);
    newIds[index]=w.id;
    day.exercises.forEach(ex=>addExerciseToWorkout(w.id,ex.id,ex.sets,ex.reps,ex.notes,ex.restSeconds));
  }
  if (withSchedule) {
    const next: WeeklySchedule = {...existingSchedule};
    for (const slot of draft.slots) {
      const current = getActivitiesForDay(next[slot.weekday]);
      const newItems = [...current];
      const workoutIndex = slot.workoutIndex;
      const createdId = workoutIndex === null ? null : newIds[workoutIndex];
      if (createdId && !newItems.some(x=>x.kind==='treino' && x.workoutId===createdId)) {
        newItems.push({kind:'treino',workoutId:createdId});
      }
      if (slot.cardio && !newItems.some(x=>x.kind==='cardio' && x.label===slot.cardioLabel)) {
        newItems.push({kind:'cardio',label:slot.cardioLabel,suggestedDurationMin:slot.cardioMinutes});
      }
      if (newItems.length) next[slot.weekday] = {kind:'multi',activities:newItems};
    }
    replaceWeeklySchedule(next);
  }
  return Object.keys(newIds).length;
}
