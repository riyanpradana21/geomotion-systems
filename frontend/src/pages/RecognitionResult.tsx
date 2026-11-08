import React, { useState } from 'react';
import { RecognitionResultData } from '../types';
import { ResultCard } from '../components/ResultCard';
import { saveHistory } from '../services/api';
import { Sparkles, ArrowLeft } from 'lucide-react';

interface RecognitionResultProps {
  result: RecognitionResultData | null;
  onRetry: () => void;
  onGoToLearning: (shapeId?: string) => void;
}

export const RecognitionResult: React.FC<RecognitionResultProps> = ({
  result,
  onRetry,
  onGoToLearning,
}) => {
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  if (!result) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto my-12 shadow-sm">
        <Sparkles className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">No Recent Drawing Result</h2>
        <p className="text-xs text-slate-500 mt-2">
          Head over to the Interactive Camera to draw a shape and get instant geometric feedback!
        </p>
        <button
          onClick={onRetry}
          className="mt-6 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-500 transition-all"
        >
          Open Camera Drawing
        </button>
      </div>
    );
  }

  const handleSave = async () => {
    if (isSaved || saving) return;
    try {
      setSaving(true);
      await saveHistory({
        shape_name: result.shapeName,
        recognized_shape: result.shapeName,
        similarity_score: result.similarityScore,
        status: result.status,
        characteristics: result.characteristics,
        feedback: result.suggestions.join('; '),
        duration_seconds: 5,
        thumbnail_data: result.thumbnailData || '',
      });
      setIsSaved(true);
    } catch (e) {
      console.error('Failed to save to backend history:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Drawing Board</span>
        </button>
      </div>

      <ResultCard
        result={result}
        onRetry={onRetry}
        onGoToLearning={() =>
          onGoToLearning(result.shapeName.toLowerCase().replace(/\s+/g, '_'))
        }
        onSave={handleSave}
        isSaved={isSaved}
      />
    </div>
  );
};
