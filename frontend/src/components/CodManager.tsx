import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { 
  Database, 
  Layers, 
  ChevronRight, 
  SlidersHorizontal, 
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
  Download
} from 'lucide-react';
import type { IModo, ActiveView, ToastNotification, SearchResultItem } from '../types';
import LoadoutSlotCard from './LoadoutSlotCard';
import HierarchyTree from './HierarchyTree';
import DataVaultModal from './DataVaultModal';
import CommandPalette from './CommandPalette';
import SkeletonLoader from './SkeletonLoader';
import QuickCopyButton from './QuickCopyButton';

const API_BASE = 'http://localhost:3000/api';

export default function CodManager() {
  const [modes, setModes] = useState<IModo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');

  const [currentModeId, setCurrentModeId] = useState<number | null>(null);
  const [currentSubmodeId, setCurrentSubmodeId] = useState<number | null>(null);
  const [currentClassId, setCurrentClassId] = useState<number | null>(null);

  // Normal slot data: slotNumber -> { id, name, codes }
  const [slotsData, setSlotsData] = useState<Record<number, any>>({});
  // Aggregated data for "Predeterminado" / Global view
  const [allSlotsData, setAllSlotsData] = useState<any[]>([]);

  // Modals & drawers
  const [isClassDrawerOpen, setIsClassDrawerOpen] = useState(false);
  const [classFilterText, setClassFilterText] = useState('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  // Weapon add/edit dialog
  const [isWeaponModalOpen, setIsWeaponModalOpen] = useState(false);
  const [activeSlotTarget, setActiveSlotTarget] = useState<number>(1);
  const [modalWeaponName, setModalWeaponName] = useState('');
  const [modalCodeValue, setModalCodeValue] = useState('');

  // Toast HUD
  const [toast, setToast] = useState<ToastNotification>({ show: false, message: '', type: 'info' });

  // Global search filter
  const [searchFilter, setSearchFilter] = useState('');

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  // Keyboard shortcut Ctrl+K / Cmd+K listener
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
        setCurrentModeId(firstMode.id);
        if (firstMode.submodos && firstMode.submodos.length > 0) {
          const defaultSub = firstMode.submodos.find(s => s.es_predeterminado) || firstMode.submodos[0];
          setCurrentSubmodeId(defaultSub.id);
          if (defaultSub.clases && defaultSub.clases.length > 0) {
            setCurrentClassId(defaultSub.clases[0].id);
            await fetchSlots(defaultSub.clases[0].id);
          }
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

  const handleSelectMode = async (modeId: number) => {
    setCurrentModeId(modeId);
    const m = modes.find(item => item.id === modeId);
    if (m && m.submodos && m.submodos.length > 0) {
      const defaultSub = m.submodos.find(s => s.es_predeterminado) || m.submodos[0];
      await handleSelectSubmode(defaultSub.id, modeId);
    } else {
      setCurrentSubmodeId(null);
      setCurrentClassId(null);
      setSlotsData({});
    }
  };

  const handleSelectSubmode = async (submodeId: number, modeId?: number) => {
    const targetModeId = modeId || currentModeId;
    setCurrentSubmodeId(submodeId);
    const currentM = modes.find(m => m.id === targetModeId);
    const sub = currentM?.submodos.find(s => s.id === submodeId);

    if (sub?.es_predeterminado) {
      if (targetModeId) await fetchAllSlots(targetModeId);
    } else {
      if (sub?.clases && sub.clases.length > 0) {
        const firstCls = sub.clases[0];
        setCurrentClassId(firstCls.id);
        await fetchSlots(firstCls.id);
      } else {
        setCurrentClassId(null);
        setSlotsData({});
      }
    }
  };

  const handleSelectClass = async (classId: number) => {
    setCurrentClassId(classId);
    setIsClassDrawerOpen(false);
    await fetchSlots(classId);
  };

  // Weapon / Code Actions
  const handleOpenAddWeapon = (slot: number) => {
    setActiveSlotTarget(slot);
    setModalWeaponName('');
    setModalCodeValue('');
    setIsWeaponModalOpen(true);
  };

  const handleSaveWeaponModal = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentClassId || !modalWeaponName.trim()) return;

    try {
      const resObj = await fetch(`${API_BASE}/objetos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clase_id: currentClassId,
          posicion: activeSlotTarget,
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
      await fetchSlots(currentClassId);
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
      if (currentClassId) fetchSlots(currentClassId);
      loadData();
      showToast('Nombre actualizado', 'success');
    } catch (err) {
      showToast('Error al actualizar nombre', 'error');
    }
  };

  const handleDeleteWeapon = async (weaponId: number) => {
    if (!confirm('¿Deseas eliminar esta arma y todos sus códigos asociados?')) return;
    try {
      await fetch(`${API_BASE}/objetos/${weaponId}`, { method: 'DELETE' });
      if (currentClassId) await fetchSlots(currentClassId);
      await loadData();
      showToast('Arma eliminada', 'info');
    } catch (err) {
      showToast('Error al eliminar arma', 'error');
    }
  };

  const handleAddCodeToWeapon = async (weaponId: number, codeVal: string) => {
    try {
      await fetch(`${API_BASE}/codigos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objeto_id: weaponId, codigo: codeVal }),
      });
      if (currentClassId) await fetchSlots(currentClassId);
      await loadData();
      showToast('Código añadido', 'success');
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
      if (currentClassId) fetchSlots(currentClassId);
      loadData();
      showToast('Código actualizado', 'success');
    } catch (err) {
      showToast('Error al actualizar código', 'error');
    }
  };

  const handleDeleteCode = async (codeId: number) => {
    try {
      await fetch(`${API_BASE}/codigos/${codeId}`, { method: 'DELETE' });
      if (currentClassId) await fetchSlots(currentClassId);
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
      if (currentSubmode?.es_predeterminado && currentModeId) {
        await fetchAllSlots(currentModeId);
      } else if (currentClassId) {
        await fetchSlots(currentClassId);
      }
      loadData();
      showToast(`Calificación guardada (${rating}★)`, 'success');
    } catch (err) {
      showToast('Error al actualizar calificación', 'error');
    }
  };

  // Creation & Deletion for Tree
  const handleCreateMode = async () => {
    const name = prompt('Nombre del nuevo modo:');
    if (!name?.trim()) return;
    const code = prompt('Código corto (ej: MJ, BR):') || name.substring(0, 3).toUpperCase();
    try {
      await fetch(`${API_BASE}/modes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: name.trim(), codigo: code.trim(), descripcion: '' }),
      });
      await loadData();
      showToast('Modo creado', 'success');
    } catch (err) {
      showToast('Error al crear modo', 'error');
    }
  };

  const handleCreateSubmode = async (modeId: number) => {
    const name = prompt('Nombre del nuevo submodo:');
    if (!name?.trim()) return;
    try {
      await fetch(`${API_BASE}/modes/${modeId}/submodos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: name.trim(), es_predeterminado: false, orden: 5 }),
      });
      await loadData();
      showToast('Submodo añadido', 'success');
    } catch (err) {
      showToast('Error al crear submodo', 'error');
    }
  };

  const handleCreateClass = async (submodeId: number) => {
    const name = prompt('Nombre de la nueva clase:');
    if (!name?.trim()) return;
    try {
      await fetch(`${API_BASE}/submodos/${submodeId}/clases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: name.trim() }),
      });
      await loadData();
      showToast('Clase creada', 'success');
    } catch (err) {
      showToast('Error al crear clase', 'error');
    }
  };

  const handleCreateWeaponTree = async (classId: number) => {
    const name = prompt('Nombre del arma:');
    if (!name?.trim()) return;
    try {
      await fetch(`${API_BASE}/clases/${classId}/objetos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: name.trim(), posicion: 1 }),
      });
      await loadData();
      showToast('Arma añadida', 'success');
    } catch (err) {
      showToast('Error al crear arma', 'error');
    }
  };

  const handleCreateCodeTree = async (weaponId: number) => {
    const code = prompt('Código de arma:');
    if (!code?.trim()) return;
    await handleAddCodeToWeapon(weaponId, code.trim().toUpperCase());
  };

  const handleDeleteMode = async (id: number) => {
    if (!confirm('¿Eliminar modo y toda su estructura?')) return;
    try {
      await fetch(`${API_BASE}/modes/${id}`, { method: 'DELETE' });
      await loadData();
      showToast('Modo eliminado', 'info');
    } catch (err) {
      showToast('Error al eliminar modo', 'error');
    }
  };

  const handleDeleteSubmode = async (id: number) => {
    if (!confirm('¿Eliminar submodo?')) return;
    try {
      await fetch(`${API_BASE}/submodos/${id}`, { method: 'DELETE' });
      await loadData();
      showToast('Submodo eliminado', 'info');
    } catch (err) {
      showToast('Error al eliminar submodo', 'error');
    }
  };

  const handleDeleteClass = async (id: number) => {
    if (!confirm('¿Eliminar clase?')) return;
    try {
      await fetch(`${API_BASE}/clases/${id}`, { method: 'DELETE' });
      await loadData();
      showToast('Clase eliminada', 'info');
    } catch (err) {
      showToast('Error al eliminar clase', 'error');
    }
  };

  const handleUpdateModeName = async (id: number, name: string) => {
    try {
      await fetch(`${API_BASE}/modes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: name }),
      });
      loadData();
      showToast('Modo actualizado', 'success');
    } catch (err) {
      showToast('Error al actualizar modo', 'error');
    }
  };

  const handleUpdateSubmodeName = async (id: number, name: string) => {
    try {
      await fetch(`${API_BASE}/submodos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: name }),
      });
      loadData();
      showToast('Submodo actualizado', 'success');
    } catch (err) {
      showToast('Error al actualizar submodo', 'error');
    }
  };

  const handleUpdateClassName = async (id: number, name: string) => {
    try {
      await fetch(`${API_BASE}/clases/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: name }),
      });
      loadData();
      showToast('Clase actualizada', 'success');
    } catch (err) {
      showToast('Error al actualizar clase', 'error');
    }
  };

  // Search selection
  const handleSelectSearchResult = async (item: SearchResultItem) => {
    setCurrentModeId(item.modeId);
    if (item.submodeId) {
      await handleSelectSubmode(item.submodeId, item.modeId);
    }
    if (item.classId) {
      await handleSelectClass(item.classId);
    }
    setActiveView('dashboard');
    showToast(`Navegando a: ${item.title}`, 'info');
  };

  // Stats calculation
  const currentMode = modes.find(m => m.id === currentModeId);
  const currentSubmode = currentMode?.submodos?.find(s => s.id === currentSubmodeId);
  const currentClass = currentSubmode?.clases?.find(c => c.id === currentClassId);
  const isDefaultSubmode = Boolean(currentSubmode?.es_predeterminado);

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

  // Grouped aggregated items for global view
  const groupedAggregated = allSlotsData.reduce((acc: Record<string, any[]>, curr: any) => {
    const key = curr.clase_nombre || 'Sin Categoría';
    if (!acc[key]) acc[key] = [];
    acc[key].push(curr);
    return acc;
  }, {});

  const filteredAggregatedKeys = Object.keys(groupedAggregated).filter(key => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    const classMatch = key.toLowerCase().includes(q);
    const itemMatch = groupedAggregated[key].some((i: any) => 
      i.objeto_nombre.toLowerCase().includes(q) || 
      i.codigos?.some((c: any) => c.codigo.toLowerCase().includes(q))
    );
    return classMatch || itemMatch;
  });

  // Filtered classes in drawer
  const filteredDrawerClasses = currentSubmode?.clases?.filter(c => 
    c.nombre.toLowerCase().includes(classFilterText.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-20 md:pb-8">
      
      {/* Top Header (Clean SaaS Enterprise Style) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 md:px-8 py-3.5 shadow-xs">
        <div className="max-w-[96rem] mx-auto flex flex-col gap-3">
          
          {/* Main Brand & Action Row */}
          <div className="flex items-center justify-between gap-3">
            
            {/* Logo */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    NexusCOD
                  </h1>
                  <span className="hidden xs:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Enterprise
                  </span>
                </div>
                <p className="hidden sm:block text-xs text-slate-500 truncate">
                  Gestor de Clases, Armas y Códigos de Armero
                </p>
              </div>
            </div>

            {/* Quick Actions (Search & Vault) */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="btn-press flex items-center gap-2 px-3 py-1.5 min-h-[38px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium transition-all"
                title="Búsqueda rápida (Ctrl+K)"
                aria-label="Buscar"
              >
                <Search className="w-4 h-4 text-slate-500" />
                <span className="hidden md:inline">Buscar armas</span>
                <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded bg-white text-[10px] font-mono text-slate-500 border border-slate-200 shadow-2xs">
                  Ctrl+K
                </kbd>
              </button>

              <button
                onClick={() => setIsVaultOpen(true)}
                className="btn-press flex items-center gap-1.5 px-3.5 py-1.5 min-h-[38px] rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium shadow-2xs"
                title="Bóveda de importación/exportación"
                aria-label="Exportar e importar"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Importar / Exportar</span>
              </button>
            </div>
          </div>

          {/* Views Selector Tabs */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pt-1 border-t border-slate-100">
            <div className="flex items-center p-1 rounded-lg bg-slate-100 text-xs font-medium text-slate-600 w-full sm:w-auto">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 min-h-[32px] rounded-md flex items-center justify-center gap-1.5 transition-all ${
                  activeView === 'dashboard'
                    ? 'bg-white text-blue-600 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setActiveView('tree')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 min-h-[32px] rounded-md flex items-center justify-center gap-1.5 transition-all ${
                  activeView === 'tree'
                    ? 'bg-white text-blue-600 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>Árbol Jerárquico</span>
              </button>
              <button
                onClick={() => setActiveView('global')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 min-h-[32px] rounded-md flex items-center justify-center gap-1.5 transition-all ${
                  activeView === 'global'
                    ? 'bg-white text-blue-600 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Matriz Global</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-[96rem] mx-auto w-full px-4 sm:px-6 md:px-8 py-5 sm:py-6 flex-1 flex flex-col gap-5 sm:gap-6">
        
        {/* HUD Statistics Ribbon (Modern Office SaaS metric cards) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl saas-panel bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-xs font-medium text-slate-500">Modos de Juego</div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">{modes.length}</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 rounded-xl saas-panel bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-xs font-medium text-slate-500">Total de Armas</div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">{totalWeaponsCount}</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Crosshair className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 rounded-xl saas-panel bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-xs font-medium text-slate-500">Códigos Guardados</div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">{totalCodesCount}</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 rounded-xl saas-panel bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-xs font-medium text-slate-500">Calificación Promedio</div>
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

        {/* Views Container */}
        {loading ? (
          <SkeletonLoader count={6} />
        ) : activeView === 'tree' ? (
          <HierarchyTree
            modes={modes}
            onUpdateModeName={handleUpdateModeName}
            onUpdateSubmodeName={handleUpdateSubmodeName}
            onUpdateClassName={handleUpdateClassName}
            onUpdateWeaponName={handleUpdateWeaponName}
            onUpdateCode={handleUpdateCode}
            onDeleteMode={handleDeleteMode}
            onDeleteSubmode={handleDeleteSubmode}
            onDeleteClass={handleDeleteClass}
            onDeleteWeapon={handleDeleteWeapon}
            onDeleteCode={handleDeleteCode}
            onCreateSubmode={handleCreateSubmode}
            onCreateClass={handleCreateClass}
            onCreateWeapon={handleCreateWeaponTree}
            onCreateCode={handleCreateCodeTree}
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
                <p className="text-xs text-slate-500">
                  Resumen de todas las armas y códigos registrados
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filtrar armas o códigos..."
                  className="w-full pl-9 pr-4 py-1.5 min-h-[38px] rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {filteredAggregatedKeys.length === 0 ? (
              <div className="p-10 text-center rounded-xl bg-white border border-slate-200 text-slate-400">
                <Crosshair className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="text-sm">No se encontraron armas registradas</p>
              </div>
            ) : (
              filteredAggregatedKeys.map((category) => (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm sm:text-base font-semibold text-slate-800">
                      {category}
                    </h3>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {groupedAggregated[category].length} armas
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {groupedAggregated[category].map((weapon: any) => (
                      <div
                        key={weapon.objeto_id}
                        className="saas-card rounded-xl p-4 bg-white border border-slate-200 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-slate-900">
                            {weapon.objeto_nombre}
                          </h4>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
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
                                  <span className="font-mono text-xs font-semibold text-slate-800 truncate">
                                    {cd.codigo}
                                  </span>
                                  <QuickCopyButton textToCopy={cd.codigo} size="sm" />
                                </div>

                                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                                  <div className="flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
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
              ))
            )}
          </div>
        ) : (
          /* Tactical Dashboard View */
          <div className="space-y-5">
            
            {/* Mode & Submode Selector Controls */}
            <div className="saas-panel rounded-xl p-4 bg-white border border-slate-200 space-y-3.5">
              
              {/* Mode Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {modes.map((m) => {
                  const isActive = m.id === currentModeId;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelectMode(m.id)}
                      className={`btn-press px-4 py-2 min-h-[38px] rounded-lg text-xs font-semibold whitespace-nowrap transition-all border shrink-0 touch-manipulation ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>{m.nombre}</span>
                      <span className="ml-1.5 opacity-80 font-mono text-[10px]">[{m.codigo}]</span>
                    </button>
                  );
                })}

                <button
                  onClick={handleCreateMode}
                  className="btn-press px-3.5 py-2 min-h-[38px] rounded-lg text-xs font-semibold border border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-blue-600 whitespace-nowrap shrink-0 touch-manipulation"
                >
                  + Modo
                </button>
              </div>

              {/* Submode Pills */}
              {currentMode?.submodos && currentMode.submodos.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100">
                  {currentMode.submodos.map((sm) => {
                    const isActive = sm.id === currentSubmodeId;
                    return (
                      <button
                        key={sm.id}
                        onClick={() => handleSelectSubmode(sm.id)}
                        className={`btn-press px-3.5 py-1.5 min-h-[32px] rounded-full text-xs font-medium flex items-center gap-2 whitespace-nowrap border transition-all shrink-0 touch-manipulation ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                            : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200'
                        }`}
                      >
                        <span>{sm.nombre}</span>
                        {sm.es_predeterminado && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800">
                            Global
                          </span>
                        )}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handleCreateSubmode(currentMode.id)}
                    className="btn-press px-3 py-1.5 min-h-[32px] rounded-full text-xs font-medium border border-dashed border-slate-300 text-slate-500 hover:text-slate-800 shrink-0 touch-manipulation"
                  >
                    + Submodo
                  </button>
                </div>
              )}
            </div>

            {/* Breadcrumb Path & Category Quick Selection */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-500 overflow-x-auto no-scrollbar py-0.5">
                <span className="font-semibold text-slate-800 whitespace-nowrap">{currentMode?.nombre || 'Modo'}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-800 whitespace-nowrap">{currentSubmode?.nombre || 'Submodo'}</span>
                {!isDefaultSubmode && currentClass && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-blue-600 whitespace-nowrap">{currentClass.nombre}</span>
                  </>
                )}
              </div>

              {!isDefaultSubmode && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsClassDrawerOpen(true)}
                    className="btn-press w-full sm:w-auto px-3 py-1.5 min-h-[36px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium flex items-center justify-center gap-2 touch-manipulation"
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>Categoría: {currentClass?.nombre || 'Seleccionar'}</span>
                    <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                  </button>
                  {currentSubmode && (
                    <button
                      onClick={() => handleCreateClass(currentSubmode.id)}
                      className="btn-press min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 touch-manipulation shrink-0"
                      title="Crear nueva clase"
                      aria-label="Crear nueva clase"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Slots Grid Area */}
            {isDefaultSubmode ? (
              /* Predeterminado Global View */
              <div className="space-y-6">
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-800 text-xs flex items-center gap-2.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Vista global activa: Mostrando todas las armas registradas en los submodos.
                  </span>
                </div>

                {Object.keys(groupedAggregated).map((catName) => (
                  <div key={catName} className="space-y-3">
                    <h3 className="text-sm sm:text-base font-semibold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span>{catName}</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {groupedAggregated[catName].map((item: any) => (
                        <div key={item.objeto_id} className="saas-card rounded-xl p-4 bg-white border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-slate-900">{item.objeto_nombre}</h4>
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {item.submodo_nombre}
                            </span>
                          </div>
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            {item.codigos?.map((cd: any) => (
                              <div key={cd.id} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                                <span className="font-mono text-xs font-semibold text-slate-800 truncate">{cd.codigo}</span>
                                <QuickCopyButton textToCopy={cd.codigo} size="sm" />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Specific Class Slots Grid (1 col on mobile, 2 on tablet, 3-4 on desktop) */
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Crosshair className="w-4 h-4 text-blue-600" />
                      <span>{currentClass?.nombre || 'Armas Registradas'}</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      {Object.keys(slotsData).length} armas asignadas a esta categoría
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {(() => {
                    const maxSlot = Math.max(7, ...Object.keys(slotsData).map(Number));
                    const slotsArray = Array.from({ length: maxSlot }, (_, i) => i + 1);

                    return slotsArray.map((slotNum) => {
                      const item = slotsData[slotNum] || null;
                      return (
                        <LoadoutSlotCard
                          key={slotNum}
                          slot={slotNum}
                          item={item}
                          onAddWeapon={handleOpenAddWeapon}
                          onDeleteWeapon={handleDeleteWeapon}
                          onUpdateWeaponName={handleUpdateWeaponName}
                          onAddCode={handleAddCodeToWeapon}
                          onUpdateCode={handleUpdateCode}
                          onDeleteCode={handleDeleteCode}
                          onUpdateRating={handleUpdateRating}
                        />
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button on Mobile for Categories */}
      {!isDefaultSubmode && activeView === 'dashboard' && (
        <div className="md:hidden fixed bottom-6 right-4 z-40">
          <button
            onClick={() => setIsClassDrawerOpen(true)}
            className="btn-press flex items-center gap-2 px-4 py-3 min-h-[48px] rounded-full bg-blue-600 text-white font-medium shadow-lg border border-blue-500 touch-manipulation"
            aria-label="Abrir categorías de armas"
          >
            <Layers className="w-5 h-5" />
            <span>Categorías</span>
            <span className="w-5 h-5 rounded-full bg-blue-700 text-white text-xs flex items-center justify-center font-mono">
              {currentSubmode?.clases?.length || 0}
            </span>
          </button>
        </div>
      )}

      {/* Class Selector Drawer / Bottom Sheet */}
      {isClassDrawerOpen && !isDefaultSubmode && (
        <div className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full md:max-w-sm max-h-[85vh] md:max-h-full rounded-t-2xl md:rounded-none bg-white border-t md:border-t-0 md:border-l border-slate-200 flex flex-col shadow-xl animate-in slide-in-from-bottom md:slide-in-from-right duration-200">
            
            {/* Mobile Drag Indicator Handle */}
            <div className="md:hidden pt-3 pb-1 flex justify-center">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>

            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Categorías de Armamento
                </h3>
              </div>
              <button
                onClick={() => setIsClassDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg touch-manipulation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search filter in drawer */}
            <div className="p-3 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={classFilterText}
                  onChange={(e) => setClassFilterText(e.target.value)}
                  placeholder="Filtrar categorías..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* List of classes */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredDrawerClasses.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No se encontraron categorías coincidentes
                </div>
              ) : (
                filteredDrawerClasses.map((c) => {
                  const isSelected = c.id === currentClassId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelectClass(c.id)}
                      className={`btn-press w-full px-3 py-2.5 rounded-lg flex items-center justify-between border transition-all text-left touch-manipulation ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold shadow-2xs'
                          : 'bg-white text-slate-700 border-transparent hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <Layers className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-medium truncate">{c.nombre}</span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {c.objetos?.length || 0}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {currentSubmode && (
              <div className="p-3 border-t border-slate-200 bg-white">
                <button
                  onClick={() => {
                    handleCreateClass(currentSubmode.id);
                  }}
                  className="btn-press w-full py-2 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold flex items-center justify-center gap-1.5 touch-manipulation"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear Nueva Categoría</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Weapon Dialog Modal */}
      {isWeaponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Registrar Arma en Slot #{activeSlotTarget}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nombre del Arma
                </label>
                <input
                  required
                  type="text"
                  autoFocus
                  value={modalWeaponName}
                  onChange={(e) => setModalWeaponName(e.target.value)}
                  placeholder="ej. M4, DL Q33, QQ9, Kilo 141..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Código de Armero (Opcional)
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">TEXTO-10ALFANUM</span>
                </div>
                <input
                  type="text"
                  value={modalCodeValue}
                  onChange={(e) => setModalCodeValue(e.target.value.toUpperCase())}
                  placeholder="ej. M4-A9K3L7B0X1"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-mono uppercase text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWeaponModalOpen(false)}
                  className="btn-press px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg touch-manipulation"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-press px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs touch-manipulation"
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
        <span className="text-xs font-medium truncate">{toast.message}</span>
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
