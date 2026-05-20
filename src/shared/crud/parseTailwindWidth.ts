export function parseTailwindWidth(className?: string): number | undefined {
  if (!className) return undefined;
  const unitMatch = className.match(/(?:^|\s)w-(\d+(?:\.\d+)?)\b/);
  if (unitMatch) {
    const value = Math.round(Number(unitMatch[1]) * 4);
    return value > 0 ? value : undefined;
  }
  const pxMatch = className.match(/(?:^|\s)w-\[(\d+)px\]/);
  if (pxMatch) {
    const value = Number(pxMatch[1]);
    return value > 0 ? value : undefined;
  }
  return undefined;
}
