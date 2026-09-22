import { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { Card, Button } from './ui';
import { kaduProgramAlreadyImported, importKaduProgram } from '../lib/kaduImport';
import type { Exercise, Workout } from '../types';

const DISMISS_KEY = 'fitbox-kadu-program-banner-dismissed';

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

/** Banner de uma vez só, oferecendo importar o programa de 4 dias que o Kadu
 * mandou (Peito/Ombro/Tríceps, Costas/Bíceps, Pernas/Abdômen, Peito/Ombro).
 * Some sozinho assim que o programa é importado (detecta pelo nome dos
 * treinos já criados) ou se a pessoa tocar em "Agora não". */
export function KaduProgramBanner({ workouts, exercises }: { workouts: Workout[]; exercises: Exercise[] }) {
  const [dismissed, setDismissed] = useState(readDismissed);
  const [importing, setImporting] = useState(false);

  if (dismissed || kaduProgramAlreadyImported(workouts)) return null;

  function handleImport() {
    setImporting(true);
    try {
      importKaduProgram(exercises);
    } finally {
      setImporting(false);
    }
  }

  function handleDismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // localStorage indisponível — só não persiste entre sessões, sem crash.
    }
    setDismissed(true);
  }

  return (
    <Card className="mb-4" style={{ borderColor: 'var(--brand)' }}>
      <div className="flex items-start gap-2.5 mb-3">
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'var(--brand-dim)' }}>
          <Dumbbell size={14} style={{ color: 'var(--brand)' }} />
        </div>
        <div>
          <p className="text-sm font-medium">Programa de 4 dias pronto pra importar</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
            Dia 1: Peito/Ombro/Tríceps · Dia 2: Costas/Bíceps · Dia 3: Pernas/Abdômen · Dia 4: Peito/Ombro —
            com os mesmos exercícios, séries e reps de antes.
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleDismiss} className="text-xs px-3 py-2" style={{ color: 'var(--text-faint)' }}>
          Agora não
        </button>
        <Button className="!px-3 !py-2 !text-xs flex-1" onClick={handleImport} disabled={importing}>
          {importing ? 'Importando...' : 'Importar os 4 treinos'}
        </Button>
      </div>
    </Card>
  );
}
