import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  DrawingSettings,
  GestureDetectionResult,
  GestureType,
  HandLandmark,
  Point,
  Tutorial3DStep,
} from '../types';
import { getHandLandmarker, classifyHandGesture, drawHandSkeleton } from '../services/handTracker';
import { CursorSmoother, GestureDebouncer } from '../services/smoothing';
import { sounds } from '../services/sound';
import {
  Camera,
  CameraOff,
  FlipHorizontal,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Lock,
} from 'lucide-react';

interface CameraFeedProps {
  settings: DrawingSettings;
  onUpdateSettings: (newSettings: Partial<DrawingSettings>) => void;
  onGestureDetected: (result: GestureDetectionResult) => void;
  onHandPoint: (point: Point, isPinch: boolean) => void;
  onFinishGestureTrigger: () => void;
  canvasDimensions: { width: number; height: number };
  activeTutorialStep?: Tutorial3DStep | null;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({
  settings,
  onUpdateSettings,
  onGestureDetected,
  onHandPoint,
  onFinishGestureTrigger,
  canvasDimensions,
  activeTutorialStep,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [modelLoading, setModelLoading] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [handDetected, setHandDetected] = useState<boolean>(false);
  const [currentFps, setCurrentFps] = useState<number>(0);

  // Fist hold-to-trigger countdown state
  const fistStartTimeRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(0);
  const [fistHoldProgress, setFistHoldProgress] = useState<number>(0);

  // Toggle Mode Pen Lock State
  const penLockedRef = useRef<boolean>(false);
  const prevPinchGestureRef = useRef<boolean>(false);
  const [isPenLocked, setIsPenLocked] = useState<boolean>(false);

  // Filters & State Keepers
  const smootherRef = useRef<CursorSmoother>(new CursorSmoother(settings.smoothFactor));
  const debouncerRef = useRef<GestureDebouncer<GestureType>>(new GestureDebouncer('none', 2));
  const animFrameIdRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const lastFrameCountRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(Date.now());
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    smootherRef.current.setAlpha(settings.smoothFactor);
    smootherRef.current.setStabilizer(settings.stabilizerLevel || 'stable');
  }, [settings.smoothFactor, settings.stabilizerLevel]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreamActive(true);
    } catch (err: any) {
      console.error('Camera stream error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Izin kamera ditolak. Mohon aktifkan akses kamera di browser Anda.'
          : 'Tidak dapat mengakses kamera. Silakan periksa koneksi webcam atau gunakan mouse/layar sentuh.'
      );
      setStreamActive(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        setModelLoading(true);
        await getHandLandmarker();
        if (isMounted) {
          setModelLoading(false);
          await startCamera();
        }
      } catch (e: any) {
        console.error('Failed to initialize MediaPipe Hand Landmarker:', e);
        if (isMounted) {
          setModelLoading(false);
          setCameraError('Gagal memuat model AI Hand Landmarker lokal.');
        }
      }
    }

    init();

    return () => {
      isMounted = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [startCamera]);

  // Main Detection and Rendering Loop
  useEffect(() => {
    let isActive = true;

    async function processLoop() {
      if (!isActive) return;

      const video = videoRef.current;
      const overlayCanvas = overlayCanvasRef.current;

      if (video && video.readyState >= 2 && !modelLoading && streamActive) {
        const landmarker = await getHandLandmarker();

        if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          const startTimeMs = performance.now();

          // Calculate FPS
          lastFrameCountRef.current++;
          const now = Date.now();
          if (now - lastFpsUpdateRef.current >= 1000) {
            setCurrentFps(lastFrameCountRef.current);
            lastFrameCountRef.current = 0;
            lastFpsUpdateRef.current = now;
          }

          // Inference
          const result = landmarker.detectForVideo(video, startTimeMs);

          // Render landmarks on video overlay if enabled
          if (overlayCanvas) {
            const ctx = overlayCanvas.getContext('2d');
            if (ctx) {
              if (overlayCanvas.width !== video.videoWidth || overlayCanvas.height !== video.videoHeight) {
                overlayCanvas.width = video.videoWidth;
                overlayCanvas.height = video.videoHeight;
              }
              ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

              // 1. Render Active 3D Tutorial Step Guide Lines
              if (activeTutorialStep && activeTutorialStep.lines.length > 0) {
                drawTutorialOverlay(ctx, activeTutorialStep, overlayCanvas.width, overlayCanvas.height, settings.mirrorCamera);
              }

              // 2. Render Hand Landmarks
              if (result.landmarks && result.landmarks.length > 0 && settings.showLandmarks) {
                const lms = result.landmarks[0];
                drawHandSkeleton(ctx, lms, overlayCanvas.width, overlayCanvas.height, settings.mirrorCamera, prevPinchGestureRef.current);
              }
            }
          }

          if (result.landmarks && result.landmarks.length > 0) {
            setHandDetected(true);
            const rawLandmarks = result.landmarks[0] as HandLandmark[];

            // Classify Gesture with calibrated threshold & hysteresis
            const detection = classifyHandGesture(
              rawLandmarks,
              canvasDimensions.width,
              canvasDimensions.height,
              settings.mirrorCamera,
              settings.pinchThreshold
            );

            // Debounce Gesture
            const filteredGesture = debouncerRef.current.update(detection.gesture);
            detection.gesture = filteredGesture;

            // Smooth Cursor with Adaptive Stabilizer
            const smoothedCursor = smootherRef.current.update(detection.cursor);
            detection.cursor = smoothedCursor;

            // ================= GESTURE FINISH COUNTDOWN LOGIC =================
            if (filteredGesture === 'closed_fist' && settings.gestureFinishEnabled) {
              if (!fistStartTimeRef.current) {
                fistStartTimeRef.current = Date.now();
              }
              const elapsed = Date.now() - fistStartTimeRef.current;
              const requiredDuration = settings.fistHoldDuration || 1800;
              const progress = Math.min(1.0, elapsed / requiredDuration);
              setFistHoldProgress(progress);
              detection.fistHoldProgress = progress;

              // Gentle tick sound
              if (Date.now() - lastTickTimeRef.current > 400 && progress < 0.95) {
                sounds.playCountTick();
                lastTickTimeRef.current = Date.now();
              }

              if (progress >= 1.0) {
                fistStartTimeRef.current = null;
                setFistHoldProgress(0);
                onFinishGestureTrigger();
              }
            } else {
              if (fistStartTimeRef.current !== null) {
                fistStartTimeRef.current = null;
                setFistHoldProgress(0);
              }
              detection.fistHoldProgress = 0;
            }

            // ================= DRAWING MODES LOGIC =================
            let isDrawingActive = false;

            if (settings.drawMode === 'toggle') {
              // Mode Kunci Pena: Pinch once to lock pen ON, pinch again to lock OFF
              const isRawPinch = filteredGesture === 'pinch';
              if (isRawPinch && !prevPinchGestureRef.current) {
                penLockedRef.current = !penLockedRef.current;
                setIsPenLocked(penLockedRef.current);
                if (penLockedRef.current) {
                  sounds.playPinchStart();
                } else {
                  sounds.playPinchRelease();
                }
              }
              prevPinchGestureRef.current = isRawPinch;
              isDrawingActive = penLockedRef.current;
            } else if (settings.drawMode === 'point') {
              // Mode Tunjuk Bebas: Extending index finger draws continuously
              isDrawingActive = filteredGesture === 'pointing' || filteredGesture === 'pinch';
            } else {
              // Default: Mode Jepit Tahan (Pinch & Hold) with hysteresis
              isDrawingActive = filteredGesture === 'pinch';
            }

            onGestureDetected(detection);
            onHandPoint(smoothedCursor, isDrawingActive);
          } else {
            setHandDetected(false);
            smootherRef.current.reset();
            if (fistStartTimeRef.current !== null) {
              fistStartTimeRef.current = null;
              setFistHoldProgress(0);
            }
            onGestureDetected({
              gesture: 'none',
              cursor: { x: canvasDimensions.width / 2, y: canvasDimensions.height / 2 },
              pinchDistance: 1.0,
              confidence: 0,
              fistHoldProgress: 0,
            });
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(processLoop);
    }

    animFrameIdRef.current = requestAnimationFrame(processLoop);

    return () => {
      isActive = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [
    modelLoading,
    streamActive,
    settings.mirrorCamera,
    settings.pinchThreshold,
    settings.showLandmarks,
    settings.gestureFinishEnabled,
    settings.fistHoldDuration,
    settings.drawMode,
    canvasDimensions,
    activeTutorialStep,
    onGestureDetected,
    onHandPoint,
    onFinishGestureTrigger,
  ]);

  // Tutorial lines overlay directly on camera
  const drawTutorialOverlay = (
    ctx: CanvasRenderingContext2D,
    step: Tutorial3DStep,
    w: number,
    h: number,
    mirror: boolean
  ) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([10, 8]);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const line of step.lines) {
      const x1 = mirror ? (1 - line.from.x) * w : line.from.x * w;
      const y1 = line.from.y * h;
      const x2 = mirror ? (1 - line.to.x) * w : line.to.x * w;
      const y2 = line.to.y * h;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    if (step.highlightPoints) {
      ctx.setLineDash([]);
      for (const pt of step.highlightPoints) {
        const x = mirror ? (1 - pt.x) * w : pt.x * w;
        const y = pt.y * h;

        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();

        if (pt.label) {
          ctx.font = 'bold 12px sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 4;
          ctx.fillText(pt.label, x + 10, y - 10);
        }
      }
    }
    ctx.restore();
  };

  // Landmark Drawing Helper for camera HUD
  const drawLandmarks = (
    ctx: CanvasRenderingContext2D,
    landmarks: HandLandmark[],
    w: number,
    h: number,
    mirror: boolean
  ) => {
    ctx.save();
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20],
      [5, 9], [9, 13], [13, 17],
    ];

    ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
    ctx.lineWidth = 2;

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

    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      const x = mirror ? (1 - lm.x) * w : lm.x * w;
      const y = lm.y * h;

      ctx.beginPath();
      if (i === 8) {
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#4f46e5';
      } else if (i === 4) {
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
      } else {
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      }
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  };

  return (
    <div className="relative flex flex-col bg-slate-900 rounded-3xl overflow-hidden border border-slate-700/80 shadow-lg">
      {/* Top Camera Status Bar */}
      <div className="px-3.5 py-2.5 bg-slate-950/80 backdrop-blur-xs border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                handDetected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="font-bold text-white">
              {modelLoading
                ? 'Memuat AI Model...'
                : handDetected
                ? 'Tangan Terdeteksi'
                : 'Mencari Tangan'}
            </span>
          </div>

          {settings.drawMode === 'toggle' && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isPenLocked
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Lock className="w-3 h-3" />
              {isPenLocked ? 'Pena Terkunci' : 'Pena Terangkat'}
            </span>
          )}

          {currentFps > 0 && (
            <span className="text-[10px] text-slate-400 font-mono bg-slate-800/80 px-1.5 py-0.5 rounded">
              {currentFps} FPS
            </span>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onUpdateSettings({ mirrorCamera: !settings.mirrorCamera })}
            title={settings.mirrorCamera ? 'Matikan Mirror' : 'Aktifkan Mirror'}
            className={`p-1.5 rounded-lg border transition-all ${
              settings.mirrorCamera
                ? 'bg-indigo-600/60 border-indigo-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onUpdateSettings({ showLandmarks: !settings.showLandmarks })}
            title={settings.showLandmarks ? 'Sembunyikan Titik Tulang' : 'Tampilkan Titik Tulang'}
            className={`p-1.5 rounded-lg border transition-all ${
              settings.showLandmarks
                ? 'bg-indigo-600/60 border-indigo-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {settings.showLandmarks ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Video & Overlay Viewport */}
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Loading Spinner */}
        {modelLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-30 text-white px-4 text-center">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-2" />
            <p className="text-sm font-bold">Memuat Model AI MediaPipe Lokal...</p>
            <p className="text-xs text-slate-400 mt-1">Berjalan 100% offline di browsermu</p>
          </div>
        )}

        {/* Camera Error Message */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 z-30 text-white px-6 text-center">
            <CameraOff className="w-10 h-10 text-rose-400 mb-2" />
            <p className="text-sm font-bold text-rose-200">{cameraError}</p>
            <button
              onClick={startCamera}
              className="mt-3 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Coba Ulang Kamera
            </button>
          </div>
        )}

        {/* Video Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover transition-transform duration-150 ${
            settings.mirrorCamera ? 'scale-x-[-1]' : ''
          }`}
        />

        {/* Landmarks Canvas Overlay */}
        <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />

        {/* FIST HOLD COUNTDOWN PROGRESS OVERLAY */}
        {fistHoldProgress > 0 && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs select-none pointer-events-none animate-fadeIn">
            <div className="relative flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-700"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-purple-400 transition-all duration-75"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 * (1 - fistHoldProgress)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute text-2xl font-black text-white">
                {Math.ceil((1 - fistHoldProgress) * 2)}s
              </span>
            </div>
            <p className="text-xs font-extrabold text-purple-200 uppercase tracking-wider mt-3">
              Tahan Kepalan Tangan...
            </p>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Lepaskan tangan jika ingin membatalkan!
            </p>
          </div>
        )}

        {/* Hand Guide Silhouette if no hand in frame */}
        {!handDetected && !modelLoading && !cameraError && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-black/30 z-20 select-none">
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-indigo-300/60 flex items-center justify-center text-white/70 animate-pulse">
              <Camera className="w-7 h-7 opacity-70" />
            </div>
            <p className="text-xs text-white/90 font-semibold mt-3 px-3 py-1 bg-black/60 rounded-full backdrop-blur-xs">
              Arahkan tangan ke depan kamera
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
