import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { 
  Database, 
  Layers, 
  ChevronRight, 
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
  Activity, 
  Award, 
  Download,
  ArrowLeft,
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

export default function CodManager() {
  const [modes, setModes] = useState<IModo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');

  // Drill-down Navigation State
  const [currentModeId, setCurrentModeId] = useState<number | null>(null);
  const [currentSubmodeId, setCurrentSubmodeId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Normal slot data: slotNumber -> { id, name, codes }
  const [slotsData, setSlotsData] = useState<Record<number, any>>({});
  // Aggregated data for "Predeterminado" / Global view
  const [allSlotsData, setAllSlotsData] = useState<any[]>([]);

  // Search & Filters
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [weaponSearchQuery, setWeaponSearchQuery] = useState('');
  const [matrixSearchQuery, setMatrixSearchQuery] = useState('');

  // Modals & Dialogs
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isWeaponModalOpen, setIsWeaponModalOpen] = useState(false);
  const [modalWeaponName, setModalWeaponName] = useState('');
  const [modalCodeValue, setModalCodeValue] = useState('');
  const [newCodeInputs, setNewCodeInputs] = useState<Record<number, string>>({});

  // Toast Notifications
  const [toast, setToast] = useState<ToastNotification>({ show: false, message: '', type: 'info' });

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
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
        const firstMode = data[0];
        setCurrentModeId(prev => prev ?? firstMode.id);
        if (firstMode.submodos && firstMode.submodos.length > 0) {
          const defaultSub = firstMode.submodos.find(s => s.es_predeterminado) || firstMode.submodos[0];
          setCurrentSubmodeId(prev => prev ?? defaultSub.id);
          if (defaultSub.es_predeterminado) {
            await fetchAllSlots(firstMode.id);
          }
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

  const fetchSlots = async (classId: number) => {
    try {
      const res = await fetch(`${API_BASE}/clases/${classId}/slots`);
      const data = await res.json();
      setSlotsData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllSlots = async (modeId: number) => {
    try {
      const res = await fetch(`${API_BASE}/modos/${modeId}/all-slots`);
      const data = await res.json();
      setAllSlotsData(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Level 1 Navigation: Select Mode
  const handleSelectMode = async (modeId: number) => {
    setCurrentModeId(modeId);
    setSelectedCategoryId(null); // Reset to Category Catalog (Level 2)
    setWeaponSearchQuery('');
    const m = modes.find(item => item.id === modeId);
    if (m && m.submodos && m.submodos.length > 0) {
      const defaultSub = m.submodos.find(s => s.es_predeterminado) || m.submodos[0];
      setCurrentSubmodeId(defaultSub.id);
      if (defaultSub.es_predeterminado) {
        await fetchAllSlots(modeId);
      }
    } else {
      setCurrentSubmodeId(null);
    }
  };

  // Submode Selection
  const handleSelectSubmode = async (submodeId: number) => {
    setCurrentSubmodeId(submodeId);
    setSelectedCategoryId(null); // Reset to Category Catalog
    setWeaponSearchQuery('');
    const currentM = modes.find(m => m.id === currentModeId);
    const sub = currentM?.submodos.find(s => s.id === submodeId);
    if (sub?.es_predeterminado && currentModeId) {
      await fetchAllSlots(currentModeId);
    }
  };

  // Level 2 -> Level 3 Navigation: Select Category
  const handleSelectCategory = async (classId: number) => {
    setSelectedCategoryId(classId);
    setWeaponSearchQuery('');
    await fetchSlots(classId);
  };

  // Back to Level 2 (Category Grid)
  const handleBackToCategories = () => {
    setSelectedCategoryId(null);
    setWeaponSearchQuery('');
  };

  // Weapons & Codes Actions
  const handleOpenAddWeapon = () => {
    setModalWeaponName('');
    setModalCodeValue('');
    setIsWeaponModalOpen(true);
  };

  const handleSaveWeaponModal = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId || !modalWeaponName.trim()) return;

    try {
      const resObj = await fetch(`${API_BASE}/objetos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clase_id: selectedCategoryId,
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
      await fetchSlots(selectedCategoryId);
      await loadData();
      showToast(`Arma "${modalWeaponName}" registrada con éxito`, 'success');
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
      if (selectedCategoryId) await fetchSlots(selectedCategoryId);
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
      if (selectedCategoryId) await fetchSlots(selectedCategoryId);
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
      if (selectedCategoryId) await fetchSlots(selectedCategoryId);
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
      if (selectedCategoryId) await fetchSlots(selectedCategoryId);
      await loadData();
      showToast('Código actualizado', 'success');
    } catch (err) {
      showToast('Error al actualizar código', 'error');
    }
  };

  const handleDeleteCode = async (codeId: number) => {
    try {
      await fetch(`${API_BASE}/codigos/${codeId}`, { method: 'DELETE' });
      if (selectedCategoryId) await fetchSlots(selectedCategoryId);
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
      if (selectedCategoryId) await fetchSlots(selectedCategoryId);
      if (currentModeId) await fetchAllSlots(currentModeId);
      await loadData();
      showToast(`Calificación actualizada (${rating}★)`, 'success');
    } catch (err) {
      showToast('Error al actualizar calificación', 'error');
    }
  };

  // Category creation
  const handleCreateCategory = async () => {
    if (!currentSubmodeId) return;
    const name = prompt('Nombre de la nueva categoría (ej: Fusiles de Asalto, Subfusiles...):');
    if (!name?.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/submodos/${currentSubmodeId}/clases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: name.trim() }),
      });
      const newCls = await res.json();
      await loadData();
      setSelectedCategoryId(newCls.id);
      await fetchSlots(newCls.id);
      showToast(`Categoría "${name}" creada con éxito`, 'success');
    } catch (err) {
      showToast('Error al crear categoría', 'error');
    }
  };

  // Search Palette Selection
  const handleSelectSearchResult = async (item: SearchResultItem) => {
    if (item.modeId) {
      setCurrentModeId(item.modeId);
    }
    if (item.submodeId) {
      setCurrentSubmodeId(item.submodeId);
    }
    if (item.classId) {
      setSelectedCategoryId(item.classId);
      await fetchSlots(item.classId);
    }
    setActiveView('dashboard');
    showToast(`Navegando a: ${item.title}`, 'info');
  };

  // Helper for Category Icons
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('asalto')) return <Target className="w-5 h-5 text-blue-600" />;
    if (name.includes('subfusil')) return <Zap className="w-5 h-5 text-amber-600" />;
    if (name.includes('precisión') || name.includes('precision')) return <Crosshair className="w-5 h-5 text-emerald-600" />;
    if (name.includes('tirador')) return <Crosshair className="w-5 h-5 text-indigo-600" />;
    if (name.includes('ligera') || name.includes('ametralladora')) return <Shield className="w-5 h-5 text-rose-600" />;
    if (name.includes('escopeta')) return <Flame className="w-5 h-5 text-orange-600" />;
    return <Layers className="w-5 h-5 text-blue-600" />;
  };

  // Active elements
  const currentMode = modes.find(m => m.id === currentModeId);
  const currentSubmode = currentMode?.submodos?.find(s => s.id === currentSubmodeId);
  const categoriesList = currentSubmode?.clases || [];
  const selectedCategory = categoriesList.find(c => c.id === selectedCategoryId);

  // Filtered categories
  const filteredCategories = categoriesList.filter(cat => 
    cat.nombre.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  // Weapons list in selected category
  const rawWeaponsList = Object.values(slotsData).filter(Boolean);
  const weaponsList = rawWeaponsList.length > 0 ? rawWeaponsList : (selectedCategory?.objetos || []);
  
  const filteredWeapons = weaponsList.filter((weapon: any) => {
    if (!weaponSearchQuery.trim()) return true;
    const q = weaponSearchQuery.toLowerCase();
    const nameMatch = weapon.nombre?.toLowerCase().includes(q) || weapon.name?.toLowerCase().includes(q);
    const codes = weapon.codigos || weapon.codes || [];
    const codeMatch = codes.some((cd: any) => cd.codigo?.toLowerCase().includes(q));
    return nameMatch || codeMatch;
  });

  // Global counts for HUD
  let totalWeaponsCount = 0;
  let totalCodesCount = 0;
  let ratedCount = 0;
  let ratingSum = 0;

  modes.forEach(m => {
    m.submodos?.forEach(sm => {
      sm.clases?.forEach(cl => {
        cl.objetos?.forEach(obj => {
          totalWeaponsCount++;
          obj.codigos?.forEach(cd => {
            totalCodesCount++;
            if (cd.calificacion) {
              ratingSum += cd.calificacion;
              ratedCount++;
            }
          });
        });
      });
    });
  });

  const avgRating = ratedCount > 0 ? (ratingSum / ratedCount).toFixed(1) : '5.0';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-16 md:pb-10 font-sans">
      
      {/* 1. Header (Clean Enterprise Top Bar) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 md:px-8 py-3 shadow-xs">
        <div className="max-w-[96rem] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Brand & Identity */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    NexusCOD
                  </h1>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    SaaS Enterprise
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium hidden sm:block">
                  Gestor de Armamento y Códigos de Armero
                </p>
              </div>
            </div>

            {/* Mobile quick actions */}
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
                aria-label="Importar y Exportar"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* View Mode Tabs & Actions */}
          <div className="flex items-center gap-3 justify-between sm:justify-end">
            
            {/* View Switcher Tabs */}
            <div className="flex items-center p-1 rounded-lg bg-slate-100 text-xs font-semibold text-slate-600 w-full sm:w-auto">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 min-h-[32px] rounded-md flex items-center justify-center gap-1.5 transition-all ${
                  activeView === 'dashboard'
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Navegador</span>
              </button>
              <button
                onClick={() => setActiveView('tree')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 min-h-[32px] rounded-md flex items-center justify-center gap-1.5 transition-all ${
                  activeView === 'tree'
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>Árbol</span>
              </button>
              <button
                onClick={() => setActiveView('global')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 min-h-[32px] rounded-md flex items-center justify-center gap-1.5 transition-all ${
                  activeView === 'global'
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Matriz</span>
              </button>
            </div>

            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="btn-press flex items-center gap-2 px-3 py-1.5 min-h-[36px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <span>Buscar</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white text-[10px] font-mono text-slate-500 border border-slate-200 shadow-2xs">
                  Ctrl+K
                </kbd>
              </button>

              <button
                onClick={() => setIsVaultOpen(true)}
                className="btn-press flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Bóveda</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[96rem] mx-auto w-full px-4 sm:px-6 md:px-8 py-5 flex-1 flex flex-col gap-6">
        
        {/* Metric Ribbons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-xs font-medium text-slate-500">Modos de Juego</div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">{modes.length}</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-xs font-medium text-slate-500">Total de Armas</div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">{totalWeaponsCount}</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Crosshair className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-xs font-medium text-slate-500">Códigos Guardados</div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">{totalCodesCount}</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-xs font-medium text-slate-500">Calificación Media</div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <span>{avgRating}</span>
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Dynamic Views Content */}
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
          /* Matrix Global View */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>Matriz Global de Armamento</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Catálogo completo consolidado de todos los modos
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={matrixSearchQuery}
                  onChange={(e) => setMatrixSearchQuery(e.target.value)}
                  placeholder="Filtrar armas o códigos..."
                  className="w-full pl-9 pr-4 py-1.5 min-h-[38px] rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {allSlotsData
                .filter((weapon: any) => {
                  if (!matrixSearchQuery.trim()) return true;
                  const q = matrixSearchQuery.toLowerCase();
                  const nameMatch = weapon.objeto_nombre?.toLowerCase().includes(q);
                  const classMatch = weapon.clase_nombre?.toLowerCase().includes(q);
                  const codeMatch = weapon.codigos?.some((c: any) => c.codigo?.toLowerCase().includes(q));
                  return nameMatch || classMatch || codeMatch;
                })
                .map((weapon: any) => (
                  <div
                    key={weapon.objeto_id}
                    className="rounded-xl p-4 bg-white border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{weapon.objeto_nombre}</h4>
                        <span className="text-[11px] font-medium text-slate-500">{weapon.clase_nombre}</span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {weapon.submodo_nombre}
                      </span>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {weapon.codigos && weapon.codigos.length > 0 ? (
                        weapon.codigos.map((cd: any) => (
                          <div
                            key={cd.id}
                            className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex flex-col gap-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs font-bold text-slate-800 truncate">
                                {cd.codigo}
                              </span>
                              <QuickCopyButton textToCopy={cd.codigo} size="sm" />
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                              <div className="flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => handleUpdateRating(cd.id, star)}
                                    className="p-0.5 focus:outline-none hover:scale-110 transition-transform"
                                  >
                                    <Star
                                      className={`w-3 h-3 ${
                                        star <= (cd.calificacion || 0)
                                          ? 'text-amber-400 fill-amber-400'
                                          : 'text-slate-200'
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">Sin códigos asignados</div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          /* Drill-down UI Flow */
          <div className="space-y-6">
            
            {/* NIVEL 1 — Selección de Modo (Header / Selector Superior) */}
            <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Paso 1: Modo de Juego
                  </h2>
                  <p className="text-sm font-semibold text-slate-800">
                    Selecciona el modo activo para explorar el catálogo
                  </p>
                </div>
              </div>

              {/* Mode Large Cards / Tabs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {modes.map((m) => {
                  const isActive = m.id === currentModeId;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelectMode(m.id)}
                      className={`btn-press p-4 rounded-xl border flex items-center justify-between text-left transition-all touch-manipulation ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-600/20'
                          : 'bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold font-mono text-sm shrink-0 ${
                          isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {m.codigo || 'MD'}
                        </div>
                        <div>
                          <div className="text-sm font-bold truncate">{m.nombre}</div>
                          <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                            {m.submodos?.reduce((sum, s) => sum + (s.clases?.length || 0), 0) || 0} Categorías
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    </button>
                  );
                })}
              </div>

              {/* Submode Selector Pills (if multiple submodes exist) */}
              {currentMode?.submodos && currentMode.submodos.length > 1 && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto no-scrollbar">
                  <span className="text-xs font-medium text-slate-500 shrink-0">Variante / Submodo:</span>
                  {currentMode.submodos.map((sm) => {
                    const isActive = sm.id === currentSubmodeId;
                    return (
                      <button
                        key={sm.id}
                        onClick={() => handleSelectSubmode(sm.id)}
                        className={`btn-press px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200'
                        }`}
                      >
                        {sm.nombre}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* NIVEL 2 vs NIVEL 3-4 Container */}
            {selectedCategoryId === null ? (
              /* NIVEL 2 — Selector de Categorías (Parrilla Visual) */
              <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span>Paso 2: Categorías de Armamento ({currentMode?.nombre})</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Selecciona una categoría para ver sus armas y códigos de armero
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-60">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={categorySearchQuery}
                        onChange={(e) => setCategorySearchQuery(e.target.value)}
                        placeholder="Buscar categoría..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-100"
                      />
                    </div>
                    <button
                      onClick={handleCreateCategory}
                      className="btn-press px-3 py-1.5 min-h-[34px] rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Categoría</span>
                    </button>
                  </div>
                </div>

                {/* Categories Grid (2 columns on mobile, 3 on tablet/desktop) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4">
                  {filteredCategories.map((cat) => {
                    const weaponCount = cat.objetos?.length || 0;
                    const sampleWeapons = cat.objetos?.slice(0, 3).map(o => o.nombre).join(', ') || 'Sin armas registradas';

                    return (
                      <div
                        key={cat.id}
                        onClick={() => handleSelectCategory(cat.id)}
                        className="btn-press bg-white hover:bg-blue-50/40 border border-slate-200 hover:border-blue-400 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group touch-manipulation text-left"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                              {getCategoryIcon(cat.nombre)}
                            </div>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200 transition-colors">
                              {weaponCount} {weaponCount === 1 ? 'arma' : 'armas'}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {cat.nombre}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium truncate mt-1">
                              {sampleWeapons}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                          <span>Ver armas disponibles</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : (
              /* NIVEL 3 & 4 — Armas y Fichas de Armero en la Categoría Seleccionada */
              <section className="space-y-4">
                
                {/* Navigation Bar / Breadcrumb Header */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleBackToCategories}
                        className="btn-press px-3 py-1.5 min-h-[38px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors touch-manipulation"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Volver a Categorías</span>
                      </button>

                      {/* Breadcrumbs */}
                      <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <span className="text-slate-800 font-semibold">{currentMode?.nombre}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-800 font-semibold">{currentSubmode?.nombre}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-blue-600 font-bold">{selectedCategory?.nombre}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleOpenAddWeapon}
                      className="btn-press px-4 py-2 min-h-[38px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors touch-manipulation"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Registrar Nueva Arma</span>
                    </button>
                  </div>

                  {/* Search Bar for weapons inside category */}
                  <div className="relative pt-1 border-t border-slate-100">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={weaponSearchQuery}
                      onChange={(e) => setWeaponSearchQuery(e.target.value)}
                      placeholder={`Buscar en ${selectedCategory?.nombre} (ej: XM4, DL Q33 o código)...`}
                      className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* Weapons List / Cards (NIVEL 4: Fichas del Armero y Códigos de Copiado Rápido) */}
                {filteredWeapons.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 text-slate-400 space-y-3">
                    <Crosshair className="w-10 h-10 mx-auto text-slate-300" />
                    <h4 className="text-sm font-bold text-slate-700">No hay armas registradas en esta categoría</h4>
                    <p className="text-xs text-slate-500">Agrega la primera arma para registrar sus códigos de armero.</p>
                    <button
                      onClick={handleOpenAddWeapon}
                      className="btn-press px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold"
                    >
                      + Añadir Arma
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredWeapons.map((weapon: any) => {
                      const weaponId = weapon.id || weapon.objeto_id;
                      const weaponName = weapon.nombre || weapon.name || weapon.objeto_nombre;
                      const codes = weapon.codigos || weapon.codes || [];

                      return (
                        <div
                          key={weaponId}
                          className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4 hover:shadow-md transition-shadow"
                        >
                          {/* Card Header: Weapon Name & Actions */}
                          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Crosshair className="w-4 h-4" />
                              </div>
                              <div className="text-sm sm:text-base font-bold text-slate-900 truncate">
                                <InlineEditable
                                  value={weaponName}
                                  onSave={(newName) => handleUpdateWeaponName(weaponId, newName)}
                                  isTitle={true}
                                />
                              </div>
                            </div>

                            <button
                              onClick={() => handleDeleteWeapon(weaponId)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Eliminar arma"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Codes List (Nivel 4) */}
                          <div className="space-y-3">
                            {codes.length > 0 ? (
                              codes.map((cd: any) => (
                                <div
                                  key={cd.id}
                                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5"
                                >
                                  {/* Code Header & Rating */}
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                      Código de Armero
                                    </span>

                                    {/* Star Rating (1 to 5) */}
                                    <div className="flex items-center gap-0.5 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                          key={star}
                                          type="button"
                                          onClick={() => handleUpdateRating(cd.id, star)}
                                          className="p-0.5 focus:outline-none hover:scale-110 transition-transform"
                                          title={`Calificar con ${star} estrellas`}
                                        >
                                          <Star
                                            className={`w-3.5 h-3.5 ${
                                              star <= (cd.calificacion || 0)
                                                ? 'text-amber-400 fill-amber-400'
                                                : 'text-slate-200'
                                            }`}
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Code Display Box */}
                                  <div className="font-mono text-sm sm:text-base font-bold text-slate-900 bg-white p-2.5 rounded-lg border border-slate-200 select-all truncate">
                                    <InlineEditable
                                      value={cd.codigo}
                                      onSave={(newCode) => handleUpdateCode(cd.id, newCode)}
                                    />
                                  </div>

                                  {/* Action Buttons: Big Copy Button (≥44px Touch Target) */}
                                  <div className="flex items-center gap-2 pt-1">
                                    <QuickCopyButton textToCopy={cd.codigo} />
                                    <button
                                      onClick={() => handleDeleteCode(cd.id)}
                                      className="p-2.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 bg-white transition-colors"
                                      title="Eliminar código"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500 font-medium">
                                Sin códigos de armero registrados
                              </div>
                            )}

                            {/* Quick Add Code Input */}
                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="text"
                                value={newCodeInputs[weaponId] || ''}
                                onChange={(e) =>
                                  setNewCodeInputs(prev => ({
                                    ...prev,
                                    [weaponId]: e.target.value.toUpperCase(),
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleAddCodeToWeapon(weaponId, newCodeInputs[weaponId] || '');
                                  }
                                }}
                                placeholder="Nuevo código alfanumérico..."
                                className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-mono uppercase text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                              />
                              <button
                                onClick={() => handleAddCodeToWeapon(weaponId, newCodeInputs[weaponId] || '')}
                                className="btn-press px-3 py-1.5 min-h-[34px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Añadir</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
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
                  Registrar Arma en {selectedCategory?.nombre}
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
                  Nombre del Arma
                </label>
                <input
                  required
                  type="text"
                  autoFocus
                  value={modalWeaponName}
                  onChange={(e) => setModalWeaponName(e.target.value)}
                  placeholder="ej. XM4, DL Q33, Type 19, BAL-27..."
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
                  placeholder="ej. XM4-A9K3L7B0X1"
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
