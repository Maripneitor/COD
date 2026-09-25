import { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';

interface InlineEditableProps {
  value: string;
  onSave: (val: string) => void | Promise<void>;
  className?: string;
  isTitle?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export default function InlineEditable({
  value,
  onSave,
  className = "",
  isTitle = false,
  placeholder = "Escribe aquí...",
  disabled = false,
}: InlineEditableProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftVal, setDraftVal] = useState(value);
  const [savedFlash, setSavedFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraftVal(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleCommit = async () => {
    if (!isEditing) return;
    const trimmed = draftVal.trim();
    setIsEditing(false);

    if (trimmed !== "" && trimmed !== value) {
      // Optimistic visual feedback
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 900);
      try {
        await onSave(trimmed);
      } catch (err) {
        // Rollback on failure
        setDraftVal(value);
      }
    } else {
      setDraftVal(value);
    }
  };

  const handleCancel = () => {
    setDraftVal(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (disabled) {
    return <span className={className}>{value}</span>;
  }

  if (isEditing) {
    return (
      <div className="inline-flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150 py-0.5 max-w-full">
        <input
          ref={inputRef}
          type="text"
          value={draftVal}
          placeholder={placeholder}
          onChange={(e) => setDraftVal(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`px-2.5 py-1.5 text-base sm:text-sm bg-slate-900 text-cyan-200 border border-cyan-400 rounded-lg outline-none ring-2 ring-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all ${className}`}
          style={{ width: `${Math.min(Math.max(draftVal.length + 3, 10), 30)}ch`, maxWidth: '100%' }}
        />
        <button
          type="button"
          onClick={handleCommit}
          className="btn-press min-w-[38px] min-h-[38px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors shadow-sm"
          title="Guardar cambios"
          aria-label="Guardar"
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="btn-press min-w-[38px] min-h-[38px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="Cancelar edición"
          aria-label="Cancelar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <span
      onDoubleClick={() => setIsEditing(true)}
      className={`group/edit inline-flex items-center gap-1.5 cursor-pointer rounded px-1 -mx-1 transition-colors duration-150 ${
        savedFlash
          ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50'
          : 'hover:bg-cyan-500/10 hover:text-cyan-300'
      } ${className} ${isTitle ? 'font-bold' : ''}`}
      title="Toca el lápiz o haz doble clic para editar"
    >
      <span className="truncate">{draftVal || <span className="italic text-slate-500">{placeholder}</span>}</span>
      
      {savedFlash ? (
        <Check className="w-3.5 h-3.5 text-emerald-400 animate-in zoom-in-90 duration-150 shrink-0" />
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className="min-w-[32px] min-h-[32px] sm:min-w-[24px] sm:min-h-[24px] flex items-center justify-center p-1 rounded-md text-slate-400 hover:text-cyan-300 active:bg-cyan-500/20 opacity-80 sm:opacity-0 sm:group-hover/edit:opacity-100 transition-opacity duration-150 shrink-0 touch-manipulation"
          title="Editar este elemento"
          aria-label="Editar"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
    </span>
  );
}
