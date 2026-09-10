import { useRef } from 'react';
import { Camera, X } from 'lucide-react';

/** Redimensiona/comprime a imagem antes de virar base64, pra não pesar o banco. */
function resizeImage(file: File, maxDim = 900, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Falha ao carregar imagem'));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function PhotoField({
  value,
  onChange,
  label = 'Foto de prova (opcional)',
}: {
  value: string | undefined;
  onChange: (dataUrl: string | undefined) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await resizeImage(file);
      onChange(dataUrl);
    } catch {
      // silencioso — a foto é só um "plus", nunca deve travar o fluxo principal
    }
  }

  return (
    <div>
      <p className="text-xs mb-1.5" style={{ color: 'var(--text-faint)' }}>
        {label}
      </p>
      {value ? (
        <div className="relative w-24 h-24 rounded-xl overflow-hidden">
          <img src={value} alt="Prova" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm"
          style={{ background: 'var(--surface-2)', color: 'var(--text-dim)' }}
        >
          <Camera size={16} /> Anexar foto do relógio/tracker
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
    </div>
  );
}
