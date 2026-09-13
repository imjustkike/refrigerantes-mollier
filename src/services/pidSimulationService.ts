import { invoke } from '@tauri-apps/api/core';
import {
  InstallationSchema,
  SimulationStateResponse,
  ValidationReport,
} from '../types/pidSimulation';

export const isTauriAvailable = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

export async function loadInstallationSchema(schema: InstallationSchema): Promise<void> {
  if (!isTauriAvailable()) {
    console.warn('[PID Sim] Tauri no disponible. Modo simulado en memoria.');
    return;
  }
  await invoke('pid_sim_load_schema_cmd', { schema });
}

export async function startSimulation(): Promise<void> {
  if (!isTauriAvailable()) return;
  await invoke('pid_sim_start_cmd');
}

export async function pauseSimulation(): Promise<void> {
  if (!isTauriAvailable()) return;
  await invoke('pid_sim_pause_cmd');
}

export async function resetSimulation(): Promise<void> {
  if (!isTauriAvailable()) return;
  await invoke('pid_sim_reset_cmd');
}

export async function stepSimulation(dt: number = 0.5): Promise<SimulationStateResponse | null> {
  if (!isTauriAvailable()) return null;
  return await invoke<SimulationStateResponse>('pid_sim_step_cmd', { dt });
}

export async function setSimulationSpeed(multiplier: number): Promise<void> {
  if (!isTauriAvailable()) return;
  await invoke('pid_sim_set_speed_cmd', { multiplier });
}

export async function interveneSimulation(
  action: string,
  targetId: string,
  value: number = 0.0
): Promise<string> {
  if (!isTauriAvailable()) {
    return 'Acción simulada (entorno navegador)';
  }
  return await invoke<string>('pid_sim_intervene_cmd', {
    action,
    targetId,
    value,
  });
}

export async function getSimulationState(): Promise<SimulationStateResponse | null> {
  if (!isTauriAvailable()) return null;
  return await invoke<SimulationStateResponse>('pid_sim_get_state_cmd');
}

export async function validateInstallationSchema(
  schema: InstallationSchema
): Promise<ValidationReport> {
  if (!isTauriAvailable()) {
    return {
      is_valid: true,
      issues: [],
    };
  }
  return await invoke<ValidationReport>('pid_sim_validate_cmd', { schema });
}
