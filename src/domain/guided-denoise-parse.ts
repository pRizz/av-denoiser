/** Validates guided noise strength — same bounds as CLI `parseNoiseStrength`. */
export function parseGuidedNoiseStrength(raw: string): number | null {
  const value = Number.parseFloat(raw.trim());

  if (!Number.isFinite(value) || value < 0 || value > 1) {
    return null;
  }

  return value;
}
