import { useState } from 'react';
import { Button } from './ui';
import { PROGRAM_TEMPLATES, type ProgramTemplateId } from '../lib/seedPrograms';

const EMOJIS = ['💪', '🏋️', '🏃', '🚴', '🔥', '⚡', '🎯', '🦵'];

export function ProfileForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (name: string, emoji: string, template: ProgramTemplateId) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [template, setTemplate] = useState<ProgramTemplateId>('blank');

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs mb-1.5" style={{ color: 'var(--text-faint)' }}>
          Nome
        </p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Kadu"
          className="w-full rounded-xl px-3 py-2.5 text-sm"
          style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
        />
      </div>

      <div>
        <p className="text-xs mb-1.5" style={{ color: 'var(--text-faint)' }}>
          Ícone
        </p>
        <div className="flex gap-2 flex-wrap">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className="w-10 h-10 rounded-xl text-lg flex items-center justify-center"
              style={{ background: emoji === e ? 'var(--brand)' : 'var(--surface-2)' }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs mb-1.5" style={{ color: 'var(--text-faint)' }}>
          Programa inicial
        </p>
        <div className="flex flex-col gap-2">
          {PROGRAM_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplate(t.id)}
              className="text-left rounded-xl p-3 border"
              style={{
                background: template === t.id ? 'var(--brand-dim)' : 'var(--surface-2)',
                borderColor: template === t.id ? 'var(--brand)' : 'transparent',
              }}
            >
              <p className="text-sm font-medium" style={{ color: template === t.id ? 'var(--brand)' : 'var(--text)' }}>
                {t.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                {t.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mt-1">
        {onCancel && (
          <Button variant="secondary" full onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button full disabled={!name.trim()} onClick={() => onSubmit(name.trim(), emoji, template)}>
          Criar perfil
        </Button>
      </div>
    </div>
  );
}
