export interface Point {
  x: number;
  y: number;
  time?: number;
}

export type Stroke = Point[];

export interface ShapeCharacteristics {
  vertexCount: number;
  vertices: Point[];
  perimeter: number;
  area: number;
  circularity: number;
  aspectRatio: number;
  angles: number[];
  sideLengths: number[];
  oppositeSideRatio?: number;
  radialVariance?: number;
  isClosed: boolean;
  wireframeTopology?: {
    vertexCount: number;
    edgeCount: number;
    cycles?: number;
  };
}

export type RecognitionStatus = 'success' | 'partial' | 'unknown';

export interface RecognitionResultData {
  shapeName: string;
  dimension: '2D' | '3D';
  similarityScore: number;
  status: RecognitionStatus;
  characteristics: ShapeCharacteristics;
  explanation: string;
  suggestions: string[];
  thumbnailData?: string;
  timestamp: string;
}

export interface ShapeInfo {
  id: string;
  name: string;
  dimension: '2D' | '3D';
  description: string;
  properties: Record<string, any>;
  tips: string[];
  difficulty: string;
  icon_name: string;
}

export interface Lesson {
  id: string;
  shape_id: string;
  title: string;
  dimension: string;
  difficulty: string;
  estimated_minutes: number;
  instructions: string;
  steps: string[];
  fun_fact: string;
  criteria: string[];
}

export interface HistoryItem {
  id: number;
  shape_name: string;
  recognized_shape: string;
  similarity_score: number;
  status: RecognitionStatus;
  characteristics: Record<string, any>;
  feedback: string;
  duration_seconds: number;
  thumbnail_data?: string;
  created_at: string;
}

export type GestureType = 'none' | 'pointing' | 'pinch' | 'open_palm' | 'closed_fist';

export interface HandLandmark {
  x: number;
  y: number;
  z?: number;
}

export interface GestureDetectionResult {
  gesture: GestureType;
  cursor: Point;
  pinchDistance: number;
  confidence: number;
  rawLandmarks?: HandLandmark[];
  fistHoldProgress?: number; // 0 to 1 (for hold-to-finish countdown)
  // 3D Motion Vectors for 360° Object Manipulation
  rotation3D?: { pitch: number; yaw: number; roll: number };
  handScale?: number;
  palmCenter?: { x: number; y: number; z: number };
}

export interface DrawingSettings {
  penColor: string;
  penWidth: number;
  smoothFactor: number;
  pinchThreshold: number;
  mirrorCamera: boolean;
  showLandmarks: boolean;
  soundEnabled: boolean;
  targetShape?: string | null;
  // Template & Tracing
  showTemplate: boolean;
  templateShape: string;
  templateOpacity: number;
  // Auto-correct
  autoCorrectEnabled: boolean;
  // Gesture triggers & safety
  gestureFinishEnabled: boolean;
  fistHoldDuration: number; // in milliseconds (e.g. 1800ms)
  // Smart Draw Assist & Stabilizer
  drawMode: 'pinch' | 'toggle' | 'point'; // 'pinch' = jepit tahan, 'toggle' = jepit sekali untuk kunci pena, 'point' = tunjuk langsung gambar
  stabilizerLevel: 'soft' | 'stable' | 'ultra';
}

export interface Tutorial3DStep {
  stepNumber: number;
  title: string;
  instruction: string;
  tip: string;
  lines: { from: { x: number; y: number }; to: { x: number; y: number }; style?: 'solid' | 'dashed' }[];
  highlightPoints?: { x: number; y: number; label?: string }[];
}

export interface Tutorial3DModel {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  description: string;
  steps: Tutorial3DStep[];
}

export interface Model3DCatalogItem {
  id: string;
  name: string;
  category: string;
  description: string;
  difficulty: string;
  color: string;
  specs: Record<string, any>;
}
