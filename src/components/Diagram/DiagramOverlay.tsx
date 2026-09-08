import React, { useRef } from 'react';
import { DiagramPoint } from '../../types/thermo';
import { useProject } from '../../context/ProjectContext';

interface DiagramOverlayProps {
  xScale: (h: number) => number;
  yScale: (p: number) => number;
  xScaleInvert: (x: number) => number;
  yScaleInvert: (y: number) => number;
}

export const DiagramOverlay: React.FC<DiagramOverlayProps> = ({
  xScale,
  yScale,
  xScaleInvert,
  yScaleInvert,
}) => {
  const {
    points,
    selectedPointId,
    setSelectedPointId,
    movePoint,
    updatePointLabelOffset,
    connections,
    selectedConnectionId,
    setSelectedConnectionId,
    curveVisibility,
    toolMode,
    connectSourcePointId,
    setConnectSourcePointId,
    addConnection,
    showToast,
  } = useProject();

  const dragRef = useRef<{
    type: 'point' | 'label';
    id: string;
    startX: number;
    startY: number;
    initialOffset?: { x: number; y: number };
  } | null>(null);

  // Handle Point click / connect mode
  const handlePointClick = (e: React.MouseEvent, pointId: string) => {
    e.stopPropagation();
    if (toolMode === 'connect') {
      if (!connectSourcePointId) {
        setConnectSourcePointId(pointId);
        showToast('Seleccione el punto de destino para trazar el proceso');
      } else {
        addConnection(connectSourcePointId, pointId);
        setConnectSourcePointId(null);
      }
    } else {
      setSelectedPointId(pointId);
      setSelectedConnectionId(null);
    }
  };

  // Start Dragging Point Marker
  const handlePointMouseDown = (e: React.MouseEvent, pointId: string) => {
    if (toolMode === 'connect') return;
    e.stopPropagation();
    setSelectedPointId(pointId);
    dragRef.current = {
      type: 'point',
      id: pointId,
      startX: e.clientX,
      startY: e.clientY,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragRef.current || dragRef.current.type !== 'point') return;
      // Get SVG bounding rect
      const svg = document.querySelector('.chart-svg');
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const mouseSvgX = moveEvent.clientX - rect.left;
      const mouseSvgY = moveEvent.clientY - rect.top;

      const newH = xScaleInvert(mouseSvgX);
      const newP = yScaleInvert(mouseSvgY);

      if (newP > 0.01 && newH > -500 && newH < 2000) {
        movePoint(dragRef.current.id, newH, newP);
      }
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Start Dragging Point Label Card
  const handleLabelMouseDown = (e: React.MouseEvent, point: DiagramPoint) => {
    e.stopPropagation();
    dragRef.current = {
      type: 'label',
      id: point.id,
      startX: e.clientX,
      startY: e.clientY,
      initialOffset: { ...point.labelOffset },
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragRef.current || dragRef.current.type !== 'label' || !dragRef.current.initialOffset) return;
      const dx = moveEvent.clientX - dragRef.current.startX;
      const dy = moveEvent.clientY - dragRef.current.startY;
      updatePointLabelOffset(
        dragRef.current.id,
        dragRef.current.initialOffset.x + dx,
        dragRef.current.initialOffset.y + dy
      );
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <g className="diagram-overlay">
      {/* Arrowhead Defs */}
      <defs>
        <marker
          id="arrow-head"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
        </marker>
        <marker
          id="arrow-head-selected"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f43f5e" />
        </marker>
      </defs>

      {/* Render Connections (Processes & Cycles) */}
      {connections.map((conn) => {
        const p1 = points.find((p) => p.id === conn.fromPointId);
        const p2 = points.find((p) => p.id === conn.toPointId);
        if (!p1 || !p2) return null;

        const isSelected = conn.id === selectedConnectionId;

        // Path generator: use intermediate points if available, otherwise direct straight line
        let pathD = '';
        if (conn.pathPoints && conn.pathPoints.length > 2) {
          pathD = conn.pathPoints.reduce((acc, pt, i) => {
            const px = xScale(pt.h_kj_kg);
            const py = yScale(pt.p_bar);
            return i === 0 ? `M ${px} ${py}` : `${acc} L ${px} ${py}`;
          }, '');
        } else {
          const x1 = xScale(p1.state.enthalpy_kj_kg);
          const y1 = yScale(p1.state.pressure_bar);
          const x2 = xScale(p2.state.enthalpy_kj_kg);
          const y2 = yScale(p2.state.pressure_bar);
          pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
        }

        return (
          <g
            key={conn.id}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedConnectionId(conn.id);
              setSelectedPointId(null);
            }}
            style={{ cursor: 'pointer' }}
          >
            {/* Wider transparent stroke for easier click selection */}
            <path
              d={pathD}
              fill="none"
              stroke="transparent"
              strokeWidth={14}
            />
            {/* Visual stroke */}
            <path
              d={pathD}
              fill="none"
              stroke={isSelected ? '#f43f5e' : conn.color || '#38bdf8'}
              strokeWidth={isSelected ? 3 : 2}
              strokeDasharray={conn.processType === 'direct_line' ? undefined : '5, 3'}
              markerEnd={isSelected ? 'url(#arrow-head-selected)' : 'url(#arrow-head)'}
            />
          </g>
        );
      })}

      {/* Render Points and Labels */}
      {points.map((pt) => {
        const cx = xScale(pt.state.enthalpy_kj_kg);
        const cy = yScale(pt.state.pressure_bar);
        const isSelected = pt.id === selectedPointId;
        const isConnectSource = pt.id === connectSourcePointId;

        const lx = cx + pt.labelOffset.x;
        const ly = cy + pt.labelOffset.y;

        const showLabels = curveVisibility.showPointLabels && curveVisibility.pointLabelMode !== 'hidden';
        const isCompact = curveVisibility.pointLabelMode === 'compact';

        return (
          <g key={pt.id}>
            {/* Leader line from point marker to label card */}
            {showLabels && (pt.labelOffset.x !== 0 || pt.labelOffset.y !== 0) && (
              <line
                x1={cx}
                y1={cy}
                x2={lx + (pt.labelOffset.x >= 0 ? 0 : 130)}
                y2={ly + 25}
                stroke={pt.color}
                strokeWidth={1}
                strokeDasharray="2, 2"
                opacity={0.6}
              />
            )}

            {/* Draggable Label Card */}
            {showLabels && (
              <g
                className="point-label-card"
                transform={`translate(${lx}, ${ly})`}
                onMouseDown={(e) => handleLabelMouseDown(e, pt)}
              >
                <rect
                  x={0}
                  y={0}
                  width={isCompact ? 110 : 135}
                  height={isCompact ? 40 : 82}
                  rx={6}
                  fill="rgba(14, 20, 36, 0.92)"
                  stroke={isSelected ? '#38bdf8' : pt.color}
                  strokeWidth={isSelected ? 2 : 1}
                  filter="drop-shadow(0 2px 6px rgba(0,0,0,0.6))"
                />
                <text x={8} y={14} fill={pt.color} fontWeight="700" fontSize="10">
                  {pt.name}
                </text>
                <text x={8} y={28} fill="#f8fafc" fontSize="9.5">
                  T = {pt.state.temperature_c.toFixed(1)} °C
                </text>
                {!isCompact && (
                  <>
                    <text x={8} y={42} fill="#94a3b8" fontSize="9.5">
                      h = {pt.state.enthalpy_kj_kg.toFixed(1)} kJ/kg
                    </text>
                    <text x={8} y={56} fill="#94a3b8" fontSize="9.5">
                      v = {pt.state.specific_volume_m3_kg < 0.01
                        ? pt.state.specific_volume_m3_kg.toExponential(3)
                        : pt.state.specific_volume_m3_kg.toFixed(4)}{' '}
                      m³/kg
                    </text>
                    <text x={8} y={70} fill="#38bdf8" fontWeight="600" fontSize="9.5">
                      P = {pt.state.pressure_bar.toFixed(2)} bar(a)
                    </text>
                  </>
                )}
                {isCompact && (
                  <text x={8} y={38} fill="#38bdf8" fontWeight="600" fontSize="9.5">
                    P = {pt.state.pressure_bar.toFixed(2)} bar
                  </text>
                )}
              </g>
            )}

            {/* Point Marker Circle */}
            <g
              className="point-marker"
              transform={`translate(${cx}, ${cy})`}
              onClick={(e) => handlePointClick(e, pt.id)}
              onMouseDown={(e) => handlePointMouseDown(e, pt.id)}
            >
              {/* Outer pulsing ring for selected or connect source */}
              {(isSelected || isConnectSource) && (
                <circle
                  r={12}
                  fill="none"
                  stroke={isConnectSource ? '#f59e0b' : '#38bdf8'}
                  strokeWidth={2}
                  opacity={0.8}
                >
                  <animate
                    attributeName="r"
                    values="9;14;9"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.9;0.3;0.9"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Main point circle */}
              <circle
                r={6}
                fill={pt.color}
                stroke="#ffffff"
                strokeWidth={2}
                filter="drop-shadow(0 0 6px rgba(0,0,0,0.8))"
              />

              {/* Center dot */}
              <circle r={2} fill="#090d16" />
            </g>
          </g>
        );
      })}
    </g>
  );
};
