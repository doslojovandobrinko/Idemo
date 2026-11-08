/**
 * IDEMO Serbia — Multi-Country Destination Isolation Guard
 *
 * Ensures that when multiple national IDEMO applications (Serbia, Montenegro,
 * Croatia, North Macedonia, Bulgaria, etc.) share a single Supabase backend or
 * OneSignal project, foreign destination rows (recommendations, editorial
 * collections, partners, and service areas) can never bleed into IDEMO Serbia.
 */

export const ACTIVE_DESTINATION_ID = 'serbia';

/** Valid destination_id / country_code identifiers for IDEMO Serbia */
const SERBIA_IDENTIFIERS = new Set([
  'serbia',
  'srbija',
  'rs',
  'srb',
  'idemo-serbia',
  'idemo_serbia',
]);

/**
 * Prefixes used on source_id, collection id, or partner public_code
 * by other IDEMO country instances (Montenegro, Croatia, Macedonia, Bulgaria, etc.)
 */
const FOREIGN_ID_PREFIX_REGEX =
  /^(mne|me|cg|hr|cro|hrv|mk|mkd|mac|bg|bgr|bul|ba|bih|si|svn|slo|al|alb|gr|grc|ro|rou|hu|hun)[-_]/i;

/**
 * Explicit geographic, regional, and city markers for non-Serbia IDEMO destinations:
 * - Montenegro (ME / MNE / Crna Gora)
 * - Croatia (HR / CRO / Hrvatska)
 * - North Macedonia (MK / MKD / Severna Makedonija)
 * - Bulgaria (BG / BGR / България)
 * - Adjacent regional destinations
 */
const FOREIGN_GEOGRAPHIC_MARKERS: readonly string[] = [
  // Montenegro
  'montenegro',
  'crna gora',
  'kotor',
  'budva',
  'tivat',
  'podgorica',
  'herceg novi',
  'durmitor',
  'lovćen',
  'lovcen',
  'boka kotorska',
  'perast',
  'sveti stefan',
  'ulcinj',
  'cetinje',
  'ostrog',
  'skadar',
  'žabljak',
  'zabljak',
  'kolašin',
  'kolasin',

  // Croatia
  'croatia',
  'hrvatska',
  'zagreb',
  'dubrovnik',
  'split',
  'zadar',
  'rijeka',
  'rovinj',
  'pula',
  'istra',
  'istria',
  'dalmatia',
  'dalmacija',
  'hvar',
  'korčula',
  'korcula',
  'brač',
  'brac',
  'plitvice',
  'plitvička',
  'plitvicka',
  'šibenik',
  'sibenik',
  'trogir',
  'opatija',
  'makarska',
  'pelješac',
  'peljesac',
  'motovun',

  // North Macedonia
  'macedonia',
  'north macedonia',
  'makedonija',
  'severna makedonija',
  'skopje',
  'ohrid',
  'bitola',
  'kruševo',
  'krusevo',
  'mavrovo',
  'kanjon matka',
  'canyon matka',
  'tikveš',
  'tikves',
  'strumica',
  'tetovo',
  'prilep',
  'dojran',
  'prespa',
  'stobi',
  'galičnik',
  'galicnik',

  // Bulgaria
  'bulgaria',
  'blgarija',
  'българия',
  'sofia',
  'plovdiv',
  'varna',
  'burgas',
  'bansko',
  'rila monastery',
  'rila lakes',
  'veliko tarnovo',
  'veliko trnovo',
  'nessebar',
  'nesebar',
  'sozopol',
  'borovets',
  'borovec',
  'pirin',
  'rhodope',
  'rodopi',
  'koprivshtitsa',
  'melnik',
  'belogradchik',
  'buzludzha',

  // Other adjacent non-Serbia countries
  'slovenia',
  'slovenija',
  'ljubljana',
  'albania',
  'shqipëria',
  'tirana',
];

/**
 * Checks whether an explicit destination/country field belongs to a foreign destination.
 * Returns:
 * - `true` if explicitly Serbia (`serbia`, `rs`, `srb`, `srbija`)
 * - `false` if explicitly another destination (`montenegro`, `croatia`, `macedonia`, `bulgaria`, `me`, `hr`, `mk`, `bg`, etc.)
 * - `null` if no explicit destination/country field is populated on the row
 */
export function checkExplicitSerbiaDestination(row: Record<string, any>): boolean | null {
  const rawDest = String(
    row.destination_id ||
      row.destination ||
      row.country_code ||
      row.country ||
      row.country_id ||
      ''
  )
    .trim()
    .toLowerCase();

  if (!rawDest) return null;
  return SERBIA_IDENTIFIERS.has(rawDest);
}

/**
 * Returns true if an ID or code carries a foreign country prefix
 * (e.g., `MNE-001`, `HR-012`, `MK-005`, `BG-008`).
 */
export function hasForeignDestinationIdPrefix(idOrCode: string | null | undefined): boolean {
  if (!idOrCode) return false;
  return FOREIGN_ID_PREFIX_REGEX.test(String(idOrCode).trim());
}

/**
 * Returns true if a text string (such as location, geographic_scope, or region)
 * contains any foreign destination marker (Montenegro, Croatia, Macedonia, Bulgaria, etc.).
 */
export function containsForeignGeographicMarker(text: string | null | undefined): boolean {
  if (!text) return false;
  const normalized = String(text).toLowerCase();
  return FOREIGN_GEOGRAPHIC_MARKERS.some((marker) => {
    // Use word-boundary-aware check for short tokens like "split" or "sofia" to avoid false positives
    const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-zčćžšđа-я])${escaped}($|[^a-zčćžšđа-я])`, 'i');
    return regex.test(normalized);
  });
}

/**
 * Evaluates whether a dynamic Supabase record (recommendation, editorial collection,
 * or partner) belongs to IDEMO Serbia.
 *
 * @param row Raw Supabase row object
 * @param options.isKnownCanonicalSerbiaRecord True if the record ID exists in IDEMO Serbia's static baseline
 * @param options.idCandidates ID / code strings to check for foreign country prefixes
 * @param options.textCandidates Location / region / scope strings to inspect for foreign geography
 */
export function isSerbiaDestinationRecord(
  row: Record<string, any>,
  options: {
    isKnownCanonicalSerbiaRecord?: boolean;
    idCandidates?: Array<string | null | undefined>;
    textCandidates?: Array<string | null | undefined>;
  } = {}
): boolean {
  // 1. Canonical Serbia static baseline items are always trusted
  if (options.isKnownCanonicalSerbiaRecord) {
    return true;
  }

  // 2. If the row has an explicit destination_id / country_code, enforce Serbia match
  const explicitMatch = checkExplicitSerbiaDestination(row);
  if (explicitMatch === false) {
    return false;
  }

  // 3. Check ID / code prefixes (MNE-, HR-, MK-, BG-, etc.)
  if (options.idCandidates?.some((id) => hasForeignDestinationIdPrefix(id))) {
    return false;
  }

  // 4. Check location / region / title text for foreign destination markers
  if (options.textCandidates?.some((txt) => containsForeignGeographicMarker(txt))) {
    return false;
  }

  return true;
}

/**
 * Evaluates whether a `service_areas` row in Supabase belongs to a foreign
 * IDEMO destination (Montenegro, Croatia, Macedonia, Bulgaria, etc.).
 */
export function isForeignServiceAreaRow(row: Record<string, any>): boolean {
  const explicitMatch = checkExplicitSerbiaDestination(row);
  if (explicitMatch === false) return true;
  if (explicitMatch === true) return false;

  const code = String(row.country_code || row.code || row.slug || '').trim().toUpperCase();
  if (
    [
      'ME', 'MNE', 'CG',
      'HR', 'CRO', 'HRV',
      'MK', 'MKD', 'MAC',
      'BG', 'BGR', 'BUL',
      'BA', 'BIH', 'SI', 'SVN', 'AL', 'ALB',
    ].includes(code)
  ) {
    return true;
  }

  const label = `${row.name || ''} ${row.slug || ''} ${row.title || ''} ${row.region || ''}`;
  return containsForeignGeographicMarker(label);
}

/**
 * Evaluates whether a `service_areas` row in Supabase explicitly matches Serbia.
 */
export function isSerbiaServiceAreaRow(row: Record<string, any>): boolean {
  if (checkExplicitSerbiaDestination(row) === true) return true;
  const code = String(row.country_code || row.code || '').trim().toUpperCase();
  if (code === 'RS' || code === 'SRB') return true;
  const label = `${row.name || ''} ${row.slug || ''} ${row.title || ''}`.toLowerCase();
  return (
    label.includes('serbia') ||
    label.includes('srbija') ||
    label.includes('belgrade') ||
    label.includes('beograd') ||
    label.includes('vojvodina') ||
    label.includes('šumadija') ||
    label.includes('sumadija')
  );
}
