import { useState } from 'react';
import { Star, Plus, Trash2, Check, X } from 'lucide-react';
import InlineEditable from './InlineEditable';
import QuickCopyButton from './QuickCopyButton';
import type { ICodigo } from '../types';

interface LoadoutSlotCardProps {
  slot: number;
  item: {
    id: number;
    name: string;
    codes: ICodigo[];
  } | null;
  onAddWeapon: (slot: number) => void;
  onDeleteWeapon: (id: number) => void;
  onUpdateWeaponName: (id: number, name: string) => void;
  onAddCode: (weaponId: number, codeVal: string) => Promise<void>;
  onUpdateCode: (codeId: number, codeVal: string) => void;
  onDeleteCode: (codeId: number) => void;
  onUpdateRating: (codeId: number, rating: number) => void;
}

const CODE_REGEX = /^[A-Za-z]+-[A-Za-z0-9]{10}$/;

export default function LoadoutSlotCard({
  slot,
  item,
  onAddWeapon,
  onDeleteWeapon,
  onUpdateWeaponName,
  onAddCode,
  onUpdateCode,
  onDeleteCode,
  onUpdateRating,
}: LoadoutSlotCardProps) {
  const [isAddingCode, setIsAddingCode] = useState(false);
  const [newCodeInput, setNewCodeInput] = useState('');
  const [hoverStarRating, setHoverStarRating] = useState<Record<number, number>>({});

  const handleSaveNewCode = async () => {
    if (!item) return;
    const trimmed = newCodeInput.trim().toUpperCase();
    if (trimmed) {
      await onAddCode(item.id, trimmed);
      setNewCodeInput('');
      setIsAddingCode(false);
    }
  };

  if (!item) {
    return (
      <button
        onClick={() => onAddWeapon(slot)}
        className="btn-press w-full h-full min-h-[140px] p-5 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/40 flex flex-col items-center justify-center gap-2.5 transition-all text-left cursor-pointer shadow-sm group touch-manipulation"
      >
        <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-blue-100 text-slate-400 group-hover:text-blue-600 flex items-center justify-center transition-colors">
          <Plus className="w-4 h-4" />
        </div>
        <div className="text-center">
          <div className="text-xs font-semibold text-slate-700 group-hover:text-blue-700">
            Slot #{slot} Disponible
          </div>
          <p className="text-[11px] text-slate-400 group-hover:text-slate-500">
            Añadir arma a este slot
          </p>
        </div>
      </button>
    );
  }

  return (
    <div className="saas-card rounded-xl p-4 sm:p-5 border border-slate-200 bg-white flex flex-col justify-between group">
      
      {/* Top Weapon Header */}
      <div>
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-mono text-xs font-bold shrink-0">
              {slot}
            </div>
            <div className="text-sm sm:text-base font-semibold text-slate-900 truncate flex items-center min-w-0">
              <InlineEditable
                value={item.name}
                onSave={(newName) => onUpdateWeaponName(item.id, newName)}
                isTitle={true}
                placeholder="Nombre del Arma..."
              />
            </div>
          </div>

          <button
            onClick={() => onDeleteWeapon(item.id)}
            className="min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-80 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 touch-manipulation"
            title="Eliminar arma"
            aria-label="Eliminar arma"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Code List Section */}
        <div className="py-3 space-y-2">
          {item.codes && item.codes.length > 0 ? (
            item.codes.map((cd) => {
              const activeRating = hoverStarRating[cd.id] ?? (cd.calificacion || 0);

              return (
                <div
                  key={cd.id}
                  className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200/80 flex flex-col gap-2 transition-all"
                >
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="font-mono text-xs font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 truncate">
                        <InlineEditable
                          value={cd.codigo}
                          onSave={(newCode) => onUpdateCode(cd.id, newCode)}
                          className="font-mono"
                        />
                      </span>
                    </div>
                    <QuickCopyButton textToCopy={cd.codigo} size="sm" />
                  </div>

                  {/* Rating Stars & Controls */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                    <div className="flex items-center gap-0.5 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-xs">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => onUpdateRating(cd.id, star)}
                          onMouseEnter={() => setHoverStarRating({ ...hoverStarRating, [cd.id]: star })}
                          onMouseLeave={() => setHoverStarRating({ ...hoverStarRating, [cd.id]: cd.calificacion || 0 })}
                          className="p-0.5 focus:outline-none transition-transform hover:scale-125 touch-manipulation"
                          title={`Calificar con ${star} estrellas`}
                          aria-label={`Calificar con ${star} estrellas`}
                        >
                          <Star
                            className={`w-3.5 h-3.5 transition-colors ${
                              star <= activeRating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        </button>
                      ))}
                      <button
                        onClick={() => onUpdateRating(cd.id, 0)}
                        className="px-1 py-0.5 text-[10px] font-mono text-slate-400 hover:text-slate-600"
                        title="Quitar calificación"
                      >
                        0★
                      </button>
                    </div>

                    <button
                      onClick={() => onDeleteCode(cd.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors touch-manipulation"
                      title="Eliminar este código"
                      aria-label="Eliminar código"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-3 text-center rounded-lg bg-slate-50 border border-slate-100 text-slate-400 text-xs italic">
              Sin códigos asignados
            </div>
          )}
        </div>
      </div>

      {/* Add Code Bar */}
      <div className="pt-2 border-t border-slate-100">
        {isAddingCode ? (
          <div className="space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                value={newCodeInput}
                onChange={(e) => setNewCodeInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveNewCode();
                  if (e.key === 'Escape') setIsAddingCode(false);
                }}
                placeholder="M4-A9K3L7B0X1"
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-blue-500 text-slate-900 text-xs font-mono uppercase outline-none ring-2 ring-blue-100"
              />
              <button
                onClick={handleSaveNewCode}
                className="btn-press min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                title="Guardar código"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <button
                onClick={() => setIsAddingCode(false)}
                className="btn-press min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                title="Cancelar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Formato: TEXTO-10ALFANUM</span>
              {Boolean(newCodeInput) && (
                <span className={CODE_REGEX.test(newCodeInput) ? 'text-emerald-600 font-medium' : 'text-amber-600'}>
                  {CODE_REGEX.test(newCodeInput) ? '✓ Válido' : 'Formato libre'}
                </span>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCode(true)}
            className="btn-press w-full py-1.5 px-3 rounded-lg border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 text-slate-600 hover:text-blue-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors touch-manipulation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir Código</span>
          </button>
        )}
      </div>
    </div>
  );
}
