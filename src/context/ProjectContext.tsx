import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  CatalogItem,
  CatalogResponse,
  CurveVisibilityConfig,
  DiagramConnection,
  DiagramCurvesResponse,
  DiagramLayer,
  DiagramPoint,
  FluidInfo,
  ProcessType,
  ProjectData,
  ThermodynamicState,
} from '../types/thermo';
import { FullDiagramDataset } from '../engine/types/thermoContract';
import { ThermoProvider } from '../engine/provider/ThermoProvider';
import * as thermoService from '../services/tauriThermoService';

interface ProjectContextType {
  // Catalog & Fluid
  catalog: CatalogResponse | null;
  selectedFluidId: string;
  selectedFluidItem: CatalogItem | null;
  fluidInfo: FluidInfo | null;
  setSelectedFluidId: (fluidId: string) => void;

  // Curves & Dataset
  dataset: FullDiagramDataset | null;
  diagramCurves: DiagramCurvesResponse | null;
  isLoadingCurves: boolean;
  curvesError: string | null;
  curveVisibility: CurveVisibilityConfig;
  setCurveVisibility: React.Dispatch<React.SetStateAction<CurveVisibilityConfig>>;

  // Project Info
  projectName: string;
  setProjectName: (name: string) => void;
  projectNotes: string;
  setProjectNotes: (notes: string) => void;

  // Layers System
  layers: DiagramLayer[];
  activeLayerId: string;
  setActiveLayerId: (id: string) => void;
  addLayer: (name?: string, color?: string) => DiagramLayer;
  updateLayer: (id: string, updates: Partial<DiagramLayer>) => void;
  removeLayer: (id: string) => void;

  // Points
  points: DiagramPoint[];
  selectedPointId: string | null;
  setSelectedPointId: (id: string | null) => void;
  addPointFromCoordinates: (h_kj_kg: number, p_bar: number) => Promise<DiagramPoint | null>;
  addOrUpdatePointFromInput: (
    pointId: string | null,
    name: string,
    color: string,
    in1Type: string,
    in1Val: number,
    in2Type: string,
    in2Val: number
  ) => Promise<DiagramPoint | null>;
  movePoint: (id: string, h_kj_kg: number, p_bar: number) => Promise<void>;
  updatePointLabelOffset: (id: string, dx: number, dy: number) => void;
  removePoint: (id: string) => void;

  // Connections / Cycles
  connections: DiagramConnection[];
  selectedConnectionId: string | null;
  setSelectedConnectionId: (id: string | null) => void;
  addConnection: (fromId: string, toId: string, processType?: ProcessType) => Promise<DiagramConnection | null>;
  updateConnection: (id: string, updates: Partial<DiagramConnection>) => Promise<void>;
  removeConnection: (id: string) => void;
  closeCycle: () => Promise<void>;

  // Tool / Interaction Mode
  toolMode: 'select' | 'add_point' | 'connect';
  setToolMode: (mode: 'select' | 'add_point' | 'connect') => void;
  connectSourcePointId: string | null;
  setConnectSourcePointId: (id: string | null) => void;
  sidebarTab: 'layers_points' | 'connections' | 'editor';
  setSidebarTab: (tab: 'layers_points' | 'connections' | 'editor') => void;

  // App Theme (Dark / Light Mode) & Diagram View
  themeMode: 'dark' | 'light';
  setThemeMode: React.Dispatch<React.SetStateAction<'dark' | 'light'>>;
  toggleThemeMode: () => void;
  diagramTheme: 'danfoss' | 'dark';
  setDiagramTheme: React.Dispatch<React.SetStateAction<'danfoss' | 'dark'>>;
  engineMode: 'svg' | 'plotly';
  setEngineMode: React.Dispatch<React.SetStateAction<'svg' | 'plotly'>>;
  mainViewMode: 'diagram' | '3d' | 'split';
  setMainViewMode: React.Dispatch<React.SetStateAction<'diagram' | '3d' | 'split'>>;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  registerDiagramActions: (actions: { zoomIn: () => void; zoomOut: () => void; resetView: () => void }) => void;

  // Notifications & Modals
  toastMessage: string | null;
  showToast: (msg: string) => void;
  isAvailabilityModalOpen: boolean;
  setIsAvailabilityModalOpen: (open: boolean) => void;
  isSampleCyclesModalOpen: boolean;
  setIsSampleCyclesModalOpen: (open: boolean) => void;

  // Export / Import
  newProject: () => void;
  saveProjectJson: () => string;
  loadProjectJson: (jsonStr: string) => Promise<boolean>;
  exportPointsCsv: () => string;
  loadSampleCycle: (cycleType: 'r134a_standard' | 'r744_transcritical' | 'r717_industrial' | 'r407c_glide') => Promise<void>;
}

const defaultVisibility: CurveVisibilityConfig = {
  saturation: true,
  isotherms: true,
  isentropics: false,
  isochores: false,
  qualityLines: false,
  showCurveLabels: true,
  showPointLabels: true,
  pointLabelMode: 'full',
};

const POINT_COLORS = [
  '#38bdf8', // sky blue
  '#f43f5e', // rose
  '#10b981', // emerald
  '#f59e0b', // amber
  '#a855f7', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#eab308', // yellow
];

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [selectedFluidId, setSelectedFluidId] = useState<string>('R134a');
  const [fluidInfo, setFluidInfo] = useState<FluidInfo | null>(null);

  const [dataset, setDataset] = useState<FullDiagramDataset | null>(null);
  const [diagramCurves, setDiagramCurves] = useState<DiagramCurvesResponse | null>(null);
  const [isLoadingCurves, setIsLoadingCurves] = useState<boolean>(true);
  const [curvesError, setCurvesError] = useState<string | null>(null);

  const [curveVisibility, setCurveVisibility] = useState<CurveVisibilityConfig>(defaultVisibility);

  const [projectName, setProjectName] = useState<string>('Ciclo de Refrigeración');
  const [projectNotes, setProjectNotes] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [isSampleCyclesModalOpen, setIsSampleCyclesModalOpen] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Layers System State
  const [layers, setLayers] = useState<DiagramLayer[]>([
    { id: 'layer-1', name: 'Capa 1', color: '#38bdf8', isVisible: true },
  ]);
  const [activeLayerId, setActiveLayerId] = useState<string>('layer-1');

  const addLayer = useCallback((name?: string, color?: string): DiagramLayer => {
    const nextIdx = layers.length + 1;
    const newColor = color || POINT_COLORS[(nextIdx - 1) % POINT_COLORS.length];
    const newLayer: DiagramLayer = {
      id: `layer-${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: name || `Capa ${nextIdx}`,
      color: newColor,
      isVisible: true,
    };
    setLayers((prev) => [...prev, newLayer]);
    setActiveLayerId(newLayer.id);
    showToast(`Capa '${newLayer.name}' creada`);
    return newLayer;
  }, [layers.length, showToast]);

  const updateLayer = useCallback((id: string, updates: Partial<DiagramLayer>) => {
    setLayers((prev) =>
      prev.map((layer) => (layer.id === id ? { ...layer, ...updates } : layer))
    );

    // If color updated, keep points and connections of this layer in sync
    if (updates.color) {
      setPoints((prev) =>
        prev.map((p) => (p.layerId === id ? { ...p, color: updates.color! } : p))
      );
      setConnections((prev) =>
        prev.map((c) => (c.layerId === id ? { ...c, color: updates.color! } : c))
      );
    }
  }, []);

  const removeLayer = useCallback((id: string) => {
    if (layers.length <= 1) {
      showToast('Debe existir al menos una capa');
      return;
    }
    const remaining = layers.filter((l) => l.id !== id);
    const targetLayerId = remaining[0].id;
    const targetLayerColor = remaining[0].color;

    // Reassign points & connections of deleted layer to the target layer
    setPoints((prev) =>
      prev.map((p) => (p.layerId === id ? { ...p, layerId: targetLayerId, color: targetLayerColor } : p))
    );
    setConnections((prev) =>
      prev.map((c) => (c.layerId === id ? { ...c, layerId: targetLayerId, color: targetLayerColor } : c))
    );

    setLayers(remaining);
    if (activeLayerId === id) {
      setActiveLayerId(targetLayerId);
    }
    showToast('Capa eliminada y elementos reasignados');
  }, [layers, activeLayerId, showToast]);

  const [points, setPoints] = useState<DiagramPoint[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  const [connections, setConnections] = useState<DiagramConnection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

  const [toolMode, setToolMode] = useState<'select' | 'add_point' | 'connect'>('select');
  const [connectSourcePointId, setConnectSourcePointId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'layers_points' | 'connections' | 'editor'>('layers_points');

  // App Theme (Dark / Light Mode) & Diagram View
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('coolmollier_theme_mode');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark'; // Default industrial dark
  });

  const [diagramTheme, setDiagramTheme] = useState<'danfoss' | 'dark'>(() => {
    const saved = localStorage.getItem('coolmollier_theme_mode');
    return saved === 'light' ? 'danfoss' : 'dark';
  });

  // Keep DOM class and localStorage in sync
  useEffect(() => {
    localStorage.setItem('coolmollier_theme_mode', themeMode);
    const root = document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [themeMode]);

  const toggleThemeMode = useCallback(() => {
    setThemeMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      setDiagramTheme(next === 'dark' ? 'dark' : 'danfoss');
      return next;
    });
  }, []);

  const [engineMode, setEngineMode] = useState<'svg' | 'plotly'>('svg');
  const [mainViewMode, setMainViewMode] = useState<'diagram' | '3d' | 'split'>('diagram');
  const diagramActionsRef = useRef<{ zoomIn: () => void; zoomOut: () => void; resetView: () => void }>({
    zoomIn: () => {},
    zoomOut: () => {},
    resetView: () => {},
  });

  const registerDiagramActions = useCallback((actions: { zoomIn: () => void; zoomOut: () => void; resetView: () => void }) => {
    diagramActionsRef.current = actions;
  }, []);

  const zoomIn = useCallback(() => diagramActionsRef.current.zoomIn(), []);
  const zoomOut = useCallback(() => diagramActionsRef.current.zoomOut(), []);
  const resetView = useCallback(() => diagramActionsRef.current.resetView(), []);

  // Initial Load: Fetch Catalog
  useEffect(() => {
    thermoService
      .fetchCatalog()
      .then((res) => {
        setCatalog(res);
      })
      .catch((err) => {
        console.error('Error fetching catalog:', err);
        setCurvesError('Error al conectar con el motor CoolProp: ' + String(err));
      });
  }, []);

  // Fetch Curves and Fluid Info on Fluid Change with Revision Control
  useEffect(() => {
    if (!selectedFluidId) return;

    setIsLoadingCurves(true);
    setCurvesError(null);

    const revision = ThermoProvider.nextRevision();

    Promise.all([
      ThermoProvider.fetchDiagramDataset(selectedFluidId, revision),
      thermoService.fetchDiagramCurves(selectedFluidId).catch(() => null),
      thermoService.fetchFluidDetails(selectedFluidId).catch(() => null),
    ])
      .then(([newDataset, oldCurves, info]) => {
        if (revision === ThermoProvider.getCurrentRevision()) {
          setDataset(newDataset);
          if (oldCurves) setDiagramCurves(oldCurves);
          if (info) setFluidInfo(info);
          setIsLoadingCurves(false);
        }
      })
      .catch((err) => {
        if (revision === ThermoProvider.getCurrentRevision()) {
          console.error('Error generating diagram dataset:', err);
          setCurvesError(String(err));
          setIsLoadingCurves(false);
        }
      });
  }, [selectedFluidId]);

  const selectedFluidItem = catalog?.priority_items.find((it) => it.coolprop_id === selectedFluidId) || null;

  // Add Point by Direct (h, P) coordinates from mouse click
  const addPointFromCoordinates = useCallback(
    async (h_kj_kg: number, p_bar: number): Promise<DiagramPoint | null> => {
      try {
        const state = await thermoService.calculateState(
          selectedFluidId,
          'H',
          h_kj_kg,
          'P',
          p_bar
        );

        const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[0];
        const pointColor = activeLayer?.color || POINT_COLORS[0];
        const pointIndex = points.length + 1;

        const newPoint: DiagramPoint = {
          id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          layerId: activeLayer?.id,
          name: `Punto ${pointIndex}`,
          color: pointColor,
          input1_type: 'P',
          input1_val: state.pressure_bar,
          input2_type: 'h',
          input2_val: state.enthalpy_kj_kg,
          state,
          labelOffset: { x: 20, y: -20 },
        };

        setPoints((prev) => [...prev, newPoint]);
        setSelectedPointId(newPoint.id);
        showToast(`Añadido ${newPoint.name}: P=${state.pressure_bar.toFixed(2)} bar, T=${state.temperature_c.toFixed(1)} °C`);
        return newPoint;
      } catch (err) {
        showToast(`Error al calcular estado: ${err}`);
        return null;
      }
    },
    [selectedFluidId, points.length, layers, activeLayerId, showToast]
  );

  // Add or Update Point from Numerical Form
  const addOrUpdatePointFromInput = useCallback(
    async (
      pointId: string | null,
      name: string,
      _color: string,
      in1Type: string,
      in1Val: number,
      in2Type: string,
      in2Val: number
    ): Promise<DiagramPoint | null> => {
      try {
        const state = await thermoService.calculateState(
          selectedFluidId,
          in1Type,
          in1Val,
          in2Type,
          in2Val
        );

        const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[0];

        if (pointId) {
          // Update existing point (preserves layer color)
          setPoints((prev) =>
            prev.map((p) => {
              if (p.id === pointId) {
                const pLayer = layers.find((l) => l.id === p.layerId) || activeLayer;
                return {
                  ...p,
                  name,
                  color: pLayer?.color || p.color,
                  input1_type: in1Type,
                  input1_val: in1Val,
                  input2_type: in2Type,
                  input2_val: in2Val,
                  state,
                };
              }
              return p;
            })
          );
          showToast(`Punto '${name}' actualizado`);
          // Also recalculate any connections involving this point
          recalculateConnectionsForPoint(pointId, state);
          return null;
        } else {
          // Create new point with active layer's color
          const pointIndex = points.length + 1;
          const assignedColor = activeLayer?.color || POINT_COLORS[0];
          const newPoint: DiagramPoint = {
            id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            layerId: activeLayer?.id,
            name: name || `Punto ${pointIndex}`,
            color: assignedColor,
            input1_type: in1Type,
            input1_val: in1Val,
            input2_type: in2Type,
            input2_val: in2Val,
            state,
            labelOffset: { x: 20, y: -20 },
          };
          setPoints((prev) => [...prev, newPoint]);
          setSelectedPointId(newPoint.id);
          showToast(`Punto '${newPoint.name}' creado`);
          return newPoint;
        }
      } catch (err) {
        showToast(`Error de validación: ${err}`);
        return null;
      }
    },
    [selectedFluidId, points.length, layers, activeLayerId, showToast]
  );

  // Move Point by drag
  const movePoint = useCallback(
    async (id: string, h_kj_kg: number, p_bar: number) => {
      try {
        const state = await thermoService.calculateState(
          selectedFluidId,
          'H',
          h_kj_kg,
          'P',
          p_bar
        );

        setPoints((prev) =>
          prev.map((p) => {
            if (p.id === id) {
              return {
                ...p,
                input1_type: 'P',
                input1_val: state.pressure_bar,
                input2_type: 'h',
                input2_val: state.enthalpy_kj_kg,
                state,
              };
            }
            return p;
          })
        );
        recalculateConnectionsForPoint(id, state);
      } catch {
        // Drag out of bounds, silent
      }
    },
    [selectedFluidId]
  );

  const updatePointLabelOffset = useCallback((id: string, dx: number, dy: number) => {
    setPoints((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            labelOffset: { x: dx, y: dy },
          };
        }
        return p;
      })
    );
  }, []);

  const removePoint = useCallback(
    (id: string) => {
      setPoints((prev) => prev.filter((p) => p.id !== id));
      setConnections((prev) => prev.filter((c) => c.fromPointId !== id && c.toPointId !== id));
      if (selectedPointId === id) setSelectedPointId(null);
      showToast('Punto eliminado');
    },
    [selectedPointId, showToast]
  );

  // Recalculate connection thermodynamic deltas
  const recalculateConnectionsForPoint = useCallback(
    async (pointId: string, _updatedState: ThermodynamicState) => {
      setConnections((prev) =>
        prev.map((conn) => {
          if (conn.fromPointId === pointId || conn.toPointId === pointId) {
            // Updated asynchronously
            return conn;
          }
          return conn;
        })
      );
    },
    []
  );

  // Add connection between two points
  const addConnection = useCallback(
    async (fromId: string, toId: string, processType: ProcessType = 'direct_line'): Promise<DiagramConnection | null> => {
      if (fromId === toId) {
        showToast('No se puede conectar un punto consigo mismo');
        return null;
      }

      const p1 = points.find((p) => p.id === fromId);
      const p2 = points.find((p) => p.id === toId);

      if (!p1 || !p2) return null;

      try {
        const res = await thermoService.calculateProcessCurve(
          selectedFluidId,
          p1.state.enthalpy_kj_kg,
          p1.state.pressure_bar,
          p2.state.enthalpy_kj_kg,
          p2.state.pressure_bar,
          processType
        );

        const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[0];
        const newConn: DiagramConnection = {
          id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          layerId: activeLayer?.id || p1.layerId,
          fromPointId: fromId,
          toPointId: toId,
          name: `${p1.name} → ${p2.name}`,
          color: activeLayer?.color || p1.color,
          processType,
          delta_h_kj_kg: res.delta_h_kj_kg,
          delta_t_c: res.delta_t_c,
          delta_p_bar: res.delta_p_bar,
          delta_s_kj_kg_k: res.delta_s_kj_kg_k,
          pathPoints: res.intermediate_points,
        };

        setConnections((prev) => [...prev, newConn]);
        setSelectedConnectionId(newConn.id);
        showToast(`Proceso ${p1.name} → ${p2.name} añadido (Δh = ${res.delta_h_kj_kg.toFixed(1)} kJ/kg)`);
        return newConn;
      } catch (err) {
        showToast(`Error al calcular proceso: ${err}`);
        return null;
      }
    },
    [points, selectedFluidId, layers, activeLayerId, showToast]
  );

  const updateConnection = useCallback(
    async (id: string, updates: Partial<DiagramConnection>) => {
      const conn = connections.find((c) => c.id === id);
      if (!conn) return;

      const p1 = points.find((p) => p.id === (updates.fromPointId || conn.fromPointId));
      const p2 = points.find((p) => p.id === (updates.toPointId || conn.toPointId));
      const procType = updates.processType || conn.processType;

      if (p1 && p2) {
        try {
          const res = await thermoService.calculateProcessCurve(
            selectedFluidId,
            p1.state.enthalpy_kj_kg,
            p1.state.pressure_bar,
            p2.state.enthalpy_kj_kg,
            p2.state.pressure_bar,
            procType
          );

          setConnections((prev) =>
            prev.map((c) => {
              if (c.id === id) {
                return {
                  ...c,
                  ...updates,
                  delta_h_kj_kg: res.delta_h_kj_kg,
                  delta_t_c: res.delta_t_c,
                  delta_p_bar: res.delta_p_bar,
                  delta_s_kj_kg_k: res.delta_s_kj_kg_k,
                  pathPoints: res.intermediate_points,
                };
              }
              return c;
            })
          );
        } catch {
          setConnections((prev) =>
            prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
          );
        }
      }
    },
    [connections, points, selectedFluidId]
  );

  const removeConnection = useCallback(
    (id: string) => {
      setConnections((prev) => prev.filter((c) => c.id !== id));
      if (selectedConnectionId === id) setSelectedConnectionId(null);
      showToast('Conexión eliminada');
    },
    [selectedConnectionId, showToast]
  );

  // Close cycle automatically connecting last point to first point
  const closeCycle = useCallback(async () => {
    if (points.length < 3) {
      showToast('Se necesitan al menos 3 puntos para cerrar un ciclo');
      return;
    }
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    // Check if already connected
    const exists = connections.some(
      (c) => c.fromPointId === lastPoint.id && c.toPointId === firstPoint.id
    );

    if (exists) {
      showToast('El ciclo ya está cerrado');
      return;
    }

    await addConnection(lastPoint.id, firstPoint.id, 'direct_line');
    showToast('Ciclo cerrado');
  }, [points, connections, addConnection, showToast]);

  const newProject = useCallback(() => {
    const defaultLayer: DiagramLayer = {
      id: 'layer-1',
      name: 'Capa 1',
      color: '#38bdf8',
      isVisible: true,
    };
    setLayers([defaultLayer]);
    setActiveLayerId('layer-1');
    setPoints([]);
    setConnections([]);
    setSelectedPointId(null);
    setSelectedConnectionId(null);
    setProjectName('Nuevo Proyecto');
    setProjectNotes('');
    showToast('Nuevo proyecto inicializado');
  }, [showToast]);

  const saveProjectJson = useCallback((): string => {
    const data: ProjectData = {
      version: '1.0.0',
      name: projectName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      engine: 'CoolProp',
      engineVersion: catalog?.engine_version || '8.0.0',
      refrigerant: selectedFluidId,
      refrigerantDisplayName: selectedFluidItem?.display_name || selectedFluidId,
      layers,
      activeLayerId,
      points,
      connections,
      curveVisibility,
      notes: projectNotes,
    };
    return JSON.stringify(data, null, 2);
  }, [
    projectName,
    catalog?.engine_version,
    selectedFluidId,
    selectedFluidItem?.display_name,
    layers,
    activeLayerId,
    points,
    connections,
    curveVisibility,
    projectNotes,
  ]);

  const loadProjectJson = useCallback(
    async (jsonStr: string): Promise<boolean> => {
      try {
        const data: ProjectData = JSON.parse(jsonStr);
        if (!data.refrigerant || !Array.isArray(data.points)) {
          throw new Error('Formato JSON no válido');
        }

        setSelectedFluidId(data.refrigerant);
        setProjectName(data.name || 'Proyecto');
        setProjectNotes(data.notes || '');
        if (data.curveVisibility) setCurveVisibility(data.curveVisibility);

        if (data.layers && data.layers.length > 0) {
          setLayers(data.layers);
          setActiveLayerId(data.activeLayerId || data.layers[0].id);
        } else {
          const defaultLayer: DiagramLayer = {
            id: 'layer-1',
            name: 'Capa 1',
            color: data.points[0]?.color || '#38bdf8',
            isVisible: true,
          };
          setLayers([defaultLayer]);
          setActiveLayerId(defaultLayer.id);
        }

        // Recalculate all points to guarantee thermodynamic accuracy
        const recomputedPoints: DiagramPoint[] = [];
        for (const pt of data.points) {
          try {
            const state = await thermoService.calculateState(
              data.refrigerant,
              pt.input1_type,
              pt.input1_val,
              pt.input2_type,
              pt.input2_val
            );
            recomputedPoints.push({
              ...pt,
              state,
            });
          } catch {
            // Keep with fallback
            recomputedPoints.push(pt);
          }
        }
        setPoints(recomputedPoints);

        // Recompute connections
        const recomputedConns: DiagramConnection[] = [];
        for (const conn of data.connections || []) {
          const p1 = recomputedPoints.find((p) => p.id === conn.fromPointId);
          const p2 = recomputedPoints.find((p) => p.id === conn.toPointId);
          if (p1 && p2) {
            try {
              const res = await thermoService.calculateProcessCurve(
                data.refrigerant,
                p1.state.enthalpy_kj_kg,
                p1.state.pressure_bar,
                p2.state.enthalpy_kj_kg,
                p2.state.pressure_bar,
                conn.processType || 'direct_line'
              );
              recomputedConns.push({
                ...conn,
                delta_h_kj_kg: res.delta_h_kj_kg,
                delta_t_c: res.delta_t_c,
                delta_p_bar: res.delta_p_bar,
                delta_s_kj_kg_k: res.delta_s_kj_kg_k,
                pathPoints: res.intermediate_points,
              });
            } catch {
              recomputedConns.push(conn);
            }
          }
        }
        setConnections(recomputedConns);
        showToast(`Proyecto '${data.name}' cargado con éxito`);
        return true;
      } catch (err) {
        showToast(`Error al cargar archivo: ${err}`);
        return false;
      }
    },
    [showToast]
  );

  const exportPointsCsv = useCallback((): string => {
    const headers = [
      'Identificador',
      'Nombre',
      'Refrigerante',
      'Fase',
      'Presion [bar(a)]',
      'Temperatura [°C]',
      'Entalpia [kJ/kg]',
      'Entropia [kJ/(kg·K)]',
      'Volumen Especifico [m³/kg]',
      'Densidad [kg/m³]',
      'Titulo de Vapor (x) [-]',
    ];

    const rows = points.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.state.fluid_id,
      `"${p.state.phase}"`,
      p.state.pressure_bar.toFixed(4),
      p.state.temperature_c.toFixed(3),
      p.state.enthalpy_kj_kg.toFixed(3),
      p.state.entropy_kj_kg_k.toFixed(4),
      p.state.specific_volume_m3_kg.toFixed(6),
      p.state.density_kg_m3.toFixed(3),
      p.state.vapor_quality !== null && p.state.vapor_quality !== undefined
        ? p.state.vapor_quality.toFixed(4)
        : 'N/A',
    ]);

    return [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
  }, [points]);

  // Load Verified Sample Cycles
  const loadSampleCycle = useCallback(
    async (cycleType: 'r134a_standard' | 'r744_transcritical' | 'r717_industrial' | 'r407c_glide') => {
      if (cycleType === 'r134a_standard') {
        setSelectedFluidId('R134a');
        setProjectName('Ciclo Frigorífico Estándar - R134a');
        setProjectNotes('Ciclo de compresión de vapor clásico con 4 puntos termodinámicos.');

        // 1. Evaporación: -10 °C, recalentamiento 5K (T1 = -5 °C)
        // 2. Descarga de compresión isentrópica/real: P = 10.16 bar (~40°C cond), T2 = 55 °C
        // 3. Salida de condensador: P = 10.16 bar, subenfriamiento 5K (T3 = 35 °C)
        // 4. Salida de válvula de expansión isoentálpica: P4 = P1 (2.0 bar), h4 = h3
        const s1 = await thermoService.calculateState('R134a', 'P', 2.0, 'T', -5.0);
        const s2 = await thermoService.calculateState('R134a', 'P', 10.16, 'T', 55.0);
        const s3 = await thermoService.calculateState('R134a', 'P', 10.16, 'T', 35.0);
        const s4 = await thermoService.calculateState('R134a', 'P', 2.0, 'H', s3.enthalpy_kj_kg);

        const p1: DiagramPoint = {
          id: 'p1',
          name: '1 - Aspiración Compresor (-5°C)',
          color: '#38bdf8',
          input1_type: 'P',
          input1_val: 2.0,
          input2_type: 'T',
          input2_val: -5.0,
          state: s1,
          labelOffset: { x: -60, y: -40 },
        };
        const p2: DiagramPoint = {
          id: 'p2',
          name: '2 - Descarga Compresor (55°C)',
          color: '#f43f5e',
          input1_type: 'P',
          input1_val: 10.16,
          input2_type: 'T',
          input2_val: 55.0,
          state: s2,
          labelOffset: { x: 25, y: -25 },
        };
        const p3: DiagramPoint = {
          id: 'p3',
          name: '3 - Líquido Subenfriado (35°C)',
          color: '#10b981',
          input1_type: 'P',
          input1_val: 10.16,
          input2_type: 'T',
          input2_val: 35.0,
          state: s3,
          labelOffset: { x: -70, y: 25 },
        };
        const p4: DiagramPoint = {
          id: 'p4',
          name: '4 - Entrada Evaporador (Bifásico)',
          color: '#a855f7',
          input1_type: 'P',
          input1_val: 2.0,
          input2_type: 'H',
          input2_val: s3.enthalpy_kj_kg,
          state: s4,
          labelOffset: { x: 20, y: 20 },
        };

        const samplePoints = [p1, p2, p3, p4];
        setPoints(samplePoints);

        // Connections: 1->2 (Compresión isentrópica), 2->3 (Condensación isobárica), 3->4 (Expansión isoentálpica), 4->1 (Evaporación isobárica)
        const [c1, c2, c3, c4] = await Promise.all([
          thermoService.calculateProcessCurve('R134a', s1.enthalpy_kj_kg, s1.pressure_bar, s2.enthalpy_kj_kg, s2.pressure_bar, 'isentropic'),
          thermoService.calculateProcessCurve('R134a', s2.enthalpy_kj_kg, s2.pressure_bar, s3.enthalpy_kj_kg, s3.pressure_bar, 'isobaric'),
          thermoService.calculateProcessCurve('R134a', s3.enthalpy_kj_kg, s3.pressure_bar, s4.enthalpy_kj_kg, s4.pressure_bar, 'isenthalpic'),
          thermoService.calculateProcessCurve('R134a', s4.enthalpy_kj_kg, s4.pressure_bar, s1.enthalpy_kj_kg, s1.pressure_bar, 'isobaric'),
        ]);

        setConnections([
          { id: 'c1', fromPointId: 'p1', toPointId: 'p2', name: 'Compresión (1→2)', color: '#f43f5e', processType: 'isentropic', delta_h_kj_kg: c1.delta_h_kj_kg, delta_t_c: c1.delta_t_c, pathPoints: c1.intermediate_points },
          { id: 'c2', fromPointId: 'p2', toPointId: 'p3', name: 'Condensación (2→3)', color: '#10b981', processType: 'isobaric', delta_h_kj_kg: c2.delta_h_kj_kg, delta_t_c: c2.delta_t_c, pathPoints: c2.intermediate_points },
          { id: 'c3', fromPointId: 'p3', toPointId: 'p4', name: 'Expansión (3→4)', color: '#a855f7', processType: 'isenthalpic', delta_h_kj_kg: c3.delta_h_kj_kg, delta_t_c: c3.delta_t_c, pathPoints: c3.intermediate_points },
          { id: 'c4', fromPointId: 'p4', toPointId: 'p1', name: 'Evaporación (4→1)', color: '#38bdf8', processType: 'isobaric', delta_h_kj_kg: c4.delta_h_kj_kg, delta_t_c: c4.delta_t_c, pathPoints: c4.intermediate_points },
        ]);
        showToast('Ciclo estándar R134a cargado correctamente con 4 puntos');
      } else if (cycleType === 'r744_transcritical') {
        setSelectedFluidId('R744');
        setProjectName('Ciclo Transcrítico CO₂ (R744) - Gas Cooler');
        setProjectNotes('Ciclo transcrítico con presión de alta a 90 bar (supercrítica) y evaporación a 30 bar.');

        const s1 = await thermoService.calculateState('R744', 'P', 30.0, 'T', -2.0);
        const s2 = await thermoService.calculateState('R744', 'P', 90.0, 'T', 95.0);
        const s3 = await thermoService.calculateState('R744', 'P', 90.0, 'T', 35.0);
        const s4 = await thermoService.calculateState('R744', 'P', 30.0, 'H', s3.enthalpy_kj_kg);

        const p1: DiagramPoint = { id: 'p1', name: '1 - Aspiración CO₂ (30 bar, -2°C)', color: '#38bdf8', input1_type: 'P', input1_val: 30.0, input2_type: 'T', input2_val: -2.0, state: s1, labelOffset: { x: -70, y: -30 } };
        const p2: DiagramPoint = { id: 'p2', name: '2 - Descarga Transcrítica (90 bar, 95°C)', color: '#f43f5e', input1_type: 'P', input1_val: 90.0, input2_type: 'T', input2_val: 95.0, state: s2, labelOffset: { x: 25, y: -20 } };
        const p3: DiagramPoint = { id: 'p3', name: '3 - Salida Gas Cooler (90 bar, 35°C)', color: '#10b981', input1_type: 'P', input1_val: 90.0, input2_type: 'T', input2_val: 35.0, state: s3, labelOffset: { x: -80, y: -25 } };
        const p4: DiagramPoint = { id: 'p4', name: '4 - Entrada Evaporador CO₂ (30 bar)', color: '#a855f7', input1_type: 'P', input1_val: 30.0, input2_type: 'H', input2_val: s3.enthalpy_kj_kg, state: s4, labelOffset: { x: 20, y: 20 } };

        setPoints([p1, p2, p3, p4]);
        const [c1, c2, c3, c4] = await Promise.all([
          thermoService.calculateProcessCurve('R744', s1.enthalpy_kj_kg, s1.pressure_bar, s2.enthalpy_kj_kg, s2.pressure_bar, 'isentropic'),
          thermoService.calculateProcessCurve('R744', s2.enthalpy_kj_kg, s2.pressure_bar, s3.enthalpy_kj_kg, s3.pressure_bar, 'isobaric'),
          thermoService.calculateProcessCurve('R744', s3.enthalpy_kj_kg, s3.pressure_bar, s4.enthalpy_kj_kg, s4.pressure_bar, 'isenthalpic'),
          thermoService.calculateProcessCurve('R744', s4.enthalpy_kj_kg, s4.pressure_bar, s1.enthalpy_kj_kg, s1.pressure_bar, 'isobaric'),
        ]);

        setConnections([
          { id: 'c1', fromPointId: 'p1', toPointId: 'p2', name: 'Compresión (1→2)', color: '#f43f5e', processType: 'isentropic', delta_h_kj_kg: c1.delta_h_kj_kg, pathPoints: c1.intermediate_points },
          { id: 'c2', fromPointId: 'p2', toPointId: 'p3', name: 'Gas Cooler (2→3)', color: '#10b981', processType: 'isobaric', delta_h_kj_kg: c2.delta_h_kj_kg, pathPoints: c2.intermediate_points },
          { id: 'c3', fromPointId: 'p3', toPointId: 'p4', name: 'Expansión (3→4)', color: '#a855f7', processType: 'isenthalpic', delta_h_kj_kg: c3.delta_h_kj_kg, pathPoints: c3.intermediate_points },
          { id: 'c4', fromPointId: 'p4', toPointId: 'p1', name: 'Evaporación (4→1)', color: '#38bdf8', processType: 'isobaric', delta_h_kj_kg: c4.delta_h_kj_kg, pathPoints: c4.intermediate_points },
        ]);
        showToast('Ciclo transcrítico R744 (CO₂) cargado correctamente');
      } else if (cycleType === 'r717_industrial') {
        setSelectedFluidId('R717');
        setProjectName('Ciclo Industrial Amoníaco (R717)');
        setProjectNotes('Planta frigorífica industrial con R717.');

        const s1 = await thermoService.calculateState('R717', 'P', 2.36, 'T', -10.0);
        const s2 = await thermoService.calculateState('R717', 'P', 13.5, 'T', 115.0);
        const s3 = await thermoService.calculateState('R717', 'P', 13.5, 'T', 30.0);
        const s4 = await thermoService.calculateState('R717', 'P', 2.36, 'H', s3.enthalpy_kj_kg);

        const p1: DiagramPoint = { id: 'p1', name: '1 - Aspiración NH₃ (-10°C)', color: '#38bdf8', input1_type: 'P', input1_val: 2.36, input2_type: 'T', input2_val: -10.0, state: s1, labelOffset: { x: -60, y: -40 } };
        const p2: DiagramPoint = { id: 'p2', name: '2 - Descarga NH₃ (115°C)', color: '#f43f5e', input1_type: 'P', input1_val: 13.5, input2_type: 'T', input2_val: 115.0, state: s2, labelOffset: { x: 25, y: -20 } };
        const p3: DiagramPoint = { id: 'p3', name: '3 - Líquido Condensador (30°C)', color: '#10b981', input1_type: 'P', input1_val: 13.5, input2_type: 'T', input2_val: 30.0, state: s3, labelOffset: { x: -70, y: 25 } };
        const p4: DiagramPoint = { id: 'p4', name: '4 - Válvula Expansión NH₃', color: '#a855f7', input1_type: 'P', input1_val: 2.36, input2_type: 'H', input2_val: s3.enthalpy_kj_kg, state: s4, labelOffset: { x: 20, y: 20 } };

        setPoints([p1, p2, p3, p4]);
        const [c1, c2, c3, c4] = await Promise.all([
          thermoService.calculateProcessCurve('R717', s1.enthalpy_kj_kg, s1.pressure_bar, s2.enthalpy_kj_kg, s2.pressure_bar, 'isentropic'),
          thermoService.calculateProcessCurve('R717', s2.enthalpy_kj_kg, s2.pressure_bar, s3.enthalpy_kj_kg, s3.pressure_bar, 'isobaric'),
          thermoService.calculateProcessCurve('R717', s3.enthalpy_kj_kg, s3.pressure_bar, s4.enthalpy_kj_kg, s4.pressure_bar, 'isenthalpic'),
          thermoService.calculateProcessCurve('R717', s4.enthalpy_kj_kg, s4.pressure_bar, s1.enthalpy_kj_kg, s1.pressure_bar, 'isobaric'),
        ]);

        setConnections([
          { id: 'c1', fromPointId: 'p1', toPointId: 'p2', name: 'Compresión (1→2)', color: '#f43f5e', processType: 'isentropic', delta_h_kj_kg: c1.delta_h_kj_kg, pathPoints: c1.intermediate_points },
          { id: 'c2', fromPointId: 'p2', toPointId: 'p3', name: 'Condensación (2→3)', color: '#10b981', processType: 'isobaric', delta_h_kj_kg: c2.delta_h_kj_kg, pathPoints: c2.intermediate_points },
          { id: 'c3', fromPointId: 'p3', toPointId: 'p4', name: 'Expansión (3→4)', color: '#a855f7', processType: 'isenthalpic', delta_h_kj_kg: c3.delta_h_kj_kg, pathPoints: c3.intermediate_points },
          { id: 'c4', fromPointId: 'p4', toPointId: 'p1', name: 'Evaporación (4→1)', color: '#38bdf8', processType: 'isobaric', delta_h_kj_kg: c4.delta_h_kj_kg, pathPoints: c4.intermediate_points },
        ]);
        showToast('Ciclo industrial R717 (Amoníaco) cargado correctamente');
      } else if (cycleType === 'r407c_glide') {
        setSelectedFluidId('R407C');
        setProjectName('Ciclo Mezcla Zeotrópica (R407C con Glide)');
        setProjectNotes('Ciclo con R407C mostrando el deslizamiento de temperatura (glide) en evaporador y condensador.');

        const s1 = await thermoService.calculateState('R407C', 'P', 4.5, 'T', 5.0);
        const s2 = await thermoService.calculateState('R407C', 'P', 18.0, 'T', 75.0);
        const s3 = await thermoService.calculateState('R407C', 'P', 18.0, 'T', 40.0);
        const s4 = await thermoService.calculateState('R407C', 'P', 4.5, 'H', s3.enthalpy_kj_kg);

        const p1: DiagramPoint = { id: 'p1', name: '1 - Aspiración R407C (5°C)', color: '#38bdf8', input1_type: 'P', input1_val: 4.5, input2_type: 'T', input2_val: 5.0, state: s1, labelOffset: { x: -60, y: -40 } };
        const p2: DiagramPoint = { id: 'p2', name: '2 - Descarga R407C (75°C)', color: '#f43f5e', input1_type: 'P', input1_val: 18.0, input2_type: 'T', input2_val: 75.0, state: s2, labelOffset: { x: 25, y: -20 } };
        const p3: DiagramPoint = { id: 'p3', name: '3 - Salida Condensador R407C (40°C)', color: '#10b981', input1_type: 'P', input1_val: 18.0, input2_type: 'T', input2_val: 40.0, state: s3, labelOffset: { x: -70, y: 25 } };
        const p4: DiagramPoint = { id: 'p4', name: '4 - Entrada Evaporador R407C', color: '#a855f7', input1_type: 'P', input1_val: 4.5, input2_type: 'H', input2_val: s3.enthalpy_kj_kg, state: s4, labelOffset: { x: 20, y: 20 } };

        setPoints([p1, p2, p3, p4]);
        const [c1, c2, c3, c4] = await Promise.all([
          thermoService.calculateProcessCurve('R407C', s1.enthalpy_kj_kg, s1.pressure_bar, s2.enthalpy_kj_kg, s2.pressure_bar, 'isentropic'),
          thermoService.calculateProcessCurve('R407C', s2.enthalpy_kj_kg, s2.pressure_bar, s3.enthalpy_kj_kg, s3.pressure_bar, 'isobaric'),
          thermoService.calculateProcessCurve('R407C', s3.enthalpy_kj_kg, s3.pressure_bar, s4.enthalpy_kj_kg, s4.pressure_bar, 'isenthalpic'),
          thermoService.calculateProcessCurve('R407C', s4.enthalpy_kj_kg, s4.pressure_bar, s1.enthalpy_kj_kg, s1.pressure_bar, 'isobaric'),
        ]);

        setConnections([
          { id: 'c1', fromPointId: 'p1', toPointId: 'p2', name: 'Compresión (1→2)', color: '#f43f5e', processType: 'isentropic', delta_h_kj_kg: c1.delta_h_kj_kg, pathPoints: c1.intermediate_points },
          { id: 'c2', fromPointId: 'p2', toPointId: 'p3', name: 'Condensación (2→3)', color: '#10b981', processType: 'isobaric', delta_h_kj_kg: c2.delta_h_kj_kg, pathPoints: c2.intermediate_points },
          { id: 'c3', fromPointId: 'p3', toPointId: 'p4', name: 'Expansión (3→4)', color: '#a855f7', processType: 'isenthalpic', delta_h_kj_kg: c3.delta_h_kj_kg, pathPoints: c3.intermediate_points },
          { id: 'c4', fromPointId: 'p4', toPointId: 'p1', name: 'Evaporación con Glide (4→1)', color: '#38bdf8', processType: 'isobaric', delta_h_kj_kg: c4.delta_h_kj_kg, pathPoints: c4.intermediate_points },
        ]);
        showToast('Ciclo R407C (con Temperature Glide) cargado correctamente');
      }
    },
    [showToast]
  );

  return (
    <ProjectContext.Provider
      value={{
        catalog,
        selectedFluidId,
        selectedFluidItem,
        fluidInfo,
        setSelectedFluidId,
        dataset,
        diagramCurves,
        isLoadingCurves,
        curvesError,
        curveVisibility,
        setCurveVisibility,
        projectName,
        setProjectName,
        projectNotes,
        setProjectNotes,
        layers,
        activeLayerId,
        setActiveLayerId,
        addLayer,
        updateLayer,
        removeLayer,
        points,
        selectedPointId,
        setSelectedPointId,
        addPointFromCoordinates,
        addOrUpdatePointFromInput,
        movePoint,
        updatePointLabelOffset,
        removePoint,
        connections,
        selectedConnectionId,
        setSelectedConnectionId,
        addConnection,
        updateConnection,
        removeConnection,
        closeCycle,
        toolMode,
        setToolMode,
        connectSourcePointId,
        setConnectSourcePointId,
        sidebarTab,
        setSidebarTab,
        themeMode,
        setThemeMode,
        toggleThemeMode,
        diagramTheme,
        setDiagramTheme,
        engineMode,
        setEngineMode,
        mainViewMode,
        setMainViewMode,
        zoomIn,
        zoomOut,
        resetView,
        registerDiagramActions,
        toastMessage,
        showToast,
        isAvailabilityModalOpen,
        setIsAvailabilityModalOpen,
        isSampleCyclesModalOpen,
        setIsSampleCyclesModalOpen,
        newProject,
        saveProjectJson,
        loadProjectJson,
        exportPointsCsv,
        loadSampleCycle,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
