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
        className={`copied-spring inline-flex items-center justify-center gap-1.5 font-medium rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm shrink-0 touch-manipulation ${
          size === 'sm' ? 'px-2.5 py-1 min-h-[32px] sm:min-h-[26px] text-xs' : 'px-3.5 py-1.5 min-h-[38px] sm:min-h-[32px] text-xs'
        } ${className}`}
      >
        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
        <span>Copiado</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`btn-press inline-flex items-center justify-center gap-1.5 font-medium rounded-lg border bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 hover:text-slate-900 active:bg-slate-300 shadow-sm shrink-0 touch-manipulation ${
        size === 'sm' ? 'px-2.5 py-1 min-h-[32px] sm:min-h-[26px] text-xs' : 'px-3.5 py-1.5 min-h-[38px] sm:min-h-[32px] text-xs'
      } ${className}`}
      title="Copiar código al portapapeles"
      aria-label={`Copiar código ${textToCopy}`}
    >
      <Copy className="w-3.5 h-3.5 text-slate-500" />
      <span>Copiar</span>
    </button>
  );
}
