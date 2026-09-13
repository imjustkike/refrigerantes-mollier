import { describe, it, expect } from 'vitest';
import { solveElectricalCircuit } from './circuitSolver';
import { SchematicEdge, SchematicNode } from '../../types/schematic';

describe('solveElectricalCircuit', () => {
  it('energizes light bulb in closed loop with battery and closed switch', () => {
    const nodes: SchematicNode[] = [
      {
        id: 'bat-1',
        type: 'schematicGeneric',
        position: { x: 100, y: 100 },
        data: {
          componentType: 'battery_dc_cell',
          label: 'Batería 12V',
          voltageV: 12,
          isEnergized: true,
        },
      },
      {
        id: 'sw-1',
        type: 'schematicGeneric',
        position: { x: 250, y: 100 },
        data: {
          componentType: 'switch_spst',
          label: 'Interruptor',
          isSwitchClosed: true,
          isEnergized: false,
        },
      },
      {
        id: 'bulb-1',
        type: 'schematicGeneric',
        position: { x: 400, y: 100 },
        data: {
          componentType: 'light_bulb',
          label: 'Bombilla',
          isEnergized: false,
        },
      },
    ];

    const edges: SchematicEdge[] = [
      {
        id: 'e1',
        source: 'bat-1',
        sourceHandle: 'pos',
        target: 'sw-1',
        targetHandle: 'in',
        data: { pipeState: 'electric_phase', isAnimated: false },
      },
      {
        id: 'e2',
        source: 'sw-1',
        sourceHandle: 'out',
        target: 'bulb-1',
        targetHandle: 'terminal_1',
        data: { pipeState: 'electric_phase', isAnimated: false },
      },
      {
        id: 'e3',
        source: 'bulb-1',
        sourceHandle: 'terminal_2',
        target: 'bat-1',
        targetHandle: 'neg',
        data: { pipeState: 'electric_neutral', isAnimated: false },
      },
    ];

    const result = solveElectricalCircuit(nodes, edges);

    const bulb = result.nodes.find((n) => n.id === 'bulb-1');
    expect(bulb?.data.isEnergized).toBe(true);
    expect(result.isAnyEnergized).toBe(true);

    // Edges participating in energized path should be animated
    const animatedEdges = result.edges.filter((e) => e.data?.isAnimated);
    expect(animatedEdges.length).toBe(3);
  });

  it('turns light bulb OFF when switch is open', () => {
    const nodes: SchematicNode[] = [
      {
        id: 'bat-1',
        type: 'schematicGeneric',
        position: { x: 100, y: 100 },
        data: {
          componentType: 'battery_dc_cell',
          label: 'Batería 12V',
          voltageV: 12,
          isEnergized: true,
        },
      },
      {
        id: 'sw-1',
        type: 'schematicGeneric',
        position: { x: 250, y: 100 },
        data: {
          componentType: 'switch_spst',
          label: 'Interruptor',
          isSwitchClosed: false, // OPEN
          isEnergized: false,
        },
      },
      {
        id: 'bulb-1',
        type: 'schematicGeneric',
        position: { x: 400, y: 100 },
        data: {
          componentType: 'light_bulb',
          label: 'Bombilla',
          isEnergized: true,
        },
      },
    ];

    const edges: SchematicEdge[] = [
      {
        id: 'e1',
        source: 'bat-1',
        sourceHandle: 'pos',
        target: 'sw-1',
        targetHandle: 'in',
        data: { pipeState: 'electric_phase', isAnimated: true },
      },
      {
        id: 'e2',
        source: 'sw-1',
        sourceHandle: 'out',
        target: 'bulb-1',
        targetHandle: 'terminal_1',
        data: { pipeState: 'electric_phase', isAnimated: true },
      },
      {
        id: 'e3',
        source: 'bulb-1',
        sourceHandle: 'terminal_2',
        target: 'bat-1',
        targetHandle: 'neg',
        data: { pipeState: 'electric_neutral', isAnimated: true },
      },
    ];

    const result = solveElectricalCircuit(nodes, edges);

    const bulb = result.nodes.find((n) => n.id === 'bulb-1');
    expect(bulb?.data.isEnergized).toBe(false);

    // No closed circuit -> wires stop animating
    const animatedEdges = result.edges.filter((e) => e.data?.isAnimated);
    expect(animatedEdges.length).toBe(0);
  });

  it('measures voltage on voltmeter connected across battery', () => {
    const nodes: SchematicNode[] = [
      {
        id: 'bat-1',
        type: 'schematicGeneric',
        position: { x: 100, y: 100 },
        data: {
          componentType: 'battery_dc_cell',
          label: 'Batería 12V',
          voltageV: 12.0,
          isEnergized: true,
        },
      },
      {
        id: 'vm-1',
        type: 'schematicGeneric',
        position: { x: 250, y: 100 },
        data: {
          componentType: 'voltmeter_basic',
          label: 'Voltímetro',
          measuredValue: 0.0,
        },
      },
    ];

    const edges: SchematicEdge[] = [
      {
        id: 'e1',
        source: 'bat-1',
        sourceHandle: 'pos',
        target: 'vm-1',
        targetHandle: 'v_pos',
        data: { pipeState: 'electric_phase', isAnimated: false },
      },
      {
        id: 'e2',
        source: 'vm-1',
        sourceHandle: 'v_com',
        target: 'bat-1',
        targetHandle: 'neg',
        data: { pipeState: 'electric_neutral', isAnimated: false },
      },
    ];

    const result = solveElectricalCircuit(nodes, edges);
    const vm = result.nodes.find((n) => n.id === 'vm-1');
    expect(vm?.data.measuredValue).toBe(12.0);
  });

  it('reproduces user circuit: voltmeter connected in series measures 12V but leaves bulb OFF and flags isSeriesWarning', () => {
    // Battery(+) -> Voltmeter(v_pos) | Voltmeter(v_com) -> Bulb(T1) | Bulb(T2) -> Switch(1) | Switch(2) -> Battery(-)
    const nodes: SchematicNode[] = [
      {
        id: 'bat-1',
        type: 'schematicGeneric',
        position: { x: 50, y: 100 },
        data: {
          componentType: 'battery_dc_cell',
          label: 'Batería 12V',
          voltageV: 12.0,
          isEnergized: true,
        },
      },
      {
        id: 'vm-1',
        type: 'schematicGeneric',
        position: { x: 200, y: 50 },
        data: {
          componentType: 'voltmeter_basic',
          label: 'Voltímetro Digital',
          measuredValue: 0.0,
          isSeriesPassThrough: false,
        },
      },
      {
        id: 'lmp-1',
        type: 'schematicGeneric',
        position: { x: 350, y: 100 },
        data: {
          componentType: 'light_bulb',
          label: 'Bombilla Incandescente',
          isEnergized: false,
        },
      },
      {
        id: 'sw-1',
        type: 'schematicGeneric',
        position: { x: 200, y: 200 },
        data: {
          componentType: 'switch_spst',
          label: 'Interruptor SPST',
          isSwitchClosed: true, // CLOSED
        },
      },
    ];

    const edges: SchematicEdge[] = [
      {
        id: 'e1',
        source: 'bat-1',
        sourceHandle: 'pos',
        target: 'vm-1',
        targetHandle: 'v_pos',
      },
      {
        id: 'e2',
        source: 'vm-1',
        sourceHandle: 'v_com',
        target: 'lmp-1',
        targetHandle: 'terminal_1',
      },
      {
        id: 'e3',
        source: 'lmp-1',
        sourceHandle: 'terminal_2',
        target: 'sw-1',
        targetHandle: '2',
      },
      {
        id: 'e4',
        source: 'sw-1',
        sourceHandle: '1',
        target: 'bat-1',
        targetHandle: 'neg',
      },
    ];

    const result = solveElectricalCircuit(nodes, edges);
    const vm = result.nodes.find((n) => n.id === 'vm-1');
    const bulb = result.nodes.find((n) => n.id === 'lmp-1');

    // Voltmeter correctly measures 12V because it feels 12V on v_pos and ground through bulb/switch on v_com
    expect(vm?.data.measuredValue).toBe(12.0);
    // Bulb is OFF because voltmeter blocks current in series (10 MOhm internal resistance)
    expect(bulb?.data.isEnergized).toBe(false);
    // System correctly flags that the voltmeter is connected in series
    expect(vm?.data.isSeriesWarning).toBe(true);
  });

  it('allows bulb to energize when voltmeter has isSeriesPassThrough enabled (Bypass Mode)', () => {
    const nodes: SchematicNode[] = [
      {
        id: 'bat-1',
        type: 'schematicGeneric',
        position: { x: 50, y: 100 },
        data: {
          componentType: 'battery_dc_cell',
          label: 'Batería 12V',
          voltageV: 12.0,
          isEnergized: true,
        },
      },
      {
        id: 'vm-1',
        type: 'schematicGeneric',
        position: { x: 200, y: 50 },
        data: {
          componentType: 'voltmeter_basic',
          label: 'Voltímetro Digital',
          measuredValue: 0.0,
          isSeriesPassThrough: true, // BYPASS ENABLED
        },
      },
      {
        id: 'lmp-1',
        type: 'schematicGeneric',
        position: { x: 350, y: 100 },
        data: {
          componentType: 'light_bulb',
          label: 'Bombilla Incandescente',
          isEnergized: false,
        },
      },
      {
        id: 'sw-1',
        type: 'schematicGeneric',
        position: { x: 200, y: 200 },
        data: {
          componentType: 'switch_spst',
          label: 'Interruptor SPST',
          isSwitchClosed: true,
        },
      },
    ];

    const edges: SchematicEdge[] = [
      { id: 'e1', source: 'bat-1', sourceHandle: 'pos', target: 'vm-1', targetHandle: 'v_pos' },
      { id: 'e2', source: 'vm-1', sourceHandle: 'v_com', target: 'lmp-1', targetHandle: 'terminal_1' },
      { id: 'e3', source: 'lmp-1', sourceHandle: 'terminal_2', target: 'sw-1', targetHandle: '2' },
      { id: 'e4', source: 'sw-1', sourceHandle: '1', target: 'bat-1', targetHandle: 'neg' },
    ];

    const result = solveElectricalCircuit(nodes, edges);
    const vm = result.nodes.find((n) => n.id === 'vm-1');
    const bulb = result.nodes.find((n) => n.id === 'lmp-1');

    expect(vm?.data.measuredValue).toBe(12.0);
    expect(bulb?.data.isEnergized).toBe(true);
    expect(vm?.data.isSeriesWarning).toBe(false);
  });

  it('measures wattmeter active power when both V and I coils are connected', () => {
    const nodes: SchematicNode[] = [
      {
        id: 'bat-1',
        type: 'schematicGeneric',
        position: { x: 50, y: 100 },
        data: {
          componentType: 'battery_dc_cell',
          label: 'Batería 12V',
          voltageV: 12.0,
          isEnergized: true,
        },
      },
      {
        id: 'wm-1',
        type: 'schematicGeneric',
        position: { x: 200, y: 100 },
        data: {
          componentType: 'wattmeter_basic',
          label: 'Vatímetro Digital',
          measuredValue: 0.0,
        },
      },
      {
        id: 'bulb-1',
        type: 'schematicGeneric',
        position: { x: 350, y: 100 },
        data: {
          componentType: 'light_bulb',
          label: 'Bombilla',
          isEnergized: false,
        },
      },
    ];

    const edges: SchematicEdge[] = [
      // Current coil in series: Battery(+) -> Wattmeter(I_IN) -> Wattmeter(I_OUT) -> Bulb
      { id: 'e1', source: 'bat-1', sourceHandle: 'pos', target: 'wm-1', targetHandle: 'i_in' },
      { id: 'e2', source: 'wm-1', sourceHandle: 'i_out', target: 'bulb-1', targetHandle: 'terminal_1' },
      // Return: Bulb -> Battery(-)
      { id: 'e3', source: 'bulb-1', sourceHandle: 'terminal_2', target: 'bat-1', targetHandle: 'neg' },
      // Voltage sense in parallel:
      { id: 'e4', source: 'bat-1', sourceHandle: 'pos', target: 'wm-1', targetHandle: 'v_pos' },
      { id: 'e5', source: 'bat-1', sourceHandle: 'neg', target: 'wm-1', targetHandle: 'v_com' },
    ];

    const result = solveElectricalCircuit(nodes, edges);
    const bulb = result.nodes.find((n) => n.id === 'bulb-1');
    const wm = result.nodes.find((n) => n.id === 'wm-1');

    expect(bulb?.data.isEnergized).toBe(true);
    expect(wm?.data.measuredValue).toBeGreaterThan(0);
  });

  it('reproduces User Image 2: SPDT switch commutates between 2 bulbs and never leaves both energized', () => {
    // Battery(+) connected to T1 of both bulbs
    // Battery(-) connected to Switch COM
    // Switch L1 connected to Bulb 1 T2
    // Switch L2 connected to Bulb 2 T2
    const baseNodes: SchematicNode[] = [
      {
        id: 'bat-1',
        type: 'schematicGeneric',
        position: { x: 50, y: 100 },
        data: {
          componentType: 'battery_dc_cell',
          label: 'Batería 12V',
          voltageV: 12.0,
          isEnergized: true,
        },
      },
      {
        id: 'sw-com',
        type: 'schematicGeneric',
        position: { x: 200, y: 150 },
        data: {
          componentType: 'switch_spdt',
          label: 'Conmutador',
          isSwitchClosed: false, // Position 1 (L1)
        },
      },
      {
        id: 'lmp-1',
        type: 'schematicGeneric',
        position: { x: 350, y: 50 },
        data: {
          componentType: 'light_bulb',
          label: 'Bombilla 1',
          isEnergized: false,
        },
      },
      {
        id: 'lmp-2',
        type: 'schematicGeneric',
        position: { x: 350, y: 250 },
        data: {
          componentType: 'light_bulb',
          label: 'Bombilla 2',
          isEnergized: false,
        },
      },
    ];

    const edges: SchematicEdge[] = [
      { id: 'e1', source: 'bat-1', sourceHandle: 'pos', target: 'lmp-1', targetHandle: 'terminal_1' },
      { id: 'e2', source: 'bat-1', sourceHandle: 'pos', target: 'lmp-2', targetHandle: 'terminal_1' },
      { id: 'e3', source: 'bat-1', sourceHandle: 'neg', target: 'sw-com', targetHandle: 'common' },
      { id: 'e4', source: 'sw-com', sourceHandle: 'l1', target: 'lmp-1', targetHandle: 'terminal_2' },
      { id: 'e5', source: 'sw-com', sourceHandle: 'l2', target: 'lmp-2', targetHandle: 'terminal_2' },
    ];

    // Case 1: Switch in Position 1 (L1 active) -> Bulb 1 ON, Bulb 2 OFF!
    const res1 = solveElectricalCircuit(baseNodes, edges);
    const bulb1_pos1 = res1.nodes.find((n) => n.id === 'lmp-1');
    const bulb2_pos1 = res1.nodes.find((n) => n.id === 'lmp-2');

    expect(bulb1_pos1?.data.isEnergized).toBe(true);
    expect(bulb2_pos1?.data.isEnergized).toBe(false);

    // Wire e5 leading to disconnected bulb 2 must NOT animate!
    const edge5_pos1 = res1.edges.find((e) => e.id === 'e5');
    expect(edge5_pos1?.data?.isAnimated).toBe(false);

    // Case 2: Toggle Switch to Position 2 (L2 active) -> Bulb 1 OFF, Bulb 2 ON!
    const toggledNodes: SchematicNode[] = baseNodes.map((n) =>
      n.id === 'sw-com' ? { ...n, data: { ...n.data, isSwitchClosed: true } } : n
    );

    const res2 = solveElectricalCircuit(toggledNodes, edges);
    const bulb1_pos2 = res2.nodes.find((n) => n.id === 'lmp-1');
    const bulb2_pos2 = res2.nodes.find((n) => n.id === 'lmp-2');

    expect(bulb1_pos2?.data.isEnergized).toBe(false);
    expect(bulb2_pos2?.data.isEnergized).toBe(true);

    // Wire e4 leading to disconnected bulb 1 must NOT animate!
    const edge4_pos2 = res2.edges.find((e) => e.id === 'e4');
    expect(edge4_pos2?.data?.isAnimated).toBe(false);
  });

  it('reproduces User Image 1: sums voltages of 3 batteries connected in series (12V + 12V + 12V = 36V)', () => {
    // Bat1(+) -> Bat2(-) | Bat2(+) -> Bat3(-) | Bat3(+) -> Voltmeter(+) | Bat1(-) -> Voltmeter(-)
    const nodes: SchematicNode[] = [
      {
        id: 'bat-1',
        type: 'schematicGeneric',
        position: { x: 50, y: 100 },
        data: {
          componentType: 'battery_dc_cell',
          label: 'Batería 1',
          voltageV: 12.0,
          isEnergized: true,
        },
      },
      {
        id: 'bat-2',
        type: 'schematicGeneric',
        position: { x: 150, y: 100 },
        data: {
          componentType: 'battery_dc_cell',
          label: 'Batería 2',
          voltageV: 12.0,
          isEnergized: true,
        },
      },
      {
        id: 'bat-3',
        type: 'schematicGeneric',
        position: { x: 250, y: 100 },
        data: {
          componentType: 'battery_dc_cell',
          label: 'Batería 3',
          voltageV: 12.0,
          isEnergized: true,
        },
      },
      {
        id: 'vm-1',
        type: 'schematicGeneric',
        position: { x: 350, y: 100 },
        data: {
          componentType: 'voltmeter_basic',
          label: 'Voltímetro',
          measuredValue: 0.0,
        },
      },
    ];

    const edges: SchematicEdge[] = [
      { id: 'e1', source: 'bat-1', sourceHandle: 'pos', target: 'bat-2', targetHandle: 'neg' },
      { id: 'e2', source: 'bat-2', sourceHandle: 'pos', target: 'bat-3', targetHandle: 'neg' },
      { id: 'e3', source: 'bat-3', sourceHandle: 'pos', target: 'vm-1', targetHandle: 'v_pos' },
      { id: 'e4', source: 'bat-1', sourceHandle: 'neg', target: 'vm-1', targetHandle: 'v_com' },
    ];

    const result = solveElectricalCircuit(nodes, edges);
    const vm = result.nodes.find((n) => n.id === 'vm-1');

    // 12V + 12V + 12V = 36V!
    expect(vm?.data.measuredValue).toBe(36.0);
  });

  it('measures 12V for 3 batteries in parallel and leaves circuit safe', () => {
    // 3 batteries all connected in parallel to voltmeter (+ to +, - to -)
    const nodes: SchematicNode[] = [
      { id: 'b1', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { label: 'B1', componentType: 'battery_dc_cell', voltageV: 12, isEnergized: true } },
      { id: 'b2', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { label: 'B2', componentType: 'battery_dc_cell', voltageV: 12, isEnergized: true } },
      { id: 'b3', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { label: 'B3', componentType: 'battery_dc_cell', voltageV: 12, isEnergized: true } },
      { id: 'vm', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { label: 'VM', componentType: 'voltmeter_basic', measuredValue: 0 } },
    ];

    const edges: SchematicEdge[] = [
      { id: 'e1', source: 'b1', sourceHandle: 'pos', target: 'b2', targetHandle: 'pos' },
      { id: 'e2', source: 'b2', sourceHandle: 'pos', target: 'b3', targetHandle: 'pos' },
      { id: 'e3', source: 'b3', sourceHandle: 'pos', target: 'vm', targetHandle: 'v_pos' },
      { id: 'e4', source: 'b1', sourceHandle: 'neg', target: 'b2', targetHandle: 'neg' },
      { id: 'e5', source: 'b2', sourceHandle: 'neg', target: 'b3', targetHandle: 'neg' },
      { id: 'e6', source: 'b3', sourceHandle: 'neg', target: 'vm', targetHandle: 'v_com' },
    ];

    const result = solveElectricalCircuit(nodes, edges);
    const vm = result.nodes.find((n) => n.id === 'vm');
    expect(vm?.data.measuredValue).toBe(12.0);
  });

  it('controls circuit correctly using rotary selector switch (selector_switch_rotary)', () => {
    const nodes: SchematicNode[] = [
      { id: 'bat', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { label: 'BAT', componentType: 'battery_dc_cell', voltageV: 24, isEnergized: true } },
      { id: 'sel', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { label: 'SEL', componentType: 'selector_switch_rotary', selectorPosition: 'man' } },
      { id: 'lamp-man', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { label: 'LMP1', componentType: 'light_bulb', isEnergized: false } },
      { id: 'lamp-auto', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { label: 'LMP2', componentType: 'light_bulb', isEnergized: false } },
    ];

    const edges: SchematicEdge[] = [
      { id: 'e1', source: 'bat', sourceHandle: 'pos', target: 'sel', targetHandle: 'common_in' },
      { id: 'e2', source: 'sel', sourceHandle: 'manual_out', target: 'lamp-man', targetHandle: 'terminal_1' },
      { id: 'e3', source: 'sel', sourceHandle: 'auto_out', target: 'lamp-auto', targetHandle: 'terminal_1' },
      { id: 'e4', source: 'lamp-man', sourceHandle: 'terminal_2', target: 'bat', targetHandle: 'neg' },
      { id: 'e5', source: 'lamp-auto', sourceHandle: 'terminal_2', target: 'bat', targetHandle: 'neg' },
    ];

    // In 'man' mode: lamp-man is ON, lamp-auto is OFF
    const resMan = solveElectricalCircuit(nodes, edges);
    expect(resMan.nodes.find((n) => n.id === 'lamp-man')?.data.isEnergized).toBe(true);
    expect(resMan.nodes.find((n) => n.id === 'lamp-auto')?.data.isEnergized).toBe(false);

    // In 'auto' mode: lamp-man is OFF, lamp-auto is ON
    const autoNodes: SchematicNode[] = nodes.map((n) => n.id === 'sel' ? { ...n, data: { ...n.data, selectorPosition: 'auto' as const } } : n);
    const resAuto = solveElectricalCircuit(autoNodes, edges);
    expect(resAuto.nodes.find((n) => n.id === 'lamp-man')?.data.isEnergized).toBe(false);
    expect(resAuto.nodes.find((n) => n.id === 'lamp-auto')?.data.isEnergized).toBe(true);

    // In 'off' mode: both are OFF
    const offNodes: SchematicNode[] = nodes.map((n) => n.id === 'sel' ? { ...n, data: { ...n.data, selectorPosition: 'off' as const } } : n);
    const resOff = solveElectricalCircuit(offNodes, edges);
    expect(resOff.nodes.find((n) => n.id === 'lamp-man')?.data.isEnergized).toBe(false);
    expect(resOff.nodes.find((n) => n.id === 'lamp-auto')?.data.isEnergized).toBe(false);
  });

  it('interrupts circuit when emergency stop button is pressed', () => {
    const nodes: SchematicNode[] = [
      { id: 'bat', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { label: 'BAT', componentType: 'battery_dc_cell', voltageV: 24, isEnergized: true } },
      { id: 'estop', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { label: 'ESTOP', componentType: 'emergency_stop_button', isPushButtonPressed: false } },
      { id: 'lamp', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { label: 'LMP', componentType: 'light_bulb', isEnergized: false } },
    ];

    const edges: SchematicEdge[] = [
      { id: 'e1', source: 'bat', sourceHandle: 'pos', target: 'estop', targetHandle: 'term_1' },
      { id: 'e2', source: 'estop', sourceHandle: 'term_2', target: 'lamp', targetHandle: 'terminal_1' },
      { id: 'e3', source: 'lamp', sourceHandle: 'terminal_2', target: 'bat', targetHandle: 'neg' },
    ];

    // Unpressed: bulb is ON
    const resNormal = solveElectricalCircuit(nodes, edges);
    expect(resNormal.nodes.find((n) => n.id === 'lamp')?.data.isEnergized).toBe(true);

    // Pressed (Emergency triggered): bulb is immediately cut OFF
    const pressedNodes = nodes.map((n) => n.id === 'estop' ? { ...n, data: { ...n.data, isPushButtonPressed: true } } : n);
    const resTripped = solveElectricalCircuit(pressedNodes, edges);
    expect(resTripped.nodes.find((n) => n.id === 'lamp')?.data.isEnergized).toBe(false);
  });
});

