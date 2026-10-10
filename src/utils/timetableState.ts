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

export const DEMO_HASH =
  '#志度・三本松・徳島方面|坂出・観音寺・松山・高知方面|岡山・東京方面#4:::35快[岡];5:39[徳]:17特[松],42注[琴]:35快[岡];6:10特[徳],21[引],41[徳]:00特[松],04特[中],12[琴],53[観]:08快[岡],46快[岡];7:05特[徳],17[引],51[オ]:10注[琴],37特[松],40[観],55[琴]:08快[岡],48快[岡];8:24特[徳],33[引]:15注[琴],25特[高],45特[松],57[琴]:22快[岡],55快[岡];9:10特[徳],42[引]:04快[観],25[琴],42特[松]:23快[岡],52快[岡];10:10特[徳],14[オ],42[引]:13快[観],25[琴],47特[松],52[多]:10快[岡],40快[岡];11:10特[徳],42[徳]:13快[観],25[琴],50特[松]:10快[岡],40快[岡];12:10特[徳],14[オ],42[三]:13快[観],25[琴],50特[松],52[多]:10快[岡],40快[岡];13:10特[徳],42[引]:13快[観],25[琴],50特[松]:10快[岡],40快[岡];14:10特[徳],14[オ],42[引]:13快[観],25[琴],50特[松],52[観]:10快[岡],40快[岡];15:10特[徳],42[徳]:13快[観],25[琴],50特[松],52[多]:10快[岡],40快[岡];16:10特[徳],14[オ],42[引]:13快[観],25[琴],50特[松],52[観]:10快[岡],40快[岡];17:10特[徳],42[徳]:13快[観],25[琴],53特[松],56快注[観],58[琴]:10快[岡],40快[岡];18:10特[徳],14[引],42[三]:13快[観],25[琴],52[観],59特[松]:10快[岡],40快[岡];19:10特[徳],14[引],42[引]:13快[琴],25[多],51特[松],53[琴]:10快[岡],40快[岡];20:10特[徳],14[オ],42[徳]:13快[観],25[琴],52[西],59特[松]:10快[岡],43快[岡];21:14特[徳],42[引]:20[琴],45快[観]:13快[岡],26寝[東],43快[岡];22:22特[徳],50[オ]:08[琴],20特[西],34[観]:27快[岡];23::33[多]:#特:%23ff0000:特急,注:%23ffff00:運転日注意,快:%230080ff:快速,快注:%230080c0:快速（運転日注意）,寝:%23ff00ff:寝台特急#徳:徳島,引:引田,オ:オレンジタウン,三:三本松,松:松山,琴:琴平,中:中村,観:観音寺,高:高知,多:多度津,西:伊予西条,岡:岡山,東:東京';

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

export function parseHash(hash: string): {
  headers: string[];
  rows: TimetableRow[];
  trainTypes: TrainType[];
  destinations: Destination[];
} {
  const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
  let hashParts = cleanHash.split('#');

  // If there's no timetable part, check whether the single fragment looks like a timetable (e.g., starts with an hour).
  // In that case, treat it as an empty headers part and the fragment as the timetable. Otherwise fallback to defaults.
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

        const parsed = group.split(',')
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
    const minuteGroupsStr = row.minutes.map(m => m.map(min => encodeURIComponent(min)).join(',')).join(':');
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
