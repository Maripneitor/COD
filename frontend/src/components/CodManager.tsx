import { useState, useEffect } from 'react';
import InlineEditable from './InlineEditable';

const API_URL = 'http://localhost:3001/api';

export default function CodManager() {
  const [modes, setModes] = useState<any[]>([]);
  const [activeModeIdx, setActiveModeIdx] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') !== 'light';
    }
    return true;
  });

  useEffect(() => {
    fetchModes();
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const fetchModes = async () => {
    try {
      const res = await fetch(`${API_URL}/modes`);
      const data = await res.json();
      setModes(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Creación
  const handleCreateMode = async () => {
    try {
      await fetch(`${API_URL}/modes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Nuevo Modo' })
      });
      fetchModes();
    } catch (err) { console.error(err); }
  };

  const handleCreateClass = async (modeId: string) => {
    try {
      await fetch(`${API_URL}/modes/${modeId}/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Nueva Clase' })
      });
      fetchModes();
    } catch (err) { console.error(err); }
  };

  const handleCreateObject = async (classId: string) => {
    try {
      await fetch(`${API_URL}/classes/${classId}/objects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Nuevo Objeto' })
      });
      fetchModes();
    } catch (err) { console.error(err); }
  };

  const handleAddCode = async (objectId: string, codesCount: number) => {
    try {
      await fetch(`${API_URL}/objects/${objectId}/codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot: codesCount + 1, codeName: 'SO-00', alphanumericVal: '0000000000' })
      });
      fetchModes();
    } catch (err) { console.error(err); }
  };

  // Actualización
  const handleUpdateMode = async (modeId: string, newName: string) => {
    try {
      await fetch(`${API_URL}/modes/${modeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      fetchModes();
    } catch (err) { console.error(err); }
  };

  const handleUpdateClass = async (classId: string, newName: string) => {
    try {
      await fetch(`${API_URL}/classes/${classId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      fetchModes();
    } catch (err) { console.error(err); }
  };

  const handleUpdateObject = async (objectId: string, newName: string) => {
    try {
      await fetch(`${API_URL}/objects/${objectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      fetchModes();
    } catch (err) { console.error(err); }
  };

  const handleUpdateCode = async (objectId: string, slot: number, codeName: string, alphanumericVal: string) => {
    try {
      await fetch(`${API_URL}/objects/${objectId}/codes`, {
        method: 'POST', // Backend upserts on POST
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot, codeName, alphanumericVal })
      });
      fetchModes();
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-cyan-600 dark:text-cyan-400 animate-pulse text-2xl font-light transition-colors">Cargando NexusCOD...</div>;
  }

  const activeMode = modes[activeModeIdx] || null;

  let filteredClasses = [];
  if (activeMode) {
    const term = searchTerm.toLowerCase();
    filteredClasses = activeMode.classes.map((cls: any) => {
      const filteredObjects = cls.objects.filter((obj: any) => 
        obj.name.toLowerCase().includes(term) || 
        obj.codes.some((c: any) => c.code_name.toLowerCase().includes(term) || c.alphanumeric_val.toLowerCase().includes(term))
      );
      const classMatches = cls.name.toLowerCase().includes(term);
      return {
        ...cls,
        objects: classMatches && !filteredObjects.length ? cls.objects : filteredObjects,
        matches: classMatches || filteredObjects.length > 0
      };
    }).filter((cls: any) => cls.matches);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 p-4 md:p-8 font-sans selection:bg-fuchsia-500/30 transition-colors duration-300">
      {/* Esferas de luz */}
      <div className="fixed top-[-10%] left-[-10%] w-96 h-96 bg-cyan-300/30 dark:bg-cyan-600/20 rounded-full blur-[100px] md:blur-[120px] pointer-events-none transition-colors duration-500"></div>
      <div className="fixed bottom-[-10%] right-[-5%] w-[30rem] h-[30rem] bg-fuchsia-300/30 dark:bg-fuchsia-600/10 rounded-full blur-[120px] md:blur-[150px] pointer-events-none transition-colors duration-500"></div>

      <div className="relative z-10 max-w-[90rem] mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Lateral */}
        <aside className="w-full md:w-64 lg:w-72 shrink-0 border-r border-slate-200 dark:border-slate-800/50 md:pr-6 transition-colors">
          <header className="mb-10 flex flex-col gap-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-fuchsia-600 dark:from-cyan-400 dark:to-fuchsia-400">
              NexusCOD
            </h1>
            <div className="flex items-center justify-between">
              <div className="text-[10px] bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400 border font-mono px-2 py-1 rounded">
                ESTADO: LÍNEA
              </div>
              <button 
                onClick={() => setIsDark(!isDark)}
                className="p-1.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                title="Cambiar Tema"
              >
                {isDark ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
              </button>
            </div>
          </header>

          <div className="mb-6">
            <h3 className="text-[10px] uppercase font-bold text-slate-500 mb-4 tracking-wider flex justify-between items-center">
              <span>Modos Disponibles</span>
              <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full transition-colors">{modes.length}</span>
            </h3>
            
            <div className="flex flex-col gap-2">
              {modes.map((modo, idx) => (
                <div
                  key={modo.mode_id}
                  onClick={() => setActiveModeIdx(idx)}
                  className={`group flex justify-between items-center px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 cursor-pointer border backdrop-blur-md ${
                    activeModeIdx === idx
                      ? 'bg-white/60 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                      : 'bg-white/30 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400 border-transparent hover:bg-white/50 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <InlineEditable 
                    value={modo.name} 
                    onSave={(newVal) => handleUpdateMode(modo.mode_id, newVal)} 
                    isTitle={activeModeIdx === idx}
                  />
                  {modo.is_default && (
                    <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">PRED</span>
                  )}
                </div>
              ))}
              
              <button 
                onClick={handleCreateMode}
                className="mt-2 text-xs w-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-200 dark:hover:bg-cyan-800/50 py-2 rounded-lg font-medium transition-colors border border-cyan-300 dark:border-cyan-700/50 border-dashed"
              >
                + Nuevo Modo
              </button>

              {modes.length === 0 && (
                <div className="flex flex-col items-start gap-3 mt-4 p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/30 transition-colors">
                  <div className="text-slate-500 text-xs italic">No hay modos disponibles.</div>
                  <button onClick={async () => {
                    await fetch(`${API_URL}/seed`, { method: 'POST' });
                    fetchModes();
                  }} className="text-xs w-full bg-fuchsia-500 hover:bg-fuchsia-600 dark:bg-fuchsia-600/80 dark:hover:bg-fuchsia-500 px-3 py-2 rounded-lg text-white font-medium shadow-[0_0_15px_rgba(217,70,239,0.4)] transition-all">
                    Generar Datos Prueba
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Contenido Principal */}
        <main className="flex-1 min-w-0 pb-20">
          {activeMode && (
            <>
              {/* Barra de Filtro / Búsqueda y Creación */}
              <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-4 rounded-2xl transition-colors">
                <div className="flex-1 w-full relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Filtrar por clase, objeto o código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/60 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm rounded-xl focus:ring-fuchsia-500 focus:border-fuchsia-500 block pl-10 p-2.5 outline-none transition-colors"
                  />
                </div>
                <button 
                  onClick={() => handleCreateClass(activeMode.mode_id)}
                  className="shrink-0 bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 border border-fuchsia-300 dark:border-fuchsia-700/50 hover:bg-fuchsia-200 dark:hover:bg-fuchsia-800/50 px-4 py-2 text-sm rounded-xl font-semibold transition-colors"
                >
                  + Nueva Clase
                </button>
              </div>

              {/* Grid de Clases filtradas */}
              {filteredClasses.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                  {filteredClasses.map((clase: any) => (
                    <div 
                      key={clase.class_id} 
                      className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 md:p-6 shadow-xl transition-all hover:border-slate-300 dark:hover:border-slate-600/80 hover:shadow-cyan-900/10 group"
                    >
                      <div className="flex justify-between items-center mb-5 border-b border-slate-200 dark:border-slate-800 pb-3 transition-colors">
                        <div className="text-xl text-slate-800 dark:text-slate-200 tracking-wide font-medium group-hover:text-cyan-700 dark:group-hover:text-cyan-100 transition-colors">
                          <InlineEditable 
                            value={clase.name} 
                            onSave={(newVal) => handleUpdateClass(clase.class_id, newVal)} 
                            isTitle={true}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 transition-colors">
                            {clase.objects?.length || 0} Obj
                          </span>
                        </div>
                      </div>

                      {/* Lista de Objetos */}
                      <div className="space-y-4">
                        {clase.objects?.map((obj: any) => (
                          <div key={obj.object_id} className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 transition-colors">
                            <div className="flex justify-between items-center mb-3">
                              <p className="text-sm font-semibold text-fuchsia-600 dark:text-fuchsia-400 flex items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 mr-2 shadow-[0_0_5px_rgba(217,70,239,0.8)]"></span>
                                <InlineEditable 
                                  value={obj.name} 
                                  onSave={(newVal) => handleUpdateObject(obj.object_id, newVal)} 
                                />
                              </p>
                              {/* TODO: Add 'Mover a...' dropdown functionality if needed */}
                            </div>
                            
                            <div className="space-y-2">
                              {obj.codes?.map((code: any) => (
                                <div 
                                  key={code.slot} 
                                  className="flex justify-between items-center bg-white dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 px-3 py-2 rounded-lg text-xs font-mono border border-slate-200 dark:border-slate-700/30 transition-colors group/code"
                                >
                                  <div className="flex gap-2 items-center flex-1 overflow-hidden mr-2">
                                    <span className="text-slate-500 dark:text-slate-400 select-none">
                                      <InlineEditable 
                                        value={code.code_name} 
                                        onSave={(val) => handleUpdateCode(obj.object_id, code.slot, val, code.alphanumeric_val)} 
                                      />
                                      -
                                    </span>
                                    <span className="text-cyan-700 dark:text-cyan-200 truncate font-semibold">
                                      <InlineEditable 
                                        value={code.alphanumeric_val} 
                                        onSave={(val) => handleUpdateCode(obj.object_id, code.slot, code.code_name, val)} 
                                      />
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleCopy(code.full_code)}
                                    className={`shrink-0 font-sans text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded transition-all duration-300 ${
                                      copiedCode === code.full_code
                                        ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30 border'
                                        : 'bg-cyan-50 text-cyan-600 border border-cyan-200 hover:bg-cyan-100 dark:bg-cyan-950/50 dark:text-cyan-500 dark:border-cyan-900/50 dark:hover:bg-cyan-900/80 dark:hover:text-cyan-300 opacity-0 group-hover/code:opacity-100 focus:opacity-100'
                                    }`}
                                  >
                                    {copiedCode === code.full_code ? 'COPIADO' : 'COPIAR'}
                                  </button>
                                </div>
                              ))}
                              
                              {(!obj.codes || obj.codes.length < 5) && (
                                <button 
                                  onClick={() => handleAddCode(obj.object_id, obj.codes?.length || 0)}
                                  className="w-full text-[10px] uppercase font-bold tracking-wider py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                  + Añadir Código ({obj.codes?.length || 0}/5)
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        <button 
                          onClick={() => handleCreateObject(clase.class_id)}
                          className="w-full flex items-center justify-center gap-2 text-xs font-semibold py-3 rounded-xl border border-dashed border-cyan-300 dark:border-cyan-800 text-cyan-600 dark:text-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-colors"
                        >
                          + Nuevo Objeto
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-slate-500 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-white/40 dark:bg-slate-900/20 transition-colors">
                   <svg className="w-12 h-12 mb-4 text-slate-400 dark:text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                   <p>No se encontraron resultados para "{searchTerm}"</p>
                </div>
              )}
            </>
          )}
        </main>

      </div>
    </div>
  );
}
