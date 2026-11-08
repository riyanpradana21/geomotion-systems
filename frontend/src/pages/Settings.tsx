import React, { useEffect, useState } from 'react';
import { DrawingSettings } from '../types';
import { sounds } from '../services/sound';
import { fetchHealth } from '../services/api';
import {
  Settings as SettingsIcon,
  FlipHorizontal,
  Volume2,
  VolumeX,
  Eye,
  Sliders,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Database,
  Cpu,
  Layers,
  Wand2,
  ShieldCheck,
  Hand,
} from 'lucide-react';

interface SettingsProps {
  settings: DrawingSettings;
  onUpdateSettings: (newSettings: Partial<DrawingSettings>) => void;
  onResetDefaults: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onUpdateSettings,
  onResetDefaults,
}) => {
  const [backendHealth, setBackendHealth] = useState<{
    status: string;
    database: string;
    shapes_count: number;
    lessons_count: number;
    history_count: number;
  } | null>(null);

  useEffect(() => {
    fetchHealth()
      .then(setBackendHealth)
      .catch(() => setBackendHealth(null));
  }, []);

  const handleToggleSound = () => {
    const nextVal = !settings.soundEnabled;
    onUpdateSettings({ soundEnabled: nextVal });
    sounds.enabled = nextVal;
    if (nextVal) sounds.playPinchStart();
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
            Pengaturan & Diagnostik
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Pengaturan Sistem</h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Sesuaikan sensitivitas gestur, pencegah ketidaksengajaan kepalan tangan, pola tipis, dan kehalusan gambar.
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hand Tracking & Gesture Controls */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-black text-slate-800">Sensitivitas & Gestur</h2>
          </div>

          {/* Mode Menggambar Tangan */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Hand className="w-4 h-4 text-indigo-600" />
              <span>Mode Menggambar (Bantuan Ramah Anak)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ drawMode: 'pinch' })}
                className={`p-2.5 rounded-2xl border text-left transition-all ${
                  settings.drawMode === 'pinch'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-sm font-bold">👌 Jepit Tahan</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Tahan jepitan saat menggambar</div>
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ drawMode: 'toggle' })}
                className={`p-2.5 rounded-2xl border text-left transition-all ${
                  settings.drawMode === 'toggle'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-sm font-bold text-emerald-700">🔒 Kunci Pena</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Sekali jepit on/off (Anti lelah)</div>
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ drawMode: 'point' })}
                className={`p-2.5 rounded-2xl border text-left transition-all ${
                  settings.drawMode === 'point'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-sm font-bold">👆 Tunjuk Bebas</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Tunjuk langsung menggambar</div>
              </button>
            </div>
          </div>

          {/* Tingkat Stabilizer Adaptif */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Stabilizer Filter Gerakan Jari</span>
              <span className="text-indigo-600 font-bold uppercase text-[11px]">
                {settings.stabilizerLevel === 'soft' ? 'Lembut' : settings.stabilizerLevel === 'stable' ? 'Stabil (Rekomendasi)' : 'Ultra Halus'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['soft', 'stable', 'ultra'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onUpdateSettings({ stabilizerLevel: lvl })}
                  className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all ${
                    settings.stabilizerLevel === lvl
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {lvl === 'soft' ? 'Lembut' : lvl === 'stable' ? 'Stabil' : 'Ultra'}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              Filter adaptif meredam getaran tremor dan lompatan mendadak saat jari menjepit.
            </p>
          </div>

          {/* Cursor Smoothing Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Kehalusan Gerakan Kursor</span>
              <span className="text-indigo-600 font-mono">
                {Math.round(settings.smoothFactor * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              value={settings.smoothFactor}
              onChange={(e) => onUpdateSettings({ smoothFactor: parseFloat(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Nilai lebih rendah membuat tarikan garis lebih stabil & tidak gemetar.
            </p>
          </div>

          {/* Pinch Sensitivity Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Sensitivitas Jepitan Jempol-Telunjuk</span>
              <span className="text-indigo-600 font-mono">
                {Math.round(settings.pinchThreshold * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.20"
              max="0.55"
              step="0.02"
              value={settings.pinchThreshold}
              onChange={(e) => onUpdateSettings({ pinchThreshold: parseFloat(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Jarak kedekatan ujung jari untuk mengaktifkan pena digital.
            </p>
          </div>

          {/* Fist Hold Duration Slider (Safety from accidental triggers) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                Durasi Tahan Kepalan (Selesai)
              </span>
              <span className="text-purple-600 font-mono font-bold">
                {((settings.fistHoldDuration || 1800) / 1000).toFixed(1)} detik
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="3000"
              step="200"
              value={settings.fistHoldDuration || 1800}
              onChange={(e) => onUpdateSettings({ fistHoldDuration: parseInt(e.target.value) })}
              className="w-full accent-purple-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Mencegah gambar selesai tiba-tiba saat tidak sengaja mengepalkan tangan.
            </p>
          </div>

          {/* Toggle Gesture Finish */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs font-bold text-slate-700 block">Selesaikan Lewat Gestur Kepalan</span>
              <span className="text-[11px] text-slate-400">
                Jika dimatikan, penyelesaian hanya lewat tombol layar.
              </span>
            </div>
            <button
              onClick={() => onUpdateSettings({ gestureFinishEnabled: !settings.gestureFinishEnabled })}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.gestureFinishEnabled ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${
                  settings.gestureFinishEnabled ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Camera Mirroring Toggle */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs font-bold text-slate-700 block">Cerminkan Video Kamera (Mirror)</span>
              <span className="text-[11px] text-slate-400">
                Membalikkan kamera secara horizontal agar alami layaknya cermin.
              </span>
            </div>
            <button
              onClick={() => onUpdateSettings({ mirrorCamera: !settings.mirrorCamera })}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.mirrorCamera ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${
                  settings.mirrorCamera ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Show Landmarks Toggle */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs font-bold text-slate-700 block">Tampilkan 21 Titik Tulang Tangan</span>
              <span className="text-[11px] text-slate-400">
                Menampilkan kerangka jari di atas video webcam.
              </span>
            </div>
            <button
              onClick={() => onUpdateSettings({ showLandmarks: !settings.showLandmarks })}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.showLandmarks ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${
                  settings.showLandmarks ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Audio Feedback Toggle */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs font-bold text-slate-700 block">Efek Suara Edukasi Ramah Anak</span>
              <span className="text-[11px] text-slate-400">
                Bunyi nada lembut saat mulai menjepit, merapikan, dan selesai.
              </span>
            </div>
            <button
              onClick={handleToggleSound}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.soundEnabled ? 'bg-emerald-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${
                  settings.soundEnabled ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Pola Tipis & Local AI Architecture */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-black text-slate-800">Pola Tipis & AI Lokal</h2>
          </div>

          {/* Pola Tipis Default Opacity Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Kepekatan Garis Pola Tipis</span>
              <span className="text-indigo-600 font-mono">
                {Math.round((settings.templateOpacity || 0.35) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.15"
              max="0.80"
              step="0.05"
              value={settings.templateOpacity || 0.35}
              onChange={(e) => onUpdateSettings({ templateOpacity: parseFloat(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Sesuaikan transparansi garis bantu pola bangun datar dan bangun ruang.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-emerald-900">MediaPipe Vision Model</span>
              </div>
              <span className="font-mono text-emerald-700 font-bold bg-white px-2 py-0.5 rounded shadow-xs">
                Local /models/
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-emerald-900">WASM Binary Assets</span>
              </div>
              <span className="font-mono text-emerald-700 font-bold bg-white px-2 py-0.5 rounded shadow-xs">
                Local /wasm/
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-indigo-900">Backend FastAPI Status</span>
              </div>
              <span
                className={`font-bold px-2 py-0.5 rounded shadow-xs ${
                  backendHealth ? 'bg-white text-indigo-700' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {backendHealth ? 'Tersambung (SQLite)' : 'Offline / Mandiri'}
              </span>
            </div>

            {backendHealth && (
              <div className="grid grid-cols-3 gap-2 text-center text-xs mt-2">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Bentuk Geometri
                  </span>
                  <span className="font-black text-slate-800 text-sm">
                    {backendHealth.shapes_count}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Modul Belajar
                  </span>
                  <span className="font-black text-slate-800 text-sm">
                    {backendHealth.lessons_count}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Riwayat Gambar
                  </span>
                  <span className="font-black text-slate-800 text-sm">
                    {backendHealth.history_count}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={onResetDefaults}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs"
            >
              Kembalikan Semua Pengaturan ke Standar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
