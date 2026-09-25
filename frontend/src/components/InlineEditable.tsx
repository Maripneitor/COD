import { useState, useRef, useEffect } from 'react';

interface InlineEditableProps {
  value: string;
  onSave: (val: string) => void;
  className?: string;
  isTitle?: boolean;
}

export default function InlineEditable({ value, onSave, className = "", isTitle = false }: InlineEditableProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setVal(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (val.trim() !== value && val.trim() !== "") {
      onSave(val.trim());
    } else {
      setVal(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setVal(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`bg-transparent outline-none border-b border-cyan-500/50 dark:border-cyan-400 focus:border-fuchsia-500 dark:focus:border-fuchsia-500 transition-colors ${className}`}
        style={{ width: `${Math.max(val.length, 5)}ch` }}
      />
    );
  }

  return (
    <span 
      onDoubleClick={() => setIsEditing(true)} 
      className={`cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors ${className} ${isTitle ? 'font-bold' : ''}`}
      title="Doble clic para editar"
    >
      {val}
    </span>
  );
}
