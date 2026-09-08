import { DiagramTransform } from '../transform/DiagramTransform';

export interface DraggingState {
  type: 'point' | 'label' | 'pan';
  id?: string;
  startClientX: number;
  startClientY: number;
  initialLabelOffset?: { x: number; y: number };
  initialTransform?: DiagramTransform;
}

export class DiagramInteraction {
  /**
   * Computes the new DiagramTransform resulting from mouse wheel zoom
   */
  static handleWheelZoom(
    e: React.WheelEvent,
    currentTransform: DiagramTransform,
    svgElement: SVGSVGElement
  ): DiagramTransform {
    e.preventDefault();
    const localCoord = DiagramTransform.screenToSvgLocal(e.clientX, e.clientY, svgElement);

    // Zoom direction and factor
    const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    return currentTransform.zoomAt(localCoord.x, localCoord.y, zoomFactor);
  }

  /**
   * Computes zoom in / zoom out centered at the viewport center
   */
  static zoomCenter(currentTransform: DiagramTransform, factor: number): DiagramTransform {
    const centerX = currentTransform.rect.left + currentTransform.rect.width / 2;
    const centerY = currentTransform.rect.top + currentTransform.rect.height / 2;
    return currentTransform.zoomAt(centerX, centerY, factor);
  }

  /**
   * Extracts physical (h in J/kg, p in Pa) state from mouse event over local SVG
   */
  static getPhysicalPointFromEvent(
    clientX: number,
    clientY: number,
    svgElement: SVGSVGElement,
    transform: DiagramTransform
  ): { hJkg: number; pPa: number; localX: number; localY: number; isInsidePlot: boolean } {
    const local = DiagramTransform.screenToSvgLocal(clientX, clientY, svgElement);
    const { hJkg, pPa } = transform.unproject(local.x, local.y);

    const r = transform.rect;
    const isInsidePlot =
      local.x >= r.left &&
      local.x <= r.left + r.width &&
      local.y >= r.top &&
      local.y <= r.top + r.height;

    return {
      hJkg,
      pPa,
      localX: local.x,
      localY: local.y,
      isInsidePlot,
    };
  }
}
