import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Database, Layers, ChevronDown, ChevronRight, SlidersHorizontal, Edit3, X, Search, SearchX, CheckCircle, Check, Star, Copy } from 'lucide-react';

const API_BASE = 'http://localhost:3000/api';
const CODE_REGEX = /^[A-Za-z]+-[A-Za-z0-9]{10}$/;

export default function App() {
  const [modos, setModos] = useState<any[]>([]);
  const [submodos, setSubmodos] = useState<any[]>([]);
  const [clases, setClases] = useState<any[]>([]);
  
  // Normal mode slots (map of posicion -> object)
  const [slotsData, setSlotsData] = useState<Record<number, any>>({});
  // Aggregated slots for "Predeterminado" mode
  const [allSlotsData, setAllSlotsData] = useState<any[]>([]);
  
  const [currentModeId, setCurrentModeId] = useState<number | null>(null);
  const [currentSubmodeId, setCurrentSubmodeId] = useState<number | null>(null);
  const [currentClassId, setCurrentClassId] = useState<number | null>(null);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [classSearchText, setClassSearchText] = useState('');
  
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [activeEditingSlot, setActiveEditingSlot] = useState<number | null>(null);
  const [modalObjectName, setModalObjectName] = useState('');
  const [modalCodeInput, setModalCodeInput] = useState('');
  
  const [toast, setToast] = useState<{ show: boolean, message: string }>({ show: false, message: '' });

  useEffect(() => {
    loadModes();
  }, []);

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Código copiado al portapapeles');
  };

  const loadModes = async () => {
    try {
      const res = await fetch(`${API_BASE}/modos`);
      const data = await res.json();
      setModos(data);
      if (data.length > 0) {
        selectMode(data[0].id);
      }
    } catch (err) {
      console.error(err);
      showToast('Error cargando modos desde la BD');
    }
  };

  const selectMode = async (modoId: number) => {
    setCurrentModeId(modoId);
    try {
      const res = await fetch(`${API_BASE}/modos/${modoId}/submodos`);
      const data = await res.json();
      setSubmodos(data);
      if (data.length > 0) {
        const def = data.find((s: any) => s.es_predeterminado) || data[0];
        await selectSubmode(def.id);
      } else {
        setClases([]);
        setSlotsData({});
        setAllSlotsData([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectSubmode = async (submodoId: number) => {
    setCurrentSubmodeId(submodoId);
    const submodo = submodos.find(s => s.id === submodoId);
    
    if (submodo?.es_predeterminado) {
      // Load all aggregated slots
      try {
        const res = await fetch(`${API_BASE}/modos/${currentModeId}/all-slots`);
        const data = await res.json();
        setAllSlotsData(data);
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        const res = await fetch(`${API_BASE}/submodos/${submodoId}/clases`);
        const data = await res.json();
        setClases(data);
        if (data.length > 0) {
          await selectClass(data[0].id);
        } else {
          setSlotsData({});
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const selectClass = async (claseId: number) => {
    setCurrentClassId(claseId);
    setIsDrawerOpen(false);
    try {
      const res = await fetch(`${API_BASE}/clases/${claseId}/slots`);
      const data = await res.json();
      setSlotsData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateRating = async (codigoId: number, rating: number) => {
    try {
      await fetch(`${API_BASE}/codigos/${codigoId}/rating`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calificacion: rating })
      });
      // Refresh current view
      const submodo = submodos.find(s => s.id === currentSubmodeId);
      if (submodo?.es_predeterminado) {
        selectSubmode(currentSubmodeId!);
      } else if (currentClassId) {
        selectClass(currentClassId);
      }
    } catch (err) {
      console.error(err);
      showToast('Error al actualizar calificación');
    }
  };

  const currentMode = modos.find(m => m.id === currentModeId);
  const currentSubmode = submodos.find(s => s.id === currentSubmodeId);
  const currentClass = clases.find(c => c.id === currentClassId);
  const filteredClases = clases.filter(c => c.nombre.toLowerCase().includes(classSearchText.toLowerCase()));
  const isDefaultMode = currentSubmode?.es_predeterminado;

  const openAddModal = (slot: number) => {
    setActiveEditingSlot(slot);
    setModalObjectName('');
    setModalCodeInput('');
    setIsCodeModalOpen(true);
  };

  const openEditModal = (slot: number) => {
    setActiveEditingSlot(slot);
    const item = slotsData[slot];
    if (item) {
      setModalObjectName(item.name);
      setModalCodeInput('');
      setIsCodeModalOpen(true);
    }
  };

  const handleSaveSlot = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentClassId || !activeEditingSlot) return;

    try {
      const resObj = await fetch(`${API_BASE}/objetos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clase_id: currentClassId,
          posicion: activeEditingSlot,
          nombre: modalObjectName
        })
      });
      const savedObj = await resObj.json();

      const codeVal = modalCodeInput.trim().toUpperCase();
      if (codeVal && CODE_REGEX.test(codeVal)) {
        await fetch(`${API_BASE}/codigos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            objeto_id: savedObj.id,
            codigo: codeVal
          })
        });
      }

      setIsCodeModalOpen(false);
      await selectClass(currentClassId);
      showToast(`Arma guardada con éxito`);
    } catch (err) {
      console.error(err);
      showToast('Error al guardar en BD');
    }
  };

  const handleDeleteSlot = async () => {
    if (!activeEditingSlot || !slotsData[activeEditingSlot]) return;
    const item = slotsData[activeEditingSlot];
    
    if (confirm(`¿Borrar Arma? Esto borrará el objeto y todos sus códigos.`)) {
      try {
        await fetch(`${API_BASE}/objetos/${item.id}`, { method: 'DELETE' });
        setIsCodeModalOpen(false);
        await selectClass(currentClassId!);
        showToast(`Arma eliminada`);
      } catch (err) {
        console.error(err);
        showToast('Error al eliminar');
      }
    }
  };

  // Group aggregated slots by class name for the default view
  const groupedAggregated = allSlotsData.reduce((acc: Record<string, any[]>, curr: any) => {
    if (!acc[curr.clase_nombre]) acc[curr.clase_nombre] = [];
    acc[curr.clase_nombre].push(curr);
    return acc;
  }, {});

  return (
    <div className="bg-slate-50 text-slate-800 font-sans antialiased min-h-screen flex flex-col pb-12">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xs font-semibold uppercase tracking-wider text-slate-400">COD Loadouts</h1>
              <p className="text-sm font-bold text-slate-800 leading-tight">Gestor de Clases</p>
            </div>
          </div>
          {!isDefaultMode && (
            <div className="flex items-center gap-2">
              <button onClick={() => setIsDrawerOpen(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 border border-slate-200/80 hover:bg-slate-200">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>{currentClass?.nombre || 'Categorías'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          )}
        </div>

        <div className="px-4 pb-2">
          <div className="flex items-center justify-between gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 text-xs overflow-x-auto no-scrollbar">
            {modos.map((m) => (
              <button 
                key={m.id}
                onClick={() => selectMode(m.id)}
                className={`min-w-max flex-1 py-1.5 px-3 text-center rounded-lg transition-all ${m.id === currentModeId ? 'font-semibold shadow-sm bg-white text-indigo-600' : 'font-medium text-slate-600 hover:text-slate-900'}`}
              >
                {m.nombre}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 min-w-max">
            {submodos.map((sm) => {
              const isActive = sm.id === currentSubmodeId;
              return (
                <button 
                  key={sm.id}
                  onClick={() => selectSubmode(sm.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${isActive ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200 border border-slate-200/60'}`}
                >
                  <span>{sm.nombre}</span>
                  {sm.es_predeterminado && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-600'}`}>
                      Global
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      <section className="px-4 py-2.5 bg-slate-100/50 border-b border-slate-200/70 text-xs">
        <div className="flex items-center gap-1 text-slate-500 overflow-x-auto whitespace-nowrap py-0.5">
          <span className="font-medium text-slate-700">{currentMode?.nombre || 'Modo'}</span>
          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="font-medium text-slate-700">{currentSubmode?.nombre || 'Submodo'}</span>
          {!isDefaultMode && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="font-medium text-indigo-600">{currentClass?.nombre || 'Clase'}</span>
            </>
          )}
        </div>
      </section>

      <main className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full">
        {isDefaultMode ? (
          <div className="space-y-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900">Vista Global</h2>
              <p className="text-xs text-slate-500">Explora todos los códigos y clasifícalos con estrellas.</p>
            </div>
            {Object.keys(groupedAggregated).length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                No hay armas registradas en los submodos.
              </div>
            ) : (
              Object.keys(groupedAggregated).map((className) => (
                <div key={className} className="mb-6">
                  <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-3">{className}</h3>
                  <div className="space-y-3">
                    {groupedAggregated[className].map((item: any) => (
                      <div key={item.objeto_id} className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm flex flex-col gap-2.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-800">{item.objeto_nombre}</h4>
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {item.submodo_nombre}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-slate-100">
                          <div className="space-y-2">
                            {item.codigos?.length > 0 ? (
                              item.codigos.map((cd: any) => (
                                <div key={cd.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{cd.codigo}</span>
                                    <button onClick={() => copyToClipboard(cd.codigo)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors">
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button key={star} onClick={() => updateRating(cd.id, star)} className="focus:outline-none">
                                        <Star className={`w-4 h-4 ${star <= (cd.calificacion || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-[11px] text-slate-400 italic">Sin códigos asignados</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">{currentClass?.nombre || '...'}</h2>
                  <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                    {Object.keys(slotsData).length} armas asignadas
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Armas registradas en esta categoría</p>
              </div>
              <button onClick={() => setIsDrawerOpen(true)} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 shadow-sm flex items-center gap-1.5 text-xs font-medium">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Cambiar Clase</span>
              </button>
            </div>

            <div className="space-y-3">
              {(() => {
                const maxSlot = Math.max(0, ...Object.keys(slotsData).map(Number));
                const displaySlots = Array.from({ length: maxSlot + 1 }, (_, i) => i + 1);
                return displaySlots.map(slot => {
                  const item = slotsData[slot];
                if (item) {
                  return (
                    <div key={slot} className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm flex flex-col gap-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-sm font-bold text-slate-800 leading-tight">{item.name}</h3>
                        </div>
                        <button onClick={() => openEditModal(slot)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="pt-2 border-t border-slate-100">
                        <div className="space-y-2">
                          {item.codes?.length > 0 ? (
                            item.codes.map((cd: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{cd.codigo}</span>
                                  <button onClick={() => copyToClipboard(cd.codigo)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors">
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button key={star} onClick={() => updateRating(cd.id, star)} className="focus:outline-none">
                                      <Star className={`w-4 h-4 ${star <= (cd.calificacion || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-[11px] text-slate-400 italic">Sin códigos asignados</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <button key={slot} onClick={() => openAddModal(slot)} className="w-full text-left p-3.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 bg-white/60 flex items-center justify-between group transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-indigo-100 text-slate-400 group-hover:text-indigo-600 font-medium text-xs flex items-center justify-center">
                          +
                        </div>
                        <div className="text-xs">
                          <span className="font-medium text-slate-600 group-hover:text-indigo-700">Añadir arma nueva</span>
                        </div>
                      </div>
                    </button>
                  );
                }
                });
              })()}
            </div>
          </>
        )}
      </main>

      {isDrawerOpen && !isDefaultMode && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-xs bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Clases de Armas</h3>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={classSearchText} onChange={(e) => setClassSearchText(e.target.value)} placeholder="Filtrar clases..." className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredClases.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  <SearchX className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  No se encontraron clases
                </div>
              ) : (
                filteredClases.map(c => (
                  <button key={c.id} onClick={() => selectClass(c.id)} className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-all ${c.id === currentClassId ? 'bg-indigo-50/80 border border-indigo-200 text-indigo-900 font-semibold' : 'hover:bg-slate-100 text-slate-700'}`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${c.id === currentClassId ? 'bg-indigo-600 text-white' : 'bg-slate-200/60 text-slate-600'}`}>
                        <Layers className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs">{c.nombre}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {isCodeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">{slotsData[activeEditingSlot!] ? 'Editar Arma' : 'Nueva Arma'}</h3>
              </div>
              <button onClick={() => setIsCodeModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSaveSlot} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Arma</label>
                <input required type="text" value={modalObjectName} onChange={e => setModalObjectName(e.target.value)} placeholder="ej. M4" className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Código de Clase</label>
                  <span className="text-[10px] font-mono text-slate-400">TEXTO-10ALFANUM</span>
                </div>
                <input type="text" value={modalCodeInput} onChange={e => setModalCodeInput(e.target.value)} placeholder="ej. M4-A9K3L7B0X1" className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-slate-50 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>

              {slotsData[activeEditingSlot!]?.codes?.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">Códigos actuales guardados (se omiten en edición)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {slotsData[activeEditingSlot!].codes.map((c: any, i: number) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 text-[11px] font-mono border border-slate-200">{c.codigo}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {slotsData[activeEditingSlot!] ? (
                  <button type="button" onClick={handleDeleteSlot} className="px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl">Eliminar Arma</button>
                ) : <div />}
                <div className="flex items-center gap-2 ml-auto">
                  <button type="button" onClick={() => setIsCodeModalOpen(false)} className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl">Cancelar</button>
                  <button type="submit" disabled={Boolean(modalCodeInput) && !CODE_REGEX.test(modalCodeInput)} className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 disabled:opacity-50">
                    <Check className="w-3.5 h-3.5" />
                    Guardar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-lg text-xs font-medium flex items-center gap-2 transition-all ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-2'}`}>
        <CheckCircle className="w-4 h-4 text-emerald-400" />
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
