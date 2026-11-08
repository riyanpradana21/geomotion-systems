import React, { useState } from 'react';
import { LIVE_3D_TUTORIALS } from '../services/templates';
import { Tutorial3DModel, Tutorial3DStep } from '../types';
import {
  Box,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  X,
  RotateCcw,
  Lightbulb,
} from 'lucide-react';

interface Tutorial3DOverlayProps {
  onSelectTutorial?: (model: Tutorial3DModel | null, stepIndex: number) => void;
  onClose: () => void;
}

export const Tutorial3DOverlay: React.FC<Tutorial3DOverlayProps> = ({
  onSelectTutorial,
  onClose,
}) => {
  const [selectedModel, setSelectedModel] = useState<Tutorial3DModel>(LIVE_3D_TUTORIALS[0]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  const step: Tutorial3DStep = selectedModel.steps[currentStepIndex];
  const totalSteps = selectedModel.steps.length;

  const handleNextStep = () => {
    if (currentStepIndex < totalSteps - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      onSelectTutorial?.(selectedModel, nextIdx);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      onSelectTutorial?.(selectedModel, prevIdx);
    }
  };

  const handleSelectModel = (model: Tutorial3DModel) => {
    setSelectedModel(model);
    setCurrentStepIndex(0);
    onSelectTutorial?.(model, 0);
  };

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-indigo-200/90 shadow-lg p-4 transition-all space-y-3">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-xs">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs text-indigo-700 uppercase tracking-wider">
                Tutorial Interaktif Bangun Ruang
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                Live Cam
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">{selectedModel.name}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Tutup Tutorial"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Model Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {LIVE_3D_TUTORIALS.map((m) => {
          const isActive = selectedModel.id === m.id;
          return (
            <button
              key={m.id}
              onClick={() => handleSelectModel(m)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {m.name.split(' (')[0]}
            </button>
          );
        })}
      </div>

      {/* Active Step Card */}
      <div className="bg-gradient-to-br from-indigo-50/70 to-sky-50/50 rounded-xl p-3 border border-indigo-100">
        <div className="flex items-center justify-between text-xs font-bold text-indigo-800 mb-1">
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[11px]">
              {step.stepNumber}
            </span>
            {step.title}
          </span>
          <span className="text-[10px] uppercase font-extrabold text-indigo-500">
            Langkah {currentStepIndex + 1} dari {totalSteps}
          </span>
        </div>

        <p className="text-xs text-slate-700 font-medium leading-relaxed mt-1.5">
          {step.instruction}
        </p>

        {step.tip && (
          <div className="mt-2 flex items-start gap-1.5 text-[11px] text-amber-900 bg-amber-50/90 p-2 rounded-lg border border-amber-200/60">
            <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>{step.tip}</span>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={handlePrevStep}
          disabled={currentStepIndex === 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Sebelumnya</span>
        </button>

        <div className="flex items-center gap-1">
          {selectedModel.steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === currentStepIndex
                  ? 'w-6 bg-indigo-600'
                  : i < currentStepIndex
                  ? 'w-2 bg-emerald-500'
                  : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNextStep}
          disabled={currentStepIndex === totalSteps - 1}
          className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all"
        >
          <span>Lanjut</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
