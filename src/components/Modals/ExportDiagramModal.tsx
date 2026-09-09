import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Download,
  FileImage,
  FileText,
  FolderOpen,
  Info,
  Loader2,
  Moon,
  Palette,
  Sparkles,
  Sun,
  TableProperties,
  X,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import {
  renderMollierToCanvas,
  generateMollierPdf,
  saveFileWithPicker,
} from '../../utils/exportDiagram';
import { DiagramTransform } from '../../engine/transform/DiagramTransform';

export const ExportDiagramModal: React.FC = () => {
  const {
    isExportModalOpen,
    setIsExportModalOpen,
    projectName,
    selectedFluidId,
    selectedFluidItem,
    fluidInfo,
    dataset,
    curveVisibility,
    points,
    connections,
    diagramTheme,
    showToast,
  } = useProject();

  const [format, setFormat] = useState<'png' | 'pdf'>('pdf');
  const [exportTheme, setExportTheme] = useState<'danfoss' | 'dark'>(
    diagramTheme === 'dark' ? 'dark' : 'danfoss'
  );
  const [filename, setFilename] = useState<string>('');
  const [includeTable, setIncludeTable] = useState<boolean>(true);
  const [qualityScale, setQualityScale] = useState<number>(2); // 2x or 3x
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [saveSuccessName, setSaveSuccessName] = useState<string | null>(null);

  // Sync initial filename with project name and refrigerant
  useEffect(() => {
    if (isExportModalOpen) {
      const sanitizedProject = projectName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      const sanitizedFluid = selectedFluidId.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const baseName = `${sanitizedProject || 'ciclo'}_${sanitizedFluid}_mollier`;
      setFilename(baseName);
      setSaveSuccessName(null);
      setExportTheme(diagramTheme === 'dark' ? 'dark' : 'danfoss');
    }
  }, [isExportModalOpen, projectName, selectedFluidId, diagramTheme]);

  if (!isExportModalOpen) return null;

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const targetFilename = filename.trim() || `mollier_${selectedFluidId.toLowerCase()}`;
      const fluidDisplayName = selectedFluidItem?.display_name || selectedFluidId;

      // Prepare transform for export canvas
      const exportWidth = 1200;
      const exportHeight = 800;
      const exportMargin = { top: 40, right: 70, bottom: 50, left: 70 };
      const viewportRect = {
        left: exportMargin.left,
        top: exportMargin.top,
        width: exportWidth - exportMargin.left - exportMargin.right,
        height: exportHeight - exportMargin.top - exportMargin.bottom,
      };

      const exportTransform = dataset
        ? DiagramTransform.fromDomain(viewportRect, dataset.domain)
        : new DiagramTransform(viewportRect, {
            hMinJkg: 100000,
            hMaxJkg: 650000,
            pMinPa: 10000,
            pMaxPa: 5000000,
          });

      // Render offscreen canvas
      const canvas = renderMollierToCanvas({
        width: exportWidth,
        height: exportHeight,
        scale: qualityScale,
        theme: exportTheme,
        dataset,
        transform: exportTransform,
        visibility: curveVisibility,
        points,
        connections,
        fluidName: fluidDisplayName,
        fluidInfo,
      });

      let blob: Blob;

      if (format === 'pdf') {
        const doc = generateMollierPdf(
          canvas,
          projectName,
          fluidDisplayName,
          points,
          includeTable
        );
        blob = doc.output('blob');
      } else {
        blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => {
              if (b) resolve(b);
              else reject(new Error('No se pudo generar el archivo de imagen'));
            },
            'image/png',
            1.0
          );
        });
      }

      // Invoke native "Guardar como..." dialog
      const saveResult = await saveFileWithPicker(blob, targetFilename, format);

      if (saveResult.success) {
        setSaveSuccessName(saveResult.filename);
        showToast(`✅ Diagrama guardado correctamente como: ${saveResult.filename}`);
        // Close modal after brief success presentation
        setTimeout(() => {
          setIsExportModalOpen(false);
        }, 1200);
      } else if (saveResult.cancelled) {
        // User cancelled picker dialog, do nothing
      } else if (saveResult.error) {
        showToast(`❌ Error al guardar archivo: ${saveResult.error}`);
      }
    } catch (err: unknown) {
      console.error('Error during diagram export:', err);
      showToast(`❌ Error al exportar: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
      onClick={() => !isExporting && setIsExportModalOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-[#16181f] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#111319] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-500/10 border border-sky-300 dark:border-sky-500/30 flex items-center justify-center shadow-xs">
              <Download size={16} className="text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Guardar Diagrama de Mollier</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  {selectedFluidItem?.display_name || selectedFluidId}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Seleccione el formato, nombre y carpeta de destino ("Guardar como")
              </div>
            </div>
          </div>

          <button
            disabled={isExporting}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            onClick={() => setIsExportModalOpen(false)}
            title="Cerrar modal"
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-4.5 max-h-[75vh] overflow-y-auto">
          {/* Format Selector: PDF vs PNG */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
              Formato de Archivo
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* PDF Option */}
              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer relative ${
                  format === 'pdf'
                    ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/30 ring-1 ring-sky-500/50 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-[#1a1d24]/60'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                    format === 'pdf'
                      ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                      : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      Documento PDF
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                      .pdf
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Informe técnico apaisado A4, con encabezado formal y tabla de estados termodinámicos.
                  </p>
                </div>
              </button>

              {/* PNG Option */}
              <button
                type="button"
                onClick={() => setFormat('png')}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer relative ${
                  format === 'png'
                    ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/30 ring-1 ring-sky-500/50 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-[#1a1d24]/60'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                    format === 'png'
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <FileImage size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      Imagen PNG
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      .png
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Imagen rasterizada en ultra-alta resolución (2x/3x) para documentos e informes.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Filename Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Nombre del Archivo
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                Se guardará como: <strong className="text-slate-600 dark:text-slate-300">{filename || 'sin_nombre'}.{format}</strong>
              </span>
            </div>

            <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#12141a] focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500 overflow-hidden transition-all shadow-2xs">
              <span className="pl-3.5 pr-2 text-slate-400">
                <FolderOpen size={14} />
              </span>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Nombre para el archivo..."
                className="flex-1 py-2 bg-transparent text-xs font-mono font-medium text-slate-900 dark:text-white outline-none"
              />
              <span className="pr-3.5 pl-2 text-xs font-mono font-bold text-slate-500 dark:text-slate-400 select-none">
                .{format}
              </span>
            </div>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200/80 dark:border-slate-800/80">
            {/* Diagram Theme Option */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#181b22] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Palette size={13} className="text-sky-500" />
                  Estilo de Fondo
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setExportTheme('danfoss')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border font-medium transition-all cursor-pointer ${
                    exportTheme === 'danfoss'
                      ? 'bg-white text-slate-900 border-slate-300 shadow-2xs font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Sun size={12} className="text-amber-500" />
                  <span>Claro (Danfoss)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExportTheme('dark')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border font-medium transition-all cursor-pointer ${
                    exportTheme === 'dark'
                      ? 'bg-[#121419] text-white border-slate-700 shadow-2xs font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Moon size={12} className="text-sky-400" />
                  <span>Oscuro</span>
                </button>
              </div>
            </div>

            {/* Scale / DPI resolution */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#181b22] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-500" />
                  Nitidez / Escala
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {qualityScale === 3 ? '300 DPI (Ultra HD)' : '150 DPI (Retina HD)'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setQualityScale(2)}
                  className={`flex items-center justify-center py-1.5 px-2 rounded-lg border font-medium transition-all cursor-pointer ${
                    qualityScale === 2
                      ? 'bg-sky-600 text-white border-sky-600 shadow-2xs font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  2x (Estándar)
                </button>
                <button
                  type="button"
                  onClick={() => setQualityScale(3)}
                  className={`flex items-center justify-center py-1.5 px-2 rounded-lg border font-medium transition-all cursor-pointer ${
                    qualityScale === 3
                      ? 'bg-sky-600 text-white border-sky-600 shadow-2xs font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  3x (Ultra HD)
                </button>
              </div>
            </div>
          </div>

          {/* Include Table Toggle (Specifically for PDF) */}
          {format === 'pdf' && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-[#181b22] border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <TableProperties size={14} className="text-sky-500" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Incluir tabla de estados termodinámicos en el PDF
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {points.length} {points.length === 1 ? 'punto' : 'puntos'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTable}
                  onChange={(e) => setIncludeTable(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-sky-600"></div>
              </label>
            </div>
          )}

          {/* Success Banner Alert */}
          {saveSuccessName && (
            <div className="flex items-center gap-2.5 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs animate-in fade-in">
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="flex-1">
                <strong>¡Guardado correctamente!</strong> Archivo: <span className="font-mono">{saveSuccessName}</span>
              </div>
            </div>
          )}

          {/* Info Notice */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/70 dark:border-sky-900/40 text-[11px] text-sky-800 dark:text-sky-300">
            <Info size={13} className="shrink-0 text-sky-600 dark:text-sky-400" />
            <span>
              Al hacer clic en <strong>"Guardar como..."</strong>, el sistema abrirá la ventana de tu equipo para seleccionar la carpeta exacta donde deseas guardarlo.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#111319] flex items-center justify-between">
          <button
            type="button"
            disabled={isExporting}
            className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            onClick={() => setIsExportModalOpen(false)}
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
          >
            {isExporting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Generando {format.toUpperCase()}...</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>Guardar como... (Descargar)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
