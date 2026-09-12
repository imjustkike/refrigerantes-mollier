import {
  CurveFamily,
  DiagramDomain,
  FluidCapabilities,
  FullDiagramDataset,
  ThermoCurve,
  ThermoPoint,
  Units,
} from '../types/thermoContract';
import { FluidInfo, ThermodynamicState, DiagramCurvesResponse } from '../../types/thermo';
import * as thermoService from '../../services/tauriThermoService';

export interface StructuredThermoError {
  fluidId: string;
  operation: string;
  message: string;
  details?: unknown;
}

export interface CompleteFluidData {
  dataset: FullDiagramDataset;
  rawCurves: DiagramCurvesResponse;
  fluidInfo: FluidInfo | null;
  revision: number;
}

export class ThermoProvider {
  private static currentRevision = 0;

  static isTauri(): boolean {
    return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  }

  /**
   * Generates a new revision number to discard out-of-order asynchronous responses
   */
  static nextRevision(): number {
    this.currentRevision += 1;
    return this.currentRevision;
  }

  static getCurrentRevision(): number {
    return this.currentRevision;
  }

  /**
   * Fetches raw diagram curves and fluid details in a single query pass,
   * returning both the normalized FullDiagramDataset and raw curves for UI.
   */
  static async fetchCompleteFluidData(
    fluidId: string,
    revision?: number
  ): Promise<CompleteFluidData> {
    const rev = revision ?? this.nextRevision();
    try {
      const [rawCurves, fluidInfo] = await Promise.all([
        thermoService.fetchDiagramCurves(fluidId),
        thermoService.fetchFluidDetails(fluidId).catch(() => null),
      ]);

      if (revision !== undefined && this.currentRevision > 0 && revision !== this.currentRevision) {
        throw new Error(`Revision obsoleta (${revision} !== ${this.currentRevision})`);
      }

      const dataset = this.normalizeCurvesResponse(fluidId, rev, rawCurves, fluidInfo);
      return {
        dataset,
        rawCurves,
        fluidInfo,
        revision: rev,
      };
    } catch (err) {
      if (String(err).includes('Revision obsoleta')) {
        throw err;
      }
      console.error(`ThermoProvider: Error fetching curves for ${fluidId}:`, err);
      throw err;
    }
  }

  /**
   * Fetches full diagram dataset (curves, domain, capabilities) for the given refrigerant.
   * Uses native CoolProp 8.0 through Tauri when in desktop app, or high-accuracy
   * multi-fluid thermodynamic EOS models when in web environment.
   */
  static async fetchDiagramDataset(
    fluidId: string,
    revision?: number
  ): Promise<FullDiagramDataset> {
    const res = await this.fetchCompleteFluidData(fluidId, revision);
    return res.dataset;
  }

  /**
   * Evaluates thermodynamic state from 2 state variables
   */
  static async calculateState(
    fluidId: string,
    in1Type: string,
    in1Val: number,
    in2Type: string,
    in2Val: number
  ): Promise<ThermodynamicState> {
    return await thermoService.calculateState(fluidId, in1Type, in1Val, in2Type, in2Val);
  }

  /**
   * Normalizes raw backend curves response into strict SI FullDiagramDataset
   */
  private static normalizeCurvesResponse(
    fluidId: string,
    revision: number,
    raw: any,
    info: FluidInfo | null
  ): FullDiagramDataset {
    const d = raw.domain;
    const domain: DiagramDomain = {
      pMinPa: Units.barToPa(d.p_min_bar),
      pMaxPa: Units.barToPa(d.p_max_bar),
      hMinJkg: Units.kjkgToJkg(d.h_min_kj_kg),
      hMaxJkg: Units.kjkgToJkg(d.h_max_kj_kg),
      pCritPa: Units.barToPa(d.p_crit_bar),
      tCritK: Units.cToK(d.t_crit_c),
      hCritJkg: Units.kjkgToJkg(d.h_crit_kj_kg),
      tMinK: Units.cToK(d.t_min_c),
    };

    const capabilities: FluidCapabilities = {
      fluidId,
      displayName: info?.name || raw.fluid_id || fluidId,
      isPure: info?.is_pure ?? true,
      isMixture: info?.is_mixture ?? false,
      pCritPa: domain.pCritPa,
      tCritK: domain.tCritK,
      hCritJkg: domain.hCritJkg,
      pMinPa: domain.pMinPa,
      pMaxPa: domain.pMaxPa,
      tMinK: domain.tMinK,
      supportsBubbleDew: true,
      supportsQualityMesh: true,
      referenceState: info?.reference_state || 'DEF',
    };

    const convertSeries = (s: any, family: CurveFamily): ThermoCurve => {
      const pts: ThermoPoint[] = (s.points || []).map((p: any) => ({
        pPa: Units.barToPa(p.p_bar),
        hJkg: Units.kjkgToJkg(p.h_kj_kg),
        tK: p.t_c !== null && p.t_c !== undefined ? Units.cToK(p.t_c) : undefined,
        sJkgK:
          p.s_kj_kg_k !== null && p.s_kj_kg_k !== undefined
            ? Units.kjkgkToJkgk(p.s_kj_kg_k)
            : undefined,
        rhoKgm3:
          p.v_m3_kg !== null && p.v_m3_kg !== undefined && p.v_m3_kg > 0
            ? Units.vToRho(p.v_m3_kg)
            : undefined,
        quality: p.q ?? undefined,
      }));

      // Group into segments based on raw segments if present, or single segment of valid points
      const segments: ThermoPoint[][] = s.segments
        ? s.segments.map((seg: any[]) =>
            seg.map((p: any) => ({
              pPa: Units.barToPa(p.p_bar),
              hJkg: Units.kjkgToJkg(p.h_kj_kg),
              tK: p.t_c !== null && p.t_c !== undefined ? Units.cToK(p.t_c) : undefined,
              sJkgK:
                p.s_kj_kg_k !== null && p.s_kj_kg_k !== undefined
                  ? Units.kjkgkToJkgk(p.s_kj_kg_k)
                  : undefined,
              rhoKgm3:
                p.v_m3_kg !== null && p.v_m3_kg !== undefined && p.v_m3_kg > 0
                  ? Units.vToRho(p.v_m3_kg)
                  : undefined,
              quality: p.q ?? undefined,
            }))
          )
        : [pts.filter((pt) => Number.isFinite(pt.hJkg) && Number.isFinite(pt.pPa) && pt.pPa > 0)];

      return {
        id: s.id,
        family,
        parameterValue: s.parameter_value,
        parameterUnit: s.parameter_unit,
        segments: segments.filter((seg) => seg.length >= 2),
      };
    };

    const saturationLiquid = convertSeries(raw.saturation_liquid, 'sat-liquid');
    const saturationVapor = convertSeries(raw.saturation_vapor, 'sat-vapor');
    const isotherms = (raw.isotherms || []).map((s: any) => convertSeries(s, 'isotherm'));
    const isentropes = (raw.isentropics || []).map((s: any) => convertSeries(s, 'isentrope'));
    const isochores = (raw.isochores || []).map((s: any) => convertSeries(s, 'isochore'));
    const qualityLines = (raw.quality_lines || []).map((s: any) => convertSeries(s, 'quality'));

    const criticalPoint: ThermoPoint = {
      pPa: domain.pCritPa,
      hJkg: domain.hCritJkg,
      tK: domain.tCritK,
    };

    return {
      fluidId,
      revision,
      capabilities,
      domain,
      saturationLiquid,
      saturationVapor,
      isotherms,
      isentropes,
      isochores,
      qualityLines,
      criticalPoint,
    };
  }
}
