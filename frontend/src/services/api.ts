import { HistoryItem, Lesson, ShapeInfo, Model3DCatalogItem } from '../types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<{
  status: string;
  service: string;
  database: string;
  shapes_count: number;
  lessons_count: number;
  history_count: number;
}> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchShapes(dimension?: '2D' | '3D'): Promise<ShapeInfo[]> {
  const url = dimension ? `${API_BASE}/shapes?dimension=${dimension}` : `${API_BASE}/shapes`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch shapes');
  return res.json();
}

export async function fetchLessons(): Promise<Lesson[]> {
  const res = await fetch(`${API_BASE}/lessons`);
  if (!res.ok) throw new Error('Failed to fetch lessons');
  return res.json();
}

export async function fetchLessonById(id: string): Promise<Lesson> {
  const res = await fetch(`${API_BASE}/lessons/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch lesson ${id}`);
  return res.json();
}

export async function saveHistory(record: {
  shape_name: string;
  recognized_shape: string;
  similarity_score: number;
  status: string;
  characteristics: Record<string, any>;
  feedback: string;
  duration_seconds: number;
  thumbnail_data?: string;
}): Promise<HistoryItem> {
  const res = await fetch(`${API_BASE}/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error('Failed to save learning history');
  return res.json();
}

export async function fetchHistory(limit = 50, offset = 0, shape?: string): Promise<HistoryItem[]> {
  let url = `${API_BASE}/history?limit=${limit}&offset=${offset}`;
  if (shape) {
    url += `&shape=${encodeURIComponent(shape)}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}

export async function deleteHistory(id: number): Promise<{ message: string; id: number }> {
  const res = await fetch(`${API_BASE}/history/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete history record');
  return res.json();
}

export async function fetch3DModels(category?: string): Promise<Model3DCatalogItem[]> {
  const url = category ? `${API_BASE}/3d/models?category=${encodeURIComponent(category)}` : `${API_BASE}/3d/models`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch 3D models');
  return res.json();
}

export async function fetch3DModelDetail(id: string): Promise<Model3DCatalogItem & { mesh?: any }> {
  const res = await fetch(`${API_BASE}/3d/models/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch 3D model ${id}`);
  return res.json();
}

export async function sendHandTransform(transformData: {
  yaw: number;
  pitch: number;
  roll?: number;
  zoom: number;
  pan_x: number;
  pan_y: number;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/3d/transform`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transformData),
  });
  if (!res.ok) return null;
  return res.json();
}
