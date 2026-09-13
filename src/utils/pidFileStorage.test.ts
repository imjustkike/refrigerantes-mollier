import { describe, it, expect } from 'vitest';
import {
  buildInstallationSchemaFromFlow,
  exportPidProjectJson,
  importPidProjectJson,
} from './pidFileStorage';
import { Node, Edge } from '@xyflow/react';
import { SchematicNodeData, SchematicEdgeData } from '../types/schematic';

describe('pidFileStorage', () => {
  const mockNodes: Node<SchematicNodeData>[] = [
    {
      id: 'comp1',
      type: 'schematicNode',
      position: { x: 100, y: 100 },
      data: {
        componentType: 'compressor_reciprocating',
        label: 'Compresor 1',
        tag: 'CMP-01',
        powerKw: 5.5,
        displacementM3h: 18.5,
      },
    },
    {
      id: 'evap1',
      type: 'schematicNode',
      position: { x: 300, y: 100 },
      data: {
        componentType: 'evaporator_dx_air',
        label: 'Evaporador 1',
        tag: 'EVAP-01',
        capacityKw: 15.0,
      },
    },
  ];

  const mockEdges: Edge<SchematicEdgeData>[] = [
    {
      id: 'e1',
      source: 'comp1',
      sourceHandle: 'discharge',
      target: 'evap1',
      targetHandle: 'liquid_in',
      data: {
        pipeState: 'discharge_superheated',
        diameterMm: 16.0,
      },
    },
  ];

  it('builds a valid InstallationSchema from React Flow graph', () => {
    const schema = buildInstallationSchemaFromFlow(
      'Test Plant',
      'R134a',
      18.0,
      18.0,
      mockNodes,
      mockEdges
    );

    expect(schema.name).toBe('Test Plant');
    expect(schema.refrigerant).toBe('R134a');
    expect(schema.equipments).toHaveLength(2);
    expect(schema.pipes).toHaveLength(1);
    expect(schema.electrical.breakers).toHaveLength(6);
    expect(schema.chambers).toHaveLength(1);
    expect(schema.equipments[0].nominal_power_kw).toBe(5.5);
    expect(schema.equipments[1].nominal_capacity_kw).toBe(15.0);
  });

  it('exports and imports version 2.0.0 format', () => {
    const json = exportPidProjectJson(
      'Planta Frigorífica V2',
      'R134a',
      20.0,
      20.0,
      mockNodes,
      mockEdges
    );

    expect(json).toContain('"formatVersion": "2.0.0"');

    const imported = importPidProjectJson(json);
    expect(imported.success).toBe(true);
    expect(imported.installation?.name).toBe('Planta Frigorífica V2');
    expect(imported.nodes).toHaveLength(2);
    expect(imported.edges).toHaveLength(1);
  });

  it('migrates legacy schemas where capacityKw and powerKw were incorrectly duplicated', () => {
    const legacyJson = JSON.stringify({
      nodes: [
        {
          id: 'legacy_comp',
          type: 'schematicNode',
          position: { x: 0, y: 0 },
          data: {
            componentType: 'compressor_reciprocating',
            label: 'Compresor Legacy',
            capacityKw: 7.5,
            powerKw: 7.5, // Duplicated in legacy bug
          },
        },
        {
          id: 'legacy_evap',
          type: 'schematicNode',
          position: { x: 200, y: 0 },
          data: {
            componentType: 'evaporator_dx_air',
            label: 'Evaporador Legacy',
            capacityKw: 12.0,
            powerKw: 12.0, // Duplicated in legacy bug
          },
        },
      ],
      edges: [],
    });

    const result = importPidProjectJson(legacyJson);
    expect(result.success).toBe(true);
    const comp = result.nodes?.find((n) => n.id === 'legacy_comp');
    const evap = result.nodes?.find((n) => n.id === 'legacy_evap');

    // Compressor should keep powerKw, unset capacityKw
    expect(comp?.data.powerKw).toBe(7.5);
    expect(comp?.data.capacityKw).toBeUndefined();

    // Evaporator should keep capacityKw, unset powerKw
    expect(evap?.data.capacityKw).toBe(12.0);
    expect(evap?.data.powerKw).toBeUndefined();
  });

  it('separates refrigerant pipes and electric wires so wires do not count as pipes', () => {
    const mixedEdges: Edge<SchematicEdgeData>[] = [
      {
        id: 'pipe_1',
        source: 'comp1',
        sourceHandle: 'discharge',
        target: 'evap1',
        targetHandle: 'liquid_in',
        type: 'refrigerantPipe',
        data: {
          pipeState: 'discharge_superheated',
          diameterMm: 16.0,
        },
      },
      {
        id: 'wire_1',
        source: 'bat1',
        sourceHandle: 'pos',
        target: 'sw1',
        targetHandle: 'in',
        type: 'electricWire',
        data: {
          pipeState: 'electric_phase',
          wireFunction: 'phase',
          wireSectionMm2: 2.5,
        },
      },
    ];

    const schema = buildInstallationSchemaFromFlow(
      'Separation Test',
      'R134a',
      10.0,
      10.0,
      mockNodes,
      mixedEdges
    );

    expect(schema.pipes).toHaveLength(1);
    expect(schema.pipes[0].id).toBe('pipe_1');
    expect(schema.wires).toHaveLength(1);
    expect(schema.wires?.[0].id).toBe('wire_1');
    expect(schema.wires?.[0].wire_function).toBe('phase');
  });
});
