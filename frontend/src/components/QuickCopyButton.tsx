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
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(30);
        } catch (_) {}
      }
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
        className={`copied-spring inline-flex items-center justify-center gap-1.5 font-tactical uppercase tracking-wider font-bold rounded-lg border bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.35)] shrink-0 touch-manipulation ${
          size === 'sm' ? 'px-3 py-1.5 min-h-[36px] sm:min-h-[28px] text-[11px]' : 'px-4 py-2 min-h-[42px] sm:min-h-[34px] text-xs'
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
      className={`btn-press inline-flex items-center justify-center gap-1.5 font-tactical uppercase tracking-wider font-bold rounded-lg border bg-cyan-950/60 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/20 hover:text-white hover:border-cyan-400 active:bg-cyan-500/30 shadow-sm shrink-0 touch-manipulation ${
        size === 'sm' ? 'px-2.5 py-1.5 min-h-[36px] sm:min-h-[28px] text-[11px] sm:text-[10px]' : 'px-3.5 py-2 min-h-[42px] sm:min-h-[34px] text-xs'
      } ${className}`}
      title="Copiar código al portapapeles"
      aria-label={`Copiar código ${textToCopy}`}
    >
      <Copy className="w-3.5 h-3.5 text-cyan-400" />
      <span>COPIAR</span>
    </button>
  );
}
