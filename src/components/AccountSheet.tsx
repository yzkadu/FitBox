import { useEffect, useState } from 'react';
import { LogOut, Ruler } from 'lucide-react';
import { Sheet } from './Sheet';
import { supabase } from '../lib/supabaseClient';
import { updateProfileBasics } from '../lib/actions';
import { AppIcon } from './ui';
import { EQUIPMENT_OPTIONS, EXPERIENCE_OPTIONS, FREQUENCY_OPTIONS, equipmentLabels, experienceLabel, frequencyLabel } from '../lib/onboarding';
import type { Equipment, ExperienceLevel, WeeklyFrequency } from '../lib/onboarding';

type Gender = 'masculino' | 'feminino';
type ProfileForm = {
  name: string;
  heightCm: string;
  age: string;
  gender: Gender;
  initialWeightKg: string;
  experienceLevel: ExperienceLevel | '';
  weeklyFrequency: WeeklyFrequency | '';
  equipment: Equipment[];
};

export function AccountSheet({
  open, onClose, name, emoji, email, userId, heightCm, age, gender,
  initialWeightKg, experienceLevel, weeklyFrequency, equipment, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
  emoji?: string | null;
  email: string | undefined;
  userId?: string;
  heightCm?: number | null;
  age?: number | null;
  gender?: Gender | null;
  initialWeightKg?: number | null;
  experienceLevel?: ExperienceLevel | null;
  weeklyFrequency?: WeeklyFrequency | null;
  equipment?: Equipment[] | null;
  onSaved?: () => void;
}) {
  const profileComplete = heightCm != null && age != null && gender != null;
  const initialForm = (): ProfileForm => ({
    name: name === 'Conta' ? '' : name,
    heightCm: heightCm != null ? String(heightCm) : '',
    age: age != null ? String(age) : '',
    gender: gender ?? 'feminino',
    initialWeightKg: initialWeightKg != null ? String(initialWeightKg) : '',
    experienceLevel: experienceLevel ?? '',
    weeklyFrequency: weeklyFrequency ?? '',
    equipment: equipment ?? [],
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(initialForm());
    setError(null);
    setEditing(!profileComplete || name === 'Conta');
    // Reabre com os dados realmente carregados pelo Supabase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, name, heightCm, age, gender, initialWeightKg, experienceLevel, weeklyFrequency, equipment]);

  function toggleEquipment(id: Equipment) {
    setForm((current) => ({
      ...current,
      equipment: current.equipment.includes(id) ? current.equipment.filter((x) => x !== id) : [...current.equipment, id],
    }));
  }

  async function save() {
    if (!userId) { setError('Faça login novamente para salvar os dados.'); return; }
    const normalizedName = form.name.trim();
    const heightNum = Number(form.heightCm.replace(',', '.'));
    const ageNum = Number(form.age);
    const weightNum = form.initialWeightKg.trim() === '' ? null : Number(form.initialWeightKg.replace(',', '.'));
    if (normalizedName.length < 2 || normalizedName.length > 100) {
      setError('Informe um nome entre 2 e 100 caracteres.'); return;
    }
    if (!Number.isFinite(heightNum) || heightNum < 80 || heightNum > 250) {
      setError('Informe uma altura válida entre 80 e 250 cm.'); return;
    }
    if (!Number.isInteger(ageNum) || ageNum < 13 || ageNum > 110) {
      setError('Informe uma idade válida entre 13 e 110 anos.'); return;
    }
    if (weightNum != null && (!Number.isFinite(weightNum) || weightNum < 20 || weightNum > 500)) {
      setError('Informe um peso válido ou deixe o campo vazio.'); return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await updateProfileBasics(userId, {
        name: normalizedName,
        heightCm: heightNum,
        age: ageNum,
        gender: form.gender,
        initialWeightKg: weightNum,
        experienceLevel: form.experienceLevel || null,
        weeklyFrequency: form.weeklyFrequency || null,
        equipment: form.equipment,
      });
      if (!result.ok) { setError('Não foi possível salvar: ' + result.error); return; }
      onSaved?.();
      setEditing(false);
    } catch {
      setError('Falha de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'w-full rounded-lg px-3 py-2 text-sm';
  const inputStyle = { background: 'var(--surface)' };
  const fieldLabel = 'text-xs';
  return (
    <Sheet open={open} onClose={onClose} title="Conta">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'var(--brand-dim)', color: 'var(--brand)' }}>
          <AppIcon value={emoji} size={20} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{name}</p>
          {email && <p className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>{email}</p>}
        </div>
      </div>

      <div className="rounded-xl p-3.5 mb-4" style={{ background: 'var(--surface-2)' }}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-sm font-semibold flex items-center gap-1.5">
            <Ruler size={15} style={{ color: 'var(--brand)' }} /> Dados cadastrais
          </p>
          {!editing && <button type="button" onClick={() => setEditing(true)}
            className="text-xs font-medium" style={{ color: 'var(--brand)' }}>Editar dados</button>}
        </div>

        {!editing ? (
          <div className="text-xs space-y-2" style={{ color: 'var(--text-dim)' }}>
            <p><strong>Nome:</strong> {name}</p>
            <p><strong>Idade:</strong> {age != null ? age + ' anos' : 'Não informada'}</p>
            <p><strong>Sexo:</strong> {gender === 'masculino' ? 'Masculino' : gender === 'feminino' ? 'Feminino' : 'Não informado'}</p>
            <p><strong>Altura:</strong> {heightCm != null ? heightCm + ' cm' : 'Não informada'}</p>
            <p><strong>Peso inicial:</strong> {initialWeightKg != null ? initialWeightKg + ' kg' : 'Não informado'}</p>
            <p><strong>Nível:</strong> {experienceLabel(experienceLevel) ?? 'Não informado'}</p>
            <p><strong>Frequência:</strong> {frequencyLabel(weeklyFrequency) ?? 'Não informada'}</p>
            <p><strong>Local de treino:</strong> {equipmentLabels(equipment).join(', ') || 'Não informado'}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className={fieldLabel}>Nome</span>
              <input type="text" maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass} style={inputStyle} autoComplete="name" />
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <label className="flex flex-col gap-1">
                <span className={fieldLabel}>Idade</span>
                <input type="number" min={13} max={110} value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })} className={inputClass} style={inputStyle} />
              </label>
              <label className="flex flex-col gap-1">
                <span className={fieldLabel}>Altura (cm)</span>
                <input type="number" min={80} max={250} step="0.1" value={form.heightCm}
                  onChange={(e) => setForm({ ...form, heightCm: e.target.value })} className={inputClass} style={inputStyle} />
              </label>
              <label className="flex flex-col gap-1">
                <span className={fieldLabel}>Peso inicial (kg)</span>
                <input type="number" min={20} max={500} step="0.1" placeholder="Opcional" value={form.initialWeightKg}
                  onChange={(e) => setForm({ ...form, initialWeightKg: e.target.value })} className={inputClass} style={inputStyle} />
              </label>
              <label className="flex flex-col gap-1">
                <span className={fieldLabel}>Sexo</span>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })}
                  className={inputClass} style={inputStyle}>
                  <option value="feminino">Feminino</option>
                  <option value="masculino">Masculino</option>
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <span className={fieldLabel}>Nível de treino</span>
              <select value={form.experienceLevel}
                onChange={(e) => setForm({ ...form, experienceLevel: e.target.value as ExperienceLevel | '' })}
                className={inputClass} style={inputStyle}>
                <option value="">Não informado</option>
                {EXPERIENCE_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={fieldLabel}>Frequência semanal</span>
              <select value={form.weeklyFrequency}
                onChange={(e) => setForm({ ...form, weeklyFrequency: e.target.value as WeeklyFrequency | '' })}
                className={inputClass} style={inputStyle}>
                <option value="">Não informada</option>
                {FREQUENCY_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </label>
            <fieldset>
              <legend className="text-xs mb-2">Onde você treina? (pode selecionar mais de um)</legend>
              <div className="flex flex-col gap-2">
                {EQUIPMENT_OPTIONS.map((o) => (
                  <label key={o.id} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={form.equipment.includes(o.id)} onChange={() => toggleEquipment(o.id)}
                      style={{ accentColor: 'var(--brand)' }} />
                    <span>{o.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {error && <p role="alert" className="text-xs rounded-lg p-2"
              style={{ color: 'var(--danger)', background: '#f8717126' }}>{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={save} disabled={saving}
                className="flex-1 rounded-lg py-2.5 text-xs font-medium"
                style={{ background: 'var(--brand)', color: 'white', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Salvando...' : 'Salvar dados'}
              </button>
              <button type="button" disabled={saving}
                onClick={() => { setForm(initialForm()); setError(null); setEditing(false); }}
                className="px-3 rounded-lg text-xs" style={{ background: 'var(--surface)' }}>Cancelar</button>
            </div>
          </div>
        )}
      </div>

      <button type="button" onClick={() => supabase.auth.signOut()}
        className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium"
        style={{ background: '#f8717126', color: 'var(--danger)' }}>
        <LogOut size={16} /> Sair da conta
      </button>
    </Sheet>
  );
}
