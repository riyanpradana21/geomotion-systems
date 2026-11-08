import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Point, Stroke, DrawingSettings, Tutorial3DStep } from '../types';
import { drawSmoothedStroke } from '../services/smoothing';
import { renderTemplateOnCanvas, SHAPE_TEMPLATES } from '../services/templates';
import { autoCorrectDrawing } from '../services/autoCorrect';
import {
  Undo2,
  Trash2,
  CheckCircle2,
  Palette,
  Sparkles,
  Wand2,
  Layers,
  Eye,
  EyeOff,
  RotateCcw,
  Hand,
  Sliders,
} from 'lucide-react';
import { sounds } from '../services/sound';

export interface CanvasBoardRef {
  addHandPoint: (point: Point, isPinchDrawing: boolean) => void;
  getCanvasSnapshot: () => string;
  clearCanvas: () => void;
  getStrokes: () => Stroke[];
  finishDrawing: () => void;
}

interface CanvasBoardProps {
  settings: DrawingSettings;
  onUpdateSettings: (newSettings: Partial<DrawingSettings>) => void;
  onFinish: (strokes: Stroke[], snapshotDataUrl: string) => void;
  targetShapeName?: string | null;
  activeDimension?: '2D' | '3D';
  activeTutorialStep?: Tutorial3DStep | null;
}

const PALETTE = [
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Slate', value: '#334155' },
];

const PEN_WIDTHS = [
  { label: 'Halus', width: 4 },
  { label: 'Sedang', width: 8 },
  { label: 'Tebal', width: 14 },
];

export const CanvasBoard = forwardRef<CanvasBoardRef, CanvasBoardProps>(
  (
    {
      settings,
      onUpdateSettings,
      onFinish,
      targetShapeName,
      activeDimension = '2D',
      activeTutorialStep,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cursorCanvasRef = useRef<HTMLCanvasElement>(null);

    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [rawStrokesBackup, setRawStrokesBackup] = useState<Stroke[] | null>(null);
    const [autoCorrectMessage, setAutoCorrectMessage] = useState<string | null>(null);

    const currentStrokeRef = useRef<Point[]>([]);
    const isPinchingRef = useRef<boolean>(false);
    const cursorRef = useRef<Point | null>(null);

    // Mouse / Touch drawing fallback state
    const isMouseDrawingRef = useRef<boolean>(false);

    // Redraw all strokes and background templates on canvas
    const redrawAllStrokes = useCallback(
      (ctx: CanvasRenderingContext2D, strokeList: Stroke[], activeStroke?: Point[]) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // 1. Subtle grid pattern for drawing board feel
        const gridSize = 40;
        ctx.save();
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        for (let x = 0; x < ctx.canvas.width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, ctx.canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < ctx.canvas.height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(ctx.canvas.width, y);
          ctx.stroke();
        }
        ctx.restore();

        // 2. RENDER POLA TIPIS (GHOST TEMPLATE / TRACING GUIDE)
        if (settings.showTemplate && settings.templateShape && settings.templateShape !== 'none') {
          renderTemplateOnCanvas(
            ctx,
            settings.templateShape,
            ctx.canvas.width,
            ctx.canvas.height,
            settings.templateOpacity || 0.35
          );
        }

        // 3. RENDER TUTORIAL STEP GUIDE (if active)
        if (activeTutorialStep && activeTutorialStep.lines.length > 0) {
          ctx.save();
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 3;
          ctx.setLineDash([10, 8]);
          ctx.lineCap = 'round';
          for (const line of activeTutorialStep.lines) {
            ctx.beginPath();
            ctx.moveTo(line.from.x * ctx.canvas.width, line.from.y * ctx.canvas.height);
            ctx.lineTo(line.to.x * ctx.canvas.width, line.to.y * ctx.canvas.height);
            ctx.stroke();
          }
          ctx.restore();
        }

        // 4. Draw saved strokes
        for (const stroke of strokeList) {
          drawSmoothedStroke(ctx, stroke, settings.penColor, settings.penWidth);
        }

        // 5. Draw active in-progress stroke
        if (activeStroke && activeStroke.length > 0) {
          drawSmoothedStroke(ctx, activeStroke, settings.penColor, settings.penWidth);
        }
      },
      [
        settings.penColor,
        settings.penWidth,
        settings.showTemplate,
        settings.templateShape,
        settings.templateOpacity,
        activeTutorialStep,
      ]
    );

    // Redraw cursor overlay
    const renderCursorOverlay = useCallback(() => {
      const canvas = cursorCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pt = cursorRef.current;
      if (!pt) return;

      const isDrawing = isPinchingRef.current || isMouseDrawingRef.current;

      ctx.save();
      // Outer aura ring
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isDrawing ? 22 : 16, 0, Math.PI * 2);
      ctx.fillStyle = isDrawing ? 'rgba(16, 185, 129, 0.25)' : 'rgba(99, 102, 241, 0.2)';
      ctx.fill();

      // Border ring
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isDrawing ? 15 : 10, 0, Math.PI * 2);
      ctx.strokeStyle = isDrawing ? '#10b981' : '#4f46e5';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Center solid dot
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = isDrawing ? '#059669' : '#4338ca';
      ctx.fill();

      // Crosshair lines
      ctx.strokeStyle = isDrawing ? 'rgba(16, 185, 129, 0.7)' : 'rgba(99, 102, 241, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pt.x - 24, pt.y);
      ctx.lineTo(pt.x - 12, pt.y);
      ctx.moveTo(pt.x + 12, pt.y);
      ctx.lineTo(pt.x + 24, pt.y);
      ctx.moveTo(pt.x, pt.y - 24);
      ctx.lineTo(pt.x, pt.y - 12);
      ctx.moveTo(pt.x, pt.y + 12);
      ctx.lineTo(pt.x, pt.y + 24);
      ctx.stroke();

      ctx.restore();
    }, []);

    // Resize handling to match container dimensions
    useEffect(() => {
      const resize = () => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        const cursorCanvas = cursorCanvasRef.current;
        if (!container || !canvas || !cursorCanvas) return;

        const rect = container.getBoundingClientRect();
        const width = Math.floor(rect.width);
        const height = Math.floor(rect.height);

        if (width > 0 && height > 0) {
          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            cursorCanvas.width = width;
            cursorCanvas.height = height;

            const ctx = canvas.getContext('2d');
            if (ctx) redrawAllStrokes(ctx, strokes, currentStrokeRef.current);
          }
        }
      };

      resize();
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
    }, [strokes, redrawAllStrokes]);

    // Redraw whenever template or tutorial step changes
    useEffect(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) redrawAllStrokes(ctx, strokes, currentStrokeRef.current);
      }
    }, [settings.showTemplate, settings.templateShape, settings.templateOpacity, activeTutorialStep, strokes, redrawAllStrokes]);

    // Imperative API for Parent Component
    useImperativeHandle(
      ref,
      () => ({
        addHandPoint: (point: Point, isPinchDrawing: boolean) => {
          cursorRef.current = point;

          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Transition: Started Pinch
          if (isPinchDrawing && !isPinchingRef.current) {
            isPinchingRef.current = true;
            currentStrokeRef.current = [point];
            sounds.playPinchStart();
          }
          // Transition: Continuing Pinch
          else if (isPinchDrawing && isPinchingRef.current) {
            currentStrokeRef.current.push(point);
            redrawAllStrokes(ctx, strokes, currentStrokeRef.current);
          }
          // Transition: Released Pinch
          else if (!isPinchDrawing && isPinchingRef.current) {
            isPinchingRef.current = false;
            sounds.playPinchRelease();
            if (currentStrokeRef.current.length > 1) {
              const newStrokes = [...strokes, [...currentStrokeRef.current]];
              setStrokes(newStrokes);
              currentStrokeRef.current = [];
              redrawAllStrokes(ctx, newStrokes);
            } else {
              currentStrokeRef.current = [];
              redrawAllStrokes(ctx, strokes);
            }
          }

          renderCursorOverlay();
        },

        getCanvasSnapshot: () => {
          const canvas = canvasRef.current;
          if (!canvas) return '';
          return canvas.toDataURL('image/png');
        },

        clearCanvas: () => {
          setStrokes([]);
          setRawStrokesBackup(null);
          setAutoCorrectMessage(null);
          currentStrokeRef.current = [];
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) redrawAllStrokes(ctx, []);
          }
        },

        getStrokes: () => strokes,

        finishDrawing: () => {
          const canvas = canvasRef.current;
          const snapshot = canvas ? canvas.toDataURL('image/png') : '';
          sounds.playSuccess();
          onFinish(strokes, snapshot);
        },
      }),
      [strokes, redrawAllStrokes, renderCursorOverlay, onFinish]
    );

    // Mouse & Touch Fallback Handlers
    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pt: Point = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        time: Date.now(),
      };
      isMouseDrawingRef.current = true;
      cursorRef.current = pt;
      currentStrokeRef.current = [pt];
      sounds.playPinchStart();
      renderCursorOverlay();
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pt: Point = {
        x: Math.max(0, Math.min(rect.width, e.clientX - rect.left)),
        y: Math.max(0, Math.min(rect.height, e.clientY - rect.top)),
        time: Date.now(),
      };
      cursorRef.current = pt;

      if (isMouseDrawingRef.current) {
        currentStrokeRef.current.push(pt);
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) redrawAllStrokes(ctx, strokes, currentStrokeRef.current);
        }
      }
      renderCursorOverlay();
    };

    const handlePointerUp = () => {
      if (isMouseDrawingRef.current) {
        isMouseDrawingRef.current = false;
        sounds.playPinchRelease();
        if (currentStrokeRef.current.length > 1) {
          const newStrokes = [...strokes, [...currentStrokeRef.current]];
          setStrokes(newStrokes);
          currentStrokeRef.current = [];
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) redrawAllStrokes(ctx, newStrokes);
          }
        } else {
          currentStrokeRef.current = [];
        }
      }
      renderCursorOverlay();
    };

    const handleUndo = () => {
      if (strokes.length === 0) return;
      const newStrokes = strokes.slice(0, -1);
      setStrokes(newStrokes);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) redrawAllStrokes(ctx, newStrokes);
      }
    };

    const handleClear = () => {
      setStrokes([]);
      setRawStrokesBackup(null);
      setAutoCorrectMessage(null);
      currentStrokeRef.current = [];
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) redrawAllStrokes(ctx, []);
      }
    };

    // ================= AUTO-CORRECT TRIGGER =================
    const handleAutoCorrect = () => {
      if (strokes.length === 0) return;
      // Backup original raw strokes if not already backed up
      if (!rawStrokesBackup) {
        setRawStrokesBackup([...strokes]);
      }

      const res = autoCorrectDrawing(strokes, activeDimension, targetShapeName || settings.templateShape);
      if (res.success) {
        setStrokes(res.correctedStrokes);
        setAutoCorrectMessage(res.message);
        sounds.playMagicSparkle();
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) redrawAllStrokes(ctx, res.correctedStrokes);
        }
      } else {
        setAutoCorrectMessage(res.message);
      }
    };

    const handleRevertAutoCorrect = () => {
      if (rawStrokesBackup) {
        setStrokes(rawStrokesBackup);
        setRawStrokesBackup(null);
        setAutoCorrectMessage(null);
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) redrawAllStrokes(ctx, rawStrokesBackup);
        }
      }
    };

    const handleFinish = () => {
      const canvas = canvasRef.current;
      const snapshot = canvas ? canvas.toDataURL('image/png') : '';
      sounds.playSuccess();
      onFinish(strokes, snapshot);
    };

    return (
      <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
        {/* Top Board Toolbar */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5 select-none text-xs">
          {/* Target & Template Selector */}
          <div className="flex items-center gap-2">
            {/* Pola Tipis Dropdown */}
            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-xs">
              <span className="font-bold text-slate-500 text-[11px] flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                Pola Tipis:
              </span>
              <select
                value={settings.showTemplate ? settings.templateShape : 'none'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'none') {
                    onUpdateSettings({ showTemplate: false, templateShape: 'none' });
                  } else {
                    onUpdateSettings({ showTemplate: true, templateShape: val });
                  }
                }}
                className="bg-transparent font-bold text-indigo-700 outline-none cursor-pointer text-xs"
              >
                <option value="none">Bebas (Tanpa Pola)</option>
                <optgroup label="Bentuk 2D">
                  <option value="square">Persegi</option>
                  <option value="circle">Lingkaran</option>
                  <option value="triangle">Segitiga</option>
                  <option value="rectangle">Persegi Panjang</option>
                </optgroup>
                <optgroup label="Bangun Ruang 3D">
                  <option value="cube">Kubus 3D</option>
                  <option value="cuboid">Balok 3D</option>
                  <option value="pyramid">Limas Segiempat 3D</option>
                  <option value="triangular_prism">Prisma Segitiga 3D</option>
                  <option value="cylinder">Tabung Silinder 3D</option>
                  <option value="house_3d">Rumah 3D (Kreasi)</option>
                </optgroup>
              </select>
            </div>

            {/* Template visibility toggle */}
            {settings.templateShape && settings.templateShape !== 'none' && (
              <button
                onClick={() => onUpdateSettings({ showTemplate: !settings.showTemplate })}
                className={`p-1.5 rounded-xl border transition-all ${
                  settings.showTemplate
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
                title={settings.showTemplate ? 'Sembunyikan Pola' : 'Tampilkan Pola'}
              >
                {settings.showTemplate ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {/* Color Palette Picker */}
          <div className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-slate-400 mr-0.5 hidden sm:block" />
            {PALETTE.map((c) => (
              <button
                key={c.value}
                title={c.name}
                onClick={() => onUpdateSettings({ penColor: c.value })}
                className={`w-5 h-5 rounded-full transition-transform ${
                  settings.penColor === c.value
                    ? 'scale-125 ring-2 ring-offset-2 ring-indigo-500 shadow-sm'
                    : 'hover:scale-110 opacity-80'
                }`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>

          {/* Pen Width */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
            {PEN_WIDTHS.map((pw) => (
              <button
                key={pw.width}
                onClick={() => onUpdateSettings({ penWidth: pw.width })}
                className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition-all ${
                  settings.penWidth === pw.width
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {pw.label}
              </button>
            ))}
          </div>

          {/* Actions: Auto-Correct, Undo, Clear, Finish */}
          <div className="flex items-center gap-1.5">
            {/* Auto-Correct Button */}
            {rawStrokesBackup ? (
              <button
                onClick={handleRevertAutoCorrect}
                title="Kembalikan ke goresan tangan asli"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-extrabold shadow-xs transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Asli</span>
              </button>
            ) : (
              <button
                onClick={handleAutoCorrect}
                disabled={strokes.length === 0}
                title="Rapikan goresan bergelombang menjadi bentuk geometri presisi"
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed transform active:scale-95"
              >
                <Wand2 className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                <span>Rapikan Bentuk</span>
              </button>
            )}

            <button
              onClick={handleUndo}
              disabled={strokes.length === 0}
              title="Urungkan goresan terakhir"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Undo</span>
            </button>

            <button
              onClick={handleClear}
              disabled={strokes.length === 0}
              title="Hapus kanvas"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hapus</span>
            </button>

            <button
              onClick={handleFinish}
              disabled={strokes.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold shadow-md shadow-emerald-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed transform active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Cek Nilai</span>
            </button>
          </div>
        </div>

        {/* Sub-bar for Drawing Mode & Stabilizer Assist */}
        <div className="px-4 py-1.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500 text-[11px] flex items-center gap-1">
              <Hand className="w-3.5 h-3.5 text-indigo-500" />
              Kontrol Tangan:
            </span>
            <div className="inline-flex rounded-xl p-0.5 bg-white border border-slate-200 shadow-xs">
              <button
                type="button"
                onClick={() => onUpdateSettings({ drawMode: 'pinch' })}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                  settings.drawMode === 'pinch'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tahan jepit jempol-telunjuk untuk menggambar (Default)"
              >
                👌 Jepit Tahan
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ drawMode: 'toggle' })}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                  settings.drawMode === 'toggle'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Jepit sekali untuk kunci pena ON, jepit lagi untuk lepas (Anti-Pegal untuk anak)"
              >
                🔒 Kunci Pena
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ drawMode: 'point' })}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                  settings.drawMode === 'point'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Cukup arahkan ujung telunjuk untuk menggambar langsung"
              >
                👆 Tunjuk Bebas
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500 text-[11px] flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-indigo-500" />
              Stabilizer Gerakan:
            </span>
            <div className="inline-flex rounded-xl p-0.5 bg-white border border-slate-200 shadow-xs">
              {(['soft', 'stable', 'ultra'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onUpdateSettings({ stabilizerLevel: lvl })}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    settings.stabilizerLevel === lvl
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={
                    lvl === 'soft'
                      ? 'Respons cepat dan lincah'
                      : lvl === 'stable'
                      ? 'Filter adaptif seimbang (Rekomendasi)'
                      : 'Peredam getaran maksimal untuk garis sangat mulus'
                  }
                >
                  {lvl === 'soft' ? 'Lembut' : lvl === 'stable' ? 'Stabil' : 'Ultra'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Auto-Correct Message Toast if triggered */}
        {autoCorrectMessage && (
          <div className="px-4 py-2 bg-gradient-to-r from-indigo-50 to-sky-50 border-b border-indigo-100 text-xs font-semibold text-indigo-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              {autoCorrectMessage}
            </span>
            <button
              onClick={() => setAutoCorrectMessage(null)}
              className="text-slate-400 hover:text-slate-600 font-bold ml-2"
            >
              ×
            </button>
          </div>
        )}

        {/* Canvas Display Viewport */}
        <div
          ref={containerRef}
          className="relative flex-1 w-full h-full min-h-[420px] bg-slate-50/50 cursor-crosshair overflow-hidden touch-none"
        >
          {/* Main Drawing Layer */}
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="absolute inset-0 w-full h-full z-10"
          />

          {/* Interactive Cursor Overlay Layer */}
          <canvas
            ref={cursorCanvasRef}
            className="absolute inset-0 w-full h-full z-20 pointer-events-none"
          />

          {/* Empty Canvas Hint & Tracing Guide helper */}
          {strokes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 text-slate-400 select-none px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-400 mb-2.5 shadow-inner">
                <Sparkles className="w-7 h-7 animate-bounce-subtle" />
              </div>
              <p className="text-sm font-bold text-slate-700">Papan Gambar Udara Siap</p>
              <p className="text-xs text-slate-400 max-w-sm mt-0.5">
                {settings.showTemplate && settings.templateShape !== 'none'
                  ? 'Ikuti garis pola tipis di atas untuk membuat bentuk yang sempurna!'
                  : 'Pilih "Pola Tipis" di atas jika ingin menjiplak bentuk bangun datar/ruang!'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
);
