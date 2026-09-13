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

  it('motor DC does NOT turn on if voltage is below minOperatingVoltageV, and runs at full power when nominal voltage is reached', () => {
    // Case 1: Insufficient voltage (e.g. Cell 1.5V connected to 12V motor with 7V threshold)
    const lowNodes: SchematicNode[] = [
      { id: 'cell', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { label: 'PILA', componentType: 'cell_dc_simple', voltageV: 1.5, isEnergized: true } },
      { id: 'motor', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { label: 'MOTOR', componentType: 'electric_motor_dc', ratedVoltageV: 12.0, minOperatingVoltageV: 7.0, ratedRpm: 3000, isEnergized: false } },
    ];
    const lowEdges: SchematicEdge[] = [
      { id: 'e1', source: 'cell', sourceHandle: 'pos', target: 'motor', targetHandle: 'term_pos' },
      { id: 'e2', source: 'motor', sourceHandle: 'term_neg', target: 'cell', targetHandle: 'neg' },
    ];

    const lowRes = solveElectricalCircuit(lowNodes, lowEdges);
    const lowMotor = lowRes.nodes.find((n) => n.id === 'motor');
    // Does NOT turn on:
    expect(lowMotor?.data.isEnergized).toBe(false);
    expect(lowMotor?.data.actualRpm).toBe(0);
    expect(lowMotor?.data.powerPercent).toBe(0);
    expect(lowMotor?.data.motorVoltageWarning).toContain('Subtensión');

    // Case 2: Full rated voltage (12V battery connected to 12V motor)
    const fullNodes: SchematicNode[] = [
      { id: 'bat12', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { label: 'BAT12', componentType: 'battery_dc_cell', voltageV: 12.0, isEnergized: true } },
      { id: 'motor', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { label: 'MOTOR', componentType: 'electric_motor_dc', ratedVoltageV: 12.0, minOperatingVoltageV: 7.0, ratedRpm: 3000, isEnergized: false } },
    ];
    const fullEdges: SchematicEdge[] = [
      { id: 'e1', source: 'bat12', sourceHandle: 'pos', target: 'motor', targetHandle: 'term_pos' },
      { id: 'e2', source: 'motor', sourceHandle: 'term_neg', target: 'bat12', targetHandle: 'neg' },
    ];

    const fullRes = solveElectricalCircuit(fullNodes, fullEdges);
    const fullMotor = fullRes.nodes.find((n) => n.id === 'motor');
    // Runs at full power (100%, 3000 RPM):
    expect(fullMotor?.data.isEnergized).toBe(true);
    expect(fullMotor?.data.powerPercent).toBe(100);
    expect(fullMotor?.data.actualRpm).toBe(3000);
    expect(fullMotor?.data.motorVoltageWarning).toBeUndefined();

    // Case 3: Partial operating voltage (9V source, between 7V and 12V)
    const partialNodes: SchematicNode[] = [
      { id: 'src9', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { label: 'SRC9', componentType: 'dc_power_source', voltageV: 9.0, isEnergized: true } },
      { id: 'motor', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { label: 'MOTOR', componentType: 'electric_motor_dc', ratedVoltageV: 12.0, minOperatingVoltageV: 7.0, ratedRpm: 3000, isEnergized: false } },
    ];
    const partialEdges: SchematicEdge[] = [
      { id: 'e1', source: 'src9', sourceHandle: 'pos', target: 'motor', targetHandle: 'term_pos' },
      { id: 'e2', source: 'motor', sourceHandle: 'term_neg', target: 'src9', targetHandle: 'neg' },
    ];

    const partRes = solveElectricalCircuit(partialNodes, partialEdges);
    const partMotor = partRes.nodes.find((n) => n.id === 'motor');
    // Turns on with proportional speed/power (9V / 12V = 75% power, 2250 RPM):
    expect(partMotor?.data.isEnergized).toBe(true);
    expect(partMotor?.data.powerPercent).toBe(75);
    expect(partMotor?.data.actualRpm).toBe(2250);
  });

  it('audio speaker energizes and computes acoustic power (V^2 / R)', () => {
    const nodes: SchematicNode[] = [
      { id: 'bat', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { label: 'BAT', componentType: 'battery_dc_cell', voltageV: 12.0, isEnergized: true } },
      { id: 'spk', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { label: 'ALTAVOZ', componentType: 'audio_speaker', impedanceOhm: 8.0, minOperatingVoltageV: 1.0, isEnergized: false } },
    ];
    const edges: SchematicEdge[] = [
      { id: 'e1', source: 'bat', sourceHandle: 'pos', target: 'spk', targetHandle: 'audio_pos' },
      { id: 'e2', source: 'spk', sourceHandle: 'audio_neg', target: 'bat', targetHandle: 'neg' },
    ];

    const res = solveElectricalCircuit(nodes, edges);
    const speaker = res.nodes.find((n) => n.id === 'spk');
    expect(speaker?.data.isEnergized).toBe(true);
    // P = V^2 / R = 12^2 / 8 = 144 / 8 = 18 W
    expect(speaker?.data.powerWatts).toBe(18);
  });

  it('transistor BJT NPN switches ON downstream motor load when base is energized', () => {
    // Circuit:
    // 12V Battery pos -> Switch -> Transistor Base (B)
    // Transistor Emitter (E) -> Battery neg (GND)
    // 12V Battery pos -> Motor DC pos -> Motor DC neg -> Transistor Collector (C)
    const nodes: SchematicNode[] = [
      { id: 'bat', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { label: 'BAT', componentType: 'battery_dc_cell', voltageV: 12.0, isEnergized: true } },
      { id: 'sw-base', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { label: 'SW', componentType: 'switch_spst', isSwitchClosed: false } },
      { id: 'npn', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { label: 'Q1', componentType: 'transistor_bjt_npn', isEnergized: false } },
      { id: 'motor', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { label: 'MOTOR', componentType: 'electric_motor_dc', ratedVoltageV: 12.0, minOperatingVoltageV: 6.0, ratedRpm: 3000, isEnergized: false } },
    ];

    const edges: SchematicEdge[] = [
      // Base drive circuit: Bat(+) -> Switch -> Base
      { id: 'e-b1', source: 'bat', sourceHandle: 'pos', target: 'sw-base', targetHandle: 'in' },
      { id: 'e-b2', source: 'sw-base', sourceHandle: 'out', target: 'npn', targetHandle: 'base' },
      // Emitter to GND
      { id: 'e-e', source: 'npn', sourceHandle: 'emitter', target: 'bat', targetHandle: 'neg' },
      // Collector load circuit: Bat(+) -> Motor(+) -> Motor(-) -> Collector
      { id: 'e-c1', source: 'bat', sourceHandle: 'pos', target: 'motor', targetHandle: 'term_pos' },
      { id: 'e-c2', source: 'motor', sourceHandle: 'term_neg', target: 'npn', targetHandle: 'collector' },
    ];

    // 1. Switch is OPEN: Base has 0V -> Transistor is CUTOFF -> Motor is OFF
    const resOpen = solveElectricalCircuit(nodes, edges);
    const npnOpen = resOpen.nodes.find((n) => n.id === 'npn');
    const motorOpen = resOpen.nodes.find((n) => n.id === 'motor');
    expect(npnOpen?.data.isEnergized).toBe(false);
    expect(npnOpen?.data.transistorState).toBe('cutoff');
    expect(motorOpen?.data.isEnergized).toBe(false);

    // 2. Switch is CLOSED: Base receives 12V -> Vbe >= 0.7V -> Transistor SATURATION -> Motor turns ON at full power!
    const closedNodes = nodes.map((n) => n.id === 'sw-base' ? { ...n, data: { ...n.data, isSwitchClosed: true } } : n);
    const resClosed = solveElectricalCircuit(closedNodes, edges);
    const npnClosed = resClosed.nodes.find((n) => n.id === 'npn');
    const motorClosed = resClosed.nodes.find((n) => n.id === 'motor');

    expect(npnClosed?.data.isEnergized).toBe(true);
    expect(npnClosed?.data.transistorState).toBe('saturation');
    expect(motorClosed?.data.isEnergized).toBe(true);
    expect(motorClosed?.data.powerPercent).toBe(100);
    expect(motorClosed?.data.actualRpm).toBe(3000);
  });

  it('light bulb obeys Ohm\'s Law and minOperatingVoltageV threshold', () => {
    // Case 1: Under-voltage (3V applied to a bulb requiring 6V minimum)
    const lowNodes: SchematicNode[] = [
      { id: 'src3', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { componentType: 'dc_power_source', voltageV: 3.0, isEnergized: true, label: '3V' } },
      { id: 'bulb', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { componentType: 'light_bulb', ratedVoltageV: 12.0, minOperatingVoltageV: 6.0, resistanceOhm: 24.0, powerWatts: 6.0, label: 'Bulb' } },
    ];
    const lowEdges: SchematicEdge[] = [
      { id: 'e1', source: 'src3', sourceHandle: 'pos', target: 'bulb', targetHandle: 'terminal_1' },
      { id: 'e2', source: 'bulb', sourceHandle: 'terminal_2', target: 'src3', targetHandle: 'neg' },
    ];

    const lowRes = solveElectricalCircuit(lowNodes, lowEdges);
    const lowBulb = lowRes.nodes.find((n) => n.id === 'bulb');
    expect(lowBulb?.data.isEnergized).toBe(false);
    expect(lowBulb?.data.powerPercent).toBe(0);
    expect(lowBulb?.data.voltageWarning).toContain('Subtensión');

    // Case 2: Full rated voltage (12V applied to 12V bulb)
    const fullNodes: SchematicNode[] = [
      { id: 'bat12', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { componentType: 'battery_dc_cell', voltageV: 12.0, isEnergized: true, label: '12V' } },
      { id: 'bulb', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { componentType: 'light_bulb', ratedVoltageV: 12.0, minOperatingVoltageV: 6.0, resistanceOhm: 24.0, powerWatts: 6.0, label: 'Bulb' } },
    ];
    const fullEdges: SchematicEdge[] = [
      { id: 'e1', source: 'bat12', sourceHandle: 'pos', target: 'bulb', targetHandle: 'terminal_1' },
      { id: 'e2', source: 'bulb', sourceHandle: 'terminal_2', target: 'bat12', targetHandle: 'neg' },
    ];

    const fullRes = solveElectricalCircuit(fullNodes, fullEdges);
    const fullBulb = fullRes.nodes.find((n) => n.id === 'bulb');
    expect(fullBulb?.data.isEnergized).toBe(true);
    expect(fullBulb?.data.voltageV).toBe(12.0);
    // I = V / R = 12 / 24 = 0.5 A
    expect(fullBulb?.data.currentA).toBe(0.5);
    // P = V * I = 12 * 0.5 = 6.0 W
    expect(fullBulb?.data.powerWatts).toBe(6.0);
    expect(fullBulb?.data.powerPercent).toBe(100);
    expect(fullBulb?.data.voltageWarning).toBeUndefined();

    // Case 3: User lowers minOperatingVoltageV down to 2.5V: Now 3V source energizes bulb at reduced power!
    const adjustableNodes: SchematicNode[] = [
      { id: 'src3', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { componentType: 'dc_power_source', voltageV: 3.0, isEnergized: true, label: '3V' } },
      { id: 'bulb', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { componentType: 'light_bulb', ratedVoltageV: 12.0, minOperatingVoltageV: 2.5, resistanceOhm: 24.0, powerWatts: 6.0, label: 'Bulb' } },
    ];
    const adjRes = solveElectricalCircuit(adjustableNodes, lowEdges);
    const adjBulb = adjRes.nodes.find((n) => n.id === 'bulb');
    expect(adjBulb?.data.isEnergized).toBe(true);
    expect(adjBulb?.data.voltageV).toBe(3.0);
    expect(adjBulb?.data.currentA).toBe(0.125);
    expect(adjBulb?.data.powerPercent).toBeGreaterThan(0);
    expect(adjBulb?.data.powerPercent).toBeLessThan(100);
  });

  it('computes voltage divider across series resistor and load according to Ohm\'s Law', () => {
    // 12V Battery -> 24 Ohm Resistor -> 24 Ohm Light Bulb -> Battery Neg
    // By voltage divider:
    // R_total = 24 + 24 = 48 Ohm
    // I = 12 / 48 = 0.25 A
    // V_resistor = 0.25 * 24 = 6.0 V
    // V_bulb = 0.25 * 24 = 6.0 V
    const nodes: SchematicNode[] = [
      { id: 'bat', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { componentType: 'battery_dc_cell', voltageV: 12.0, isEnergized: true, label: 'BAT 12V' } },
      { id: 'res', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { componentType: 'resistor_fixed', resistanceOhm: 24.0, label: 'R1 24Ω' } },
      { id: 'bulb', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { componentType: 'light_bulb', ratedVoltageV: 12.0, minOperatingVoltageV: 5.0, resistanceOhm: 24.0, powerWatts: 6.0, label: 'BULB 24Ω' } },
    ];

    const edges: SchematicEdge[] = [
      { id: 'e1', source: 'bat', sourceHandle: 'pos', target: 'res', targetHandle: 't1' },
      { id: 'e2', source: 'res', sourceHandle: 't2', target: 'bulb', targetHandle: 'terminal_1' },
      { id: 'e3', source: 'bulb', sourceHandle: 'terminal_2', target: 'bat', targetHandle: 'neg' },
    ];

    const res = solveElectricalCircuit(nodes, edges);
    const solvedRes = res.nodes.find((n) => n.id === 'res');
    const solvedBulb = res.nodes.find((n) => n.id === 'bulb');

    expect(solvedRes?.data.voltageV).toBe(6.0);
    expect(solvedRes?.data.currentA).toBe(0.25);
    expect(solvedRes?.data.powerWatts).toBe(1.5);

    expect(solvedBulb?.data.voltageV).toBe(6.0);
    expect(solvedBulb?.data.currentA).toBe(0.25);
    expect(solvedBulb?.data.powerWatts).toBe(1.5);
    // 6.0V >= 5.0V min threshold -> Bulb is ON at 25% power!
    expect(solvedBulb?.data.isEnergized).toBe(true);
    expect(solvedBulb?.data.powerPercent).toBe(25);

    // All wires in the series loop are animated
    const animated = res.edges.filter((e) => e.data?.isAnimated);
    expect(animated.length).toBe(3);
  });

  it('potentiometer wiper regulates motor voltage, speed, and power percentage', () => {
    // 12V Battery -> Potentiometer (t1 to 12V, t2 to 0V)
    // Wiper connects to 12V Motor (+)
    // Motor (-) connects to Battery Neg (0V)
    // When potentiometer is set to 75% opening:
    // Wiper delivers 9.0V
    const nodes: SchematicNode[] = [
      { id: 'bat', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { componentType: 'battery_dc_cell', voltageV: 12.0, isEnergized: true, label: 'BAT 12V' } },
      { id: 'pot', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { componentType: 'potentiometer', resistanceOhm: 10.0, openingPercent: 75.0, label: 'POT' } },
      { id: 'motor', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { componentType: 'electric_motor_dc', ratedVoltageV: 12.0, minOperatingVoltageV: 6.0, ratedRpm: 3000, resistanceOhm: 6.0, label: 'M-DC' } },
    ];

    const edges: SchematicEdge[] = [
      { id: 'e1', source: 'bat', sourceHandle: 'pos', target: 'pot', targetHandle: 't1' },
      { id: 'e2', source: 'bat', sourceHandle: 'neg', target: 'pot', targetHandle: 't2' },
      { id: 'e3', source: 'pot', sourceHandle: 'wiper', target: 'motor', targetHandle: 'term_pos' },
      { id: 'e4', source: 'motor', sourceHandle: 'term_neg', target: 'bat', targetHandle: 'neg' },
    ];

    const res = solveElectricalCircuit(nodes, edges);
    const motor = res.nodes.find((n) => n.id === 'motor');

    expect(motor?.data.isEnergized).toBe(true);
    // Voltage is reduced through potentiometer divider
    expect(motor?.data.voltageV).toBeGreaterThanOrEqual(6.0);
    expect(motor?.data.powerPercent).toBeGreaterThan(0);
    expect(motor?.data.actualRpm).toBeGreaterThan(0);
    expect(motor?.data.currentA).toBeGreaterThan(0);
  });

  it('ammeter measures real branch current according to Ohm\'s law', () => {
    // 12V Battery -> Ammeter -> 24 Ohm Bulb -> Battery Neg
    // I = 12 / 24 = 0.50 A
    const nodes: SchematicNode[] = [
      { id: 'bat', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { componentType: 'battery_dc_cell', voltageV: 12.0, isEnergized: true, label: 'BAT' } },
      { id: 'ammeter', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { componentType: 'ammeter_basic', label: 'Ammeter' } },
      { id: 'bulb', type: 'schematicGeneric', position: { x: 0, y: 0 }, data: { componentType: 'light_bulb', ratedVoltageV: 12.0, resistanceOhm: 24.0, powerWatts: 6.0, label: 'BULB' } },
    ];

    const edges: SchematicEdge[] = [
      { id: 'e1', source: 'bat', sourceHandle: 'pos', target: 'ammeter', targetHandle: 'a_in' },
      { id: 'e2', source: 'ammeter', sourceHandle: 'a_out', target: 'bulb', targetHandle: 'terminal_1' },
      { id: 'e3', source: 'bulb', sourceHandle: 'terminal_2', target: 'bat', targetHandle: 'neg' },
    ];

    const res = solveElectricalCircuit(nodes, edges);
    const ammeter = res.nodes.find((n) => n.id === 'ammeter');
    const bulb = res.nodes.find((n) => n.id === 'bulb');

    expect(bulb?.data.isEnergized).toBe(true);
    expect(bulb?.data.currentA).toBe(0.5);
    // Ammeter accurately displays 0.5 A!
    expect(ammeter?.data.measuredValue).toBe(0.5);
    expect(ammeter?.data.currentA).toBe(0.5);
  });

  it('regulates DC power source voltage and delivers exact current according to load resistance', () => {
    // Regulate DC source to 24V with 12 Ohm load: I = 24 / 12 = 2.0 A, P = 48 W
    const nodes: SchematicNode[] = [
      {
        id: 'dc-src',
        type: 'schematicGeneric',
        position: { x: 0, y: 0 },
        data: {
          componentType: 'dc_power_source',
          voltageV: 24.0,
          maxCurrentA: 10.0,
          isEnergized: true,
          label: 'Fuente DC 24V',
        },
      },
      {
        id: 'resistor',
        type: 'schematicGeneric',
        position: { x: 0, y: 0 },
        data: {
          componentType: 'resistor_fixed',
          resistanceOhm: 12.0,
          label: 'R 12Ω',
        },
      },
    ];

    const edges: SchematicEdge[] = [
      { id: 'e1', source: 'dc-src', sourceHandle: 'pos', target: 'resistor', targetHandle: 't1' },
      { id: 'e2', source: 'resistor', sourceHandle: 't2', target: 'dc-src', targetHandle: 'neg' },
    ];

    const res = solveElectricalCircuit(nodes, edges);
    const dcSrc = res.nodes.find((n) => n.id === 'dc-src');
    const resLoad = res.nodes.find((n) => n.id === 'resistor');

    expect(resLoad?.data.voltageV).toBe(24.0);
    expect(resLoad?.data.currentA).toBe(2.0);
    expect(resLoad?.data.powerWatts).toBe(48.0);

    expect(dcSrc?.data.voltageV).toBe(24.0);
    expect(dcSrc?.data.currentA).toBe(2.0);
    expect(dcSrc?.data.powerWatts).toBe(48.0);
    expect(dcSrc?.data.currentLimitWarning).toBeUndefined();
  });

  it('triggers current limit warning when load current exceeds DC source maxCurrentA', () => {
    // 12V DC source with maxCurrentA = 1.0A, connected to 6 Ohm resistor (demand = 2.0A)
    const nodes: SchematicNode[] = [
      {
        id: 'dc-src',
        type: 'schematicGeneric',
        position: { x: 0, y: 0 },
        data: {
          componentType: 'dc_power_source',
          voltageV: 12.0,
          maxCurrentA: 1.0,
          isEnergized: true,
          label: 'Fuente DC 12V 1A Max',
        },
      },
      {
        id: 'resistor',
        type: 'schematicGeneric',
        position: { x: 0, y: 0 },
        data: {
          componentType: 'resistor_fixed',
          resistanceOhm: 6.0,
          label: 'R 6Ω',
        },
      },
    ];

    const edges: SchematicEdge[] = [
      { id: 'e1', source: 'dc-src', sourceHandle: 'pos', target: 'resistor', targetHandle: 't1' },
      { id: 'e2', source: 'resistor', sourceHandle: 't2', target: 'dc-src', targetHandle: 'neg' },
    ];

    const res = solveElectricalCircuit(nodes, edges);
    const dcSrc = res.nodes.find((n) => n.id === 'dc-src');

    expect(dcSrc?.data.currentA).toBe(2.0);
    expect(dcSrc?.data.currentLimitWarning).toBeDefined();
    expect(dcSrc?.data.currentLimitWarning).toContain('Límite de corriente superado');
  });

  it('regulates AC power source with custom voltage and frequency and powers AC motor / load', () => {
    // 120V 60Hz AC source connected to 24 Ohm AC motor: I = 120 / 24 = 5.0 A, P = 600 W
    const nodes: SchematicNode[] = [
      {
        id: 'ac-src',
        type: 'schematicGeneric',
        position: { x: 0, y: 0 },
        data: {
          componentType: 'power_source_ac',
          voltageV: 120.0,
          frequencyHz: 60.0,
          acWaveform: 'sine',
          maxCurrentA: 16.0,
          isEnergized: true,
          label: 'Fuente AC 120V 60Hz',
        },
      },
      {
        id: 'ac-motor',
        type: 'schematicGeneric',
        position: { x: 0, y: 0 },
        data: {
          componentType: 'electric_motor_1p',
          ratedVoltageV: 120.0,
          minOperatingVoltageV: 60.0,
          resistanceOhm: 24.0,
          ratedRpm: 1800,
          label: 'Motor AC 1F',
        },
      },
    ];

    const edges: SchematicEdge[] = [
      { id: 'e1', source: 'ac-src', sourceHandle: 'phase', target: 'ac-motor', targetHandle: 'term_l' },
      { id: 'e2', source: 'ac-motor', sourceHandle: 'term_n', target: 'ac-src', targetHandle: 'neutral' },
    ];

    const res = solveElectricalCircuit(nodes, edges);
    const acSrc = res.nodes.find((n) => n.id === 'ac-src');
    const acMotor = res.nodes.find((n) => n.id === 'ac-motor');

    expect(acMotor?.data.isEnergized).toBe(true);
    expect(acMotor?.data.voltageV).toBe(120.0);
    expect(acMotor?.data.currentA).toBe(5.0);
    expect(acMotor?.data.powerWatts).toBe(600.0);

    expect(acSrc?.data.voltageV).toBe(120.0);
    expect(acSrc?.data.currentA).toBe(5.0);
    expect(acSrc?.data.powerWatts).toBe(600.0);
    expect(acSrc?.data.currentLimitWarning).toBeUndefined();
  });
});

