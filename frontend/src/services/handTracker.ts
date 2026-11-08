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
  pinchThresholdRatio: number = 0.32
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
  const enterThreshold = pinchThresholdRatio;
  const exitThreshold = pinchThresholdRatio * 1.35; // 35% higher to release

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
    rawNormX = (indexTip.x * 0.55 + thumbTip.x * 0.45);
    rawNormY = (indexTip.y * 0.55 + thumbTip.y * 0.45);
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
