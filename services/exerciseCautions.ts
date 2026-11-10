/** Conserve les précautions utiles sans répéter une note identique. */
export function exerciseCautions(general: string, specific?: string): string[] {
  const seen = new Set<string>();
  return [general, specific].filter((text): text is string => {
    if (!text?.trim()) return false;
    const key = text.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
