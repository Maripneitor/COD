import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface QuickCopyButtonProps {
  textToCopy: string;
  onCopied?: (text: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export default function QuickCopyButton({
  textToCopy,
  onCopied,
  className = "",
  size = 'sm',
}: QuickCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      if (onCopied) onCopied(textToCopy);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  if (copied) {
    return (
      <button
        type="button"
        disabled
        className={`copied-spring inline-flex items-center gap-1.5 font-tactical uppercase tracking-wider font-bold rounded-lg border bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.35)] ${
          size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-xs'
        } ${className}`}
      >
        <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
        <span>¡COPIADO!</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`btn-press inline-flex items-center gap-1.5 font-tactical uppercase tracking-wider font-semibold rounded-lg border bg-cyan-950/40 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20 hover:text-cyan-200 hover:border-cyan-400/60 shadow-sm transition-colors duration-150 ${
        size === 'sm' ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'
      } ${className}`}
      title="Copiar código al portapapeles"
      aria-label={`Copiar código ${textToCopy}`}
    >
      <Copy className="w-3 h-3 text-cyan-400 opacity-80 group-hover:opacity-100" />
      <span>COPIAR</span>
    </button>
  );
}
