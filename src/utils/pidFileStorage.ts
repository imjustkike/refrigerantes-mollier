import { Node, Edge } from '@xyflow/react';
import { InstallationSchema, SimChamber, SimElectricalSupply } from '../types/pidSimulation';
import { SchematicNodeData, SchematicEdgeData } from '../types/schematic';

export interface PidProjectFile {
  formatVersion: '2.0.0';
  app: 'CoolMollier-PID';
  savedAt: string;
  metadata: {
    name: string;
    description?: string;
    author?: string;
  };
  installation: InstallationSchema;
  flowState: {
    nodes: Node<SchematicNodeData>[];
    edges: Edge<SchematicEdgeData>[];
  };
}

export const DEFAULT_ELECTRICAL_SUPPLY: SimElectricalSupply = {
  supply_type: 'ThreePhase400V',
  voltage_v: 400.0,
  frequency_hz: 50.0,
  max_contracted_power_kw: 25.0,
  demand_control_enabled: true,
  demand_limit_kw: 20.0,
  breakers: [
    {
      id: 'b_main',
      name: 'Interruptor General IGA',
      tag: 'IGA',
      rated_current_a: 50.0,
      curve_type: 'C',
      is_main: true,
      is_closed: true,
      trip_reason: null,
      thermal_memory: 0.0,
    },
    {
      id: 'b_comp1',
      name: 'Disyuntor Compresor 1',
      tag: 'Q1',
      rated_current_a: 16.0,
      curve_type: 'D',
      is_main: false,
      is_closed: true,
      trip_reason: null,
      thermal_memory: 0.0,
    },
    {
      id: 'b_comp2',
      name: 'Disyuntor Compresor 2',
      tag: 'Q2',
      rated_current_a: 16.0,
      curve_type: 'D',
      is_main: false,
      is_closed: true,
      trip_reason: null,
      thermal_memory: 0.0,
    },
    {
      id: 'b_cond',
      name: 'Ventilador Condensador',
      tag: 'Q3',
      rated_current_a: 6.0,
      curve_type: 'C',
      is_main: false,
      is_closed: true,
      trip_reason: null,
      thermal_memory: 0.0,
    },
    {
      id: 'b_evap',
      name: 'Ventiladores Evaporador',
      tag: 'Q4',
      rated_current_a: 4.0,
      curve_type: 'C',
      is_main: false,
      is_closed: true,
      trip_reason: null,
      thermal_memory: 0.0,
    },
    {
      id: 'b_defrost',
      name: 'Resistencias Desescarche',
      tag: 'Q5',
      rated_current_a: 16.0,
      curve_type: 'B',
      is_main: false,
      is_closed: true,
      trip_reason: null,
      thermal_memory: 0.0,
    },
  ],
};

export const DEFAULT_CHAMBER: SimChamber = {
  id: 'ch_01',
  name: 'Cámara de Conservación Frutas y Verduras',
  dimensions: {
    length_m: 5.0,
    width_m: 4.0,
    height_m: 3.0,
  },
  u_value_w_m2_k: 0.28,
  ambient_temp_ext_c: 32.0,
  setpoint_temp_c: 2.0,
  hysteresis_k: 2.0,
  current_air_temp_c: 18.0,
  product_mass_kg: 3500.0,
  product_cp_kj_kg_k: 3.8,
  product_temp_c: 18.0,
  is_door_open: false,
  internal_lights_w: 150.0,
  occupancy_people: 0,
  is_defrost_active: false,
  defrost_heater_power_kw: 3.5,
};

/**
 * Convierte los nodos y aristas de React Flow en un esquema de simulación Rust
 */
export function buildInstallationSchemaFromFlow(
  name: string,
  refrigerant: string,
  totalChargeKg: number,
  currentChargeKg: number,
  nodes: Node<SchematicNodeData>[],
  edges: Edge<SchematicEdgeData>[],
  electrical?: SimElectricalSupply,
  chambers?: SimChamber[]
): InstallationSchema {
  const equipments = nodes.map((n, idx) => {
    const isCompressor = n.data.componentType.includes('compressor');
    return {
      id: n.id,
      tag: (n.data.tag as string) || `EQ-${idx + 1}`,
      label: (n.data.label as string) || n.data.componentType,
      component_type: n.data.componentType,
      is_energized: !!n.data.isEnergized,
      nominal_capacity_kw: n.data.capacityKw ?? null,
      nominal_power_kw: n.data.powerKw ?? null,
      displacement_m3_h: n.data.displacementM3h ?? null,
      superheat_setpoint_k: n.data.superheatK ?? null,
      subcooling_k: n.data.subcoolingK ?? null,
      internal_volume_l: n.data.volumeL ?? null,
      valve_opening_percent: n.data.openingPercent ?? null,
      is_valve_open: true,
      breaker_id: isCompressor ? (idx === 0 ? 'b_comp1' : 'b_comp2') : null,
      chamber_id: n.data.componentType.includes('evaporator') ? 'ch_01' : null,
      is_lead_compressor: isCompressor ? idx === 0 : null,
      min_off_time_s: isCompressor ? 180.0 : null,
      start_inrush_multiplier: isCompressor ? 5.5 : null,
    };
  });

  const isElectricEdge = (e: Edge<SchematicEdgeData>) =>
    e.type === 'electricWire' ||
    e.data?.edgeType === 'electricWire' ||
    Boolean(e.data?.pipeState?.startsWith('electric_'));

  const refrigerantEdges = edges.filter((e) => !isElectricEdge(e));
  const electricEdges = edges.filter((e) => isElectricEdge(e));

  const pipes = refrigerantEdges.map((e) => ({
    id: e.id,
    source_node_id: e.source,
    source_port: e.sourceHandle || 'default_out',
    target_node_id: e.target,
    target_port: e.targetHandle || 'default_in',
    diameter_mm: e.data?.diameterMm ?? 16.0,
    length_m: 5.0,
    pipe_state_category: e.data?.pipeState || 'discharge_superheated',
  }));

  const wires = electricEdges.map((e) => ({
    id: e.id,
    source_node_id: e.source,
    source_port: e.sourceHandle || 'term_1',
    target_node_id: e.target,
    target_port: e.targetHandle || 'term_2',
    wire_function: e.data?.wireFunction || (e.data?.pipeState?.replace('electric_', '') as string) || 'phase',
    wire_section_mm2: e.data?.wireSectionMm2 ?? 2.5,
    wire_tag: e.data?.wireTag || e.data?.customLabel || null,
    pipe_state_category: e.data?.pipeState || 'electric_phase',
  }));

  return {
    version: '2.0.0',
    name,
    refrigerant: refrigerant || 'R134a',
    total_charge_kg: totalChargeKg || 18.0,
    current_charge_kg: currentChargeKg || totalChargeKg || 18.0,
    leak_rate_kg_h: 0.0,
    ambient_temp_c: 32.0,
    electrical: electrical || DEFAULT_ELECTRICAL_SUPPLY,
    chambers: chambers && chambers.length > 0 ? chambers : [DEFAULT_CHAMBER],
    equipments,
    pipes,
    wires,
  };
}

/**
 * Exporta el esquema P&ID a formato JSON versionado
 */
export function exportPidProjectJson(
  projectName: string,
  refrigerant: string,
  totalChargeKg: number,
  currentChargeKg: number,
  nodes: Node<SchematicNodeData>[],
  edges: Edge<SchematicEdgeData>[],
  electrical?: SimElectricalSupply,
  chambers?: SimChamber[]
): string {
  const schema = buildInstallationSchemaFromFlow(
    projectName,
    refrigerant,
    totalChargeKg,
    currentChargeKg,
    nodes,
    edges,
    electrical,
    chambers
  );

  const fileData: PidProjectFile = {
    formatVersion: '2.0.0',
    app: 'CoolMollier-PID',
    savedAt: new Date().toISOString(),
    metadata: {
      name: projectName,
      description: `Instalación frigorífica ${refrigerant} con simulación dinámica`,
    },
    installation: schema,
    flowState: {
      nodes,
      edges,
    },
  };

  return JSON.stringify(fileData, null, 2);
}

/**
 * Importa y migra esquemas antiguos o versionados
 */
export function importPidProjectJson(jsonStr: string): {
  success: boolean;
  error?: string;
  installation?: InstallationSchema;
  nodes?: Node<SchematicNodeData>[];
  edges?: Edge<SchematicEdgeData>[];
} {
  try {
    const parsed = JSON.parse(jsonStr);

    // Caso 1: Archivo versionado 2.0.0
    if (parsed.formatVersion === '2.0.0' && parsed.installation && parsed.flowState) {
      return {
        success: true,
        installation: parsed.installation,
        nodes: parsed.flowState.nodes,
        edges: parsed.flowState.edges,
      };
    }

    // Caso 2: Esquema legacy (lista de nodos o formato pre-simulador)
    if (Array.isArray(parsed) || parsed.nodes) {
      const rawNodes: Node<SchematicNodeData>[] = Array.isArray(parsed)
        ? parsed
        : parsed.nodes || [];
      const rawEdges: Edge<SchematicEdgeData>[] = parsed.edges || [];

      // Migrar propiedades de nodos
      const migratedNodes = rawNodes.map((node) => {
        const data = { ...node.data };
        // Si capacityKw y powerKw estaban idénticos por el bug anterior, corregir según componente
        if (data.capacityKw && data.powerKw && data.capacityKw === data.powerKw) {
          if (data.componentType.includes('compressor')) {
            data.capacityKw = undefined; // compresor usa powerKw
          } else if (data.componentType.includes('condenser') || data.componentType.includes('evaporator')) {
            data.powerKw = undefined; // intercambiadores usan capacityKw
          }
        }
        return {
          ...node,
          data,
        };
      });

      const migratedSchema = buildInstallationSchemaFromFlow(
        'Instalación Migrada',
        'R134a',
        18.0,
        18.0,
        migratedNodes,
        rawEdges
      );

      return {
        success: true,
        installation: migratedSchema,
        nodes: migratedNodes,
        edges: rawEdges,
      };
    }

    return {
      success: false,
      error: 'Formato de archivo no reconocido o datos dañados.',
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: `Error de sintaxis JSON: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
