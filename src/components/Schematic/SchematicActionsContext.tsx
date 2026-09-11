import { createContext, useContext } from 'react';
import { SchematicComponentType } from '../../types/schematic';

export interface SchematicActionsContextValue {
  onUpdateEdgeWaypoints?: (edgeId: string, waypoints: Array<{ x: number; y: number }>) => void;
  onUpdateEdgeOffset?: (edgeId: string, offset: number) => void;
  onSplitEdge?: (edgeId: string, junctionType: SchematicComponentType, position?: { x: number; y: number }) => void;
  onDeleteEdge?: (edgeId: string) => void;
}

export const SchematicActionsContext = createContext<SchematicActionsContextValue>({});

export const useSchematicActions = () => useContext(SchematicActionsContext);

