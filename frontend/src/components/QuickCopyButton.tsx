import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface QuickCopyButtonProps {
  textToCopy: string;
  onCopied?: (text: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showFullLabel?: boolean;
}

export default function QuickCopyButton({
  textToCopy,
  onCopied,
  className = '',
  size = 'md',
  showFullLabel = false,
}: QuickCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(textToCopy);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(35);
        } catch (_) {}
      }
      setCopied(true);
      if (onCopied) onCopied(textToCopy);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1 min-h-[34px] text-xs',
    md: 'flex-1 py-2.5 px-4 min-h-[44px] text-xs sm:text-sm',
    lg: 'w-full py-3 px-5 min-h-[46px] text-sm',
  }[size];

  if (copied) {
    return (
      <button
        type="button"
        disabled
        className={`copied-spring inline-flex items-center justify-center gap-2 font-bold rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs shrink-0 touch-manipulation select-none transition-all ${sizeClasses} ${className}`}
      >
        <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
        <span>¡Copiado al portapapeles!</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`btn-press inline-flex items-center justify-center gap-2 font-bold rounded-xl border bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white border-blue-600 shadow-xs shrink-0 touch-manipulation select-none transition-all ${sizeClasses} ${className}`}
      title="Copiar código al portapapeles"
      aria-label={`Copiar código ${textToCopy}`}
    >
      <Copy className="w-4 h-4 text-white/90" />
      <span>{showFullLabel || size !== 'sm' ? 'Copiar Código' : 'Copiar'}</span>
    </button>
  );
}
