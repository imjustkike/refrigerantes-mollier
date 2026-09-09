import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Connection,
  ConnectionMode,
  Controls,
  Edge,
  MiniMap,
  Node,
  OnConnect,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { SchematicEdgeData, SchematicNodeData, SchematicComponentType, PipeStateCategory } from '../../types/schematic';
import { COMPONENT_DEFINITIONS } from './symbols/componentDefinitions';
import { SchematicGenericNode } from './nodes/SchematicGenericNode';
import { RefrigerantPipeEdge } from './edges/RefrigerantPipeEdge';
import { ComponentPalette } from './ComponentPalette';
import { ComponentPropertyPanel } from './ComponentPropertyPanel';
import { SchematicToolbar } from './SchematicToolbar';
import { NewSchematicModal } from './NewSchematicModal';
import { SCHEMATIC_PRESETS } from './templates/schematicTemplates';
import { useProject } from '../../context/ProjectContext';

type SchematicNode = Node<SchematicNodeData>;
type SchematicEdge = Edge<SchematicEdgeData>;

const STORAGE_NODES_KEY = 'coolmollier_schematic_nodes';
const STORAGE_EDGES_KEY = 'coolmollier_schematic_edges';

const nodeTypes = {
  schematicNode: SchematicGenericNode,
};

const edgeTypes = {
  refrigerantPipe: RefrigerantPipeEdge,
};

const defaultEdgeOptions = {
  type: 'refrigerantPipe',
  data: {
    pipeState: 'discharge_superheated' as PipeStateCategory,
    isAnimated: true,
  },
};

const getInitialNodes = (): SchematicNode[] => {
  try {
    const saved = localStorage.getItem(STORAGE_NODES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading saved schematic nodes', e);
  }
  return SCHEMATIC_PRESETS[0].nodes as SchematicNode[];
};

const getInitialEdges = (): SchematicEdge[] => {
  try {
    const saved = localStorage.getItem(STORAGE_EDGES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading saved schematic edges', e);
  }
  return SCHEMATIC_PRESETS[0].edges as SchematicEdge[];
};

const SchematicCanvasContent: React.FC = () => {
  const { themeMode, showToast } = useProject();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();

  // Load initial nodes & edges from localStorage or default preset
  const [nodes, setNodes, onNodesChange] = useNodesState<SchematicNode>(getInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState<SchematicEdge>(getInitialEdges());

  // Persist nodes on update
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_NODES_KEY, JSON.stringify(nodes));
    } catch (e) {
      console.error('Error saving schematic nodes', e);
    }
  }, [nodes]);

  // Persist edges on update
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_EDGES_KEY, JSON.stringify(edges));
    } catch (e) {
      console.error('Error saving schematic edges', e);
    }
  }, [edges]);

  // Selection state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [isAnimationRunning, setIsAnimationRunning] = useState(true);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Connect handler
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: 'refrigerantPipe',
            data: {
              pipeState: 'discharge_superheated',
              isAnimated: isAnimationRunning,
            },
          },
          eds
        )
      );
    },
    [isAnimationRunning, setEdges]
  );

  // Drag & Drop component from palette into canvas
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      let componentType: SchematicComponentType | null = null;
      try {
        const dtType =
          event.dataTransfer.getData('application/reactflow-component-type') ||
          event.dataTransfer.getData('text/plain');
        if (dtType && COMPONENT_DEFINITIONS[dtType as SchematicComponentType]) {
          componentType = dtType as SchematicComponentType;
        }
      } catch (e) {}

      // Fallback to window reference for WebKit/Tauri webview
      if (!componentType && (window as any).__draggedSchematicComponent) {
        componentType = (window as any).__draggedSchematicComponent as SchematicComponentType;
      }

      if (!componentType || !COMPONENT_DEFINITIONS[componentType]) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const def = COMPONENT_DEFINITIONS[componentType];
      const newNodeId = `node_${Date.now()}`;

      const newNode: SchematicNode = {
        id: newNodeId,
        type: 'schematicNode',
        position,
        data: {
          componentType,
          label: def.defaultLabel,
          tag: `${def.defaultTagPrefix}-${nodes.length + 1}`,
          modelNumber: def.defaultModel,
          isEnergized: isAnimationRunning,
          ...(def.defaultSpecs || {}),
        },
      };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(newNodeId);
      setSelectedEdgeId(null);
      showToast(`Añadido al circuito: ${def.name}`);
      (window as any).__draggedSchematicComponent = null;
    },
    [screenToFlowPosition, nodes.length, isAnimationRunning, setNodes, showToast]
  );

  // Add Component directly to canvas center
  const handleAddComponent = useCallback(
    (componentType: SchematicComponentType) => {
      const def = COMPONENT_DEFINITIONS[componentType];
      if (!def) return;

      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      const centerX = bounds ? bounds.left + bounds.width / 2 : window.innerWidth / 2;
      const centerY = bounds ? bounds.top + bounds.height / 2 : window.innerHeight / 2;

      const position = screenToFlowPosition({
        x: centerX + (Math.random() * 40 - 20),
        y: centerY + (Math.random() * 40 - 20),
      });

      const newNodeId = `node_${Date.now()}`;
      const newNode: SchematicNode = {
        id: newNodeId,
        type: 'schematicNode',
        position,
        data: {
          componentType,
          label: def.defaultLabel,
          tag: `${def.defaultTagPrefix}-${nodes.length + 1}`,
          modelNumber: def.defaultModel,
          isEnergized: isAnimationRunning,
          ...(def.defaultSpecs || {}),
        },
      };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(newNodeId);
      setSelectedEdgeId(null);
      showToast(`Añadido: ${def.name}`);
    },
    [screenToFlowPosition, nodes.length, isAnimationRunning, setNodes, showToast]
  );

  // Selection change
  const onSelectionChange = useCallback(({ nodes: selNodes, edges: selEdges }: { nodes: Node[]; edges: Edge[] }) => {
    if (selNodes.length > 0) {
      setSelectedNodeId(selNodes[0].id);
      setSelectedEdgeId(null);
    } else if (selEdges.length > 0) {
      setSelectedEdgeId(selEdges[0].id);
      setSelectedNodeId(null);
    } else {
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    }
  }, []);

  // Update Node Data
  const handleUpdateNodeData = useCallback(
    (nodeId: string, updates: Partial<SchematicNodeData>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                ...updates,
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  // Update Edge Data
  const handleUpdateEdgeData = useCallback(
    (edgeId: string, updates: Partial<SchematicEdgeData>) => {
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === edgeId) {
            return {
              ...edge,
              data: {
                pipeState: 'discharge_superheated',
                ...edge.data,
                ...updates,
              },
            };
          }
          return edge;
        })
      );
    },
    [setEdges]
  );

  // Delete Selected
  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeId) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
      setSelectedNodeId(null);
    }
    if (selectedEdgeId) {
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdgeId));
      setSelectedEdgeId(null);
    }
  }, [selectedNodeId, selectedEdgeId, setNodes, setEdges]);

  // Duplicate Selected Node
  const handleDuplicateSelected = useCallback(() => {
    if (!selectedNodeId) return;
    const target = nodes.find((n) => n.id === selectedNodeId);
    if (!target) return;

    const newId = `node_${Date.now()}`;
    const duplicatedNode: SchematicNode = {
      ...target,
      id: newId,
      position: {
        x: target.position.x + 30,
        y: target.position.y + 30,
      },
      data: {
        ...target.data,
        tag: `${target.data.tag || 'ITEM'}_copy`,
      },
      selected: true,
    };

    setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), duplicatedNode]);
    setSelectedNodeId(newId);
  }, [selectedNodeId, nodes, setNodes]);

  // Load Preset
  const handleLoadPreset = useCallback(
    (presetId: string) => {
      const preset = SCHEMATIC_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;

      setNodes(preset.nodes as SchematicNode[]);
      setEdges(preset.edges as SchematicEdge[]);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);

      setTimeout(() => {
        fitView({ padding: 0.2, duration: 400 });
      }, 100);

      showToast(`Plantilla cargada: ${preset.name}`);
    },
    [fitView, setNodes, setEdges, showToast]
  );

  // New Schematic Modal trigger
  const handleNewSchematic = useCallback(() => {
    setIsNewModalOpen(true);
  }, []);

  // Create Blank Schematic
  const handleSelectBlank = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    try {
      localStorage.removeItem(STORAGE_NODES_KEY);
      localStorage.removeItem(STORAGE_EDGES_KEY);
    } catch (e) {}
    showToast('Lienzo en blanco creado listo para diseñar.');
  }, [setNodes, setEdges, showToast]);

  // Clear Canvas (Borrar todo el esquema)
  const handleClearCanvas = useCallback(() => {
    if (window.confirm('¿Está seguro de que desea eliminar todos los componentes y conexiones del esquema?')) {
      setNodes([]);
      setEdges([]);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      try {
        localStorage.removeItem(STORAGE_NODES_KEY);
        localStorage.removeItem(STORAGE_EDGES_KEY);
      } catch (e) {}
      showToast('Esquema vaciado. Todos los componentes han sido eliminados.');
    }
  }, [setNodes, setEdges, showToast]);

  // Toggle animation & machine running status
  const handleToggleAnimation = useCallback(() => {
    const nextState = !isAnimationRunning;
    setIsAnimationRunning(nextState);
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        data: {
          pipeState: 'discharge_superheated',
          ...e.data,
          isAnimated: nextState,
        },
      }))
    );
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isEnergized: nextState,
        },
      }))
    );
    showToast(nextState ? 'Circulación de refrigerante iniciada' : 'Circulación de refrigerante detenida');
  }, [isAnimationRunning, setEdges, setNodes, showToast]);

  // Export PNG
  const handleExportPng = useCallback(() => {
    const flowEl = reactFlowWrapper.current?.querySelector('.react-flow__viewport') as HTMLElement | null;
    if (!flowEl) return;

    const svgEl = reactFlowWrapper.current?.querySelector('.react-flow__edges') as SVGSVGElement | null;
    if (!svgEl) return;

    showToast('Generando captura en alta resolución...');

    const canvas = document.createElement('canvas');
    const bbox = flowEl.getBoundingClientRect();
    canvas.width = bbox.width * 2;
    canvas.height = bbox.height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(2, 2);
    ctx.fillStyle = themeMode === 'dark' ? '#0f1115' : '#f8fafc';
    ctx.fillRect(0, 0, bbox.width, bbox.height);

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.download = 'esquema_circuito_refrigeracion.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
      showToast('Esquema exportado como PNG.');
    };
  }, [themeMode, showToast]);

  // Export SVG
  const handleExportSvg = useCallback(() => {
    const svgEl = reactFlowWrapper.current?.querySelector('.react-flow__edges') as SVGSVGElement | null;
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'esquema_circuito_refrigeracion.svg';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Esquema vectorial SVG descargado.');
  }, [showToast]);

  // Keyboard Shortcuts (Delete, Backspace, Ctrl+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        handleDuplicateSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDeleteSelected, handleDuplicateSelected]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId) || null;

  return (
    <div className="flex w-full h-full relative overflow-hidden bg-slate-100 dark:bg-[#0c0e12]">
      {/* Left Collapsible Component Palette */}
      <ComponentPalette
        isOpen={isPaletteOpen}
        onToggle={() => setIsPaletteOpen(!isPaletteOpen)}
        onAddComponent={handleAddComponent}
      />

      {/* Center Graph Workspace */}
      <div
        className="flex-1 h-full relative"
        ref={reactFlowWrapper}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDrop={onDrop}
      >
        {/* Floating Top Toolbar */}
        <SchematicToolbar
          onLoadPreset={handleLoadPreset}
          onClearCanvas={handleClearCanvas}
          onNewSchematic={handleNewSchematic}
          onFitView={() => fitView({ padding: 0.2, duration: 400 })}
          onExportPng={handleExportPng}
          onExportSvg={handleExportSvg}
          isAnimationRunning={isAnimationRunning}
          onToggleAnimation={handleToggleAnimation}
        />

        <ReactFlow<SchematicNode, SchematicEdge>
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          connectionMode={ConnectionMode.Loose}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onSelectionChange={onSelectionChange}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          colorMode={themeMode === 'dark' ? 'dark' : 'light'}
          className="schematic-flow-canvas"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1.5}
            color={themeMode === 'dark' ? '#272b35' : '#cbd5e1'}
          />
          <Controls position="bottom-left" showInteractive={false} className="shadow-lg rounded-xl overflow-hidden" />
          <MiniMap
            position="bottom-right"
            nodeColor={() => (themeMode === 'dark' ? '#38bdf8' : '#0284c7')}
            maskColor={themeMode === 'dark' ? 'rgba(0, 0, 0, 0.75)' : 'rgba(255, 255, 255, 0.75)'}
            style={{ width: 140, height: 95 }}
          />
        </ReactFlow>
      </div>

      {/* Right Properties Inspector */}
      {(selectedNode || selectedEdge) && (
        <ComponentPropertyPanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onUpdateNodeData={handleUpdateNodeData}
          onUpdateEdgeData={handleUpdateEdgeData}
          onDeleteSelected={handleDeleteSelected}
          onDuplicateSelected={handleDuplicateSelected}
          onClose={() => {
            setSelectedNodeId(null);
            setSelectedEdgeId(null);
          }}
        />
      )}

      {/* New Schematic Selection Modal */}
      <NewSchematicModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSelectPreset={handleLoadPreset}
        onSelectBlank={handleSelectBlank}
      />
    </div>
  );
};

export const SchematicCanvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <SchematicCanvasContent />
    </ReactFlowProvider>
  );
};
