import { useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Database, 
  Layers, 
  Crosshair, 
  Hash, 
  Plus, 
  Trash2, 
  FolderPlus, 
  Star,
  Maximize2,
  Minimize2
} from 'lucide-react';
import type { IModo } from '../types';
import InlineEditable from './InlineEditable';
import QuickCopyButton from './QuickCopyButton';

interface HierarchyTreeProps {
  modes: IModo[];
  onUpdateModeName: (id: number, name: string) => void;
  onUpdateSubmodeName: (id: number, name: string) => void;
  onUpdateClassName: (id: number, name: string) => void;
  onUpdateWeaponName: (id: number, name: string) => void;
  onUpdateCode: (codeId: number, code: string) => void;
  onDeleteMode: (id: number) => void;
  onDeleteSubmode: (id: number) => void;
  onDeleteClass: (id: number) => void;
  onDeleteWeapon: (id: number) => void;
  onDeleteCode: (codeId: number) => void;
  onCreateSubmode: (modeId: number) => void;
  onCreateClass: (submodeId: number) => void;
  onCreateWeapon: (classId: number) => void;
  onCreateCode: (weaponId: number) => void;
  onUpdateRating: (codeId: number, rating: number) => void;
}

export default function HierarchyTree({
  modes,
  onUpdateModeName,
  onUpdateSubmodeName,
  onUpdateClassName,
  onUpdateWeaponName,
  onUpdateCode,
  onDeleteMode,
  onDeleteSubmode,
  onDeleteClass,
  onDeleteWeapon,
  onDeleteCode,
  onCreateSubmode,
  onCreateClass,
  onCreateWeapon,
  onCreateCode,
  onUpdateRating,
}: HierarchyTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'mode-1': true,
    'submode-1': true,
    'submode-2': true,
  });

  const toggleNode = (nodeKey: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeKey]: !prev[nodeKey] }));
  };

  const expandAll = () => {
    const allKeys: Record<string, boolean> = {};
    modes.forEach(m => {
      allKeys[`mode-${m.id}`] = true;
      m.submodos?.forEach(sm => {
        allKeys[`submode-${sm.id}`] = true;
        sm.clases?.forEach(cl => {
          allKeys[`class-${cl.id}`] = true;
          cl.objetos?.forEach(obj => {
            allKeys[`weapon-${obj.id}`] = true;
          });
        });
      });
    });
    setExpandedNodes(allKeys);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Explorador de Jerarquía de Loadouts
            </h2>
            <p className="text-[11px] font-medium text-slate-500">
              Modos &gt; Submodos &gt; Clases &gt; Armas &gt; Códigos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="btn-press px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors border border-slate-200"
            title="Expandir todos los nodos"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Expandir Todo</span>
          </button>
          <button
            onClick={collapseAll}
            className="btn-press px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors border border-slate-200"
            title="Colapsar todos los nodos"
          >
            <Minimize2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Colapsar Todo</span>
          </button>
        </div>
      </div>

      {/* Tree Nodes */}
      <div className="space-y-3">
        {modes.map((mode) => {
          const modeKey = `mode-${mode.id}`;
          const isModeExpanded = expandedNodes[modeKey] ?? false;

          return (
            <div key={mode.id} className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden transition-all">
              
              {/* Level 1: Modo */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50/80 border-b border-slate-200 hover:bg-slate-100/70 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    onClick={() => toggleNode(modeKey)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                  >
                    {isModeExpanded ? <ChevronDown className="w-4 h-4 text-blue-600" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                  </button>
                  <div className="w-7 h-7 rounded-lg bg-blue-100/70 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs font-mono">
                    {mode.codigo || 'MD'}
                  </div>
                  <div className="text-sm font-bold text-slate-900 truncate">
                    <InlineEditable
                      value={mode.nombre}
                      onSave={(newName) => onUpdateModeName(mode.id, newName)}
                      isTitle={true}
                    />
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-600 border border-slate-300/60">
                    {mode.submodos?.length || 0} Submodos
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onCreateSubmode(mode.id)}
                    className="btn-press px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1 transition-colors"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>+ Submodo</span>
                  </button>
                  <button
                    onClick={() => onDeleteMode(mode.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Eliminar modo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Level 2: Submodos */}
              {isModeExpanded && (
                <div className="p-3 sm:pl-6 space-y-3 bg-slate-50/40">
                  {mode.submodos && mode.submodos.length > 0 ? (
                    mode.submodos.map((submode) => {
                      const submodeKey = `submode-${submode.id}`;
                      const isSubmodeExpanded = expandedNodes[submodeKey] ?? false;

                      return (
                        <div key={submode.id} className="rounded-lg bg-white border border-slate-200 shadow-xs overflow-hidden">
                          
                          {/* Submode Header */}
                          <div className="flex items-center justify-between p-3 bg-slate-50/50 border-b border-slate-200">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <button
                                onClick={() => toggleNode(submodeKey)}
                                className="p-1 rounded text-slate-400 hover:text-slate-700"
                              >
                                {isSubmodeExpanded ? <ChevronDown className="w-3.5 h-3.5 text-blue-600" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                              </button>
                              <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-xs">
                                <Database className="w-3.5 h-3.5" />
                              </div>
                              <div className="text-xs font-bold text-slate-800">
                                <InlineEditable
                                  value={submode.nombre}
                                  onSave={(newName) => onUpdateSubmodeName(submode.id, newName)}
                                />
                              </div>
                              {submode.es_predeterminado && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                  GLOBAL
                                </span>
                              )}
                              <span className="text-[11px] font-medium text-slate-500">
                                ({submode.clases?.length || 0} clases)
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onCreateClass(submode.id)}
                                className="btn-press px-2 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                                <span>+ Clase</span>
                              </button>
                              <button
                                onClick={() => onDeleteSubmode(submode.id)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Eliminar submodo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Level 3: Clases */}
                          {isSubmodeExpanded && (
                            <div className="p-3 sm:pl-6 space-y-2.5 bg-slate-50/20">
                              {submode.clases && submode.clases.length > 0 ? (
                                submode.clases.map((clase) => {
                                  const classKey = `class-${clase.id}`;
                                  const isClassExpanded = expandedNodes[classKey] ?? false;

                                  return (
                                    <div key={clase.id} className="rounded-lg bg-white border border-slate-200 overflow-hidden">
                                      
                                      {/* Class Header */}
                                      <div className="flex items-center justify-between p-2.5 bg-slate-50/40 hover:bg-slate-100/50 transition-colors">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                          <button
                                            onClick={() => toggleNode(classKey)}
                                            className="p-1 rounded text-slate-400 hover:text-slate-700"
                                          >
                                            {isClassExpanded ? <ChevronDown className="w-3 h-3 text-blue-600" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                                          </button>
                                          <Layers className="w-3.5 h-3.5 text-blue-600" />
                                          <span className="text-xs font-semibold text-slate-800">
                                            <InlineEditable
                                              value={clase.nombre}
                                              onSave={(newName) => onUpdateClassName(clase.id, newName)}
                                            />
                                          </span>
                                          <span className="text-[11px] font-medium text-slate-500">
                                            ({clase.objetos?.length || 0} armas)
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                          <button
                                            onClick={() => onCreateWeapon(clase.id)}
                                            className="btn-press px-2 py-0.5 text-xs font-semibold rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                                          >
                                            + Arma
                                          </button>
                                          <button
                                            onClick={() => onDeleteClass(clase.id)}
                                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>

                                      {/* Level 4: Objetos / Armas */}
                                      {isClassExpanded && (
                                        <div className="p-2.5 sm:pl-6 space-y-2 border-t border-slate-100 bg-slate-50/20">
                                          {clase.objetos && clase.objetos.length > 0 ? (
                                            clase.objetos.map((obj) => {
                                              const weaponKey = `weapon-${obj.id}`;
                                              const isWeaponExpanded = expandedNodes[weaponKey] ?? true;

                                              return (
                                                <div key={obj.id} className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-2">
                                                  <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                      <button
                                                        onClick={() => toggleNode(weaponKey)}
                                                        className="p-0.5 text-slate-400 hover:text-slate-600"
                                                      >
                                                        {isWeaponExpanded ? <ChevronDown className="w-3 h-3 text-blue-600" /> : <ChevronRight className="w-3 h-3" />}
                                                      </button>
                                                      <Crosshair className="w-3.5 h-3.5 text-blue-600" />
                                                      <span className="text-xs font-bold text-slate-900 tracking-tight">
                                                        <InlineEditable
                                                          value={obj.nombre}
                                                          onSave={(newName) => onUpdateWeaponName(obj.id, newName)}
                                                        />
                                                      </span>
                                                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                                        Slot #{obj.posicion || 1}
                                                      </span>
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                      <button
                                                        onClick={() => onCreateCode(obj.id)}
                                                        className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                                                      >
                                                        + Código
                                                      </button>
                                                      <button
                                                        onClick={() => onDeleteWeapon(obj.id)}
                                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                                      >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                      </button>
                                                    </div>
                                                  </div>

                                                  {/* Level 5: Códigos */}
                                                  {isWeaponExpanded && (
                                                    <div className="pl-5 space-y-1.5 pt-1">
                                                      {obj.codigos && obj.codigos.length > 0 ? (
                                                        obj.codigos.map((cd) => (
                                                          <div
                                                            key={cd.id}
                                                            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono"
                                                          >
                                                            <div className="flex items-center gap-2">
                                                              <Hash className="w-3 h-3 text-blue-600" />
                                                              <span className="text-slate-900 font-bold">
                                                                <InlineEditable
                                                                  value={cd.codigo}
                                                                  onSave={(newCode) => onUpdateCode(cd.id, newCode)}
                                                                />
                                                             </span>
                                                              <QuickCopyButton textToCopy={cd.codigo} size="sm" />
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                              <div className="flex items-center gap-0.5 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                  <button
                                                                    key={star}
                                                                    onClick={() => onUpdateRating(cd.id, star)}
                                                                    className="focus:outline-none transition-transform hover:scale-110"
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
                                                              <button
                                                                onClick={() => onDeleteCode(cd.id)}
                                                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                                              >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                              </button>
                                                            </div>
                                                          </div>
                                                        ))
                                                      ) : (
                                                        <div className="text-[11px] text-slate-400 italic">
                                                          Sin códigos registrados
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })
                                          ) : (
                                            <div className="p-2 text-[11px] text-slate-400 italic">
                                              No hay armas en esta clase
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="p-3 text-xs text-slate-400 italic">
                                  No hay clases configuradas en este submodo
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-xs text-slate-400 italic">
                      No hay submodos configurados en este modo
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
