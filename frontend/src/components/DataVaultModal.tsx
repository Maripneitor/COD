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
      // Try JSON parsing
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl glass-panel-glow border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Terminal Style */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-tactical uppercase tracking-wider font-bold text-white flex items-center gap-2">
                Bóveda de Datos Táctica
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  SEGURO
                </span>
              </h2>
              <p className="text-xs text-slate-400">Importación y exportación de loadouts e inventarios</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/60 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-3 px-4 text-xs font-tactical uppercase tracking-wider font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'export'
                ? 'border-cyan-400 text-cyan-300 shadow-[0_2px_10px_rgba(6,182,212,0.2)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Exportar Datos</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`pb-3 px-4 text-xs font-tactical uppercase tracking-wider font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'import'
                ? 'border-fuchsia-400 text-fuchsia-300 shadow-[0_2px_10px_rgba(217,70,239,0.2)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Importar Datos</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'export' ? (
            <div className="space-y-6">
              {/* Format selection */}
              <div>
                <label className="block text-xs font-tactical uppercase tracking-wider font-bold text-slate-300 mb-2">
                  Formato de Salida
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setExportFormat('json')}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                      exportFormat === 'json'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <FileCode className="w-5 h-5 text-cyan-400" />
                    <div className="text-left">
                      <div className="text-xs font-bold font-mono">JSON Completo</div>
                      <div className="text-[11px] text-slate-500">Jerarquía íntegra con metadatos</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setExportFormat('csv')}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                      exportFormat === 'csv'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
                    <div className="text-left">
                      <div className="text-xs font-bold font-mono">CSV Tabular</div>
                      <div className="text-[11px] text-slate-500">Para Excel / Google Sheets</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Data Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-tactical uppercase tracking-wider font-bold text-slate-300">
                    Vista Previa del Archivo
                  </label>
                  <span className="text-[11px] font-mono text-slate-500">
                    {modes.length} Modos • {exportFormat.toUpperCase()}
                  </span>
                </div>
                <div className="relative">
                  <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300/80 max-h-48 overflow-y-auto select-all">
                    {exportFormat === 'json' ? generateJsonExport() : generateCsvExport()}
                  </pre>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={handleCopyClipboard}
                  className="btn-press w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-tactical uppercase tracking-wider font-bold flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? '¡Copiado!' : 'Copiar al Portapapeles'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="btn-press w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-tactical uppercase tracking-wider font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Archivo</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
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
                  className="w-full p-6 rounded-2xl border-2 border-dashed border-slate-700 hover:border-fuchsia-500/60 bg-slate-900/30 hover:bg-fuchsia-950/10 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-fuchsia-900/40 text-slate-400 group-hover:text-fuchsia-300 flex items-center justify-center transition-colors">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-fuchsia-300 font-tactical uppercase tracking-wider">
                      Cargar Archivo JSON / CSV
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Haz clic para seleccionar o arrastra aquí</p>
                  </div>
                </button>
              </div>

              {/* Paste JSON text area */}
              <div>
                <label className="block text-xs font-tactical uppercase tracking-wider font-bold text-slate-300 mb-2">
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
                  className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 placeholder-slate-600 outline-none focus:border-fuchsia-500/60 focus:ring-1 focus:ring-fuchsia-500/30"
                />
              </div>

              {/* Validation Feedback & Preview */}
              {importError && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{importError}</span>
                </div>
              )}

              {importPreview && (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 space-y-2">
                  <div className="text-xs font-tactical uppercase tracking-wider font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Datos Detectados Listos para Ingesta</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                      <div className="text-lg font-bold text-white">{importPreview.modesCount}</div>
                      <div className="text-[10px] text-slate-400">Modos</div>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                      <div className="text-lg font-bold text-cyan-300">{importPreview.weaponsCount}</div>
                      <div className="text-[10px] text-slate-400">Armas</div>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                      <div className="text-lg font-bold text-fuchsia-300">{importPreview.codesCount}</div>
                      <div className="text-[10px] text-slate-400">Códigos</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Commit Button */}
              <button
                onClick={handleExecuteImport}
                disabled={!importPreview || isProcessing}
                className="btn-press w-full py-3 px-4 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-40 disabled:pointer-events-none text-white font-tactical uppercase tracking-wider font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(217,70,239,0.4)] transition-all"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Procesando Ingesta...</span>
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
