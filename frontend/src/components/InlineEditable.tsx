import { useState, useRef, useEffect } from 'react';
import { Pencil, Check } from 'lucide-react';

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
      <div className="inline-flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
        <input
          ref={inputRef}
          type="text"
          value={draftVal}
          placeholder={placeholder}
          onChange={(e) => setDraftVal(e.target.value)}
          onBlur={handleCommit}
          onKeyDown={handleKeyDown}
          className={`px-2.5 py-1 text-sm bg-slate-900/90 text-cyan-200 border border-cyan-400/80 rounded-lg outline-none ring-2 ring-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all duration-150 ${className}`}
          style={{ width: `${Math.max(draftVal.length + 3, 10)}ch` }}
        />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleCommit();
          }}
          className="p-1 rounded-md bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
          title="Guardar (Enter)"
        >
          <Check className="w-3.5 h-3.5" />
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
      title="Doble clic o pulsa el lápiz para editar"
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
          className="opacity-0 group-hover/edit:opacity-100 p-0.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-opacity duration-150 shrink-0"
          title="Editar"
          aria-label="Editar"
        >
          <Pencil className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
