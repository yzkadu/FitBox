import { useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { Plus, Camera, Trash2, Pencil, Scale, X, TrendingUp, TrendingDown } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { addMeasurement, updateMeasurement, deleteMeasurement, addPhoto, deletePhoto } from '../lib/actions';
import { PageHeader, Card, Button, EmptyState, Pill } from '../components/ui';
import { Sheet } from '../components/Sheet';
import { BodySilhouette } from '../components/BodySilhouette';
import type { SilhouetteGender } from '../components/BodySilhouette';
import { BodyFatSlider } from '../components/BodyFatSlider';
import type { BodyMeasurement, BodyPhoto } from '../types';

const MEASURE_FIELD_DEFS: { key: keyof BodyMeasurement; label: string; unit: string }[] = [
  { key: 'weightKg', label: '', unit: 'kg' },
  { key: 'bodyFatPct', label: '% gordura', unit: '%' },
  { key: 'waistCm', label: 'cintura', unit: 'cm' },
  { key: 'chestCm', label: 'peito', unit: 'cm' },
  { key: 'armCm', label: 'braço', unit: 'cm' },
  { key: 'thighCm', label: 'coxa', unit: 'cm' },
  { key: 'hipCm', label: 'quadril', unit: 'cm' },
  { key: 'calfCm', label: 'panturrilha', unit: 'cm' },
];

/** Formata a variação em relação à medição anterior (ex: "(-1.2)"), ou vazio
 * se não houver uma medição anterior com esse campo preenchido. */
function deltaLabel(curr: number, prev: number | undefined): string {
  if (prev == null) return '';
  const diff = curr - prev;
  if (Math.abs(diff) < 0.05) return '';
  const rounded = Math.round(diff * 10) / 10;
  const sign = rounded > 0 ? '+' : '';
  return ` (${sign}${rounded})`;
}

const SILHOUETTE_GENDER_KEY = 'fitbox-silhouette-gender';

function loadSilhouetteGender(): SilhouetteGender {
  try {
    const saved = localStorage.getItem(SILHOUETTE_GENDER_KEY);
    return saved === 'masculino' || saved === 'feminino' ? saved : 'feminino';
  } catch {
    return 'feminino';
  }
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const emptyForm = {
  date: todayIso(),
  weightKg: '',
  bodyFatPct: '',
  chestCm: '',
  waistCm: '',
  hipCm: '',
  armCm: '',
  thighCm: '',
  calfCm: '',
};

export function BodyStats() {
  const { measurements, photos } = useAppData();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<BodyPhoto | null>(null);
  const [silhouetteGender, setSilhouetteGender] = useState<SilhouetteGender>(loadSilhouetteGender);
  const [silhouetteMode, setSilhouetteMode] = useState<'medidas' | 'explorar'>('medidas');
  const [explorePct, setExplorePct] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function changeSilhouetteGender(g: SilhouetteGender) {
    setSilhouetteGender(g);
    try {
      localStorage.setItem(SILHOUETTE_GENDER_KEY, g);
    } catch {
      // localStorage indisponível — segue só no estado da sessão
    }
  }

  const [form, setForm] = useState(emptyForm);

  const sortedMeasurements = measurements.slice().sort((a, b) => b.date.localeCompare(a.date));
  const sortedPhotos = photos.slice().sort((a, b) => b.date.localeCompare(a.date));
  const explorePctValue = explorePct ?? sortedMeasurements[0]?.bodyFatPct ?? 20;

  function num(v: string): number | undefined {
    const n = Number(v);
    return v.trim() === '' || Number.isNaN(n) ? undefined : n;
  }

  function openNewMeasurement() {
    setEditingId(null);
    setForm(emptyForm);
    setSheetOpen(true);
  }

  function openEditMeasurement(m: BodyMeasurement) {
    setEditingId(m.id);
    setForm({
      date: m.date,
      weightKg: m.weightKg?.toString() ?? '',
      bodyFatPct: m.bodyFatPct?.toString() ?? '',
      chestCm: m.chestCm?.toString() ?? '',
      waistCm: m.waistCm?.toString() ?? '',
      hipCm: m.hipCm?.toString() ?? '',
      armCm: m.armCm?.toString() ?? '',
      thighCm: m.thighCm?.toString() ?? '',
      calfCm: m.calfCm?.toString() ?? '',
    });
    setSheetOpen(true);
  }

  function handleSave() {
    const payload = {
      date: form.date,
      weightKg: num(form.weightKg),
      bodyFatPct: num(form.bodyFatPct),
      chestCm: num(form.chestCm),
      waistCm: num(form.waistCm),
      hipCm: num(form.hipCm),
      armCm: num(form.armCm),
      thighCm: num(form.thighCm),
      calfCm: num(form.calfCm),
    };
    if (editingId) {
      updateMeasurement(editingId, payload);
    } else {
      addMeasurement(payload);
    }
    setSheetOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    addPhoto({ date: todayIso(), dataUrl, label: 'frente' });
    if (fileRef.current) fileRef.current.value = '';
  }

  const weightEntries = sortedMeasurements.filter((m) => m.weightKg != null);
  const latestWeight = weightEntries[0]?.weightKg;
  const trendCutoff = Date.now() - 28 * 24 * 60 * 60 * 1000;
  const baselineWeightEntry =
    weightEntries.find((m) => Date.parse(m.date) <= trendCutoff) ?? weightEntries[weightEntries.length - 1];
  const weightTrendKg =
    weightEntries[0] && baselineWeightEntry && baselineWeightEntry.id !== weightEntries[0].id
      ? Math.round((weightEntries[0].weightKg! - baselineWeightEntry.weightKg!) * 10) / 10
      : null;

  return (
    <div className="px-4">
      <PageHeader
        title="Medidas"
        right={
          <button
            onClick={openNewMeasurement}
            aria-label="Nova medição"
            className="p-2 rounded-full"
            style={{ background: 'var(--brand-dim)', color: 'var(--brand)' }}
          >
            <Plus size={20} />
          </button>
        }
      />

      {latestWeight != null && (
        <Card className="mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-dim)' }}>
            <Scale size={18} style={{ color: 'var(--brand)' }} />
          </div>
          <div>
            <p className="text-lg font-semibold leading-tight">{latestWeight}kg</p>
            <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-faint)' }}>
              peso mais recente
              {weightTrendKg != null && weightTrendKg !== 0 && (
                <span className="flex items-center gap-0.5 font-medium" style={{ color: 'var(--text-dim)' }}>
                  ·
                  {weightTrendKg > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {weightTrendKg > 0 ? '+' : ''}
                  {weightTrendKg}kg em ~28 dias
                </span>
              )}
            </p>
          </div>
        </Card>
      )}

      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-dim)' }}>
            Silhueta {silhouetteMode === 'medidas' ? 'atual' : 'em exploração'}
          </p>
          <div className="flex gap-1 rounded-full p-0.5" style={{ background: 'var(--surface-2)' }}>
            {(['feminino', 'masculino'] as SilhouetteGender[]).map((g) => (
              <button
                key={g}
                onClick={() => changeSilhouetteGender(g)}
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{
                  background: silhouetteGender === g ? 'var(--brand)' : 'transparent',
                  color: silhouetteGender === g ? 'white' : 'var(--text-faint)',
                }}
              >
                {g === 'feminino' ? 'Feminino' : 'Masculino'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-1 rounded-full p-0.5 mb-3" style={{ background: 'var(--surface-2)' }}>
          {(['medidas', 'explorar'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setSilhouetteMode(mode)}
              className="flex-1 text-xs px-2.5 py-1.5 rounded-full font-medium"
              style={{
                background: silhouetteMode === mode ? 'var(--brand)' : 'transparent',
                color: silhouetteMode === mode ? 'white' : 'var(--text-faint)',
              }}
            >
              {mode === 'medidas' ? 'Minhas medidas' : 'Explorar'}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center py-2" style={{ height: 220 }}>
          {silhouetteMode === 'medidas' ? (
            <BodySilhouette measurement={sortedMeasurements[0] ?? null} gender={silhouetteGender} />
          ) : (
            <BodySilhouette measurement={null} gender={silhouetteGender} bodyFatOverridePct={explorePctValue} />
          )}
        </div>

        {silhouetteMode === 'explorar' && (
          <div className="mb-2 px-1">
            <BodyFatSlider value={explorePctValue} onChange={setExplorePct} />
          </div>
        )}

        <p className="text-xs text-center" style={{ color: 'var(--text-faint)' }}>
          {silhouetteMode === 'explorar'
            ? 'Prévia aproximada de como a silhueta muda com o % de gordura corporal — não é uma imagem real do seu corpo.'
            : sortedMeasurements[0]
              ? `Ilustração aproximada com base nas medidas de ${new Date(sortedMeasurements[0].date).toLocaleDateString('pt-BR')} — não é uma imagem real do seu corpo.`
              : 'Registre suas medidas (peito, cintura, quadril, braço, coxa, panturrilha) para a silhueta refletir seu corpo.'}
        </p>
      </Card>

      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-dim)' }}>
          Fotos de evolução
        </p>
        <label className="text-xs font-medium flex items-center gap-1 cursor-pointer" style={{ color: 'var(--brand)' }}>
          <Camera size={13} /> Adicionar
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
        </label>
      </div>

      {sortedPhotos.length === 0 ? (
        <p className="text-xs mb-5" style={{ color: 'var(--text-faint)' }}>
          Nenhuma foto ainda.
        </p>
      ) : (
        <div className="flex gap-2 overflow-x-auto mb-5 pb-1">
          {sortedPhotos.map((p) => (
            <button key={p.id} onClick={() => setViewingPhoto(p)} className="shrink-0">
              <img src={p.dataUrl} className="w-20 h-24 object-cover rounded-xl" style={{ background: 'var(--surface-2)' }} />
              <p className="text-[10px] mt-1 text-center" style={{ color: 'var(--text-faint)' }}>
                {new Date(p.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </p>
            </button>
          ))}
        </div>
      )}

      <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-dim)' }}>
        Histórico de medidas
      </p>
      {sortedMeasurements.length === 0 ? (
        <EmptyState title="Nenhuma medida registrada" subtitle="Registre seu peso e medidas para acompanhar sua evolução." />
      ) : (
        <div className="flex flex-col gap-2.5 pb-6">
          {sortedMeasurements.map((m, i) => {
            const prev = sortedMeasurements[i + 1];
            return (
              <Card key={m.id} className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-faint)' }}>
                    {new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {MEASURE_FIELD_DEFS.map(({ key, label, unit }) => {
                      const value = m[key] as number | undefined;
                      if (value == null) return null;
                      const prevValue = prev?.[key] as number | undefined;
                      return (
                        <Pill key={key} tone={key === 'weightKg' ? 'brand' : 'default'}>
                          {label ? `${label} ` : ''}
                          {value}
                          {unit}
                          {deltaLabel(value, prevValue)}
                        </Pill>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={() => openEditMeasurement(m)} style={{ color: 'var(--text-faint)' }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteMeasurement(m.id)} style={{ color: 'var(--text-faint)' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEditingId(null);
        }}
        title={editingId ? 'Editar medição' : 'Nova medição'}
      >
        <div className="flex flex-col gap-3">
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
            <Field label="Peso (kg)">
              <input type="number" inputMode="decimal" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--surface-2)' }} />
            </Field>
            <Field label="Gordura (%)">
              <input type="number" inputMode="decimal" value={form.bodyFatPct} onChange={(e) => setForm({ ...form, bodyFatPct: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--surface-2)' }} />
            </Field>
            <Field label="Peito (cm)">
              <input type="number" inputMode="decimal" value={form.chestCm} onChange={(e) => setForm({ ...form, chestCm: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--surface-2)' }} />
            </Field>
            <Field label="Cintura (cm)">
              <input type="number" inputMode="decimal" value={form.waistCm} onChange={(e) => setForm({ ...form, waistCm: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--surface-2)' }} />
            </Field>
            <Field label="Quadril (cm)">
              <input type="number" inputMode="decimal" value={form.hipCm} onChange={(e) => setForm({ ...form, hipCm: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--surface-2)' }} />
            </Field>
            <Field label="Braço (cm)">
              <input type="number" inputMode="decimal" value={form.armCm} onChange={(e) => setForm({ ...form, armCm: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--surface-2)' }} />
            </Field>
            <Field label="Coxa (cm)">
              <input type="number" inputMode="decimal" value={form.thighCm} onChange={(e) => setForm({ ...form, thighCm: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--surface-2)' }} />
            </Field>
            <Field label="Panturrilha (cm)">
              <input type="number" inputMode="decimal" value={form.calfCm} onChange={(e) => setForm({ ...form, calfCm: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--surface-2)' }} />
            </Field>
          </div>
          <Button full onClick={handleSave} className="mt-2">
            {editingId ? 'Salvar alterações' : 'Salvar medição'}
          </Button>
        </div>
      </Sheet>

      {viewingPhoto && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 px-4" onClick={() => setViewingPhoto(null)}>
          <button className="absolute top-5 right-5 text-white" onClick={() => setViewingPhoto(null)}>
            <X size={24} />
          </button>
          <img src={viewingPhoto.dataUrl} className="max-h-[70vh] rounded-xl" onClick={(e) => e.stopPropagation()} />
          <p className="text-white text-sm mt-3">
            {new Date(viewingPhoto.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deletePhoto(viewingPhoto.id);
              setViewingPhoto(null);
            }}
            className="mt-3 text-xs px-3 py-2 rounded-lg text-white flex items-center gap-1.5"
            style={{ background: 'var(--danger)' }}
          >
            <Trash2 size={13} /> Excluir foto
          </button>
        </div>
      )}
    </div>
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
