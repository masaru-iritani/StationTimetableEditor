export interface TimetableRow {
  hour: number;
  minutes: string[][]; // Array of string arrays for each route column
}

export interface TrainType {
  char: string;
  color: string;
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
  const hashParts = cleanHash.split('#');
  
  if (hashParts.length < 2 || !hashParts[0]) {
    return { headers: [''], rows: getDefaultRows(1), trainTypes: [] };
  }

  const headers = hashParts[0].split('|').map(text => {
    try {
      return decodeURIComponent(text);
    } catch {
      return text;
    }
  });

  const timetableStr = hashParts[1];
  const rows: TimetableRow[] = [];

  if (timetableStr) {
    const entries = timetableStr.split(';');
    entries.forEach(entry => {
      const [hourStr, ...minutesGroups] = entry.split(':');
      const hour = parseInt(hourStr, 10);
      if (isNaN(hour)) return;

      const minutes: string[][] = minutesGroups.map(group => {
        if (!group) return [];
        return group.split(',')
          .map(m => m.trim())
          .filter(min => min !== '')
          .map(min => {
            let decoded = min;
            try {
              decoded = decodeURIComponent(min);
            } catch (e) {}
            const match = decoded.match(/^(\d+)(.*)$/);
            if (!match) return null;
            const num = parseInt(match[1], 10);
            if (num < 0 || num >= 60) return null;
            return num.toString().padStart(2, '0') + match[2];
          })
          .filter((min): min is string => min !== null);
      });

      rows.push({ hour, minutes });
    });
  }

  // Ensure rows has elements, default to 6-24 if empty
  if (rows.length === 0) {
    rows.push(...getDefaultRows(headers.length));
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
        const [charEnc, colorEnc] = t.split(':');
        try {
          return {
            char: decodeURIComponent(charEnc),
            color: decodeURIComponent(colorEnc)
          };
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

  const typesPart = trainTypes.map(t => `${encodeURIComponent(t.char)}:${encodeURIComponent(t.color)}`).join(',');

  return typesPart ? `${headersPart}#${timetablePart}#${typesPart}` : `${headersPart}#${timetablePart}`;
}
