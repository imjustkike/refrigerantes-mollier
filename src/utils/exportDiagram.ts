import jsPDF from 'jspdf';
import { DiagramPoint, FluidInfo } from '../types/thermo';
import { FullDiagramDataset, Units } from '../engine/types/thermoContract';
import { DiagramTransform } from '../engine/transform/DiagramTransform';
import { CurveVisibilityConfig, DiagramConnection } from '../types/thermo';

export interface ExportDiagramOptions {
  format: 'png' | 'pdf';
  filename: string;
  theme: 'danfoss' | 'dark';
  includeTable?: boolean;
  scale?: number; // 1, 2, 3
}

export interface RenderDiagramCanvasParams {
  width: number;
  height: number;
  scale?: number;
  theme: 'danfoss' | 'dark';
  dataset: FullDiagramDataset | null;
  transform: DiagramTransform;
  visibility: CurveVisibilityConfig;
  points: DiagramPoint[];
  connections: DiagramConnection[];
  fluidName: string;
  fluidInfo?: FluidInfo | null;
}

/**
 * Renders the Mollier diagram onto an offscreen HTML5 Canvas with crisp DPI.
 */
export function renderMollierToCanvas(params: RenderDiagramCanvasParams): HTMLCanvasElement {
  const {
    width,
    height,
    scale = 2,
    theme,
    dataset,
    transform,
    visibility,
    points,
    connections,
    fluidName,
  } = params;

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo inicializar el contexto 2D del Canvas');

  ctx.scale(scale, scale);

  const isDanf = theme === 'danfoss';
  const margin = { top: 40, right: 70, bottom: 50, left: 70 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // 1. Background Fill
  ctx.fillStyle = isDanf ? '#ffffff' : '#0a0d14';
  ctx.fillRect(0, 0, width, height);

  // 2. Technical Header
  ctx.fillStyle = isDanf ? '#0f172a' : '#f8fafc';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`DIAGRAMA MOLLIER log(p)–h : ${fluidName.toUpperCase()}`, margin.left, 24);

  ctx.fillStyle = isDanf ? '#64748b' : '#94a3b8';
  ctx.font = '11px "SF Mono", Menlo, Consolas, monospace';
  const dateStr = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const subHeader = `CoolProp v8.0 • bar(a), kJ/kg, °C, m³/kg • ${dateStr}`;
  const subHeaderWidth = ctx.measureText(subHeader).width;
  ctx.fillText(subHeader, width - margin.right - subHeaderWidth, 24);

  // 3. Grid Lines & Plot Interior
  ctx.save();
  ctx.beginPath();
  ctx.rect(margin.left, margin.top, plotWidth, plotHeight);
  ctx.clip();

  // Draw Dome Fill
  if (dataset && visibility.saturation) {
    ctx.fillStyle = isDanf ? 'rgba(2, 132, 199, 0.05)' : 'rgba(56, 189, 248, 0.07)';
    ctx.beginPath();
    // Liquid branch
    dataset.saturationLiquid.segments.forEach((seg) => {
      seg.forEach((pt, i) => {
        const { x, y } = transform.projectPoint(pt);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
    });
    // Vapor branch in reverse
    const vaporSegs = [...dataset.saturationVapor.segments].reverse();
    vaporSegs.forEach((seg) => {
      const rev = [...seg].reverse();
      rev.forEach((pt) => {
        const { x, y } = transform.projectPoint(pt);
        ctx.lineTo(x, y);
      });
    });
    ctx.closePath();
    ctx.fill();
  }

  // Draw Quality lines (x = const)
  if (dataset && visibility.qualityLines) {
    ctx.strokeStyle = isDanf ? '#059669' : '#10b981';
    ctx.lineWidth = 1.0;
    ctx.setLineDash([3, 3]);
    for (const q of dataset.qualityLines) {
      ctx.beginPath();
      q.segments.forEach((seg) => {
        seg.forEach((pt, i) => {
          const { x, y } = transform.projectPoint(pt);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
      });
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // Draw Isochores (v = const)
  if (dataset && visibility.isochores) {
    ctx.strokeStyle = isDanf ? '#7c3aed' : '#a855f7';
    ctx.lineWidth = 1.0;
    ctx.setLineDash([4, 3]);
    for (const iso of dataset.isochores) {
      ctx.beginPath();
      iso.segments.forEach((seg) => {
        seg.forEach((pt, i) => {
          const { x, y } = transform.projectPoint(pt);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
      });
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // Draw Isentropes (s = const)
  if (dataset && visibility.isentropics) {
    ctx.strokeStyle = isDanf ? '#0284c7' : '#06b6d4';
    ctx.lineWidth = 1.1;
    ctx.setLineDash([4, 3]);
    for (const isen of dataset.isentropes) {
      ctx.beginPath();
      isen.segments.forEach((seg) => {
        seg.forEach((pt, i) => {
          const { x, y } = transform.projectPoint(pt);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
      });
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // Draw Isotherms (T = const)
  if (dataset && visibility.isotherms) {
    ctx.strokeStyle = isDanf ? '#dc2626' : '#ef4444';
    ctx.lineWidth = 1.2;
    for (const iso of dataset.isotherms) {
      ctx.beginPath();
      iso.segments.forEach((seg) => {
        seg.forEach((pt, i) => {
          const { x, y } = transform.projectPoint(pt);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
      });
      ctx.stroke();
    }
  }

  // Draw Saturation Curves (Liquid & Vapor)
  if (dataset && visibility.saturation) {
    ctx.strokeStyle = isDanf ? '#0284c7' : '#38bdf8';
    ctx.lineWidth = 2.4;

    ctx.beginPath();
    dataset.saturationLiquid.segments.forEach((seg) => {
      seg.forEach((pt, i) => {
        const { x, y } = transform.projectPoint(pt);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
    });
    ctx.stroke();

    ctx.beginPath();
    dataset.saturationVapor.segments.forEach((seg) => {
      seg.forEach((pt, i) => {
        const { x, y } = transform.projectPoint(pt);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
    });
    ctx.stroke();

    // Critical Point
    const crit = transform.projectPoint(dataset.criticalPoint);
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(crit.x, crit.y, 5.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Draw User Connections / Processes
  for (const conn of connections) {
    const p1 = points.find((p) => p.id === conn.fromPointId);
    const p2 = points.find((p) => p.id === conn.toPointId);
    if (p1 && p2) {
      ctx.strokeStyle = conn.color || '#38bdf8';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      if (conn.pathPoints && conn.pathPoints.length >= 2) {
        conn.pathPoints.forEach((pt, i) => {
          const { x, y } = transform.project(
            Units.kjkgToJkg(pt.h_kj_kg),
            Units.barToPa(pt.p_bar)
          );
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
      } else {
        const pt1 = transform.project(
          Units.kjkgToJkg(p1.state.enthalpy_kj_kg),
          Units.barToPa(p1.state.pressure_bar)
        );
        const pt2 = transform.project(
          Units.kjkgToJkg(p2.state.enthalpy_kj_kg),
          Units.barToPa(p2.state.pressure_bar)
        );
        ctx.moveTo(pt1.x, pt1.y);
        ctx.lineTo(pt2.x, pt2.y);
      }
      ctx.stroke();
    }
  }

  // Draw User Points
  for (const pt of points) {
    const { x, y } = transform.project(
      Units.kjkgToJkg(pt.state.enthalpy_kj_kg),
      Units.barToPa(pt.state.pressure_bar)
    );

    ctx.fillStyle = pt.color || '#38bdf8';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Point Label tag
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = isDanf ? '#1e293b' : '#f8fafc';
    ctx.fillText(pt.name, x + 9, y + 4);
  }

  ctx.restore();

  // 4. Outer Boundary Frame
  ctx.strokeStyle = isDanf ? '#94a3b8' : '#334155';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(margin.left, margin.top, plotWidth, plotHeight);

  // 5. Axes Label Text
  ctx.fillStyle = isDanf ? '#475569' : '#94a3b8';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Entalpía específica, h [kJ/kg]', margin.left + plotWidth / 2, height - 15);

  ctx.save();
  ctx.translate(20, margin.top + plotHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Presión absoluta, P [bar(a)]', 0, 0);
  ctx.restore();

  return canvas;
}

/**
 * Generates a complete PDF document containing the diagram and a technical table of states.
 */
export function generateMollierPdf(
  canvas: HTMLCanvasElement,
  projectName: string,
  fluidName: string,
  points: DiagramPoint[],
  includeTable: boolean = true
): jsPDF {
  // A4 Landscape: 297mm x 210mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 14;

  // 1. Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, margin, pageWidth - margin * 2, 14, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`CoolMollier • ${projectName.toUpperCase()}`, margin + 5, margin + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  const dateStr = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Refrigerante: ${fluidName}  |  Fecha: ${dateStr}`, pageWidth - margin - 5, margin + 9, {
    align: 'right',
  });

  // 2. Diagram Image
  const imgData = canvas.toDataURL('image/png', 1.0);
  const diagramX = margin;
  const diagramY = margin + 16;
  const diagramW = pageWidth - margin * 2;
  const diagramH = includeTable && points.length > 0 ? 112 : pageHeight - diagramY - margin - 8;

  doc.addImage(imgData, 'PNG', diagramX, diagramY, diagramW, diagramH);

  // 3. Technical Points Table (if selected and points exist)
  if (includeTable && points.length > 0) {
    const tableY = diagramY + diagramH + 4;
    const tableW = pageWidth - margin * 2;

    // Table Header
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, tableY, tableW, 6, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.rect(margin, tableY, tableW, 6, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);

    const cols = [
      { label: 'PUNTO', x: margin + 3 },
      { label: 'PRESIÓN [bar]', x: margin + 35 },
      { label: 'TEMP. [°C]', x: margin + 70 },
      { label: 'ENTALPÍA [kJ/kg]', x: margin + 105 },
      { label: 'ENTROPÍA [kJ/(kg·K)]', x: margin + 145 },
      { label: 'VOL. ESP. [m³/kg]', x: margin + 190 },
      { label: 'TÍTULO (x)', x: margin + 230 },
      { label: 'ESTADO / FASE', x: margin + 255 },
    ];

    cols.forEach((col) => {
      doc.text(col.label, col.x, tableY + 4.2);
    });

    // Table Rows
    let currentY = tableY + 6;
    const rowHeight = 4.8;
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);

    points.slice(0, 8).forEach((pt, index) => {
      const isAlt = index % 2 === 1;
      if (isAlt) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, tableW, rowHeight, 'F');
      }
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, currentY, tableW, rowHeight, 'S');

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(pt.name, margin + 3, currentY + 3.4);

      doc.setFont('courier', 'normal');
      doc.text(pt.state.pressure_bar.toFixed(3), margin + 35, currentY + 3.4);
      doc.text(pt.state.temperature_c.toFixed(2), margin + 70, currentY + 3.4);
      doc.text(pt.state.enthalpy_kj_kg.toFixed(2), margin + 105, currentY + 3.4);
      doc.text(pt.state.entropy_kj_kg_k.toFixed(4), margin + 145, currentY + 3.4);
      doc.text(pt.state.specific_volume_m3_kg.toFixed(5), margin + 190, currentY + 3.4);
      doc.text(
        pt.state.vapor_quality !== undefined && pt.state.vapor_quality >= 0
          ? pt.state.vapor_quality.toFixed(3)
          : '—',
        margin + 230,
        currentY + 3.4
      );
      doc.text(pt.state.phase || 'Subenfriado', margin + 255, currentY + 3.4);

      currentY += rowHeight;
    });
  }

  // 4. Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Generado automáticamente por CoolMollier • Motor de cálculo termodinámico CoolProp v8.0',
    margin,
    pageHeight - 6
  );
  doc.text('Página 1 de 1', pageWidth - margin, pageHeight - 6, { align: 'right' });

  return doc;
}

/**
 * Saves a file by triggering the native "Guardar como..." file picker dialog (File System Access API)
 * with transparent fallback to browser download anchor.
 */
export async function saveFileWithPicker(
  blob: Blob,
  suggestedFilename: string,
  format: 'png' | 'pdf' | 'svg'
): Promise<{ success: boolean; filename: string; cancelled?: boolean; error?: string }> {
  const extension = format === 'pdf' ? '.pdf' : format === 'svg' ? '.svg' : '.png';
  const mimeType =
    format === 'pdf'
      ? 'application/pdf'
      : format === 'svg'
      ? 'image/svg+xml'
      : 'image/png';
  const description =
    format === 'pdf'
      ? 'Documento PDF (*.pdf)'
      : format === 'svg'
      ? 'Gráfico Vectorial SVG (*.svg)'
      : 'Imagen PNG (*.png)';

  // 1. Modern File System Access API (Desktop browsers / Chrome / Edge)
  if ('showSaveFilePicker' in window) {
    try {
      // Ensure filename has proper extension
      const defaultName = suggestedFilename.endsWith(extension)
        ? suggestedFilename
        : `${suggestedFilename}${extension}`;

      const handle = await (window as unknown as {
        showSaveFilePicker: (options: {
          suggestedName: string;
          types: Array<{ description: string; accept: Record<string, string[]> }>;
        }) => Promise<FileSystemFileHandle>;
      }).showSaveFilePicker({
        suggestedName: defaultName,
        types: [
          {
            description,
            accept: {
              [mimeType]: [extension],
            },
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();

      return {
        success: true,
        filename: handle.name || defaultName,
      };
    } catch (err: unknown) {
      // If user cancelled the dialog (AbortError), don't show error
      if (err instanceof Error && err.name === 'AbortError') {
        return {
          success: false,
          filename: suggestedFilename,
          cancelled: true,
        };
      }
      // If permission or feature failed, fallback to anchor download below
      console.warn('showSaveFilePicker failed or unpermitted, falling back to download link:', err);
    }
  }

  // 2. Fallback: Programmatic <a> download
  try {
    const finalFilename = suggestedFilename.endsWith(extension)
      ? suggestedFilename
      : `${suggestedFilename}${extension}`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 2000);

    return {
      success: true,
      filename: finalFilename,
    };
  } catch (err: unknown) {
    return {
      success: false,
      filename: suggestedFilename,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
