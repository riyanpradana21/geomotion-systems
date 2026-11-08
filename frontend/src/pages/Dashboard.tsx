import React, { useEffect, useState } from 'react';
import { ShapeInfo, HistoryItem, Lesson } from '../types';
import { fetchShapes, fetchHistory, fetchLessons } from '../services/api';
import { StatsCard } from '../components/StatsCard';
import {
  Sparkles,
  Camera,
  BookOpen,
  Trophy,
  Activity,
  Circle,
  Square,
  Triangle,
  RectangleHorizontal,
  Box,
  Layers,
  ArrowRight,
  ChevronRight,
  Hand,
  CheckCircle2,
  Wand2,
  GraduationCap,
} from 'lucide-react';

interface DashboardProps {
  onStartDrawing: (targetShape?: string) => void;
  onOpenLesson: (lessonId: string) => void;
  onViewHistory: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onStartDrawing,
  onOpenLesson,
  onViewHistory,
}) => {
  const [shapes, setShapes] = useState<ShapeInfo[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [shapesData, historyData, lessonsData] = await Promise.all([
          fetchShapes().catch(() => []),
          fetchHistory(10, 0).catch(() => []),
          fetchLessons().catch(() => []),
        ]);
        setShapes(shapesData);
        setHistory(historyData);
        setLessons(lessonsData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute stats
  const totalDrawings = history.length;
  const avgScore =
    totalDrawings > 0
      ? Math.round(history.reduce((sum, h) => sum + h.similarity_score, 0) / totalDrawings)
      : 0;
  const highestScore =
    totalDrawings > 0 ? Math.max(...history.map((h) => h.similarity_score)) : 0;
  const masteredCount = history.filter((h) => h.similarity_score >= 80).length;

  const shapeIcons: Record<string, any> = {
    circle: Circle,
    square: Square,
    triangle: Triangle,
    rectangle: RectangleHorizontal,
    cube: Box,
    cuboid: Layers,
    pyramid: Triangle,
    triangular_prism: Box,
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-sky-600 p-8 sm:p-10 text-white shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-15 pointer-events-none flex items-center pr-8">
          <Sparkles className="w-80 h-80" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-4 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Kelas Gambar Udara Interaktif Ramah Anak</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Belajar Gambar Bangun Datar & 3D dengan Gerakan Tangan!
          </h1>

          <p className="mt-3 text-base sm:text-lg text-indigo-100 font-medium leading-relaxed">
            Kini dilengkapi <strong>Pola Tipis (Tracing Guide)</strong> untuk menjiplak bentuk,{' '}
            <strong>Rapikan Otomatis (Auto-Correct)</strong>, dan{' '}
            <strong>Tutorial Bangun Ruang 3D Langsung pada Kamera</strong> tanpa menghabiskan kuota cloud!
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onStartDrawing()}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-indigo-700 font-extrabold text-sm shadow-lg shadow-indigo-900/30 hover:bg-indigo-50 transition-all transform active:scale-95"
            >
              <Camera className="w-5 h-5 text-indigo-600" />
              <span>Buka Papan Gambar Kamera</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={() => onStartDrawing('Cube')}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-indigo-500/40 hover:bg-indigo-500/50 text-white font-extrabold text-sm border border-white/20 backdrop-blur-sm transition-all"
            >
              <Box className="w-4 h-4 text-amber-300" />
              <span>Tutorial 3D Kubus</span>
            </button>

            <button
              onClick={() => onOpenLesson('lesson-cube')}
              className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/10 backdrop-blur-sm transition-all"
            >
              <BookOpen className="w-4 h-4" />
              <span>Modul Belajar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feature Highlight Cards (Pola Tipis, Auto-Correct, Tutorial 3D Kamera) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onStartDrawing('Square')}
          className="p-5 rounded-3xl bg-white border border-indigo-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-start gap-3.5"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-indigo-600 tracking-wider">
              Fitur Baru
            </span>
            <h3 className="text-sm font-black text-slate-800 mt-0.5">Pola Tipis (Tracing Guide)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Pola garis tipis bantu anak-anak menjiplak bentuk 2D & 3D dengan mudah di layar.
            </p>
          </div>
        </div>

        <div
          onClick={() => onStartDrawing()}
          className="p-5 rounded-3xl bg-white border border-emerald-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-start gap-3.5"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Wand2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-emerald-600 tracking-wider">
              Auto-Snap
            </span>
            <h3 className="text-sm font-black text-slate-800 mt-0.5">Rapikan Bentuk Otomatis</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Coretan agak bengkok? Klik "Rapikan Bentuk" untuk mengubahnya jadi geometri presisi!
            </p>
          </div>
        </div>

        <div
          onClick={() => onStartDrawing('Cube')}
          className="p-5 rounded-3xl bg-white border border-amber-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-start gap-3.5"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-amber-600 tracking-wider">
              Live Cam 3D
            </span>
            <h3 className="text-sm font-black text-slate-800 mt-0.5">Tutorial Kamera 3D</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Panduan langkah demi langkah langsung di atas video kamera untuk kubus, limas, & rumah 3D!
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Gambar Udara"
          value={totalDrawings}
          subtitle="Bentuk yang sudah digambar"
          icon={Activity}
          color="indigo"
          badge={totalDrawings > 0 ? 'Aktif' : 'Mulai Sekarang'}
        />
        <StatsCard
          title="Rata-rata Akurasi"
          value={`${avgScore}%`}
          subtitle="Tingkat ketepatan geometri"
          icon={Trophy}
          color="emerald"
          badge={avgScore >= 75 ? 'Hebat' : 'Terus Belajar'}
        />
        <StatsCard
          title="Bentuk Dikuasai"
          value={masteredCount}
          subtitle="Nilai 80% atau lebih tinggi"
          icon={Sparkles}
          color="amber"
          badge="Bintang Emas"
        />
        <StatsCard
          title="Skor Tertinggi"
          value={`${highestScore}%`}
          subtitle="Rekor gambar terbaikmu"
          icon={CheckCircle2}
          color="sky"
          badge="Rekor Baru"
        />
      </div>

      {/* Fast Gesture Guide Cheat Sheet with Safety Note */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-slate-800">Petunjuk Gerakan Tangan Ajaib</h2>
            <p className="text-xs text-slate-500 font-medium">
              Kendalikan kanvas gambarmu tanpa menyentuh keyboard ataupun mouse!
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            <Hand className="w-3.5 h-3.5" />
            <span>21 Titik Tulang Tangan Terlacak</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm mb-2 shadow-xs">
                👆
              </div>
              <h3 className="text-sm font-black text-slate-800">Telunjuk Menunjuk</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Arahkan jari telunjuk untuk menggeser kursor bidik ke posisi mana saja di kanvas.
              </p>
            </div>
            <span className="text-[10px] font-extrabold uppercase mt-3 text-indigo-600">
              Arahkan Kursor
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm mb-2 shadow-xs">
                👌
              </div>
              <h3 className="text-sm font-black text-slate-800">Jepit Telunjuk & Jempol</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Sentuhkan ujung jempol dan telunjuk untuk mengaktifkan pena digital dan mulai menggores garis!
              </p>
            </div>
            <span className="text-[10px] font-extrabold uppercase mt-3 text-emerald-600">
              Menggambar Garis
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm mb-2 shadow-xs">
                🖐️
              </div>
              <h3 className="text-sm font-black text-slate-800">Telapak Terbuka</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Buka kelima jarimu ke kamera untuk menjeda goresan saat ingin istirahat sejenak.
              </p>
            </div>
            <span className="text-[10px] font-extrabold uppercase mt-3 text-amber-600">
              Jeda Menggambar
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-sm mb-2 shadow-xs">
                ✊
              </div>
              <h3 className="text-sm font-black text-slate-800">Tahan Kepalan (2 Detik)</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Tahan kepalan tangan 2 detik dengan hitungan mundur aman agar tidak terpicu secara sengaja!
              </p>
            </div>
            <span className="text-[10px] font-extrabold uppercase mt-3 text-purple-600">
              Selesai & Cek Skor
            </span>
          </div>
        </div>
      </div>

      {/* Geometry Shape Practice Challenges */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-black text-slate-800">Tantangan Latihan Bentuk</h2>
            <p className="text-xs text-slate-500 font-medium">
              Pilih bentuk untuk langsung mengaktifkan pola tipis dan memulai latihan.
            </p>
          </div>
          <button
            onClick={() => onOpenLesson('lesson-cube')}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            <span>Semua Pelajaran</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {shapes.slice(0, 4).map((s) => {
            const ShapeIcon = shapeIcons[s.id] || Sparkles;
            return (
              <div
                key={s.id}
                className="group p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between bg-slate-50/50 hover:bg-white"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ShapeIcon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {s.dimension}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-800 mt-3">{s.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{s.description}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">{s.difficulty}</span>
                  <button
                    onClick={() => onStartDrawing(s.name)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-xs transition-all transform active:scale-95"
                  >
                    <span>Latih Pola</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity List */}
      {history.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-slate-800">Riwayat Gambar Udara Terakhir</h2>
              <p className="text-xs text-slate-500 font-medium">Hasil dan akurasi geometrimu</p>
            </div>
            <button
              onClick={onViewHistory}
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              <span>Lihat Semua Riwayat</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {history.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex items-center gap-3"
              >
                {item.thumbnail_data ? (
                  <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0">
                    <img
                      src={item.thumbnail_data}
                      alt="Thumbnail"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-extrabold text-slate-800 truncate">
                      {item.recognized_shape}
                    </p>
                    <span className="text-xs font-black text-emerald-600">
                      {item.similarity_score}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
