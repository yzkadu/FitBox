// A correspondência da IA deve preservar a variante real (pegada/equipamento).
// Um casamento impreciso pode sugerir execução errada e afetar a segurança.

import type { Exercise } from '../types';

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokens(value: string): Set<string> {
  return new Set(normalize(value).split(' ').filter(word => word.length > 1));
}

function score(a: Set<string>, b: Set<string>): number {
  const shared = [...a].filter(t => b.has(t)).length;
  const union = new Set([...a,...b]).size;
  return union ? shared / union : 0;
}

export function findExerciseByName(exercises: Exercise[], rawName: string): Exercise | null {
  const target = normalize(rawName);
  if (!target) return null;
  const exact = exercises.find(ex => normalize(ex.name) === target);
  if (exact) return exact;

  // Nada de localizar "supino inclinado" dentro de "supino inclinado com barra"
  // quando também existe a versão com halteres.
  const inputTokens = tokens(target);
  const results = exercises.map(ex => ({ exercise:ex, score: score(inputTokens,tokens(ex.name)) }))
    .sort((a,b)=>b.score-a.score);
  const best = results[0];
  const runnerUp = results[1];
  if (!best || best.score < 0.82) return null;
  if (runnerUp && best.score-runnerUp.score < 0.09) return null;
  return best.exercise;
}
