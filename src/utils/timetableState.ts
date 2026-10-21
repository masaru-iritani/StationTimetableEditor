export interface TimetableRow {
  hour: number;
  minutes: string[][]; // Array of string arrays for each route column
}

export interface TrainType {
  char: string;
  color: string;
  description?: string;
}

export interface Destination {
  char: string;
  description?: string;
}

// ── Crockford Base32 helpers (for train type / destination indices) ──────────

/** Crockford Base32 encoding alphabet (values 0–31). */
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Encode an integer 0–31 to a single Crockford Base32 character.
 * Values outside the range are clamped.
 */
function encodeB32(n: number): string {
  return B32[Math.max(0, Math.min(31, n))];
}

/**
 * Decode a single Crockford Base32 character to an integer 0–31.
 * Returns -1 for unrecognised characters.
 * Applies Crockford's transcription alternatives: I/L → 1, O → 0, U → V.
 */
function decodeB32(c: string): number {
  const ch = c.toUpperCase()
    .replace('I', '1').replace('L', '1').replace('O', '0').replace('U', 'V');
  return B32.indexOf(ch);
}

// ── Compact departure encoding ────────────────────────────────────────────────

/**
 * Serialize one departure to the compact hash representation.
 *
 * Format:  MM T D   (4 chars, no separator)  — when both T and D are non-zero.
 *          MM T ,   (3 chars + comma)         — when only T is non-zero.
 *          MM ,     (2 chars + comma)          — when neither T nor D is specified.
 *
 * MM = 2 decimal-digit minutes (00–59).
 * T  = Crockford Base32 train-type index  (0 = unspecified, 1–31 = element 0–30).
 * D  = Crockford Base32 destination index (0 = unspecified, 1–31 = element 0–30).
 */
function serializeDepartureCompact(
  minute: string,
  trainTypeChar: string,
  destinationChar: string,
  trainTypes: TrainType[],
  destinations: Destination[]
): string {
  const mm = String(parseInt(minute, 10) || 0).padStart(2, '0');
  const rawTIdx = trainTypeChar
    ? trainTypes.findIndex(t => t.char === trainTypeChar) + 1
    : 0;
  const rawDIdx = destinationChar
    ? destinations.findIndex(d => d.char === destinationChar) + 1
    : 0;
  const tIdx = rawTIdx > 0 ? Math.min(31, rawTIdx) : 0;
  const dIdx = rawDIdx > 0 ? Math.min(31, rawDIdx) : 0;

  if (dIdx !== 0) {
    return mm + encodeB32(tIdx) + encodeB32(dIdx);
  } else if (tIdx !== 0) {
    return mm + encodeB32(tIdx) + ',';
  } else {
    return mm + ',';
  }
}

/**
 * Parse a compact-encoded column group string into internal departure strings.
 *
 * Departures are concatenated without a fixed separator. Each departure is:
 *   MM [T [D]] [,]
 * where MM = 2 decimal digits, T and D are optional Crockford Base32 chars,
 * and a trailing comma marks an abbreviated entry (T or D omitted).
 * A comma is also consumed between full-length entries if present (lenient).
 */
function parseCompactColumnGroup(
  s: string,
  trainTypes: TrainType[],
  destinations: Destination[]
): string[] {
  const departures: string[] = [];
  let pos = 0;

  while (pos < s.length) {
    // Need at least 2 chars for MM
    if (pos + 1 >= s.length) break;

    const mmStr = s.slice(pos, pos + 2);
    if (!/^\d{2}$/.test(mmStr)) break; // not two decimal digits — stop
    const minute = parseInt(mmStr, 10);
    if (minute < 0 || minute >= 60) break;
    pos += 2;

    let tIdx = 0;
    let dIdx = 0;

    if (pos < s.length && s[pos] !== ',') {
      // Read T
      const t = decodeB32(s[pos]);
      tIdx = t >= 0 ? t : 0;
      pos++;

      if (pos < s.length && s[pos] !== ',') {
        // Read D
        const d = decodeB32(s[pos]);
        dIdx = d >= 0 ? d : 0;
        pos++;
        // Consume optional trailing comma (lenient)
        if (pos < s.length && s[pos] === ',') pos++;
      } else if (pos < s.length /* s[pos] === ',' */) {
        pos++; // consume comma
      }
    } else if (pos < s.length /* s[pos] === ',' */) {
      pos++; // consume comma
    }

    const tChar = tIdx > 0 && tIdx <= trainTypes.length ? trainTypes[tIdx - 1].char : '';
    const dChar = dIdx > 0 && dIdx <= destinations.length ? destinations[dIdx - 1].char : '';
    departures.push(formatDeparture(mmStr, tChar, dChar));
  }

  return departures;
}

// ── DEMO_HASH ─────────────────────────────────────────────────────────────────

export const DEMO_HASH =
  '#%E5%BF%97%E5%BA%A6%E3%83%BB%E4%B8%89%E6%9C%AC%E6%9D%BE%E3%83%BB%E5%BE%B3%E5%B3%B6%E6%96%B9%E9%9D%A2|%E5%9D%82%E5%87%BA%E3%83%BB%E8%A6%B3%E9%9F%B3%E5%AF%BA%E3%83%BB%E6%9D%BE%E5%B1%B1%E3%83%BB%E9%AB%98%E7%9F%A5%E6%96%B9%E9%9D%A2|%E5%B2%A1%E5%B1%B1%E3%83%BB%E6%9D%B1%E4%BA%AC%E6%96%B9%E9%9D%A2#4:::353C;5:3901:17154226:353C;6:101121024101:0015041712065308:083C463C;7:051117025103:1026371540085506:083C483C;8:24113302:1526251945155706:223C553C;9:10114202:043825064215:233C523C;10:101114034202:133825064715520A:103C403C;11:10114201:133825065015:103C403C;12:101114034204:133825065015520A:103C403C;13:10114202:133825065015:103C403C;14:101114034202:1338250650155208:103C403C;15:10114201:133825065015520A:103C403C;16:101114034202:1338250650155208:103C403C;17:10114201:13382506531556485806:103C403C;18:101114024204:1338250652085915:103C403C;19:101114024202:1336250A51155306:103C403C;20:101114034201:13382506520B5915:103C433C;21:14114202:20064538:133C265D433C;22:22115003:0806201B3408:273C;23::330A:#%E7%89%B9:%23ff0000:%E7%89%B9%E6%80%A5,%E6%B3%A8:%23ffff00:%E9%81%8B%E8%BB%A2%E6%97%A5%E6%B3%A8%E6%84%8F,%E5%BF%AB:%230080ff:%E5%BF%AB%E9%80%9F,%E5%BF%AB%E6%B3%A8:%230080c0:%E5%BF%AB%E9%80%9F%EF%BC%88%E9%81%8B%E8%BB%A2%E6%97%A5%E6%B3%A8%E6%84%8F%EF%BC%89,%E5%AF%9D:%23ff00ff:%E5%AF%9D%E5%8F%B0%E7%89%B9%E6%80%A5#%E5%BE%B3:%E5%BE%B3%E5%B3%B6,%E5%BC%95:%E5%BC%95%E7%94%B0,%E3%82%AA:%E3%82%AA%E3%83%AC%E3%83%B3%E3%82%B8%E3%82%BF%E3%82%A6%E3%83%B3,%E4%B8%89:%E4%B8%89%E6%9C%AC%E6%9D%BE,%E6%9D%BE:%E6%9D%BE%E5%B1%B1,%E7%90%B4:%E7%90%B4%E5%B9%B3,%E4%B8%AD:%E4%B8%AD%E6%9D%91,%E8%A6%B3:%E8%A6%B3%E9%9F%B3%E5%AF%BA,%E9%AB%98:%E9%AB%98%E7%9F%A5,%E5%A4%9A:%E5%A4%9A%E5%BA%A6%E6%B4%A5,%E8%A5%BF:%E4%BC%8A%E4%BA%88%E8%A5%BF%E6%9D%A1,%E5%B2%A1:%E5%B2%A1%E5%B1%B1,%E6%9D%B1:%E6%9D%B1%E4%BA%AC';

// ── Internal departure format helpers ─────────────────────────────────────────

export function parseDeparture(
  raw: string,
  trainTypes: TrainType[] = [],
  destinations: Destination[] = []
): { minute: string; trainType: string; destination: string } {
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    /* ignore malformed encoding */
  }
  const baseMatch = decoded.match(/^(\d+)(.*)$/);
  if (!baseMatch) {
    return { minute: '', trainType: '', destination: '' };
  }
  const minute = baseMatch[1].padStart(2, '0');
  const rest = baseMatch[2];

  // Check bracket notation: e.g. "特[高]" or "[高]"
  const bracketMatch = rest.match(/^(.*)\[([^\]]+)\]$/);
  if (bracketMatch) {
    return {
      minute,
      trainType: bracketMatch[1],
      destination: bracketMatch[2],
    };
  }

  // If no brackets, check if rest matches a destination or train type
  if (rest) {
    const isDest = destinations.some((d) => d.char === rest);
    const isType = trainTypes.some((t) => t.char === rest);
    if (isDest && !isType) {
      return { minute, trainType: '', destination: rest };
    }
    return { minute, trainType: rest, destination: '' };
  }

  return { minute, trainType: '', destination: '' };
}

export function formatDeparture(
  minute: string | number,
  trainType?: string,
  destination?: string
): string {
  const numStr = String(minute).padStart(2, '0');
  const tStr = trainType || '';
  const dStr = destination ? `[${destination}]` : '';
  return `${numStr}${tStr}${dStr}`;
}

export function getDefaultRows(colCount: number): TimetableRow[] {
  const rows: TimetableRow[] = [];
  for (let h = 6; h <= 24; h++) {
    const minutes: string[][] = [];
    for (let c = 0; c < colCount; c++) {
      minutes.push([]);
    }
    rows.push({ hour: h, minutes });
  }
  return rows;
}

// ── Hash parsing and serialization ────────────────────────────────────────────

export function parseHash(hash: string): {
  headers: string[];
  rows: TimetableRow[];
  trainTypes: TrainType[];
  destinations: Destination[];
} {
  const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
  let hashParts = cleanHash.split('#');

  // If there's no timetable part, check whether the single fragment looks like
  // a timetable (e.g., starts with an hour). In that case, treat it as an empty
  // headers part and the fragment as the timetable. Otherwise fallback to defaults.
  if (hashParts.length < 2) {
    const possibleTimetable = cleanHash;
    if (possibleTimetable !== '' && (/^\d+:/.test(possibleTimetable) || (/;/.test(possibleTimetable) && /\d:/.test(possibleTimetable)))) {
      // Represent as ['', timetableStr]
      hashParts = ['', possibleTimetable];
    } else {
      return { headers: ['Route 1'], rows: getDefaultRows(1), trainTypes: [], destinations: [] };
    }
  }

  const headers = hashParts[0].split('|').map(text => {
    try {
      return decodeURIComponent(text);
    } catch {
      return text;
    }
  });

  const timetableStr = hashParts[1];

  // Parse train types FIRST — needed to decode the compact timetable section.
  const trainTypes: TrainType[] = [];
  if (hashParts.length >= 3) {
    const typesStr = hashParts[2];
    if (typesStr) {
      const types = typesStr.split(',').map(t => {
        const [charEnc, colorEnc, descEnc] = t.split(':');
        try {
          const res: TrainType = {
            char: decodeURIComponent(charEnc),
            color: decodeURIComponent(colorEnc)
          };
          if (descEnc) {
            res.description = decodeURIComponent(descEnc);
          }
          return res;
        } catch {
          return null;
        }
      }).filter((t): t is TrainType => t !== null);
      trainTypes.push(...types);
    }
  }

  // Parse destinations FIRST — needed to decode the compact timetable section.
  const destinations: Destination[] = [];
  if (hashParts.length >= 4) {
    const destsStr = hashParts[3];
    if (destsStr) {
      const dests = destsStr.split(',').map(d => {
        const [charEnc, descEnc] = d.split(':');
        try {
          const res: Destination = {
            char: decodeURIComponent(charEnc),
          };
          if (descEnc) {
            res.description = decodeURIComponent(descEnc);
          }
          return res;
        } catch {
          return null;
        }
      }).filter((d): d is Destination => d !== null);
      destinations.push(...dests);
    }
  }

  // Detect timetable format.
  // Old format uses non-ASCII characters or bracket notation "[dest]".
  // New compact format uses only ASCII digits, A–Z, and commas.
  const isOldFormat = timetableStr ? /[^\x00-\x7F]|\[|\]/.test(timetableStr) : false;

  // Build a map of hour -> minutes arrays so duplicate hours are merged
  const rowsMap = new Map<number, string[][]>();

  if (timetableStr) {
    const entries = timetableStr.split(';').filter(Boolean);
    entries.forEach(entry => {
      const [hourStr, ...minutesGroups] = entry.split(':');
      const hour = parseInt(hourStr, 10);
      if (isNaN(hour)) return;

      const minutes = minutesGroups.map(group => {
        if (!group) return [];

        let parsed: string[];
        if (isOldFormat) {
          // Legacy format: comma-separated "digits[type][dest]" entries.
          parsed = group.split(',')
            .map(m => m.trim())
            .filter(Boolean)
            .map(min => {
              let decoded = min;
              try { decoded = decodeURIComponent(min); } catch { /* ignore malformed encoding */ }
              const match = decoded.match(/^(\d+)(.*)$/);
              if (!match) return null;
              const num = parseInt(match[1], 10);
              if (num < 0 || num >= 60) return null;
              return num.toString().padStart(2, '0') + match[2];
            })
            .filter((m): m is string => m !== null);
        } else {
          // New compact format.
          parsed = parseCompactColumnGroup(group, trainTypes, destinations);
        }

        // Deduplicate and sort this minute group
        const unique = Array.from(new Set(parsed));
        unique.sort((a, b) => parseInt(a, 10) - parseInt(b, 10) || a.localeCompare(b));
        return unique;
      });

      if (!rowsMap.has(hour)) {
        rowsMap.set(hour, minutes as string[][]);
      } else {
        const existing = rowsMap.get(hour)!;
        const maxCols = Math.max(existing.length, minutes.length);
        for (let i = 0; i < maxCols; i++) {
          const a = existing[i] ?? [];
          const b = minutes[i] ?? [];
          const merged = Array.from(new Set([...a, ...b]));
          merged.sort((x, y) => parseInt(x, 10) - parseInt(y, 10) || x.localeCompare(y));
          existing[i] = merged;
        }
        rowsMap.set(hour, existing);
      }
    });
  }

  // Convert map to rows array
  const rows: TimetableRow[] = Array.from(rowsMap.entries()).map(([hour, minutes]) => ({ hour, minutes }));

  // If no rows were parsed:
  // - If timetableStr is an empty string, the author intentionally set an empty timetable; preserve no rows.
  // - If timetableStr was non-empty but parsing produced no valid rows, treat as malformed and fall back to defaults.
  if (rows.length === 0) {
    if (timetableStr === '') {
      // intentionally empty timetable: keep rows empty
    } else {
      rows.push(...getDefaultRows(headers.length));
    }
  }

  // Ensure every row has the same number of columns as the headers!
  const colCount = headers.length;
  rows.forEach(row => {
    while (row.minutes.length < colCount) {
      row.minutes.push([]);
    }
    if (row.minutes.length > colCount) {
      row.minutes = row.minutes.slice(0, colCount);
    }
  });

  // Sort rows by hour ascending
  rows.sort((a, b) => a.hour - b.hour);

  return { headers, rows, trainTypes, destinations };
}

export function serializeHash(
  headers: string[],
  rows: TimetableRow[],
  trainTypes: TrainType[] = [],
  destinations: Destination[] = []
): string {
  const headersPart = headers.map(h => encodeURIComponent(h)).join('|');
  const sortedRows = [...rows].sort((a, b) => a.hour - b.hour);
  const timetablePart = sortedRows.map(row => {
    const minuteGroupsStr = row.minutes.map(mins =>
      mins.map(dep => {
        const { minute, trainType, destination } = parseDeparture(dep, trainTypes, destinations);
        return serializeDepartureCompact(minute, trainType, destination, trainTypes, destinations);
      }).join('')
    ).join(':');
    return `${row.hour}:${minuteGroupsStr}`;
  }).join(';');

  const typesPart = trainTypes.map(t => {
    let base = `${encodeURIComponent(t.char)}:${encodeURIComponent(t.color)}`;
    if (t.description) {
      base += `:${encodeURIComponent(t.description)}`;
    }
    return base;
  }).join(',');

  const destsPart = destinations.map(d => {
    let base = encodeURIComponent(d.char);
    if (d.description) {
      base += `:${encodeURIComponent(d.description)}`;
    }
    return base;
  }).join(',');

  if (destsPart) {
    return `${headersPart}#${timetablePart}#${typesPart}#${destsPart}`;
  }
  return typesPart ? `${headersPart}#${timetablePart}#${typesPart}` : `${headersPart}#${timetablePart}`;
}
