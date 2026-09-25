import { useState } from 'react';
import { X, Crosshair, Star, Plus, Trash2 } from 'lucide-react';
import QuickCopyButton from './QuickCopyButton';
import InlineEditable from './InlineEditable';

interface CodeItem {
  id: number;
  codigo: string;
  calificacion?: number;
  submodeName?: string;
}

interface WeaponDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  weapon: {
    weaponId: number;
    weaponName: string;
    className: string;
    submodeName: string;
    codes: CodeItem[];
    allSubmodeCodes?: Array<{
      submodeName: string;
      codes: CodeItem[];
    }>;
  } | null;
  onUpdateWeaponName: (id: number, name: string) => void;
  onUpdateCode: (codeId: number, code: string) => void;
  onDeleteCode: (codeId: number) => void;
  onUpdateRating: (codeId: number, rating: number) => void;
  onAddCode: (weaponId: number, code: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export default function WeaponDetailModal({
  isOpen,
  onClose,
  weapon,
  onUpdateWeaponName,
  onUpdateCode,
  onDeleteCode,
  onUpdateRating,
  onAddCode,
  onShowToast,
}: WeaponDetailModalProps) {
  const [newCodeInput, setNewCodeInput] = useState('');
  const [activeSubmodeFilter, setActiveSubmodeFilter] = useState<string>('Todos');

  if (!isOpen || !weapon) return null;

  // Flatten or collect all codes across submodes if available
  const allCodesWithSubmode: CodeItem[] = [];
  if (weapon.allSubmodeCodes && weapon.allSubmodeCodes.length > 0) {
    weapon.allSubmodeCodes.forEach(sm => {
      sm.codes.forEach(c => {
        allCodesWithSubmode.push({
          ...c,
          submodeName: sm.submodeName,
        });
      });
    });
  } else {
    weapon.codes.forEach(c => {
      allCodesWithSubmode.push({
        ...c,
        submodeName: weapon.submodeName,
      });
    });
  }

  // Filter codes by submode tab if selected
  const filteredCodes = allCodesWithSubmode.filter(c => {
    if (activeSubmodeFilter === 'Todos') return true;
    return c.submodeName?.toLowerCase() === activeSubmodeFilter.toLowerCase();
  });

  // Sort filtered codes by rating descending
  filteredCodes.sort((a, b) => (b.calificacion || 0) - (a.calificacion || 0));

  const handleAddCode = () => {
    if (!newCodeInput.trim()) return;
    onAddCode(weapon.weaponId, newCodeInput.trim().toUpperCase());
    setNewCodeInput('');
  };

  const submodesList = ['Todos', 'Primera Línea / Duelo por Equipos', 'Punto Caliente y Dominio', 'Buscar y Destruir / Control'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      
      {/* Modal / Bottom Sheet Card */}
      <div className="w-full sm:max-w-xl max-h-[90vh] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        
        {/* Mobile Drag Pill */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-slate-50">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Crosshair className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 truncate">
                  <InlineEditable
                    value={weapon.weaponName}
                    onSave={(newName) => onUpdateWeaponName(weapon.weaponId, newName)}
                    isTitle={true}
                  />
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {weapon.className}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {allCodesWithSubmode.length} {allCodesWithSubmode.length === 1 ? 'configuración guardada' : 'configuraciones guardadas'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-press p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 transition-colors touch-manipulation"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Submode Filter Pills in Modal */}
        <div className="p-2 border-b border-slate-100 bg-white overflow-x-auto no-scrollbar touch-pan-x flex items-center gap-1.5">
          {submodesList.map(smName => {
            const isSelected = activeSubmodeFilter === smName;
            return (
              <button
                key={smName}
                onClick={() => setActiveSubmodeFilter(smName)}
                className={`btn-press px-2.5 py-1 text-[11px] font-bold rounded-lg whitespace-nowrap border transition-all touch-manipulation shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {smName}
              </button>
            );
          })}
        </div>

        {/* Modal Body: Full Codes List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {filteredCodes.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No hay códigos registrados para este submodo.
            </div>
          ) : (
            filteredCodes.map((cd) => (
              <div
                key={cd.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 hover:border-slate-300 transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Armero
                    </span>
                    {cd.submodeName && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {cd.submodeName}
                      </span>
                    )}
                  </div>

                  {/* Clickable Rating Stars */}
                  <div className="flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => onUpdateRating(cd.id, star)}
                        className="p-0.5 focus:outline-none hover:scale-125 transition-transform"
                        title={`Calificar con ${star} estrellas`}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            star <= (cd.calificacion || 5)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Monospace Code Display Box with select-all for manual tap-hold selection */}
                <div className="font-mono text-xs sm:text-sm font-bold text-slate-900 bg-white p-2.5 rounded-lg border border-slate-200 select-all truncate">
                  <InlineEditable
                    value={cd.codigo}
                    onSave={(newCode) => onUpdateCode(cd.id, newCode)}
                  />
                </div>

                {/* 1-Click Fast Copy Action (≥44px Touch Target) */}
                <div className="flex items-center gap-2 pt-0.5">
                  <QuickCopyButton
                    textToCopy={cd.codigo}
                    label="Copiar Código"
                    onCopied={() => onShowToast('Código copiado al portapapeles', 'success')}
                  />
                  <button
                    onClick={() => onDeleteCode(cd.id)}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 bg-white transition-colors"
                    title="Eliminar código"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer: Add new code inline & close thumb button */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newCodeInput}
              onChange={(e) => setNewCodeInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCode();
              }}
              placeholder="Añadir nuevo código alfanumérico..."
              className="flex-1 px-3 py-2 text-xs font-mono uppercase rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
            />
            <button
              onClick={handleAddCode}
              className="btn-press px-3.5 py-2 min-h-[38px] rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="btn-press w-full py-2.5 min-h-[44px] rounded-xl bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors touch-manipulation"
          >
            <span>✕ Cerrar Detalle</span>
          </button>
        </div>
      </div>
    </div>
  );
}
