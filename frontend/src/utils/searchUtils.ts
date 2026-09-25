/**
 * Normaliza cadenas de texto para búsqueda difusa (Fuzzy / Smart Search).
 * Elimina acentos, mayúsculas, espacios, guiones, puntos y homogeniza '0' por 'o'.
 */
export function normalizeForSearch(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina tildes y diacríticos
    .replace(/0/g, 'o')              // Homogeniza 0 por o (ej: s0-14 -> so-14)
    .replace(/[\s\-_.,/]+/g, '');    // Elimina espacios, guiones, puntos, comas, barras
}

/**
 * Normalización secundaria que preserva números para búsquedas literales de códigos.
 */
export function normalizeLiteralSearch(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s\-_.,/]+/g, '');
}

export interface SearchableItem {
  weaponName?: string;
  nombre?: string;
  className?: string;
  clase?: string;
  categoria?: string;
  submodeName?: string;
  submodo?: string;
  codes?: Array<{ codigo?: string; [key: string]: any } | string>;
  codigos?: Array<{ codigo?: string; [key: string]: any } | string>;
  [key: string]: any;
}

/**
 * Evalúa si un elemento coincide con la consulta de búsqueda inteligente.
 * Soporta búsqueda continua por subcadena, equivalencias 0/O y búsqueda por tokens.
 */
export function matchesSearch(query: string, item: SearchableItem): boolean {
  if (!query || !query.trim()) return true;
  if (!item) return false;

  const rawQuery = query.trim();
  const normQuery = normalizeForSearch(rawQuery);
  const literalQuery = normalizeLiteralSearch(rawQuery);

  if (!normQuery && !literalQuery) return true;

  // Extraer todos los campos buscables del elemento
  const weaponName = item.weaponName || item.nombre || '';
  const className = item.className || item.clase || item.categoria || '';
  const submodeName = item.submodeName || item.submodo || '';

  const rawCodes = item.codes || item.codigos || [];
  const codeStrings: string[] = rawCodes.map(c => {
    if (typeof c === 'string') return c;
    return c?.codigo || '';
  }).filter(Boolean);

  // Lista de textos objetivos
  const targetTexts = [weaponName, className, submodeName, ...codeStrings].filter(Boolean);

  // Formas normalizadas de los objetivos
  const normalizedTargets = targetTexts.map(t => normalizeForSearch(t));
  const literalTargets = targetTexts.map(t => normalizeLiteralSearch(t));

  // 1. Coincidencia directa de la consulta completa
  const matchesDirect = normalizedTargets.some(t => t.includes(normQuery)) ||
    literalTargets.some(t => t.includes(literalQuery));

  if (matchesDirect) return true;

  // 2. Coincidencia por tokens (palabras clave separadas por espacio)
  const tokens = rawQuery.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    const allTokensMatch = tokens.every(token => {
      const normToken = normalizeForSearch(token);
      const litToken = normalizeLiteralSearch(token);
      return normalizedTargets.some(t => t.includes(normToken)) ||
        literalTargets.some(t => t.includes(litToken));
    });

    if (allTokensMatch) return true;
  }

  return false;
}
