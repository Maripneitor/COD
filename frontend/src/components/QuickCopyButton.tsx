import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';

interface QuickCopyButtonProps {
  textToCopy: string;
  onCopied?: (text: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export default function QuickCopyButton({
  textToCopy,
  onCopied,
  className = '',
  size = 'md',
  label = 'Copiar',
}: QuickCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(textToCopy);
    if (success) {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate?.(35);
        } catch (_) {}
      }
      setCopied(true);
      if (onCopied) onCopied(textToCopy);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1 min-h-[36px] text-xs',
    md: 'w-full py-2.5 px-3 min-h-[44px] text-xs sm:text-sm',
    lg: 'w-full py-3 px-4 min-h-[46px] text-sm',
  }[size];

  if (copied) {
    return (
      <button
        type="button"
        disabled
        className={`copied-spring inline-flex items-center justify-center gap-1.5 font-bold rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs shrink-0 touch-manipulation select-none transition-all ${sizeClasses} ${className}`}
      >
        <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
        <span>¡Copiado!</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`btn-press inline-flex items-center justify-center gap-1.5 font-bold rounded-xl border bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white border-blue-600 shadow-xs shrink-0 touch-manipulation select-none transition-all ${sizeClasses} ${className}`}
      title="Copiar código al portapapeles"
      aria-label={`Copiar código ${textToCopy}`}
    >
      <Copy className="w-4 h-4 text-white/90" />
      <span>{label}</span>
    </button>
  );
}
