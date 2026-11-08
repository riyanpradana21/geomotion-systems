import React, { useState } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { LearningCenter } from './pages/LearningCenter';
import { InteractiveCamera } from './pages/InteractiveCamera';
import { Studio3D } from './pages/Studio3D';
import { RecognitionResult } from './pages/RecognitionResult';
import { LearningHistory } from './pages/LearningHistory';
import { Settings } from './pages/Settings';
import { DrawingSettings, RecognitionResultData } from './types';
import { sounds } from './services/sound';

const DEFAULT_SETTINGS: DrawingSettings = {
  penColor: '#4f46e5',
  penWidth: 8,
  smoothFactor: 0.35,
  pinchThreshold: 0.32,
  mirrorCamera: true,
  showLandmarks: true,
  soundEnabled: true,
  targetShape: null,
  showTemplate: true,
  templateShape: 'none',
  templateOpacity: 0.35,
  autoCorrectEnabled: true,
  gestureFinishEnabled: true,
  fistHoldDuration: 1800,
  drawMode: 'pinch',
  stabilizerLevel: 'stable',
};

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [settings, setSettings] = useState<DrawingSettings>(DEFAULT_SETTINGS);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [targetShape, setTargetShape] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<RecognitionResultData | null>(null);

  const handleUpdateSettings = (newSettings: Partial<DrawingSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    sounds.enabled = true;
  };

  // Navigations with automatic template matching
  const handleStartDrawing = (shapeName?: string) => {
    if (shapeName) {
      setTargetShape(shapeName);
      const lower = shapeName.toLowerCase();
      let matchedTemplate = 'none';
      if (lower.includes('circle') || lower.includes('lingkaran')) matchedTemplate = 'circle';
      else if (lower.includes('square') || (lower.includes('persegi') && !lower.includes('panjang'))) matchedTemplate = 'square';
      else if (lower.includes('rectangle') || lower.includes('panjang')) matchedTemplate = 'rectangle';
      else if (lower.includes('triangle') || lower.includes('segitiga')) matchedTemplate = 'triangle';
      else if (lower.includes('cube') || lower.includes('kubus')) matchedTemplate = 'cube';
      else if (lower.includes('cuboid') || lower.includes('balok')) matchedTemplate = 'cuboid';
      else if (lower.includes('pyramid') || lower.includes('limas')) matchedTemplate = 'pyramid';
      else if (lower.includes('prism') || lower.includes('prisma') || lower.includes('tenda')) matchedTemplate = 'triangular_prism';
      else if (lower.includes('house') || lower.includes('rumah')) matchedTemplate = 'house_3d';

      if (matchedTemplate !== 'none') {
        setSettings((prev) => ({
          ...prev,
          templateShape: matchedTemplate,
          showTemplate: true,
        }));
      }
    }
    setCurrentTab('camera');
  };

  const handleOpenLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setCurrentTab('learning');
  };

  const handleFinishRecognition = (result: RecognitionResultData) => {
    setLatestResult(result);
    setCurrentTab('result');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        hasRecentResult={latestResult !== null}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === 'dashboard' && (
          <Dashboard
            onStartDrawing={handleStartDrawing}
            onOpenLesson={handleOpenLesson}
            onViewHistory={() => setCurrentTab('history')}
          />
        )}

        {currentTab === 'learning' && (
          <LearningCenter
            onStartDrawing={handleStartDrawing}
            selectedLessonId={selectedLessonId}
          />
        )}

        {currentTab === 'camera' && (
          <InteractiveCamera
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onFinishRecognition={handleFinishRecognition}
            targetShape={targetShape}
          />
        )}

        {currentTab === 'studio3d' && <Studio3D />}

        {currentTab === 'result' && (
          <RecognitionResult
            result={latestResult}
            onRetry={() => setCurrentTab('camera')}
            onGoToLearning={(shapeId) => {
              if (shapeId) setSelectedLessonId(`lesson-${shapeId}`);
              setCurrentTab('learning');
            }}
          />
        )}

        {currentTab === 'history' && (
          <LearningHistory onPracticeShape={handleStartDrawing} />
        )}

        {currentTab === 'settings' && (
          <Settings
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetDefaults={handleResetDefaults}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <p>© 2026 Simple AI Camera Geometry – Interactive Geometry Learning for Children</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              100% Local AI (No Cloud Uploads)
            </span>
            <span>FastAPI + MediaPipe + Three.js</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
