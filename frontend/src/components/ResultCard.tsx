import React, { useEffect } from 'react';
import { RecognitionResultData } from '../types';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  RotateCcw,
  BookOpen,
  Save,
  Share2,
} from 'lucide-react';

interface ResultCardProps {
  result: RecognitionResultData;
  onRetry: () => void;
  onGoToLearning?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  onRetry,
  onGoToLearning,
  onSave,
  isSaved,
}) => {
  useEffect(() => {
    if (result.similarityScore >= 75) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [result]);

  const getScoreBadge = () => {
    if (result.similarityScore >= 85) {
      return {
        label: 'Superstar Geometer! 🌟',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        barColor: 'bg-emerald-500',
        icon: Trophy,
      };
    } else if (result.similarityScore >= 70) {
      return {
        label: 'Great Effort! 👏',
        color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        barColor: 'bg-indigo-500',
        icon: CheckCircle2,
      };
    } else if (result.similarityScore >= 50) {
      return {
        label: 'Getting Closer! Keep Practicing 💪',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        barColor: 'bg-amber-500',
        icon: AlertTriangle,
      };
    } else {
      return {
        label: 'Keep Trying! Explore The Guide 🚀',
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        barColor: 'bg-rose-400',
        icon: HelpCircle,
      };
    }
  };

  const badge = getScoreBadge();
  const BadgeIcon = badge.icon;
  const chars = result.characteristics;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-sky-600 p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
          <Sparkles className="w-56 h-56" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs">
                AI Recognition Result
              </span>
              <span className="text-xs font-semibold text-indigo-100">{result.dimension} Geometry</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black mt-2 tracking-tight">
              {result.shapeName}
            </h2>
            <p className="text-sm text-indigo-100 mt-1 max-w-xl font-medium">
              {result.explanation}
            </p>
          </div>

          {/* Similarity Score Circle/Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[140px] text-center shadow-lg">
            <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
              Accuracy
            </span>
            <div className="text-4xl font-black mt-1 flex items-baseline">
              {result.similarityScore}
              <span className="text-xl text-indigo-200">%</span>
            </div>
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${result.similarityScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Drawing Snapshot & Status Badge */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div className="w-full aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-3 flex flex-col items-center justify-center overflow-hidden shadow-inner relative group">
            {result.thumbnailData ? (
              <img
                src={result.thumbnailData}
                alt="Your Drawing"
                className="w-full h-full object-contain rounded-xl"
              />
            ) : (
              <div className="text-slate-400 text-center p-4">
                <Sparkles className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold">Drawing Preview</p>
              </div>
            )}
            <span className="absolute bottom-2 right-2 text-[10px] font-bold bg-white/90 px-2 py-0.5 rounded shadow-xs text-slate-500 border border-slate-200">
              Your Air Drawing
            </span>
          </div>

          <div
            className={`w-full mt-4 p-3 rounded-2xl border flex items-center gap-3 ${badge.color}`}
          >
            <div className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center shadow-xs">
              <BadgeIcon className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">{badge.label}</span>
          </div>
        </div>

        {/* Right Column: Characteristics & Suggestions */}
        <div className="md:col-span-7 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-3">
              Geometric Analysis Breakdown
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[10px] font-bold uppercase text-slate-400">Corners / Vertices</span>
                <p className="text-lg font-black text-slate-800 mt-0.5">{chars.vertexCount}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[10px] font-bold uppercase text-slate-400">Circularity (Roundness)</span>
                <p className="text-lg font-black text-slate-800 mt-0.5">{chars.circularity}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[10px] font-bold uppercase text-slate-400">Aspect Ratio (W:H)</span>
                <p className="text-lg font-black text-slate-800 mt-0.5">{chars.aspectRatio}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[10px] font-bold uppercase text-slate-400">Perimeter Length</span>
                <p className="text-lg font-black text-slate-800 mt-0.5">{chars.perimeter} px</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[10px] font-bold uppercase text-slate-400">Contour Loop</span>
                <p className="text-lg font-black text-slate-800 mt-0.5">
                  {chars.isClosed ? 'Closed ✨' : 'Open'}
                </p>
              </div>

              {chars.wireframeTopology ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] font-bold uppercase text-slate-400">3D Edges</span>
                  <p className="text-lg font-black text-slate-800 mt-0.5">
                    {chars.wireframeTopology.edgeCount} Edges
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Area Enclosed</span>
                  <p className="text-lg font-black text-slate-800 mt-0.5">{chars.area} px²</p>
                </div>
              )}
            </div>

            {/* Angles if available */}
            {chars.angles && chars.angles.length > 0 && (
              <div className="mt-4 p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                <span className="text-[11px] font-bold text-indigo-800">
                  Detected Corner Angles: {chars.angles.map((a) => `${a}°`).join(', ')}
                </span>
              </div>
            )}

            {/* Improvement Suggestions */}
            <div className="mt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Teacher's Tips & Advice
              </h4>
              <ul className="space-y-2">
                {result.suggestions.map((sug, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>{sug}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all transform active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Draw Again</span>
            </button>

            <div className="flex items-center gap-2">
              {onGoToLearning && (
                <button
                  onClick={onGoToLearning}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-all"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Learn This Shape</span>
                </button>
              )}

              {onSave && (
                <button
                  onClick={onSave}
                  disabled={isSaved}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold shadow-xs transition-all ${
                    isSaved
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaved ? 'Saved to History' : 'Save to History'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
