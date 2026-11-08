import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  DrawingSettings,
  GestureDetectionResult,
  Point,
  RecognitionResultData,
  Stroke,
  Tutorial3DModel,
  Tutorial3DStep,
} from '../types';
import { CameraFeed } from '../components/CameraFeed';
import { CanvasBoard, CanvasBoardRef } from '../components/CanvasBoard';
import { GestureIndicator } from '../components/GestureIndicator';
import { Tutorial3DOverlay } from '../components/Tutorial3DOverlay';
import { LIVE_3D_TUTORIALS } from '../services/templates';
import { analyze2DGeometry } from '../services/geometryRecognizer';
import { analyze3DWireframe } from '../services/geometry3DRecognizer';
import {
  Sparkles,
  Layers,
  HelpCircle,
  AlertCircle,
  Lightbulb,
  Box,
  GraduationCap,
} from 'lucide-react';

interface InteractiveCameraProps {
  settings: DrawingSettings;
  onUpdateSettings: (newSettings: Partial<DrawingSettings>) => void;
  onFinishRecognition: (result: RecognitionResultData) => void;
  targetShape?: string | null;
}

export const InteractiveCamera: React.FC<InteractiveCameraProps> = ({
  settings,
  onUpdateSettings,
  onFinishRecognition,
  targetShape,
}) => {
  const canvasBoardRef = useRef<CanvasBoardRef>(null);

  const [currentGestureResult, setCurrentGestureResult] = useState<GestureDetectionResult>({
    gesture: 'none',
    cursor: { x: 300, y: 200 },
    pinchDistance: 1.0,
    confidence: 0,
    fistHoldProgress: 0,
  });

  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [activeDimension, setActiveDimension] = useState<'2D' | '3D'>('2D');
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({
    width: 640,
    height: 480,
  });

  // 3D Tutorial Mode State
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [activeTutorialStep, setActiveTutorialStep] = useState<Tutorial3DStep | null>(null);

  // Track canvas container size
  const boardContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const updateSize = () => {
      if (boardContainerRef.current) {
        const rect = boardContainerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setCanvasDimensions({
            width: Math.floor(rect.width),
            height: Math.floor(rect.height),
          });
        }
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // When target shape is passed, align dimension & template
  useEffect(() => {
    if (targetShape) {
      const lower = targetShape.toLowerCase();
      if (
        lower.includes('cube') ||
        lower.includes('kubus') ||
        lower.includes('balok') ||
        lower.includes('pyramid') ||
        lower.includes('limas') ||
        lower.includes('prism') ||
        lower.includes('rumah')
      ) {
        setActiveDimension('3D');
      }
    }
  }, [targetShape]);

  // Handle hand point update from CameraFeed
  const handleHandPoint = useCallback((point: Point, isPinch: boolean) => {
    setIsDrawing(isPinch);
    if (canvasBoardRef.current) {
      canvasBoardRef.current.addHandPoint(point, isPinch);
    }
  }, []);

  // Handle gesture detection result update
  const handleGestureDetected = useCallback((result: GestureDetectionResult) => {
    setCurrentGestureResult(result);
  }, []);

  // Finish drawing triggered by user button or closed fist gesture
  const handleFinish = useCallback(
    (strokes: Stroke[], snapshotDataUrl: string) => {
      let result: RecognitionResultData;
      if (activeDimension === '3D') {
        result = analyze3DWireframe(strokes, snapshotDataUrl, targetShape);
      } else {
        result = analyze2DGeometry(strokes, snapshotDataUrl, targetShape);
      }
      onFinishRecognition(result);
    },
    [activeDimension, onFinishRecognition]
  );

  const handleFinishGesture = useCallback(() => {
    if (canvasBoardRef.current) {
      const strokes = canvasBoardRef.current.getStrokes();
      if (strokes.length > 0) {
        canvasBoardRef.current.finishDrawing();
      }
    }
  }, []);

  const handleTutorialStepSelect = (model: Tutorial3DModel | null, stepIndex: number) => {
    if (model && model.steps[stepIndex]) {
      setActiveTutorialStep(model.steps[stepIndex]);
      setActiveDimension('3D');
      // Set matching template
      onUpdateSettings({ showTemplate: true, templateShape: model.id });
    } else {
      setActiveTutorialStep(null);
    }
  };

  const handleToggleTutorial = () => {
    const nextVal = !showTutorial;
    setShowTutorial(nextVal);
    if (nextVal) {
      setActiveDimension('3D');
      const defaultModel = LIVE_3D_TUTORIALS[0];
      setActiveTutorialStep(defaultModel.steps[0]);
      onUpdateSettings({ showTemplate: true, templateShape: defaultModel.id });
    } else {
      setActiveTutorialStep(null);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top HUD: Mode Selector & Gesture Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-200/80 p-1 rounded-2xl shadow-inner">
            <button
              onClick={() => setActiveDimension('2D')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeDimension === '2D'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Bentuk 2D</span>
            </button>
            <button
              onClick={() => setActiveDimension('3D')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeDimension === '3D'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Bangun Ruang 3D</span>
            </button>
          </div>

          {/* Tutorial 3D Toggle Button */}
          <button
            onClick={handleToggleTutorial}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-extrabold shadow-sm transition-all ${
              showTutorial
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white ring-2 ring-amber-300'
                : 'bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>{showTutorial ? 'Tutup Tutorial 3D' : 'Panduan Kamera 3D'}</span>
          </button>

          {targetShape && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shadow-xs">
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
              <span>Target: {targetShape}</span>
            </div>
          )}
        </div>

        {/* Engine status indicator */}
        <div className="text-xs text-slate-500 font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Local Engine (Tanpa Batas Kuota Cloud)</span>
        </div>
      </div>

      {/* Main Interactive Stage: Video Feed (Left) & Canvas Board (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[580px]">
        {/* Left Column: Camera Feed & Real-time Gesture HUD */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <CameraFeed
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            onGestureDetected={handleGestureDetected}
            onHandPoint={handleHandPoint}
            onFinishGestureTrigger={handleFinishGesture}
            canvasDimensions={canvasDimensions}
            activeTutorialStep={activeTutorialStep}
          />

          {/* Interactive Tutorial 3D Overlay Widget (if opened) */}
          {showTutorial && (
            <Tutorial3DOverlay
              onSelectTutorial={handleTutorialStepSelect}
              onClose={() => {
                setShowTutorial(false);
                setActiveTutorialStep(null);
              }}
            />
          )}

          {/* Gesture Detection Feedback Card */}
          <GestureIndicator
            gesture={currentGestureResult.gesture}
            pinchDistance={currentGestureResult.pinchDistance}
            pinchThreshold={settings.pinchThreshold}
            isDrawing={isDrawing}
            fistProgress={currentGestureResult.fistHoldProgress}
          />

          {/* Gesture Guide & Anti-Accidental trigger note */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm text-xs space-y-2">
            <span className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider">
              Panduan Gerakan Tangan
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-600">
              <div className="p-2 bg-slate-50 rounded-xl">
                <span className="font-bold text-slate-800 block">👆 Telunjuk:</span> Gerakkan kursor
              </div>
              <div className="p-2 bg-slate-50 rounded-xl">
                <span className="font-bold text-slate-800 block">👌 Jepit:</span> Menggambar
              </div>
              <div className="p-2 bg-slate-50 rounded-xl">
                <span className="font-bold text-slate-800 block">🖐️ Telapak:</span> Jeda goresan
              </div>
              <div className="p-2 bg-slate-50 rounded-xl">
                <span className="font-bold text-slate-800 block">✊ Kepal:</span> Tahan 2 detik (Selesai)
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Virtual Canvas Drawing Board */}
        <div ref={boardContainerRef} className="lg:col-span-8 flex flex-col min-h-[480px]">
          <CanvasBoard
            ref={canvasBoardRef}
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            onFinish={handleFinish}
            targetShapeName={targetShape}
            activeDimension={activeDimension}
            activeTutorialStep={activeTutorialStep}
          />
        </div>
      </div>
    </div>
  );
};
