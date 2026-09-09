/**
 * Utility formatters for thermodynamic properties and diagram values.
 */

function toSuperscript(str: string): string {
  const map: Record<string, string> = {
    '-': '⁻',
    '+': '⁺',
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
  };
  return str.split('').map((c) => map[c] || c).join('');
}

/**
 * Formats specific volume (v). When the value is small (typical for liquid phase),
 * it expresses it in scientific notation (e.g., 8.50 × 10⁻⁴ m³/kg).
 *
 * @param v Specific volume in m³/kg
 * @returns Object with display text, status flags, and tooltip text
 */
export function formatSpecificVolume(v: number | undefined | null): {
  display: string;
  isLog: boolean;
  isSci: boolean;
  tooltip: string;
} {
  if (v === undefined || v === null || isNaN(v) || v <= 0) {
    return { display: '—', isLog: false, isSci: false, tooltip: 'No disponible' };
  }

  const exactFormatted = `${v.toFixed(6)} m³/kg`;

  if (v < 0.01) {
    const parts = v.toExponential(2).split('e');
    const mantissa = parts[0];
    const exp = parseInt(parts[1], 10);
    const superExp = toSuperscript(String(exp));

    return {
      display: `${mantissa} × 10${superExp} m³/kg`,
      isLog: false,
      isSci: true,
      tooltip: `v = ${exactFormatted} (${mantissa}e${exp} m³/kg)`,
    };
  }

  return {
    display: `${v.toFixed(4)} m³/kg`,
    isLog: false,
    isSci: false,
    tooltip: `v = ${exactFormatted}`,
  };
}
