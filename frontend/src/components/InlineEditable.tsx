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
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 900);
      try {
        await onSave(trimmed);
      } catch (err) {
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
          className={`px-2.5 py-1 text-sm bg-white text-slate-900 border border-blue-500 rounded-lg outline-none ring-2 ring-blue-100 shadow-sm transition-all ${className}`}
          style={{ width: `${Math.min(Math.max(draftVal.length + 3, 10), 30)}ch`, maxWidth: '100%' }}
        />
        <button
          type="button"
          onClick={handleCommit}
          className="btn-press min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
          title="Guardar cambios"
          aria-label="Guardar"
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="btn-press min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          title="Cancelar edición"
          aria-label="Cancelar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <span
      onDoubleClick={() => setIsEditing(true)}
      className={`group/edit inline-flex items-center gap-1.5 cursor-pointer rounded px-1 -mx-1 transition-colors duration-150 ${
        savedFlash
          ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-300'
          : 'hover:bg-blue-50 hover:text-blue-700'
      } ${className} ${isTitle ? 'font-semibold text-slate-900' : 'text-slate-800'}`}
      title="Haz doble clic o pulsa el lápiz para editar"
    >
      <span className="truncate">{draftVal || <span className="italic text-slate-400">{placeholder}</span>}</span>
      
      {savedFlash ? (
        <Check className="w-3.5 h-3.5 text-emerald-600 animate-in zoom-in-90 duration-150 shrink-0" />
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className="min-w-[24px] min-h-[24px] flex items-center justify-center p-0.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 opacity-80 sm:opacity-0 sm:group-hover/edit:opacity-100 transition-opacity duration-150 shrink-0"
          title="Editar"
          aria-label="Editar"
        >
          <Pencil className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
