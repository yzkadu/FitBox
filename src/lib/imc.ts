// Cálculo e classificação de IMC (Índice de Massa Corporal), com base na
// altura salva no perfil e no peso mais recente registrado em Medidas
// (ou no peso inicial do perfil, se ainda não houver nenhuma medição).
//
// Classificação segue as faixas padrão da OMS pra adultos. É só uma
// referência informativa — nunca deve ser apresentada como diagnóstico
// ou orientação médica/nutricional.

export interface ImcClassification {
  label: string;
  colorVar: string; // token de cor do chartTheme/CSS (status)
}

export function calcImc(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  if (heightM <= 0) return 0;
  return weightKg / (heightM * heightM);
}

export function classifyImc(imc: number): ImcClassification {
  if (imc < 18.5) return { label: 'Abaixo do peso', colorVar: 'var(--warn)' };
  if (imc < 25) return { label: 'Peso normal', colorVar: 'var(--success)' };
  if (imc < 30) return { label: 'Sobrepeso', colorVar: 'var(--warn)' };
  return { label: 'Obesidade', colorVar: 'var(--danger)' };
}

/** Faixa de peso (kg) correspondente a IMC considerado normal (18.5–24.9) pra uma altura. */
export function healthyWeightRangeKg(heightCm: number): [number, number] {
  const heightM = heightCm / 100;
  const min = 18.5 * heightM * heightM;
  const max = 24.9 * heightM * heightM;
  return [Math.round(min * 10) / 10, Math.round(max * 10) / 10];
}
