import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Plus, Bike, Footprints, Trash2, Route as RouteIcon, Clock, Gauge } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { addCardioLog, deleteCardioLog } from '../lib/actions';
import { PageHeader, Card, Button, EmptyState, Pill } from '../components/ui';
import { Sheet } from '../components/Sheet';
import type { CardioActivityType, CardioLog } from '../types';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/** Formata min/km a partir de duração e distância. */
function formatPace(durationMin: number, distanceKm?: number): string | null {
  if (!distanceKm || distanceKm <= 0) return null;
  const paceMin = durationMin / distanceKm;
  const min = Math.floor(paceMin);
  const sec = Math.round((paceMin - min) * 60);
  return `${min}:${sec.toString().padStart(2, '0')}/km`;
}

const TYPE_META: Record<CardioActivityType, { label: string; icon: typeof Bike; color: string }> = {
  corrida: { label: 'Corrida', icon: Footprints, color: 'var(--brand)' },
  bike: { label: 'Bike', icon: Bike, color: 'var(--success)' },
};

export function Cardio() {
  const { cardioLogs } = useAppData();
  const [sheetOpen, setSheetOpen] = useState(false);

  const [form, setForm] = useState({
    date: todayIso(),
    type: 'corrida' as CardioActivityType,
    durationMin: '',
    distanceKm: '',
    avgHeartRate: '',
    rpe: '',
    notes: '',
  });

  const sorted = cardioLogs.slice().sort((a, b) => b.date.localeCompare(a.date));

  const stats = useMemo(() => {
    const totalKm = cardioLogs.reduce((sum, c) => sum + (c.distanceKm ?? 0), 0);
    const totalMin = cardioLogs.reduce((sum, c) => sum + c.durationMin, 0);
    const avgPaceStr = totalKm > 0 ? formatPace(totalMin, totalKm) : null;
    return { totalKm, totalMin, count: cardioLogs.length, avgPaceStr };
  }, [cardioLogs]);

  function num(v: string): number | undefined {
    const n = Number(v);
    return v.trim() === '' || Number.isNaN(n) ? undefined : n;
  }

  function handleSave() {
    const durationMin = Number(form.durationMin);
    if (!durationMin || durationMin <= 0) return;
    addCardioLog({
      date: form.date,
      type: form.type,
      durationMin,
      distanceKm: num(form.distanceKm),
      avgHeartRate: num(form.avgHeartRate),
      rpe: num(form.rpe),
      notes: form.notes.trim() || undefined,
    });
    setSheetOpen(false);
    setForm({ ...form, durationMin: '', distanceKm: '', avgHeartRate: '', rpe: '', notes: '' });
  }

  return (
    <div className="px-4">
      <PageHeader
        title="Cardio"
        right={
          <button
            onClick={() => setSheetOpen(true)}
            aria-label="Registrar atividade"
            className="p-2 rounded-full"
            style={{ background: 'var(--brand-dim)', color: 'var(--brand)' }}
          >
            <Plus size={20} />
          </button>
        }
      />

      {cardioLogs.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <Card className="flex flex-col items-center py-3 !p-3">
            <RouteIcon size={17} style={{ color: 'var(--brand)' }} />
            <p className="text-lg font-semibold mt-1">{stats.totalKm.toFixed(1)}</p>
            <p className="text-[10px] text-center" style={{ color: 'var(--text-faint)' }}>
              km no total
            </p>
          </Card>
          <Card className="flex flex-col items-center py-3 !p-3">
            <Clock size={17} style={{ color: 'var(--success)' }} />
            <p className="text-lg font-semibold mt-1">{Math.round(stats.totalMin / 60)}h</p>
            <p className="text-[10px] text-center" style={{ color: 'var(--text-faint)' }}>
              {stats.count} atividade{stats.count !== 1 ? 's' : ''}
            </p>
          </Card>
          <Card className="flex flex-col items-center py-3 !p-3">
            <Gauge size={17} style={{ color: 'var(--warn)' }} />
            <p className="text-lg font-semibold mt-1">{stats.avgPaceStr ?? '—'}</p>
            <p className="text-[10px] text-center" style={{ color: 'var(--text-faint)' }}>
              pace médio
            </p>
          </Card>
        </div>
      )}

      <p className="text-sm font-semibold mb-2.5" style={{ color: 'var(--text-dim)' }}>
        Histórico
      </p>

      {sorted.length === 0 ? (
        <EmptyState
          title="Nenhuma atividade registrada"
          subtitle="Registre sua corrida ou pedalada para acompanhar seu treino híbrido."
          action={
            <Button onClick={() => setSheetOpen(true)}>
              <span className="flex items-center gap-2">
                <Plus size={16} /> Registrar atividade
              </span>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2.5 pb-6">
          {sorted.map((c) => (
            <CardioRow key={c.id} log={c} onDelete={() => deleteCardioLog(c.id)} />
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Registrar atividade">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            {(['corrida', 'bike'] as CardioActivityType[]).map((t) => {
              const meta = TYPE_META[t];
              const Icon = meta.icon;
              const active = form.type === t;
              return (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, type: t })}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium"
                  style={{
                    background: active ? 'var(--brand-dim)' : 'var(--surface-2)',
                    color: active ? 'var(--brand)' : 'var(--text-dim)',
                  }}
                >
                  <Icon size={16} /> {meta.label}
                </button>
              );
            })}
          </div>

          <Field label="Data">
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--surface-2)' }}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Duração (min)">
              <input
                type="number"
                inputMode="numeric"
                value={form.durationMin}
                onChange={(e) => setForm({ ...form, durationMin: e.target.value })}
                placeholder="Ex: 40"
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: 'var(--surface-2)' }}
              />
            </Field>
            <Field label="Distância (km)">
              <input
                type="number"
                inputMode="decimal"
                value={form.distanceKm}
                onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
                placeholder="Ex: 5.2"
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: 'var(--surface-2)' }}
              />
            </Field>
            <Field label="FC média (bpm)">
              <input
                type="number"
                inputMode="numeric"
                value={form.avgHeartRate}
                onChange={(e) => setForm({ ...form, avgHeartRate: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: 'var(--surface-2)' }}
              />
            </Field>
            <Field label="RPE (1-10)">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={10}
                value={form.rpe}
                onChange={(e) => setForm({ ...form, rpe: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: 'var(--surface-2)' }}
              />
            </Field>
          </div>

          {form.durationMin && form.distanceKm && (
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
              Pace estimado: {formatPace(Number(form.durationMin), Number(form.distanceKm)) ?? '—'}
            </p>
          )}

          <Field label="Notas (opcional)">
            <input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Ex: subida forte no final"
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--surface-2)' }}
            />
          </Field>

          <Button full disabled={!form.durationMin} onClick={handleSave} className="mt-1">
            Salvar atividade
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function CardioRow({ log, onDelete }: { log: CardioLog; onDelete: () => void }) {
  const meta = TYPE_META[log.type];
  const Icon = meta.icon;
  const pace = formatPace(log.durationMin, log.distanceKm);

  return (
    <Card className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--surface-2)' }}>
        <Icon size={16} style={{ color: meta.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-faint)' }}>
          {new Date(log.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Pill tone="brand">{meta.label}</Pill>
          <Pill>{log.durationMin} min</Pill>
          {log.distanceKm != null && <Pill>{log.distanceKm} km</Pill>}
          {pace && <Pill>{pace}</Pill>}
          {log.avgHeartRate != null && <Pill>{log.avgHeartRate} bpm</Pill>}
          {log.rpe != null && <Pill>RPE {log.rpe}</Pill>}
        </div>
        {log.notes && (
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-dim)' }}>
            {log.notes}
          </p>
        )}
      </div>
      <button onClick={onDelete} style={{ color: 'var(--text-faint)' }} className="shrink-0">
        <Trash2 size={15} />
      </button>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
        {label}
      </span>
      {children}
    </label>
  );
}
