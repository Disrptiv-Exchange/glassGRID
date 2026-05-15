import type { AggFunc } from '../types';

export function aggregate<TValue>(values: TValue[], fn: AggFunc | ((v: TValue[]) => TValue)): unknown {
  if (typeof fn === 'function') return fn(values);
  if (values.length === 0) return null;
  switch (fn) {
    case 'count': return values.length;
    case 'first': return values[0];
    case 'last': return values[values.length - 1];
    case 'sum': return numbers(values).reduce((a, b) => a + b, 0);
    case 'min': return Math.min(...numbers(values));
    case 'max': return Math.max(...numbers(values));
    case 'avg': {
      const nums = numbers(values);
      return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
    }
    default: return null;
  }
}

function numbers<TValue>(values: TValue[]): number[] {
  const out: number[] = [];
  for (const v of values) {
    if (typeof v === 'number' && !isNaN(v)) out.push(v);
    else if (typeof v === 'string') {
      const n = parseFloat(v);
      if (!isNaN(n)) out.push(n);
    }
  }
  return out;
}
