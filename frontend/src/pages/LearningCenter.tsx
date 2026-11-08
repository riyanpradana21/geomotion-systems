import React, { useEffect, useState } from 'react';
import { Lesson, ShapeInfo } from '../types';
import { fetchLessons, fetchShapes } from '../services/api';
import {
  BookOpen,
  Circle,
  Square,
  Triangle,
  RectangleHorizontal,
  Box,
  Layers,
  Sparkles,
  Camera,
  CheckCircle2,
  Clock,
  Lightbulb,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

interface LearningCenterProps {
  onStartDrawing: (targetShape: string) => void;
  selectedLessonId?: string | null;
}

export const LearningCenter: React.FC<LearningCenterProps> = ({
  onStartDrawing,
  selectedLessonId,
}) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [shapes, setShapes] = useState<ShapeInfo[]>([]);
  const [activeTab, setActiveTab] = useState<'2D' | '3D'>('2D');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const [lData, sData] = await Promise.all([
          fetchLessons().catch(() => []),
          fetchShapes().catch(() => []),
        ]);
        setLessons(lData);
        setShapes(sData);

        if (selectedLessonId) {
          const match = lData.find((l) => l.id === selectedLessonId);
          if (match) {
            setActiveLesson(match);
            setActiveTab(match.dimension as '2D' | '3D');
          }
        } else if (lData.length > 0) {
          setActiveLesson(lData[0]);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedLessonId]);

  const shapeIconMap: Record<string, any> = {
    circle: Circle,
    square: Square,
    triangle: Triangle,
    rectangle: RectangleHorizontal,
    cube: Box,
    cuboid: Layers,
    pyramid: Triangle,
    triangular_prism: Box,
  };

  const filteredLessons = lessons.filter((l) => l.dimension === activeTab);
  const currentShape = shapes.find((s) => s.id === activeLesson?.shape_id);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-sky-600 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs">
              Interactive Geometry Curriculum
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mt-2 tracking-tight">Learning Center</h1>
          <p className="text-indigo-100 text-sm sm:text-base mt-2 max-w-2xl font-medium">
            Discover the secret rules of geometric shapes, explore angle laws, and learn how our AI
            rates your air drawings!
          </p>
        </div>

        {/* 2D / 3D Switch Tabs */}
        <div className="flex items-center bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/20 self-start md:self-center">
          <button
            onClick={() => setActiveTab('2D')}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === '2D'
                ? 'bg-white text-indigo-700 shadow-md'
                : 'text-white/80 hover:text-white'
            }`}
          >
            2D Shapes
          </button>
          <button
            onClick={() => setActiveTab('3D')}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === '3D'
                ? 'bg-white text-indigo-700 shadow-md'
                : 'text-white/80 hover:text-white'
            }`}
          >
            3D Wireframes
          </button>
        </div>
      </div>

      {/* Grid: Left Lesson Navigation, Right Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Lesson Cards Column */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            {activeTab} Interactive Lessons
          </h2>

          <div className="space-y-3">
            {filteredLessons.map((lesson) => {
              const isSelected = activeLesson?.id === lesson.id;
              const Icon = shapeIconMap[lesson.shape_id] || Sparkles;

              return (
                <div
                  key={lesson.id}
                  onClick={() => setActiveLesson(lesson)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-md'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800">{lesson.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {lesson.estimated_minutes} mins
                          </span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {lesson.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>

                    <ArrowRight
                      className={`w-4 h-4 transition-transform ${
                        isSelected ? 'text-indigo-600 translate-x-1' : 'text-slate-300'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Active Lesson Detail View */}
        <div className="lg:col-span-7">
          {activeLesson ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              {/* Lesson Title & Quick Practice Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                      Step-by-Step Guide
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      {activeLesson.dimension} Shape
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mt-1">
                    {activeLesson.title}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {activeLesson.instructions}
                  </p>
                </div>

                <button
                  onClick={() =>
                    onStartDrawing(currentShape?.name || activeLesson.shape_id.toUpperCase())
                  }
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-md shadow-indigo-200 transition-all shrink-0 transform active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Practice with Camera</span>
                </button>
              </div>

              {/* Step By Step Instructions */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                  How To Draw This Shape in The Air
                </h3>
                <div className="space-y-3">
                  {activeLesson.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80"
                    >
                      <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-xs">
                        {idx + 1}
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Geometric Criteria AI Looks For */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                  What The AI Evaluates
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeLesson.criteria.map((crit, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-800 text-xs font-bold"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{crit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fun Fact Card */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-amber-800 uppercase tracking-wider">
                    Fun Geometry Fact!
                  </span>
                  <p className="text-xs font-medium text-amber-900 mt-1 leading-relaxed">
                    {activeLesson.fun_fact}
                  </p>
                </div>
              </div>

              {/* Mathematical Properties Card if available */}
              {currentShape && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                    Math Specs ({currentShape.name})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {Object.entries(currentShape.properties).map(([key, val]) => (
                      <div key={key} className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="font-bold text-slate-700">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-bold">Select a lesson to see step-by-step guidance</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
