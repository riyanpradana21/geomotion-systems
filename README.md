# Simple AI Camera Geometry – Interactive Geometry Learning

An educational web application for children to learn and draw 2D and 3D geometric shapes using hand gestures detected in real-time through their webcam.

---

## 1. Project Overview & Core Concept

**Simple AI Camera Geometry** turns any standard computer webcam into an air-drawing geometry canvas:
- **Index Pointing**: Moves the virtual crosshair cursor across the canvas smoothly without touching the keyboard or mouse.
- **Thumb-Index Pinch**: Activates the digital drawing pen with real-time Bézier smoothing and sound feedback.
- **Pinch Release**: Lifts the pen to stop drawing the current stroke.
- **Open Palm**: Temporarily pauses drawing.
- **Closed Fist (with 2s Hold Countdown)**: Tahan kepalan selama 2 detik dengan hitungan mundur visual untuk menyelesaikan gambar secara aman tanpa ketidaksengajaan!
- **Pola Tipis (Ghost Tracing Guide)**: Overlay pola garis tipis 2D & 3D (Kubus, Balok, Limas, Prisma, Tabung, Rumah 3D) yang memudahkan anak-anak menjiplak bentuk geometri.
- **Auto-Correct (Rapikan Bentuk Otomatis)**: Sekali klik tombol "Rapikan Bentuk", goresan tangan yang bergelombang langsung disempurnakan menjadi bentuk geometri presisi bergaris lurus dengan sudut 90° sempurna!
- **Tutorial Interaktif Bangun Ruang 3D pada Kamera**: Panduan visual langkah demi langkah (Step 1, 2, 3) langsung di atas video webcam untuk memandu pembuatan kubus, limas, dan rumah 3D.
- **100% Local AI Processing**: Semua pelacakan tangan dan pengenalan geometri berjalan offline di browser client. Nol panggilan cloud eksternal, sangat hemat kuota/token.

---

## 2. Architecture & Technology Stack

```
                          ┌────────────────────────────────────────┐
                          │         Web Browser (Client)           │
                          │                                        │
  Webcam Feed ──────────► │  MediaPipe Hand Landmarker (WASM)     │
                          │        21 Landmarks Detection          │
                          │                   │                    │
                          │                   ▼                    │
                          │  Gesture Classifier & Safety Smoother  │
                          │   (Pointing / Pinch / Fist 2s Hold)    │
                          │                   │                    │
                          │                   ▼                    │
                          │  Virtual Drawing Board (Canvas)        │
                          │   (Pola Tipis + Auto-Correct + Bézier) │
                          │                   │                    │
                          │                   ▼                    │
                          │  Geometric Recognition Engine         │
                          │  (Ramer-Douglas-Peucker, Angles,       │
                          │   Circularity, 3D Graph Topology)      │
                          └───────────────────┬────────────────────┘
                                              │ Metadata Only
                                              ▼ (JSON)
                          ┌────────────────────────────────────────┐
                          │       FastAPI Backend Server           │
                          │  - Shapes Reference Catalog            │
                          │  - Step-by-Step Lesson Guides          │
                          │  - Learning History (SQLite DB)        │
                          └────────────────────────────────────────┘
```

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + Lucide React icons
- **Computer Vision**: `@mediapipe/tasks-vision` (loaded locally from `/wasm` and `/models`)
- **Graphics**: HTML5 2D Canvas with dual-layer rendering (drawing layer + cursor HUD overlay + ghost template)
- **Audio Feedback**: Synthesized kid-friendly tones via Web Audio API (zero audio file dependencies)

### Backend
- **Framework**: Python FastAPI
- **Validation**: Pydantic v2
- **Database**: SQLite3 (`geometry_learning.db`)
- **Server**: Uvicorn ASGI

---

## 3. Directory Structure

```
project-ai/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application & CORS setup
│   │   ├── database.py          # SQLite connection manager & schema init
│   │   ├── schemas.py           # Pydantic validation models
│   │   ├── seed_data.py         # Curated 2D/3D shapes and lessons seed
│   │   └── routers/
│   │       ├── health.py        # GET /api/health
│   │       ├── shapes.py        # GET /api/shapes
│   │       ├── lessons.py       # GET /api/lessons, GET /api/lessons/{id}
│   │       ├── history.py       # GET, POST, DELETE /api/history
│   │       └── three_d.py       # GET /api/3d/models, POST /api/3d/transform
│   ├── test_direct.py           # Backend test suite
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   ├── models/
│   │   │   └── hand_landmarker.task   # Local MediaPipe model (7.8 MB)
│   │   └── wasm/                      # Local MediaPipe WASM runtime files
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx             # Main navigation bar (with Studio 3D 360°)
│   │   │   ├── CanvasBoard.tsx        # Drawing board, ghost template, auto-correct & stabilizer
│   │   │   ├── CameraFeed.tsx         # WebRTC feed, MediaPipe loop & hold countdown
│   │   │   ├── GestureIndicator.tsx   # Visual gesture status & fist countdown meter
│   │   │   ├── Tutorial3DOverlay.tsx  # Interactive step-by-step 3D live camera guide
│   │   │   ├── ResultCard.tsx         # Geometric result & characteristics
│   │   │   └── StatsCard.tsx          # Educational KPI metric cards
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx          # Overview, challenges & recent activity
│   │   │   ├── LearningCenter.tsx     # Step-by-step 2D & 3D lesson guides
│   │   │   ├── InteractiveCamera.tsx  # Main air-drawing camera playground
│   │   │   ├── Studio3D.tsx           # 360° Hand Gesture 3D WebGL Studio & free catalog
│   │   │   ├── RecognitionResult.tsx  # Analysis review & save to history
│   │   │   ├── LearningHistory.tsx    # Past drawing records & filters
│   │   │   └── Settings.tsx           # Sensitivity, fist safety, pen modes & stabilizer
│   │   ├── services/
│   │   │   ├── api.ts                 # Backend REST client (3D models & transform)
│   │   │   ├── handTracker.ts         # MediaPipe initialization & 3D yaw/pitch/roll vectors
│   │   │   ├── geometryRecognizer.ts  # Phase 1: 2D geometry algorithms
│   │   │   ├── geometry3DRecognizer.ts# Phase 2: 3D wireframe topology
│   │   │   ├── templates.ts           # Ghost outlines & 3D tutorials data
│   │   │   ├── autoCorrect.ts         # Magic snap shape beautifier
│   │   │   ├── smoothing.ts           # Adaptive Velocity-Aware Cursor Smoother
│   │   │   └── sound.ts               # Synthesized Web Audio tones
│   │   ├── types/
│   │   │   └── index.ts               # TypeScript domain interfaces
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md
```

---

## 4. Local Installation & Setup

### Prerequisites
- **Node.js**: v18.0.0 or later (v22 tested)
- **Python**: 3.10 or later (Python 3.11 tested)

### 4.1 Backend Setup

1. Buka terminal di folder project:
   ```bash
   cd backend
   ```

2. Pasang dependensi Python:
   ```bash
   pip install -r requirements.txt
   ```

3. Jalankan server FastAPI:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

### 4.2 Frontend Setup

1. Buka terminal baru di folder `frontend`:
   ```bash
   cd frontend
   ```

2. Pasang dependensi npm:
   ```bash
   npm install
   ```

3. Jalankan server pengembang Vite:
   ```bash
   npm run dev
   ```

4. Buka di browser:
   ```
   http://localhost:3000
   ```

---

## 5. Fitur Baru & Panduan Penggunaan

### 1. Pola Tipis (Ghost Outlines)
Di toolbar kanvas, anak-anak dapat memilih **Pola Tipis**:
- **2D**: Persegi, Lingkaran, Segitiga, Persegi Panjang.
- **3D**: Kubus, Balok, Limas Segiempat, Prisma Segitiga, Tabung Silinder, Rumah 3D.
- Tingkat kepekatan garis pola dapat diatur langsung di Pengaturan.

### 2. Auto-Correct / Rapikan Bentuk Otomatis
Jika coretan tangan anak masih bergelombang atau sedikit bengkok:
- Klik tombol **"Rapikan Bentuk" (Magic Wand)** di toolbar.
- Bentuk otomatis diperbaiki menjadi garis lurus presisi, sudut siku-siku 90° rapi, atau lingkaran mulus dengan skor akurasi tinggi!
- Tersedia tombol **"Asli"** untuk mengembalikan coretan awal kapan saja jika ingin membandingkan.

### 3. Keamanan Gestur Kepalan Tangan (Anti-Accidental Finish)
- Gerakan kepalan tangan kini dilengkapi **Hold-to-Trigger Countdown (2 Detik)**.
- Layar akan menampilkan indikator lingkaran hitung mundur: *"Tahan Kepalan... 2s"*.
- Jika tangan dilepas sebelum hitungan selesai, aksi langsung dibatalkan secara aman.
- Dapat juga dinonaktifkan di menu Pengaturan bila lebih menyukai tombol manual di layar.

### 4. Tutorial Interaktif Bangun Ruang 3D pada Kamera
- Klik tombol **"Panduan Kamera 3D"** di pojok atas Interactive Camera.
- Pilih bangun ruang: **Kubus 3D**, **Limas 3D**, atau **Rumah 3D**.
- Garis panduan langkah demi langkah (Step 1 -> Step 2 -> Step 3) akan muncul langsung di atas video kamera dan kanvas, lengkap dengan arahan teks ramah anak!

### 5. Peningkatan Kontrol Jari Anti-Salah & Anti-Lelah
Untuk mengatasi kesulitan anak-anak saat menggerakkan jari di udara:
- **Pinch Anchor Optimization**: Titik kursor saat menjepit otomatis dihitung dari titik tengah antara ujung jempol dan telunjuk, mengeliminasi lonjakan kursor 20-40px saat jari bergerak mendekati jempol.
- **Schmitt Trigger Hysteresis**: Ambang aktivasi jepit (0.32) dan lepas (0.43) dipisah, menghentikan garis putus-putus berkedip saat jari berada di batas toleransi.
- **Mode Kontrol Tangan**:
  - `👌 Jepit Tahan`: Mode standar, tahan jepit untuk menggambar.
  - `🔒 Kunci Pena`: Sekali jepit pena terkunci aktif, tangan bisa digerakkan dengan santai tanpa harus menahan jepitan (sangat ramah anak & anti-pegal). Jepit sekali lagi untuk melepaskan pena.
  - `👆 Tunjuk Bebas`: Menggambar otomatis mengikuti arah telunjuk.
- **Stabilizer Adaptif**: Pilihan filter `Lembut`, `Stabil (Rekomendasi)`, dan `Ultra Halus` untuk meredam tremor tangan.

### 6. Studio 3D Interaktif: Rotasi 360°, Zoom & Katalog Gratis No-Limit
Menu baru **Studio 3D** menghadirkan eksplorasi objek 3 dimensi WebGL berkinerja tinggi:
- **Gerakan Tangan 360°**: Miringkan telapak tangan ke kiri/kanan/atas/bawah untuk memutar objek 3D 360 derajat secara mulus.
- **Zoom In / Zoom Out**: Buka/tutup jarak jari telunjuk dan jempol untuk memperbesar atau memperkecil model 3D secara dinamis.
- **Translasi Posisi**: Gerakkan telapak tangan ke kiri/kanan/atas/bawah untuk menggeser objek di ruang 3D.
- **Katalog Gratis No-Limit Tanpa Login**:
  - Bangun Geometri: Kubus, Balok, Bola, Silinder, Limas Segiempat, Prisma Segitiga.
  - Model Edukasi Bebas API Key & Tanpa Limit: Planet Bumi (Globe), Roket Antariksa (Apollo 3D), Rumah 3D (Arsitektur), Satelit Orbit.
- **Perhitungan Python Backend**: Endpoint `POST /api/3d/transform` memvalidasi dan memproses matriks Euler & skala secara real-time.
- **Hemat Token 100%**: Sepenuhnya dijalankan pada runtime lokal (Client Three.js + MediaPipe WASM + FastAPI), tanpa panggilan ke LLM berbayar atau API eksternal.
