import { useState, useEffect, useRef } from 'react';
import { Search, X, Layers, Crosshair, Hash, Terminal, Database, ArrowRight } from 'lucide-react';
import type { IModo, SearchResultItem } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  modes: IModo[];
  onSelectResult: (item: SearchResultItem) => void;
  onOpenVault: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  modes,
  onSelectResult,
  onOpenVault,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build searchable index from modes
  const results: SearchResultItem[] = [];
  const q = query.trim().toLowerCase();

  modes.forEach((mode) => {
    if (!q || mode.nombre.toLowerCase().includes(q) || mode.codigo.toLowerCase().includes(q)) {
      results.push({
        type: 'mode',
        title: mode.nombre,
        subtitle: `Modo [${mode.codigo}]`,
        badge: 'MODO',
        modeId: mode.id,
      });
    }

    mode.submodos?.forEach((submode) => {
      if (!q || submode.nombre.toLowerCase().includes(q)) {
        results.push({
          type: 'submode',
          title: submode.nombre,
          subtitle: `Submodo en ${mode.nombre}`,
          badge: submode.es_predeterminado ? 'GLOBAL' : 'SUBMODO',
          modeId: mode.id,
          submodeId: submode.id,
        });
      }

      submode.clases?.forEach((clase) => {
        if (!q || clase.nombre.toLowerCase().includes(q)) {
          results.push({
            type: 'class',
            title: clase.nombre,
            subtitle: `${mode.nombre} > ${submode.nombre}`,
            badge: 'CLASE',
            modeId: mode.id,
            submodeId: submode.id,
            classId: clase.id,
          });
        }

        clase.objetos?.forEach((obj) => {
          const matchWeapon = !q || obj.nombre.toLowerCase().includes(q);
          const matchCode = obj.codigos?.some(c => c.codigo.toLowerCase().includes(q));

          if (matchWeapon || matchCode) {
            results.push({
              type: 'weapon',
              title: obj.nombre,
              subtitle: `${clase.nombre} (${submode.nombre})`,
              badge: `${obj.codigos?.length || 0} CÓDIGOS`,
              modeId: mode.id,
              submodeId: submode.id,
              classId: clase.id,
              weaponId: obj.id,
            });

            obj.codigos?.forEach((cd) => {
              if (!q || cd.codigo.toLowerCase().includes(q)) {
                results.push({
                  type: 'code',
                  title: cd.codigo,
                  subtitle: `Arma: ${obj.nombre} • ${clase.nombre}`,
                  badge: cd.calificacion ? `${cd.calificacion}★` : 'CÓDIGO',
                  modeId: mode.id,
                  submodeId: submode.id,
                  classId: clase.id,
                  weaponId: obj.id,
                  codeString: cd.codigo,
                });
              }
            });
          }
        });
      });
    });
  });

  const displayResults = results.slice(0, 30);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < displayResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : displayResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (displayResults[selectedIndex]) {
        onSelectResult(displayResults[selectedIndex]);
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl rounded-2xl glass-panel-glow border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden animate-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-cyan-500/20 bg-slate-900/80">
          <Terminal className="w-5 h-5 text-cyan-400 mr-3 animate-pulse" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar modos, clases, armas o códigos (ej: M4, DL Q33)..."
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-sm font-tactical tracking-wide outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block ml-3 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            ESC para cerrar
          </span>
        </div>

        {/* Quick Quick Actions Bar */}
        <div className="px-4 py-2 border-b border-cyan-500/10 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-tactical">
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span>{displayResults.length} resultados encontrados</span>
          </span>
          <button
            onClick={() => {
              onClose();
              onOpenVault();
            }}
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-tactical uppercase tracking-wider text-[11px] font-bold"
          >
            <Database className="w-3 h-3" />
            <span>Abrir Bóveda de Datos (JSON/CSV)</span>
          </button>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
          {displayResults.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Crosshair className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
              <p className="text-sm font-tactical">No se encontraron objetivos coincidentes con "{query}"</p>
            </div>
          ) : (
            displayResults.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={`${item.type}-${item.title}-${index}`}
                  onClick={() => {
                    onSelectResult(item);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-100 ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'text-slate-300 hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        item.type === 'weapon'
                          ? 'bg-fuchsia-500/20 text-fuchsia-400'
                          : item.type === 'code'
                          ? 'bg-emerald-500/20 text-emerald-400 font-mono text-xs'
                          : item.type === 'class'
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {item.type === 'weapon' && <Crosshair className="w-4 h-4" />}
                      {item.type === 'code' && <Hash className="w-4 h-4" />}
                      {item.type === 'class' && <Layers className="w-4 h-4" />}
                      {(item.type === 'mode' || item.type === 'submode') && <Database className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate flex items-center gap-2">
                        <span>{item.title}</span>
                        {item.type === 'code' && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                            CÓDIGO
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 truncate">{item.subtitle}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {item.badge && (
                      <span className="text-[10px] font-tactical uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-slate-300 border border-slate-700">
                        {item.badge}
                      </span>
                    )}
                    <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600'} transition-transform`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-cyan-500/10 bg-slate-950/70 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navegar</span>
            <span>↵ Seleccionar</span>
            <span>Esc Salir</span>
          </div>
          <span className="text-cyan-500 font-tactical">NexusCOD Terminal v2.0</span>
        </div>
      </div>
    </div>
  );
}
