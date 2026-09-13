import React from 'react';
import { SchematicComponentType } from '../../../types/schematic';

interface SvgSymbolProps {
  type: SchematicComponentType;
  width?: number;
  height?: number;
  isSelected?: boolean;
  isEnergized?: boolean;
  isSwitchClosed?: boolean;
  measuredValue?: number;
  measuredUnit?: string;
  resistanceOhm?: number;
  isSeriesWarning?: boolean;
  isSeriesPassThrough?: boolean;
  color?: string;
  themeMode?: 'dark' | 'light';
}

export const SvgSymbol: React.FC<SvgSymbolProps> = ({
  type,
  width = 80,
  height = 80,
  isSelected = false,
  isEnergized = false,
  isSwitchClosed = false,
  measuredValue,
  resistanceOhm,
  isSeriesWarning = false,
  isSeriesPassThrough = false,
  themeMode = 'dark',
}) => {
  const isDark = themeMode === 'dark';
  const strokeColor = isSelected ? '#38bdf8' : isDark ? '#e2e8f0' : '#1e293b';
  const fillColor = isDark ? '#1e222d' : '#f8fafc';
  const accentColor = isEnergized ? '#22c55e' : '#38bdf8';
  const secondaryFill = isDark ? '#2d3342' : '#e2e8f0';

  switch (type) {
    // --- COMPRESORES ---
    case 'compressor_scroll':
      return (
        <svg width={width} height={height} viewBox="0 0 100 110" fill="none" className="transition-transform">
          <defs>
            <radialGradient id="scrollGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={isDark ? '#2a324b' : '#e0e7ff'} />
              <stop offset="100%" stopColor={isDark ? '#131722' : '#cbd5e1'} />
            </radialGradient>
          </defs>
          {/* Base Cylinder */}
          <rect x="25" y="15" width="50" height="75" rx="25" fill="url(#scrollGrad)" stroke={strokeColor} strokeWidth="2.5" />
          {/* Scroll Spiral detail */}
          <path
            d="M 50 35 C 40 35 35 45 42 55 C 47 62 60 62 60 50 C 60 42 52 42 48 48 C 45 52 52 56 55 54"
            fill="none"
            stroke={accentColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Terminal Box */}
          <rect x="16" y="45" width="10" height="18" rx="2" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          {/* Feet */}
          <rect x="18" y="90" width="64" height="6" rx="2" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          {/* Ports indicator */}
          <circle cx="15" cy="65" r="4" fill="#2563eb" stroke="#fff" strokeWidth="1" />
          <circle cx="85" cy="30" r="4" fill="#ef4444" stroke="#fff" strokeWidth="1" />
        </svg>
      );

    case 'compressor_reciprocating':
      return (
        <svg width={width} height={height} viewBox="0 0 110 110" fill="none">
          {/* Compressor Circle / Body */}
          <circle cx="55" cy="55" r="40" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
          {/* Cylinder head (Triangle indicator) */}
          <polygon points="55,20 85,75 25,75" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
          {/* Piston & Crankshaft symbol */}
          <circle cx="55" cy="62" r="7" fill={accentColor} />
          <line x1="55" y1="35" x2="55" y2="55" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
          {/* Base plate */}
          <line x1="20" y1="98" x2="90" y2="98" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'compressor_screw':
      return (
        <svg width={width} height={height} viewBox="0 0 120 100" fill="none">
          {/* Twin Rotor Body */}
          <rect x="20" y="20" width="80" height="60" rx="16" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
          {/* Screw helical lobes */}
          <path d="M 35 30 Q 50 50 35 70" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 60 30 Q 75 50 60 70" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 85 30 Q 100 50 85 70" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
          {/* Port badges */}
          <circle cx="10" cy="50" r="4" fill="#2563eb" />
          <circle cx="110" cy="50" r="4" fill="#ef4444" />
        </svg>
      );

    case 'compressor_inverter':
      return (
        <svg width={width} height={height} viewBox="0 0 110 110" fill="none">
          <circle cx="55" cy="55" r="40" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
          <polygon points="55,20 85,75 25,75" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
          {/* VFD Sine / Inverter icon */}
          <path d="M 40 55 Q 47 42 55 55 T 70 55" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
          {/* Hz text badge */}
          <rect x="42" y="78" width="26" height="12" rx="3" fill="#22c55e" />
          <text x="55" y="87" fontSize="8" fontWeight="bold" fill="#ffffff" textAnchor="middle" fontFamily="sans-serif">
            INV
          </text>
        </svg>
      );

    case 'compressor_compound':
      return (
        <svg width={width} height={height} viewBox="0 0 130 110" fill="none">
          {/* Stage 1 (LP - Larger) */}
          <circle cx="45" cy="55" r="32" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
          <polygon points="45,28 68,75 22,75" fill="none" stroke={strokeColor} strokeWidth="2" />
          {/* Stage 2 (HP - Smaller) */}
          <circle cx="95" cy="55" r="24" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
          <polygon points="95,36 112,70 78,70" fill="none" stroke={strokeColor} strokeWidth="2" />
          {/* Connecting Shaft */}
          <line x1="72" y1="55" x2="76" y2="55" stroke={accentColor} strokeWidth="3" />
        </svg>
      );

    case 'refrigerant_pump':
      return (
        <svg width={width} height={height} viewBox="0 0 90 90" fill="none">
          <circle cx="45" cy="45" r="32" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
          <polygon points="32,28 65,45 32,62" fill={accentColor} stroke={strokeColor} strokeWidth="1.5" strokeLinejoin="round" />
          <line x1="10" y1="45" x2="20" y2="45" stroke={strokeColor} strokeWidth="3" />
          <line x1="70" y1="45" x2="80" y2="45" stroke={strokeColor} strokeWidth="3" />
        </svg>
      );

    // --- INTERCAMBIADORES ---
    case 'condenser_air':
    case 'gas_cooler_co2':
      return (
        <svg width={width} height={height} viewBox="0 0 120 100" fill="none">
          {/* Serpentine coil */}
          <rect x="15" y="15" width="90" height="70" rx="8" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          {/* Coil Fins */}
          <line x1="30" y1="20" x2="30" y2="80" stroke={secondaryFill} strokeWidth="2" />
          <line x1="45" y1="20" x2="45" y2="80" stroke={secondaryFill} strokeWidth="2" />
          <line x1="60" y1="20" x2="60" y2="80" stroke={secondaryFill} strokeWidth="2" />
          <line x1="75" y1="20" x2="75" y2="80" stroke={secondaryFill} strokeWidth="2" />
          <line x1="90" y1="20" x2="90" y2="80" stroke={secondaryFill} strokeWidth="2" />
          {/* Serpentine Tube */}
          <path
            d="M 10 30 L 95 30 Q 105 30 105 40 Q 105 50 95 50 L 25 50 Q 15 50 15 60 Q 15 70 25 70 L 110 70"
            fill="none"
            stroke={type === 'gas_cooler_co2' ? '#10b981' : '#ef4444'}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Fan Symbol on top */}
          <circle cx="60" cy="50" r="14" fill={isDark ? '#0f172a' : '#ffffff'} stroke={strokeColor} strokeWidth="1.5" />
          <path d="M 60 40 L 60 60 M 50 50 L 70 50" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'condenser_water_plate':
    case 'evaporator_plate_chiller':
      return (
        <svg width={width} height={height} viewBox="0 0 110 110" fill="none">
          {/* Brazed Plate Heat Exchanger Body */}
          <rect x="25" y="15" width="60" height="80" rx="6" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
          {/* Chevron plate lines */}
          <path d="M 35 30 L 55 45 L 75 30" fill="none" stroke={strokeColor} strokeWidth="1.5" />
          <path d="M 35 45 L 55 60 L 75 45" fill="none" stroke={strokeColor} strokeWidth="1.5" />
          <path d="M 35 60 L 55 75 L 75 60" fill="none" stroke={strokeColor} strokeWidth="1.5" />
          <path d="M 35 75 L 55 90 L 75 75" fill="none" stroke={strokeColor} strokeWidth="1.5" />
          {/* 4 Connection Ports */}
          <circle cx="35" cy="15" r="4" fill="#06b6d4" />
          <circle cx="75" cy="15" r="4" fill="#ef4444" />
          <circle cx="35" cy="95" r="4" fill="#10b981" />
          <circle cx="75" cy="95" r="4" fill="#3b82f6" />
        </svg>
      );

    case 'condenser_evaporative':
      return (
        <svg width={width} height={height} viewBox="0 0 120 120" fill="none">
          <rect x="20" y="20" width="80" height="80" rx="8" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          {/* Water Spray Nozzles */}
          <path d="M 35 35 L 45 45 M 60 35 L 60 48 M 85 35 L 75 45" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
          {/* Coil underneath */}
          <path d="M 10 70 L 105 70" stroke="#f97316" strokeWidth="4" strokeLinecap="round" />
          {/* Basin at bottom */}
          <rect x="20" y="88" width="80" height="12" fill="#0284c7" fillOpacity="0.4" rx="2" />
        </svg>
      );

    case 'evaporator_dx_air':
      return (
        <svg width={width} height={height} viewBox="0 0 120 100" fill="none">
          <rect x="15" y="15" width="90" height="70" rx="8" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          {/* DX Blue Fins */}
          <line x1="30" y1="20" x2="30" y2="80" stroke={secondaryFill} strokeWidth="2" />
          <line x1="45" y1="20" x2="45" y2="80" stroke={secondaryFill} strokeWidth="2" />
          <line x1="60" y1="20" x2="60" y2="80" stroke={secondaryFill} strokeWidth="2" />
          <line x1="75" y1="20" x2="75" y2="80" stroke={secondaryFill} strokeWidth="2" />
          <line x1="90" y1="20" x2="90" y2="80" stroke={secondaryFill} strokeWidth="2" />
          {/* Serpentine Tube in Cyan / Cold */}
          <path
            d="M 10 70 L 95 70 Q 105 70 105 60 Q 105 50 95 50 L 25 50 Q 15 50 15 40 Q 15 30 25 30 L 110 30"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Fan Symbol */}
          <circle cx="60" cy="50" r="14" fill={isDark ? '#0f172a' : '#ffffff'} stroke={strokeColor} strokeWidth="1.5" />
          <path d="M 60 40 L 60 60 M 50 50 L 70 50" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'evaporator_flooded':
      return (
        <svg width={width} height={height} viewBox="0 0 130 110" fill="none">
          {/* Horizontal drum */}
          <rect x="15" y="25" width="100" height="60" rx="20" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
          {/* Liquid level */}
          <path d="M 16 55 Q 40 52 65 55 T 114 55" fill="none" stroke="#06b6d4" strokeWidth="2" />
          <rect x="16" y="56" width="98" height="28" fill="#06b6d4" fillOpacity="0.25" rx="10" />
          {/* Tube bundle */}
          <circle cx="40" cy="68" r="4" fill={secondaryFill} stroke={strokeColor} />
          <circle cx="55" cy="68" r="4" fill={secondaryFill} stroke={strokeColor} />
          <circle cx="70" cy="68" r="4" fill={secondaryFill} stroke={strokeColor} />
          <circle cx="85" cy="68" r="4" fill={secondaryFill} stroke={strokeColor} />
          {/* Suction dome */}
          <path d="M 50 25 Q 65 10 80 25" stroke={strokeColor} strokeWidth="2" fill="none" />
        </svg>
      );

    case 'heat_exchanger_slhx':
      return (
        <svg width={width} height={height} viewBox="0 0 110 100" fill="none">
          {/* Concentric / Counterflow Exchanger */}
          <rect x="20" y="20" width="70" height="60" rx="8" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          {/* Suction line (horizontal) */}
          <line x1="10" y1="50" x2="100" y2="50" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" />
          {/* Liquid line (coiled around) */}
          <path d="M 55 10 L 55 35 Q 35 45 55 55 Q 75 65 55 75 L 55 90" fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'desuperheater':
      return (
        <svg width={width} height={height} viewBox="0 0 110 90" fill="none">
          <rect x="20" y="15" width="70" height="60" rx="8" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <line x1="10" y1="35" x2="100" y2="35" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="55" y1="80" x2="55" y2="10" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    // --- EXPANSION & REGULACION ---
    case 'expansion_valve_txv':
      return (
        <svg width={width} height={height} viewBox="0 0 90 90" fill="none">
          {/* Valve Hourglass Body */}
          <polygon points="20,25 70,65 70,25 20,65" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" strokeLinejoin="round" />
          {/* Diaphragm Head */}
          <path d="M 30 20 Q 45 8 60 20 Z" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          <line x1="45" y1="20" x2="45" y2="45" stroke={strokeColor} strokeWidth="2" />
          {/* Bulb Capillary Line */}
          <path d="M 45 8 Q 45 0 65 5" fill="none" stroke="#eab308" strokeWidth="1.5" />
          <rect x="65" y="2" width="16" height="6" rx="3" fill="#eab308" />
        </svg>
      );

    case 'expansion_valve_eev':
      return (
        <svg width={width} height={height} viewBox="0 0 90 90" fill="none">
          {/* Valve Body */}
          <polygon points="20,30 70,70 70,30 20,70" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" strokeLinejoin="round" />
          {/* Stepper Motor Actuator on top */}
          <rect x="35" y="8" width="20" height="22" rx="3" fill={secondaryFill} stroke={strokeColor} strokeWidth="2" />
          {/* Step pulses icon */}
          <path d="M 40 16 L 45 16 L 45 22 L 50 22" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'capillary_tube':
      return (
        <svg width={width} height={height} viewBox="0 0 80 50" fill="none">
          {/* Helical capillary line */}
          <path
            d="M 10 25 L 25 25 Q 32 10 40 25 Q 48 40 55 25 L 70 25"
            fill="none"
            stroke="#eab308"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'float_valve':
      return (
        <svg width={width} height={height} viewBox="0 0 85 85" fill="none">
          <polygon points="15,35 55,65 55,35 15,65" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <line x1="35" y1="50" x2="60" y2="25" stroke={strokeColor} strokeWidth="2" />
          <circle cx="65" cy="20" r="10" fill="#38bdf8" stroke={strokeColor} strokeWidth="2" />
        </svg>
      );

    case 'regulator_epr_kvp':
    case 'regulator_cpr_kvl':
    case 'regulator_kvr':
      return (
        <svg width={width} height={height} viewBox="0 0 85 85" fill="none">
          <polygon points="15,30 65,65 65,30 15,65" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" strokeLinejoin="round" />
          {/* Spring Dome */}
          <circle cx="40" cy="20" r="12" fill={secondaryFill} stroke={strokeColor} strokeWidth="2" />
          <line x1="40" y1="20" x2="40" y2="47" stroke={strokeColor} strokeWidth="2" />
          <text x="40" y="24" fontSize="8" fontWeight="bold" fill={accentColor} textAnchor="middle" fontFamily="monospace">
            {type === 'regulator_epr_kvp' ? 'KVP' : type === 'regulator_cpr_kvl' ? 'KVL' : 'KVR'}
          </text>
        </svg>
      );

    // --- RECIPIENTES & ACEITE ---
    case 'liquid_receiver_vertical':
      return (
        <svg width={width} height={height} viewBox="0 0 90 120" fill="none">
          {/* Vertical Tank */}
          <rect x="20" y="15" width="50" height="90" rx="22" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
          {/* Liquid content */}
          <rect x="21" y="55" width="48" height="46" rx="10" fill="#f97316" fillOpacity="0.3" />
          {/* Sight glass tube on side */}
          <line x1="72" y1="40" x2="72" y2="85" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
          <circle cx="72" cy="65" r="2.5" fill="#f97316" />
          {/* Legs */}
          <line x1="28" y1="105" x2="28" y2="115" stroke={strokeColor} strokeWidth="3" />
          <line x1="62" y1="105" x2="62" y2="115" stroke={strokeColor} strokeWidth="3" />
        </svg>
      );

    case 'liquid_receiver_horizontal':
      return (
        <svg width={width} height={height} viewBox="0 0 130 80" fill="none">
          <rect x="15" y="15" width="100" height="50" rx="20" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
          <rect x="16" y="38" width="98" height="25" rx="8" fill="#f97316" fillOpacity="0.3" />
          <line x1="30" y1="65" x2="25" y2="75" stroke={strokeColor} strokeWidth="3" />
          <line x1="100" y1="65" x2="105" y2="75" stroke={strokeColor} strokeWidth="3" />
        </svg>
      );

    case 'suction_accumulator':
      return (
        <svg width={width} height={height} viewBox="0 0 90 120" fill="none">
          <rect x="20" y="15" width="50" height="90" rx="22" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
          {/* Internal U-tube */}
          <path d="M 45 25 L 45 85 Q 45 92 52 92 Q 58 92 58 85 L 58 50 L 75 50" fill="none" stroke="#2563eb" strokeWidth="2.5" />
          {/* Oil bleed hole indicator */}
          <circle cx="52" cy="92" r="1.5" fill="#eab308" />
        </svg>
      );

    case 'oil_separator':
      return (
        <svg width={width} height={height} viewBox="0 0 90 110" fill="none">
          <rect x="22" y="15" width="46" height="75" rx="18" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
          {/* Oil layer at bottom */}
          <rect x="23" y="60" width="44" height="28" rx="8" fill="#84cc16" fillOpacity="0.35" />
          {/* Float ball */}
          <circle cx="45" cy="65" r="7" fill="#84cc16" stroke={strokeColor} strokeWidth="1.5" />
          <line x1="45" y1="72" x2="45" y2="95" stroke="#84cc16" strokeWidth="2.5" />
        </svg>
      );

    case 'oil_reservoir':
      return (
        <svg width={width} height={height} viewBox="0 0 90 110" fill="none">
          <rect x="22" y="15" width="46" height="80" rx="12" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <rect x="23" y="45" width="44" height="48" rx="6" fill="#84cc16" fillOpacity="0.4" />
          <text x="45" y="70" fontSize="9" fontWeight="bold" fill="#ffffff" textAnchor="middle" fontFamily="sans-serif">
            OIL
          </text>
        </svg>
      );

    case 'flash_tank_economizer':
      return (
        <svg width={width} height={height} viewBox="0 0 100 120" fill="none">
          <rect x="20" y="15" width="60" height="90" rx="20" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
          {/* Liquid level */}
          <rect x="21" y="60" width="58" height="42" rx="10" fill="#06b6d4" fillOpacity="0.3" />
          {/* Flash vapor rising */}
          <path d="M 40 45 Q 45 35 50 45 T 60 45" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" />
          <line x1="60" y1="35" x2="85" y2="35" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'co2_flash_tank':
      return (
        <svg width={width} height={height} viewBox="0 0 110 130" fill="none">
          {/* Base mounting legs */}
          <line x1="28" y1="108" x2="24" y2="122" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
          <line x1="82" y1="108" x2="86" y2="122" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
          <line x1="19" y1="122" x2="29" y2="122" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="81" y1="122" x2="91" y2="122" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />

          {/* Vertical Heavy-Duty Vessel Tank */}
          <rect x="18" y="14" width="74" height="96" rx="22" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />

          {/* High-Pressure Weld Seams / Reinforcement Bands */}
          <line x1="19" y1="36" x2="91" y2="36" stroke={strokeColor} strokeWidth="1" strokeDasharray="3,2" opacity="0.6" />
          <line x1="19" y1="88" x2="91" y2="88" stroke={strokeColor} strokeWidth="1" strokeDasharray="3,2" opacity="0.6" />

          {/* Lower Liquid Phase (CO2 Líquido) */}
          <rect x="20" y="58" width="70" height="50" rx="12" fill="#06b6d4" fillOpacity="0.38" />
          {/* Phase Separation Meniscus / Wave Line */}
          <path d="M 20 58 Q 36 55 55 58 T 90 58" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" />
          
          {/* Liquid Phase Droplets */}
          <circle cx="34" cy="74" r="1.5" fill="#38bdf8" opacity="0.75" />
          <circle cx="68" cy="82" r="2" fill="#38bdf8" opacity="0.75" />
          <circle cx="50" cy="94" r="1.5" fill="#38bdf8" opacity="0.75" />

          {/* Upper Gas Phase (Flash Gas CO2 - Vapor) */}
          <path d="M 38 46 Q 44 38 48 46 T 58 46" fill="none" stroke="#8b5cf6" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
          <path d="M 50 32 Q 55 24 60 32 T 70 32" fill="none" stroke="#8b5cf6" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />

          {/* Inlet Deflector Plate (Separation Mechanism) */}
          <line x1="6" y1="48" x2="20" y2="48" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" />
          <path d="M 26 40 L 32 48 L 30 56" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
          <circle cx="31" cy="62" r="1.5" fill="#06b6d4" />

          {/* Top Gas Outlet Nozzle */}
          <line x1="55" y1="4" x2="55" y2="15" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />

          {/* Bottom Liquid Outlet Sump */}
          <line x1="55" y1="109" x2="55" y2="124" stroke="#eab308" strokeWidth="3.5" strokeLinecap="round" />

          {/* Safety / Relief Valve Connection on Right */}
          <line x1="91" y1="28" x2="103" y2="28" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="98,24 104,28 98,32" fill="#ef4444" />

          {/* Side Liquid Level Sight Column */}
          <rect x="79" y="48" width="4.5" height="44" rx="2" fill="#0f172a" fillOpacity="0.6" stroke="#94a3b8" strokeWidth="1" />
          <rect x="80.25" y="58" width="2" height="32" rx="1" fill="#06b6d4" />

          {/* CO2 Flash Badge */}
          <rect x="30" y="67" width="50" height="15" rx="4" fill="#0f172a" fillOpacity="0.85" stroke="#38bdf8" strokeWidth="1" />
          <text x="55" y="78" fontSize="7.5" fontWeight="bold" fill="#38bdf8" textAnchor="middle" fontFamily="monospace" letterSpacing="0.5">
            CO₂ FLASH
          </text>
        </svg>
      );

    case 'filter_drier':
      return (
        <svg width={width} height={height} viewBox="0 0 85 50" fill="none">
          {/* Diamond / Bullet shell */}
          <polygon points="12,25 30,10 55,10 73,25 55,40 30,40" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" strokeLinejoin="round" />
          {/* Desiccant core dots */}
          <circle cx="35" cy="25" r="2" fill={accentColor} />
          <circle cx="43" cy="20" r="2" fill={accentColor} />
          <circle cx="43" cy="30" r="2" fill={accentColor} />
          <circle cx="51" cy="25" r="2" fill={accentColor} />
        </svg>
      );

    case 'sight_glass':
      return (
        <svg width={width} height={height} viewBox="0 0 75 50" fill="none">
          <circle cx="37.5" cy="25" r="18" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
          <circle cx="37.5" cy="25" r="9" fill="#22c55e" stroke={strokeColor} strokeWidth="1.5" />
          <line x1="8" y1="25" x2="19" y2="25" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
          <line x1="56" y1="25" x2="67" y2="25" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    // --- VALVULAS ---
    case 'four_way_reversing_valve':
      return (
        <svg width={width} height={height} viewBox="0 0 110 110" fill="none">
          {/* Center Chamber */}
          <rect x="25" y="35" width="60" height="40" rx="10" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
          {/* 4 Ports */}
          <circle cx="55" cy="18" r="5" fill="#ef4444" />
          <circle cx="55" cy="92" r="5" fill="#2563eb" />
          <circle cx="15" cy="55" r="5" fill="#38bdf8" />
          <circle cx="95" cy="55" r="5" fill="#f97316" />
          {/* Internal Flow Slides */}
          <path d="M 55 25 Q 40 40 25 55" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 85 55 Q 70 70 55 85" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'solenoid_valve':
      return (
        <svg width={width} height={height} viewBox="0 0 85 80" fill="none">
          <polygon points="15,35 65,65 65,35 15,65" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" strokeLinejoin="round" />
          {/* Solenoid Coil Box on Top */}
          <rect x="30" y="10" width="20" height="22" rx="3" fill={isEnergized ? '#22c55e' : secondaryFill} stroke={strokeColor} strokeWidth="2" />
          <line x1="40" y1="14" x2="40" y2="28" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'check_valve':
      return (
        <svg width={width} height={height} viewBox="0 0 80 50" fill="none">
          <rect x="15" y="12" width="50" height="26" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          {/* Non-return Arrow & Seat */}
          <polygon points="30,16 52,25 30,34" fill={accentColor} />
          <line x1="52" y1="16" x2="52" y2="34" stroke={strokeColor} strokeWidth="2.5" />
        </svg>
      );

    case 'safety_relief_valve':
      return (
        <svg width={width} height={height} viewBox="0 0 75 80" fill="none">
          <polygon points="15,45 60,65 60,45 15,65" fill={fillColor} stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
          {/* Vent stack */}
          <line x1="38" y1="45" x2="38" y2="15" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
          <path d="M 30 15 L 46 15" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'hot_gas_bypass_valve':
      return (
        <svg width={width} height={height} viewBox="0 0 90 90" fill="none">
          <polygon points="20,35 70,65 70,35 20,65" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="45" cy="20" r="10" fill={secondaryFill} stroke={strokeColor} strokeWidth="2" />
          <path d="M 45 20 L 45 45" stroke={strokeColor} strokeWidth="2" />
          <text x="45" y="23" fontSize="7" fontWeight="bold" fill="#a855f7" textAnchor="middle" fontFamily="sans-serif">
            HGBP
          </text>
        </svg>
      );

    case 'ball_service_valve':
      return (
        <svg width={width} height={height} viewBox="0 0 75 60" fill="none">
          <polygon points="15,22 60,42 60,22 15,42" fill={fillColor} stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
          <line x1="37" y1="32" x2="37" y2="10" stroke={strokeColor} strokeWidth="2.5" />
          <rect x="25" y="8" width="25" height="5" rx="2" fill="#ef4444" />
        </svg>
      );

    // --- UNIONES & DERIVACIONES DE TUBERÍA ---
    case 'pipe_union_straight':
      return (
        <svg width={width} height={height} viewBox="0 0 70 50" fill="none">
          {/* Main pipe sleeve */}
          <rect x="12" y="19" width="46" height="12" rx="2" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          {/* Central coupling collar */}
          <rect x="29" y="14" width="12" height="22" rx="3" fill={secondaryFill} stroke={accentColor} strokeWidth="2" />
          {/* Left / Right weld flanges */}
          <line x1="18" y1="16" x2="18" y2="34" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="52" y1="16" x2="52" y2="34" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
          {/* Flow through centerline */}
          <line x1="6" y1="25" x2="64" y2="25" stroke={accentColor} strokeWidth="2" strokeDasharray="3 3" />
        </svg>
      );

    case 'pipe_union_elbow':
      return (
        <svg width={width} height={height} viewBox="0 0 65 65" fill="none">
          {/* Elbow Outer Body */}
          <path
            d="M 12 25 L 35 25 Q 45 25 45 35 L 45 54"
            fill="none"
            stroke={secondaryFill}
            strokeWidth="14"
            strokeLinecap="square"
          />
          {/* Elbow Outline */}
          <path
            d="M 10 18 L 36 18 Q 52 18 52 34 L 52 56"
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
          />
          <path
            d="M 10 32 L 28 32 Q 38 32 38 42 L 38 56"
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
          />
          {/* Flanges */}
          <rect x="8" y="15" width="5" height="20" rx="1.5" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          <rect x="35" y="52" width="20" height="5" rx="1.5" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          {/* Flow center curve */}
          <path
            d="M 6 25 L 34 25 Q 45 25 45 36 L 45 59"
            fill="none"
            stroke={accentColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'pipe_union_tee':
      return (
        <svg width={width} height={height} viewBox="0 0 70 70" fill="none">
          {/* Horizontal pipe body */}
          <rect x="12" y="20" width="46" height="14" rx="2" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          {/* Vertical branch */}
          <rect x="28" y="28" width="14" height="30" rx="2" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          {/* Central junction hub */}
          <rect x="25" y="17" width="20" height="20" rx="3" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          {/* Flanges */}
          <rect x="8" y="17" width="5" height="20" rx="1" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          <rect x="57" y="17" width="5" height="20" rx="1" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          <rect x="25" y="54" width="20" height="5" rx="1" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          {/* Flow lines */}
          <line x1="6" y1="27" x2="64" y2="27" stroke={accentColor} strokeWidth="2" strokeDasharray="3 3" />
          <line x1="35" y1="27" x2="35" y2="62" stroke={accentColor} strokeWidth="2" strokeDasharray="3 3" />
          <circle cx="35" cy="27" r="3.5" fill={accentColor} />
        </svg>
      );

    case 'pipe_union_cross':
      return (
        <svg width={width} height={height} viewBox="0 0 70 70" fill="none">
          {/* Horizontal body */}
          <rect x="10" y="28" width="50" height="14" rx="2" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          {/* Vertical body */}
          <rect x="28" y="10" width="14" height="50" rx="2" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          {/* Center Hub */}
          <rect x="25" y="25" width="20" height="20" rx="4" fill={secondaryFill} stroke={accentColor} strokeWidth="2" />
          {/* 4 Flanges */}
          <rect x="6" y="25" width="5" height="20" rx="1" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          <rect x="59" y="25" width="5" height="20" rx="1" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          <rect x="25" y="6" width="20" height="5" rx="1" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          <rect x="25" y="59" width="20" height="5" rx="1" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          {/* Flow cross */}
          <line x1="5" y1="35" x2="65" y2="35" stroke={accentColor} strokeWidth="2" strokeDasharray="3 3" />
          <line x1="35" y1="5" x2="35" y2="65" stroke={accentColor} strokeWidth="2" strokeDasharray="3 3" />
          <circle cx="35" cy="35" r="4" fill={accentColor} />
        </svg>
      );

    case 'pipe_junction_dot':
      return (
        <svg width={width} height={height} viewBox="0 0 60 60" fill="none">
          {/* Connecting Stubs */}
          <line x1="5" y1="30" x2="55" y2="30" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
          <line x1="30" y1="5" x2="30" y2="55" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
          {/* Outer glow ring */}
          <circle cx="30" cy="30" r="16" fill={accentColor} fillOpacity={0.2} stroke={accentColor} strokeWidth="2" strokeDasharray="3 2" />
          {/* Solid Center Joint */}
          <circle cx="30" cy="30" r="10" fill={isDark ? '#0f172a' : '#ffffff'} stroke={strokeColor} strokeWidth="2.5" />
          <circle cx="30" cy="30" r="5" fill={accentColor} />
        </svg>
      );

    // --- INSTRUMENTACION ---
    case 'gauge_pressure_hp':
      return (
        <svg width={width} height={height} viewBox="0 0 70 75" fill="none">
          <circle cx="35" cy="35" r="28" fill={isDark ? '#1a0f12' : '#fef2f2'} stroke="#ef4444" strokeWidth="2.5" />
          <circle cx="35" cy="35" r="4" fill="#ef4444" />
          {/* Dial Needle */}
          <line x1="35" y1="35" x2="50" y2="20" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          <text x="35" y="52" fontSize="7" fontWeight="bold" fill="#ef4444" textAnchor="middle" fontFamily="monospace">
            HP bar
          </text>
          <line x1="35" y1="63" x2="35" y2="72" stroke={strokeColor} strokeWidth="3" />
        </svg>
      );

    case 'gauge_pressure_lp':
      return (
        <svg width={width} height={height} viewBox="0 0 70 75" fill="none">
          <circle cx="35" cy="35" r="28" fill={isDark ? '#0f172a' : '#f0f9ff'} stroke="#2563eb" strokeWidth="2.5" />
          <circle cx="35" cy="35" r="4" fill="#2563eb" />
          <line x1="35" y1="35" x2="22" y2="22" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
          <text x="35" y="52" fontSize="7" fontWeight="bold" fill="#2563eb" textAnchor="middle" fontFamily="monospace">
            LP bar
          </text>
          <line x1="35" y1="63" x2="35" y2="72" stroke={strokeColor} strokeWidth="3" />
        </svg>
      );

    case 'sensor_temperature':
      return (
        <svg width={width} height={height} viewBox="0 0 65 65" fill="none">
          <circle cx="32" cy="26" r="18" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <text x="32" y="30" fontSize="10" fontWeight="bold" fill="#f59e0b" textAnchor="middle" fontFamily="sans-serif">
            °C
          </text>
          <line x1="32" y1="44" x2="32" y2="60" stroke="#f59e0b" strokeWidth="2.5" />
          <circle cx="32" cy="60" r="3" fill="#f59e0b" />
        </svg>
      );

    case 'pressure_switch':
      return (
        <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
          <rect x="18" y="15" width="44" height="50" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <circle cx="40" cy="32" r="8" fill={secondaryFill} stroke={strokeColor} />
          <text x="40" y="55" fontSize="8" fontWeight="bold" fill={accentColor} textAnchor="middle" fontFamily="sans-serif">
            P-SW
          </text>
        </svg>
      );

    case 'flow_meter':
      return (
        <svg width={width} height={height} viewBox="0 0 80 60" fill="none">
          <rect x="15" y="15" width="50" height="30" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <circle cx="40" cy="30" r="9" fill={secondaryFill} stroke={accentColor} strokeWidth="1.5" />
          <text x="40" y="33" fontSize="8" fontWeight="bold" fill={accentColor} textAnchor="middle" fontFamily="monospace">
            kg/s
          </text>
        </svg>
      );

    case 'power_meter':
      return (
        <svg width={width} height={height} viewBox="0 0 75 75" fill="none">
          <rect x="15" y="15" width="45" height="45" rx="6" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <polygon points="37,22 30,36 38,36 34,48 45,34 38,34" fill="#eab308" />
          <text x="37.5" y="55" fontSize="7" fontWeight="bold" fill={strokeColor} textAnchor="middle" fontFamily="monospace">
            kW
          </text>
        </svg>
      );

    // --- CÁMARAS FRIGORÍFICAS & RECINTOS ---
    case 'cold_room_conservation':
      return (
        <svg width={width} height={height} viewBox="0 0 120 110" fill="none">
          {/* Wall insulation double border */}
          <rect x="10" y="10" width="100" height="90" rx="8" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
          <rect x="16" y="16" width="88" height="78" rx="5" fill={isDark ? '#0f172a' : '#f1f5f9'} stroke={strokeColor} strokeWidth="1" strokeDasharray="3 2" />
          {/* Cold Room Door outline */}
          <rect x="18" y="50" width="22" height="42" rx="3" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          <circle cx="34" cy="71" r="2" fill={accentColor} />
          {/* Evaporator blower unit inside top right */}
          <rect x="58" y="20" width="40" height="18" rx="3" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          {/* Airflow arrows */}
          <path d="M 68 34 L 68 44 M 78 34 L 78 44 M 88 34 L 88 44" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
          {/* Digital Thermometer display */}
          <rect x="58" y="55" width="38" height="16" rx="3" fill="#0284c7" />
          <text x="77" y="66" fontSize="9" fontWeight="bold" fill="#ffffff" textAnchor="middle" fontFamily="monospace">
            +2.0°C
          </text>
          {/* Product pallet indicator */}
          <rect x="46" y="78" width="52" height="12" rx="2" fill={isDark ? '#334155' : '#cbd5e1'} stroke={strokeColor} strokeWidth="1" />
        </svg>
      );

    case 'cold_room_freezer':
      return (
        <svg width={width} height={height} viewBox="0 0 120 110" fill="none">
          {/* Sub-zero thick insulation border */}
          <rect x="8" y="8" width="104" height="94" rx="10" fill={fillColor} stroke="#38bdf8" strokeWidth="2.5" />
          <rect x="16" y="16" width="88" height="78" rx="5" fill={isDark ? '#082f49' : '#e0f2fe'} stroke="#0284c7" strokeWidth="1.5" />
          {/* Heavy freezer door with heated gasket line */}
          <rect x="18" y="48" width="24" height="44" rx="3" fill={secondaryFill} stroke="#38bdf8" strokeWidth="2" />
          <line x1="18" y1="48" x2="18" y2="92" stroke="#f97316" strokeWidth="2" />
          <circle cx="36" cy="70" r="2.5" fill="#f97316" />
          {/* Frost / Snowflake icon */}
          <path d="M 30 28 L 30 40 M 24 34 L 36 34 M 26 30 L 34 38 M 26 38 L 34 30" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
          {/* Evaporator with defrost heaters */}
          <rect x="58" y="20" width="40" height="20" rx="3" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          <line x1="62" y1="36" x2="94" y2="36" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 2" />
          {/* Sub-zero digital display */}
          <rect x="58" y="52" width="42" height="18" rx="3" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1" />
          <text x="79" y="65" fontSize="9" fontWeight="bold" fill="#93c5fd" textAnchor="middle" fontFamily="monospace">
            -20.0°C
          </text>
          {/* Frozen product storage rack */}
          <rect x="48" y="78" width="50" height="12" rx="2" fill={isDark ? '#1e293b' : '#bfdbfe'} stroke="#38bdf8" strokeWidth="1" />
        </svg>
      );

    case 'cold_room_blast_chiller':
      return (
        <svg width={width} height={height} viewBox="0 0 120 110" fill="none">
          <rect x="8" y="8" width="104" height="94" rx="8" fill={fillColor} stroke="#6366f1" strokeWidth="2.5" />
          <rect x="15" y="15" width="90" height="80" rx="5" fill={isDark ? '#1e1b4b' : '#e0e7ff'} stroke="#818cf8" strokeWidth="1" />
          {/* High velocity turbo blast symbol */}
          <circle cx="42" cy="40" r="16" fill={secondaryFill} stroke="#818cf8" strokeWidth="1.5" />
          <path d="M 34 40 Q 42 32 50 40 Q 42 48 34 40" fill="#6366f1" />
          <path d="M 68 30 L 96 30 M 68 38 L 96 38 M 68 46 L 96 46" stroke="#818cf8" strokeWidth="2" strokeDasharray="4 2" />
          {/* Fast pull-down badge */}
          <rect x="55" y="60" width="46" height="18" rx="4" fill="#4338ca" />
          <text x="78" y="73" fontSize="9" fontWeight="bold" fill="#ffffff" textAnchor="middle" fontFamily="monospace">
            -35.0°C
          </text>
          {/* Trolley / Cart */}
          <rect x="20" y="72" width="28" height="18" rx="2" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          <circle cx="26" cy="93" r="2.5" fill={strokeColor} />
          <circle cx="42" cy="93" r="2.5" fill={strokeColor} />
        </svg>
      );

    case 'conditioned_room':
      return (
        <svg width={width} height={height} viewBox="0 0 120 110" fill="none">
          <rect x="10" y="10" width="100" height="90" rx="8" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <rect x="16" y="16" width="88" height="78" rx="4" fill={isDark ? '#13201d' : '#ecfdf5'} stroke="#10b981" strokeWidth="1" />
          {/* Ceiling HVAC cassette diffuser */}
          <rect x="42" y="18" width="36" height="12" rx="2" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          <path d="M 48 30 L 40 40 M 72 30 L 80 40" stroke="#10b981" strokeWidth="1.5" />
          {/* Personnel working silhouette */}
          <circle cx="38" cy="58" r="5" fill="#10b981" />
          <path d="M 28 75 C 28 66 48 66 48 75" fill="#10b981" />
          {/* Comfort readout display */}
          <rect x="58" y="52" width="40" height="16" rx="3" fill="#047857" />
          <text x="78" y="64" fontSize="9" fontWeight="bold" fill="#ffffff" textAnchor="middle" fontFamily="monospace">
            +14.0°C
          </text>
          {/* Workbench / Table */}
          <rect x="54" y="76" width="44" height="14" rx="2" fill={secondaryFill} stroke={strokeColor} strokeWidth="1" />
        </svg>
      );

    // --- INSTALACIÓN ELÉCTRICA & CUADROS ---
    case 'electrical_panel_main':
      return (
        <svg width={width} height={height} viewBox="0 0 110 110" fill="none">
          {/* Metal enclosure */}
          <rect x="12" y="10" width="86" height="90" rx="6" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
          {/* Top warning lightning sign */}
          <rect x="36" y="16" width="38" height="18" rx="3" fill="#eab308" />
          <polygon points="56,18 49,27 55,27 52,33 60,25 54,25" fill="#0f172a" />
          {/* Rotary Main Disconnect Switch (IGC) */}
          <circle cx="34" cy="58" r="14" fill={secondaryFill} stroke={strokeColor} strokeWidth="2" />
          <rect x="31" y="48" width="6" height="20" rx="2" fill="#ef4444" />
          <text x="34" y="80" fontSize="7" fontWeight="bold" fill={strokeColor} textAnchor="middle" fontFamily="sans-serif">
            IGC
          </text>
          {/* Digital Voltage / Power Analyzer */}
          <rect x="58" y="46" width="34" height="24" rx="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
          <text x="75" y="57" fontSize="7" fontWeight="bold" fill="#38bdf8" textAnchor="middle" fontFamily="monospace">
            400 V
          </text>
          <text x="75" y="66" fontSize="6" fontWeight="bold" fill="#22c55e" textAnchor="middle" fontFamily="monospace">
            50 Hz
          </text>
          {/* Busbar indicators */}
          <line x1="22" y1="92" x2="88" y2="92" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'circuit_breaker_mcb':
      return (
        <svg width={width} height={height} viewBox="0 0 80 90" fill="none">
          {/* MCB DIN module outline */}
          <rect x="18" y="10" width="44" height="70" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          {/* Top and bottom terminals */}
          <circle cx="40" cy="18" r="4" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          <circle cx="40" cy="72" r="4" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          {/* Toggle lever (Up = ON / Down = TRIP) */}
          <rect x="32" y="32" width="16" height="26" rx="3" fill={secondaryFill} stroke={strokeColor} strokeWidth="1" />
          <rect x="35" y="35" width="10" height="12" rx="2" fill={isEnergized ? '#22c55e' : '#ef4444'} />
          {/* Thermal-magnetic curve badge */}
          <text x="40" y="64" fontSize="8" fontWeight="bold" fill={strokeColor} textAnchor="middle" fontFamily="monospace">
            C16
          </text>
        </svg>
      );

    case 'contactor_relay':
      return (
        <svg width={width} height={height} viewBox="0 0 85 85" fill="none">
          <rect x="15" y="10" width="55" height="65" rx="5" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          {/* 3 Main Power Contacts */}
          <line x1="25" y1="18" x2="25" y2="30" stroke={strokeColor} strokeWidth="2" />
          <line x1="25" y1="36" x2="31" y2="28" stroke="#22c55e" strokeWidth="2" />
          <line x1="25" y1="40" x2="25" y2="67" stroke={strokeColor} strokeWidth="2" />

          <line x1="42" y1="18" x2="42" y2="30" stroke={strokeColor} strokeWidth="2" />
          <line x1="42" y1="36" x2="48" y2="28" stroke="#22c55e" strokeWidth="2" />
          <line x1="42" y1="40" x2="42" y2="67" stroke={strokeColor} strokeWidth="2" />

          <line x1="60" y1="18" x2="60" y2="30" stroke={strokeColor} strokeWidth="2" />
          <line x1="60" y1="36" x2="66" y2="28" stroke="#22c55e" strokeWidth="2" />
          <line x1="60" y1="40" x2="60" y2="67" stroke={strokeColor} strokeWidth="2" />

          {/* Coil indicator */}
          <rect x="28" y="47" width="29" height="14" rx="2" fill={secondaryFill} stroke={accentColor} strokeWidth="1" />
          <text x="42" y="57" fontSize="7" fontWeight="bold" fill={accentColor} textAnchor="middle" fontFamily="monospace">
            A1-A2
          </text>
        </svg>
      );

    case 'frequency_inverter_vfd':
      return (
        <svg width={width} height={height} viewBox="0 0 95 100" fill="none">
          <rect x="15" y="10" width="65" height="80" rx="6" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          {/* Cooling heatsink fins */}
          <line x1="20" y1="15" x2="20" y2="22" stroke={strokeColor} strokeWidth="1.5" />
          <line x1="26" y1="15" x2="26" y2="22" stroke={strokeColor} strokeWidth="1.5" />
          <line x1="32" y1="15" x2="32" y2="22" stroke={strokeColor} strokeWidth="1.5" />
          {/* Digital 7-segment / Keypad display */}
          <rect x="22" y="28" width="51" height="22" rx="3" fill="#0f172a" stroke="#22c55e" strokeWidth="1" />
          <text x="47.5" y="43" fontSize="10" fontWeight="bold" fill="#22c55e" textAnchor="middle" fontFamily="monospace">
            50.0 Hz
          </text>
          {/* AC to DC to AC symbol */}
          <path d="M 28 62 Q 33 56 38 62 T 48 62" stroke="#38bdf8" strokeWidth="2" fill="none" />
          <line x1="52" y1="58" x2="52" y2="66" stroke={strokeColor} strokeWidth="1.5" />
          <path d="M 56 62 Q 61 56 66 62 T 76 62" stroke="#22c55e" strokeWidth="2" fill="none" />
          {/* Control pushbuttons */}
          <circle cx="36" cy="78" r="4" fill="#22c55e" />
          <circle cx="58" cy="78" r="4" fill="#ef4444" />
        </svg>
      );

    case 'soft_starter':
      return (
        <svg width={width} height={height} viewBox="0 0 90 95" fill="none">
          <rect x="15" y="10" width="60" height="75" rx="6" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          {/* Antiparallel thyristor symbol */}
          <polygon points="35,28 55,28 45,44" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          <polygon points="55,54 35,54 45,38" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          <line x1="45" y1="18" x2="45" y2="28" stroke={strokeColor} strokeWidth="2" />
          <line x1="45" y1="54" x2="45" y2="65" stroke={strokeColor} strokeWidth="2" />
          {/* Ramp-up curve badge */}
          <rect x="25" y="68" width="40" height="12" rx="3" fill={secondaryFill} />
          <path d="M 28 77 L 42 77 L 58 71" stroke="#eab308" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'power_demand_controller':
      return (
        <svg width={width} height={height} viewBox="0 0 95 95" fill="none">
          <rect x="12" y="12" width="71" height="71" rx="8" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          {/* Meter gauge LCD screen */}
          <rect x="20" y="20" width="55" height="34" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="47.5" y="34" fontSize="8" fontWeight="bold" fill="#f59e0b" textAnchor="middle" fontFamily="monospace">
            MAXÍMETRO
          </text>
          <text x="47.5" y="47" fontSize="10" fontWeight="bold" fill="#22c55e" textAnchor="middle" fontFamily="monospace">
            28.4 kW
          </text>
          {/* 3 Bargraph LEDs for kW demand limit */}
          <rect x="26" y="62" width="10" height="14" rx="2" fill="#22c55e" />
          <rect x="42" y="62" width="10" height="14" rx="2" fill="#eab308" />
          <rect x="58" y="62" width="10" height="14" rx="2" fill="#ef4444" />
        </svg>
      );

    // --- CÁMARAS DIDÁCTICAS ADICIONALES ---
    case 'cold_room_fermentation':
      return (
        <svg width={width} height={height} viewBox="0 0 120 110" fill="none">
          <rect x="10" y="10" width="100" height="90" rx="8" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <rect x="16" y="16" width="88" height="78" rx="4" fill={isDark ? '#1a1912' : '#fefce8'} stroke="#eab308" strokeWidth="1" />
          {/* Dual cycle: Cold & Heat icons */}
          <path d="M 30 28 L 30 38 M 25 33 L 35 33" stroke="#38bdf8" strokeWidth="1.5" />
          <path d="M 85 28 Q 88 33 85 38" stroke="#ef4444" strokeWidth="1.5" />
          <path d="M 90 28 Q 93 33 90 38" stroke="#ef4444" strokeWidth="1.5" />
          {/* Baker bread / dough tray */}
          <ellipse cx="60" cy="78" rx="28" ry="8" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          {/* Display */}
          <rect x="42" y="48" width="36" height="16" rx="3" fill="#854d0e" />
          <text x="60" y="60" fontSize="8" fontWeight="bold" fill="#fef08a" textAnchor="middle" fontFamily="monospace">
            FERM
          </text>
        </svg>
      );

    case 'cold_room_ripening':
      return (
        <svg width={width} height={height} viewBox="0 0 120 110" fill="none">
          <rect x="10" y="10" width="100" height="90" rx="8" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <rect x="16" y="16" width="88" height="78" rx="4" fill={isDark ? '#142013' : '#f0fdf4'} stroke="#22c55e" strokeWidth="1" />
          {/* Fruit / Banana bunch outline */}
          <path d="M 45 68 C 45 52 75 52 75 68" fill="none" stroke="#eab308" strokeWidth="3" strokeLinecap="round" />
          <path d="M 40 73 C 40 58 70 58 70 73" fill="none" stroke="#84cc16" strokeWidth="3" strokeLinecap="round" />
          {/* Gas injection nozzle */}
          <rect x="80" y="24" width="12" height="6" rx="1" fill="#22c55e" />
          {/* Display */}
          <rect x="42" y="28" width="36" height="16" rx="3" fill="#15803d" />
          <text x="60" y="40" fontSize="8" fontWeight="bold" fill="#ffffff" textAnchor="middle" fontFamily="monospace">
            +16°C
          </text>
        </svg>
      );

    case 'cold_room_drying':
      return (
        <svg width={width} height={height} viewBox="0 0 120 110" fill="none">
          <rect x="10" y="10" width="100" height="90" rx="8" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <rect x="16" y="16" width="88" height="78" rx="4" fill={isDark ? '#231515' : '#fef2f2'} stroke="#f43f5e" strokeWidth="1" />
          {/* Curing rails / Jamones */}
          <line x1="25" y1="35" x2="95" y2="35" stroke={strokeColor} strokeWidth="2" />
          <path d="M 40 35 L 40 45 C 35 55 45 65 40 75" fill="none" stroke="#be123c" strokeWidth="3" strokeLinecap="round" />
          <path d="M 65 35 L 65 45 C 60 55 70 65 65 75" fill="none" stroke="#be123c" strokeWidth="3" strokeLinecap="round" />
          {/* Display */}
          <rect x="40" y="80" width="40" height="15" rx="3" fill="#9f1239" />
          <text x="60" y="91" fontSize="7" fontWeight="bold" fill="#ffffff" textAnchor="middle" fontFamily="monospace">
            65% HR
          </text>
        </svg>
      );

    case 'ice_storage_room':
      return (
        <svg width={width} height={height} viewBox="0 0 120 110" fill="none">
          <rect x="8" y="8" width="104" height="94" rx="8" fill={fillColor} stroke="#0ea5e9" strokeWidth="2" />
          <rect x="15" y="15" width="90" height="80" rx="4" fill={isDark ? '#0c2233' : '#f0f9ff'} stroke="#38bdf8" strokeWidth="1" />
          {/* Ceiling cooling coil */}
          <path d="M 25 24 L 95 24 M 25 28 L 95 28" stroke="#0284c7" strokeWidth="1.5" />
          {/* Flake ice pile */}
          <polygon points="25,85 60,52 95,85" fill={isDark ? '#1e3a8a' : '#bae6fd'} stroke="#0284c7" strokeWidth="1.5" />
          {/* Display */}
          <rect x="45" y="38" width="30" height="13" rx="2" fill="#0369a1" />
          <text x="60" y="47" fontSize="7" fontWeight="bold" fill="#ffffff" textAnchor="middle" fontFamily="monospace">
            -5.0°C
          </text>
        </svg>
      );

    // --- INSTALACIÓN ELÉCTRICA: COMPONENTES DIDÁCTICOS ---
    case 'power_supply_terminal':
      return (
        <svg width={width} height={height} viewBox="0 0 100 80" fill="none">
          {/* Terminal Block */}
          <rect x="10" y="15" width="80" height="50" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          {/* 4 Terminals L1, L2, L3, N */}
          {[22, 40, 58, 76].map((x, i) => (
            <g key={i}>
              <circle cx={x} cy="26" r="4" fill={secondaryFill} stroke={strokeColor} strokeWidth="1" />
              <circle cx={x} cy="54" r="4" fill={secondaryFill} stroke={strokeColor} strokeWidth="1" />
              <line x1={x} y1="26" x2={x} y2="54" stroke={strokeColor} strokeWidth="1.5" />
            </g>
          ))}
          <text x="22" y="74" fontSize="7" fontWeight="bold" fill="#b45309" textAnchor="middle">L1</text>
          <text x="40" y="74" fontSize="7" fontWeight="bold" fill="#1e293b" textAnchor="middle">L2</text>
          <text x="58" y="74" fontSize="7" fontWeight="bold" fill="#64748b" textAnchor="middle">L3</text>
          <text x="76" y="74" fontSize="7" fontWeight="bold" fill="#2563eb" textAnchor="middle">N</text>
        </svg>
      );

    case 'ground_earth':
      return (
        <svg width={width} height={height} viewBox="0 0 70 70" fill="none">
          {/* Standard Earth / PE symbol */}
          <line x1="35" y1="10" x2="35" y2="35" stroke="#65a30d" strokeWidth="3" />
          <line x1="15" y1="35" x2="55" y2="35" stroke="#65a30d" strokeWidth="3" strokeLinecap="round" />
          <line x1="22" y1="44" x2="48" y2="44" stroke="#65a30d" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="29" y1="53" x2="41" y2="53" stroke="#65a30d" strokeWidth="2" strokeLinecap="round" />
          <text x="35" y="65" fontSize="7" fontWeight="bold" fill="#65a30d" textAnchor="middle">PE</text>
        </svg>
      );

    case 'residual_current_device':
      return (
        <svg width={width} height={height} viewBox="0 0 85 95" fill="none">
          <rect x="15" y="10" width="55" height="75" rx="5" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          {/* Toroidal core transformer oval */}
          <ellipse cx="42.5" cy="40" rx="16" ry="12" fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="3 2" />
          {/* Test button 'T' */}
          <rect x="25" y="62" width="14" height="12" rx="2" fill="#ef4444" />
          <text x="32" y="71" fontSize="7" fontWeight="bold" fill="#ffffff" textAnchor="middle">T</text>
          <text x="56" y="71" fontSize="7" fontWeight="bold" fill={strokeColor} textAnchor="middle">30mA</text>
        </svg>
      );

    case 'motor_protection_switch':
      return (
        <svg width={width} height={height} viewBox="0 0 85 95" fill="none">
          <rect x="15" y="10" width="55" height="75" rx="5" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          {/* I - O buttons */}
          <rect x="26" y="22" width="14" height="16" rx="2" fill="#22c55e" />
          <text x="33" y="33" fontSize="8" fontWeight="bold" fill="#ffffff" textAnchor="middle">I</text>
          <rect x="46" y="22" width="14" height="16" rx="2" fill="#ef4444" />
          <text x="53" y="33" fontSize="8" fontWeight="bold" fill="#ffffff" textAnchor="middle">O</text>
          {/* Current dial */}
          <circle cx="42.5" cy="58" r="10" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          <line x1="42.5" y1="58" x2="48" y2="52" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          <text x="42.5" y="78" fontSize="7" fontWeight="bold" fill={strokeColor} textAnchor="middle">Ir (A)</text>
        </svg>
      );

    case 'fuse_disconnect':
      return (
        <svg width={width} height={height} viewBox="0 0 75 85" fill="none">
          <rect x="18" y="10" width="38" height="65" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          {/* Cylindrical fuse tube */}
          <rect x="26" y="22" width="22" height="40" rx="3" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          <line x1="37" y1="12" x2="37" y2="72" stroke="#f59e0b" strokeWidth="2" />
          <circle cx="37" cy="42" r="3" fill="#f59e0b" />
          <text x="37" y="55" fontSize="7" fontWeight="bold" fill={strokeColor} textAnchor="middle">FU</text>
        </svg>
      );

    case 'thermal_overload_relay':
      return (
        <svg width={width} height={height} viewBox="0 0 90 90" fill="none">
          <rect x="12" y="10" width="66" height="70" rx="5" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          {/* Bimetal heating loops symbol */}
          <path d="M 26 24 C 20 32 32 38 26 46" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          <path d="M 45 24 C 39 32 51 38 45 46" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          <path d="M 64 24 C 58 32 70 38 64 46" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          {/* Blue Reset button */}
          <rect x="33" y="56" width="24" height="14" rx="2" fill="#2563eb" />
          <text x="45" y="66" fontSize="7" fontWeight="bold" fill="#ffffff" textAnchor="middle">RESET</text>
        </svg>
      );

    case 'relay_coil_auxiliary':
      return (
        <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
          {/* IEC Relay coil rectangle */}
          <rect x="18" y="15" width="44" height="50" rx="3" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <line x1="18" y1="15" x2="62" y2="65" stroke={strokeColor} strokeWidth="1.5" />
          <text x="40" y="32" fontSize="7" fontWeight="bold" fill={accentColor} textAnchor="middle">A1</text>
          <text x="40" y="60" fontSize="7" fontWeight="bold" fill={accentColor} textAnchor="middle">A2</text>
          <text x="40" y="44" fontSize="8" fontWeight="bold" fill={strokeColor} textAnchor="middle">KA</text>
        </svg>
      );

    case 'contact_aux_no':
      return (
        <svg width={width} height={height} viewBox="0 0 70 70" fill="none">
          {/* IEC NO Contact (13-14) */}
          <line x1="35" y1="10" x2="35" y2="28" stroke={strokeColor} strokeWidth="2" />
          <line x1="35" y1="44" x2="35" y2="60" stroke={strokeColor} strokeWidth="2" />
          <line x1="35" y1="28" x2="48" y2="42" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="35" cy="28" r="2.5" fill={strokeColor} />
          <circle cx="35" cy="44" r="2.5" fill={strokeColor} />
          <text x="22" y="24" fontSize="7" fontWeight="bold" fill={strokeColor}>13</text>
          <text x="22" y="52" fontSize="7" fontWeight="bold" fill={strokeColor}>14</text>
        </svg>
      );

    case 'contact_aux_nc':
      return (
        <svg width={width} height={height} viewBox="0 0 70 70" fill="none">
          {/* IEC NC Contact (21-22) */}
          <line x1="35" y1="10" x2="35" y2="26" stroke={strokeColor} strokeWidth="2" />
          <line x1="35" y1="44" x2="35" y2="60" stroke={strokeColor} strokeWidth="2" />
          <line x1="35" y1="26" x2="35" y2="44" stroke="#ef4444" strokeWidth="2.5" />
          <line x1="28" y1="26" x2="42" y2="26" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          <circle cx="35" cy="26" r="2.5" fill={strokeColor} />
          <circle cx="35" cy="44" r="2.5" fill={strokeColor} />
          <text x="22" y="22" fontSize="7" fontWeight="bold" fill={strokeColor}>21</text>
          <text x="22" y="52" fontSize="7" fontWeight="bold" fill={strokeColor}>22</text>
        </svg>
      );

    case 'timer_delay_on':
      return (
        <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
          <rect x="18" y="15" width="44" height="50" rx="3" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          {/* TON crossed parachute symbol */}
          <path d="M 28 26 L 52 26 M 28 26 L 40 40 L 52 26" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="40" y="54" fontSize="8" fontWeight="bold" fill="#38bdf8" textAnchor="middle">TON</text>
        </svg>
      );

    case 'timer_delay_off':
      return (
        <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
          <rect x="18" y="15" width="44" height="50" rx="3" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          {/* TOFF shaded symbol */}
          <rect x="25" y="22" width="30" height="15" fill="#eab308" />
          <text x="40" y="54" fontSize="8" fontWeight="bold" fill="#eab308" textAnchor="middle">TOFF</text>
        </svg>
      );

    case 'pushbutton_no':
      return (
        <svg width={width} height={height} viewBox="0 0 75 75" fill="none">
          <circle cx="37.5" cy="37.5" r="25" fill={fillColor} stroke="#22c55e" strokeWidth="2.5" />
          <circle cx="37.5" cy="37.5" r="16" fill="#22c55e" />
          <path d="M 28 37.5 L 47 37.5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          <text x="37.5" y="69" fontSize="7" fontWeight="bold" fill={strokeColor} textAnchor="middle">START (NO)</text>
        </svg>
      );

    case 'pushbutton_nc':
      return (
        <svg width={width} height={height} viewBox="0 0 75 75" fill="none">
          <circle cx="37.5" cy="37.5" r="25" fill={fillColor} stroke="#ef4444" strokeWidth="2.5" />
          <circle cx="37.5" cy="37.5" r="16" fill="#ef4444" />
          <rect x="31" y="31" width="13" height="13" rx="2" fill="#ffffff" />
          <text x="37.5" y="69" fontSize="7" fontWeight="bold" fill={strokeColor} textAnchor="middle">STOP (NC)</text>
        </svg>
      );

    case 'emergency_stop_button':
      return (
        <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
          {/* Yellow protective housing */}
          <circle cx="40" cy="40" r="28" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
          {/* Red mushroom knob */}
          <circle cx="40" cy="40" r="18" fill="#ef4444" stroke="#991b1b" strokeWidth="2" />
          {/* Twist to release arrow */}
          <path d="M 33 34 C 38 28 46 32 46 40" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          <polygon points="43,38 47,40 47,35" fill="#ffffff" />
        </svg>
      );

    case 'selector_switch_rotary':
      return (
        <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="26" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          {/* Rotary selector knob bar */}
          <rect x="36" y="20" width="8" height="40" rx="3" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" transform="rotate(45 40 40)" />
          <text x="24" y="24" fontSize="6" fontWeight="bold" fill={strokeColor}>MAN</text>
          <text x="40" y="16" fontSize="6" fontWeight="bold" fill={strokeColor} textAnchor="middle">0</text>
          <text x="56" y="24" fontSize="6" fontWeight="bold" fill={strokeColor}>AUT</text>
        </svg>
      );

    case 'control_transformer':
      return (
        <svg width={width} height={height} viewBox="0 0 85 85" fill="none">
          {/* Primary and secondary overlapping circles */}
          <circle cx="34" cy="42" r="18" fill="none" stroke={strokeColor} strokeWidth="2" />
          <circle cx="51" cy="42" r="18" fill="none" stroke="#38bdf8" strokeWidth="2" />
          <text x="24" y="20" fontSize="7" fontWeight="bold" fill={strokeColor}>230V</text>
          <text x="61" y="20" fontSize="7" fontWeight="bold" fill="#38bdf8">24V</text>
        </svg>
      );

    case 'power_supply_dc_24v':
      return (
        <svg width={width} height={height} viewBox="0 0 85 85" fill="none">
          <rect x="12" y="10" width="61" height="65" rx="5" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <text x="42.5" y="28" fontSize="8" fontWeight="bold" fill={strokeColor} textAnchor="middle">230V AC</text>
          <line x1="22" y1="38" x2="63" y2="38" stroke={strokeColor} strokeWidth="1.5" strokeDasharray="3 2" />
          <text x="42.5" y="55" fontSize="10" fontWeight="bold" fill="#22c55e" textAnchor="middle">+24V DC</text>
          <circle cx="63" cy="65" r="2.5" fill="#22c55e" />
        </svg>
      );

    case 'pilot_light_green':
      return (
        <svg width={width} height={height} viewBox="0 0 70 70" fill="none">
          <circle cx="35" cy="35" r="22" fill={fillColor} stroke="#22c55e" strokeWidth="2.5" />
          <line x1="20" y1="20" x2="50" y2="50" stroke="#22c55e" strokeWidth="2.5" />
          <line x1="50" y1="20" x2="20" y2="50" stroke="#22c55e" strokeWidth="2.5" />
          <circle cx="35" cy="35" r="6" fill="#22c55e" />
        </svg>
      );

    case 'pilot_light_red':
      return (
        <svg width={width} height={height} viewBox="0 0 70 70" fill="none">
          <circle cx="35" cy="35" r="22" fill={fillColor} stroke="#ef4444" strokeWidth="2.5" />
          <line x1="20" y1="20" x2="50" y2="50" stroke="#ef4444" strokeWidth="2.5" />
          <line x1="50" y1="20" x2="20" y2="50" stroke="#ef4444" strokeWidth="2.5" />
          <circle cx="35" cy="35" r="6" fill="#ef4444" />
        </svg>
      );

    case 'pilot_light_amber':
      return (
        <svg width={width} height={height} viewBox="0 0 70 70" fill="none">
          <circle cx="35" cy="35" r="22" fill={fillColor} stroke="#eab308" strokeWidth="2.5" />
          <line x1="20" y1="20" x2="50" y2="50" stroke="#eab308" strokeWidth="2.5" />
          <line x1="50" y1="20" x2="20" y2="50" stroke="#eab308" strokeWidth="2.5" />
          <circle cx="35" cy="35" r="6" fill="#eab308" />
        </svg>
      );

    case 'buzzer_siren':
      return (
        <svg width={width} height={height} viewBox="0 0 75 75" fill="none">
          {/* Bell / Horn cone */}
          <path d="M 22 25 L 35 25 L 52 15 L 52 60 L 35 50 L 22 50 Z" fill={secondaryFill} stroke="#ef4444" strokeWidth="2" />
          <path d="M 58 28 Q 66 37 58 46" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          <path d="M 64 22 Q 74 37 64 52" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'electric_motor_3p':
      return (
        <svg width={width} height={height} viewBox="0 0 85 85" fill="none">
          <circle cx="42.5" cy="42.5" r="28" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
          <text x="42.5" y="44" fontSize="14" fontWeight="bold" fill={strokeColor} textAnchor="middle">M</text>
          <text x="42.5" y="57" fontSize="9" fontWeight="bold" fill="#b45309" textAnchor="middle">3 ~</text>
          {/* Terminal block box on top */}
          <rect x="33" y="8" width="19" height="9" rx="2" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
        </svg>
      );

    case 'electric_motor_1p':
      return (
        <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="26" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
          <text x="40" y="41" fontSize="14" fontWeight="bold" fill={strokeColor} textAnchor="middle">M</text>
          <text x="40" y="54" fontSize="9" fontWeight="bold" fill="#2563eb" textAnchor="middle">1 ~</text>
          <rect x="31" y="8" width="18" height="8" rx="2" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
        </svg>
      );

    case 'electric_heater':
      return (
        <svg width={width} height={height} viewBox="0 0 85 70" fill="none">
          {/* Zigzag heating resistor */}
          <path d="M 15 35 L 25 35 L 30 20 L 40 50 L 50 20 L 60 50 L 65 35 L 75 35" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="22" y="14" width="46" height="42" rx="3" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
        </svg>
      );

    case 'solenoid_coil':
      return (
        <svg width={width} height={height} viewBox="0 0 75 75" fill="none">
          {/* Solenoid coil block */}
          <rect x="18" y="15" width="39" height="45" rx="3" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <line x1="18" y1="15" x2="57" y2="60" stroke="#f59e0b" strokeWidth="2" />
          {/* Plunger core arrow */}
          <polygon points="37,22 43,30 31,30" fill="#f59e0b" />
          <line x1="37" y1="30" x2="37" y2="48" stroke="#f59e0b" strokeWidth="2" />
          <text x="37.5" y="55" fontSize="8" fontWeight="bold" fill={strokeColor} textAnchor="middle">Y1</text>
        </svg>
      );

    // --- ELECTRICIDAD BÁSICA & DIDÁCTICA ---
    case 'battery_dc_cell':
      return (
        <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
          {/* Top terminal (+) */}
          <line x1="40" y1="5" x2="40" y2="28" stroke="#ef4444" strokeWidth="2.5" />
          <text x="54" y="22" fontSize="12" fontWeight="bold" fill="#ef4444" textAnchor="middle">+</text>

          {/* Positive cell plates (longer, copper/red) */}
          <line x1="18" y1="28" x2="62" y2="28" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
          {/* Negative cell plate (shorter, thicker, blue) */}
          <line x1="28" y1="36" x2="52" y2="36" stroke="#3b82f6" strokeWidth="5.5" strokeLinecap="round" />

          {/* Second cell stage */}
          <line x1="18" y1="44" x2="62" y2="44" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="28" y1="52" x2="52" y2="52" stroke="#3b82f6" strokeWidth="5.5" strokeLinecap="round" />

          {/* Bottom terminal (-) */}
          <line x1="40" y1="52" x2="40" y2="75" stroke="#3b82f6" strokeWidth="2.5" />
          <text x="54" y="70" fontSize="12" fontWeight="bold" fill="#3b82f6" textAnchor="middle">-</text>

          {/* 12V Label Tag */}
          <rect x="4" y="33" width="18" height="14" rx="2" fill={secondaryFill} stroke={strokeColor} strokeWidth="1" />
          <text x="13" y="43" fontSize="7" fontWeight="bold" fill={strokeColor} textAnchor="middle">12V</text>
        </svg>
      );

    case 'power_source_ac':
      return (
        <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
          {/* Top Phase (L) */}
          <line x1="40" y1="5" x2="40" y2="18" stroke="#b45309" strokeWidth="2.5" />
          <text x="54" y="17" fontSize="11" fontWeight="bold" fill="#b45309">L</text>

          {/* AC Generator Circle */}
          <circle cx="40" cy="40" r="22" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
          {/* Sine Wave */}
          <path d="M 27 40 Q 33.5 28 40 40 T 53 40" fill="none" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" />

          {/* Bottom Neutral (N) */}
          <line x1="40" y1="62" x2="40" y2="75" stroke="#2563eb" strokeWidth="2.5" />
          <text x="54" y="72" fontSize="11" fontWeight="bold" fill="#2563eb">N</text>
        </svg>
      );

    case 'light_bulb':
      return (
        <svg width={width} height={height} viewBox="0 0 85 95" fill="none">
          <defs>
            {isEnergized && (
              <>
                <radialGradient id="bulbGlowGrad" cx="50%" cy="40%" r="55%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="35%" stopColor="#fef08a" stopOpacity="0.95" />
                  <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0.4" />
                </radialGradient>
              </>
            )}
          </defs>

          {/* Radiant Aura when ON */}
          {isEnergized && (
            <>
              <circle cx="42.5" cy="36" r="32" fill="#fbbf24" opacity="0.45" filter="drop-shadow(0 0 16px rgba(251, 191, 36, 0.9))" />
              {/* Radiating Light Rays */}
              <line x1="42.5" y1="3" x2="42.5" y2="9" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="18" y1="12" x2="23" y2="17" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="67" y1="12" x2="62" y2="17" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="8" y1="36" x2="14" y2="36" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="77" y1="36" x2="71" y2="36" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="18" y1="60" x2="23" y2="55" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="67" y1="60" x2="62" y2="55" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}

          {/* Glass Dome */}
          <path
            d="M 28 58 C 21 52 18 43 18 35 C 18 21.5 29 11 42.5 11 C 56 11 67 21.5 67 35 C 67 43 64 52 57 58 Z"
            fill={isEnergized ? 'url(#bulbGlowGrad)' : fillColor}
            stroke={isEnergized ? '#f59e0b' : strokeColor}
            strokeWidth={isEnergized ? '2.5' : '2'}
            className="transition-all duration-200"
          />

          {/* Internal Support Wires */}
          <line x1="36" y1="58" x2="36" y2="38" stroke={isEnergized ? '#ffffff' : isDark ? '#64748b' : '#94a3b8'} strokeWidth="1.5" />
          <line x1="49" y1="58" x2="49" y2="38" stroke={isEnergized ? '#ffffff' : isDark ? '#64748b' : '#94a3b8'} strokeWidth="1.5" />
          {/* Curly Filament */}
          <path
            d="M 36 38 Q 42.5 28 49 38"
            fill="none"
            stroke={isEnergized ? '#ffffff' : '#f59e0b'}
            strokeWidth={isEnergized ? '3.5' : '2'}
            strokeLinecap="round"
          />

          {/* Screw Base Collar */}
          <rect x="32" y="60" width="21" height="12" rx="2" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          <line x1="32" y1="64" x2="53" y2="64" stroke={strokeColor} strokeWidth="1" />
          <line x1="32" y1="68" x2="53" y2="68" stroke={strokeColor} strokeWidth="1" />

          {/* Bottom Foot Contact */}
          <ellipse cx="42.5" cy="74" rx="6" ry="3" fill="#64748b" stroke={strokeColor} strokeWidth="1" />

          {/* Lead Terminals to Left & Right */}
          <line x1="2" y1="66" x2="32" y2="66" stroke="#b45309" strokeWidth="2" strokeDasharray="3 2" />
          <line x1="53" y1="66" x2="83" y2="66" stroke="#2563eb" strokeWidth="2" strokeDasharray="3 2" />
        </svg>
      );

    case 'switch_spst':
      return (
        <svg width={width} height={height} viewBox="0 0 80 65" fill="none">
          {/* Terminal 1 Contact */}
          <circle cx="20" cy="33" r="4.5" fill={isSwitchClosed ? '#22c55e' : fillColor} stroke={strokeColor} strokeWidth="2" />
          <line x1="2" y1="33" x2="15.5" y2="33" stroke={strokeColor} strokeWidth="2" />

          {/* Terminal 2 Contact */}
          <circle cx="60" cy="33" r="4.5" fill={isSwitchClosed ? '#22c55e' : fillColor} stroke={strokeColor} strokeWidth="2" />
          <line x1="64.5" y1="33" x2="78" y2="33" stroke={strokeColor} strokeWidth="2" />

          {/* Switch Blade */}
          {isSwitchClosed ? (
            <g className="transition-all duration-150">
              <line x1="20" y1="33" x2="60" y2="33" stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="40" cy="33" r="2.5" fill="#ffffff" />
            </g>
          ) : (
            <g className="transition-all duration-150">
              <line x1="20" y1="33" x2="52" y2="16" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
              <circle cx="52" cy="16" r="2.5" fill="#ef4444" />
            </g>
          )}

          {/* State Text Badge */}
          <rect
            x="24"
            y="46"
            width="32"
            height="14"
            rx="3"
            fill={isSwitchClosed ? '#15803d' : '#991b1b'}
            opacity="0.9"
          />
          <text
            x="40"
            y="56"
            fontSize="8"
            fontWeight="bold"
            fill="#ffffff"
            textAnchor="middle"
          >
            {isSwitchClosed ? 'CERRADO' : 'ABIERTO'}
          </text>
        </svg>
      );

    case 'switch_spdt':
      return (
        <svg width={width} height={height} viewBox="0 0 80 70" fill="none">
          {/* Common contact (left) */}
          <circle cx="20" cy="35" r="4.5" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <line x1="2" y1="35" x2="15.5" y2="35" stroke={strokeColor} strokeWidth="2" />

          {/* Terminal 1 (top right) */}
          <circle cx="60" cy="20" r="4.5" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <line x1="64.5" y1="20" x2="78" y2="20" stroke={strokeColor} strokeWidth="2" />
          <text x="68" y="14" fontSize="8" fontWeight="bold" fill={strokeColor}>1</text>

          {/* Terminal 2 (bottom right) */}
          <circle cx="60" cy="50" r="4.5" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <line x1="64.5" y1="50" x2="78" y2="50" stroke={strokeColor} strokeWidth="2" />
          <text x="68" y="60" fontSize="8" fontWeight="bold" fill={strokeColor}>2</text>

          {/* Blade connecting to pos 1 or pos 2 */}
          <line
            x1="20"
            y1="35"
            x2="58"
            y2={isSwitchClosed ? 50 : 20}
            stroke="#38bdf8"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'pushbutton_simple':
      return (
        <svg width={width} height={height} viewBox="0 0 80 65" fill="none">
          <circle cx="24" cy="38" r="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <line x1="2" y1="38" x2="20" y2="38" stroke={strokeColor} strokeWidth="2" />
          <circle cx="56" cy="38" r="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <line x1="60" y1="38" x2="78" y2="38" stroke={strokeColor} strokeWidth="2" />

          {/* T-Bar Plunger */}
          {isSwitchClosed ? (
            <g className="transition-all duration-150">
              <line x1="22" y1="34" x2="58" y2="34" stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="40" y1="34" x2="40" y2="15" stroke="#22c55e" strokeWidth="2.5" />
              <circle cx="40" cy="12" r="5" fill="#22c55e" />
            </g>
          ) : (
            <g className="transition-all duration-150">
              <line x1="22" y1="24" x2="58" y2="24" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
              <line x1="40" y1="24" x2="40" y2="10" stroke={strokeColor} strokeWidth="2" />
              <circle cx="40" cy="8" r="5" fill="#0284c7" />
            </g>
          )}

          <text x="40" y="55" fontSize="7" fontWeight="bold" fill={strokeColor} textAnchor="middle">
            {isSwitchClosed ? 'PULSADO' : 'NO (13-14)'}
          </text>
        </svg>
      );

    case 'pushbutton_nc_simple':
      return (
        <svg width={width} height={height} viewBox="0 0 80 65" fill="none">
          <circle cx="24" cy="30" r="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <line x1="2" y1="30" x2="20" y2="30" stroke={strokeColor} strokeWidth="2" />
          <circle cx="56" cy="30" r="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <line x1="60" y1="30" x2="78" y2="30" stroke={strokeColor} strokeWidth="2" />

          {/* NC Bridge */}
          {isSwitchClosed ? (
            <g>
              <line x1="22" y1="34" x2="58" y2="34" stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="40" y1="34" x2="40" y2="15" stroke="#22c55e" strokeWidth="2" />
              <circle cx="40" cy="12" r="5" fill="#15803d" />
            </g>
          ) : (
            <g>
              <line x1="22" y1="46" x2="58" y2="46" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
              <line x1="40" y1="46" x2="40" y2="25" stroke="#ef4444" strokeWidth="2" />
              <circle cx="40" cy="20" r="5" fill="#dc2626" />
            </g>
          )}

          <text x="40" y="58" fontSize="7" fontWeight="bold" fill={strokeColor} textAnchor="middle">
            {isSwitchClosed ? 'CERRADO (NC)' : 'ABIERTO'}
          </text>
        </svg>
      );

    case 'resistor_fixed':
      return (
        <svg width={width} height={height} viewBox="0 0 80 55" fill="none">
          <line x1="2" y1="27.5" x2="16" y2="27.5" stroke={strokeColor} strokeWidth="2.5" />
          <path
            d="M 16 27.5 L 22 15 L 30 40 L 38 15 L 46 40 L 54 15 L 60 40 L 64 27.5"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="64" y1="27.5" x2="78" y2="27.5" stroke={strokeColor} strokeWidth="2.5" />
          <text x="40" y="50" fontSize="8" fontWeight="bold" fill={strokeColor} textAnchor="middle">
            {resistanceOhm ? `${resistanceOhm} Ω` : '100 Ω'}
          </text>
        </svg>
      );

    case 'potentiometer':
      return (
        <svg width={width} height={height} viewBox="0 0 80 70" fill="none">
          <line x1="2" y1="40" x2="16" y2="40" stroke={strokeColor} strokeWidth="2" />
          <rect x="16" y="32" width="48" height="16" rx="2" fill={fillColor} stroke="#f59e0b" strokeWidth="2" />
          <line x1="64" y1="40" x2="78" y2="40" stroke={strokeColor} strokeWidth="2" />
          <line x1="40" y1="5" x2="40" y2="26" stroke="#38bdf8" strokeWidth="2" />
          <polygon points="40,32 35,24 45,24" fill="#38bdf8" />
          <text x="40" y="60" fontSize="7" fontWeight="bold" fill={strokeColor} textAnchor="middle">10 kΩ</text>
        </svg>
      );

    case 'capacitor_fixed':
      return (
        <svg width={width} height={height} viewBox="0 0 80 60" fill="none">
          <line x1="2" y1="30" x2="33" y2="30" stroke="#ef4444" strokeWidth="2.5" />
          <text x="18" y="22" fontSize="9" fontWeight="bold" fill="#ef4444">+</text>
          <line x1="33" y1="12" x2="33" y2="48" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />

          <line x1="47" y1="12" x2="47" y2="48" stroke="#3b82f6" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="47" y1="30" x2="78" y2="30" stroke="#3b82f6" strokeWidth="2.5" />
          <text x="62" y="22" fontSize="9" fontWeight="bold" fill="#3b82f6">-</text>

          <text x="40" y="56" fontSize="7" fontWeight="bold" fill={strokeColor} textAnchor="middle">100 µF</text>
        </svg>
      );

    case 'diode_led':
      return (
        <svg width={width} height={height} viewBox="0 0 80 75" fill="none">
          {isEnergized && (
            <circle cx="40" cy="40" r="22" fill="#22c55e" opacity="0.3" filter="drop-shadow(0 0 8px #22c55e)" />
          )}
          <line x1="2" y1="40" x2="28" y2="40" stroke="#ef4444" strokeWidth="2" />
          <polygon
            points="28,24 28,56 50,40"
            fill={isEnergized ? '#22c55e' : fillColor}
            stroke={isEnergized ? '#22c55e' : strokeColor}
            strokeWidth="2"
          />
          <line x1="50" y1="24" x2="50" y2="56" stroke={isEnergized ? '#22c55e' : strokeColor} strokeWidth="3" />
          <line x1="50" y1="40" x2="78" y2="40" stroke="#3b82f6" strokeWidth="2" />

          <path d="M 45 22 L 57 10" stroke={isEnergized ? '#22c55e' : '#f59e0b'} strokeWidth="2" strokeLinecap="round" />
          <polygon points="57,10 52,11 56,15" fill={isEnergized ? '#22c55e' : '#f59e0b'} />
          <path d="M 52 28 L 64 16" stroke={isEnergized ? '#22c55e' : '#f59e0b'} strokeWidth="2" strokeLinecap="round" />
          <polygon points="64,16 59,17 63,21" fill={isEnergized ? '#22c55e' : '#f59e0b'} />
        </svg>
      );

    case 'voltmeter_basic':
      return (
        <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
          <rect
            x="8"
            y="8"
            width="64"
            height="64"
            rx="8"
            fill={fillColor}
            stroke={isSeriesWarning ? '#f59e0b' : strokeColor}
            strokeWidth={isSeriesWarning ? '2.5' : '2'}
          />
          <rect x="14" y="14" width="52" height="24" rx="3" fill="#0f172a" stroke={isSeriesWarning ? '#f59e0b' : '#38bdf8'} strokeWidth="1" />
          <text x="40" y="30" fontSize="11" fontWeight="bold" fontFamily="monospace" fill={isSeriesWarning ? '#fbbf24' : '#38bdf8'} textAnchor="middle">
            {measuredValue !== undefined ? `${measuredValue.toFixed(1)}` : '0.0'} V
          </text>
          
          <circle cx="40" cy="54" r="11" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          <text x="40" y="58" fontSize="11" fontWeight="bold" fill="#eab308" textAnchor="middle">V</text>

          {/* Series Warning Badge */}
          {isSeriesWarning && !isSeriesPassThrough && (
            <g>
              <rect x="10" y="42" width="60" height="11" rx="2" fill="#78350f" stroke="#f59e0b" strokeWidth="0.8" />
              <text x="40" y="50" fontSize="6" fontWeight="bold" fill="#fef3c7" textAnchor="middle">⚠️ EN SERIE: R=10MΩ</text>
            </g>
          )}

          {/* Bypass Active Badge */}
          {isSeriesPassThrough && (
            <g>
              <rect x="12" y="42" width="56" height="11" rx="2" fill="#064e3b" stroke="#10b981" strokeWidth="0.8" />
              <text x="40" y="50" fontSize="6.5" fontWeight="bold" fill="#a7f3d0" textAnchor="middle">⚡ BYPASS ACTIVO</text>
            </g>
          )}

          <line x1="2" y1="40" x2="8" y2="40" stroke="#ef4444" strokeWidth="2.5" />
          <line x1="72" y1="40" x2="78" y2="40" stroke="#3b82f6" strokeWidth="2.5" />
        </svg>
      );

    case 'ohmmeter_basic':
      return (
        <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
          <rect x="8" y="8" width="64" height="64" rx="8" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <rect x="14" y="14" width="52" height="24" rx="3" fill="#0f172a" stroke="#a855f7" strokeWidth="1" />
          <text x="40" y="30" fontSize="11" fontWeight="bold" fontFamily="monospace" fill="#c084fc" textAnchor="middle">
            {measuredValue !== undefined ? `${measuredValue.toFixed(1)}` : '0.0'} Ω
          </text>
          <circle cx="40" cy="54" r="11" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          <text x="40" y="58" fontSize="12" fontWeight="bold" fill="#c084fc" textAnchor="middle">Ω</text>

          <line x1="2" y1="40" x2="8" y2="40" stroke="#ef4444" strokeWidth="2.5" />
          <line x1="72" y1="40" x2="78" y2="40" stroke="#3b82f6" strokeWidth="2.5" />
        </svg>
      );

    case 'wattmeter_basic':
      return (
        <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
          <rect x="8" y="8" width="64" height="64" rx="8" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <rect x="14" y="14" width="52" height="22" rx="3" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
          <text x="40" y="29" fontSize="10" fontWeight="bold" fontFamily="monospace" fill="#fbbf24" textAnchor="middle">
            {measuredValue !== undefined ? `${measuredValue.toFixed(1)}` : '0.0'} W
          </text>
          
          <circle cx="40" cy="52" r="10" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          <text x="40" y="56" fontSize="11" fontWeight="bold" fill="#f59e0b" textAnchor="middle">W</text>

          {/* Voltage sense terminals (Left/Right) */}
          <line x1="2" y1="40" x2="8" y2="40" stroke="#ef4444" strokeWidth="2" />
          <line x1="72" y1="40" x2="78" y2="40" stroke="#3b82f6" strokeWidth="2" />
          {/* Current sense terminals (Top/Bottom) */}
          <line x1="40" y1="2" x2="40" y2="8" stroke="#f59e0b" strokeWidth="2" />
          <line x1="40" y1="72" x2="40" y2="78" stroke="#f59e0b" strokeWidth="2" />
        </svg>
      );

    case 'cell_dc_simple':
      return (
        <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
          {/* Top terminal (+) nipple */}
          <rect x="36" y="8" width="8" height="6" rx="1.5" fill="#f59e0b" stroke={strokeColor} strokeWidth="1" />
          <line x1="40" y1="2" x2="40" y2="8" stroke="#ef4444" strokeWidth="2" />
          
          {/* Battery Body (Alkaline cell styling) */}
          <rect x="26" y="14" width="28" height="52" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          {/* Top positive brass band */}
          <rect x="27" y="15" width="26" height="12" rx="3" fill="#d97706" opacity="0.8" />
          <text x="40" y="24" fontSize="8" fontWeight="bold" fill="#ffffff" textAnchor="middle">+</text>
          
          {/* Middle label */}
          <text x="40" y="44" fontSize="9" fontWeight="bold" fill={strokeColor} textAnchor="middle">1.5V</text>
          <text x="40" y="52" fontSize="6" fill="#64748b" textAnchor="middle">PILA AA</text>

          {/* Bottom negative terminal (-) */}
          <line x1="29" y1="62" x2="51" y2="62" stroke="#3b82f6" strokeWidth="2.5" />
          <text x="40" y="60" fontSize="8" fontWeight="bold" fill="#3b82f6" textAnchor="middle">-</text>
          <line x1="40" y1="66" x2="40" y2="78" stroke="#3b82f6" strokeWidth="2" />
        </svg>
      );

    case 'dc_power_source':
      return (
        <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
          {/* Bench Power Supply Enclosure */}
          <rect x="6" y="10" width="68" height="60" rx="6" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          
          {/* LED Digital Display */}
          <rect x="12" y="16" width="56" height="20" rx="3" fill="#090d16" stroke="#0ea5e9" strokeWidth="1" />
          <text x="40" y="30" fontSize="10" fontWeight="bold" fontFamily="monospace" fill="#38bdf8" textAnchor="middle">
            {measuredValue !== undefined ? `${measuredValue.toFixed(1)}V` : '12.0 V'}
          </text>

          {/* Adjustment Knobs */}
          <circle cx="22" cy="46" r="6" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          <line x1="22" y1="42" x2="22" y2="46" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
          <text x="22" y="58" fontSize="5.5" fill="#94a3b8" textAnchor="middle">VOLT</text>

          <circle cx="58" cy="46" r="6" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.5" />
          <line x1="58" y1="42" x2="58" y2="46" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
          <text x="58" y="58" fontSize="5.5" fill="#94a3b8" textAnchor="middle">AMP</text>

          {/* Banana Binding Posts */}
          <circle cx="32" cy="62" r="3.5" fill="#ef4444" stroke="#fff" strokeWidth="0.8" />
          <text x="32" y="57" fontSize="6" fontWeight="bold" fill="#ef4444" textAnchor="middle">+</text>

          <circle cx="48" cy="62" r="3.5" fill="#1e293b" stroke="#3b82f6" strokeWidth="1" />
          <text x="48" y="57" fontSize="6" fontWeight="bold" fill="#3b82f6" textAnchor="middle">-</text>

          {/* External connection leads */}
          <line x1="2" y1="40" x2="6" y2="40" stroke="#ef4444" strokeWidth="2.5" />
          <line x1="74" y1="40" x2="78" y2="40" stroke="#3b82f6" strokeWidth="2.5" />
        </svg>
      );

    case 'power_source_ac_3p':
      return (
        <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
          {/* Main 3-Phase Circle */}
          <circle cx="40" cy="40" r="26" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          
          {/* Three interlaced sine waves representing L1, L2, L3 */}
          <path d="M 24 35 Q 29 25 34 35 T 44 35" fill="none" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M 24 40 Q 29 30 34 40 T 44 40" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M 24 45 Q 29 35 34 45 T 44 45" fill="none" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />

          {/* 3~ 400V Text */}
          <text x="54" y="38" fontSize="8" fontWeight="bold" fill="#eab308">3~</text>
          <text x="54" y="48" fontSize="6" fontWeight="bold" fill={strokeColor}>400V</text>

          {/* Phase Lines (L1 Brown, L2 Black, L3 Grey) */}
          <line x1="40" y1="2" x2="40" y2="14" stroke="#b45309" strokeWidth="2" />
          <text x="32" y="10" fontSize="7" fontWeight="bold" fill="#b45309">L1</text>

          <line x1="10" y1="20" x2="20" y2="28" stroke="#1e293b" strokeWidth="2" />
          <text x="6" y="18" fontSize="7" fontWeight="bold" fill="#64748b">L2</text>

          <line x1="70" y1="20" x2="60" y2="28" stroke="#64748b" strokeWidth="2" />
          <text x="72" y="18" fontSize="7" fontWeight="bold" fill="#64748b">L3</text>

          {/* Neutral and Earth (Bottom) */}
          <line x1="30" y1="66" x2="30" y2="78" stroke="#2563eb" strokeWidth="2" />
          <text x="22" y="74" fontSize="7" fontWeight="bold" fill="#2563eb">N</text>

          <line x1="50" y1="66" x2="50" y2="78" stroke="#65a30d" strokeWidth="2" />
          <text x="54" y="74" fontSize="7" fontWeight="bold" fill="#65a30d">PE</text>
        </svg>
      );

    case 'junction_dot_electric':
      return (
        <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
          {/* Cross connecting lines */}
          <line x1="2" y1="40" x2="78" y2="40" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
          <line x1="40" y1="2" x2="40" y2="78" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
          
          {/* Solid conductive junction node (Wago/solder dot) */}
          <circle cx="40" cy="40" r="9" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="40" cy="40" r="4.5" fill="#f8fafc" />
        </svg>
      );

    case 'terminal_block_electric':
      return (
        <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
          {/* Clema body / DIN terminal */}
          <rect x="12" y="10" width="56" height="60" rx="4" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.8" />
          
          {/* Terminal 1 */}
          <rect x="16" y="14" width="48" height="11" rx="2" fill={fillColor} stroke={strokeColor} strokeWidth="1" />
          <circle cx="22" cy="19.5" r="3" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />
          <line x1="20" y1="19.5" x2="24" y2="19.5" stroke="#1e293b" strokeWidth="1" />
          <circle cx="58" cy="19.5" r="3" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />
          <text x="40" y="22" fontSize="7" fontWeight="bold" fill={strokeColor} textAnchor="middle">1 • 2</text>

          {/* Terminal 2 */}
          <rect x="16" y="28" width="48" height="11" rx="2" fill={fillColor} stroke={strokeColor} strokeWidth="1" />
          <circle cx="22" cy="33.5" r="3" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />
          <circle cx="58" cy="33.5" r="3" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />
          <text x="40" y="36" fontSize="7" fontWeight="bold" fill={strokeColor} textAnchor="middle">3 • 4</text>

          {/* Terminal 3 */}
          <rect x="16" y="42" width="48" height="11" rx="2" fill={fillColor} stroke={strokeColor} strokeWidth="1" />
          <circle cx="22" cy="47.5" r="3" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />
          <circle cx="58" cy="47.5" r="3" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />
          <text x="40" y="50" fontSize="7" fontWeight="bold" fill={strokeColor} textAnchor="middle">5 • 6</text>

          {/* Terminal 4 */}
          <rect x="16" y="56" width="48" height="11" rx="2" fill={fillColor} stroke={strokeColor} strokeWidth="1" />
          <circle cx="22" cy="61.5" r="3" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />
          <circle cx="58" cy="61.5" r="3" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />
          <text x="40" y="64" fontSize="7" fontWeight="bold" fill={strokeColor} textAnchor="middle">7 • 8</text>

          {/* External Wire leads */}
          <line x1="2" y1="40" x2="12" y2="40" stroke="#38bdf8" strokeWidth="2" />
          <line x1="68" y1="40" x2="78" y2="40" stroke="#38bdf8" strokeWidth="2" />
        </svg>
      );

    case 'connector_plug_socket':
      return (
        <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
          {/* Female Socket (Left) */}
          <rect x="10" y="24" width="22" height="32" rx="3" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.8" />
          <rect x="26" y="30" width="6" height="6" rx="1" fill="#0f172a" />
          <rect x="26" y="44" width="6" height="6" rx="1" fill="#0f172a" />
          
          {/* Male Plug (Right) */}
          <rect x="48" y="24" width="22" height="32" rx="3" fill={secondaryFill} stroke={strokeColor} strokeWidth="1.8" />
          {/* Pins entering */}
          <rect x="34" y="31" width="14" height="4" rx="1" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
          <rect x="34" y="45" width="14" height="4" rx="1" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />

          {/* Unplug / Disconnect arrow indicator */}
          <path d="M 41 16 L 35 19 L 41 22" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 40 64 L 46 61 L 40 58" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />

          {/* Terminal leads */}
          <line x1="2" y1="40" x2="10" y2="40" stroke="#ef4444" strokeWidth="2.5" />
          <line x1="70" y1="40" x2="78" y2="40" stroke="#3b82f6" strokeWidth="2.5" />
        </svg>
      );

    case 'neutral_terminal':
      return (
        <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
          {/* Blue Insulated mounting base */}
          <rect x="8" y="22" width="64" height="36" rx="5" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1.8" />
          
          {/* Brass conductor bar */}
          <rect x="14" y="30" width="52" height="20" rx="2" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
          
          {/* Neutral terminal screws */}
          <circle cx="22" cy="40" r="3.5" fill="#fef08a" stroke="#713f12" strokeWidth="1" />
          <circle cx="34" cy="40" r="3.5" fill="#fef08a" stroke="#713f12" strokeWidth="1" />
          <circle cx="46" cy="40" r="3.5" fill="#fef08a" stroke="#713f12" strokeWidth="1" />
          <circle cx="58" cy="40" r="3.5" fill="#fef08a" stroke="#713f12" strokeWidth="1" />
          
          <text x="40" y="20" fontSize="9" fontWeight="bold" fill="#60a5fa" textAnchor="middle">BARRA N</text>

          {/* Blue connection lines */}
          <line x1="2" y1="40" x2="8" y2="40" stroke="#2563eb" strokeWidth="3" />
          <line x1="72" y1="40" x2="78" y2="40" stroke="#2563eb" strokeWidth="3" />
          <line x1="40" y1="58" x2="40" y2="78" stroke="#2563eb" strokeWidth="3" />
        </svg>
      );

    case 'switch_disconnector':
      return (
        <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
          {/* Rotary handle housing */}
          <rect x="10" y="10" width="60" height="60" rx="8" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          
          {/* IEC Disconnector visible contact */}
          <circle cx="24" cy="40" r="3" fill={strokeColor} />
          <circle cx="56" cy="40" r="3" fill={strokeColor} />
          
          {isSwitchClosed ? (
            // Closed: knife blade connects straight with perpendicular disconnector bar
            <g>
              <line x1="24" y1="40" x2="56" y2="40" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
              <line x1="56" y1="34" x2="56" y2="46" stroke="#22c55e" strokeWidth="2.5" />
              <text x="40" y="26" fontSize="8" fontWeight="bold" fill="#22c55e" textAnchor="middle">I (ON)</text>
            </g>
          ) : (
            // Open: knife blade angled up showing visible physical isolation
            <g>
              <line x1="24" y1="40" x2="50" y2="24" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
              <line x1="48" y1="20" x2="54" y2="30" stroke="#ef4444" strokeWidth="2.5" />
              <text x="40" y="26" fontSize="8" fontWeight="bold" fill="#ef4444" textAnchor="middle">0 (OFF)</text>
            </g>
          )}

          {/* Rotary safety handle indicator */}
          <rect x="36" y="52" width="8" height="12" rx="2" fill={isSwitchClosed ? '#ef4444' : '#64748b'} stroke="#fff" strokeWidth="0.8" />
          <text x="40" y="62" fontSize="5.5" fontWeight="bold" fill="#fff" textAnchor="middle">Q0</text>

          {/* External Terminals */}
          <line x1="2" y1="40" x2="10" y2="40" stroke="#b45309" strokeWidth="2.5" />
          <line x1="70" y1="40" x2="78" y2="40" stroke="#b45309" strokeWidth="2.5" />
        </svg>
      );

    default:
      return (
        <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
          <rect x="15" y="15" width="50" height="50" rx="8" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <circle cx="40" cy="40" r="10" fill={accentColor} />
        </svg>
      );
  }
};
