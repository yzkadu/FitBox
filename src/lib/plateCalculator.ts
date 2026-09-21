// Calculadora de anilhas: dado um peso total (barra + anilhas) e o peso da
// barra, calcula quais anilhas colocar de cada lado usando o conjunto padrão
// de anilhas em kg (guloso: sempre a maior anilha que ainda cabe).

export const BAR_WEIGHT_OPTIONS = [20, 15, 10] as const;

const STANDARD_PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5];

export interface PlateBreakdown {
  /** Anilhas de UM lado da barra, da maior pra menor. */
  perSide: number[];
  /** Soma das anilhas de um lado só. */
  totalPerSide: number;
  barWeight: number;
  /** Peso total real alcançado (pode diferir do pedido se não fechar exato). */
  totalWeight: number;
  /** true se o peso pedido é exatamente alcançável com o conjunto padrão. */
  exact: boolean;
}

export function calculatePlates(targetWeight: number, barWeight: number): PlateBreakdown {
  const remaining = Math.max(0, targetWeight - barWeight);
  const perSideTarget = remaining / 2;
  let left = perSideTarget;
  const perSide: number[] = [];
  for (const plate of STANDARD_PLATES_KG) {
    while (left + 1e-6 >= plate) {
      perSide.push(plate);
      left -= plate;
    }
  }
  const totalPerSide = perSide.reduce((sum, p) => sum + p, 0);
  return {
    perSide,
    totalPerSide,
    barWeight,
    totalWeight: barWeight + totalPerSide * 2,
    exact: Math.abs(left) < 0.01,
  };
}
