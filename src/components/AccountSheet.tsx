import { useEffect, useState } from 'react';
import { LogOut, Ruler } from 'lucide-react';
import { Sheet } from './Sheet';
import { supabase } from '../lib/supabaseClient';
import { updateProfileBasics } from '../lib/actions';
import { AppIcon } from './ui';

type Gender = 'masculino' | 'feminino';

export function AccountSheet({
  open,
  onClose,
  name,
  emoji,
  email,
  userId,
  heightCm,
  age,
  gender,
  initialWeightKg,
  onSaved,
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
  onSaved?: () => void;
}) {
  const profileComplete = heightCm != null && age != null && gender != null;
  const [editingBasics, setEditingBasics] = useState(false);
  const [form, setForm] = useState({
    heightCm: heightCm != null ? String(heightCm) : '',
    age: age != null ? String(age) : '',
    gender: (gender ?? 'feminino') as Gender,
    initialWeightKg: initialWeightKg != null ? String(initialWeightKg) : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reabre o sheet (ou os dados chegam depois de carregar) sempre com os valores
  // salvos mais recentes — sem isso, editar duas vezes seguidas mostraria o form
  // vazio ou desatualizado da primeira renderização.
  useEffect(() => {
    setForm({
      heightCm: heightCm != null ? String(heightCm) : '',
      age: age != null ? String(age) : '',
      gender: (gender ?? 'feminino') as Gender,
      initialWeightKg: initialWeightKg != null ? String(initialWeightKg) : '',
    });
  }, [heightCm, age, gender, initialWeightKg, open]);

  useEffect(() => {
    if (open && !profileComplete) setEditingBasics(true);
  }, [open, profileComplete]);

  async function handleSaveBasics() {
    if (!userId) return;
    const heightNum = Number(form.heightCm);
    const ageNum = Number(form.age);
    const weightNum = form.initialWeightKg.trim() === '' ? null : Number(form.initialWeightKg);
    if (!heightNum || !ageNum) {
      setError('Preencha pelo menos altura e idade.');
      return;
    }
    setSaving(true);
    setError(null);
    const result = await updateProfileBasics(userId, {
      heightCm: heightNum,
      age: ageNum,
      gender: form.gender,
      initialWeightKg: weightNum,
    });
    setSaving(false);
    if (!result.ok) {
      setError('Não deu pra salvar agora — tenta de novo.');
      return;
    }
    onSaved?.();
    setEditingBasics(false);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Conta">
      <div className="flex items-center gap-3 mb-4">
        <span
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'var(--brand-dim)', color: 'var(--brand)' }}
        >
          <AppIcon value={emoji} size={20} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{name}</p>
          {email && (
            <p className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>
              {email}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl p-3.5 mb-4" style={{ background: 'var(--surface-2)' }}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium flex items-center gap-1.5">
            <Ruler size={14} style={{ color: 'var(--brand)' }} /> Seus dados
          </p>
          {!editingBasics && (
            <button onClick={() => setEditingBasics(true)} className="text-xs font-medium" style={{ color: 'var(--brand)' }}>
              Editar
            </button>
          )}
        </div>

        {!editingBasics ? (
          profileComplete ? (
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              {heightCm}cm · {age} anos · {gender === 'masculino' ? 'Masculino' : 'Feminino'}
              {initialWeightKg != null ? ` · peso inicial ${initialWeightKg}kg` : ''}
            </p>
          ) : (
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
              Nenhum dado ainda.
            </p>
          )
        ) : (
          <div className="flex flex-col gap-2.5 mt-2">
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
              Altura e idade são usadas pra calcular seu IMC automaticamente na aba Medidas.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <label className="flex flex-col gap-1">
                <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                  Altura (cm)
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={form.heightCm}
                  onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'var(--surface)' }}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                  Idade
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'var(--surface)' }}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                  Peso inicial (kg)
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={form.initialWeightKg}
                  onChange={(e) => setForm({ ...form, initialWeightKg: e.target.value })}
                  placeholder="opcional"
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'var(--surface)' }}
                />
              </label>
              <div className="flex flex-col gap-1">
                <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                  Sexo
                </span>
                <div className="flex gap-1 rounded-lg p-0.5" style={{ background: 'var(--surface)' }}>
                  {(['feminino', 'masculino'] as Gender[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setForm({ ...form, gender: g })}
                      className="flex-1 text-xs px-2 py-1.5 rounded-md font-medium"
                      style={{
                        background: form.gender === g ? 'var(--brand)' : 'transparent',
                        color: form.gender === g ? 'white' : 'var(--text-faint)',
                      }}
                    >
                      {g === 'feminino' ? 'Fem.' : 'Masc.'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {error && (
              <p className="text-xs rounded-lg px-3 py-2" style={{ background: '#f8717126', color: 'var(--danger)' }}>
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleSaveBasics}
                disabled={saving}
                className="flex-1 rounded-lg py-2 text-xs font-medium"
                style={{ background: 'var(--brand)', color: 'white', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              {profileComplete && (
                <button
                  onClick={() => setEditingBasics(false)}
                  className="px-3 rounded-lg py-2 text-xs font-medium"
                  style={{ background: 'var(--surface)', color: 'var(--text-dim)' }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => supabase.auth.signOut()}
        className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium"
        style={{ background: '#f8717126', color: 'var(--danger)' }}
      >
        <LogOut size={16} /> Sair da conta
      </button>
    </Sheet>
  );
}
