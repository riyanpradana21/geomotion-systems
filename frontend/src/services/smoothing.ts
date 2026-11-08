import { Point } from '../types';

export class CursorSmoother {
  private current: Point | null = null;
  private baseAlpha: number;
  private stabilizerLevel: 'soft' | 'stable' | 'ultra' = 'stable';

  constructor(alpha: number = 0.35) {
    this.baseAlpha = alpha;
  }

  public setAlpha(alpha: number) {
    this.baseAlpha = Math.max(0.05, Math.min(0.95, alpha));
  }

  public setStabilizer(level: 'soft' | 'stable' | 'ultra') {
    this.stabilizerLevel = level;
  }

  /**
   * Adaptive Velocity-Aware Filter:
   * Smooths micro-jitters when drawing slowly, reduces lag when moving swiftly!
   */
  public update(target: Point): Point {
    if (!this.current) {
      this.current = { ...target };
      return this.current;
    }

    const dist = Math.hypot(target.x - this.current.x, target.y - this.current.y);

    let multiplier = 1.0;
    if (this.stabilizerLevel === 'ultra') {
      multiplier = 0.65;
    } else if (this.stabilizerLevel === 'stable') {
      multiplier = 0.85;
    } else {
      multiplier = 1.1;
    }

    // Dynamic alpha based on velocity
    let dynamicAlpha = this.baseAlpha * multiplier;
    if (dist < 4) {
      // Very small tremor: strong dampening
      dynamicAlpha *= 0.45;
    } else if (dist < 15) {
      // Moderate drawing speed
      dynamicAlpha *= 0.8;
    } else if (dist > 45) {
      // Fast movement: respond quickly to prevent dragging lag
      dynamicAlpha = Math.min(0.85, dynamicAlpha * 1.4);
    }

    this.current = {
      x: this.current.x + dynamicAlpha * (target.x - this.current.x),
      y: this.current.y + dynamicAlpha * (target.y - this.current.y),
      time: target.time || Date.now(),
    };

    return this.current;
  }

  public reset() {
    this.current = null;
  }
}

export class GestureDebouncer<T extends string> {
  private currentGesture: T;
  private candidateGesture: T;
  private candidateCount: number = 0;
  private thresholdFrames: number;

  constructor(initial: T, thresholdFrames: number = 3) {
    this.currentGesture = initial;
    this.candidateGesture = initial;
    this.thresholdFrames = thresholdFrames;
  }

  public update(detected: T): T {
    if (detected === this.currentGesture) {
      this.candidateCount = 0;
      return this.currentGesture;
    }

    if (detected === this.candidateGesture) {
      this.candidateCount++;
      if (this.candidateCount >= this.thresholdFrames) {
        this.currentGesture = detected;
        this.candidateCount = 0;
      }
    } else {
      this.candidateGesture = detected;
      this.candidateCount = 1;
    }

    return this.currentGesture;
  }

  public reset(initial: T) {
    this.currentGesture = initial;
    this.candidateGesture = initial;
    this.candidateCount = 0;
  }
}

/**
 * Draws smoothed stroke path onto canvas context using quadratic curves between midpoints.
 */
export function drawSmoothedStroke(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  width: number
) {
  if (points.length === 0) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (points.length === 2) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }

  // Draw last segment
  const lastIndex = points.length - 1;
  ctx.lineTo(points[lastIndex].x, points[lastIndex].y);
  ctx.stroke();
  ctx.restore();
}
