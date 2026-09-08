/**
 * Thermodynamic Data Contract in SI Units (Pa, J/kg, K, kg/m³, J/(kg·K))
 * 
 * Principle: The graphic is a pure projection of physical states.
 * Segments represent contiguous valid evaluations without synthetic splines or bridging.
 */

export type ThermoPoint = {
  pPa: number;          // Absolute pressure in Pascals [Pa]
  hJkg: number;         // Specific enthalpy in Joules per kilogram [J/kg]
  tK?: number;          // Temperature in Kelvin [K]
  sJkgK?: number;       // Specific entropy in J/(kg·K)
  rhoKgm3?: number;     // Density in kg/m³
  quality?: number;     // Vapor quality in [0, 1], or undefined/negative if single phase
};

export type CurveFamily =
  | 'sat-liquid'
  | 'sat-vapor'
  | 'isotherm'
  | 'isentrope'
  | 'isochore'
  | 'quality';

export type ThermoCurve = {
  id: string;
  family: CurveFamily;
  parameterValue?: number;
  parameterUnit?: string;
  /**
   * Disjoint segments of contiguous valid physical states.
   * A calculation failure MUST split into separate segments, NEVER join invalid gaps with diagonals.
   */
  segments: ThermoPoint[][];
};

export type FluidCapabilities = {
  fluidId: string;
  displayName: string;
  isPure: boolean;
  isMixture: boolean;
  pCritPa: number;
  tCritK: number;
  hCritJkg: number;
  pMinPa: number;
  pMaxPa: number;
  tMinK: number;
  supportsBubbleDew: boolean;
  supportsQualityMesh: boolean;
  referenceState?: string;
};

export type DiagramDomain = {
  pMinPa: number;
  pMaxPa: number;
  hMinJkg: number;
  hMaxJkg: number;
  pCritPa: number;
  tCritK: number;
  hCritJkg: number;
  tMinK: number;
};

export type FullDiagramDataset = {
  fluidId: string;
  revision: number;
  capabilities: FluidCapabilities;
  domain: DiagramDomain;
  saturationLiquid: ThermoCurve;
  saturationVapor: ThermoCurve;
  isotherms: ThermoCurve[];
  isentropes: ThermoCurve[];
  isochores: ThermoCurve[];
  qualityLines: ThermoCurve[];
  criticalPoint: ThermoPoint;
};

// Unit Conversion Helpers for UI and API presentation
export const Units = {
  // Pressure
  paToBar: (pPa: number): number => pPa / 100000,
  barToPa: (pBar: number): number => pBar * 100000,

  // Enthalpy
  jkgToKjkg: (hJkg: number): number => hJkg / 1000,
  kjkgToJkg: (hKjkg: number): number => hKjkg * 1000,

  // Temperature
  kToC: (tK: number): number => tK - 273.15,
  cToK: (tC: number): number => tC + 273.15,

  // Entropy
  jkgkToKjkgk: (sJkgK: number): number => sJkgK / 1000,
  kjkgkToJkgk: (sKjkgK: number): number => sKjkgK * 1000,

  // Specific volume
  rhoToV: (rhoKgm3: number): number => (rhoKgm3 > 0 ? 1 / rhoKgm3 : 0),
  vToRho: (vM3kg: number): number => (vM3kg > 0 ? 1 / vM3kg : 0),
};
