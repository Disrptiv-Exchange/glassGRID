export interface Employee {
  id: number;
  name: string;
  email: string;
  department: 'Engineering' | 'Sales' | 'Marketing' | 'Finance' | 'Ops' | 'Design';
  title: string;
  level: 1 | 2 | 3 | 4 | 5;
  salary: number;
  hireDate: Date;
  active: boolean;
  rating: number; // 0..5
  location: string;
  notes: string;
}

const FIRST = ['Ada', 'Linus', 'Margaret', 'Grace', 'Alan', 'Donald', 'Barbara', 'Edsger', 'Niklaus', 'Tony', 'John', 'Vint', 'Tim', 'Anita', 'Radia', 'Jean', 'Brian', 'Ken', 'Dennis', 'Bjarne'];
const LAST = ['Lovelace', 'Torvalds', 'Hamilton', 'Hopper', 'Turing', 'Knuth', 'Liskov', 'Dijkstra', 'Wirth', 'Hoare', 'McCarthy', 'Cerf', 'Berners-Lee', 'Borg', 'Perlman', 'Sammet', 'Kernighan', 'Thompson', 'Ritchie', 'Stroustrup'];
const DEPTS: Employee['department'][] = ['Engineering', 'Sales', 'Marketing', 'Finance', 'Ops', 'Design'];
const TITLES = ['Engineer', 'Senior Engineer', 'Manager', 'Director', 'Principal', 'Analyst', 'Designer', 'Lead', 'Specialist', 'Architect'];
const CITIES = ['San Francisco', 'New York', 'London', 'Berlin', 'Tokyo', 'Bangalore', 'Sydney', 'Toronto', 'Singapore', 'Amsterdam'];

function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function makeRows(count: number, seed = 42): Employee[] {
  const rand = seeded(seed);
  const pick = <T>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)]!;
  const rows: Employee[] = [];
  for (let i = 0; i < count; i++) {
    const first = pick(FIRST);
    const last = pick(LAST);
    const dept = pick(DEPTS);
    const title = pick(TITLES);
    const level = (Math.floor(rand() * 5) + 1) as 1 | 2 | 3 | 4 | 5;
    const hireYear = 2010 + Math.floor(rand() * 15);
    const hireMonth = Math.floor(rand() * 12);
    const hireDay = 1 + Math.floor(rand() * 27);
    rows.push({
      id: i + 1,
      name: `${first} ${last}`,
      email: `${first}.${last}@glassgrid.test`.toLowerCase(),
      department: dept,
      title: `${title} ${level >= 4 ? 'III' : level === 3 ? 'II' : 'I'}`,
      level,
      salary: Math.round((50_000 + rand() * 200_000 + level * 12_000) / 100) * 100,
      hireDate: new Date(hireYear, hireMonth, hireDay),
      active: rand() > 0.15,
      rating: Math.round(rand() * 50) / 10,
      location: pick(CITIES),
      notes: rand() > 0.7 ? 'Top performer' : rand() > 0.5 ? 'New hire' : '',
    });
  }
  return rows;
}

export function makeWideRows(rowCount: number, colCount: number, seed = 7) {
  const rand = seeded(seed);
  const rows: Record<string, number | string>[] = [];
  for (let r = 0; r < rowCount; r++) {
    const row: Record<string, number | string> = { id: r };
    for (let c = 0; c < colCount; c++) {
      row[`c${c}`] = Math.round(rand() * 10000);
    }
    rows.push(row);
  }
  const cols = Array.from({ length: colCount }, (_, c) => ({
    field: `c${c}`,
    headerName: `Col ${c}`,
    width: 90,
  }));
  return { rows, cols };
}
