import { useState, useId } from 'react';
import { X, Star, Clipboard, Plus } from 'lucide-react';
import type { IModo } from '../types';

interface NewLoadoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newLoadout: {
    modoCodigo: string;
    categoria: string;
    armaNombre: string;
    submodoNombre: string;
    codigoArmero: string;
    calificacion: number;
    codigoId?: number;
    objetoId?: number;
  }) => void;
  modes: IModo[];
  activeModoId: number;
  selectedCategory?: string;
  selectedSubmode?: string;
  apiBase: string;
}

const CATEGORIES = [
  'Fusiles de Asalto',
  'Subfusiles',
  'Fusiles de Precisión',
  'Fusiles de Tirador',
  'Ametralladoras Ligeras',
  'Escopetas'
];

const SUBMODES = [
  'Primera Línea / Duelo por Equipos',
  'Punto Caliente y Dominio',
  'Buscar y Destruir / Control'
];

export default function NewLoadoutModal({
  isOpen,
  onClose,
  onSuccess,
  modes,
  activeModoId,
  selectedCategory,
  selectedSubmode,
  apiBase
}: NewLoadoutModalProps) {
  const currentMode = modes.find(m => m.id === activeModoId) || modes[0];
  const datalistId = useId();

  const [modoCodigo, setModoCodigo] = useState<string>(currentMode?.codigo || 'MJ');
  const [categoria, setCategoria] = useState<string>(
    selectedCategory && selectedCategory !== 'ALL' ? selectedCategory : 'Fusiles de Asalto'
  );
  const [armaNombre, setArmaNombre] = useState<string>('');
  const [submodoNombre, setSubmodoNombre] = useState<string>(
    selectedSubmode && selectedSubmode !== 'ALL' ? selectedSubmode : SUBMODES[0]
  );
  const [codigoArmero, setCodigoArmero] = useState<string>('');
  const [calificacion, setCalificacion] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pastedFeedback, setPastedFeedback] = useState<boolean>(false);

  // Extract known weapon suggestions from loaded modes for autocomplete
  const existingWeapons = Array.from(
    new Set(
      modes.flatMap(m =>
        m.submodos.flatMap(s =>
          s.clases
            .filter(c => !categoria || c.nombre.toLowerCase() === categoria.toLowerCase())
            .flatMap(c => c.objetos.map(o => o.nombre))
        )
      )
    )
  ).filter(Boolean);

  if (!isOpen) return null;

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setCodigoArmero(text.trim());
          setPastedFeedback(true);
          navigator.vibrate?.(30);
          setTimeout(() => setPastedFeedback(false), 1500);
        }
      }
    } catch {
      // Fallback: clipboard permission denied or not supported
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanWeapon = armaNombre.trim();
    const cleanCode = codigoArmero.trim();

    if (!cleanWeapon) {
      setErrorMsg('Por favor ingresa o selecciona el nombre del arma.');
      return;
    }
    if (!cleanCode) {
      setErrorMsg('Por favor ingresa o pega el código de armero.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        modoCodigo,
        categoria,
        armaNombre: cleanWeapon,
        submodoNombre,
        codigoArmero: cleanCode,
        calificacion
      };

      const res = await fetch(`${apiBase}/loadouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${res.status} al guardar`);
      }

      const result = await res.json();
      navigator.vibrate?.(40);

      onSuccess({
        ...payload,
        codigoId: result.codigoId,
        objetoId: result.objetoId
      });

      // Reset form
      setArmaNombre('');
      setCodigoArmero('');
      setCalificacion(5);
      onClose();
    } catch (err: any) {
      console.error('Failed to create loadout:', err);
      setErrorMsg(err.message || 'Error al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
      <div 
        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Registrar Nueva Configuración</h2>
              <p className="text-xs text-slate-500">Añade un arma y su código de armero con calificación</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* 1. Modo Principal */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Modo de Juego
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: 'MJ', label: 'Multijugador' },
                { code: 'BR', label: 'Battle Royale' },
                { code: 'ZM', label: 'Zombies' }
              ].map(m => (
                <button
                  type="button"
                  key={m.code}
                  onClick={() => setModoCodigo(m.code)}
                  className={`py-2 px-2 text-xs font-medium rounded-lg border transition-all flex flex-col items-center justify-center gap-0.5 ${
                    modoCodigo === m.code
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold">{m.code}</span>
                  <span className="text-[10px] opacity-90 truncate max-w-full">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Categoría de Arma */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Categoría de Arma
            </label>
            <select
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Nombre del Arma */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Nombre del Arma
            </label>
            <input
              type="text"
              list={datalistId}
              value={armaNombre}
              onChange={e => setArmaNombre(e.target.value)}
              placeholder="Ej: Kilo 141, CX-9, XM4..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
              required
            />
            <datalist id={datalistId}>
              {existingWeapons.map(w => (
                <option key={w} value={w} />
              ))}
            </datalist>
          </div>

          {/* 4. Submodo / Propósito Competitivo */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Submodo / Enfoque Competitivo
            </label>
            <select
              value={submodoNombre}
              onChange={e => setSubmodoNombre(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
            >
              {SUBMODES.map(sm => (
                <option key={sm} value={sm}>
                  {sm}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Código de Armero */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Código de Armero
              </label>
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="text-[11px] font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-blue-100 active:scale-95 transition-all"
              >
                <Clipboard className="w-3 h-3" />
                {pastedFeedback ? '¡Pegado!' : 'Pegar portapapeles'}
              </button>
            </div>
            <input
              type="text"
              value={codigoArmero}
              onChange={e => setCodigoArmero(e.target.value)}
              placeholder="Ej: XM4-1A2G4E8F9E"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2.5 text-sm font-mono tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all select-all font-bold"
              required
            />
          </div>

          {/* 6. Calificación Inicial (Estrellas) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Calificación Inicial
            </label>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
              {[1, 2, 3, 4, 5].map(star => {
                const isFilled = (hoverRating !== null ? hoverRating : calificacion) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCalificacion(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 text-slate-300 hover:scale-110 active:scale-95 transition-transform"
                    title={`${star} estrellas`}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        isFilled
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-200'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="ml-2 text-xs font-semibold text-slate-700">
                {(hoverRating !== null ? hoverRating : calificacion).toFixed(1)} ★
              </span>
            </div>
          </div>
        </form>

        {/* Sticky Actions Footer */}
        <div className="sticky bottom-0 bg-white p-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-medium text-sm transition-all min-h-[44px] flex items-center justify-center"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2 min-h-[44px] flex-1 sm:flex-initial active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            {isSubmitting ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </div>
    </div>
  );
}
