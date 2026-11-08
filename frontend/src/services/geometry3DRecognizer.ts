import { Point, RecognitionResultData, RecognitionStatus, Stroke } from '../types';

interface Edge {
  u: number;
  v: number;
  length: number;
  angle: number; // in degrees
}

interface WireframeGraph {
  vertices: Point[];
  edges: Edge[];
  adjacency: Map<number, Set<number>>;
}

/**
 * Builds a topological graph of vertices and intersecting edges from strokes.
 */
function buildWireframeGraph(strokes: Stroke[], mergeTolerance = 25): WireframeGraph {
  const rawVertices: Point[] = [];

  // Extract endpoints and high-curvature points of strokes
  for (const stroke of strokes) {
    if (stroke.length === 0) continue;
    rawVertices.push(stroke[0]);
    rawVertices.push(stroke[stroke.length - 1]);
  }

  // Merge nearby vertices within mergeTolerance
  const vertices: Point[] = [];
  for (const raw of rawVertices) {
    const existing = vertices.find((v) => Math.hypot(v.x - raw.x, v.y - raw.y) < mergeTolerance);
    if (!existing) {
      vertices.push({ ...raw });
    }
  }

  const adjacency = new Map<number, Set<number>>();
  for (let i = 0; i < vertices.length; i++) {
    adjacency.set(i, new Set());
  }

  const edges: Edge[] = [];

  // For each stroke, map its endpoints to the merged vertices and register edge
  for (const stroke of strokes) {
    if (stroke.length < 2) continue;
    const start = stroke[0];
    const end = stroke[stroke.length - 1];

    let startIdx = vertices.findIndex((v) => Math.hypot(v.x - start.x, v.y - start.y) < mergeTolerance * 1.5);
    let endIdx = vertices.findIndex((v) => Math.hypot(v.x - end.x, v.y - end.y) < mergeTolerance * 1.5);

    if (startIdx !== -1 && endIdx !== -1 && startIdx !== endIdx) {
      if (!adjacency.get(startIdx)?.has(endIdx)) {
        adjacency.get(startIdx)?.add(endIdx);
        adjacency.get(endIdx)?.add(startIdx);

        const dx = vertices[endIdx].x - vertices[startIdx].x;
        const dy = vertices[endIdx].y - vertices[startIdx].y;
        const length = Math.hypot(dx, dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

        edges.push({
          u: Math.min(startIdx, endIdx),
          v: Math.max(startIdx, endIdx),
          length,
          angle: (angle + 360) % 180, // undirected angle modulo 180°
        });
      }
    }
  }

  return { vertices, edges, adjacency };
}

/**
 * Analyzes parallel edge groups (tolerance in degrees).
 */
function countParallelEdgePairs(edges: Edge[], angleTol = 18): number {
  let parallelPairs = 0;
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const diff = Math.abs(edges[i].angle - edges[j].angle);
      if (diff < angleTol || Math.abs(diff - 180) < angleTol) {
        parallelPairs++;
      }
    }
  }
  return parallelPairs;
}

/**
 * 3D Wireframe Geometry Recognition Engine.
 */
export function analyze3DWireframe(
  strokes: Stroke[],
  thumbnailData?: string
): RecognitionResultData {
  const timestamp = new Date().toISOString();
  const graph = buildWireframeGraph(strokes);
  const vCount = graph.vertices.length;
  const eCount = graph.edges.length;

  const parallelPairs = countParallelEdgePairs(graph.edges);

  const baseCharacteristics = {
    vertexCount: vCount,
    vertices: graph.vertices,
    perimeter: graph.edges.reduce((sum, e) => sum + e.length, 0),
    area: 0,
    circularity: 0,
    aspectRatio: 1,
    angles: [],
    sideLengths: graph.edges.map((e) => Math.round(e.length)),
    isClosed: true,
    wireframeTopology: {
      vertexCount: vCount,
      edgeCount: eCount,
      cycles: Math.max(0, eCount - vCount + 1), // Euler cycle rank
    },
  };

  // 1. CUBE / CUBOID
  // Ideal: 8 vertices, 12 edges, high parallel edge pairs
  if ((vCount >= 6 && vCount <= 10) && (eCount >= 9 && eCount <= 15)) {
    // Check edge length variance to distinguish Cube (roughly equal edges) vs Cuboid (elongated)
    const lengths = graph.edges.map((e) => e.length);
    const minL = Math.min(...lengths);
    const maxL = Math.max(...lengths);
    const ratio = minL / Math.max(1, maxL);

    const isCube = ratio > 0.45;
    const shapeName = isCube ? 'Cube' : 'Cuboid';

    const edgeError = Math.abs(12 - eCount) / 6;
    const vertexError = Math.abs(8 - vCount) / 4;
    const topologyScore = Math.max(55, Math.min(97, Math.round((1 - (edgeError + vertexError) / 2) * 100)));

    return {
      shapeName,
      dimension: '3D',
      similarityScore: topologyScore,
      status: topologyScore >= 70 ? 'success' : 'partial',
      characteristics: baseCharacteristics,
      explanation: isCube
        ? 'A 3D cube consists of 8 vertices, 12 equal-length edges, and 6 square faces meeting at 90°!'
        : 'A 3D cuboid is an elongated box with 8 vertices, 12 edges, and 6 rectangular faces.',
      suggestions: [
        'Keep parallel edges well aligned to strengthen isometric depth perception.',
        'Ensure all 4 front-to-back connector lines meet at the matching corner vertices.',
      ],
      thumbnailData,
      timestamp,
    };
  }

  // 2. PYRAMID
  // Ideal: 5 vertices (1 apex + 4 base), 8 edges
  if ((vCount >= 4 && vCount <= 6) && (eCount >= 6 && eCount <= 10)) {
    // Find apex: vertex with 3 or 4 edges radiating outwards
    let apexIndex = -1;
    for (const [idx, neighbors] of graph.adjacency.entries()) {
      if (neighbors.size >= 3) {
        apexIndex = idx;
        break;
      }
    }

    const similarityScore = Math.max(60, Math.min(95, Math.round(100 - Math.abs(5 - vCount) * 10 - Math.abs(8 - eCount) * 5)));

    return {
      shapeName: 'Pyramid',
      dimension: '3D',
      similarityScore,
      status: similarityScore >= 70 ? 'success' : 'partial',
      characteristics: baseCharacteristics,
      explanation:
        'A 3D pyramid has a polygonal base (usually a square) and 4 triangular lateral faces that all meet at a single top point called the apex!',
      suggestions: [
        'Draw a flat base first, then place the apex high above the center and draw the 4 slopes down.',
      ],
      thumbnailData,
      timestamp,
    };
  }

  // 3. TRIANGULAR PRISM
  // Ideal: 6 vertices, 9 edges, 2 triangular bases + 3 rectangular sides
  if ((vCount >= 5 && vCount <= 7) && (eCount >= 7 && eCount <= 11)) {
    const similarityScore = Math.max(60, Math.min(96, Math.round(100 - Math.abs(6 - vCount) * 10 - Math.abs(9 - eCount) * 5)));

    return {
      shapeName: 'Triangular Prism',
      dimension: '3D',
      similarityScore,
      status: similarityScore >= 70 ? 'success' : 'partial',
      characteristics: baseCharacteristics,
      explanation:
        'A triangular prism is a 3D polyhedron with two identical parallel triangle bases and three rectangular sides!',
      suggestions: [
        'Draw two matching triangles and link the 3 matching corners with straight parallel edges.',
      ],
      thumbnailData,
      timestamp,
    };
  }

  // Fallback Unknown
  return {
    shapeName: 'Unknown 3D Wireframe',
    dimension: '3D',
    similarityScore: 40,
    status: 'unknown',
    characteristics: baseCharacteristics,
    explanation: 'Could not match known 3D wireframe topology (Cube, Cuboid, Pyramid, Triangular Prism).',
    suggestions: [
      'Draw distinct wireframe lines and make sure the corner junctions connect cleanly.',
      'Check the Learning Center 3D wireframe guide for step-by-step drawing demonstrations!',
    ],
    thumbnailData,
    timestamp,
  };
}
