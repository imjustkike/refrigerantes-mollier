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

    case 'electric_motor_dc':
      if (['term_pos', '+', 'pos', 'term_l', 'top', 'left', '1'].includes(h)) return 'term_pos';
      if (['term_neg', '-', 'neg', 'term_n', 'bottom', 'right', '2'].includes(h)) return 'term_neg';
      if (['term_pe', 'pe', 'PE', 'earth'].includes(h)) return 'term_pe';
      return h;

    case 'audio_speaker':
      if (['audio_pos', 'pos', '+', 't1', 'in', 'left', 'top', '1'].includes(h)) return 'audio_pos';
      if (['audio_neg', 'neg', '-', 't2', 'out', 'right', 'bottom', '2'].includes(h)) return 'audio_neg';
      return h;

    case 'transistor_bjt_npn':
    case 'transistor_bjt_pnp':
      if (['base', 'b', 'B', 'in', 'left'].includes(h)) return 'base';
      if (['collector', 'c', 'C', 'out', 'top'].includes(h)) return 'collector';
      if (['emitter', 'e', 'E', 'bottom'].includes(h)) return 'emitter';
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
    case 'audio_speaker':
      return role === 'source' ? 'audio_neg' : 'audio_pos';
    case 'electric_motor_dc':
      return role === 'source' ? 'term_neg' : 'term_pos';
    case 'transistor_bjt_npn':
    case 'transistor_bjt_pnp':
      return role === 'source' ? 'collector' : 'base';
    case 'voltmeter_basic':
      return role === 'source' ? 'v_com' : 'v_pos';
    case 'ammeter_basic':
      return role === 'source' ? 'a_out' : 'a_in';
    default:
      return role === 'source' ? 'out' : 'in';
  }
}

export function getComponentResistance(node: SchematicNode): number {
  if (node.data.resistanceOhm !== undefined && node.data.resistanceOhm > 0) {
    if (node.data.componentType === 'potentiometer') {
      const pct = Math.min(1, Math.max(0.01, (node.data.openingPercent ?? 50) / 100));
      return Math.max(0.1, node.data.resistanceOhm * pct);
    }
    return node.data.resistanceOhm;
  }
  const type = node.data.componentType;
  switch (type) {
    case 'resistor_fixed':
      return node.data.resistanceOhm || 100.0;
    case 'potentiometer': {
      const baseR = node.data.resistanceOhm || 10000.0;
      const pct = Math.min(1, Math.max(0.01, (node.data.openingPercent ?? 50) / 100));
      return Math.max(0.1, baseR * pct);
    }
    case 'light_bulb': {
      const vNom = node.data.ratedVoltageV || node.data.voltageV || 12.0;
      const pNom = node.data.powerWatts || (node.data.powerKw ? node.data.powerKw * 1000 : 6.0);
      return Math.round(((vNom * vNom) / pNom) * 10) / 10 || 24.0;
    }
    case 'electric_motor_dc': {
      const vNom = node.data.ratedVoltageV || node.data.voltageV || 12.0;
      const pNom = node.data.powerWatts || 24.0;
      return Math.round(((vNom * vNom) / pNom) * 10) / 10 || 6.0;
    }
    case 'electric_motor_1p': {
      const vNom = node.data.ratedVoltageV || 230.0;
      const pNom = node.data.powerWatts || (node.data.powerKw ? node.data.powerKw * 1000 : 750.0);
      return Math.round(((vNom * vNom) / pNom) * 10) / 10 || 70.0;
    }
    case 'electric_motor_3p': {
      const vNom = node.data.ratedVoltageV || 400.0;
      const pNom = node.data.powerWatts || (node.data.powerKw ? node.data.powerKw * 1000 : 1500.0);
      return Math.round(((vNom * vNom) / pNom) * 10) / 10 || 100.0;
    }
    case 'audio_speaker':
      return node.data.impedanceOhm || 8.0;
    case 'electric_heater': {
      const vNom = node.data.voltageV || 230.0;
      const pNom = node.data.powerWatts || (node.data.powerKw ? node.data.powerKw * 1000 : 1000.0);
      return Math.round(((vNom * vNom) / pNom) * 10) / 10 || 52.9;
    }
    case 'diode_led':
      return 200.0;
    case 'solenoid_coil':
      return 500.0;
    default:
      return 100.0;
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
    'audio_speaker',
    'electric_motor_1p',
    'electric_motor_3p',
    'electric_motor_dc',
    'electric_heater',
    'solenoid_coil',
    'resistor_fixed',
    'potentiometer',
  ].includes(componentType);
}

function getLoadTerminals(componentType: string): { t1: string; t2: string } {
  switch (componentType) {
    case 'light_bulb':
      return { t1: 'terminal_1', t2: 'terminal_2' };
    case 'diode_led':
      return { t1: 'anode', t2: 'cathode' };
    case 'audio_speaker':
      return { t1: 'audio_pos', t2: 'audio_neg' };
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
    case 'electric_motor_dc':
      return { t1: 'term_pos', t2: 'term_neg' };
    case 'electric_heater':
      return { t1: 'term_l', t2: 'term_n' };
    case 'solenoid_coil':
      return { t1: 'term_1', t2: 'term_2' };
    case 'resistor_fixed':
      return { t1: 't1', t2: 't2' };
    case 'potentiometer':
      return { t1: 't1', t2: 'wiper' };
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

  // 2. Identify all Power Source constraints
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
        voltage: data.voltageV !== undefined ? data.voltageV : 12.0,
      });
    } else if (type === 'cell_dc_simple') {
      sourceConstraints.push({
        nodeId: node.id,
        negTerminal: `${node.id}::neg`,
        posTerminal: `${node.id}::pos`,
        voltage: data.voltageV !== undefined ? data.voltageV : 1.5,
      });
    } else if (type === 'dc_power_source') {
      sourceConstraints.push({
        nodeId: node.id,
        negTerminal: `${node.id}::neg`,
        posTerminal: `${node.id}::pos`,
        voltage: data.voltageV !== undefined ? data.voltageV : 12.0,
      });
    } else if (type === 'power_supply_dc_24v') {
      sourceConstraints.push({
        nodeId: node.id,
        negTerminal: `${node.id}::dc_minus`,
        posTerminal: `${node.id}::dc_plus`,
        voltage: data.voltageV !== undefined ? data.voltageV : 24.0,
      });
    } else if (type === 'power_source_ac') {
      sourceConstraints.push({
        nodeId: node.id,
        negTerminal: `${node.id}::neutral`,
        posTerminal: `${node.id}::phase`,
        voltage: data.voltageV !== undefined ? data.voltageV : 230.0,
      });
    } else if (type === 'electrical_panel_main' || type === 'power_supply_terminal') {
      sourceConstraints.push({
        nodeId: node.id,
        negTerminal: `${node.id}::neutral`,
        posTerminal: `${node.id}::mains_in`,
        voltage: data.voltageV !== undefined ? data.voltageV : 230.0,
      });
    } else if (type === 'power_source_ac_3p') {
      const vLine = data.voltageV !== undefined ? data.voltageV : 400.0;
      const vPhase = Math.round((vLine / Math.sqrt(3)) * 10) / 10;
      sourceConstraints.push(
        {
          nodeId: node.id,
          negTerminal: `${node.id}::neutral`,
          posTerminal: `${node.id}::l1`,
          voltage: vPhase,
        },
        {
          nodeId: node.id,
          negTerminal: `${node.id}::neutral`,
          posTerminal: `${node.id}::l2`,
          voltage: vPhase,
        },
        {
          nodeId: node.id,
          negTerminal: `${node.id}::neutral`,
          posTerminal: `${node.id}::l3`,
          voltage: vPhase,
        }
      );
    }
  }

  // 3. Compute 0-ohm Equipotential Nets and Potentials
  const computeNetsAndPotentials = () => {
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

    for (const src of sourceConstraints) {
      const netNeg = netMap.get(src.negTerminal);
      if (netNeg === undefined || visitedNets.has(netNeg)) continue;

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

    // Identify nets that are directly fixed by voltage source constraints
    const fixedNets = new Set<number>();
    for (const src of sourceConstraints) {
      const nNeg = netMap.get(src.negTerminal);
      const nPos = netMap.get(src.posTerminal);
      if (nNeg !== undefined) fixedNets.add(nNeg);
      if (nPos !== undefined) fixedNets.add(nPos);
    }

    // Solve intermediate node potentials through resistive components (Ohm's Law & Nodal Analysis)
    interface ResistiveConnection {
      netA: number;
      netB: number;
      conductance: number;
    }
    const resistiveConns: ResistiveConnection[] = [];

    for (const node of nodes) {
      const type = node.data.componentType;
      if (type === 'potentiometer') {
        const totalR = node.data.resistanceOhm || 10000.0;
        const alpha = Math.min(0.99, Math.max(0.01, (node.data.openingPercent ?? 50) / 100));
        const r1W = Math.max(0.1, totalR * (1 - alpha));
        const rW2 = Math.max(0.1, totalR * alpha);

        const netT1 = netMap.get(`${node.id}::t1`);
        const netW = netMap.get(`${node.id}::wiper`);
        const netT2 = netMap.get(`${node.id}::t2`);

        if (netT1 !== undefined && netW !== undefined && netT1 !== netW) {
          resistiveConns.push({ netA: netT1, netB: netW, conductance: 1 / r1W });
        }
        if (netW !== undefined && netT2 !== undefined && netW !== netT2) {
          resistiveConns.push({ netA: netW, netB: netT2, conductance: 1 / rW2 });
        }
        if (netT1 !== undefined && netT2 !== undefined && netW === undefined && netT1 !== netT2) {
          resistiveConns.push({ netA: netT1, netB: netT2, conductance: 1 / totalR });
        }
      } else if (isLoadType(type)) {
        const { t1, t2 } = getLoadTerminals(type);
        const netA = netMap.get(`${node.id}::${t1}`);
        const netB = netMap.get(`${node.id}::${t2}`);
        if (netA !== undefined && netB !== undefined && netA !== netB) {
          const R = getComponentResistance(node);
          if (R > 0) {
            resistiveConns.push({ netA, netB, conductance: 1 / R });
          }
        }
      }
    }

    if (resistiveConns.length > 0) {
      const netAdjacency = new Map<number, { otherNet: number; G: number }[]>();
      for (const conn of resistiveConns) {
        if (!netAdjacency.has(conn.netA)) netAdjacency.set(conn.netA, []);
        if (!netAdjacency.has(conn.netB)) netAdjacency.set(conn.netB, []);
        netAdjacency.get(conn.netA)!.push({ otherNet: conn.netB, G: conn.conductance });
        netAdjacency.get(conn.netB)!.push({ otherNet: conn.netA, G: conn.conductance });
      }

      for (let iter = 0; iter < 25; iter++) {
        let maxDelta = 0;
        for (const [u, edges] of netAdjacency) {
          if (fixedNets.has(u)) continue;

          let sumGV = 0;
          let sumG = 0;
          let hasKnownNeighbor = false;

          for (const edge of edges) {
            const vPot = netPotentials.get(edge.otherNet);
            if (vPot !== undefined) {
              sumGV += edge.G * vPot;
              sumG += edge.G;
              hasKnownNeighbor = true;
            }
          }

          if (hasKnownNeighbor && sumG > 0) {
            const newPot = sumGV / sumG;
            const currentPot = netPotentials.get(u);
            const delta = currentPot !== undefined ? Math.abs(currentPot - newPot) : Math.abs(newPot);
            if (delta > maxDelta) maxDelta = delta;
            netPotentials.set(u, newPot);
          }
        }

        if (maxDelta < 0.001) break;
      }
    }

    return { netMap, netTerminals, netPotentials };
  };

  let { netMap, netPotentials } = computeNetsAndPotentials();

  // 4. Evaluate Transistor BJT Conduction
  let anyTransistorActivated = false;
  for (const node of nodes) {
    const type = node.data.componentType;
    if (type === 'transistor_bjt_npn' || type === 'transistor_bjt_pnp') {
      const netB = netMap.get(`${node.id}::base`);
      const netE = netMap.get(`${node.id}::emitter`);
      const potB = netB !== undefined ? netPotentials.get(netB) : undefined;
      const potE = netE !== undefined ? netPotentials.get(netE) : undefined;

      let isConducting = false;
      if (type === 'transistor_bjt_npn') {
        const vBe = potB !== undefined && potE !== undefined ? potB - potE : 0;
        isConducting = vBe >= 0.65;
      } else {
        const vEb = potE !== undefined && potB !== undefined ? potE - potB : 0;
        isConducting = vEb >= 0.65;
      }

      if (isConducting) {
        connect0Internal(node.id, 'collector', 'emitter');
        anyTransistorActivated = true;
      }
    }
  }

  if (anyTransistorActivated) {
    const recomputed = computeNetsAndPotentials();
    netMap = recomputed.netMap;
    netPotentials = recomputed.netPotentials;
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
        } else if (
          type === 'electric_motor_dc' ||
          type === 'electric_motor_1p' ||
          type === 'electric_motor_3p'
        ) {
          const ratedV =
            node.data.ratedVoltageV ||
            (type === 'electric_motor_3p'
              ? 400
              : type === 'electric_motor_1p'
              ? 230
              : node.data.voltageV || 12.0);
          const minV =
            node.data.minOperatingVoltageV !== undefined
              ? node.data.minOperatingVoltageV
              : ratedV * 0.6;
          // Motor does not start if applied voltage is below minimum threshold
          isEnergized = deltaV >= minV && deltaV > 0;
        } else if (type === 'light_bulb') {
          const minV =
            node.data.minOperatingVoltageV !== undefined
              ? node.data.minOperatingVoltageV
              : (node.data.ratedVoltageV || node.data.voltageV || 12.0) * 0.5;
          isEnergized = deltaV >= minV && deltaV > 0;
        } else if (type === 'audio_speaker') {
          const minV = node.data.minOperatingVoltageV || 1.0;
          isEnergized = deltaV >= minV;
        } else if (type === 'resistor_fixed' || type === 'potentiometer') {
          isEnergized = deltaV >= 0.1;
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

    // Motors (DC, 1P, 3P) with voltage threshold and speed/power calculation
    if (
      type === 'electric_motor_dc' ||
      type === 'electric_motor_1p' ||
      type === 'electric_motor_3p'
    ) {
      const { t1, t2 } = getLoadTerminals(type);
      const net1 = netMap.get(`${nodeId}::${t1}`);
      const net2 = netMap.get(`${nodeId}::${t2}`);
      const pot1 = net1 !== undefined ? netPotentials.get(net1) : undefined;
      const pot2 = net2 !== undefined ? netPotentials.get(net2) : undefined;
      const deltaV = pot1 !== undefined && pot2 !== undefined ? Math.round(Math.abs(pot1 - pot2) * 100) / 100 : 0;

      const ratedV =
        node.data.ratedVoltageV ||
        (type === 'electric_motor_3p'
          ? 400
          : type === 'electric_motor_1p'
          ? 230
          : node.data.voltageV || 12.0);
      const minV =
        node.data.minOperatingVoltageV !== undefined
          ? node.data.minOperatingVoltageV
          : ratedV * 0.6;
      const ratedRpm =
        node.data.ratedRpm ||
        (type === 'electric_motor_3p'
          ? 1450
          : type === 'electric_motor_1p'
          ? 2850
          : 3000);

      const resistanceOhm = getComponentResistance(node);
      const isEnergized = deltaV >= minV && deltaV > 0;
      const currentA = deltaV > 0 && resistanceOhm > 0 ? Math.round((deltaV / resistanceOhm) * 1000) / 1000 : 0.0;
      const powerWatts = deltaV > 0 && currentA > 0 ? Math.round(deltaV * currentA * 10) / 10 : 0.0;

      let powerPercent = 0;
      let actualRpm = 0;
      let motorVoltageWarning: string | undefined = undefined;

      if (deltaV > 0 && deltaV < minV) {
        motorVoltageWarning = `Subtensión (${deltaV.toFixed(1)}V < ${minV.toFixed(1)}V mín) - Motor no enciende`;
      } else if (isEnergized) {
        if (deltaV >= ratedV) {
          powerPercent = 100;
          actualRpm = ratedRpm;
        } else {
          powerPercent = Math.min(100, Math.max(1, Math.round((deltaV / ratedV) * 100)));
          actualRpm = Math.round(ratedRpm * (deltaV / ratedV));
          motorVoltageWarning = `Tensión reducida (${deltaV.toFixed(1)}V / ${ratedV.toFixed(1)}V nom) - ${powerPercent}% potencia`;
        }
      }

      if (
        node.data.isEnergized !== isEnergized ||
        node.data.voltageV !== deltaV ||
        node.data.currentA !== currentA ||
        node.data.resistanceOhm !== resistanceOhm ||
        node.data.powerWatts !== powerWatts ||
        node.data.powerPercent !== powerPercent ||
        node.data.actualRpm !== actualRpm ||
        node.data.motorVoltageWarning !== motorVoltageWarning
      ) {
        return {
          ...node,
          data: {
            ...node.data,
            isEnergized,
            voltageV: deltaV,
            currentA,
            resistanceOhm,
            powerWatts,
            powerPercent,
            actualRpm,
            motorVoltageWarning,
          },
        };
      }
      return node;
    }

    // Light Bulb with Ohm's Law & Under-voltage Threshold
    if (type === 'light_bulb') {
      const { t1, t2 } = getLoadTerminals(type);
      const net1 = netMap.get(`${nodeId}::${t1}`);
      const net2 = netMap.get(`${nodeId}::${t2}`);
      const pot1 = net1 !== undefined ? netPotentials.get(net1) : undefined;
      const pot2 = net2 !== undefined ? netPotentials.get(net2) : undefined;
      const deltaV = pot1 !== undefined && pot2 !== undefined ? Math.round(Math.abs(pot1 - pot2) * 100) / 100 : 0;

      const ratedV = node.data.ratedVoltageV || node.data.voltageV || 12.0;
      const minV = node.data.minOperatingVoltageV !== undefined ? node.data.minOperatingVoltageV : 6.0;
      const resistanceOhm = getComponentResistance(node);
      const ratedPowerW = node.data.powerWatts || Math.round(((ratedV * ratedV) / resistanceOhm) * 10) / 10 || 6.0;

      const isEnergized = deltaV >= minV && deltaV > 0;
      const currentA = deltaV > 0 && resistanceOhm > 0 ? Math.round((deltaV / resistanceOhm) * 1000) / 1000 : 0.0;
      const powerWatts = deltaV > 0 && currentA > 0 ? Math.round(deltaV * currentA * 10) / 10 : 0.0;

      let powerPercent = 0;
      let voltageWarning: string | undefined = undefined;

      if (deltaV > 0 && deltaV < minV) {
        voltageWarning = `Subtensión (${deltaV.toFixed(1)}V < ${minV.toFixed(1)}V mín) - Bombilla apagada`;
      } else if (isEnergized) {
        if (deltaV >= ratedV) {
          powerPercent = 100;
        } else {
          powerPercent = Math.min(100, Math.max(1, Math.round((powerWatts / ratedPowerW) * 100)));
          voltageWarning = `Tensión reducida (${deltaV.toFixed(1)}V / ${ratedV.toFixed(1)}V nom) - ${powerPercent}% potencia`;
        }
      }

      if (
        node.data.isEnergized !== isEnergized ||
        node.data.voltageV !== deltaV ||
        node.data.currentA !== currentA ||
        node.data.resistanceOhm !== resistanceOhm ||
        node.data.powerWatts !== powerWatts ||
        node.data.powerPercent !== powerPercent ||
        node.data.voltageWarning !== voltageWarning
      ) {
        return {
          ...node,
          data: {
            ...node.data,
            isEnergized,
            voltageV: deltaV,
            currentA,
            resistanceOhm,
            powerWatts,
            powerPercent,
            voltageWarning,
          },
        };
      }
      return node;
    }

    // Resistors and Potentiometers with Ohm's Law & Dissipated Power
    if (type === 'resistor_fixed' || type === 'potentiometer') {
      const { t1, t2 } = getLoadTerminals(type);
      const net1 = netMap.get(`${nodeId}::${t1}`);
      const net2 = netMap.get(`${nodeId}::${t2}`);
      const pot1 = net1 !== undefined ? netPotentials.get(net1) : undefined;
      const pot2 = net2 !== undefined ? netPotentials.get(net2) : undefined;
      const deltaV = pot1 !== undefined && pot2 !== undefined ? Math.round(Math.abs(pot1 - pot2) * 100) / 100 : 0;

      const resistanceOhm = getComponentResistance(node);
      const currentA = deltaV > 0 && resistanceOhm > 0 ? Math.round((deltaV / resistanceOhm) * 1000) / 1000 : 0.0;
      const powerWatts = deltaV > 0 && currentA > 0 ? Math.round(deltaV * currentA * 10) / 10 : 0.0;
      const isEnergized = deltaV >= 0.1 && currentA > 0;
      const maxPowerW = node.data.powerWatts || 2.0;
      const powerPercent = Math.min(100, Math.round((powerWatts / maxPowerW) * 100));

      if (
        node.data.isEnergized !== isEnergized ||
        node.data.voltageV !== deltaV ||
        node.data.currentA !== currentA ||
        node.data.resistanceOhm !== resistanceOhm ||
        node.data.powerWatts !== powerWatts ||
        node.data.powerPercent !== powerPercent
      ) {
        return {
          ...node,
          data: {
            ...node.data,
            isEnergized,
            voltageV: deltaV,
            currentA,
            resistanceOhm,
            powerWatts,
            powerPercent,
          },
        };
      }
      return node;
    }

    // Audio Speaker
    if (type === 'audio_speaker') {
      const { t1, t2 } = getLoadTerminals(type);
      const net1 = netMap.get(`${nodeId}::${t1}`);
      const net2 = netMap.get(`${nodeId}::${t2}`);
      const pot1 = net1 !== undefined ? netPotentials.get(net1) : undefined;
      const pot2 = net2 !== undefined ? netPotentials.get(net2) : undefined;
      const deltaV = pot1 !== undefined && pot2 !== undefined ? Math.round(Math.abs(pot1 - pot2) * 100) / 100 : 0;
      const minV = node.data.minOperatingVoltageV || 1.0;
      const impedance = node.data.impedanceOhm || 8.0;

      const isEnergized = deltaV >= minV;
      const currentA = deltaV > 0 && impedance > 0 ? Math.round((deltaV / impedance) * 1000) / 1000 : 0.0;
      const powerWatts = isEnergized ? Math.round(((deltaV * deltaV) / impedance) * 10) / 10 : 0.0;
      const maxPowerW = node.data.ratedVoltageV ? (node.data.ratedVoltageV * node.data.ratedVoltageV) / impedance : 10.0;
      const powerPercent = isEnergized ? Math.min(100, Math.round((powerWatts / maxPowerW) * 100)) : 0;

      if (
        node.data.isEnergized !== isEnergized ||
        node.data.voltageV !== deltaV ||
        node.data.currentA !== currentA ||
        node.data.powerWatts !== powerWatts ||
        node.data.powerPercent !== powerPercent
      ) {
        return {
          ...node,
          data: {
            ...node.data,
            isEnergized,
            voltageV: deltaV,
            currentA,
            powerWatts,
            powerPercent,
          },
        };
      }
      return node;
    }

    // Transistors (NPN & PNP)
    if (type === 'transistor_bjt_npn' || type === 'transistor_bjt_pnp') {
      const netB = netMap.get(`${nodeId}::base`);
      const netC = netMap.get(`${nodeId}::collector`);
      const netE = netMap.get(`${nodeId}::emitter`);

      const potB = netB !== undefined ? netPotentials.get(netB) : undefined;
      const potC = netC !== undefined ? netPotentials.get(netC) : undefined;
      const potE = netE !== undefined ? netPotentials.get(netE) : undefined;

      let vBe = 0;
      let vCe = 0;
      let isConducting = false;

      if (type === 'transistor_bjt_npn') {
        if (potB !== undefined && potE !== undefined) {
          vBe = Math.round((potB - potE) * 10) / 10;
        }
        if (potC !== undefined && potE !== undefined) {
          vCe = Math.round((potC - potE) * 10) / 10;
        }
        isConducting = vBe >= 0.65;
      } else {
        if (potE !== undefined && potB !== undefined) {
          vBe = Math.round((potE - potB) * 10) / 10;
        }
        if (potE !== undefined && potC !== undefined) {
          vCe = Math.round((potE - potC) * 10) / 10;
        }
        isConducting = vBe >= 0.65;
      }

      const transistorState: 'saturation' | 'cutoff' = isConducting ? 'saturation' : 'cutoff';

      if (
        node.data.isEnergized !== isConducting ||
        node.data.transistorState !== transistorState ||
        node.data.vBe !== vBe ||
        node.data.vCe !== vCe
      ) {
        return {
          ...node,
          data: {
            ...node.data,
            isEnergized: isConducting,
            transistorState,
            vBe,
            vCe,
          },
        };
      }
      return node;
    }

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

      // Detect if voltmeter COM probe or POS probe is connected in series through an unenergized load
      let isSeriesDetected = false;
      for (const otherNode of nodes) {
        if (isLoadType(otherNode.data.componentType) && !energizedNodeIds.has(otherNode.id)) {
          const { t1, t2 } = getLoadTerminals(otherNode.data.componentType);
          const loadT1Net = netMap.get(`${otherNode.id}::${t1}`);
          const loadT2Net = netMap.get(`${otherNode.id}::${t2}`);
          if (loadT1Net === netCom && loadT2Net !== undefined && netPotentials.has(loadT2Net)) {
            if (potCom === undefined) potCom = netPotentials.get(loadT2Net);
            isSeriesDetected = true;
            break;
          } else if (loadT2Net === netCom && loadT1Net !== undefined && netPotentials.has(loadT1Net)) {
            if (potCom === undefined) potCom = netPotentials.get(loadT1Net);
            isSeriesDetected = true;
            break;
          } else if (loadT1Net === netPos && loadT2Net !== undefined && netPotentials.has(loadT2Net)) {
            if (potPos === undefined) potPos = netPotentials.get(loadT2Net);
            isSeriesDetected = true;
            break;
          } else if (loadT2Net === netPos && loadT1Net !== undefined && netPotentials.has(loadT1Net)) {
            if (potPos === undefined) potPos = netPotentials.get(loadT1Net);
            isSeriesDetected = true;
            break;
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

    // Helper to calculate total active branch/circuit current for ammeter and wattmeter
    const calculateTotalCircuitCurrent = () => {
      let totalI = 0;
      for (const oNode of nodes) {
        if (energizedNodeIds.has(oNode.id)) {
          const { t1, t2 } = getLoadTerminals(oNode.data.componentType);
          const n1 = netMap.get(`${oNode.id}::${t1}`);
          const n2 = netMap.get(`${oNode.id}::${t2}`);
          const p1 = n1 !== undefined ? netPotentials.get(n1) : undefined;
          const p2 = n2 !== undefined ? netPotentials.get(n2) : undefined;
          if (p1 !== undefined && p2 !== undefined) {
            const v = Math.abs(p1 - p2);
            const r = getComponentResistance(oNode);
            if (r > 0 && v > 0) totalI += v / r;
          }
        }
      }
      return totalI;
    };

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

      const current = isCurrentFlowing ? Math.round(calculateTotalCircuitCurrent() * 100) / 100 : 0.0;
      const power = Math.round(voltage * current * 10) / 10;

      if (
        node.data.measuredValue !== power ||
        node.data.powerWatts !== power ||
        node.data.voltageV !== voltage ||
        node.data.currentA !== current
      ) {
        return {
          ...node,
          data: {
            ...node.data,
            measuredValue: power,
            powerWatts: power,
            voltageV: voltage,
            currentA: current,
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

      const measuredValue = isConducting ? Math.round(calculateTotalCircuitCurrent() * 100) / 100 : 0.0;

      if (node.data.measuredValue !== measuredValue || node.data.currentA !== measuredValue) {
        return {
          ...node,
          data: {
            ...node.data,
            measuredValue,
            currentA: measuredValue,
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
        if (isLoadType(otherNode.data.componentType)) {
          measuredResistance = getComponentResistance(otherNode);
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

    // Power Sources: Delivered Current, Power, and Max Current Overload Warning
    if (
      type === 'dc_power_source' ||
      type === 'battery_dc_cell' ||
      type === 'cell_dc_simple' ||
      type === 'power_supply_dc_24v' ||
      type === 'power_source_ac' ||
      type === 'power_source_ac_3p'
    ) {
      const isSrcEnergized = node.data.isEnergized ?? true;
      let deliveredCurrent = 0;

      if (isSrcEnergized && anyEnergized) {
        let posTerm = 'pos';
        let negTerm = 'neg';
        if (type === 'power_source_ac') {
          posTerm = 'phase';
          negTerm = 'neutral';
        } else if (type === 'power_source_ac_3p') {
          posTerm = 'l1';
          negTerm = 'neutral';
        } else if (type === 'power_supply_dc_24v') {
          posTerm = 'dc_plus';
          negTerm = 'dc_minus';
        }

        const posNet = netMap.get(`${nodeId}::${posTerm}`);
        const negNet = netMap.get(`${nodeId}::${negTerm}`);

        for (const otherNode of nodes) {
          if (otherNode.id === nodeId) continue;
          if (isLoadType(otherNode.data.componentType) && energizedNodeIds.has(otherNode.id)) {
            const { t1, t2 } = getLoadTerminals(otherNode.data.componentType);
            const n1 = netMap.get(`${otherNode.id}::${t1}`);
            const n2 = netMap.get(`${otherNode.id}::${t2}`);
            if (
              (n1 === posNet && n2 === negNet) ||
              (n1 === negNet && n2 === posNet)
            ) {
              const r = getComponentResistance(otherNode);
              const v = Math.abs((netPotentials.get(n1 ?? -1) ?? 0) - (netPotentials.get(n2 ?? -1) ?? 0));
              if (r > 0 && v > 0) {
                deliveredCurrent += v / r;
              }
            }
          }
        }

        if (deliveredCurrent === 0 && anyEnergized) {
          deliveredCurrent = calculateTotalCircuitCurrent();
        }
      }

      const currentA = Math.round(deliveredCurrent * 100) / 100;
      const vNominal = node.data.voltageV !== undefined
        ? node.data.voltageV
        : (type === 'cell_dc_simple' ? 1.5 : type === 'power_source_ac' ? 230.0 : type === 'power_source_ac_3p' ? 400.0 : 12.0);
      const powerWatts = Math.round(vNominal * currentA * 10) / 10;

      let currentLimitWarning: string | undefined = undefined;
      const maxCurrentA = node.data.maxCurrentA;
      if (maxCurrentA !== undefined && maxCurrentA > 0 && currentA > maxCurrentA) {
        currentLimitWarning = `⚠️ Límite de corriente superado (${currentA.toFixed(2)}A > ${maxCurrentA.toFixed(2)}A) - Modo CC`;
      }

      if (
        node.data.currentA !== currentA ||
        node.data.powerWatts !== powerWatts ||
        node.data.currentLimitWarning !== currentLimitWarning ||
        node.data.voltageV !== vNominal
      ) {
        return {
          ...node,
          data: {
            ...node.data,
            voltageV: vNominal,
            currentA,
            powerWatts,
            currentLimitWarning,
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
    case 'audio_speaker':
      return ['audio_pos', 'audio_neg'];
    case 'electric_motor_1p':
      return ['term_l', 'term_n', 'term_pe'];
    case 'electric_motor_3p':
      return ['term_u1', 'term_v1', 'term_w1', 'term_pe'];
    case 'electric_motor_dc':
      return ['term_pos', 'term_neg', 'term_pe'];
    case 'transistor_bjt_npn':
    case 'transistor_bjt_pnp':
      return ['base', 'collector', 'emitter'];
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
