import React, { useEffect, useState } from 'react';
import { HistoryItem } from '../types';
import { fetchHistory, deleteHistory } from '../services/api';
import {
  History,
  Trash2,
  Sparkles,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Trophy,
  ArrowRight,
  Eye,
  X,
} from 'lucide-react';

interface LearningHistoryProps {
  onPracticeShape: (shapeName: string) => void;
}

export const LearningHistory: React.FC<LearningHistoryProps> = ({ onPracticeShape }) => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchHistory(50, 0, filterQuery || undefined);
      setItems(data);
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterQuery]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this drawing record from history?')) return;
    try {
      await deleteHistory(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch (err) {
      console.error('Failed to delete history item:', err);
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        label: 'Great',
        icon: Trophy,
      };
    } else if (score >= 65) {
      return {
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        label: 'Good',
        icon: CheckCircle2,
      };
    } else {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        label: 'Practice',
        icon: AlertTriangle,
      };
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              Stored Progress
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Learning History</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Review all your past air drawings, similarity scores, and geometric evolution!
          </p>
        </div>

        {/* Search / Filter Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search by shape name..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* History Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <Sparkles className="w-8 h-8 animate-spin mx-auto text-indigo-400 mb-2" />
          <p className="text-xs font-bold">Loading drawing records...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
          <History className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-base font-bold text-slate-700">No Learning History Records Found</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Draw your first geometric shape in the Interactive Camera and click Save to store it in
            your journey!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const badge = getScoreBadge(item.similarity_score);
            const BadgeIcon = badge.icon;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all p-4 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-black text-slate-800 tracking-tight">
                      {item.recognized_shape}
                    </span>
                    <div
                      className={`flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${badge.bg}`}
                    >
                      <BadgeIcon className="w-3 h-3" />
                      <span>{item.similarity_score}%</span>
                    </div>
                  </div>

                  {/* Drawing Thumbnail */}
                  <div className="w-full aspect-[4/3] bg-slate-50 rounded-xl border border-slate-100 p-2 flex items-center justify-center overflow-hidden mb-3">
                    {item.thumbnail_data ? (
                      <img
                        src={item.thumbnail_data}
                        alt="Drawing"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Sparkles className="w-8 h-8 text-slate-300" />
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-slate-500 font-semibold">
                      {item.characteristics?.vertexCount ?? 0} vertices
                    </span>
                  </div>
                </div>

                {/* Actions Bottom Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPracticeShape(item.recognized_shape);
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    <span>Practice</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  {selectedItem.recognized_shape}
                </h3>
                <p className="text-xs text-slate-400">
                  Drawn on {new Date(selectedItem.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedItem.thumbnail_data && (
              <div className="w-full aspect-[4/3] bg-slate-50 rounded-2xl border border-slate-200 p-2 flex items-center justify-center">
                <img
                  src={selectedItem.thumbnail_data}
                  alt="Saved snapshot"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Accuracy Score
                </span>
                <span className="text-base font-black text-indigo-600">
                  {selectedItem.similarity_score}%
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Recognition Status
                </span>
                <span className="text-base font-black text-slate-700 capitalize">
                  {selectedItem.status}
                </span>
              </div>
            </div>

            {selectedItem.feedback && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-900">
                <span className="font-bold block mb-1">Feedback:</span>
                {selectedItem.feedback}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  onPracticeShape(selectedItem.recognized_shape);
                  setSelectedItem(null);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 shadow-sm"
              >
                Draw Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
