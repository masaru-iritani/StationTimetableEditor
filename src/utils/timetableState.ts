export interface TimetableRow {
  hour: number;
  minutes: string[][]; // Array of string arrays for each route column
}

export interface TrainType {
  char: string;
  color: string;
  description?: string;
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

export function parseHash(hash: string): { headers: string[]; rows: TimetableRow[]; trainTypes: TrainType[] } {
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
      return { headers: [''], rows: getDefaultRows(1), trainTypes: [] };
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
        unique.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
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
          merged.sort((x, y) => parseInt(x, 10) - parseInt(y, 10));
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

  return { headers, rows, trainTypes };
}

export function serializeHash(headers: string[], rows: TimetableRow[], trainTypes: TrainType[] = []): string {
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

  return typesPart ? `${headersPart}#${timetablePart}#${typesPart}` : `${headersPart}#${timetablePart}`;
}
