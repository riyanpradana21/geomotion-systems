import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { GestureDetectionResult, GestureType, HandLandmark, Point } from '../types';

let handLandmarkerInstance: HandLandmarker | null = null;
let isInitializing = false;
let initPromise: Promise<HandLandmarker> | null = null;

// Persistent hysteresis state to eliminate jitter
let lastPinchState = false;

export async function getHandLandmarker(): Promise<HandLandmarker> {
  if (handLandmarkerInstance) {
    return handLandmarkerInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  isInitializing = true;
  initPromise = (async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks('/wasm');

      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/models/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      handLandmarkerInstance = landmarker;
      return landmarker;
    } catch (err) {
      console.warn('GPU delegate failed, fallback to CPU:', err);
      const vision = await FilesetResolver.forVisionTasks('/wasm');
      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/models/hand_landmarker.task',
          delegate: 'CPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.4,
        minHandPresenceConfidence: 0.4,
        minTrackingConfidence: 0.4,
      });
      handLandmarkerInstance = landmarker;
      return landmarker;
    } finally {
      isInitializing = false;
    }
  })();

  return initPromise;
}

export function releaseHandLandmarker() {
  if (handLandmarkerInstance) {
    try {
      handLandmarkerInstance.close();
    } catch (e) {
      console.error('Error closing landmarker:', e);
    }
    handLandmarkerInstance = null;
    initPromise = null;
    lastPinchState = false;
  }
}

function euclideanDistance(p1: HandLandmark, p2: HandLandmark): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Detects gestures from 21 MediaPipe hand landmarks.
 * Includes Pinch Anchor Optimization, Hysteresis, and 3D Rotation vectors.
 */
export function classifyHandGesture(
  landmarks: HandLandmark[],
  canvasWidth: number,
  canvasHeight: number,
  mirror: boolean = true,
  pinchThresholdRatio: number = 0.42
): GestureDetectionResult {
  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const indexMcp = landmarks[5];
  const indexPip = landmarks[6];
  const indexTip = landmarks[8];
  const middleMcp = landmarks[9];
  const middlePip = landmarks[10];
  const middleTip = landmarks[12];
  const ringPip = landmarks[14];
  const ringTip = landmarks[16];
  const pinkyPip = landmarks[18];
  const pinkyTip = landmarks[20];

  // 1. Hand scale baseline: distance between wrist (0) and middle MCP (9)
  const handScale = Math.max(0.05, euclideanDistance(wrist, middleMcp));

  // 2. Normalized distance between thumb tip and index tip
  const thumbIndexDist = euclideanDistance(thumbTip, indexTip);
  const normalizedPinchDist = thumbIndexDist / handScale;

  // 3. HYSTERESIS FOR PINCH STATE (Schmitt trigger prevents choppy flickering!)
  // Relaxed threshold: enter at 0.42, exit at 0.57 for effortless drawing
  const enterThreshold = pinchThresholdRatio;
  const exitThreshold = pinchThresholdRatio * 1.35;

  let isPinching = false;
  if (lastPinchState) {
    // If was pinching, must open wider than exitThreshold to release
    isPinching = normalizedPinchDist < exitThreshold;
  } else {
    // If was not pinching, must pinch closer than enterThreshold to start
    isPinching = normalizedPinchDist < enterThreshold;
  }
  lastPinchState = isPinching;

  // 4. PINCH ANCHOR COORDINATE OPTIMIZATION:
  // When pinching, taking indexTip alone causes erratic jumps because index finger bends.
  // Instead, use weighted blend towards midpoint between thumb and index!
  let rawNormX: number;
  let rawNormY: number;

  if (isPinching) {
    // Blend index tip and thumb tip smoothly
    rawNormX = indexTip.x * 0.55 + thumbTip.x * 0.45;
    rawNormY = indexTip.y * 0.55 + thumbTip.y * 0.45;
  } else {
    // Pointer mode: directly on fingertip
    rawNormX = indexTip.x;
    rawNormY = indexTip.y;
  }

  // Mirroring
  if (mirror) {
    rawNormX = 1 - rawNormX;
  }

  // Canvas bounds clamping
  const cursorX = Math.max(0, Math.min(canvasWidth, rawNormX * canvasWidth));
  const cursorY = Math.max(0, Math.min(canvasHeight, rawNormY * canvasHeight));

  // 5. Finger extension states
  const isIndexExtended = euclideanDistance(indexTip, wrist) > euclideanDistance(indexPip, wrist) * 1.05;
  const isMiddleExtended = euclideanDistance(middleTip, wrist) > euclideanDistance(middlePip, wrist) * 1.05;
  const isRingExtended = euclideanDistance(ringTip, wrist) > euclideanDistance(ringPip, wrist) * 1.05;
  const isPinkyExtended = euclideanDistance(pinkyTip, wrist) > euclideanDistance(pinkyPip, wrist) * 1.05;

  let gesture: GestureType = 'none';

  if (isPinching) {
    gesture = 'pinch';
  } else if (!isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    gesture = 'closed_fist';
  } else if (isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended) {
    gesture = 'open_palm';
  } else if (isIndexExtended) {
    gesture = 'pointing';
  } else {
    gesture = 'pointing';
  }

  // 6. 3D HAND MOTION & ORIENTATION EXTRACTION FOR 360° MANIPULATION:
  // Vector v1: wrist -> middle MCP
  const v1 = {
    x: middleMcp.x - wrist.x,
    y: middleMcp.y - wrist.y,
    z: (middleMcp.z || 0) - (wrist.z || 0),
  };
  // Vector v2: wrist -> index MCP
  const v2 = {
    x: indexMcp.x - wrist.x,
    y: indexMcp.y - wrist.y,
    z: (indexMcp.z || 0) - (wrist.z || 0),
  };

  // Cross product N = v1 x v2 (Normal to palm)
  const normX = v1.y * v2.z - v1.z * v2.y;
  const normY = v1.z * v2.x - v1.x * v2.z;
  const normZ = v1.x * v2.y - v1.y * v2.x;

  // Compute 3D Euler angles in degrees
  const yaw = (Math.atan2(normX, normZ) * 180) / Math.PI;
  const pitch = (Math.atan2(-normY, Math.sqrt(normX * normX + normZ * normZ)) * 180) / Math.PI;
  const roll = (Math.atan2(v1.x, -v1.y) * 180) / Math.PI;

  const palmCenter = {
    x: mirror ? 1 - middleMcp.x : middleMcp.x,
    y: middleMcp.y,
    z: middleMcp.z || 0,
  };

  return {
    gesture,
    cursor: { x: cursorX, y: cursorY, time: Date.now() },
    pinchDistance: normalizedPinchDist,
    confidence: 1.0,
    rawLandmarks: landmarks,
    rotation3D: {
      pitch: Math.round(pitch * 10) / 10,
      yaw: Math.round(yaw * 10) / 10,
      roll: Math.round(roll * 10) / 10,
    },
    handScale: Math.round(handScale * 1000) / 1000,
    palmCenter,
  };
}

/**
 * Shared Hand Skeleton Renderer for Camera Video HUD.
 * Renders 21 bones, glowing joints, knuckles, fingertips, and pinch aura.
 */
export function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: HandLandmark[],
  w: number,
  h: number,
  mirror: boolean = true,
  isPinching: boolean = false
) {
  ctx.save();
  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8],       // Index
    [0, 9], [9, 10], [10, 11], [11, 12],   // Middle
    [0, 13], [13, 14], [14, 15], [15, 16], // Ring
    [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
    [5, 9], [9, 13], [13, 17],             // Palm Arch
  ];

  // 1. Draw glowing bone connection lines
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = isPinching ? 'rgba(16, 185, 129, 0.85)' : 'rgba(99, 102, 241, 0.75)';

  for (const [i, j] of connections) {
    const p1 = landmarks[i];
    const p2 = landmarks[j];
    const x1 = mirror ? (1 - p1.x) * w : p1.x * w;
    const y1 = p1.y * h;
    const x2 = mirror ? (1 - p2.x) * w : p2.x * w;
    const y2 = p2.y * h;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // 2. Line between thumb tip and index tip if close
  const thumb = landmarks[4];
  const index = landmarks[8];
  const tx = mirror ? (1 - thumb.x) * w : thumb.x * w;
  const ty = thumb.y * h;
  const ix = mirror ? (1 - index.x) * w : index.x * w;
  const iy = index.y * h;

  ctx.beginPath();
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = isPinching ? '#10b981' : 'rgba(245, 158, 11, 0.6)';
  ctx.moveTo(tx, ty);
  ctx.lineTo(ix, iy);
  ctx.stroke();
  ctx.setLineDash([]);

  // 3. Draw landmark joints
  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];
    const x = mirror ? (1 - lm.x) * w : lm.x * w;
    const y = lm.y * h;

    ctx.beginPath();
    if (i === 8) {
      // Index Tip (Pen / Cursor Pointer)
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = isPinching ? '#10b981' : '#6366f1';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    } else if (i === 4) {
      // Thumb Tip
      ctx.arc(x, y, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = isPinching ? '#10b981' : '#f59e0b';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    } else if (i === 0) {
      // Wrist
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#06b6d4';
      ctx.fill();
    } else if ([12, 16, 20].includes(i)) {
      // Other fingertips
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#818cf8';
      ctx.fill();
    } else {
      // Knuckles
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fill();
    }
  }

  ctx.restore();
}
