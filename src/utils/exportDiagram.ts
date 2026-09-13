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

function parseColorToRgb(color?: string): [number, number, number] {
  if (!color) return [2, 132, 199];
  if (color.startsWith('#')) {
    const clean = color.replace('#', '');
    if (clean.length === 3) {
      return [
        parseInt(clean[0] + clean[0], 16),
        parseInt(clean[1] + clean[1], 16),
        parseInt(clean[2] + clean[2], 16),
      ];
    }
    if (clean.length === 6) {
      const num = parseInt(clean, 16);
      return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
    }
  } else if (color.startsWith('rgb')) {
    const match = color.match(/\d+/g);
    if (match && match.length >= 3) {
      return [parseInt(match[0], 10), parseInt(match[1], 10), parseInt(match[2], 10)];
    }
  }
  return [2, 132, 199];
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

  const dateStr = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // 1. PAGE 1: FULL DIAGRAM
  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, margin, pageWidth - margin * 2, 14, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`CoolMollier • ${projectName.toUpperCase()}`, margin + 5, margin + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Refrigerante: ${fluidName}  |  Fecha: ${dateStr}`, pageWidth - margin - 5, margin + 9, {
    align: 'right',
  });

  // Diagram Image - Full available height so it never gets shrunk
  const imgData = canvas.toDataURL('image/png', 1.0);
  const diagramX = margin;
  const diagramY = margin + 16;
  const diagramW = pageWidth - margin * 2;
  const diagramH = pageHeight - diagramY - margin - 8;

  doc.addImage(imgData, 'PNG', diagramX, diagramY, diagramW, diagramH);

  // 2. PAGE 2+: INDIVIDUAL POINT INFORMATION CARDS
  if (includeTable && points.length > 0) {
    const cardsPerPage = 6; // 3 rows x 2 columns
    const cardW = 130;
    const cardH = 46;
    const gapX = 9;
    const gapY = 7;
    const startY = 34;

    const renderPointsHeader = () => {
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(margin, margin, pageWidth - margin * 2, 14, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(
        `CoolMollier • ${projectName.toUpperCase()} — PUNTOS TERMODINÁMICOS`,
        margin + 5,
        margin + 9
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Refrigerante: ${fluidName}  |  Total: ${points.length} ${points.length === 1 ? 'punto' : 'puntos'}`,
        pageWidth - margin - 5,
        margin + 9,
        { align: 'right' }
      );
    };

    points.forEach((pt, index) => {
      const indexOnPage = index % cardsPerPage;

      if (indexOnPage === 0) {
        doc.addPage('a4', 'landscape');
        renderPointsHeader();
      }

      const col = indexOnPage % 2;
      const row = Math.floor(indexOnPage / 2);

      const cardX = margin + col * (cardW + gapX);
      const cardY = startY + row * (cardH + gapY);

      // Card container
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineWidth(0.3);
      doc.roundedRect(cardX, cardY, cardW, cardH, 2.5, 2.5, 'FD');

      // Header Band
      doc.setFillColor(241, 245, 249); // slate-100
      doc.roundedRect(cardX, cardY, cardW, 9.5, 2.5, 2.5, 'F');
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(cardX, cardY + 9.5, cardX + cardW, cardY + 9.5);

      // Point Color Dot
      const [r, g, b] = parseColorToRgb(pt.color);
      doc.setFillColor(r, g, b);
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.circle(cardX + 5, cardY + 4.8, 2.2, 'FD');

      // Point Name
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      const ptName = pt.name || `Punto ${index + 1}`;
      doc.text(ptName, cardX + 9.5, cardY + 6.2);

      // Phase Badge
      const phaseText =
        pt.state?.phase ||
        (typeof pt.state?.vapor_quality === 'number' && pt.state.vapor_quality >= 0
          ? 'Bifásico'
          : 'Monofásico');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      const badgeW = Math.min(doc.getTextWidth(phaseText) + 5, 48);
      const badgeX = cardX + cardW - badgeW - 3;
      doc.setFillColor(224, 242, 254); // sky-100
      doc.setDrawColor(186, 230, 253); // sky-200
      doc.setLineWidth(0.2);
      doc.roundedRect(badgeX, cardY + 2.2, badgeW, 5.2, 1.5, 1.5, 'FD');
      doc.setTextColor(3, 105, 161); // sky-700
      doc.text(phaseText, badgeX + 2.5, cardY + 5.8);

      // Properties Grid
      const col1LabelX = cardX + 4;
      const col1ValX = cardX + 28;
      const col2LabelX = cardX + 68;
      const col2ValX = cardX + 93;

      const pBar =
        typeof pt.state?.pressure_bar === 'number'
          ? `${pt.state.pressure_bar.toFixed(3)} bar(a)`
          : '—';
      const tC =
        typeof pt.state?.temperature_c === 'number'
          ? `${pt.state.temperature_c.toFixed(2)} °C`
          : '—';
      const hKj =
        typeof pt.state?.enthalpy_kj_kg === 'number'
          ? `${pt.state.enthalpy_kj_kg.toFixed(2)} kJ/kg`
          : '—';
      const rho =
        typeof pt.state?.density_kg_m3 === 'number'
          ? `${pt.state.density_kg_m3.toFixed(2)} kg/m³`
          : '—';

      const sKj =
        typeof pt.state?.entropy_kj_kg_k === 'number'
          ? `${pt.state.entropy_kj_kg_k.toFixed(4)} kJ/(kg·K)`
          : '—';
      const vM3 =
        typeof pt.state?.specific_volume_m3_kg === 'number'
          ? `${pt.state.specific_volume_m3_kg.toFixed(5)} m³/kg`
          : '—';
      const xQ =
        typeof pt.state?.vapor_quality === 'number' && pt.state.vapor_quality >= 0
          ? `${pt.state.vapor_quality.toFixed(3)} (${(pt.state.vapor_quality * 100).toFixed(1)}%)`
          : '— (Monofásico)';
      const inputDef = pt.input1_type ? `${pt.input1_type} + ${pt.input2_type}` : 'Punto de ciclo';

      const rows = [
        { l1: 'Presión (P):', v1: pBar, l2: 'Entropía (s):', v2: sKj, y: cardY + 16 },
        { l1: 'Temp. (T):', v1: tC, l2: 'Vol. Esp. (v):', v2: vM3, y: cardY + 24 },
        { l1: 'Entalpía (h):', v1: hKj, l2: 'Título (x):', v2: xQ, y: cardY + 32 },
        { l1: 'Densidad (ρ):', v1: rho, l2: 'Parámetros:', v2: inputDef, y: cardY + 40 },
      ];

      rows.forEach((rData) => {
        // Divider line above row (except first)
        if (rData.y > cardY + 16) {
          doc.setDrawColor(241, 245, 249);
          doc.setLineWidth(0.2);
          doc.line(cardX + 3, rData.y - 4.5, cardX + cardW - 3, rData.y - 4.5);
        }

        // Col 1
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(rData.l1, col1LabelX, rData.y);

        doc.setFont('courier', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text(rData.v1, col1ValX, rData.y);

        // Col 2
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(rData.l2, col2LabelX, rData.y);

        doc.setFont('courier', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        const maxValW = cardX + cardW - col2ValX - 3;
        const valText =
          doc.getTextWidth(rData.v2) > maxValW ? `${rData.v2.slice(0, 16)}…` : rData.v2;
        doc.text(valText, col2ValX, rData.y);
      });
    });
  }

  // 3. Footers for all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Generado automáticamente por CoolMollier • Motor de cálculo termodinámico CoolProp v8.0',
      margin,
      pageHeight - 6
    );
    doc.text(`Página ${p} de ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

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
