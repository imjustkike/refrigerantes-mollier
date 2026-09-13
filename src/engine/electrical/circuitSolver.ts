import { SchematicEdge, SchematicNode } from '../../types/schematic';

interface AdjacencyEdge {
  toTerminal: string;
  edgeId?: string;
  isInternal?: boolean;
}

interface SourceConstraint {
  nodeId: string;
  negTerminal: string;
  posTerminal: string;
  voltage: number;
}

/**
 * Normalizes any port handle or alias to its canonical terminal name for a component.
 */
function normalizeTerminal(componentType: string, handleId: string): string {
  const h = handleId.trim();

  switch (componentType) {
    case 'battery_dc_cell':
    case 'cell_dc_simple':
    case 'dc_power_source':
      if (['pos', '+', 'terminal_1', 'top'].includes(h)) return 'pos';
      if (['neg', '-', 'terminal_2', 'bottom'].includes(h)) return 'neg';
      return h;

    case 'power_supply_dc_24v':
      if (['dc_plus', '+24V', '+', 'pos'].includes(h)) return 'dc_plus';
      if (['dc_minus', '0V', 'GND', '-', 'neg'].includes(h)) return 'dc_minus';
      if (['ac_l', 'L', 'phase'].includes(h)) return 'ac_l';
      if (['ac_n', 'N', 'neutral'].includes(h)) return 'ac_n';
      return h;

    case 'power_source_ac':
      if (['phase', 'L', 'l', 'top'].includes(h)) return 'phase';
      if (['neutral', 'N', 'n', 'bottom'].includes(h)) return 'neutral';
      return h;

    case 'power_source_ac_3p':
      if (['l1', 'L1'].includes(h)) return 'l1';
      if (['l2', 'L2'].includes(h)) return 'l2';
      if (['l3', 'L3'].includes(h)) return 'l3';
      if (['neutral', 'N', 'n'].includes(h)) return 'neutral';
      if (['pe', 'PE', 'ground'].includes(h)) return 'pe';
      return h;

    case 'electrical_panel_main':
    case 'power_supply_terminal':
      if (['mains_in', 'L1', 'L', 'phase'].includes(h)) return 'mains_in';
      if (['neutral', 'N', 'n'].includes(h)) return 'neutral';
      if (['pe', 'PE', 'earth'].includes(h)) return 'pe';
      return h;

    case 'switch_spst':
    case 'switch_disconnector':
      if (['in', '1', 'L1_IN', 'left'].includes(h)) return 'in';
      if (['out', '2', 'L1_OUT', 'right'].includes(h)) return 'out';
      return h;

    case 'switch_spdt':
      if (['common', 'COM', 'c', 'in', 'left'].includes(h)) return 'common';
      if (['l1', '1', 'out1', 'top'].includes(h)) return 'l1';
      if (['l2', '2', 'out2', 'bottom'].includes(h)) return 'l2';
      return h;

    case 'pushbutton_simple':
    case 'pushbutton_no':
      if (['in', '13', '1', 'left'].includes(h)) return 'in';
      if (['out', '14', '2', 'right'].includes(h)) return 'out';
      return h;

    case 'pushbutton_nc_simple':
    case 'pushbutton_nc':
      if (['in', '11', '1', 'left'].includes(h)) return 'in';
      if (['out', '12', '2', 'right'].includes(h)) return 'out';
      return h;

    case 'emergency_stop_button':
      if (['term_1', '11', '1', 'in', 'top'].includes(h)) return 'term_1';
      if (['term_2', '12', '2', 'out', 'bottom'].includes(h)) return 'term_2';
      return h;

    case 'selector_switch_rotary':
      if (['common_in', 'c', 'C', 'in', 'top'].includes(h)) return 'common_in';
      if (['manual_out', 'man', 'MAN', '1', 'left'].includes(h)) return 'manual_out';
      if (['auto_out', 'auto', 'AUTO', '2', 'right'].includes(h)) return 'auto_out';
      return h;

    case 'circuit_breaker_mcb':
    case 'motor_protection_switch':
      if (['line_in', 'L-IN', '1', 'in', 'top'].includes(h)) return 'line_in';
      if (['load_out', 'T-OUT', '2', 'out', 'bottom'].includes(h)) return 'load_out';
      return h;

    case 'fuse_disconnect':
      if (['in', '1', 'left'].includes(h)) return 'in';
      if (['out', '2', 'right'].includes(h)) return 'out';
      return h;

    case 'residual_current_device':
      if (['in_l', '1', 'L_IN'].includes(h)) return 'in_l';
      if (['out_l', '2', 'L_OUT'].includes(h)) return 'out_l';
      if (['in_n', 'N_IN', 'N'].includes(h)) return 'in_n';
      if (['out_n', 'N_OUT', 'N2'].includes(h)) return 'out_n';
      return h;

    case 'light_bulb':
      if (['terminal_1', 't1', 'T1', 'in', 'anode', 'pos', '+', 'left'].includes(h)) return 'terminal_1';
      if (['terminal_2', 't2', 'T2', 'out', 'cathode', 'neg', '-', 'right'].includes(h)) return 'terminal_2';
      return h;

    case 'diode_led':
      if (['anode', 'A(+)', '+', 'pos', 'in', 'left'].includes(h)) return 'anode';
      if (['cathode', 'K(-)', '-', 'neg', 'out', 'right'].includes(h)) return 'cathode';
      return h;

    case 'pilot_light_green':
    case 'pilot_light_red':
    case 'pilot_light_amber':
      if (['term_x1', 'x1', 'X1', 'in', 'pos', '+', 'top'].includes(h)) return 'term_x1';
      if (['term_x2', 'x2', 'X2', 'out', 'neg', '-', 'bottom'].includes(h)) return 'term_x2';
      return h;

    case 'buzzer_siren':
      if (['term_plus', 'pos', '+', 'in', 'top'].includes(h)) return 'term_plus';
      if (['term_minus', 'neg', '-', 'out', 'bottom'].includes(h)) return 'term_minus';
      return h;

    case 'electric_motor_1p':
      if (['term_l', 'l', 'L', 'line_in', 'L-IN', 'top'].includes(h)) return 'term_l';
      if (['term_n', 'n', 'N', 'neutral', 'bottom'].includes(h)) return 'term_n';
      if (['term_pe', 'pe', 'PE', 'earth', 'left'].includes(h)) return 'term_pe';
      return h;

    case 'electric_motor_3p':
      if (['term_u1', 'u1', 'U1', 'L1', 'top'].includes(h)) return 'term_u1';
      if (['term_v1', 'v1', 'V1', 'L2', 'left'].includes(h)) return 'term_v1';
      if (['term_w1', 'w1', 'W1', 'L3', 'right'].includes(h)) return 'term_w1';
      if (['term_pe', 'pe', 'PE', 'earth', 'bottom'].includes(h)) return 'term_pe';
      return h;

    case 'electric_heater':
      if (['term_l', '1', 't1', 'T1', 'left'].includes(h)) return 'term_l';
      if (['term_n', '2', 't2', 'T2', 'right'].includes(h)) return 'term_n';
      if (['term_pe', 'pe', 'PE', 'earth', 'bottom'].includes(h)) return 'term_pe';
      return h;

    case 'solenoid_coil':
      if (['term_1', '1', 'a1', 'A1', 'top'].includes(h)) return 'term_1';
      if (['term_2', '2', 'a2', 'A2', 'bottom'].includes(h)) return 'term_2';
      return h;

    case 'resistor_fixed':
      if (['t1', 'A', '1', 'in', 'left'].includes(h)) return 't1';
      if (['t2', 'B', '2', 'out', 'right'].includes(h)) return 't2';
      return h;

    case 'potentiometer':
      if (['t1', '1', 'left'].includes(h)) return 't1';
      if (['wiper', 'W', 'top'].includes(h)) return 'wiper';
      if (['t2', '2', 'right'].includes(h)) return 't2';
      return h;

    case 'ammeter_basic':
      if (['a_in', 'A_IN', '1', 'in', 'left'].includes(h)) return 'a_in';
      if (['a_out', 'A_OUT', '2', 'out', 'right'].includes(h)) return 'a_out';
      return h;

    case 'voltmeter_basic':
      if (['v_pos', 'V(+)', '+', 'pos', 'left', 'top'].includes(h)) return 'v_pos';
      if (['v_com', 'COM', '-', 'neg', 'right', 'bottom'].includes(h)) return 'v_com';
      return h;

    case 'wattmeter_basic':
      if (['i_in', 'I_IN', '1'].includes(h)) return 'i_in';
      if (['i_out', 'I_OUT', '2'].includes(h)) return 'i_out';
      if (['v_pos', 'V(+)', '+'].includes(h)) return 'v_pos';
      if (['v_com', 'COM', '-'].includes(h)) return 'v_com';
      return h;

    default:
      return h;
  }
}

/**
 * Returns default port name for a given role (source or target)
 */
function getDefaultPortForType(componentType: string, role: 'source' | 'target'): string {
  switch (componentType) {
    case 'battery_dc_cell':
    case 'cell_dc_simple':
    case 'dc_power_source':
      return role === 'source' ? 'pos' : 'neg';
    case 'power_source_ac':
      return role === 'source' ? 'phase' : 'neutral';
    case 'power_source_ac_3p':
      return role === 'source' ? 'l1' : 'neutral';
    case 'switch_spst':
    case 'switch_disconnector':
    case 'pushbutton_simple':
    case 'pushbutton_nc_simple':
      return role === 'source' ? 'out' : 'in';
    case 'light_bulb':
      return role === 'source' ? 'terminal_2' : 'terminal_1';
    case 'diode_led':
      return role === 'source' ? 'cathode' : 'anode';
    case 'voltmeter_basic':
      return role === 'source' ? 'v_com' : 'v_pos';
    case 'ammeter_basic':
      return role === 'source' ? 'a_out' : 'a_in';
    default:
      return role === 'source' ? 'out' : 'in';
  }
}

export function isLoadType(componentType: string): boolean {
  return [
    'light_bulb',
    'diode_led',
    'pilot_light_green',
    'pilot_light_red',
    'pilot_light_amber',
    'buzzer_siren',
    'electric_motor_1p',
    'electric_motor_3p',
    'electric_heater',
    'solenoid_coil',
    'resistor_fixed',
  ].includes(componentType);
}

function getLoadTerminals(componentType: string): { t1: string; t2: string } {
  switch (componentType) {
    case 'light_bulb':
      return { t1: 'terminal_1', t2: 'terminal_2' };
    case 'diode_led':
      return { t1: 'anode', t2: 'cathode' };
    case 'pilot_light_green':
    case 'pilot_light_red':
    case 'pilot_light_amber':
      return { t1: 'term_x1', t2: 'term_x2' };
    case 'buzzer_siren':
      return { t1: 'term_plus', t2: 'term_minus' };
    case 'electric_motor_1p':
      return { t1: 'term_l', t2: 'term_n' };
    case 'electric_motor_3p':
      return { t1: 'term_u1', t2: 'term_pe' };
    case 'electric_heater':
      return { t1: 'term_l', t2: 'term_n' };
    case 'solenoid_coil':
      return { t1: 'term_1', t2: 'term_2' };
    case 'resistor_fixed':
      return { t1: 't1', t2: 't2' };
    default:
      return { t1: 'in', t2: 'out' };
  }
}

/**
 * Solves the electrical circuit state across schematic nodes and edges.
 *
 * Implements strict Net Partitioning (0-ohm Equipotential Nodes) and Potential Propagation:
 * 1. Accurately sums voltages of sources in series (e.g. 12V + 12V + 12V = 36V).
 * 2. Accurately detects parallel battery banks (constant 12V, capacity x N).
 * 3. Eliminates load short-circuit leakage: Disconnected loads (e.g. on SPDT switch contact 2)
 *    never falsely illuminate from parallel loads.
 * 4. Animates only edges actively carrying current.
 */
export function solveElectricalCircuit(
  nodes: SchematicNode[],
  edges: SchematicEdge[]
): {
  nodes: SchematicNode[];
  edges: SchematicEdge[];
  isAnyEnergized: boolean;
} {
  const nodeMap = new Map<string, SchematicNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // 1. Build adjacency list of ideal 0-ohm conductors (wires, closed switches, junctions, ammeters)
  const adj0 = new Map<string, AdjacencyEdge[]>();

  const add0Edge = (from: string, to: string, edgeId?: string, isInternal = false) => {
    if (!adj0.has(from)) adj0.set(from, []);
    adj0.get(from)!.push({ toTerminal: to, edgeId, isInternal });
  };

  const connect0Internal = (nodeId: string, portA: string, portB: string) => {
    const tA = `${nodeId}::${portA}`;
    const tB = `${nodeId}::${portB}`;
    add0Edge(tA, tB, undefined, true);
    add0Edge(tB, tA, undefined, true);
  };

  // Add external wires
  for (const edge of edges) {
    const sNode = nodeMap.get(edge.source);
    const tNode = nodeMap.get(edge.target);
    if (!sNode || !tNode) continue;

    const rawSPort = edge.sourceHandle || getDefaultPortForType(sNode.data.componentType, 'source');
    const rawTPort = edge.targetHandle || getDefaultPortForType(tNode.data.componentType, 'target');

    const sPort = normalizeTerminal(sNode.data.componentType, rawSPort);
    const tPort = normalizeTerminal(tNode.data.componentType, rawTPort);

    const termA = `${edge.source}::${sPort}`;
    const termB = `${edge.target}::${tPort}`;

    add0Edge(termA, termB, edge.id);
    add0Edge(termB, termA, edge.id);
  }

  // Add internal 0-ohm conduction within components
  for (const node of nodes) {
    const data = node.data;
    const type = data.componentType;
    const id = node.id;

    if (type === 'switch_spst' || type === 'switch_disconnector') {
      const isClosed = data.isSwitchClosed ?? (type === 'switch_disconnector');
      if (isClosed) {
        connect0Internal(id, 'in', 'out');
      }
    } else if (type === 'switch_spdt') {
      // SPDT switch: position 1 (!isSwitchClosed) or position 2 (isSwitchClosed)
      const isPos2 = data.isSwitchClosed ?? false;
      if (isPos2) {
        connect0Internal(id, 'common', 'l2');
      } else {
        connect0Internal(id, 'common', 'l1');
      }
    } else if (type === 'pushbutton_simple' || type === 'pushbutton_no') {
      const isClosed = (data.isSwitchClosed ?? false) || (data.isPushButtonPressed ?? false);
      if (isClosed) {
        connect0Internal(id, 'in', 'out');
      }
    } else if (type === 'pushbutton_nc_simple' || type === 'pushbutton_nc') {
      const isClosed = (data.isSwitchClosed ?? true) && !(data.isPushButtonPressed ?? false);
      if (isClosed) {
        connect0Internal(id, 'in', 'out');
      }
    } else if (type === 'emergency_stop_button') {
      const isClosed = !(data.isPushButtonPressed ?? false);
      if (isClosed) {
        connect0Internal(id, 'term_1', 'term_2');
      }
    } else if (type === 'selector_switch_rotary') {
      const pos = data.selectorPosition || 'auto';
      if (pos === 'man') {
        connect0Internal(id, 'common_in', 'manual_out');
      } else if (pos === 'auto') {
        connect0Internal(id, 'common_in', 'auto_out');
      }
    } else if (type === 'circuit_breaker_mcb' || type === 'motor_protection_switch') {
      const isClosed = (data.isBreakerClosed ?? true) && !(data.isBreakerTripped ?? false);
      if (isClosed) {
        connect0Internal(id, 'line_in', 'load_out');
      }
    } else if (type === 'residual_current_device') {
      const isClosed = (data.isBreakerClosed ?? true) && !(data.isBreakerTripped ?? false);
      if (isClosed) {
        connect0Internal(id, 'in_l', 'out_l');
        connect0Internal(id, 'in_n', 'out_n');
      }
    } else if (type === 'fuse_disconnect') {
      const isClosed = !(data.isBreakerTripped ?? false);
      if (isClosed) {
        connect0Internal(id, 'in', 'out');
      }
    } else if (type === 'ammeter_basic') {
      // Ammeter current shunt conducts in series
      connect0Internal(id, 'a_in', 'a_out');
    } else if (type === 'wattmeter_basic') {
      // Current coil conducts in series
      connect0Internal(id, 'i_in', 'i_out');
      if (data.isSeriesPassThrough) {
        connect0Internal(id, 'v_pos', 'v_com');
      }
    } else if (type === 'voltmeter_basic') {
      // If user enabled didactic series pass-through mode
      if (data.isSeriesPassThrough) {
        connect0Internal(id, 'v_pos', 'v_com');
      }
    } else if (
      type === 'junction_dot_electric' ||
      type === 'terminal_block_electric' ||
      type === 'connector_plug_socket' ||
      type === 'neutral_terminal' ||
      type === 'ground_earth' ||
      type.startsWith('pipe_')
    ) {
      // Passive terminals internally bonded
      const ports = getPassiveComponentPorts(type);
      for (let i = 0; i < ports.length; i++) {
        for (let j = i + 1; j < ports.length; j++) {
          connect0Internal(id, ports[i], ports[j]);
        }
      }
    }
  }

  // 2. Compute 0-ohm Equipotential Nets using Disjoint-Set / Connected Components
  const allTerminals = new Set<string>();
  for (const node of nodes) {
    for (const p of getNodePorts(node.data.componentType)) {
      allTerminals.add(`${node.id}::${p}`);
    }
  }
  for (const [term, neighbors] of adj0) {
    allTerminals.add(term);
    for (const n of neighbors) allTerminals.add(n.toTerminal);
  }

  const netMap = new Map<string, number>(); // terminal -> netId
  const netTerminals = new Map<number, Set<string>>(); // netId -> Set<terminals>
  let nextNetId = 1;

  for (const term of allTerminals) {
    if (netMap.has(term)) continue;
    const currentNet = nextNetId++;
    const netSet = new Set<string>();

    const q = [term];
    netMap.set(term, currentNet);
    netSet.add(term);

    while (q.length > 0) {
      const curr = q.shift()!;
      const nbrs = adj0.get(curr) || [];
      for (const edge of nbrs) {
        if (!netMap.has(edge.toTerminal)) {
          netMap.set(edge.toTerminal, currentNet);
          netSet.add(edge.toTerminal);
          q.push(edge.toTerminal);
        }
      }
    }
    netTerminals.set(currentNet, netSet);
  }

  // 3. Identify all Power Source constraints
  const sourceConstraints: SourceConstraint[] = [];

  for (const node of nodes) {
    const data = node.data;
    const type = data.componentType;
    const isEnergized = data.isEnergized ?? true;

    if (!isEnergized) continue;

    if (type === 'battery_dc_cell') {
      sourceConstraints.push({
        nodeId: node.id,
        negTerminal: `${node.id}::neg`,
        posTerminal: `${node.id}::pos`,
        voltage: data.voltageV || 12.0,
      });
    } else if (type === 'cell_dc_simple') {
      sourceConstraints.push({
        nodeId: node.id,
        negTerminal: `${node.id}::neg`,
        posTerminal: `${node.id}::pos`,
        voltage: data.voltageV || 1.5,
      });
    } else if (type === 'dc_power_source') {
      sourceConstraints.push({
        nodeId: node.id,
        negTerminal: `${node.id}::neg`,
        posTerminal: `${node.id}::pos`,
        voltage: data.voltageV || 24.0,
      });
    } else if (type === 'power_supply_dc_24v') {
      sourceConstraints.push({
        nodeId: node.id,
        negTerminal: `${node.id}::dc_minus`,
        posTerminal: `${node.id}::dc_plus`,
        voltage: 24.0,
      });
    } else if (type === 'power_source_ac') {
      sourceConstraints.push({
        nodeId: node.id,
        negTerminal: `${node.id}::neutral`,
        posTerminal: `${node.id}::phase`,
        voltage: data.voltageV || 230.0,
      });
    } else if (type === 'electrical_panel_main' || type === 'power_supply_terminal') {
      sourceConstraints.push({
        nodeId: node.id,
        negTerminal: `${node.id}::neutral`,
        posTerminal: `${node.id}::mains_in`,
        voltage: 230.0,
      });
    } else if (type === 'power_source_ac_3p') {
      sourceConstraints.push(
        {
          nodeId: node.id,
          negTerminal: `${node.id}::neutral`,
          posTerminal: `${node.id}::l1`,
          voltage: 230.0,
        },
        {
          nodeId: node.id,
          negTerminal: `${node.id}::neutral`,
          posTerminal: `${node.id}::l2`,
          voltage: 230.0,
        },
        {
          nodeId: node.id,
          negTerminal: `${node.id}::neutral`,
          posTerminal: `${node.id}::l3`,
          voltage: 230.0,
        }
      );
    }
  }

  // 4. Solve Electrical Potential for each Net
  // Build directed Net Potential Graph
  interface NetPotentialEdge {
    toNet: number;
    deltaV: number;
    sourceNodeId: string;
  }
  const netGraph = new Map<number, NetPotentialEdge[]>();

  const addNetEdge = (from: number, to: number, deltaV: number, sourceNodeId: string) => {
    if (!netGraph.has(from)) netGraph.set(from, []);
    netGraph.get(from)!.push({ toNet: to, deltaV, sourceNodeId });
  };

  for (const src of sourceConstraints) {
    const netNeg = netMap.get(src.negTerminal);
    const netPos = netMap.get(src.posTerminal);
    if (netNeg !== undefined && netPos !== undefined && netNeg !== netPos) {
      addNetEdge(netNeg, netPos, src.voltage, src.nodeId);
      addNetEdge(netPos, netNeg, -src.voltage, src.nodeId);
    }
  }

  const netPotentials = new Map<number, number>();
  const visitedNets = new Set<number>();

  // Assign potentials starting from reference nets (ground, neutral, negative terminals)
  for (const src of sourceConstraints) {
    const netNeg = netMap.get(src.negTerminal);
    if (netNeg === undefined || visitedNets.has(netNeg)) continue;

    // Set reference potential to 0.0V for this component
    netPotentials.set(netNeg, 0.0);
    visitedNets.add(netNeg);
    const q = [netNeg];

    while (q.length > 0) {
      const u = q.shift()!;
      const uPot = netPotentials.get(u)!;
      const nbrs = netGraph.get(u) || [];

      for (const edge of nbrs) {
        const v = edge.toNet;
        const targetPot = uPot + edge.deltaV;

        if (!visitedNets.has(v)) {
          netPotentials.set(v, targetPot);
          visitedNets.add(v);
          q.push(v);
        }
      }
    }
  }

  // Count parallel sources for telemetry / didactic feedback
  const netPairParallelSources = new Map<string, number>();
  for (const src of sourceConstraints) {
    const nA = netMap.get(src.negTerminal);
    const nB = netMap.get(src.posTerminal);
    if (nA !== undefined && nB !== undefined) {
      const pairKey = `${Math.min(nA, nB)}_${Math.max(nA, nB)}`;
      netPairParallelSources.set(pairKey, (netPairParallelSources.get(pairKey) || 0) + 1);
    }
  }

  // 5. Evaluate Loads (Pass 1)
  const energizedNodeIds = new Set<string>();
  const activeEdgeIds = new Set<string>();
  let anyEnergized = false;

  // Function to collect all active 0-ohm wire edge IDs reaching a terminal from source
  const collectWirePathsToSource = (startTerminal: string) => {
    const visited = new Set<string>();
    const q = [startTerminal];
    visited.add(startTerminal);

    while (q.length > 0) {
      const curr = q.shift()!;
      const nbrs = adj0.get(curr) || [];
      for (const e of nbrs) {
        if (e.edgeId) activeEdgeIds.add(e.edgeId);
        if (!visited.has(e.toTerminal)) {
          visited.add(e.toTerminal);
          q.push(e.toTerminal);
        }
      }
    }
  };

  for (const node of nodes) {
    const type = node.data.componentType;
    if (isLoadType(type)) {
      const { t1, t2 } = getLoadTerminals(type);
      const term1 = `${node.id}::${t1}`;
      const term2 = `${node.id}::${t2}`;

      const net1 = netMap.get(term1);
      const net2 = netMap.get(term2);

      const pot1 = net1 !== undefined ? netPotentials.get(net1) : undefined;
      const pot2 = net2 !== undefined ? netPotentials.get(net2) : undefined;

      let isEnergized = false;

      if (pot1 !== undefined && pot2 !== undefined) {
        const deltaV = Math.abs(pot1 - pot2);
        if (type === 'diode_led') {
          // LED requires anode at higher potential than cathode
          isEnergized = pot1 - pot2 >= 1.0;
        } else {
          isEnergized = deltaV >= 1.0;
        }
      }

      if (isEnergized) {
        energizedNodeIds.add(node.id);
        anyEnergized = true;
        collectWirePathsToSource(term1);
        collectWirePathsToSource(term2);
      }
    }
  }

  // Find dominant circuit voltage
  let dominantVoltage = 12.0;
  for (const v of netPotentials.values()) {
    if (v > dominantVoltage) dominantVoltage = v;
  }

  // 6. Evaluate Components and Instruments (Pass 2)
  const updatedNodes = nodes.map((node) => {
    const type = node.data.componentType;
    const nodeId = node.id;

    if (isLoadType(type)) {
      const isEnergized = energizedNodeIds.has(nodeId);
      if (node.data.isEnergized !== isEnergized) {
        return {
          ...node,
          data: {
            ...node.data,
            isEnergized,
          },
        };
      }
      return node;
    }

    // Voltmeter reading
    if (type === 'voltmeter_basic') {
      const vPosTerm = `${nodeId}::v_pos`;
      const vComTerm = `${nodeId}::v_com`;

      const netPos = netMap.get(vPosTerm);
      const netCom = netMap.get(vComTerm);

      let potPos = netPos !== undefined ? netPotentials.get(netPos) : undefined;
      let potCom = netCom !== undefined ? netPotentials.get(netCom) : undefined;

      // Detect if voltmeter COM probe is grounded through unenergized load filament in series
      let isSeriesDetected = false;
      if (potPos !== undefined && potCom === undefined) {
        for (const otherNode of nodes) {
          if (isLoadType(otherNode.data.componentType)) {
            const { t1, t2 } = getLoadTerminals(otherNode.data.componentType);
            const loadT1Net = netMap.get(`${otherNode.id}::${t1}`);
            const loadT2Net = netMap.get(`${otherNode.id}::${t2}`);
            if (loadT1Net === netCom && loadT2Net !== undefined && netPotentials.has(loadT2Net)) {
              potCom = netPotentials.get(loadT2Net);
              isSeriesDetected = true;
              break;
            } else if (loadT2Net === netCom && loadT1Net !== undefined && netPotentials.has(loadT1Net)) {
              potCom = netPotentials.get(loadT1Net);
              isSeriesDetected = true;
              break;
            }
          }
        }
      }

      let measuredValue = 0.0;
      if (node.data.isSeriesPassThrough) {
        // In didactic series bypass mode, voltmeter acts as a non-intrusive in-line monitor
        measuredValue = potPos !== undefined && potPos > 0 ? potPos : (potCom !== undefined && potCom > 0 ? potCom : dominantVoltage);
      } else if (potPos !== undefined && potCom !== undefined) {
        measuredValue = Math.round(Math.abs(potPos - potCom) * 10) / 10;
      }

      const hasUnenergizedLoads = nodes.some(
        (n) => isLoadType(n.data.componentType) && !energizedNodeIds.has(n.id)
      );
      const isSeriesWarning =
        isSeriesDetected && measuredValue > 0 && hasUnenergizedLoads && !node.data.isSeriesPassThrough;

      if (
        node.data.measuredValue !== measuredValue ||
        node.data.isSeriesWarning !== isSeriesWarning
      ) {
        return {
          ...node,
          data: {
            ...node.data,
            measuredValue,
            isSeriesWarning,
          },
        };
      }
      return node;
    }

    // Wattmeter reading (P = V * I)
    if (type === 'wattmeter_basic') {
      const vPosTerm = `${nodeId}::v_pos`;
      const vComTerm = `${nodeId}::v_com`;
      const iInTerm = `${nodeId}::i_in`;
      const iOutTerm = `${nodeId}::i_out`;

      const netPos = netMap.get(vPosTerm);
      const netCom = netMap.get(vComTerm);
      const netIIn = netMap.get(iInTerm);
      const netIOut = netMap.get(iOutTerm);

      const potPos = netPos !== undefined ? netPotentials.get(netPos) : undefined;
      const potCom = netCom !== undefined ? netPotentials.get(netCom) : undefined;

      const voltage = potPos !== undefined && potCom !== undefined ? Math.abs(potPos - potCom) : dominantVoltage;
      const isCurrentFlowing = anyEnergized && netIIn !== undefined && netIIn === netIOut;
      const current = isCurrentFlowing ? Math.round((voltage / 24) * 100) / 100 : 0.0;
      const power = Math.round(voltage * current * 10) / 10;

      if (node.data.measuredValue !== power || node.data.powerWatts !== power) {
        return {
          ...node,
          data: {
            ...node.data,
            measuredValue: power,
            powerWatts: power,
          },
        };
      }
      return node;
    }

    // Ammeter reading
    if (type === 'ammeter_basic') {
      const aInTerm = `${nodeId}::a_in`;
      const netAIn = netMap.get(aInTerm);
      const isConducting = anyEnergized && netAIn !== undefined;

      const measuredValue = isConducting ? Math.round((dominantVoltage / 24) * 100) / 100 : 0.0;

      if (node.data.measuredValue !== measuredValue) {
        return {
          ...node,
          data: {
            ...node.data,
            measuredValue,
          },
        };
      }
      return node;
    }

    // Ohmmeter reading
    if (type === 'ohmmeter_basic') {
      let measuredResistance = 0.0;
      for (const otherNode of nodes) {
        if (otherNode.id === nodeId) continue;
        if (otherNode.data.componentType === 'resistor_fixed') {
          measuredResistance = otherNode.data.resistanceOhm || 100.0;
          break;
        } else if (otherNode.data.componentType === 'light_bulb') {
          measuredResistance = 24.0;
          break;
        } else if (otherNode.data.componentType === 'electric_heater') {
          measuredResistance = 50.0;
          break;
        }
      }
      if (node.data.measuredValue !== measuredResistance) {
        return {
          ...node,
          data: {
            ...node.data,
            measuredValue: measuredResistance,
          },
        };
      }
      return node;
    }

    return node;
  });

  // 6. Update Edges Animation State
  const updatedEdges: SchematicEdge[] = edges.map((edge) => {
    const shouldAnimate = activeEdgeIds.has(edge.id);
    if (edge.data?.isAnimated !== shouldAnimate) {
      return {
        ...edge,
        data: {
          ...edge.data,
          pipeState: edge.data?.pipeState || 'electric_phase',
          isAnimated: shouldAnimate,
        },
      };
    }
    return edge;
  });

  return {
    nodes: updatedNodes,
    edges: updatedEdges,
    isAnyEnergized: anyEnergized,
  };
}

function getNodePorts(componentType: string): string[] {
  switch (componentType) {
    case 'battery_dc_cell':
    case 'cell_dc_simple':
    case 'dc_power_source':
      return ['pos', 'neg'];
    case 'power_supply_dc_24v':
      return ['ac_l', 'ac_n', 'dc_plus', 'dc_minus'];
    case 'power_source_ac':
      return ['phase', 'neutral'];
    case 'power_source_ac_3p':
      return ['l1', 'l2', 'l3', 'neutral', 'pe'];
    case 'switch_spst':
    case 'switch_disconnector':
    case 'pushbutton_simple':
    case 'pushbutton_no':
    case 'pushbutton_nc_simple':
    case 'pushbutton_nc':
    case 'fuse_disconnect':
      return ['in', 'out'];
    case 'emergency_stop_button':
      return ['term_1', 'term_2'];
    case 'switch_spdt':
      return ['common', 'l1', 'l2'];
    case 'selector_switch_rotary':
      return ['common_in', 'manual_out', 'auto_out'];
    case 'circuit_breaker_mcb':
    case 'motor_protection_switch':
      return ['line_in', 'load_out'];
    case 'residual_current_device':
      return ['in_l', 'out_l', 'in_n', 'out_n'];
    case 'light_bulb':
      return ['terminal_1', 'terminal_2'];
    case 'diode_led':
      return ['anode', 'cathode'];
    case 'pilot_light_green':
    case 'pilot_light_red':
    case 'pilot_light_amber':
      return ['term_x1', 'term_x2'];
    case 'buzzer_siren':
      return ['term_plus', 'term_minus'];
    case 'electric_motor_1p':
      return ['term_l', 'term_n', 'term_pe'];
    case 'electric_motor_3p':
      return ['term_u1', 'term_v1', 'term_w1', 'term_pe'];
    case 'electric_heater':
      return ['term_l', 'term_n', 'term_pe'];
    case 'solenoid_coil':
      return ['term_1', 'term_2'];
    case 'resistor_fixed':
      return ['t1', 't2'];
    case 'potentiometer':
      return ['t1', 'wiper', 't2'];
    case 'ammeter_basic':
      return ['a_in', 'a_out'];
    case 'voltmeter_basic':
      return ['v_pos', 'v_com'];
    case 'wattmeter_basic':
      return ['i_in', 'i_out', 'v_pos', 'v_com'];
    default:
      return ['in', 'out'];
  }
}

function getPassiveComponentPorts(componentType: string): string[] {
  switch (componentType) {
    case 'junction_dot_electric':
      return ['t1', 't2', 't3', 't4', 'left', 'right', 'top', 'bottom'];
    case 'terminal_block_electric':
      return ['1', '2', '3', '4', 't1_in', 't1_out', 't2_in', 't2_out'];
    case 'connector_plug_socket':
      return ['pin1', 'pin2', 'socket_in', 'plug_out', 'in', 'out'];
    case 'neutral_terminal':
      return ['n1', 'n2', 'n3', 'n4', 'N1', 'N2', 'N3', 'N4'];
    case 'ground_earth':
      return ['pe1', 'pe2', 'PE1', 'PE2', 'earth'];
    default:
      return ['p1', 'p2', 'p3', 'p4', 'in', 'out', 'branch'];
  }
}
