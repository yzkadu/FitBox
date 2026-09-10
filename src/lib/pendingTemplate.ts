// Guarda, em memória, o template de programa escolhido no cadastro até o momento
// em que a conta termina de carregar (feito assim, e não direto no signup, pra
// garantir que o template só é aplicado depois que sabemos que a conta está vazia).
import type { ProgramTemplateId } from './seedPrograms';

let pending: ProgramTemplateId | null = null;

export function setPendingTemplate(template: ProgramTemplateId | null) {
  pending = template;
}

export function takePendingTemplate(): ProgramTemplateId | null {
  const t = pending;
  pending = null;
  return t;
}
