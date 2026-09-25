import { useState, useRef } from 'react';
import { ShieldCheck, Download, Upload, Copy, Check, FileCode, FileSpreadsheet, X, AlertTriangle, RefreshCw } from 'lucide-react';
import type { IModo } from '../types';

interface DataVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  modes: IModo[];
  onImportSuccess: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  apiBase: string;
}

export default function DataVaultModal({
  isOpen,
  onClose,
  modes,
  onImportSuccess,
  onShowToast,
  apiBase,
}: DataVaultModalProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [importText, setImportText] = useState('');
  const [importPreview, setImportPreview] = useState<{ modesCount: number; weaponsCount: number; codesCount: number } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Generate JSON Export Content
  const generateJsonExport = () => {
    return JSON.stringify(modes, null, 2);
  };

  // Generate CSV Export Content
  const generateCsvExport = () => {
    const rows = [['Modo', 'Submodo', 'Clase', 'Arma', 'Posicion', 'Codigo', 'Calificacion']];
    modes.forEach(m => {
      m.submodos?.forEach(sm => {
        sm.clases?.forEach(cl => {
          cl.objetos?.forEach(obj => {
            if (obj.codigos && obj.codigos.length > 0) {
              obj.codigos.forEach(cd => {
                rows.push([
                  `"${m.nombre}"`,
                  `"${sm.nombre}"`,
                  `"${cl.nombre}"`,
                  `"${obj.nombre}"`,
                  String(obj.posicion || 1),
                  `"${cd.codigo}"`,
                  String(cd.calificacion || 0)
                ]);
              });
            } else {
              rows.push([
                `"${m.nombre}"`,
                `"${sm.nombre}"`,
                `"${cl.nombre}"`,
                `"${obj.nombre}"`,
                String(obj.posicion || 1),
                '""',
                '0'
              ]);
            }
          });
        });
      });
    });
    return rows.map(r => r.join(',')).join('\n');
  };

  const handleDownload = () => {
    const filename = `nexuscod_vault_${new Date().toISOString().slice(0, 10)}.${exportFormat}`;
    const content = exportFormat === 'json' ? generateJsonExport() : generateCsvExport();
    const mime = exportFormat === 'json' ? 'application/json' : 'text/csv;charset=utf-8;';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast(`Bóveda exportada como ${exportFormat.toUpperCase()}`);
  };

  const handleCopyClipboard = async () => {
    const content = exportFormat === 'json' ? generateJsonExport() : generateCsvExport();
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShowToast('Datos copiados al portapapeles');
  };

  const parseAndValidateImport = (rawText: string) => {
    setImportError(null);
    setImportPreview(null);
    if (!rawText.trim()) return;

    try {
      const parsed = JSON.parse(rawText);
      const dataArray = Array.isArray(parsed) ? parsed : (parsed.data || [parsed]);
      
      let weapons = 0;
      let codes = 0;
      dataArray.forEach((m: any) => {
        m.submodos?.forEach((sm: any) => {
          sm.clases?.forEach((cl: any) => {
            cl.objetos?.forEach((obj: any) => {
              weapons++;
              codes += obj.codigos?.length || 0;
            });
          });
        });
      });

      setImportPreview({
        modesCount: dataArray.length,
        weaponsCount: weapons,
        codesCount: codes,
      });
    } catch (err: any) {
      setImportError('Formato JSON inválido: Verifica la sintaxis o estructura.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
      parseAndValidateImport(content);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (!importText.trim()) return;
    setIsProcessing(true);
    try {
      const parsed = JSON.parse(importText);
      const payload = Array.isArray(parsed) ? parsed : (parsed.data || [parsed]);

      const res = await fetch(`${apiBase}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Error al procesar en el servidor');
      }

      onShowToast('¡Importación completada con éxito!', 'success');
      onImportSuccess();
      onClose();
    } catch (err: any) {
      setImportError(err.message || 'Error al importar datos');
      onShowToast('Fallo al importar datos', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Header Clean SaaS */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Bóveda y Gestión de Datos
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  JSON / CSV
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">Exporta e importa tus loadouts, clases e inventarios</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center border-b border-slate-200 bg-white px-6 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'export'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Exportar Datos</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'import'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Importar Datos</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'export' ? (
            <div className="space-y-5">
              {/* Format selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Formato de Salida
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setExportFormat('json')}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                      exportFormat === 'json'
                        ? 'bg-blue-50/70 border-blue-500 text-blue-900 ring-2 ring-blue-100 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                      <FileCode className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold font-mono">JSON Completo</div>
                      <div className="text-[11px] text-slate-500 font-medium">Estructura jerárquica con metadatos</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setExportFormat('csv')}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                      exportFormat === 'csv'
                        ? 'bg-blue-50/70 border-blue-500 text-blue-900 ring-2 ring-blue-100 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold font-mono">CSV Tabular</div>
                      <div className="text-[11px] text-slate-500 font-medium">Compatible con Excel / Google Sheets</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Data Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Vista Previa del Archivo
                  </label>
                  <span className="text-[11px] font-mono text-slate-500">
                    {modes.length} Modos • {exportFormat.toUpperCase()}
                  </span>
                </div>
                <div className="relative">
                  <pre className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 max-h-48 overflow-y-auto select-all leading-relaxed">
                    {exportFormat === 'json' ? generateJsonExport() : generateCsvExport()}
                  </pre>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={handleCopyClipboard}
                  className="btn-press w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 border border-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors touch-manipulation"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? '¡Copiado al Portapapeles!' : 'Copiar al Portapapeles'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="btn-press w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors touch-manipulation"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Archivo</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* File Upload Zone */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-6 min-h-[90px] rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/40 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group touch-manipulation"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 group-hover:bg-blue-200 text-blue-700 flex items-center justify-center transition-colors">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                      Cargar Archivo JSON o CSV
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Haz clic para buscar en tus archivos</p>
                  </div>
                </button>
              </div>

              {/* Paste JSON text area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  O Pega el Contenido JSON Directamente
                </label>
                <textarea
                  rows={6}
                  value={importText}
                  onChange={(e) => {
                    setImportText(e.target.value);
                    parseAndValidateImport(e.target.value);
                  }}
                  placeholder='[ { "codigo": "MJ", "nombre": "Multijugador", "submodos": [...] } ]'
                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-base sm:text-xs font-mono text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
                />
              </div>

              {/* Validation Feedback & Preview */}
              {importError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{importError}</span>
                </div>
              )}

              {importPreview && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                  <div className="text-xs font-bold flex items-center gap-2 text-emerald-800">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Estructura válida detectada para importación</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
                    <div className="bg-white p-2 rounded-lg border border-emerald-200 shadow-xs">
                      <div className="text-lg font-bold text-slate-900">{importPreview.modesCount}</div>
                      <div className="text-[10px] text-slate-500 font-sans">Modos</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-emerald-200 shadow-xs">
                      <div className="text-lg font-bold text-blue-600">{importPreview.weaponsCount}</div>
                      <div className="text-[10px] text-slate-500 font-sans">Armas</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-emerald-200 shadow-xs">
                      <div className="text-lg font-bold text-emerald-700">{importPreview.codesCount}</div>
                      <div className="text-[10px] text-slate-500 font-sans">Códigos</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Commit Button */}
              <button
                onClick={handleExecuteImport}
                disabled={!importPreview || isProcessing}
                className="btn-press w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Procesando Importación...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Confirmar e Importar a Base de Datos</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
