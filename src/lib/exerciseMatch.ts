// Casamento "difuso" de nome de exercício (em português, digitado livremente
// pela IA) com o catálogo real de exercícios do app. A IA nunca recebe nem
// inventa um id de exercício — só o nome — então é aqui que a gente resolve
// esse nome pro Exercise de verdade (ou avisa que não achou nada parecido,
// pra quem chamar decidir se cria um exercício personalizado).

import type { Exercise } from '../types';

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(s: string): string[] {
  return normalize(s)
    .split(' ')
    .filter((t) => t.length > 1); // ignora tokens de 1 letra (ruído)
}

/** Quanto os conjuntos de tokens se sobrepõem, de 0 a 1 (Jaccard simplificado
 * sobre o menor conjunto — favorece nomes "contidos" um no outro, não só
 * idênticos palavra-por-palavra). */
function tokenOverlapScore(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  const shared = a.filter((t) => setB.has(t)).length;
  const smaller = Math.min(a.length, b.length);
  return shared / smaller;
}

/** Acha o exercício do catálogo mais parecido com o nome dado (em português
 * livre). Estratégia, em ordem: (1) nome normalizado idêntico; (2) um nome
 * contém o outro por inteiro; (3) sobreposição de tokens acima de um limiar.
 * Retorna null se nada bate o suficiente — quem chamar decide o que fazer
 * (ex: criar um exercício personalizado com esse nome). */
export function findExerciseByName(exercises: Exercise[], rawName: string): Exercise | null {
  const target = normalize(rawName);
  if (!target) return null;

  const exact = exercises.find((e) => normalize(e.name) === target);
  if (exact) return exact;

  const contained = exercises.find((e) => {
    const n = normalize(e.name);
    return n.length > 3 && target.length > 3 && (n.includes(target) || target.includes(n));
  });
  if (contained) return contained;

  const targetTokens = tokens(rawName);
  let best: { exercise: Exercise; score: number } | null = null;
  for (const e of exercises) {
    const score = tokenOverlapScore(targetTokens, tokens(e.name));
    if (score > (best?.score ?? 0)) best = { exercise: e, score };
  }
  if (best && best.score >= 0.5) return best.exercise;

  return null;
}
