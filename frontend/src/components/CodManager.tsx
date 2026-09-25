import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Layers, 
  Search, 
  CheckCircle, 
  ShieldAlert, 
  Info, 
  Plus, 
  X, 
  Globe, 
  Crosshair, 
  Star, 
  Download, 
  Target, 
  Zap, 
  Shield, 
  Flame, 
  Trash2, 
  ArrowRight
} from 'lucide-react';
import type { IModo, ActiveView, ToastNotification, SearchResultItem } from '../types';
import HierarchyTree from './HierarchyTree';
import DataVaultModal from './DataVaultModal';
import CommandPalette from './CommandPalette';
import SkeletonLoader from './SkeletonLoader';
import QuickCopyButton from './QuickCopyButton';
import InlineEditable from './InlineEditable';
import WeaponDetailModal from './WeaponDetailModal';
import NewLoadoutModal from './NewLoadoutModal';

const API_BASE = typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  ? `http://${window.location.hostname}:3000/api`
  : 'http://localhost:3000/api';

const CATEGORY_CHIPS = [
  'Todos',
  'Fusiles de Asalto',
  'Subfusiles',
  'Fusiles de Precisión',
  'Fusiles de Tirador',
  'Ametralladoras Ligeras',
  'Escopetas',
] as const;

export default function CodManager() {
  const [modes, setModes] = useState<IModo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');

  // Fast Selection State
  const [currentModeId, setCurrentModeId] = useState<number | null>(null);
  const [currentSubmodeId, setCurrentSubmodeId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Dialogs
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isNewLoadoutOpen, setIsNewLoadoutOpen] = useState(false);
  const [selectedDetailWeapon, setSelectedDetailWeapon] = useState<any | null>(null);
  const [newCodeInputs, setNewCodeInputs] = useState<Record<number, string>>({});

  // Toast Notifications
  const [toast, setToast] = useState<ToastNotification>({ show: false, message: '', type: 'info' });

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 1500);
  };

  // Keyboard shortcut Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/modes`);
      const data: IModo[] = await res.json();
      setModes(data);

      if (data.length > 0) {
        // Set Multijugador (MJ) by default if available or preserve valid selection
        const mjMode = data.find(m => m.codigo === 'MJ') || data[0];
        setCurrentModeId(prev => {
          if (prev && data.some(m => m.id === prev)) return prev;
          return mjMode.id;
        });

        setCurrentSubmodeId(prev => {
          const targetMode = data.find(m => m.id === currentModeId) || mjMode;
          if (targetMode && targetMode.submodos && targetMode.submodos.length > 0) {
            if (prev && targetMode.submodos.some(s => s.id === prev)) return prev;
            const defaultSub = targetMode.submodos.find(s => s.es_predeterminado) || targetMode.submodos[0];
            return defaultSub.id;
          }
          return null;
        });
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      showToast('Error conectando con la base de datos', 'error');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Mode Selection
  const handleSelectMode = (modeId: number) => {
    setCurrentModeId(modeId);
    const m = modes.find(item => item.id === modeId);
    if (m && m.submodos && m.submodos.length > 0) {
      const defaultSub = m.submodos.find(s => s.es_predeterminado) || m.submodos[0];
      setCurrentSubmodeId(defaultSub.id);
    } else {
      setCurrentSubmodeId(null);
    }
  };

  // Submode Selection
  const handleSelectSubmode = (submodeId: number) => {
    setCurrentSubmodeId(submodeId);
  };

  // Weapon & Code CRUD Handlers
  const handleOpenAddWeapon = (defaultCategory?: string) => {
    if (defaultCategory && defaultCategory !== 'Todos') {
      setSelectedCategory(defaultCategory);
    }
    setIsNewLoadoutOpen(true);
  };

  const handleLoadoutCreated = (newLoadout: {
    modoCodigo: string;
    categoria: string;
    armaNombre: string;
    submodoNombre: string;
    codigoArmero: string;
    calificacion: number;
    codigoId?: number;
    objetoId?: number;
  }) => {
    // Optimistic UI state update
    setModes(prevModes => {
      const updated = prevModes.map(m => {
        // Match mode
        const isTargetMode = m.codigo.toUpperCase() === newLoadout.modoCodigo.toUpperCase() ||
          (m.nombre && m.nombre.toLowerCase().includes(newLoadout.modoCodigo.toLowerCase())) ||
          m.id === currentModeId;

        if (!isTargetMode) return m;

        const submodos = [...(m.submodos || [])];
        let sm = submodos.find(s => 
          s.nombre.toLowerCase().includes(newLoadout.submodoNombre.toLowerCase().split('/')[0].trim()) ||
          newLoadout.submodoNombre.toLowerCase().includes(s.nombre.toLowerCase().split('/')[0].trim())
        );

        if (!sm) {
          sm = {
            id: Date.now(),
            nombre: newLoadout.submodoNombre,
            es_predeterminado: false,
            orden: submodos.length + 1,
            clases: []
          };
          submodos.push(sm);
        }

        const clases = [...(sm.clases || [])];
        let cl = clases.find(c => c.nombre.toLowerCase() === newLoadout.categoria.toLowerCase());
        if (!cl) {
          cl = {
            id: Date.now() + 1,
            nombre: newLoadout.categoria,
            objetos: []
          };
          clases.push(cl);
        }

        const objetos = [...(cl.objetos || [])];
        let obj = objetos.find(o => o.nombre.toLowerCase() === newLoadout.armaNombre.toLowerCase());
        if (!obj) {
          obj = {
            id: newLoadout.objetoId || Date.now() + 2,
            nombre: newLoadout.armaNombre,
            posicion: objetos.length + 1,
            codigos: []
          };
          objetos.push(obj);
        }

        const newCodeItem = {
          id: newLoadout.codigoId || Date.now() + 3,
          codigo: newLoadout.codigoArmero,
          calificacion: newLoadout.calificacion
        };

        const updatedObj = {
          ...obj,
          codigos: [newCodeItem, ...(obj.codigos || [])].sort(
            (a, b) => (b.calificacion ?? 0) - (a.calificacion ?? 0)
          )
        };

        const updatedClases = clases.map(c => 
          c.id === cl!.id 
            ? { ...c, objetos: objetos.map(o => o.id === obj!.id ? updatedObj : o) }
            : c
        );

        return {
          ...m,
          submodos: submodos.map(s => s.id === sm!.id ? { ...s, clases: updatedClases } : s)
        };
      });
      return updated;
    });

    showToast('Armero guardado con éxito', 'success');
    loadData(); // Re-sync in background
  };

  const handleUpdateWeaponName = async (weaponId: number, newName: string) => {
    try {
      await fetch(`${API_BASE}/objetos/${weaponId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newName }),
      });
      // Update local state optimistically
      setModes(prev => prev.map(m => ({
        ...m,
        submodos: m.submodos?.map(sm => ({
          ...sm,
          clases: sm.clases?.map(cl => ({
            ...cl,
            objetos: cl.objetos?.map(obj => obj.id === weaponId ? { ...obj, nombre: newName } : obj)
          }))
        }))
      })));
      if (selectedDetailWeapon && selectedDetailWeapon.weaponId === weaponId) {
        setSelectedDetailWeapon((prev: any) => prev ? { ...prev, weaponName: newName } : null);
      }
      showToast('Nombre actualizado', 'success');
    } catch (err) {
      showToast('Error al actualizar', 'error');
    }
  };

  const handleDeleteWeapon = async (weaponId: number) => {
    if (!confirm('¿Eliminar esta arma y sus códigos?')) return;
    try {
      await fetch(`${API_BASE}/objetos/${weaponId}`, { method: 'DELETE' });
      setModes(prev => prev.map(m => ({
        ...m,
        submodos: m.submodos?.map(sm => ({
          ...sm,
          clases: sm.clases?.map(cl => ({
            ...cl,
            objetos: cl.objetos?.filter(obj => obj.id !== weaponId)
          }))
        }))
      })));
      if (selectedDetailWeapon && selectedDetailWeapon.weaponId === weaponId) {
        setSelectedDetailWeapon(null);
      }
      showToast('Arma eliminada', 'info');
    } catch (err) {
      showToast('Error al eliminar', 'error');
    }
  };

  const handleAddCodeToWeapon = async (weaponId: number, codeVal: string) => {
    if (!codeVal.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/codigos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objeto_id: weaponId, codigo: codeVal.trim().toUpperCase() }),
      });
      const newCode = await res.json();
      setNewCodeInputs(prev => ({ ...prev, [weaponId]: '' }));
      
      const updatedCodeObj = { id: newCode.id || Date.now(), codigo: codeVal.trim().toUpperCase(), calificacion: 5 };

      setModes(prev => prev.map(m => ({
        ...m,
        submodos: m.submodos?.map(sm => ({
          ...sm,
          clases: sm.clases?.map(cl => ({
            ...cl,
            objetos: cl.objetos?.map(obj => {
              if (obj.id === weaponId) {
                return {
                  ...obj,
                  codigos: [...(obj.codigos || []), updatedCodeObj]
                };
              }
              return obj;
            })
          }))
        }))
      })));

      if (selectedDetailWeapon && selectedDetailWeapon.weaponId === weaponId) {
        setSelectedDetailWeapon((prev: any) => prev ? {
          ...prev,
          codes: [...prev.codes, updatedCodeObj]
        } : null);
      }

      showToast('Código guardado', 'success');
    } catch (err) {
      showToast('Error al guardar código', 'error');
    }
  };

  const handleUpdateCode = async (codeId: number, codeVal: string) => {
    try {
      await fetch(`${API_BASE}/codigos/${codeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: codeVal }),
      });
      setModes(prev => prev.map(m => ({
        ...m,
        submodos: m.submodos?.map(sm => ({
          ...sm,
          clases: sm.clases?.map(cl => ({
            ...cl,
            objetos: cl.objetos?.map(obj => ({
              ...obj,
              codigos: obj.codigos?.map(cd => cd.id === codeId ? { ...cd, codigo: codeVal } : cd)
            }))
          }))
        }))
      })));
      if (selectedDetailWeapon) {
        setSelectedDetailWeapon((prev: any) => prev ? {
          ...prev,
          codes: prev.codes.map((c: any) => c.id === codeId ? { ...c, codigo: codeVal } : c)
        } : null);
      }
      showToast('Código actualizado', 'success');
    } catch (err) {
      showToast('Error al actualizar', 'error');
    }
  };

  const handleDeleteCode = async (codeId: number) => {
    try {
      await fetch(`${API_BASE}/codigos/${codeId}`, { method: 'DELETE' });
      setModes(prev => prev.map(m => ({
        ...m,
        submodos: m.submodos?.map(sm => ({
          ...sm,
          clases: sm.clases?.map(cl => ({
            ...cl,
            objetos: cl.objetos?.map(obj => ({
              ...obj,
              codigos: obj.codigos?.filter(cd => cd.id !== codeId)
            }))
          }))
        }))
      })));
      if (selectedDetailWeapon) {
        setSelectedDetailWeapon((prev: any) => prev ? {
          ...prev,
          codes: prev.codes.filter((c: any) => c.id !== codeId)
        } : null);
      }
      showToast('Código eliminado', 'info');
    } catch (err) {
      showToast('Error al eliminar', 'error');
    }
  };

  // Star Rating Interactive Update + Smooth Instant Re-sorting
  const handleUpdateRating = async (codeId: number, rating: number) => {
    try {
      setModes(prev => prev.map(m => ({
        ...m,
        submodos: m.submodos?.map(sm => ({
          ...sm,
          clases: sm.clases?.map(cl => ({
            ...cl,
            objetos: cl.objetos?.map(obj => ({
              ...obj,
              codigos: obj.codigos?.map(cd => cd.id === codeId ? { ...cd, calificacion: rating } : cd)
            }))
          }))
        }))
      })));

      if (selectedDetailWeapon) {
        setSelectedDetailWeapon((prev: any) => prev ? {
          ...prev,
          codes: prev.codes.map((c: any) => c.id === codeId ? { ...c, calificacion: rating } : c)
        } : null);
      }

      await fetch(`${API_BASE}/codigos/${codeId}/rating`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calificacion: rating }),
      });
      showToast(`Calificación guardada: ${rating}★`, 'success');
    } catch (err) {
      showToast('Error al calificar', 'error');
    }
  };

  // Search Palette Selection
  const handleSelectSearchResult = (item: SearchResultItem) => {
    if (item.modeId) setCurrentModeId(item.modeId);
    if (item.submodeId) setCurrentSubmodeId(item.submodeId);
    if (item.title) setSearchQuery(item.title);
    setActiveView('dashboard');
    showToast(`Filtrando: ${item.title}`, 'info');
  };

  // Category Icon helper
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('asalto')) return <Target className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
    if (name.includes('subfusil')) return <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
    if (name.includes('precisión') || name.includes('precision')) return <Crosshair className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
    if (name.includes('tirador')) return <Crosshair className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
    if (name.includes('ligera') || name.includes('ametralladora')) return <Shield className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
    if (name.includes('escopeta')) return <Flame className="w-3.5 h-3.5 text-orange-600 shrink-0" />;
    return <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
  };

  // Active Data Model with resilient fallbacks
  const currentMode = modes.find(m => m.id === currentModeId) 
    || modes.find(m => m.codigo === 'MJ') 
    || modes[0];
  const currentSubmode = currentMode?.submodos?.find(s => s.id === currentSubmodeId) 
    || currentMode?.submodos?.find(s => s.es_predeterminado) 
    || currentMode?.submodos?.[0];

  // Helper to calculate max rating of a weapon
  const getWeaponMaxRating = (codes: Array<{ calificacion?: number }>) => {
    if (!codes || codes.length === 0) return 0;
    return Math.max(...codes.map(c => c.calificacion ?? 0));
  };

  // Flattened, filtered and DYNAMICALLY SORTED list of weapons (Desc by Rating, then Asc by Name)
  const displayedWeapons = useMemo(() => {
    if (!currentSubmode?.clases) return [];

    const list: Array<{
      weaponId: number;
      weaponName: string;
      className: string;
      submodeName: string;
      maxRating: number;
      codes: Array<{ id: number; codigo: string; calificacion?: number }>;
      top3Codes: Array<{ id: number; codigo: string; calificacion?: number }>;
      remainingCount: number;
      allSubmodeCodes?: Array<{
        submodeName: string;
        codes: Array<{ id: number; codigo: string; calificacion?: number }>;
      }>;
    }> = [];

    currentSubmode.clases.forEach(clase => {
      // Category Filter
      if (selectedCategory !== 'Todos' && clase.nombre.toLowerCase() !== selectedCategory.toLowerCase()) {
        return;
      }

      clase.objetos?.forEach(obj => {
        // Search Filter
        const q = searchQuery.toLowerCase().trim();
        const matchesName = !q || obj.nombre.toLowerCase().includes(q);
        const matchesClass = !q || clase.nombre.toLowerCase().includes(q);
        const matchesCode = !q || obj.codigos?.some(c => c.codigo.toLowerCase().includes(q));

        if (matchesName || matchesClass || matchesCode) {
          const sortedCodes = [...(obj.codigos || [])].sort((a, b) => (b.calificacion || 0) - (a.calificacion || 0));
          
          // Collect all submode occurrences of this weapon to show in detail modal
          const allSubmodeCodes: Array<{ submodeName: string; codes: Array<{ id: number; codigo: string; calificacion?: number }> }> = [];
          currentMode?.submodos?.forEach(sm => {
            sm.clases?.forEach(c => {
              const matchingObj = c.objetos?.find(o => o.nombre.toLowerCase() === obj.nombre.toLowerCase());
              if (matchingObj && matchingObj.codigos && matchingObj.codigos.length > 0) {
                allSubmodeCodes.push({
                  submodeName: sm.nombre,
                  codes: matchingObj.codigos,
                });
              }
            });
          });

          list.push({
            weaponId: obj.id,
            weaponName: obj.nombre,
            className: clase.nombre,
            submodeName: currentSubmode.nombre,
            maxRating: getWeaponMaxRating(sortedCodes),
            codes: sortedCodes,
            top3Codes: sortedCodes.slice(0, 3),
            remainingCount: Math.max(0, sortedCodes.length - 3),
            allSubmodeCodes: allSubmodeCodes.length > 0 ? allSubmodeCodes : undefined,
          });
        }
      });
    });

    // Dynamic sorting: Descending by rating (5.0★ -> 4.0★...), then Alphabetically by name
    return list.sort((a, b) => {
      if (b.maxRating !== a.maxRating) {
        return b.maxRating - a.maxRating;
      }
      return a.weaponName.localeCompare(b.weaponName, 'es', { sensitivity: 'base' });
    });
  }, [currentSubmode, currentMode, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen w-full max-w-full overflow-hidden bg-slate-50 text-slate-900 flex flex-col pb-12 font-sans select-none">
      
      {/* 1. Header (Condensed 2-Line Sticky Top Bar for Floating / Mobile Pop-up Window) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-2 sm:px-4 py-2 shadow-xs w-full max-w-full overflow-hidden">
        <div className="max-w-[96rem] mx-auto flex flex-col gap-1.5 w-full">
          
          {/* Línea 1: Selector de Modo (MJ / BR / ZM) + Buscador Rápido + Acciones */}
          <div className="flex items-center gap-1.5 w-full">
            
            {/* Mode Selector Chips */}
            <div className="flex items-center gap-1 shrink-0">
              {modes.map(m => {
                const isActive = m.id === currentModeId;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMode(m.id)}
                    className={`btn-press px-2.5 py-1 min-h-[32px] rounded-lg text-xs font-bold transition-all shrink-0 touch-manipulation border ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                    title={m.nombre}
                  >
                    {m.codigo}
                  </button>
                );
              })}
            </div>

            {/* Quick Live Search Bar */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar arma o código..."
                className="w-full pl-7 pr-6 py-1 min-h-[32px] text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-100 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Action Buttons: Primary [+ Nuevo Armero] and Secondary Icons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsNewLoadoutOpen(true)}
                className="btn-press px-2.5 sm:px-3.5 py-1.5 min-h-[32px] sm:min-h-[34px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all active:scale-95 touch-manipulation"
                title="Añadir Nuevo Armero / Clase"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Nuevo Armero</span>
                <span className="sm:hidden font-bold">Nuevo</span>
              </button>

              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="btn-press p-1.5 min-h-[32px] min-w-[32px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center transition-colors touch-manipulation"
                title="Paleta de Comandos (Ctrl+K)"
                aria-label="Buscar comandos"
              >
                <Search className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsVaultOpen(true)}
                className="btn-press p-1.5 min-h-[32px] min-w-[32px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center transition-colors touch-manipulation"
                title="Bóveda de Datos (JSON / CSV)"
                aria-label="Importar y Exportar"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Línea 2: Fila Deslizable Táctil con Scroll Suave de Categorías */}
          <div className="overflow-x-auto no-scrollbar touch-pan-x flex items-center gap-1.5 py-0.5 w-full">
            {CATEGORY_CHIPS.map(cat => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`btn-press px-2.5 py-1 min-h-[28px] rounded-lg text-xs font-semibold whitespace-nowrap border flex items-center gap-1 transition-all shrink-0 touch-manipulation ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {cat !== 'Todos' && getCategoryIcon(cat)}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>

          {/* Submodos Consolidados: Pastillas Compactas de 1 solo toque */}
          {currentMode?.submodos && currentMode.submodos.length > 0 && (
            <div className="overflow-x-auto no-scrollbar touch-pan-x flex items-center gap-1.5 pt-1 border-t border-slate-100 w-full">
              {currentMode.submodos.map(sm => {
                const isActive = sm.id === currentSubmodeId;
                return (
                  <button
                    key={sm.id}
                    onClick={() => handleSelectSubmode(sm.id)}
                    className={`btn-press px-2.5 py-0.5 min-h-[26px] rounded-full text-[11px] font-bold whitespace-nowrap border transition-all shrink-0 touch-manipulation ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-200'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {sm.nombre}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[96rem] mx-auto w-full px-2 sm:px-4 md:px-6 py-2.5 flex-1 flex flex-col gap-3">
        
        {loading ? (
          <SkeletonLoader count={4} />
        ) : activeView === 'tree' ? (
          <HierarchyTree
            modes={modes}
            onUpdateModeName={async (id, name) => {
              await fetch(`${API_BASE}/modes/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: name }),
              });
              loadData();
            }}
            onUpdateSubmodeName={async (id, name) => {
              await fetch(`${API_BASE}/submodos/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: name }),
              });
              loadData();
            }}
            onUpdateClassName={async (id, name) => {
              await fetch(`${API_BASE}/clases/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: name }),
              });
              loadData();
            }}
            onUpdateWeaponName={handleUpdateWeaponName}
            onUpdateCode={handleUpdateCode}
            onDeleteMode={async (id) => {
              if (confirm('¿Eliminar modo?')) {
                await fetch(`${API_BASE}/modes/${id}`, { method: 'DELETE' });
                loadData();
              }
            }}
            onDeleteSubmode={async (id) => {
              if (confirm('¿Eliminar submodo?')) {
                await fetch(`${API_BASE}/submodos/${id}`, { method: 'DELETE' });
                loadData();
              }
            }}
            onDeleteClass={async (id) => {
              if (confirm('¿Eliminar clase?')) {
                await fetch(`${API_BASE}/clases/${id}`, { method: 'DELETE' });
                loadData();
              }
            }}
            onDeleteWeapon={handleDeleteWeapon}
            onDeleteCode={handleDeleteCode}
            onCreateSubmode={async (modeId) => {
              const name = prompt('Nombre del nuevo submodo:');
              if (name?.trim()) {
                await fetch(`${API_BASE}/modes/${modeId}/submodos`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ nombre: name.trim(), es_predeterminado: false }),
                });
                loadData();
              }
            }}
            onCreateClass={async (submodeId) => {
              const name = prompt('Nombre de la nueva clase:');
              if (name?.trim()) {
                await fetch(`${API_BASE}/submodos/${submodeId}/clases`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ nombre: name.trim() }),
                });
                loadData();
              }
            }}
            onCreateWeapon={async (classId) => {
              const name = prompt('Nombre del arma:');
              if (name?.trim()) {
                await fetch(`${API_BASE}/clases/${classId}/objetos`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ nombre: name.trim(), posicion: 1 }),
                });
                loadData();
              }
            }}
            onCreateCode={async (weaponId) => {
              const code = prompt('Código de armero:');
              if (code?.trim()) {
                await handleAddCodeToWeapon(weaponId, code.trim());
              }
            }}
            onUpdateRating={handleUpdateRating}
          />
        ) : activeView === 'global' ? (
          /* Matrix Global View */
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
              <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>Matriz Global Consolidada</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {modes.flatMap(m => 
                (m.submodos || []).flatMap(sm => 
                  (sm.clases || []).flatMap(cl => 
                    (cl.objetos || []).map(obj => ({
                      modeName: m.nombre,
                      submodeName: sm.nombre,
                      className: cl.nombre,
                      weaponId: obj.id,
                      weaponName: obj.nombre,
                      codes: obj.codigos || [],
                    }))
                  )
                )
              )
              .filter(item => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                return item.weaponName.toLowerCase().includes(q) ||
                       item.className.toLowerCase().includes(q) ||
                       item.codes.some(c => c.codigo.toLowerCase().includes(q));
              })
              .map(item => (
                <div key={`${item.submodeName}-${item.weaponId}`} className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.weaponName}</h4>
                      <span className="text-[10px] text-slate-500">{item.className}</span>
                    </div>
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {item.submodeName}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    {item.codes.map(cd => (
                      <div key={cd.id} className="p-1.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between gap-1.5">
                        <span className="font-mono text-[11px] font-bold text-slate-900 truncate select-all">{cd.codigo}</span>
                        <QuickCopyButton
                          textToCopy={cd.codigo}
                          size="sm"
                          onCopied={() => showToast('Código copiado al portapapeles', 'success')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Streamlined 1-Click Fast Cards List (Top 3 Codes + View All) */
          <div className="space-y-2.5 w-full">
            
            {/* Quick Action bar with Weapon Count & Add Weapon */}
            <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-medium">
              <span>{displayedWeapons.length} armas • Ordenadas por Calificación ★</span>
              <button
                onClick={() => handleOpenAddWeapon(selectedCategory)}
                className="btn-press px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Nueva Arma</span>
              </button>
            </div>

            {displayedWeapons.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white border border-slate-200 text-slate-400 space-y-2">
                <Crosshair className="w-8 h-8 mx-auto text-slate-300" />
                <h4 className="text-xs font-bold text-slate-700">
                  No se encontraron armas coincidentes
                </h4>
                <p className="text-[11px] text-slate-500">
                  Cambia de categoría o añade una nueva arma a este submodo.
                </p>
                <button
                  onClick={() => handleOpenAddWeapon(selectedCategory)}
                  className="btn-press px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold"
                >
                  + Añadir Arma
                </button>
              </div>
            ) : (
              /* Ultra-Optimized Grid (1 col mobile, 2 tablet, 3-4 desktop) */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 w-full">
                {displayedWeapons.map((weapon) => (
                  <div
                    key={weapon.weaponId}
                    className="bg-white rounded-xl border border-slate-200 p-3 sm:p-3.5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all space-y-3 flex flex-col justify-between w-full"
                  >
                    {/* Weapon Card Header */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-1.5">
                        <div
                          onClick={() => setSelectedDetailWeapon(weapon)}
                          className="flex items-center gap-2 min-w-0 cursor-pointer group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center shrink-0 transition-colors">
                            {getCategoryIcon(weapon.className)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                              <InlineEditable
                                value={weapon.weaponName}
                                onSave={(newName) => handleUpdateWeaponName(weapon.weaponId, newName)}
                                isTitle={true}
                              />
                            </h3>
                            <span className="text-[10px] font-medium text-slate-500">
                              {weapon.className}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 max-w-[100px] truncate">
                            {weapon.submodeName}
                          </span>
                          <button
                            onClick={() => handleDeleteWeapon(weapon.weaponId)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Eliminar arma"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Top 3 Codes List (Directly Visible with 1-Click Thumb Copy) */}
                      <div className="space-y-2">
                        {weapon.top3Codes.length > 0 ? (
                          weapon.top3Codes.map((cd) => (
                            <div
                              key={cd.id}
                              className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5"
                            >
                              {/* Rating & Label */}
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Armero
                                </span>

                                {/* Clickable Rating Stars */}
                                <div className="flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => handleUpdateRating(cd.id, star)}
                                      className="p-0.5 focus:outline-none hover:scale-125 transition-transform"
                                      title={`Calificar con ${star} estrellas`}
                                    >
                                      <Star
                                        className={`w-3 h-3 ${
                                          star <= (cd.calificacion || 5)
                                            ? 'text-amber-400 fill-amber-400'
                                            : 'text-slate-200'
                                        }`}
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Monospace Code Display Box with select-all */}
                              <div className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-1.5 rounded border border-slate-200 select-all truncate">
                                <InlineEditable
                                  value={cd.codigo}
                                  onSave={(newCode) => handleUpdateCode(cd.id, newCode)}
                                />
                              </div>

                              {/* 1-Click Large Copy Button (≥44px Touch Target) */}
                              <div className="flex items-center gap-1.5 pt-0.5">
                                <QuickCopyButton
                                  textToCopy={cd.codigo}
                                  label="Copiar"
                                  onCopied={() => showToast('Código copiado al portapapeles', 'success')}
                                />
                                <button
                                  onClick={() => handleDeleteCode(cd.id)}
                                  className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 bg-white transition-colors"
                                  title="Eliminar código"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-2.5 rounded bg-slate-50 border border-dashed border-slate-200 text-center text-[11px] text-slate-400">
                            Sin códigos registrados
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Area: Remaining Configurations Button or Quick Add */}
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      {weapon.remainingCount > 0 && (
                        <button
                          onClick={() => setSelectedDetailWeapon(weapon)}
                          className="btn-press w-full py-2 px-3 rounded-lg bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200/80 flex items-center justify-between transition-colors touch-manipulation"
                        >
                          <span>Ver las {weapon.remainingCount} {weapon.remainingCount === 1 ? 'configuración restante' : 'configuraciones restantes'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Quick Add Code Inline Input */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={newCodeInputs[weapon.weaponId] || ''}
                          onChange={(e) =>
                            setNewCodeInputs(prev => ({
                              ...prev,
                              [weapon.weaponId]: e.target.value.toUpperCase(),
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddCodeToWeapon(weapon.weaponId, newCodeInputs[weapon.weaponId] || '');
                            }
                          }}
                          placeholder="Nuevo código..."
                          className="flex-1 px-2 py-1 rounded bg-slate-50 border border-slate-200 text-xs font-mono uppercase text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-100"
                        />
                        <button
                          onClick={() => handleAddCodeToWeapon(weapon.weaponId, newCodeInputs[weapon.weaponId] || '')}
                          className="btn-press px-2.5 py-1 min-h-[30px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1 transition-colors shrink-0"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Añadir</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Weapon Detail Modal / Drawer (Bottom sheet on mobile / Clean modal on desktop) */}
      <WeaponDetailModal
        isOpen={Boolean(selectedDetailWeapon)}
        onClose={() => setSelectedDetailWeapon(null)}
        weapon={selectedDetailWeapon}
        onUpdateWeaponName={handleUpdateWeaponName}
        onUpdateCode={handleUpdateCode}
        onDeleteCode={handleDeleteCode}
        onUpdateRating={handleUpdateRating}
        onAddCode={handleAddCodeToWeapon}
        onShowToast={showToast}
      />

      {/* New Loadout & Gunsmith Registration Modal / Mobile Bottom Sheet */}
      <NewLoadoutModal
        isOpen={isNewLoadoutOpen}
        onClose={() => setIsNewLoadoutOpen(false)}
        onSuccess={handleLoadoutCreated}
        modes={modes}
        activeModoId={currentModeId || (modes[0]?.id ?? 1)}
        selectedCategory={selectedCategory !== 'Todos' ? selectedCategory : undefined}
        selectedSubmode={currentSubmode?.nombre}
        apiBase={API_BASE}
      />

      {/* Floating Tactical Toast HUD */}
      <div
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-3 py-2 rounded-xl shadow-lg border flex items-center gap-2 transition-all duration-200 max-w-[90vw] ${
          toast.show
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-2 pointer-events-none'
        } ${
          toast.type === 'success'
            ? 'border-emerald-200 text-emerald-800 bg-emerald-50'
            : toast.type === 'error'
            ? 'border-rose-200 text-rose-800 bg-rose-50'
            : toast.type === 'warning'
            ? 'border-amber-200 text-amber-800 bg-amber-50'
            : 'border-slate-800 text-white bg-slate-900'
        }`}
      >
        {toast.type === 'success' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
        {toast.type === 'error' && <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
        {toast.type === 'warning' && <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
        {toast.type === 'info' && <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
        <span className="text-xs font-semibold truncate">{toast.message}</span>
      </div>

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        modes={modes}
        onSelectResult={handleSelectSearchResult}
        onOpenVault={() => setIsVaultOpen(true)}
      />

      {/* Data Vault Modal */}
      <DataVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        modes={modes}
        onImportSuccess={() => loadData()}
        onShowToast={showToast}
        apiBase={API_BASE}
      />
    </div>
  );
}
