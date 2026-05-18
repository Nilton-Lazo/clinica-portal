export function parseTailwindWidth(className?: string): number | undefined {
  if (!className) return undefined;
  const unitMatch = className.match(/\bw-(\d+(?:\.\d+)?)\b/);
  if (unitMatch) return Math.round(Number(unitMatch[1]) * 4);
  const pxMatch = className.match(/\b(?:min-w-|max-w-|w-)\[(\d+)px\]/);
  if (pxMatch) return Number(pxMatch[1]);
  return undefined;
}
