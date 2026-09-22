// Slider de % de gordura corporal usado no modo "Explorar" da silhueta —
// a pessoa arrasta e vê o boneco reagir na hora (via `bodyFatOverridePct`
// do BodySilhouette), sem precisar ter medidas reais registradas. É só um
// <input type="range"> estilizado com as cores do app; nenhuma arte ou
// componente de terceiro envolvido.

import { BODY_FAT_RANGE, bodyFatBandLabel } from './BodySilhouette';

export function BodyFatSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (pct: number) => void;
}) {
  const { min, max } = BODY_FAT_RANGE;
  const percentFilled = ((value - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs font-medium" style={{ color: 'var(--text-faint)' }}>
          % de gordura corporal
        </span>
        <span className="text-lg font-bold" style={{ color: 'var(--brand)' }}>
          {bodyFatBandLabel(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{
          accentColor: 'var(--brand)',
          background: `linear-gradient(to right, var(--brand) ${percentFilled}%, var(--surface-2) ${percentFilled}%)`,
          height: 6,
          borderRadius: 999,
          appearance: 'none',
          WebkitAppearance: 'none',
          outline: 'none',
        }}
      />
      <div className="flex justify-between mt-1">
        <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
          {min}% (magro)
        </span>
        <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
          {max}%+ (alto)
        </span>
      </div>
    </div>
  );
}
