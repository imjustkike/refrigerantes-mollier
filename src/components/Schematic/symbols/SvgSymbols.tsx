import React from 'react';
import { SchematicComponentType } from '../../../types/schematic';

interface SvgSymbolProps {
  type: SchematicComponentType;
  width?: number;
  height?: number;
  isSelected?: boolean;
  isEnergized?: boolean;
  color?: string;
  themeMode?: 'dark' | 'light';
}

export const SvgSymbol: React.FC<SvgSymbolProps> = ({
  type,
  width = 80,
  height = 80,
  isSelected = false,
  isEnergized = false,
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

    default:
      return (
        <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
          <rect x="15" y="15" width="50" height="50" rx="8" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <circle cx="40" cy="40" r="10" fill={accentColor} />
        </svg>
      );
  }
};
