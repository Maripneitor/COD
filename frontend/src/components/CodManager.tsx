import { useState, useEffect, useCallback, useMemo } from 'react';
import type { FormEvent } from 'react';
import { 
  Database, 
  Layers, 
  Search, 
  CheckCircle, 
  ShieldAlert, 
  Info,
  Plus, 
  X, 
  FolderTree, 
  LayoutGrid, 
  Globe, 
  Crosshair, 
  Star, 
  Download,
  Target,
  Zap,
  Shield,
  Flame,
  Trash2
} from 'lucide-react';
import type { IModo, ActiveView, ToastNotification, SearchResultItem } from '../types';
import HierarchyTree from './HierarchyTree';
import DataVaultModal from './DataVaultModal';
import CommandPalette from './CommandPalette';
import SkeletonLoader from './SkeletonLoader';
import QuickCopyButton from './QuickCopyButton';
import InlineEditable from './InlineEditable';

const API_BASE = 'http://localhost:3000/api';

const CATEGORY_CHIPS = [
  'Todas',
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
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Dialogs
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isWeaponModalOpen, setIsWeaponModalOpen] = useState(false);
  const [modalWeaponName, setModalWeaponName] = useState('');
  const [modalWeaponClass, setModalWeaponClass] = useState('Fusiles de Asalto');
  const [modalCodeValue, setModalCodeValue] = useState('');
  const [newCodeInputs, setNewCodeInputs] = useState<Record<number, string>>({});

  // Toast Notifications
  const [toast, setToast] = useState<ToastNotification>({ show: false, message: '', type: 'info' });

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2500);
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
        // Set Multijugador (MJ) by default if available
        const mjMode = data.find(m => m.codigo === 'MJ') || data[0];
        setCurrentModeId(prev => prev ?? mjMode.id);

        if (mjMode.submodos && mjMode.submodos.length > 0) {
          const defaultSub = mjMode.submodos.find(s => s.es_predeterminado) || mjMode.submodos[0];
          setCurrentSubmodeId(prev => prev ?? defaultSub.id);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      showToast('Error conectando con la base de datos NexusCOD', 'error');
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
    setModalWeaponName('');
    setModalCodeValue('');
    if (defaultCategory && defaultCategory !== 'Todas') {
      setModalWeaponClass(defaultCategory);
    }
    setIsWeaponModalOpen(true);
  };

  const handleSaveWeaponModal = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentSubmodeId || !modalWeaponName.trim()) return;

    try {
      // Find or create class
      const currentSub = modes
        .find(m => m.id === currentModeId)
        ?.submodos?.find(s => s.id === currentSubmodeId);
      
      let targetClass = currentSub?.clases?.find(c => c.nombre.toLowerCase() === modalWeaponClass.toLowerCase());
      let classId = targetClass?.id;

      if (!classId) {
        const resCls = await fetch(`${API_BASE}/submodos/${currentSubmodeId}/clases`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: modalWeaponClass }),
        });
        const newCls = await resCls.json();
        classId = newCls.id;
      }

      const resObj = await fetch(`${API_BASE}/objetos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clase_id: classId,
          posicion: 1,
          nombre: modalWeaponName.trim(),
        }),
      });
      const savedWeapon = await resObj.json();

      const codeVal = modalCodeValue.trim().toUpperCase();
      if (codeVal) {
        await fetch(`${API_BASE}/codigos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            objeto_id: savedWeapon.id,
            codigo: codeVal,
          }),
        });
      }

      setIsWeaponModalOpen(false);
      await loadData();
      showToast(`Arma "${modalWeaponName}" guardada con éxito`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Error al guardar arma', 'error');
    }
  };

  const handleUpdateWeaponName = async (weaponId: number, newName: string) => {
    try {
      await fetch(`${API_BASE}/objetos/${weaponId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newName }),
      });
      await loadData();
      showToast('Nombre de arma actualizado', 'success');
    } catch (err) {
      showToast('Error al actualizar nombre', 'error');
    }
  };

  const handleDeleteWeapon = async (weaponId: number) => {
    if (!confirm('¿Deseas eliminar esta arma y todos sus códigos asociados?')) return;
    try {
      await fetch(`${API_BASE}/objetos/${weaponId}`, { method: 'DELETE' });
      await loadData();
      showToast('Arma eliminada', 'info');
    } catch (err) {
      showToast('Error al eliminar arma', 'error');
    }
  };

  const handleAddCodeToWeapon = async (weaponId: number, codeVal: string) => {
    if (!codeVal.trim()) return;
    try {
      await fetch(`${API_BASE}/codigos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objeto_id: weaponId, codigo: codeVal.trim().toUpperCase() }),
      });
      setNewCodeInputs(prev => ({ ...prev, [weaponId]: '' }));
      await loadData();
      showToast('Código de armero guardado', 'success');
    } catch (err) {
      showToast('Error al añadir código', 'error');
    }
  };

  const handleUpdateCode = async (codeId: number, codeVal: string) => {
    try {
      await fetch(`${API_BASE}/codigos/${codeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: codeVal }),
      });
      await loadData();
      showToast('Código actualizado', 'success');
    } catch (err) {
      showToast('Error al actualizar código', 'error');
    }
  };

  const handleDeleteCode = async (codeId: number) => {
    try {
      await fetch(`${API_BASE}/codigos/${codeId}`, { method: 'DELETE' });
      await loadData();
      showToast('Código eliminado', 'info');
    } catch (err) {
      showToast('Error al eliminar código', 'error');
    }
  };

  const handleUpdateRating = async (codeId: number, rating: number) => {
    try {
      await fetch(`${API_BASE}/codigos/${codeId}/rating`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calificacion: rating }),
      });
      await loadData();
      showToast(`Calificación guardada (${rating}★)`, 'success');
    } catch (err) {
      showToast('Error al actualizar calificación', 'error');
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
    if (name.includes('asalto')) return <Target className="w-4 h-4 text-blue-600" />;
    if (name.includes('subfusil')) return <Zap className="w-4 h-4 text-amber-600" />;
    if (name.includes('precisión') || name.includes('precision')) return <Crosshair className="w-4 h-4 text-emerald-600" />;
    if (name.includes('tirador')) return <Crosshair className="w-4 h-4 text-indigo-600" />;
    if (name.includes('ligera') || name.includes('ametralladora')) return <Shield className="w-4 h-4 text-rose-600" />;
    if (name.includes('escopeta')) return <Flame className="w-4 h-4 text-orange-600" />;
    return <Layers className="w-4 h-4 text-blue-600" />;
  };

  // Active Data Model
  const currentMode = modes.find(m => m.id === currentModeId);
  const currentSubmode = currentMode?.submodos?.find(s => s.id === currentSubmodeId);

  // Flattened and filtered list of weapons for immediate 1-click access
  const displayedWeapons = useMemo(() => {
    if (!currentSubmode?.clases) return [];

    const list: Array<{
      weaponId: number;
      weaponName: string;
      className: string;
      submodeName: string;
      codes: Array<{ id: number; codigo: string; calificacion?: number }>;
    }> = [];

    currentSubmode.clases.forEach(clase => {
      // Category Filter
      if (selectedCategory !== 'Todas' && clase.nombre.toLowerCase() !== selectedCategory.toLowerCase()) {
        return;
      }

      clase.objetos?.forEach(obj => {
        // Search Filter
        const q = searchQuery.toLowerCase().trim();
        const matchesName = !q || obj.nombre.toLowerCase().includes(q);
        const matchesClass = !q || clase.nombre.toLowerCase().includes(q);
        const matchesCode = !q || obj.codigos?.some(c => c.codigo.toLowerCase().includes(q));

        if (matchesName || matchesClass || matchesCode) {
          list.push({
            weaponId: obj.id,
            weaponName: obj.nombre,
            className: clase.nombre,
            submodeName: currentSubmode.nombre,
            codes: obj.codigos || [],
          });
        }
      });
    });

    return list;
  }, [currentSubmode, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-16 md:pb-10 font-sans">
      
      {/* 1. Header (Sticky Top Bar, Clean SaaS Office Aesthetic) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 md:px-8 py-2.5 shadow-xs">
        <div className="max-w-[96rem] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          
          {/* Brand Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-bold text-slate-900 tracking-tight">NexusCOD</h1>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    SaaS Loadouts
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-1 sm:hidden">
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="btn-press p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200"
                aria-label="Buscar"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsVaultOpen(true)}
                className="btn-press p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200"
                aria-label="Bóveda"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Search & Views Switcher */}
          <div className="flex items-center gap-2.5 justify-between sm:justify-end">
            
            {/* Live Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar arma o código (ej: XM4, SO-14)..."
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-100 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Switcher */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-100 text-xs font-semibold text-slate-600 shrink-0">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`px-3 py-1.5 min-h-[30px] rounded-md flex items-center gap-1.5 transition-all ${
                  activeView === 'dashboard'
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Catálogo</span>
              </button>
              <button
                onClick={() => setActiveView('tree')}
                className={`px-3 py-1.5 min-h-[30px] rounded-md flex items-center gap-1.5 transition-all ${
                  activeView === 'tree'
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Jerarquía</span>
              </button>
              <button
                onClick={() => setActiveView('global')}
                className={`px-3 py-1.5 min-h-[30px] rounded-md flex items-center gap-1.5 transition-all ${
                  activeView === 'global'
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Matriz</span>
              </button>
            </div>

            {/* Vault Desktop button */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                onClick={() => setIsVaultOpen(true)}
                className="btn-press flex items-center gap-1.5 px-3 py-1.5 min-h-[32px] rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition-colors"
                title="Bóveda de importación/exportación JSON y CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Bóveda</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main App Container */}
      <main className="max-w-[96rem] mx-auto w-full px-4 sm:px-6 md:px-8 py-4 flex-1 flex flex-col gap-4">
        
        {loading ? (
          <SkeletonLoader count={6} />
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
          /* Matrix View */
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>Matriz Global Consolidada</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Exploración de armamento en los 3 grupos competitivos
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                <div key={`${item.submodeName}-${item.weaponId}`} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{item.weaponName}</h4>
                      <span className="text-[11px] font-medium text-slate-500">{item.className}</span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 max-w-[130px] truncate">
                      {item.submodeName}
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {item.codes.map(cd => (
                      <div key={cd.id} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 truncate">{cd.codigo}</span>
                        <QuickCopyButton textToCopy={cd.codigo} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Streamlined 1-Click Fast Dashboard */
          <div className="space-y-4">
            
            {/* 2. Unified Quick Selection Bar (Mode + Consolidated 3 Submodes + Category Chips) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-xs space-y-3">
              
              {/* Row 1: Mode Selector (MJ, BR, ZM) & Submodes (3 Official Competitive Groups) */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                
                {/* Mode Selector */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">
                    Modo:
                  </span>
                  {modes.map(m => {
                    const isActive = m.id === currentModeId;
                    return (
                      <button
                        key={m.id}
                        onClick={() => handleSelectMode(m.id)}
                        className={`btn-press px-3 py-1.5 min-h-[34px] rounded-lg text-xs font-bold whitespace-nowrap border transition-all touch-manipulation flex items-center gap-1.5 shrink-0 ${
                          isActive
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{m.nombre}</span>
                        <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${
                          isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {m.codigo}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* The 3 Official Consolidated Submodes */}
                {currentMode?.submodos && currentMode.submodos.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">
                      Submodo:
                    </span>
                    {currentMode.submodos.map(sm => {
                      const isActive = sm.id === currentSubmodeId;
                      return (
                        <button
                          key={sm.id}
                          onClick={() => handleSelectSubmode(sm.id)}
                          className={`btn-press px-3 py-1.5 min-h-[34px] rounded-lg text-xs font-bold whitespace-nowrap border transition-all touch-manipulation shrink-0 ${
                            isActive
                              ? 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-200'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {sm.nombre}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Row 2: Category Chips (Direct Horizontal Bar) */}
              <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pt-0.5">
                <div className="flex items-center gap-1.5 shrink-0">
                  {CATEGORY_CHIPS.map(cat => {
                    const isActive = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`btn-press px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-bold whitespace-nowrap border flex items-center gap-1.5 transition-all touch-manipulation shrink-0 ${
                          isActive
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cat !== 'Todas' && getCategoryIcon(cat)}
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handleOpenAddWeapon(selectedCategory)}
                  className="btn-press px-3 py-1.5 min-h-[36px] rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Nueva Arma</span>
                </button>
              </div>
            </div>

            {/* 3. Direct Weapon Cards Grid (Codes Immediately Visible, 1-Click Copy) */}
            <div>
              {displayedWeapons.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 text-slate-400 space-y-3">
                  <Crosshair className="w-10 h-10 mx-auto text-slate-300" />
                  <h4 className="text-sm font-bold text-slate-700">
                    No se encontraron armas con los filtros actuales
                  </h4>
                  <p className="text-xs text-slate-500">
                    Intenta cambiar la categoría o añadir una nueva arma a este submodo.
                  </p>
                  <button
                    onClick={() => handleOpenAddWeapon(selectedCategory)}
                    className="btn-press px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                  >
                    + Añadir Arma
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {displayedWeapons.map((weapon) => (
                    <div
                      key={weapon.weaponId}
                      className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all space-y-3.5 flex flex-col justify-between"
                    >
                      {/* Weapon Header */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                              {getCategoryIcon(weapon.className)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                                <InlineEditable
                                  value={weapon.weaponName}
                                  onSave={(newName) => handleUpdateWeaponName(weapon.weaponId, newName)}
                                  isTitle={true}
                                />
                              </h3>
                              <span className="text-[11px] font-medium text-slate-500">
                                {weapon.className}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 max-w-[120px] truncate">
                              {weapon.submodeName}
                            </span>
                            <button
                              onClick={() => handleDeleteWeapon(weapon.weaponId)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Eliminar arma"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Gunsmith Codes & 1-Click Copy Controls */}
                        <div className="space-y-2.5 pt-1">
                          {weapon.codes.length > 0 ? (
                            weapon.codes.map((cd) => (
                              <div
                                key={cd.id}
                                className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Armero
                                  </span>

                                  {/* Star Rating Interactive Bar */}
                                  <div className="flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        type="button"
                                        onClick={() => handleUpdateRating(cd.id, star)}
                                        className="p-0.5 focus:outline-none hover:scale-110 transition-transform"
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

                                {/* Code Display Monospace Box */}
                                <div className="font-mono text-xs sm:text-sm font-bold text-slate-900 bg-white p-2 rounded-lg border border-slate-200 select-all truncate">
                                  <InlineEditable
                                    value={cd.codigo}
                                    onSave={(newCode) => handleUpdateCode(cd.id, newCode)}
                                  />
                                </div>

                                {/* 1-Click Fast Copy Action (≥44px Touch Target) */}
                                <div className="flex items-center gap-2 pt-0.5">
                                  <QuickCopyButton textToCopy={cd.codigo} showFullLabel={true} />
                                  <button
                                    onClick={() => handleDeleteCode(cd.id)}
                                    className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 bg-white transition-colors"
                                    title="Eliminar código"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500 font-medium">
                              Sin códigos registrados
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick Add Code Input */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
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
                          placeholder="Nuevo código alfanumérico..."
                          className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono uppercase text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-100"
                        />
                        <button
                          onClick={() => handleAddCodeToWeapon(weapon.weaponId, newCodeInputs[weapon.weaponId] || '')}
                          className="btn-press px-3 py-1.5 min-h-[32px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Código</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Add Weapon Dialog Modal */}
      {isWeaponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Registrar Arma en {currentSubmode?.nombre}
                </h3>
              </div>
              <button
                onClick={() => setIsWeaponModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg touch-manipulation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWeaponModal} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Categoría de Arma
                </label>
                <select
                  value={modalWeaponClass}
                  onChange={(e) => setModalWeaponClass(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {CATEGORY_CHIPS.filter(c => c !== 'Todas').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nombre del Arma
                </label>
                <input
                  required
                  type="text"
                  autoFocus
                  value={modalWeaponName}
                  onChange={(e) => setModalWeaponName(e.target.value)}
                  placeholder="ej. XM4, DL Q33, Type 19, VMP..."
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Código de Armero (Opcional)
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">ALFANUMÉRICO</span>
                </div>
                <input
                  type="text"
                  value={modalCodeValue}
                  onChange={(e) => setModalCodeValue(e.target.value.toUpperCase())}
                  placeholder="ej. XM4-1A2G4E8F9E"
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-xs font-mono uppercase text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWeaponModalOpen(false)}
                  className="btn-press px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg touch-manipulation"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-press px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs touch-manipulation"
                >
                  Guardar Arma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Tactical Toast HUD */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-lg border flex items-center gap-2.5 transition-all duration-200 max-w-[90vw] ${
          toast.show
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-3 pointer-events-none'
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
        {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />}
        {toast.type === 'error' && <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />}
        {toast.type === 'warning' && <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />}
        {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
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
