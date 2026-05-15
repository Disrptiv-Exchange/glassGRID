/**
 * Lightweight SVG sparkline helpers — return inline SVG strings safe to embed via cellRenderer.
 */

export interface SparklineOptions {
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  showMinMax?: boolean;
}

export function lineSparkline(values: number[], opts: SparklineOptions = {}): string {
  const w = opts.width ?? 100;
  const h = opts.height ?? 24;
  const stroke = opts.stroke ?? 'currentColor';
  const sw = opts.strokeWidth ?? 1.5;
  if (!values.length) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = values.length > 1 ? w / (values.length - 1) : 0;
  const points = values.map((v, i) => `${i * stepX},${h - ((v - min) / range) * h}`).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"><polyline fill="none" stroke="${stroke}" stroke-width="${sw}" points="${points}" /></svg>`;
}

export function barSparkline(values: number[], opts: SparklineOptions = {}): string {
  const w = opts.width ?? 100;
  const h = opts.height ?? 24;
  const fill = opts.fill ?? 'currentColor';
  if (!values.length) return '';
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const range = max - min || 1;
  const barW = (w / values.length) * 0.8;
  const gap = (w / values.length) * 0.2;
  const baseline = h - ((0 - min) / range) * h;
  const bars = values.map((v, i) => {
    const y = h - ((v - min) / range) * h;
    const x = i * (barW + gap);
    const top = Math.min(y, baseline);
    const height = Math.abs(y - baseline);
    return `<rect x="${x}" y="${top}" width="${barW}" height="${height}" fill="${fill}" />`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">${bars}</svg>`;
}

export function areaSparkline(values: number[], opts: SparklineOptions = {}): string {
  const w = opts.width ?? 100;
  const h = opts.height ?? 24;
  const stroke = opts.stroke ?? 'currentColor';
  const fill = opts.fill ?? 'currentColor';
  if (!values.length) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = values.length > 1 ? w / (values.length - 1) : 0;
  const pts = values.map((v, i) => `${i * stepX},${h - ((v - min) / range) * h}`);
  const line = pts.join(' ');
  const area = `0,${h} ${line} ${w},${h}`;
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"><polygon fill="${fill}" fill-opacity="0.2" points="${area}" /><polyline fill="none" stroke="${stroke}" stroke-width="1.5" points="${line}" /></svg>`;
}
