import { Tutorial3DModel } from '../types';

export interface TemplateLine {
  from: { x: number; y: number }; // normalized 0..1
  to: { x: number; y: number };
  style?: 'solid' | 'dashed';
}

export interface ShapeTemplate {
  id: string;
  name: string;
  dimension: '2D' | '3D';
  category: 'basic' | '3d_solid' | 'real_object';
  description: string;
  lines: TemplateLine[];
  circles?: { cx: number; cy: number; r: number }[];
  ellipses?: { cx: number; cy: number; rx: number; ry: number }[];
  dots?: { x: number; y: number; label?: string }[];
}

export const SHAPE_TEMPLATES: ShapeTemplate[] = [
  // ================= 2D TEMPLATES =================
  {
    id: 'square',
    name: 'Persegi (Square)',
    dimension: '2D',
    category: 'basic',
    description: '4 sisi sama panjang dan 4 sudut siku-siku 90°',
    lines: [
      { from: { x: 0.28, y: 0.28 }, to: { x: 0.72, y: 0.28 }, style: 'dashed' },
      { from: { x: 0.72, y: 0.28 }, to: { x: 0.72, y: 0.72 }, style: 'dashed' },
      { from: { x: 0.72, y: 0.72 }, to: { x: 0.28, y: 0.72 }, style: 'dashed' },
      { from: { x: 0.28, y: 0.72 }, to: { x: 0.28, y: 0.28 }, style: 'dashed' },
    ],
    dots: [
      { x: 0.28, y: 0.28, label: 'A' },
      { x: 0.72, y: 0.28, label: 'B' },
      { x: 0.72, y: 0.72, label: 'C' },
      { x: 0.28, y: 0.72, label: 'D' },
    ],
  },
  {
    id: 'circle',
    name: 'Lingkaran (Circle)',
    dimension: '2D',
    category: 'basic',
    description: 'Pola melingkar sempurna tanpa sudut',
    lines: [],
    circles: [{ cx: 0.5, cy: 0.5, r: 0.24 }],
    dots: [{ x: 0.5, y: 0.5, label: 'Pusat' }],
  },
  {
    id: 'triangle',
    name: 'Segitiga (Triangle)',
    dimension: '2D',
    category: 'basic',
    description: '3 sisi lurus dan 3 sudut dengan jumlah 180°',
    lines: [
      { from: { x: 0.5, y: 0.24 }, to: { x: 0.76, y: 0.76 }, style: 'dashed' },
      { from: { x: 0.76, y: 0.76 }, to: { x: 0.24, y: 0.76 }, style: 'dashed' },
      { from: { x: 0.24, y: 0.76 }, to: { x: 0.5, y: 0.24 }, style: 'dashed' },
    ],
    dots: [
      { x: 0.5, y: 0.24, label: 'Puncak' },
      { x: 0.76, y: 0.76 },
      { x: 0.24, y: 0.76 },
    ],
  },
  {
    id: 'rectangle',
    name: 'Persegi Panjang (Rectangle)',
    dimension: '2D',
    category: 'basic',
    description: '4 sudut siku-siku dengan sisi berhadapan sama panjang',
    lines: [
      { from: { x: 0.18, y: 0.34 }, to: { x: 0.82, y: 0.34 }, style: 'dashed' },
      { from: { x: 0.82, y: 0.34 }, to: { x: 0.82, y: 0.66 }, style: 'dashed' },
      { from: { x: 0.82, y: 0.66 }, to: { x: 0.18, y: 0.66 }, style: 'dashed' },
      { from: { x: 0.18, y: 0.66 }, to: { x: 0.18, y: 0.34 }, style: 'dashed' },
    ],
    dots: [
      { x: 0.18, y: 0.34 },
      { x: 0.82, y: 0.34 },
      { x: 0.82, y: 0.66 },
      { x: 0.18, y: 0.66 },
    ],
  },

  // ================= 3D WIREFRAME TEMPLATES =================
  {
    id: 'cube',
    name: 'Kubus 3D (Cube)',
    dimension: '3D',
    category: '3d_solid',
    description: '8 titik sudut, 12 rusuk sama panjang, dan 6 sisi bujur sangkar',
    lines: [
      // Front face
      { from: { x: 0.26, y: 0.44 }, to: { x: 0.62, y: 0.44 }, style: 'solid' },
      { from: { x: 0.62, y: 0.44 }, to: { x: 0.62, y: 0.80 }, style: 'solid' },
      { from: { x: 0.62, y: 0.80 }, to: { x: 0.26, y: 0.80 }, style: 'solid' },
      { from: { x: 0.26, y: 0.80 }, to: { x: 0.26, y: 0.44 }, style: 'solid' },
      // Back face (offset top-right)
      { from: { x: 0.38, y: 0.24 }, to: { x: 0.74, y: 0.24 }, style: 'dashed' },
      { from: { x: 0.74, y: 0.24 }, to: { x: 0.74, y: 0.60 }, style: 'dashed' },
      { from: { x: 0.74, y: 0.60 }, to: { x: 0.38, y: 0.60 }, style: 'dashed' },
      { from: { x: 0.38, y: 0.60 }, to: { x: 0.38, y: 0.24 }, style: 'dashed' },
      // 4 Connecting edges (depth lines)
      { from: { x: 0.26, y: 0.44 }, to: { x: 0.38, y: 0.24 }, style: 'solid' },
      { from: { x: 0.62, y: 0.44 }, to: { x: 0.74, y: 0.24 }, style: 'solid' },
      { from: { x: 0.62, y: 0.80 }, to: { x: 0.74, y: 0.60 }, style: 'solid' },
      { from: { x: 0.26, y: 0.80 }, to: { x: 0.38, y: 0.60 }, style: 'dashed' },
    ],
    dots: [
      { x: 0.26, y: 0.44 },
      { x: 0.62, y: 0.44 },
      { x: 0.62, y: 0.80 },
      { x: 0.26, y: 0.80 },
      { x: 0.38, y: 0.24 },
      { x: 0.74, y: 0.24 },
      { x: 0.74, y: 0.60 },
      { x: 0.38, y: 0.60 },
    ],
  },
  {
    id: 'cuboid',
    name: 'Balok 3D (Cuboid)',
    dimension: '3D',
    category: '3d_solid',
    description: 'Bangun ruang 3D dengan 6 bidang persegi panjang',
    lines: [
      // Front rectangle
      { from: { x: 0.18, y: 0.46 }, to: { x: 0.70, y: 0.46 }, style: 'solid' },
      { from: { x: 0.70, y: 0.46 }, to: { x: 0.70, y: 0.78 }, style: 'solid' },
      { from: { x: 0.70, y: 0.78 }, to: { x: 0.18, y: 0.78 }, style: 'solid' },
      { from: { x: 0.18, y: 0.78 }, to: { x: 0.18, y: 0.46 }, style: 'solid' },
      // Back rectangle
      { from: { x: 0.28, y: 0.28 }, to: { x: 0.80, y: 0.28 }, style: 'dashed' },
      { from: { x: 0.80, y: 0.28 }, to: { x: 0.80, y: 0.60 }, style: 'dashed' },
      { from: { x: 0.80, y: 0.60 }, to: { x: 0.28, y: 0.60 }, style: 'dashed' },
      { from: { x: 0.28, y: 0.60 }, to: { x: 0.28, y: 0.28 }, style: 'dashed' },
      // Connectors
      { from: { x: 0.18, y: 0.46 }, to: { x: 0.28, y: 0.28 }, style: 'solid' },
      { from: { x: 0.70, y: 0.46 }, to: { x: 0.80, y: 0.28 }, style: 'solid' },
      { from: { x: 0.70, y: 0.78 }, to: { x: 0.80, y: 0.60 }, style: 'solid' },
      { from: { x: 0.18, y: 0.78 }, to: { x: 0.28, y: 0.60 }, style: 'dashed' },
    ],
    dots: [
      { x: 0.18, y: 0.46 },
      { x: 0.70, y: 0.46 },
      { x: 0.70, y: 0.78 },
      { x: 0.18, y: 0.78 },
      { x: 0.28, y: 0.28 },
      { x: 0.80, y: 0.28 },
      { x: 0.80, y: 0.60 },
      { x: 0.28, y: 0.60 },
    ],
  },
  {
    id: 'pyramid',
    name: 'Limas Segiempat (Pyramid)',
    dimension: '3D',
    category: '3d_solid',
    description: 'Alas segiempat di bawah dengan 1 titik puncak di atas',
    lines: [
      // Base
      { from: { x: 0.22, y: 0.72 }, to: { x: 0.64, y: 0.72 }, style: 'solid' },
      { from: { x: 0.64, y: 0.72 }, to: { x: 0.78, y: 0.56 }, style: 'solid' },
      { from: { x: 0.78, y: 0.56 }, to: { x: 0.36, y: 0.56 }, style: 'dashed' },
      { from: { x: 0.36, y: 0.56 }, to: { x: 0.22, y: 0.72 }, style: 'dashed' },
      // Slanted edges to Apex (0.50, 0.22)
      { from: { x: 0.50, y: 0.22 }, to: { x: 0.22, y: 0.72 }, style: 'solid' },
      { from: { x: 0.50, y: 0.22 }, to: { x: 0.64, y: 0.72 }, style: 'solid' },
      { from: { x: 0.50, y: 0.22 }, to: { x: 0.78, y: 0.56 }, style: 'solid' },
      { from: { x: 0.50, y: 0.22 }, to: { x: 0.36, y: 0.56 }, style: 'dashed' },
    ],
    dots: [
      { x: 0.50, y: 0.22, label: 'Puncak' },
      { x: 0.22, y: 0.72 },
      { x: 0.64, y: 0.72 },
      { x: 0.78, y: 0.56 },
      { x: 0.36, y: 0.56 },
    ],
  },
  {
    id: 'triangular_prism',
    name: 'Prisma Segitiga (Prism/Tenda)',
    dimension: '3D',
    category: '3d_solid',
    description: '2 alas segitiga kongruen dihubungkan 3 sisi persegi panjang',
    lines: [
      // Front triangle
      { from: { x: 0.25, y: 0.75 }, to: { x: 0.55, y: 0.75 }, style: 'solid' },
      { from: { x: 0.55, y: 0.75 }, to: { x: 0.40, y: 0.40 }, style: 'solid' },
      { from: { x: 0.40, y: 0.40 }, to: { x: 0.25, y: 0.75 }, style: 'solid' },
      // Back triangle
      { from: { x: 0.45, y: 0.60 }, to: { x: 0.75, y: 0.60 }, style: 'dashed' },
      { from: { x: 0.75, y: 0.60 }, to: { x: 0.60, y: 0.25 }, style: 'dashed' },
      { from: { x: 0.60, y: 0.25 }, to: { x: 0.45, y: 0.60 }, style: 'dashed' },
      // Connectors
      { from: { x: 0.40, y: 0.40 }, to: { x: 0.60, y: 0.25 }, style: 'solid' },
      { from: { x: 0.55, y: 0.75 }, to: { x: 0.75, y: 0.60 }, style: 'solid' },
      { from: { x: 0.25, y: 0.75 }, to: { x: 0.45, y: 0.60 }, style: 'dashed' },
    ],
    dots: [
      { x: 0.25, y: 0.75 },
      { x: 0.55, y: 0.75 },
      { x: 0.40, y: 0.40 },
      { x: 0.45, y: 0.60 },
      { x: 0.75, y: 0.60 },
      { x: 0.60, y: 0.25 },
    ],
  },

  // ================= 3D REAL OBJECTS =================
  {
    id: 'house_3d',
    name: 'Rumah 3D (3D House)',
    dimension: '3D',
    category: 'real_object',
    description: 'Kreasi bangunan: Kubus (badan) + Prisma Segitiga (atap)',
    lines: [
      // House Body Front
      { from: { x: 0.28, y: 0.52 }, to: { x: 0.64, y: 0.52 }, style: 'solid' },
      { from: { x: 0.64, y: 0.52 }, to: { x: 0.64, y: 0.84 }, style: 'solid' },
      { from: { x: 0.64, y: 0.84 }, to: { x: 0.28, y: 0.84 }, style: 'solid' },
      { from: { x: 0.28, y: 0.84 }, to: { x: 0.28, y: 0.52 }, style: 'solid' },
      // House Body Back
      { from: { x: 0.40, y: 0.40 }, to: { x: 0.76, y: 0.40 }, style: 'dashed' },
      { from: { x: 0.76, y: 0.40 }, to: { x: 0.76, y: 0.72 }, style: 'dashed' },
      { from: { x: 0.76, y: 0.72 }, to: { x: 0.40, y: 0.72 }, style: 'dashed' },
      { from: { x: 0.40, y: 0.72 }, to: { x: 0.40, y: 0.40 }, style: 'dashed' },
      // House Body Connectors
      { from: { x: 0.28, y: 0.52 }, to: { x: 0.40, y: 0.40 }, style: 'solid' },
      { from: { x: 0.64, y: 0.52 }, to: { x: 0.76, y: 0.40 }, style: 'solid' },
      { from: { x: 0.64, y: 0.84 }, to: { x: 0.76, y: 0.72 }, style: 'solid' },
      // Roof Front Apex (0.46, 0.32)
      { from: { x: 0.28, y: 0.52 }, to: { x: 0.46, y: 0.32 }, style: 'solid' },
      { from: { x: 0.64, y: 0.52 }, to: { x: 0.46, y: 0.32 }, style: 'solid' },
      // Roof Back Apex (0.58, 0.20)
      { from: { x: 0.40, y: 0.40 }, to: { x: 0.58, y: 0.20 }, style: 'dashed' },
      { from: { x: 0.76, y: 0.40 }, to: { x: 0.58, y: 0.20 }, style: 'dashed' },
      // Roof Ridge
      { from: { x: 0.46, y: 0.32 }, to: { x: 0.58, y: 0.20 }, style: 'solid' },
    ],
    dots: [
      { x: 0.46, y: 0.32, label: 'Atap' },
      { x: 0.58, y: 0.20 },
      { x: 0.28, y: 0.52 },
      { x: 0.64, y: 0.52 },
    ],
  },
  {
    id: 'cylinder',
    name: 'Tabung/Silinder (Cylinder)',
    dimension: '3D',
    category: '3d_solid',
    description: 'Bangun ruang dengan 2 lingkaran sejajar dan bidang lengkung',
    lines: [
      { from: { x: 0.32, y: 0.35 }, to: { x: 0.32, y: 0.75 }, style: 'solid' },
      { from: { x: 0.68, y: 0.35 }, to: { x: 0.68, y: 0.75 }, style: 'solid' },
    ],
    ellipses: [
      { cx: 0.50, cy: 0.35, rx: 0.18, ry: 0.08 },
      { cx: 0.50, cy: 0.75, rx: 0.18, ry: 0.08 },
    ],
    dots: [
      { x: 0.50, y: 0.35, label: 'Atas' },
      { x: 0.50, y: 0.75, label: 'Bawah' },
    ],
  },
];

/**
 * Renders the chosen template onto canvas context with delicate ghost line styling.
 */
export function renderTemplateOnCanvas(
  ctx: CanvasRenderingContext2D,
  templateId: string,
  width: number,
  height: number,
  opacity: number = 0.35
) {
  const tmpl = SHAPE_TEMPLATES.find((t) => t.id === templateId);
  if (!tmpl) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0.1, Math.min(0.9, opacity));

  // Style for template guide lines
  ctx.strokeStyle = '#6366f1'; // Indigo tint
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw Lines
  for (const line of tmpl.lines) {
    ctx.beginPath();
    if (line.style === 'dashed') {
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = '#94a3b8'; // softer gray for hidden/depth edges
    } else {
      ctx.setLineDash([]);
      ctx.strokeStyle = '#4f46e5';
    }

    ctx.moveTo(line.from.x * width, line.from.y * height);
    ctx.lineTo(line.to.x * width, line.to.y * height);
    ctx.stroke();
  }

  // Draw Circles
  if (tmpl.circles) {
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = '#4f46e5';
    for (const c of tmpl.circles) {
      ctx.beginPath();
      ctx.arc(c.cx * width, c.cy * height, c.r * Math.min(width, height), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Draw Ellipses
  if (tmpl.ellipses) {
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = '#4f46e5';
    for (const el of tmpl.ellipses) {
      ctx.beginPath();
      ctx.ellipse(
        el.cx * width,
        el.cy * height,
        el.rx * width,
        el.ry * height,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
  }

  // Draw Corner Dots with soft halos
  if (tmpl.dots) {
    ctx.setLineDash([]);
    for (const dot of tmpl.dots) {
      const dx = dot.x * width;
      const dy = dot.y * height;

      // Halo
      ctx.beginPath();
      ctx.arc(dx, dy, 7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
      ctx.fill();

      // Core point
      ctx.beginPath();
      ctx.arc(dx, dy, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#4338ca';
      ctx.fill();

      if (dot.label) {
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.fillStyle = '#1e1b4b';
        ctx.fillText(dot.label, dx + 8, dy - 8);
      }
    }
  }

  ctx.restore();
}

// ================= LIVE 3D CAMERA INTERACTIVE TUTORIALS =================
export const LIVE_3D_TUTORIALS: Tutorial3DModel[] = [
  {
    id: 'cube',
    name: 'Kubus 3D (3D Cube)',
    category: '3d_solid',
    difficulty: 'Mudah',
    description: 'Pelajari cara menggambar kubus 3D dalam 3 langkah mudah!',
    steps: [
      {
        stepNumber: 1,
        title: 'Langkah 1: Gambar Kotak Depan',
        instruction: 'Tarik garis membentuk persegi/kotak pertama di bagian depan.',
        tip: 'Jepit telunjuk & jempol, lalu buat 4 garis sama panjang.',
        lines: [
          { from: { x: 0.26, y: 0.44 }, to: { x: 0.62, y: 0.44 } },
          { from: { x: 0.62, y: 0.44 }, to: { x: 0.62, y: 0.80 } },
          { from: { x: 0.62, y: 0.80 }, to: { x: 0.26, y: 0.80 } },
          { from: { x: 0.26, y: 0.80 }, to: { x: 0.26, y: 0.44 } },
        ],
        highlightPoints: [
          { x: 0.26, y: 0.44, label: 'Mulai di sini' },
          { x: 0.62, y: 0.44 },
          { x: 0.62, y: 0.80 },
          { x: 0.26, y: 0.80 },
        ],
      },
      {
        stepNumber: 2,
        title: 'Langkah 2: Gambar Kotak Belakang',
        instruction: 'Buat kotak kedua yang ukurannya sama persis, sedikit digeser ke kanan atas.',
        tip: 'Kotak kedua ini akan memberi efek kedalaman visual 3 dimensi!',
        lines: [
          { from: { x: 0.38, y: 0.24 }, to: { x: 0.74, y: 0.24 } },
          { from: { x: 0.74, y: 0.24 }, to: { x: 0.74, y: 0.60 } },
          { from: { x: 0.74, y: 0.60 }, to: { x: 0.38, y: 0.60 } },
          { from: { x: 0.38, y: 0.60 }, to: { x: 0.38, y: 0.24 } },
        ],
        highlightPoints: [
          { x: 0.38, y: 0.24, label: 'Geser ke atas' },
          { x: 0.74, y: 0.24 },
          { x: 0.74, y: 0.60 },
          { x: 0.38, y: 0.60 },
        ],
      },
      {
        stepNumber: 3,
        title: 'Langkah 3: Hubungkan 4 Sudut Garis Kedalaman',
        instruction: 'Tarik 4 garis miring untuk menyambungkan sudut kotak depan ke sudut kotak belakang yang pas.',
        tip: 'Kiri atas ke kiri atas, kanan atas ke kanan atas, dan seterusnya!',
        lines: [
          { from: { x: 0.26, y: 0.44 }, to: { x: 0.38, y: 0.24 } },
          { from: { x: 0.62, y: 0.44 }, to: { x: 0.74, y: 0.24 } },
          { from: { x: 0.62, y: 0.80 }, to: { x: 0.74, y: 0.60 } },
          { from: { x: 0.26, y: 0.80 }, to: { x: 0.38, y: 0.60 } },
        ],
        highlightPoints: [
          { x: 0.26, y: 0.44 },
          { x: 0.38, y: 0.24 },
          { x: 0.62, y: 0.44 },
          { x: 0.74, y: 0.24 },
        ],
      },
    ],
  },

  {
    id: 'pyramid',
    name: 'Limas Segiempat 3D (Pyramid)',
    category: '3d_solid',
    difficulty: 'Menengah',
    description: 'Kuasai teknik menggambar piramida Mesir dengan 1 titik puncak!',
    steps: [
      {
        stepNumber: 1,
        title: 'Langkah 1: Gambar Alas Miring',
        instruction: 'Gambar bidang segiempat miring (jajar genjang) di bagian bawah sebagai lantai alas piramida.',
        tip: 'Garis bawah mendatar, garis samping sedikit menyerong.',
        lines: [
          { from: { x: 0.22, y: 0.72 }, to: { x: 0.64, y: 0.72 } },
          { from: { x: 0.64, y: 0.72 }, to: { x: 0.78, y: 0.56 } },
          { from: { x: 0.78, y: 0.56 }, to: { x: 0.36, y: 0.56 } },
          { from: { x: 0.36, y: 0.56 }, to: { x: 0.22, y: 0.72 } },
        ],
      },
      {
        stepNumber: 2,
        title: 'Langkah 2: Tandai Titik Puncak (Apex)',
        instruction: 'Arahkan kursor ke tengah atas dan buat titik puncak piramida.',
        tip: 'Pastikan titik puncak berada tepat di atas tengah-tengah alas.',
        lines: [],
        highlightPoints: [{ x: 0.50, y: 0.22, label: 'Puncak Piramida' }],
      },
      {
        stepNumber: 3,
        title: 'Langkah 3: Tarik 4 Garis Kemiringan',
        instruction: 'Sambungkan titik puncak ke setiap 4 sudut alas di bawah.',
        tip: 'Sekarang piramida 3 dimensi sudah terbentuk sempurna!',
        lines: [
          { from: { x: 0.50, y: 0.22 }, to: { x: 0.22, y: 0.72 } },
          { from: { x: 0.50, y: 0.22 }, to: { x: 0.64, y: 0.72 } },
          { from: { x: 0.50, y: 0.22 }, to: { x: 0.78, y: 0.56 } },
          { from: { x: 0.50, y: 0.22 }, to: { x: 0.36, y: 0.56 } },
        ],
      },
    ],
  },

  {
    id: 'house_3d',
    name: 'Rumah 3D (3D House Creation)',
    category: 'real_object',
    difficulty: 'Kreatif',
    description: 'Gabungkan Kubus 3D dan Prisma Segitiga menjadi rumah 3D impianmu!',
    steps: [
      {
        stepNumber: 1,
        title: 'Langkah 1: Gambar Badan Rumah (Balok/Kubus)',
        instruction: 'Gambar kubus dasar yang menjadi ruangan dan dinding rumah.',
        tip: 'Ikuti garis panduan dinding depan dan samping.',
        lines: [
          { from: { x: 0.28, y: 0.52 }, to: { x: 0.64, y: 0.52 } },
          { from: { x: 0.64, y: 0.52 }, to: { x: 0.64, y: 0.84 } },
          { from: { x: 0.64, y: 0.84 }, to: { x: 0.28, y: 0.84 } },
          { from: { x: 0.28, y: 0.84 }, to: { x: 0.28, y: 0.52 } },
          { from: { x: 0.64, y: 0.52 }, to: { x: 0.76, y: 0.40 } },
          { from: { x: 0.64, y: 0.84 }, to: { x: 0.76, y: 0.72 } },
        ],
      },
      {
        stepNumber: 2,
        title: 'Langkah 2: Tambahkan Atap Segitiga Prisma',
        instruction: 'Tarik segitiga atap di depan dan bubungan garis atap ke belakang.',
        tip: 'Atap melindungi rumah dari panas dan hujan!',
        lines: [
          { from: { x: 0.28, y: 0.52 }, to: { x: 0.46, y: 0.32 } },
          { from: { x: 0.64, y: 0.52 }, to: { x: 0.46, y: 0.32 } },
          { from: { x: 0.46, y: 0.32 }, to: { x: 0.58, y: 0.20 } },
          { from: { x: 0.76, y: 0.40 }, to: { x: 0.58, y: 0.20 } },
        ],
      },
      {
        stepNumber: 3,
        title: 'Langkah 3: Hias Pintu dan Jendela',
        instruction: 'Buat persegi panjang kecil untuk pintu dan jendela rumahmu!',
        tip: 'Hebat! Kamu sudah berhasil membuat objek 3D dari kombinasi bangun ruang!',
        lines: [
          // Door
          { from: { x: 0.42, y: 0.66 }, to: { x: 0.50, y: 0.66 } },
          { from: { x: 0.50, y: 0.66 }, to: { x: 0.50, y: 0.84 } },
          { from: { x: 0.42, y: 0.84 }, to: { x: 0.42, y: 0.66 } },
        ],
      },
    ],
  },
];
