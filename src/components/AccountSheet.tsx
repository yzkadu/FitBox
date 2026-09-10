import { LogOut } from 'lucide-react';
import { Sheet } from './Sheet';
import { supabase } from '../lib/supabaseClient';

export function AccountSheet({
  open,
  onClose,
  name,
  emoji,
  email,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
  emoji: string;
  email: string | undefined;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Conta">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{emoji}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{name}</p>
          {email && (
            <p className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>
              {email}
            </p>
          )}
        </div>
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
