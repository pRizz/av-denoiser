import { existsSync, readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";

/**
 * When the user mistypes a media filename (same Twitter-style `[id]` suffix, wrong punctuation),
 * looks for a unique sibling file in the same directory whose name contains that bracket segment.
 */
export function resolveDidYouMeanMediaPath(
  requestedPath: string,
): string | null {
  const dir = dirname(requestedPath);
  const base = basename(requestedPath);

  if (!existsSync(dir)) {
    return null;
  }

  const bracketMatch = base.match(/\[\d+]/);
  if (bracketMatch === null) {
    return null;
  }

  const idBracket = bracketMatch[0];
  if (idBracket === undefined) {
    return null;
  }

  try {
    const names = readdirSync(dir);
    const hits = names.filter((n) => n.includes(idBracket));

    if (hits.length === 1) {
      const only = hits[0];
      if (only === undefined) {
        return null;
      }

      return join(dir, only);
    }

    if (hits.length > 1) {
      return hits
        .slice(0, 3)
        .map((h) => join(dir, h))
        .join("; ");
    }
  } catch {
    return null;
  }

  return null;
}
