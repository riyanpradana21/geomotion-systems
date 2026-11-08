import React from 'react';
import { GestureType } from '../types';
import { Hand, MousePointer2, Edit3, PauseCircle, CheckCircle2 } from 'lucide-react';

interface GestureIndicatorProps {
  gesture: GestureType;
  pinchDistance: number;
  pinchThreshold: number;
  isDrawing: boolean;
  fistProgress?: number;
}

export const GestureIndicator: React.FC<GestureIndicatorProps> = ({
  gesture,
  pinchDistance,
  pinchThreshold,
  isDrawing,
  fistProgress = 0,
}) => {
  const getGestureMeta = () => {
    switch (gesture) {
      case 'pinch':
        return {
          title: 'Jepit Telunjuk & Jempol',
          desc: 'Pena Aktif! Gerakkan tanganmu untuk menggambar.',
          icon: Edit3,
          color: 'bg-emerald-500 text-white',
          badge: 'Menggambar',
        };
      case 'pointing':
        return {
          title: 'Telunjuk Menunjuk',
          desc: 'Menggerakkan Kursor. Jepit jari untuk mulai coretan!',
          icon: MousePointer2,
          color: 'bg-indigo-600 text-white',
          badge: 'Arahkan Kursor',
        };
      case 'open_palm':
        return {
          title: 'Telapak Tangan Terbuka',
          desc: 'Gambar Dijeda. Gerakkan jari lagi untuk lanjut.',
          icon: PauseCircle,
          color: 'bg-amber-500 text-white',
          badge: 'Dijeda',
        };
      case 'closed_fist':
        return {
          title: 'Kepalan Tangan (Selesai)',
          desc:
            fistProgress > 0
              ? `Tahan kepalan... (${Math.round(fistProgress * 100)}%)`
              : 'Tahan 2 detik untuk menyelesaikan gambar.',
          icon: CheckCircle2,
          color: 'bg-purple-600 text-white',
          badge: fistProgress > 0 ? 'Menyelesaikan...' : 'Tahan Kepalan',
        };
      case 'none':
      default:
        return {
          title: 'Mencari Tangan...',
          desc: 'Posisikan telapak tanganmu di depan kamera.',
          icon: Hand,
          color: 'bg-slate-400 text-white',
          badge: 'Mencari',
        };
    }
  };

  const meta = getGestureMeta();
  const Icon = meta.icon;

  const pinchPercent = Math.min(
    100,
    Math.max(0, Math.round((1 - pinchDistance / (pinchThreshold * 2)) * 100))
  );

  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-md rounded-2xl p-3.5 flex items-center justify-between gap-4 transition-all">
      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-200 ${
            meta.color
          } ${isDrawing ? 'scale-110 ring-4 ring-emerald-200' : ''}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-sm">{meta.title}</span>
            <span
              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                isDrawing
                  ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                  : gesture === 'closed_fist' && fistProgress > 0
                  ? 'bg-purple-100 text-purple-800 animate-pulse'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {meta.badge}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">{meta.desc}</p>
        </div>
      </div>

      {/* Proximity / Progress meter */}
      <div className="hidden sm:flex flex-col items-end gap-1 min-w-[120px]">
        {gesture === 'closed_fist' && fistProgress > 0 ? (
          <>
            <div className="flex items-center justify-between w-full text-[11px] font-semibold text-purple-700">
              <span>Menyelesaikan</span>
              <span>{Math.round(fistProgress * 100)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-purple-100 overflow-hidden border border-purple-200">
              <div
                className="h-full bg-purple-600 transition-all duration-75"
                style={{ width: `${fistProgress * 100}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between w-full text-[11px] font-semibold text-slate-500">
              <span>Kerapatan Jepit</span>
              <span className={isDrawing ? 'text-emerald-600 font-bold' : 'text-slate-600'}>
                {pinchPercent}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
              <div
                className={`h-full transition-all duration-75 ${
                  isDrawing ? 'bg-emerald-500' : 'bg-indigo-400'
                }`}
                style={{ width: `${pinchPercent}%` }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
