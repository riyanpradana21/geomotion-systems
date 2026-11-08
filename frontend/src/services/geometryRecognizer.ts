import { Point, RecognitionResultData, RecognitionStatus, ShapeCharacteristics, Stroke } from '../types';

/**
 * Resamples stroke points so they are evenly distributed by distance.
 */
function resamplePoints(points: Point[], interval: number = 8): Point[] {
  if (points.length < 2) return points;

  const result: Point[] = [points[0]];
  let accumulatedDist = 0;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const d = Math.hypot(curr.x - prev.x, curr.y - prev.y);

    if (accumulatedDist + d >= interval) {
      const remaining = interval - accumulatedDist;
      const t = remaining / d;
      const newPt: Point = {
        x: prev.x + t * (curr.x - prev.x),
        y: prev.y + t * (curr.y - prev.y),
      };
      result.push(newPt);
      accumulatedDist = 0;
    } else {
      accumulatedDist += d;
    }
  }

  // Ensure last point is retained
  if (result.length > 1) {
    const last = points[points.length - 1];
    const prev = result[result.length - 1];
    if (Math.hypot(last.x - prev.x, last.y - prev.y) > interval / 2) {
      result.push(last);
    }
  }

  return result;
}

/**
 * Ramer-Douglas-Peucker algorithm for polyline simplification.
 */
function ramerDouglasPeucker(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let index = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      index = i;
    }
  }

  if (maxDist > epsilon) {
    const rec1 = ramerDouglasPeucker(points.slice(0, index + 1), epsilon);
    const rec2 = ramerDouglasPeucker(points.slice(index), epsilon);
    return rec1.slice(0, rec1.length - 1).concat(rec2);
  } else {
    return [start, end];
  }
}

function perpendicularDistance(pt: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lineLenSq = dx * dx + dy * dy;

  if (lineLenSq === 0) {
    return Math.hypot(pt.x - lineStart.x, pt.y - lineStart.y);
  }

  const num = Math.abs(dy * pt.x - dx * pt.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x);
  return num / Math.sqrt(lineLenSq);
}

/**
 * Calculates perimeter of polygon.
 */
function calculatePerimeter(points: Point[]): number {
  let perimeter = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    perimeter += Math.hypot(p2.x - p1.x, p2.y - p1.y);
  }
  return perimeter;
}

/**
 * Shoelace formula for area.
 */
function calculateArea(points: Point[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    area += p1.x * p2.y - p2.x * p1.y;
  }
  return Math.abs(area) / 2;
}

/**
 * Calculates internal angles at each vertex.
 */
function calculateAngles(vertices: Point[]): number[] {
  const n = vertices.length;
  if (n < 3) return [];

  const angles: number[] = [];
  for (let i = 0; i < n; i++) {
    const prev = vertices[(i - 1 + n) % n];
    const curr = vertices[i];
    const next = vertices[(i + 1) % n];

    const v1 = { x: prev.x - curr.x, y: prev.y - curr.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };

    const mag1 = Math.hypot(v1.x, v1.y);
    const mag2 = Math.hypot(v2.x, v2.y);

    if (mag1 === 0 || mag2 === 0) {
      angles.push(0);
      continue;
    }

    const dot = v1.x * v2.x + v1.y * v2.y;
    const cosTheta = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
    const angleDeg = (Math.acos(cosTheta) * 180) / Math.PI;
    angles.push(Math.round(angleDeg * 10) / 10);
  }
  return angles;
}

/**
 * Calculates side lengths between vertices.
 */
function calculateSideLengths(vertices: Point[]): number[] {
  const n = vertices.length;
  const sides: number[] = [];
  for (let i = 0; i < n; i++) {
    const p1 = vertices[i];
    const p2 = vertices[(i + 1) % n];
    sides.push(Math.round(Math.hypot(p2.x - p1.x, p2.y - p1.y) * 10) / 10);
  }
  return sides;
}

/**
 * Calculates centroid and radial variance.
 */
function calculateRadialMetrics(points: Point[]): {
  centroid: Point;
  meanRadius: number;
  radialVariance: number;
  coeffOfVariation: number;
} {
  let cx = 0;
  let cy = 0;
  for (const pt of points) {
    cx += pt.x;
    cy += pt.y;
  }
  cx /= points.length;
  cy /= points.length;

  const radii = points.map((p) => Math.hypot(p.x - cx, p.y - cy));
  const meanRadius = radii.reduce((sum, r) => sum + r, 0) / radii.length;

  let varianceSum = 0;
  for (const r of radii) {
    varianceSum += Math.pow(r - meanRadius, 2);
  }
  const stdDev = Math.sqrt(varianceSum / radii.length);
  const coeffOfVariation = meanRadius > 0 ? stdDev / meanRadius : 1;

  return {
    centroid: { x: cx, y: cy },
    meanRadius,
    radialVariance: stdDev,
    coeffOfVariation,
  };
}

/**
 * Core 2D Geometry Recognition Engine.
 */
export function analyze2DGeometry(
  strokes: Stroke[],
  thumbnailData?: string
): RecognitionResultData {
  // 1. Flatten all points from strokes
  const allPoints: Point[] = [];
  for (const stroke of strokes) {
    for (const pt of stroke) {
      allPoints.push(pt);
    }
  }

  const timestamp = new Date().toISOString();

  // Guard: Not enough points
  if (allPoints.length < 15) {
    return {
      shapeName: 'Unknown',
      dimension: '2D',
      similarityScore: 0,
      status: 'unknown',
      characteristics: {
        vertexCount: 0,
        vertices: [],
        perimeter: 0,
        area: 0,
        circularity: 0,
        aspectRatio: 0,
        angles: [],
        sideLengths: [],
        isClosed: false,
      },
      explanation: 'Not enough drawing data was found to recognize a shape.',
      suggestions: ['Try drawing a larger shape with a steady pinch movement!'],
      thumbnailData,
      timestamp,
    };
  }

  // 2. Resample points uniformly
  const resampled = resamplePoints(allPoints, 8);
  const rawPerimeter = calculatePerimeter(resampled);
  const rawArea = calculateArea(resampled);

  // Bounding box
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const pt of resampled) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const aspectRatio = Math.round((Math.min(width, height) / Math.max(width, height)) * 100) / 100;
  const rawAspectRatio = Math.round((width / height) * 100) / 100;

  // Closure check: distance between first point and last point vs bounding diameter
  const startPt = resampled[0];
  const endPt = resampled[resampled.length - 1];
  const gapDist = Math.hypot(endPt.x - startPt.x, endPt.y - startPt.y);
  const boundingDiag = Math.hypot(width, height);
  const isClosed = gapDist < boundingDiag * 0.28 || strokes.length > 1;

  // Circularity (Isoperimetric Quotient): 4 * PI * Area / Perimeter^2
  const circularity = rawPerimeter > 0 ? (4 * Math.PI * rawArea) / Math.pow(rawPerimeter, 2) : 0;
  const clampedCircularity = Math.max(0, Math.min(1.2, circularity));

  // Radial metrics
  const { meanRadius, radialVariance, coeffOfVariation } = calculateRadialMetrics(resampled);

  // 3. Multi-epsilon Ramer-Douglas-Peucker approximation
  // Test epsilon ranges relative to perimeter to find stable polygon representation
  let simplified: Point[] = [];
  const baseEpsilon = rawPerimeter * 0.038;
  simplified = ramerDouglasPeucker(resampled, baseEpsilon);

  // If first and last points are close, merge them to close the polygon
  if (simplified.length > 2) {
    const f = simplified[0];
    const l = simplified[simplified.length - 1];
    if (Math.hypot(l.x - f.x, l.y - f.y) < baseEpsilon * 1.5) {
      simplified.pop();
    }
  }

  const vertexCount = simplified.length;
  const angles = calculateAngles(simplified);
  const sideLengths = calculateSideLengths(simplified);

  const characteristics: ShapeCharacteristics = {
    vertexCount,
    vertices: simplified,
    perimeter: Math.round(rawPerimeter),
    area: Math.round(rawArea),
    circularity: Math.round(clampedCircularity * 100) / 100,
    aspectRatio: rawAspectRatio,
    angles,
    sideLengths,
    radialVariance: Math.round(coeffOfVariation * 100) / 100,
    isClosed,
  };

  // Evaluate candidate shapes

  // ===================== CANDIDATE 1: CIRCLE =====================
  // A circle has:
  // - High circularity (generally > 0.75)
  // - Low coefficient of variation in radius (coeffOfVariation < 0.18)
  // - Aspect ratio of bounding box near 1.0 (aspectRatio >= 0.70)
  const isCircleShape =
    (clampedCircularity > 0.74 && coeffOfVariation < 0.22 && aspectRatio >= 0.65) ||
    (clampedCircularity > 0.68 && coeffOfVariation < 0.14 && aspectRatio >= 0.75);

  if (isCircleShape) {
    // Deterministic score calculation:
    // Circularity target: 1.0 (weight 50%)
    // Radial uniformity: CV -> 0 (weight 30%)
    // Aspect ratio: ratio -> 1.0 (weight 20%)
    const circPenalty = Math.min(1, Math.abs(1.0 - clampedCircularity) / 0.35);
    const radialPenalty = Math.min(1, coeffOfVariation / 0.25);
    const aspectPenalty = Math.min(1, Math.abs(1.0 - aspectRatio) / 0.35);

    const error = circPenalty * 0.45 + radialPenalty * 0.35 + aspectPenalty * 0.20;
    const similarityScore = Math.max(50, Math.min(99, Math.round((1 - error) * 100)));

    const status: RecognitionStatus = similarityScore >= 75 ? 'success' : 'partial';

    const suggestions: string[] = [];
    if (aspectRatio < 0.85) {
      suggestions.push('Your circle is slightly oval-shaped. Try making the width and height more even.');
    }
    if (coeffOfVariation > 0.12) {
      suggestions.push('Keep a steady curving pace to make the roundness even all the way around.');
    }
    if (!isClosed) {
      suggestions.push('Make sure to connect your starting and ending points completely.');
    }
    if (suggestions.length === 0) {
      suggestions.push('Outstanding circle! Super round and wonderfully balanced.');
    }

    return {
      shapeName: 'Circle',
      dimension: '2D',
      similarityScore,
      status,
      characteristics,
      explanation:
        'A circle is a perfectly round 2D shape where every point along the edge is at the exact same distance from the center!',
      suggestions,
      thumbnailData,
      timestamp,
    };
  }

  // ===================== CANDIDATE 2: TRIANGLE =====================
  // Triangle: 3 vertices, sum of angles ~ 180°
  // If simplified has 3 vertices, or slightly rough 4 vertices where one angle is ~180°
  let effectiveVertices = simplified;
  if (vertexCount === 4) {
    // Check if one angle is almost straight (> 150°)
    const straightIndex = angles.findIndex((a) => a > 145);
    if (straightIndex !== -1) {
      effectiveVertices = simplified.filter((_, idx) => idx !== straightIndex);
    }
  }

  if (effectiveVertices.length === 3) {
    const triAngles = calculateAngles(effectiveVertices);
    const angleSum = triAngles.reduce((a, b) => a + b, 0);
    const angleSumDiff = Math.abs(180 - angleSum);

    // Side equality check
    const triSides = calculateSideLengths(effectiveVertices);
    const minSide = Math.min(...triSides);
    const maxSide = Math.max(...triSides);

    const anglePenalty = Math.min(1, angleSumDiff / 60);
    const closurePenalty = isClosed ? 0 : 0.2;
    const totalPenalty = anglePenalty * 0.7 + closurePenalty * 0.3;

    const similarityScore = Math.max(55, Math.min(98, Math.round((1 - totalPenalty) * 100)));
    const status: RecognitionStatus = similarityScore >= 75 ? 'success' : 'partial';

    const suggestions: string[] = [];
    if (!isClosed) {
      suggestions.push('Connect the 3rd corner back to the 1st apex corner to close the triangle loop.');
    }
    if (angleSumDiff > 25) {
      suggestions.push('Keep the 3 sides straight with crisp, sharp pointed corners.');
    }
    if (suggestions.length === 0) {
      suggestions.push('Fantastic triangle! Crisp corners and clean straight edges.');
    }

    return {
      shapeName: 'Triangle',
      dimension: '2D',
      similarityScore,
      status,
      characteristics: {
        ...characteristics,
        vertexCount: 3,
        vertices: effectiveVertices,
        angles: triAngles,
        sideLengths: triSides,
      },
      explanation:
        'A triangle is a sturdy three-sided polygon with 3 corners. The three inside angles always add up to 180°!',
      suggestions,
      thumbnailData,
      timestamp,
    };
  }

  // ===================== CANDIDATE 3 & 4: SQUARE vs RECTANGLE =====================
  // 4 vertices (or 5 where 1 is redundant collinear)
  let quadVertices = simplified;
  if (vertexCount === 5) {
    const straightIndex = angles.findIndex((a) => a > 150);
    if (straightIndex !== -1) {
      quadVertices = simplified.filter((_, idx) => idx !== straightIndex);
    }
  }

  if (quadVertices.length === 4) {
    const quadAngles = calculateAngles(quadVertices);
    const quadSides = calculateSideLengths(quadVertices);

    // Measure angle deviation from 90°
    const angleDiffs = quadAngles.map((a) => Math.abs(90 - a));
    const meanAngleDiff = angleDiffs.reduce((a, b) => a + b, 0) / 4;

    // Check opposite side equality: s0 vs s2, s1 vs s3
    const opp1Diff = Math.abs(quadSides[0] - quadSides[2]) / Math.max(quadSides[0], quadSides[2], 1);
    const opp2Diff = Math.abs(quadSides[1] - quadSides[3]) / Math.max(quadSides[1], quadSides[3], 1);
    const oppEqualityError = (opp1Diff + opp2Diff) / 2;

    // All sides equality (for square)
    const minSide = Math.min(...quadSides);
    const maxSide = Math.max(...quadSides);
    const sideRatio = minSide / Math.max(maxSide, 1); // 1.0 = all equal

    // Square if aspectRatio >= 0.82 AND sideRatio >= 0.72
    const isSquare = aspectRatio >= 0.82 && sideRatio >= 0.70;

    if (isSquare) {
      // Score calculation for Square:
      // Penalties:
      // 1. Angle deviation from 90° (ideal: 0)
      // 2. Side inequality (ideal: sideRatio -> 1.0)
      // 3. Aspect ratio deviation from 1.0
      const anglePenalty = Math.min(1, meanAngleDiff / 35);
      const sidePenalty = Math.min(1, (1.0 - sideRatio) / 0.35);
      const aspectPenalty = Math.min(1, Math.abs(1.0 - aspectRatio) / 0.25);

      const penalty = anglePenalty * 0.45 + sidePenalty * 0.35 + aspectPenalty * 0.20;
      const similarityScore = Math.max(52, Math.min(99, Math.round((1 - penalty) * 100)));
      const status: RecognitionStatus = similarityScore >= 75 ? 'success' : 'partial';

      const suggestions: string[] = [];
      if (sideRatio < 0.8) {
        suggestions.push('Make all four sides more equal in length for a higher square score.');
      }
      if (meanAngleDiff > 15) {
        suggestions.push('Pause slightly at the 4 corners to draw sharp 90-degree right angles.');
      }
      if (suggestions.length === 0) {
        suggestions.push('Brilliant square! Perfectly balanced sides and crisp right angles.');
      }

      return {
        shapeName: 'Square',
        dimension: '2D',
        similarityScore,
        status,
        characteristics: {
          ...characteristics,
          vertexCount: 4,
          vertices: quadVertices,
          angles: quadAngles,
          sideLengths: quadSides,
        },
        explanation:
          'A square is a special quadrilateral with four equal sides and four 90° right-angle corners!',
        suggestions,
        thumbnailData,
        timestamp,
      };
    } else {
      // RECTANGLE
      // Elongated quadrilateral with 4 right angles and equal opposite sides
      const anglePenalty = Math.min(1, meanAngleDiff / 35);
      const oppSidePenalty = Math.min(1, oppEqualityError / 0.4);

      const penalty = anglePenalty * 0.5 + oppSidePenalty * 0.5;
      const similarityScore = Math.max(50, Math.min(98, Math.round((1 - penalty) * 100)));
      const status: RecognitionStatus = similarityScore >= 75 ? 'success' : 'partial';

      const suggestions: string[] = [];
      if (oppEqualityError > 0.25) {
        suggestions.push('Make sure opposite sides are the same length and parallel to each other.');
      }
      if (meanAngleDiff > 15) {
        suggestions.push('Try making the four corners sharper 90-degree right angles.');
      }
      if (suggestions.length === 0) {
        suggestions.push('Excellent rectangle! Well-defined sides and great right-angle corners.');
      }

      return {
        shapeName: 'Rectangle',
        dimension: '2D',
        similarityScore,
        status,
        characteristics: {
          ...characteristics,
          vertexCount: 4,
          vertices: quadVertices,
          angles: quadAngles,
          sideLengths: quadSides,
          oppositeSideRatio: Math.round((1 - oppEqualityError) * 100) / 100,
        },
        explanation:
          'A rectangle is a 4-sided polygon with four 90° right angles. Opposite sides are parallel and equal in length!',
        suggestions,
        thumbnailData,
        timestamp,
      };
    }
  }

  // Fallback: If shape didn't match cleanly, check if circularity is moderate
  if (clampedCircularity > 0.65 && coeffOfVariation < 0.25) {
    return {
      shapeName: 'Circle',
      dimension: '2D',
      similarityScore: 65,
      status: 'partial',
      characteristics,
      explanation: 'Looks like you were drawing a circle, but it has some uneven curves or corners.',
      suggestions: [
        'Draw in one continuous fluid motion without stopping until you loop back to the start.',
      ],
      thumbnailData,
      timestamp,
    };
  }

  // Unknown shape
  return {
    shapeName: 'Unknown',
    dimension: '2D',
    similarityScore: 35,
    status: 'unknown',
    characteristics,
    explanation:
      "We couldn't reliably identify this shape. It might have too many irregular corners or open strokes.",
    suggestions: [
      'Try drawing one of the standard shapes: Square, Rectangle, Triangle, or Circle.',
      'Keep lines straight for polygons and make corners distinct.',
      'Check out the Learning Center for step-by-step guides!',
    ],
    thumbnailData,
    timestamp,
  };
}
