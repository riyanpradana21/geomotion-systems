import { Point, Stroke } from '../types';
import { analyze2DGeometry } from './geometryRecognizer';
import { analyze3DWireframe } from './geometry3DRecognizer';

export interface AutoCorrectResult {
  success: boolean;
  shapeName: string;
  originalScore: number;
  correctedScore: number;
  correctedStrokes: Stroke[];
  message: string;
}

function interpolateLine(p1: Point, p2: Point, count = 15): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    points.push({
      x: p1.x + t * (p2.x - p1.x),
      y: p1.y + t * (p2.y - p1.y),
    });
  }
  return points;
}

/**
 * Automatically corrects and beautifies hand-drawn strokes into perfect geometric shapes.
 */
export function autoCorrectDrawing(
  strokes: Stroke[],
  dimension: '2D' | '3D' = '2D',
  preferredShape?: string | null
): AutoCorrectResult {
  if (strokes.length === 0) {
    return {
      success: false,
      shapeName: 'None',
      originalScore: 0,
      correctedScore: 0,
      correctedStrokes: [],
      message: 'Belum ada gambar yang bisa dirapikan.',
    };
  }

  // 1. Collect bounding metrics and centroid
  const allPoints: Point[] = [];
  for (const s of strokes) {
    for (const p of s) allPoints.push(p);
  }

  if (allPoints.length < 5) {
    return {
      success: false,
      shapeName: 'Incomplete',
      originalScore: 0,
      correctedScore: 0,
      correctedStrokes: strokes,
      message: 'Gambar terlalu pendek untuk dirapikan secara otomatis.',
    };
  }

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  let cx = 0,
    cy = 0;

  for (const p of allPoints) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    cx += p.x;
    cy += p.y;
  }
  cx /= allPoints.length;
  cy /= allPoints.length;

  const width = Math.max(20, maxX - minX);
  const height = Math.max(20, maxY - minY);

  // 2. Run recognition to detect shape type
  if (dimension === '3D') {
    const analysis = analyze3DWireframe(strokes);
    const shape = (preferredShape || analysis.shapeName).toLowerCase();

    // AUTO-CORRECT: 3D CUBE
    if (shape.includes('cube') || shape.includes('kubus')) {
      const size = Math.max(width, height) * 0.75;
      const f1 = { x: cx - size * 0.6, y: cy - size * 0.2 };
      const f2 = { x: cx + size * 0.2, y: cy - size * 0.2 };
      const f3 = { x: cx + size * 0.2, y: cy + size * 0.6 };
      const f4 = { x: cx - size * 0.6, y: cy + size * 0.6 };

      const shiftX = size * 0.35;
      const shiftY = -size * 0.35;
      const b1 = { x: f1.x + shiftX, y: f1.y + shiftY };
      const b2 = { x: f2.x + shiftX, y: f2.y + shiftY };
      const b3 = { x: f3.x + shiftX, y: f3.y + shiftY };
      const b4 = { x: f4.x + shiftX, y: f4.y + shiftY };

      const corrected: Stroke[] = [
        // Front square
        [...interpolateLine(f1, f2), ...interpolateLine(f2, f3), ...interpolateLine(f3, f4), ...interpolateLine(f4, f1)],
        // Back square
        [...interpolateLine(b1, b2), ...interpolateLine(b2, b3), ...interpolateLine(b3, b4), ...interpolateLine(b4, b1)],
        // 4 Connecting edges
        interpolateLine(f1, b1),
        interpolateLine(f2, b2),
        interpolateLine(f3, b3),
        interpolateLine(f4, b4),
      ];

      return {
        success: true,
        shapeName: 'Kubus 3D (Cube)',
        originalScore: analysis.similarityScore,
        correctedScore: 98,
        correctedStrokes: corrected,
        message: 'Bentuk dirapikan menjadi Kubus 3D presisi dengan sudut 90° sempurna!',
      };
    }

    // AUTO-CORRECT: 3D PYRAMID
    if (shape.includes('pyramid') || shape.includes('limas')) {
      const apex = { x: cx, y: minY + height * 0.1 };
      const base1 = { x: minX + width * 0.1, y: maxY };
      const base2 = { x: maxX - width * 0.15, y: maxY };
      const base3 = { x: maxX, y: minY + height * 0.65 };
      const base4 = { x: minX + width * 0.25, y: minY + height * 0.65 };

      const corrected: Stroke[] = [
        [...interpolateLine(base1, base2), ...interpolateLine(base2, base3), ...interpolateLine(base3, base4), ...interpolateLine(base4, base1)],
        interpolateLine(apex, base1),
        interpolateLine(apex, base2),
        interpolateLine(apex, base3),
        interpolateLine(apex, base4),
      ];

      return {
        success: true,
        shapeName: 'Limas Segiempat 3D',
        originalScore: analysis.similarityScore,
        correctedScore: 97,
        correctedStrokes: corrected,
        message: 'Limas 3D dirapikan dengan alas segiempat dan puncak simetris!',
      };
    }

    // AUTO-CORRECT: 3D PRISM
    if (shape.includes('prism') || shape.includes('tenda')) {
      const t1 = { x: cx - width * 0.35, y: maxY };
      const t2 = { x: cx + width * 0.05, y: maxY };
      const t3 = { x: cx - width * 0.15, y: minY + height * 0.35 };

      const shiftX = width * 0.35;
      const shiftY = -height * 0.3;
      const b1 = { x: t1.x + shiftX, y: t1.y + shiftY };
      const b2 = { x: t2.x + shiftX, y: t2.y + shiftY };
      const b3 = { x: t3.x + shiftX, y: t3.y + shiftY };

      const corrected: Stroke[] = [
        [...interpolateLine(t1, t2), ...interpolateLine(t2, t3), ...interpolateLine(t3, t1)],
        [...interpolateLine(b1, b2), ...interpolateLine(b2, b3), ...interpolateLine(b3, b1)],
        interpolateLine(t1, b1),
        interpolateLine(t2, b2),
        interpolateLine(t3, b3),
      ];

      return {
        success: true,
        shapeName: 'Prisma Segitiga 3D',
        originalScore: analysis.similarityScore,
        correctedScore: 98,
        correctedStrokes: corrected,
        message: 'Prisma 3D dirapikan dengan rusuk sejajar sempurna!',
      };
    }
  }

  // 2D RECOGNITION AUTO-CORRECTION
  const analysis2D = analyze2DGeometry(strokes);
  const shape = (preferredShape || analysis2D.shapeName).toLowerCase();

  // 1. CIRCLE
  if (shape.includes('circle') || shape.includes('lingkaran')) {
    const avgRadius = (width + height) / 4;
    const circlePoints: Point[] = [];
    const count = 72;
    for (let i = 0; i <= count; i++) {
      const angle = (i / count) * 2 * Math.PI;
      circlePoints.push({
        x: cx + avgRadius * Math.cos(angle),
        y: cy + avgRadius * Math.sin(angle),
      });
    }

    return {
      success: true,
      shapeName: 'Lingkaran (Circle)',
      originalScore: analysis2D.similarityScore,
      correctedScore: 99,
      correctedStrokes: [circlePoints],
      message: 'Bentuk bergelombang dirapikan menjadi Lingkaran mulus sempurna!',
    };
  }

  // 2. SQUARE
  if (shape.includes('square') || shape.includes('persegi')) {
    const avgSide = (width + height) / 2;
    const half = avgSide / 2;
    const p1 = { x: cx - half, y: cy - half };
    const p2 = { x: cx + half, y: cy - half };
    const p3 = { x: cx + half, y: cy + half };
    const p4 = { x: cx - half, y: cy + half };

    const squareStroke: Point[] = [
      ...interpolateLine(p1, p2),
      ...interpolateLine(p2, p3),
      ...interpolateLine(p3, p4),
      ...interpolateLine(p4, p1),
    ];

    return {
      success: true,
      shapeName: 'Persegi (Square)',
      originalScore: analysis2D.similarityScore,
      correctedScore: 99,
      correctedStrokes: [squareStroke],
      message: 'Dirapikan menjadi Persegi presisi: 4 sisi sama panjang & sudut 90°!',
    };
  }

  // 3. RECTANGLE
  if (shape.includes('rectangle') || shape.includes('panjang')) {
    const p1 = { x: minX, y: minY };
    const p2 = { x: maxX, y: minY };
    const p3 = { x: maxX, y: maxY };
    const p4 = { x: minX, y: maxY };

    const rectStroke: Point[] = [
      ...interpolateLine(p1, p2),
      ...interpolateLine(p2, p3),
      ...interpolateLine(p3, p4),
      ...interpolateLine(p4, p1),
    ];

    return {
      success: true,
      shapeName: 'Persegi Panjang (Rectangle)',
      originalScore: analysis2D.similarityScore,
      correctedScore: 98,
      correctedStrokes: [rectStroke],
      message: 'Dirapikan menjadi Persegi Panjang lurus dengan 4 sudut siku-siku rapi!',
    };
  }

  // 4. TRIANGLE
  if (shape.includes('triangle') || shape.includes('segitiga')) {
    const top = { x: cx, y: minY };
    const bottomRight = { x: maxX, y: maxY };
    const bottomLeft = { x: minX, y: maxY };

    const triStroke: Point[] = [
      ...interpolateLine(top, bottomRight),
      ...interpolateLine(bottomRight, bottomLeft),
      ...interpolateLine(bottomLeft, top),
    ];

    return {
      success: true,
      shapeName: 'Segitiga (Triangle)',
      originalScore: analysis2D.similarityScore,
      correctedScore: 99,
      correctedStrokes: [triStroke],
      message: 'Sudut segitiga diluruskan dan ditutup rapat sempurna!',
    };
  }

  // Fallback: Default to straightening according to detected vertices
  if (analysis2D.characteristics.vertices.length >= 3) {
    const verts = analysis2D.characteristics.vertices;
    const closedVerts = [...verts, verts[0]];
    const smoothed: Point[] = [];
    for (let i = 0; i < closedVerts.length - 1; i++) {
      smoothed.push(...interpolateLine(closedVerts[i], closedVerts[i + 1]));
    }
    return {
      success: true,
      shapeName: analysis2D.shapeName,
      originalScore: analysis2D.similarityScore,
      correctedScore: 90,
      correctedStrokes: [smoothed],
      message: 'Garis-garis kasar telah dirapikan menjadi poligon rapi!',
    };
  }

  return {
    success: false,
    shapeName: 'Unknown',
    originalScore: analysis2D.similarityScore,
    correctedScore: analysis2D.similarityScore,
    correctedStrokes: strokes,
    message: 'Bentuk belum dapat diidentifikasi untuk perbaikan otomatis.',
  };
}
