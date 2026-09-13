use crate::pid_sim::model::EquipmentRunState;

#[derive(Debug, Clone)]
pub struct ThermostatState {
    pub is_calling_for_cooling: bool,
}

#[derive(Debug, Clone)]
pub struct PressureSwitchHpState {
    pub is_tripped: bool,
    pub trip_pressure_bar: f64,
}

#[derive(Debug, Clone)]
pub struct PressureSwitchLpState {
    pub is_contact_closed: bool,
    pub cut_in_bar: f64,
    pub cut_out_bar: f64,
}

#[derive(Debug, Clone)]
pub struct CompressorControllerState {
    pub run_state: EquipmentRunState,
    pub off_timer_s: f64,
    pub inrush_timer_s: f64,
    pub running_duration_s: f64,
}

pub struct ControlsManager {
    pub thermostat: ThermostatState,
    pub hp_switch: PressureSwitchHpState,
    pub lp_switch: PressureSwitchLpState,
    pub lead_comp: CompressorControllerState,
    pub lag_comp: CompressorControllerState,
    pub is_defrost_active: bool,
    pub defrost_timer_s: f64,
    pub solenoid_valve_open: bool,
}

impl ControlsManager {
    pub fn new() -> Self {
        Self {
            thermostat: ThermostatState {
                is_calling_for_cooling: false,
            },
            hp_switch: PressureSwitchHpState {
                is_tripped: false,
                trip_pressure_bar: 22.0,
            },
            lp_switch: PressureSwitchLpState {
                is_contact_closed: true,
                cut_in_bar: 2.2,
                cut_out_bar: 0.8,
            },
            lead_comp: CompressorControllerState {
                run_state: EquipmentRunState::Stopped,
                off_timer_s: 0.0,
                inrush_timer_s: 0.0,
                running_duration_s: 0.0,
            },
            lag_comp: CompressorControllerState {
                run_state: EquipmentRunState::Stopped,
                off_timer_s: 0.0,
                inrush_timer_s: 0.0,
                running_duration_s: 0.0,
            },
            is_defrost_active: false,
            defrost_timer_s: 0.0,
            solenoid_valve_open: true,
        }
    }

    /// Ejecuta la lógica de control para el paso temporal dt
    pub fn step(
        &mut self,
        chamber_air_temp_c: f64,
        setpoint_temp_c: f64,
        hysteresis_k: f64,
        suction_pressure_bar: f64,
        discharge_pressure_bar: f64,
        is_demand_limit_exceeded: bool,
        lead_breaker_closed: bool,
        lag_breaker_closed: bool,
        dt: f64,
    ) {
        // 1. Temporizadores anti-ciclo corto (decremento cuando están parados)
        if self.lead_comp.off_timer_s > 0.0 {
            self.lead_comp.off_timer_s = (self.lead_comp.off_timer_s - dt).max(0.0);
        }
        if self.lag_comp.off_timer_s > 0.0 {
            self.lag_comp.off_timer_s = (self.lag_comp.off_timer_s - dt).max(0.0);
        }

        // 2. Presostato de alta (HP): disparo de seguridad con memoria
        if discharge_pressure_bar >= self.hp_switch.trip_pressure_bar {
            self.hp_switch.is_tripped = true;
        }

        // 3. Presostato de baja (LP): control de pump-down
        if suction_pressure_bar <= self.lp_switch.cut_out_bar {
            self.lp_switch.is_contact_closed = false;
        } else if suction_pressure_bar >= self.lp_switch.cut_in_bar {
            self.lp_switch.is_contact_closed = true;
        }

        // 4. Lógica de desescarche
        if self.is_defrost_active {
            self.defrost_timer_s = (self.defrost_timer_s - dt).max(0.0);
            if self.defrost_timer_s <= 0.0 {
                self.is_defrost_active = false;
            }
        }

        // 5. Termostato con histéresis
        if !self.is_defrost_active {
            let high_threshold = setpoint_temp_c + (hysteresis_k / 2.0);
            let low_threshold = setpoint_temp_c - (hysteresis_k / 2.0);

            if chamber_air_temp_c >= high_threshold {
                self.thermostat.is_calling_for_cooling = true;
            } else if chamber_air_temp_c <= low_threshold {
                self.thermostat.is_calling_for_cooling = false;
            }
            self.solenoid_valve_open = self.thermostat.is_calling_for_cooling;
        } else {
            self.thermostat.is_calling_for_cooling = false;
            self.solenoid_valve_open = false; // Cierra solenoide en desescarche
        }

        // 6. Condición global de marcha para compresores:
        // Presostato HP sano Y contacto LP cerrado Y no en desescarche
        let safety_ok = !self.hp_switch.is_tripped;
        let pump_down_run_allowed = self.lp_switch.is_contact_closed;

        // --- COMPRESOR LEAD (Principal) ---
        if !lead_breaker_closed {
            self.lead_comp.run_state = EquipmentRunState::TrippedOverload;
        } else if !safety_ok {
            self.lead_comp.run_state = EquipmentRunState::TrippedSafety;
        } else if self.is_defrost_active {
            self.lead_comp.run_state = EquipmentRunState::Defrosting;
        } else if !pump_down_run_allowed {
            if self.lead_comp.run_state == EquipmentRunState::Running
                || self.lead_comp.run_state == EquipmentRunState::Starting
            {
                self.lead_comp.off_timer_s = 180.0; // Iniciar anti-ciclo
            }
            self.lead_comp.run_state = EquipmentRunState::Stopped;
        } else if self.lead_comp.off_timer_s > 0.0
            && (self.lead_comp.run_state == EquipmentRunState::Stopped
                || self.lead_comp.run_state == EquipmentRunState::Interlocked)
        {
            self.lead_comp.run_state = EquipmentRunState::Interlocked;
        } else if self.thermostat.is_calling_for_cooling || pump_down_run_allowed {
            // El compresor puede arrancar o mantenerse
            match self.lead_comp.run_state {
                EquipmentRunState::Stopped | EquipmentRunState::Interlocked => {
                    self.lead_comp.run_state = EquipmentRunState::Starting;
                    self.lead_comp.inrush_timer_s = 0.8;
                    self.lead_comp.running_duration_s = 0.0;
                }
                EquipmentRunState::Starting => {
                    self.lead_comp.inrush_timer_s -= dt;
                    if self.lead_comp.inrush_timer_s <= 0.0 {
                        self.lead_comp.run_state = EquipmentRunState::Running;
                    }
                }
                EquipmentRunState::Running => {
                    self.lead_comp.running_duration_s += dt;
                }
                _ => {
                    self.lead_comp.run_state = EquipmentRunState::Running;
                }
            }
        } else {
            if self.lead_comp.run_state == EquipmentRunState::Running {
                self.lead_comp.off_timer_s = 180.0;
            }
            self.lead_comp.run_state = EquipmentRunState::Stopped;
        }

        // --- COMPRESOR LAG (Secundario / Etapa 2) ---
        // Condición para necesitar el 2º compresor:
        // Demanda activa Y temperatura alta (+2.5 K sobre consigna) O lead funcionando > 45s
        let lag_demand = self.thermostat.is_calling_for_cooling
            && (chamber_air_temp_c >= (setpoint_temp_c + 2.0)
                || self.lead_comp.running_duration_s > 45.0);

        if !lag_breaker_closed {
            self.lag_comp.run_state = EquipmentRunState::TrippedOverload;
        } else if !safety_ok {
            self.lag_comp.run_state = EquipmentRunState::TrippedSafety;
        } else if self.is_defrost_active {
            self.lag_comp.run_state = EquipmentRunState::Defrosting;
        } else if is_demand_limit_exceeded {
            // El controlador de demanda bloquea o deslastra el segundo compresor
            if self.lag_comp.run_state == EquipmentRunState::Running {
                self.lag_comp.off_timer_s = 180.0;
            }
            self.lag_comp.run_state = EquipmentRunState::LockedByDemand;
        } else if !lag_demand || !pump_down_run_allowed {
            if self.lag_comp.run_state == EquipmentRunState::Running {
                self.lag_comp.off_timer_s = 180.0;
            }
            self.lag_comp.run_state = EquipmentRunState::Stopped;
        } else if self.lag_comp.off_timer_s > 0.0
            && (self.lag_comp.run_state == EquipmentRunState::Stopped
                || self.lag_comp.run_state == EquipmentRunState::Interlocked)
        {
            self.lag_comp.run_state = EquipmentRunState::Interlocked;
        } else {
            match self.lag_comp.run_state {
                EquipmentRunState::Stopped | EquipmentRunState::Interlocked => {
                    self.lag_comp.run_state = EquipmentRunState::Starting;
                    self.lag_comp.inrush_timer_s = 0.8;
                    self.lag_comp.running_duration_s = 0.0;
                }
                EquipmentRunState::Starting => {
                    self.lag_comp.inrush_timer_s -= dt;
                    if self.lag_comp.inrush_timer_s <= 0.0 {
                        self.lag_comp.run_state = EquipmentRunState::Running;
                    }
                }
                EquipmentRunState::Running => {
                    self.lag_comp.running_duration_s += dt;
                }
                _ => {
                    self.lag_comp.run_state = EquipmentRunState::Running;
                }
            }
        }
    }

    /// Rearme manual del presostato de alta
    pub fn reset_hp_switch(&mut self) -> bool {
        if self.hp_switch.is_tripped {
            self.hp_switch.is_tripped = false;
            true
        } else {
            false
        }
    }

    /// Disparo manual de desescarche
    pub fn trigger_manual_defrost(&mut self, duration_s: f64) {
        self.is_defrost_active = true;
        self.defrost_timer_s = duration_s;
    }
}
