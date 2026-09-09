import { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { Sheet } from './Sheet';
import { ProfileForm } from './ProfileForm';
import { useProfiles } from '../hooks/useProfiles';
import { profileStore } from '../lib/profiles';
import type { ProgramTemplateId } from '../lib/seedPrograms';

export function ProfileSwitcherSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profiles, activeProfileId } = useProfiles();
  const [creating, setCreating] = useState(false);

  function handleCreate(name: string, emoji: string, template: ProgramTemplateId) {
    profileStore.createProfile(name, emoji, template);
    setCreating(false);
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title={creating ? 'Novo perfil' : 'Perfis'}>
      {creating ? (
        <ProfileForm onSubmit={handleCreate} onCancel={() => setCreating(false)} />
      ) : (
        <div className="flex flex-col gap-2">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                profileStore.switchProfile(p.id);
                onClose();
              }}
              className="flex items-center gap-3 rounded-xl px-3.5 py-3"
              style={{ background: 'var(--surface-2)' }}
            >
              <span className="text-xl">{p.emoji ?? '💪'}</span>
              <span className="flex-1 text-left text-sm font-medium">{p.name}</span>
              {p.id === activeProfileId && <Check size={16} style={{ color: 'var(--brand)' }} />}
            </button>
          ))}
          <button
            onClick={() => setCreating(true)}
            className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium mt-1"
            style={{ background: 'var(--brand-dim)', color: 'var(--brand)' }}
          >
            <Plus size={16} /> Novo perfil
          </button>
        </div>
      )}
    </Sheet>
  );
}
