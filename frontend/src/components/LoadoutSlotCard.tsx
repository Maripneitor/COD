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
        className="btn-press w-full h-full min-h-[140px] p-5 rounded-2xl border-2 border-dashed border-slate-800 hover:border-cyan-500/50 bg-slate-950/40 hover:bg-cyan-950/20 flex flex-col items-center justify-center gap-2.5 transition-all duration-200 group text-left cursor-pointer"
      >
        <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 group-hover:border-cyan-500/40 group-hover:bg-cyan-500/20 text-slate-500 group-hover:text-cyan-300 flex items-center justify-center transition-colors">
          <Plus className="w-4 h-4" />
        </div>
        <div className="text-center">
          <div className="text-xs font-tactical uppercase tracking-wider font-bold text-slate-400 group-hover:text-cyan-300">
            Slot #{slot} Disponible
          </div>
          <p className="text-[11px] text-slate-600 group-hover:text-slate-400">
            Añadir arma o equipamiento táctico
          </p>
        </div>
      </button>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 hover:border-cyan-500/40 shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-all duration-200 flex flex-col justify-between group">
      
      {/* Top Weapon Header */}
      <div>
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 flex items-center justify-center font-mono text-xs font-bold shrink-0">
              {slot}
            </div>
            <div className="text-base font-tactical uppercase tracking-wider font-bold text-white truncate flex items-center">
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
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="Eliminar arma"
            aria-label="Eliminar arma"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Code List Section */}
        <div className="py-3 space-y-2.5">
          {item.codes && item.codes.length > 0 ? (
            item.codes.map((cd) => {
              const activeRating = hoverStarRating[cd.id] ?? (cd.calificacion || 0);

              return (
                <div
                  key={cd.id}
                  className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/90 hover:border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] shrink-0" />
                    <span className="font-mono text-xs font-bold text-cyan-300 truncate">
                      <InlineEditable
                        value={cd.codigo}
                        onSave={(newCode) => onUpdateCode(cd.id, newCode)}
                        className="font-mono"
                      />
                    </span>
                    <QuickCopyButton textToCopy={cd.codigo} />
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800/80 shrink-0 self-start sm:self-auto">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => onUpdateRating(cd.id, star)}
                        onMouseEnter={() => setHoverStarRating({ ...hoverStarRating, [cd.id]: star })}
                        onMouseLeave={() => setHoverStarRating({ ...hoverStarRating, [cd.id]: cd.calificacion || 0 })}
                        className="p-0.5 focus:outline-none transition-transform hover:scale-125"
                        title={`Calificar con ${star} estrellas`}
                      >
                        <Star
                          className={`w-3.5 h-3.5 transition-colors ${
                            star <= activeRating
                              ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                              : 'text-slate-700 hover:text-slate-500'
                          }`}
                        />
                      </button>
                    ))}
                    <button
                      onClick={() => onUpdateRating(cd.id, 0)}
                      className="text-[9px] font-mono text-slate-600 hover:text-slate-400 ml-1"
                      title="Quitar calificación"
                    >
                      0
                    </button>
                    <button
                      onClick={() => onDeleteCode(cd.id)}
                      className="p-0.5 ml-1 text-slate-600 hover:text-rose-400 transition-colors"
                      title="Eliminar este código"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-3 text-center rounded-xl bg-slate-950/40 border border-slate-900 text-slate-500 text-xs italic font-tactical">
              Sin configuraciones de código asignadas
            </div>
          )}
        </div>
      </div>

      {/* Add Code Bar */}
      <div className="pt-2 border-t border-slate-800/80">
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
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-cyan-500/50 text-cyan-200 text-xs font-mono uppercase outline-none ring-1 ring-cyan-500/30"
              />
              <button
                onClick={handleSaveNewCode}
                className="p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                title="Guardar código"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsAddingCode(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
                title="Cancelar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>Formato: TEXTO-10ALFANUM</span>
              {Boolean(newCodeInput) && (
                <span className={CODE_REGEX.test(newCodeInput) ? 'text-emerald-400' : 'text-amber-400'}>
                  {CODE_REGEX.test(newCodeInput) ? '✓ Válido' : 'Formato libre'}
                </span>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCode(true)}
            className="btn-press w-full py-1.5 px-3 rounded-lg border border-dashed border-cyan-500/20 hover:border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 text-[11px] font-tactical uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir Código Táctico</span>
          </button>
        )}
      </div>
    </div>
  );
}
