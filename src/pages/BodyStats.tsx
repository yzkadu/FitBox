import { useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { Plus, Camera, Trash2, Scale, X } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { addMeasurement, deleteMeasurement, addPhoto, deletePhoto } from '../lib/actions';
import { PageHeader, Card, Button, EmptyState, Pill } from '../components/ui';
import { Sheet } from '../components/Sheet';
import { BodySilhouette } from '../components/BodySilhouette';
import type { SilhouetteGender } from '../components/BodySilhouette';
import type { BodyPhoto } from '../types';

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

export function BodyStats() {
  const { measurements, photos } = useAppData();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<BodyPhoto | null>(null);
  const [silhouetteGender, setSilhouetteGender] = useState<SilhouetteGender>(loadSilhouetteGender);
  const fileRef = useRef<HTMLInputElement>(null);

  function changeSilhouetteGender(g: SilhouetteGender) {
    setSilhouetteGender(g);
    try {
      localStorage.setItem(SILHOUETTE_GENDER_KEY, g);
    } catch {
      // localStorage indisponível — segue só no estado da sessão
    }
  }

  const [form, setForm] = useState({
    date: todayIso(),
    weightKg: '',
    bodyFatPct: '',
    chestCm: '',
    waistCm: '',
    hipCm: '',
    armCm: '',
    thighCm: '',
    calfCm: '',
  });

  const sortedMeasurements = measurements.slice().sort((a, b) => b.date.localeCompare(a.date));
  const sortedPhotos = photos.slice().sort((a, b) => b.date.localeCompare(a.date));

  function num(v: string): number | undefined {
    const n = Number(v);
    return v.trim() === '' || Number.isNaN(n) ? undefined : n;
  }

  function handleSave() {
    addMeasurement({
      date: form.date,
      weightKg: num(form.weightKg),
      bodyFatPct: num(form.bodyFatPct),
      chestCm: num(form.chestCm),
      waistCm: num(form.waistCm),
      hipCm: num(form.hipCm),
      armCm: num(form.armCm),
      thighCm: num(form.thighCm),
      calfCm: num(form.calfCm),
    });
    setSheetOpen(false);
    setForm({ ...form, weightKg: '', bodyFatPct: '', chestCm: '', waistCm: '', hipCm: '', armCm: '', thighCm: '', calfCm: '' });
  }

  async function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    addPhoto({ date: todayIso(), dataUrl, label: 'frente' });
    if (fileRef.current) fileRef.current.value = '';
  }

  const latestWeight = sortedMeasurements.find((m) => m.weightKg != null)?.weightKg;

  return (
    <div className="px-4">
      <PageHeader
        title="Medidas"
        right={
          <button
            onClick={() => setSheetOpen(true)}
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
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
              peso mais recente
            </p>
          </div>
        </Card>
      )}

      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-dim)' }}>
            Silhueta atual
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
        <div className="flex items-center justify-center py-2" style={{ height: 220 }}>
          <BodySilhouette measurement={sortedMeasurements[0] ?? null} gender={silhouetteGender} />
        </div>
        <p className="text-xs text-center" style={{ color: 'var(--text-faint)' }}>
          {sortedMeasurements[0]
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
          {sortedMeasurements.map((m) => (
            <Card key={m.id} className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-faint)' }}>
                  {new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {m.weightKg != null && <Pill tone="brand">{m.weightKg}kg</Pill>}
                  {m.bodyFatPct != null && <Pill>{m.bodyFatPct}% gordura</Pill>}
                  {m.waistCm != null && <Pill>cintura {m.waistCm}cm</Pill>}
                  {m.chestCm != null && <Pill>peito {m.chestCm}cm</Pill>}
                  {m.armCm != null && <Pill>braço {m.armCm}cm</Pill>}
                  {m.thighCm != null && <Pill>coxa {m.thighCm}cm</Pill>}
                  {m.hipCm != null && <Pill>quadril {m.hipCm}cm</Pill>}
                  {m.calfCm != null && <Pill>panturrilha {m.calfCm}cm</Pill>}
                </div>
              </div>
              <button onClick={() => deleteMeasurement(m.id)} style={{ color: 'var(--text-faint)' }} className="shrink-0">
                <Trash2 size={15} />
              </button>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Nova medição">
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
            Salvar medição
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
