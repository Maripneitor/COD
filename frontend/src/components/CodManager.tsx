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
  Terminal, 
  Crosshair, 
  Star,
  Activity,
  Award
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
      showToast(`Arma "${modalWeaponName}" registrada con éxito`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Error al guardar arma en BD', 'error');
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
      showToast('Nombre de arma actualizado', 'success');
    } catch (err) {
      showToast('Error al actualizar nombre', 'error');
    }
  };

  const handleDeleteWeapon = async (weaponId: number) => {
    if (!confirm('¿Confirmas la eliminación de este equipamiento táctico y sus códigos?')) return;
    try {
      await fetch(`${API_BASE}/objetos/${weaponId}`, { method: 'DELETE' });
      if (currentClassId) await fetchSlots(currentClassId);
      await loadData();
      showToast('Arma eliminada', 'warning');
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
      showToast('Código táctico añadido', 'success');
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

  // Creation & Deletion for Hierarchy Tree
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
      showToast('Modo creado exitosamente', 'success');
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
    const name = prompt('Nombre de la nueva clase (ej: Fusiles de Asalto):');
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
      showToast('Arma añadida al inventario', 'success');
    } catch (err) {
      showToast('Error al crear arma', 'error');
    }
  };

  const handleCreateCodeTree = async (weaponId: number) => {
    const code = prompt('Código de arma (ej: M4-A9K3L7B0X1):');
    if (!code?.trim()) return;
    await handleAddCodeToWeapon(weaponId, code.trim().toUpperCase());
  };

  const handleDeleteMode = async (id: number) => {
    if (!confirm('¿Eliminar modo completo y toda su jerarquía?')) return;
    try {
      await fetch(`${API_BASE}/modes/${id}`, { method: 'DELETE' });
      await loadData();
      showToast('Modo eliminado', 'warning');
    } catch (err) {
      showToast('Error al eliminar modo', 'error');
    }
  };

  const handleDeleteSubmode = async (id: number) => {
    if (!confirm('¿Eliminar submodo y todas sus clases?')) return;
    try {
      await fetch(`${API_BASE}/submodos/${id}`, { method: 'DELETE' });
      await loadData();
      showToast('Submodo eliminado', 'warning');
    } catch (err) {
      showToast('Error al eliminar submodo', 'error');
    }
  };

  const handleDeleteClass = async (id: number) => {
    if (!confirm('¿Eliminar clase de armas?')) return;
    try {
      await fetch(`${API_BASE}/clases/${id}`, { method: 'DELETE' });
      await loadData();
      showToast('Clase eliminada', 'warning');
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
      showToast('Nombre de modo actualizado', 'success');
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
      showToast('Nombre de submodo actualizado', 'success');
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
      showToast('Nombre de clase actualizado', 'success');
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
    <div className="min-h-screen bg-[#060913] cyber-grid text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200 pb-20 md:pb-8">
      
      {/* Top Holographic Navigation Bar (Sticky with mobile blur) */}
      <header className="sticky top-0 z-40 glass-panel-glow border-b border-cyan-500/20 px-3 sm:px-6 md:px-8 py-3">
        <div className="max-w-[96rem] mx-auto flex flex-col gap-3">
          
          {/* Main Brand & Action Row */}
          <div className="flex items-center justify-between gap-2">
            
            {/* Logo */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] shrink-0">
                <Crosshair className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-lg sm:text-xl font-tactical uppercase tracking-wider font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 truncate">
                    NexusCOD
                  </h1>
                  <span className="hidden xs:inline-block text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    v2.0
                  </span>
                </div>
                <p className="hidden sm:block text-[10px] font-tactical uppercase tracking-widest text-slate-400 truncate">
                  Terminal de Armamento Táctico
                </p>
              </div>
            </div>

            {/* Quick Actions (Search & Vault) */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="btn-press flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-cyan-300 text-xs font-tactical transition-all"
                title="Búsqueda rápida (Ctrl+K)"
                aria-label="Buscar armas"
              >
                <Search className="w-4 h-4 text-cyan-400" />
                <span className="hidden md:inline">Buscar</span>
                <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
                  Ctrl+K
                </kbd>
              </button>

              <button
                onClick={() => setIsVaultOpen(true)}
                className="btn-press flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl bg-fuchsia-950/50 text-fuchsia-300 border border-fuchsia-500/30 hover:bg-fuchsia-900/40 hover:border-fuchsia-400 text-xs font-tactical uppercase tracking-wider font-bold shadow-[0_0_15px_rgba(217,70,239,0.15)]"
                title="Bóveda de importación/exportación"
                aria-label="Abrir bóveda"
              >
                <Terminal className="w-4 h-4 text-fuchsia-400" />
                <span className="hidden sm:inline">Bóveda</span>
              </button>
            </div>
          </div>

          {/* Views Selector Tabs */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pt-1 border-t border-slate-800/60">
            <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-tactical uppercase tracking-wider font-bold w-full sm:w-auto">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 min-h-[36px] rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeView === 'dashboard'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setActiveView('tree')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 min-h-[36px] rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeView === 'tree'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>Árbol</span>
              </button>
              <button
                onClick={() => setActiveView('global')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 min-h-[36px] rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeView === 'global'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Matriz</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-[96rem] mx-auto w-full px-3 sm:px-6 md:px-8 py-4 sm:py-6 flex-1 flex flex-col gap-5 sm:gap-6">
        
        {/* HUD Statistics Ribbon (Compact on mobile) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="p-3 sm:p-4 rounded-2xl glass-panel border border-cyan-500/20 flex items-center justify-between">
            <div>
              <div className="text-[10px] sm:text-[11px] font-tactical uppercase tracking-widest text-slate-400">Modos</div>
              <div className="text-xl sm:text-2xl font-bold font-tactical text-white mt-0.5">{modes.length}</div>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-2xl glass-panel border border-cyan-500/20 flex items-center justify-between">
            <div>
              <div className="text-[10px] sm:text-[11px] font-tactical uppercase tracking-widest text-slate-400">Armas</div>
              <div className="text-xl sm:text-2xl font-bold font-tactical text-cyan-300 mt-0.5">{totalWeaponsCount}</div>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold">
              <Crosshair className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-2xl glass-panel border border-cyan-500/20 flex items-center justify-between">
            <div>
              <div className="text-[10px] sm:text-[11px] font-tactical uppercase tracking-widest text-slate-400">Códigos</div>
              <div className="text-xl sm:text-2xl font-bold font-tactical text-fuchsia-300 mt-0.5">{totalCodesCount}</div>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-fuchsia-500/20 text-fuchsia-300 flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-2xl glass-panel border border-cyan-500/20 flex items-center justify-between">
            <div>
              <div className="text-[10px] sm:text-[11px] font-tactical uppercase tracking-widest text-slate-400">Rating</div>
              <div className="text-xl sm:text-2xl font-bold font-tactical text-amber-400 mt-0.5 flex items-center gap-1">
                <span>{avgRating}</span>
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* View Switcher Output */}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl glass-panel border border-cyan-500/20">
              <div>
                <h2 className="text-base sm:text-lg font-tactical uppercase tracking-wider font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  <span>Matriz Global de Armas</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Catálogo consolidado con todas las armas y calificaciones
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filtrar por arma o código..."
                  className="w-full pl-9 pr-4 py-2 min-h-[40px] rounded-xl bg-slate-900 border border-slate-800 text-base sm:text-xs text-cyan-200 outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {filteredAggregatedKeys.length === 0 ? (
              <div className="p-10 text-center rounded-2xl glass-panel text-slate-500">
                <Crosshair className="w-10 h-10 mx-auto mb-3 opacity-40 text-slate-600" />
                <p className="text-sm font-tactical">No se encontraron armas en la matriz global</p>
              </div>
            ) : (
              filteredAggregatedKeys.map((category) => (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-cyan-500/20">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm sm:text-base font-tactical uppercase tracking-wider font-bold text-white">
                      {category}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {groupedAggregated[category].length} armas
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {groupedAggregated[category].map((weapon: any) => (
                      <div
                        key={weapon.objeto_id}
                        className="glass-panel rounded-2xl p-4 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                            <h4 className="font-tactical text-sm sm:text-base font-bold text-white uppercase tracking-wide">
                              {weapon.objeto_nombre}
                            </h4>
                          </div>
                          <span className="text-[10px] font-tactical uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {weapon.submodo_nombre}
                          </span>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-800/80">
                          {weapon.codigos && weapon.codigos.length > 0 ? (
                            weapon.codigos.map((cd: any) => (
                              <div
                                key={cd.id}
                                className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono text-xs font-bold text-cyan-300 truncate">
                                    {cd.codigo}
                                  </span>
                                  <QuickCopyButton textToCopy={cd.codigo} size="sm" />
                                </div>

                                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                                  <div className="flex items-center gap-0.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        type="button"
                                        onClick={() => handleUpdateRating(cd.id, star)}
                                        className="p-1 min-w-[28px] min-h-[28px] flex items-center justify-center focus:outline-none transition-transform active:scale-125 touch-manipulation"
                                        title={`Calificar con ${star} estrellas`}
                                      >
                                        <Star
                                          className={`w-3.5 h-3.5 ${
                                            star <= (cd.calificacion || 0)
                                              ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                                              : 'text-slate-800'
                                          }`}
                                        />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-[11px] text-slate-600 italic">Sin códigos asignados</div>
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
          <div className="space-y-5 sm:space-y-6">
            
            {/* Mode & Submode Selector Controls */}
            <div className="glass-panel rounded-2xl p-3.5 sm:p-4 border border-cyan-500/20 space-y-3.5">
              
              {/* Mode Tabs (Touch horizontal scroll) */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 overscroll-x-contain touch-pan-x">
                {modes.map((m) => {
                  const isActive = m.id === currentModeId;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelectMode(m.id)}
                      className={`btn-press px-4 py-2 min-h-[42px] rounded-xl text-xs font-tactical uppercase tracking-wider font-bold whitespace-nowrap transition-all border shrink-0 touch-manipulation ${
                        isActive
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <span>{m.nombre}</span>
                      <span className="ml-1.5 opacity-70 font-mono text-[10px]">[{m.codigo}]</span>
                    </button>
                  );
                })}

                <button
                  onClick={handleCreateMode}
                  className="btn-press px-3.5 py-2 min-h-[42px] rounded-xl text-xs font-tactical uppercase tracking-wider font-semibold border border-dashed border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 whitespace-nowrap shrink-0 touch-manipulation"
                >
                  + Modo
                </button>
              </div>

              {/* Submode Pills (Touch horizontal scroll) */}
              {currentMode?.submodos && currentMode.submodos.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-slate-800/80 overscroll-x-contain touch-pan-x">
                  {currentMode.submodos.map((sm) => {
                    const isActive = sm.id === currentSubmodeId;
                    return (
                      <button
                        key={sm.id}
                        onClick={() => handleSelectSubmode(sm.id)}
                        className={`btn-press px-3.5 py-1.5 min-h-[36px] rounded-full text-xs font-tactical uppercase tracking-wider font-semibold flex items-center gap-2 whitespace-nowrap border transition-all shrink-0 touch-manipulation ${
                          isActive
                            ? 'bg-blue-600/90 text-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                            : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <span>{sm.nombre}</span>
                        {sm.es_predeterminado && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 font-bold">
                            GLOBAL
                          </span>
                        )}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handleCreateSubmode(currentMode.id)}
                    className="btn-press px-3 py-1.5 min-h-[36px] rounded-full text-[11px] font-tactical uppercase tracking-wider border border-dashed border-slate-700 text-slate-400 hover:text-cyan-300 shrink-0 touch-manipulation"
                  >
                    + Submodo
                  </button>
                </div>
              )}
            </div>

            {/* Breadcrumb Path & Category Quick Selection */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl glass-panel border border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-400 font-tactical uppercase tracking-wider overflow-x-auto no-scrollbar py-0.5">
                <span className="text-white font-bold whitespace-nowrap">{currentMode?.nombre || 'Modo'}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span className="text-cyan-300 font-bold whitespace-nowrap">{currentSubmode?.nombre || 'Submodo'}</span>
                {!isDefaultSubmode && currentClass && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span className="text-fuchsia-400 font-bold whitespace-nowrap">{currentClass.nombre}</span>
                  </>
                )}
              </div>

              {!isDefaultSubmode && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsClassDrawerOpen(true)}
                    className="btn-press w-full sm:w-auto px-3.5 py-2 min-h-[42px] sm:min-h-[36px] rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-tactical uppercase tracking-wider font-semibold flex items-center justify-center gap-2 touch-manipulation"
                  >
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Categorías ({currentClass?.nombre || 'Seleccionar'})</span>
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  {currentSubmode && (
                    <button
                      onClick={() => handleCreateClass(currentSubmode.id)}
                      className="btn-press min-w-[42px] min-h-[42px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30 touch-manipulation shrink-0"
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
                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs font-tactical flex items-center gap-3">
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Vista predeterminada activa: Visualizando todas las armas agregadas de los submodos.
                  </span>
                </div>

                {Object.keys(groupedAggregated).map((catName) => (
                  <div key={catName} className="space-y-3">
                    <h3 className="font-tactical text-base uppercase tracking-wider font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-cyan-400" />
                      <span>{catName}</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {groupedAggregated[catName].map((item: any) => (
                        <div key={item.objeto_id} className="glass-panel rounded-2xl p-4 border border-cyan-500/20 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-tactical text-sm font-bold text-white uppercase">{item.objeto_nombre}</h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {item.submodo_nombre}
                            </span>
                          </div>
                          <div className="space-y-2 pt-2 border-t border-slate-800">
                            {item.codigos?.map((cd: any) => (
                              <div key={cd.id} className="p-2.5 rounded-xl bg-slate-900 flex items-center justify-between gap-2">
                                <span className="font-mono text-xs text-cyan-300 font-bold truncate">{cd.codigo}</span>
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
                    <h2 className="text-base sm:text-lg font-tactical uppercase tracking-wider font-bold text-white flex items-center gap-2">
                      <Crosshair className="w-5 h-5 text-cyan-400" />
                      <span>{currentClass?.nombre || 'Armamento Asignado'}</span>
                    </h2>
                    <p className="text-xs text-slate-400 font-tactical">
                      {Object.keys(slotsData).length} armas registradas en los slots
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
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

      {/* Floating Action Button on Mobile for Quick Category Drawer */}
      {!isDefaultSubmode && activeView === 'dashboard' && (
        <div className="md:hidden fixed bottom-6 right-4 z-40">
          <button
            onClick={() => setIsClassDrawerOpen(true)}
            className="btn-press flex items-center gap-2 px-4 py-3 min-h-[48px] rounded-full bg-cyan-500 text-slate-950 font-tactical uppercase tracking-wider font-bold shadow-[0_0_25px_rgba(6,182,212,0.6)] border border-cyan-300 touch-manipulation"
            aria-label="Abrir categorías de armas"
          >
            <Layers className="w-5 h-5" />
            <span>Categorías</span>
            <span className="w-6 h-6 rounded-full bg-slate-950 text-cyan-300 text-xs flex items-center justify-center font-mono">
              {currentSubmode?.clases?.length || 0}
            </span>
          </button>
        </div>
      )}

      {/* Class Selector: Responsive Bottom Sheet on Mobile (<768px), Side Drawer on Desktop */}
      {isClassDrawerOpen && !isDefaultSubmode && (
        <div className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full md:max-w-sm max-h-[85vh] md:max-h-full rounded-t-3xl md:rounded-none bg-slate-950 border-t md:border-t-0 md:border-l border-cyan-500/30 flex flex-col shadow-2xl animate-in slide-in-from-bottom md:slide-in-from-right duration-200">
            
            {/* Mobile Drag Indicator Handle */}
            <div className="md:hidden pt-3 pb-1 flex justify-center">
              <div className="w-12 h-1.5 rounded-full bg-slate-700" />
            </div>

            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-cyan-500/20 bg-slate-900/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-tactical uppercase tracking-wider font-bold text-white">
                  Clases de Armamento
                </h3>
              </div>
              <button
                onClick={() => setIsClassDrawerOpen(false)}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center p-1 text-slate-400 hover:text-white rounded-lg touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search filter in drawer */}
            <div className="p-3.5 border-b border-slate-800 bg-slate-950/60">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={classFilterText}
                  onChange={(e) => setClassFilterText(e.target.value)}
                  placeholder="Filtrar clases..."
                  className="w-full pl-9 pr-3 py-2 min-h-[40px] text-base sm:text-xs rounded-xl bg-slate-900 border border-slate-800 text-cyan-200 outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* List of classes */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 overscroll-contain">
              {filteredDrawerClasses.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-tactical text-xs">
                  No se encontraron clases coincidentes
                </div>
              ) : (
                filteredDrawerClasses.map((c) => {
                  const isSelected = c.id === currentClassId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelectClass(c.id)}
                      className={`btn-press w-full p-3.5 min-h-[50px] rounded-xl flex items-center justify-between border transition-all text-left touch-manipulation ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                          : 'bg-slate-900/40 text-slate-300 border-transparent hover:bg-slate-900 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                        }`}>
                          <Layers className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-tactical uppercase tracking-wide font-bold truncate">{c.nombre}</span>
                      </div>
                      <span className="text-xs font-mono text-slate-500">
                        {c.objetos?.length || 0} armas
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {currentSubmode && (
              <div className="p-4 border-t border-slate-800 bg-slate-950 pb-safe">
                <button
                  onClick={() => {
                    handleCreateClass(currentSubmode.id);
                  }}
                  className="btn-press w-full py-3 px-4 min-h-[46px] rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-tactical uppercase tracking-wider font-bold flex items-center justify-center gap-2 touch-manipulation"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Crear Nueva Clase</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Weapon Dialog Modal */}
      {isWeaponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl glass-panel-glow border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.3)] overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-cyan-500/20 bg-slate-900/90 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Crosshair className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-tactical uppercase tracking-wider font-bold text-white">
                  Registrar Arma en Slot #{activeSlotTarget}
                </h3>
              </div>
              <button
                onClick={() => setIsWeaponModalOpen(false)}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center p-1 text-slate-400 hover:text-white rounded-lg touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWeaponModal} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-tactical uppercase tracking-wider font-bold text-slate-300 mb-1.5">
                  Nombre del Arma
                </label>
                <input
                  required
                  type="text"
                  autoFocus
                  value={modalWeaponName}
                  onChange={(e) => setModalWeaponName(e.target.value)}
                  placeholder="ej. M4, DL Q33, QQ9, Kilo 141..."
                  className="w-full px-3.5 py-2.5 min-h-[42px] rounded-xl bg-slate-950 border border-slate-800 text-base sm:text-xs text-cyan-200 placeholder-slate-600 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-tactical uppercase tracking-wider font-bold text-slate-300">
                    Código de Loadout (Opcional)
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">TEXTO-10ALFANUM</span>
                </div>
                <input
                  type="text"
                  value={modalCodeValue}
                  onChange={(e) => setModalCodeValue(e.target.value.toUpperCase())}
                  placeholder="ej. M4-A9K3L7B0X1"
                  className="w-full px-3.5 py-2.5 min-h-[42px] rounded-xl bg-slate-950 border border-slate-800 text-base sm:text-xs font-mono uppercase text-cyan-300 placeholder-slate-600 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWeaponModalOpen(false)}
                  className="btn-press px-4 py-2.5 min-h-[42px] text-xs font-tactical uppercase tracking-wider font-semibold text-slate-400 hover:text-slate-200 rounded-xl touch-manipulation"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-press px-5 py-2.5 min-h-[42px] rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-tactical uppercase tracking-wider font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] touch-manipulation"
                >
                  Guardar Arma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Tactical Toast HUD (Above bottom safe area) */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl glass-panel-glow border shadow-2xl flex items-center gap-3 transition-all duration-200 max-w-[90vw] ${
          toast.show
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-3 pointer-events-none'
        } ${
          toast.type === 'success'
            ? 'border-emerald-500/50 text-emerald-300 bg-slate-950/95'
            : toast.type === 'error'
            ? 'border-rose-500/50 text-rose-300 bg-slate-950/95'
            : toast.type === 'warning'
            ? 'border-amber-500/50 text-amber-300 bg-slate-950/95'
            : 'border-cyan-500/50 text-cyan-300 bg-slate-950/95'
        }`}
      >
        {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
        {toast.type === 'error' && <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />}
        {toast.type === 'warning' && <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />}
        {toast.type === 'info' && <Info className="w-4 h-4 text-cyan-400 shrink-0" />}
        <span className="text-xs font-tactical uppercase tracking-wider font-semibold truncate">{toast.message}</span>
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
