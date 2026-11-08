import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Model3DCatalogItem, GestureDetectionResult } from '../types';
import { fetch3DModels, sendHandTransform } from '../services/api';
import { getHandLandmarker, classifyHandGesture } from '../services/handTracker';
import {
  Box,
  Rotate3d,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Camera,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  Sliders,
  Move,
  Eye,
  Globe,
  Rocket,
  Home,
} from 'lucide-react';

export const Studio3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [models, setModels] = useState<Model3DCatalogItem[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('cube');
  const [loading, setLoading] = useState<boolean>(true);
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);

  // Gesture Tracking State
  const [handActive, setHandActive] = useState<boolean>(false);
  const [gestureInfo, setGestureInfo] = useState<{
    yaw: number;
    pitch: number;
    zoom: number;
    panX: number;
    panY: number;
  }>({ yaw: 0, pitch: 0, zoom: 1.0, panX: 0, panY: 0 });

  // Python-computed view metrics
  const [pythonSpecs, setPythonSpecs] = useState<{
    azimuth: number;
    elevation: number;
    scale: number;
  }>({ azimuth: 0, elevation: 0, scale: 1.0 });

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const objectGroupRef = useRef<THREE.Group | null>(null);

  // Mouse drag tracking for fallback
  const isDraggingRef = useRef<boolean>(false);
  const prevMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);

  // Load models catalog from backend
  useEffect(() => {
    async function initCatalog() {
      try {
        const catalog = await fetch3DModels();
        setModels(catalog);
      } catch (e) {
        console.error('Failed to load 3D models catalog:', e);
      } finally {
        setLoading(false);
      }
    }
    initCatalog();
  }, []);

  // Initialize Three.js WebGL Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0f172a'); // Slate 900
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x60a5fa, 1.2);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 0.8);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // 5. Grid Ground
    const grid = new THREE.GridHelper(10, 10, 0x475569, 0x1e293b);
    grid.position.y = -2;
    scene.add(grid);

    // 6. Object Container Group
    const group = new THREE.Group();
    scene.add(group);
    objectGroupRef.current = group;

    // Resize listener
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      if (group && autoRotate) {
        group.rotation.y += 0.01;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
    };
  }, [autoRotate]);

  // Construct 3D Geometry when selectedModelId changes
  useEffect(() => {
    const group = objectGroupRef.current;
    if (!group) return;

    // Clear previous children
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
      if ((child as any).material) {
        if (Array.isArray((child as any).material)) {
          (child as any).material.forEach((m: any) => m.dispose());
        } else {
          (child as any).material.dispose();
        }
      }
    }

    const primaryColor = 0x6366f1; // Indigo
    const accentColor = 0x38bdf8; // Sky

    const mainMaterial = new THREE.MeshStandardMaterial({
      color: primaryColor,
      roughness: 0.25,
      metalness: 0.15,
      wireframe: isWireframe,
    });

    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 2,
    });

    const addEdges = (mesh: THREE.Mesh, geom: THREE.BufferGeometry) => {
      const edgesGeom = new THREE.EdgesGeometry(geom, 24);
      const edgeLines = new THREE.LineSegments(edgesGeom, edgeMaterial);
      mesh.add(edgeLines);
    };

    switch (selectedModelId) {
      case 'cube': {
        const geom = new THREE.BoxGeometry(2.4, 2.4, 2.4);
        const mesh = new THREE.Mesh(geom, mainMaterial);
        addEdges(mesh, geom);
        group.add(mesh);
        break;
      }
      case 'cuboid': {
        const geom = new THREE.BoxGeometry(3.4, 1.8, 1.8);
        const mesh = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ color: 0x0ea5e9, wireframe: isWireframe }));
        addEdges(mesh, geom);
        group.add(mesh);
        break;
      }
      case 'pyramid': {
        const geom = new THREE.CylinderGeometry(0, 1.9, 2.4, 4);
        const mesh = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ color: 0xf59e0b, wireframe: isWireframe }));
        addEdges(mesh, geom);
        group.add(mesh);
        break;
      }
      case 'triangular_prism': {
        const geom = new THREE.CylinderGeometry(1.6, 1.6, 2.6, 3);
        const mesh = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ color: 0x10b981, wireframe: isWireframe }));
        addEdges(mesh, geom);
        group.add(mesh);
        break;
      }
      case 'cylinder': {
        const geom = new THREE.CylinderGeometry(1.4, 1.4, 2.8, 24);
        const mesh = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ color: 0x8b5cf6, wireframe: isWireframe }));
        addEdges(mesh, geom);
        group.add(mesh);
        break;
      }
      case 'cone': {
        const geom = new THREE.ConeGeometry(1.5, 2.8, 24);
        const mesh = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ color: 0xec4899, wireframe: isWireframe }));
        addEdges(mesh, geom);
        group.add(mesh);
        break;
      }
      case 'sphere': {
        const geom = new THREE.SphereGeometry(1.6, 28, 28);
        const mesh = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ color: 0x14b8a6, wireframe: isWireframe }));
        addEdges(mesh, geom);
        group.add(mesh);
        break;
      }
      case 'earth': {
        // Earth Globe 3D with continents ring
        const geom = new THREE.SphereGeometry(1.7, 32, 32);
        const mesh = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ color: 0x0284c7, wireframe: isWireframe }));
        const ringGeom = new THREE.TorusGeometry(2.3, 0.04, 16, 60);
        const ring = new THREE.Mesh(ringGeom, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        ring.rotation.x = Math.PI / 2.3;
        mesh.add(ring);
        addEdges(mesh, geom);
        group.add(mesh);
        break;
      }
      case 'rocket': {
        // Multi-part procedural 3D rocket
        const rocketGroup = new THREE.Group();
        // Fuselage cylinder
        const bodyGeom = new THREE.CylinderGeometry(0.7, 0.7, 2.2, 18);
        const body = new THREE.Mesh(bodyGeom, new THREE.MeshStandardMaterial({ color: 0xf8fafc, wireframe: isWireframe }));
        rocketGroup.add(body);
        // Nosecone
        const coneGeom = new THREE.ConeGeometry(0.7, 1.2, 18);
        const nose = new THREE.Mesh(coneGeom, new THREE.MeshStandardMaterial({ color: 0xef4444, wireframe: isWireframe }));
        nose.position.y = 1.7;
        rocketGroup.add(nose);
        // Fins
        const finGeom = new THREE.BoxGeometry(0.1, 0.7, 0.7);
        const fin1 = new THREE.Mesh(finGeom, new THREE.MeshStandardMaterial({ color: 0xef4444 }));
        fin1.position.set(0.7, -0.8, 0);
        rocketGroup.add(fin1);
        const fin2 = fin1.clone();
        fin2.position.set(-0.7, -0.8, 0);
        rocketGroup.add(fin2);
        group.add(rocketGroup);
        break;
      }
      case 'house': {
        // 3D Architecture House
        const houseGroup = new THREE.Group();
        // Wall box
        const wallGeom = new THREE.BoxGeometry(2.4, 1.8, 2.2);
        const walls = new THREE.Mesh(wallGeom, new THREE.MeshStandardMaterial({ color: 0xf1f5f9, wireframe: isWireframe }));
        houseGroup.add(walls);
        // Roof prism
        const roofGeom = new THREE.CylinderGeometry(1.6, 1.6, 2.4, 3);
        const roof = new THREE.Mesh(roofGeom, new THREE.MeshStandardMaterial({ color: 0xf97316, wireframe: isWireframe }));
        roof.rotation.z = Math.PI / 2;
        roof.rotation.y = Math.PI / 6;
        roof.position.y = 1.6;
        houseGroup.add(roof);
        group.add(houseGroup);
        break;
      }
      case 'satellite': {
        // Solar Satellite
        const satGroup = new THREE.Group();
        const coreGeom = new THREE.BoxGeometry(1.2, 1.2, 1.2);
        const core = new THREE.Mesh(coreGeom, new THREE.MeshStandardMaterial({ color: 0xe2e8f0, wireframe: isWireframe }));
        satGroup.add(core);
        // Solar panel left & right
        const panelGeom = new THREE.BoxGeometry(2.0, 0.05, 0.9);
        const panelLeft = new THREE.Mesh(panelGeom, new THREE.MeshStandardMaterial({ color: 0x1d4ed8 }));
        panelLeft.position.x = -1.7;
        satGroup.add(panelLeft);
        const panelRight = panelLeft.clone();
        panelRight.position.x = 1.7;
        satGroup.add(panelRight);
        group.add(satGroup);
        break;
      }
      default: {
        const geom = new THREE.BoxGeometry(2, 2, 2);
        group.add(new THREE.Mesh(geom, mainMaterial));
      }
    }
  }, [selectedModelId, isWireframe]);

  // Start webcam for 3D gesture tracking
  useEffect(() => {
    let active = true;

    async function startCam() {
      try {
        const landmarker = await getHandLandmarker();
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Gesture tracking loop for 3D
        let lastTime = -1;
        let prevX = 0.5;
        let prevY = 0.5;

        const loop = () => {
          if (!active) return;
          const video = videoRef.current;
          if (video && video.readyState >= 2) {
            if (video.currentTime !== lastTime) {
              lastTime = video.currentTime;
              const res = landmarker.detectForVideo(video, performance.now());

              if (res.landmarks && res.landmarks.length > 0) {
                setHandActive(true);
                const lms = res.landmarks[0];
                const detected = classifyHandGesture(lms, 640, 480, true);

                // Compute smooth 3D translation & rotation deltas
                const palmX = detected.palmCenter ? detected.palmCenter.x : 0.5;
                const palmY = detected.palmCenter ? detected.palmCenter.y : 0.5;

                const dx = palmX - prevX;
                const dy = palmY - prevY;
                prevX = palmX;
                prevY = palmY;

                // Zoom: derived from hand scale (distance to camera) & finger spread
                const rawScale = detected.handScale || 0.2;
                const targetZoom = Math.max(0.4, Math.min(3.5, rawScale * 5.5));

                // 360 degree Euler rotation
                const euler = detected.rotation3D || { pitch: 0, yaw: 0, roll: 0 };

                // Apply to Three.js Object Group directly with physics momentum
                const group = objectGroupRef.current;
                if (group) {
                  // Rotation 360°
                  group.rotation.y += dx * 4.5;
                  group.rotation.x += dy * 4.5;

                  // Zoom
                  group.scale.set(targetZoom, targetZoom, targetZoom);

                  // Update UI status
                  const currentYaw = (group.rotation.y * 180) / Math.PI;
                  const currentPitch = (group.rotation.x * 180) / Math.PI;

                  setGestureInfo({
                    yaw: Math.round(currentYaw),
                    pitch: Math.round(currentPitch),
                    zoom: Math.round(targetZoom * 100) / 100,
                    panX: Math.round(group.position.x * 10) / 10,
                    panY: Math.round(group.position.y * 10) / 10,
                  });

                  // Communicate with Python Backend Transform Engine
                  sendHandTransform({
                    yaw: currentYaw,
                    pitch: currentPitch,
                    zoom: targetZoom,
                    pan_x: group.position.x,
                    pan_y: group.position.y,
                  }).then((res) => {
                    if (res?.transform?.view_angles) {
                      setPythonSpecs({
                        azimuth: res.transform.view_angles.azimuth,
                        elevation: res.transform.view_angles.elevation,
                        scale: res.transform.scale,
                      });
                    }
                  });
                }
              } else {
                setHandActive(false);
              }
            }
          }
          requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
      } catch (err) {
        console.warn('3D studio camera error:', err);
      }
    }

    startCam();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Mouse / Touch Drag Fallback Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - prevMouseRef.current.x;
    const dy = e.clientY - prevMouseRef.current.y;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };

    const group = objectGroupRef.current;
    if (group) {
      group.rotation.y += dx * 0.01;
      group.rotation.x += dy * 0.01;
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const group = objectGroupRef.current;
    if (group) {
      const currentScale = group.scale.x;
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const nextScale = Math.max(0.3, Math.min(4.0, currentScale * factor));
      group.scale.set(nextScale, nextScale, nextScale);
    }
  };

  const resetView = () => {
    const group = objectGroupRef.current;
    if (group) {
      group.rotation.set(0, 0, 0);
      group.position.set(0, 0, 0);
      group.scale.set(1, 1, 1);
    }
  };

  const activeModel = models.find((m) => m.id === selectedModelId);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
              Python 3D Gesture Engine (Bebas Limit & Gratis)
            </span>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> No API Key
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mt-2 tracking-tight">
            Studio 3D Hologram Interaktif
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl font-medium">
            Gerakkan tangan di udara untuk memutar objek 3D <strong>360 derajat</strong>, zoom in/out,
            dan geser ke segala arah secara instan menggunakan backend Python lokal!
          </p>
        </div>

        {/* Model Selector Dropdown */}
        <div className="bg-slate-800/80 p-2 rounded-2xl border border-slate-700 flex flex-col gap-1 self-start md:self-center min-w-[240px]">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
            Pilih Model 3D:
          </span>
          <select
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            className="bg-slate-900 text-white font-extrabold text-xs px-3 py-2 rounded-xl border border-slate-700 outline-none cursor-pointer"
          >
            <optgroup label="📐 Bangun Ruang Geometri">
              <option value="cube">Kubus 3D (Cube)</option>
              <option value="cuboid">Balok 3D (Cuboid)</option>
              <option value="pyramid">Limas Segiempat 3D</option>
              <option value="triangular_prism">Prisma Segitiga 3D</option>
              <option value="cylinder">Tabung Silinder 3D</option>
              <option value="cone">Kerucut 3D (Cone)</option>
              <option value="sphere">Bola Geometri (Sphere)</option>
            </optgroup>
            <optgroup label="🚀 Objek Edukasi & Sains Gratis">
              <option value="earth">Planet Bumi 3D (Globe)</option>
              <option value="rocket">Roket Luar Angkasa (Rocket)</option>
              <option value="house">Rumah Arsitektur 3D</option>
              <option value="satellite">Satelit Surya (Satellite)</option>
            </optgroup>
          </select>
        </div>
      </div>

      {/* Main 3D Stage & Hand Controller HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[580px]">
        {/* Left Column: 3D WebGL Canvas Viewport */}
        <div className="lg:col-span-8 flex flex-col bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden relative">
          {/* Top Controls Toolbar */}
          <div className="px-4 py-3 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-extrabold text-white text-sm">
                {activeModel?.name || '3D Object'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {activeModel?.category}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsWireframe(!isWireframe)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  isWireframe
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isWireframe ? 'Padat' : 'Kerangka'}</span>
              </button>

              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  autoRotate
                    ? 'bg-amber-600 border-amber-500 text-white shadow-xs'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <Rotate3d className="w-3.5 h-3.5" />
                <span>{autoRotate ? 'Stop Putar' : 'Putar Otomatis'}</span>
              </button>

              <button
                onClick={resetView}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all"
                title="Kembalikan Posisi Normal"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>

          {/* 3D WebGL Canvas */}
          <div
            ref={mountRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            className="flex-1 w-full h-full min-h-[440px] cursor-grab active:cursor-grabbing select-none"
          />

          {/* Floating On-Screen Gesture Status Pill */}
          <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
            <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-2xl flex items-center gap-4 text-xs font-mono text-slate-300 shadow-lg">
              <span className="flex items-center gap-1.5">
                <Rotate3d className="w-3.5 h-3.5 text-indigo-400" />
                Azimuth: <strong className="text-white">{pythonSpecs.azimuth}°</strong>
              </span>
              <span className="flex items-center gap-1.5">
                Elevasi: <strong className="text-white">{pythonSpecs.elevation}°</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5 text-sky-400" />
                Skala: <strong className="text-white">{pythonSpecs.scale}x</strong>
              </span>
            </div>

            <div className="text-[11px] bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl text-slate-400">
              🖱️ Klik & Tarik mouse / touchpad untuk memutar manual
            </div>
          </div>
        </div>

        {/* Right Column: Hand Tracking Camera Feed & Real-time Gestures */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Hand Tracker Mini Cam */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    handActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className="font-extrabold text-xs text-white">
                  {handActive ? 'Tangan Terhubung (3D Gesture)' : 'Arahkan Tangan ke Kamera'}
                </span>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                Live Sensor
              </span>
            </div>

            {/* Video Preview */}
            <div className="relative aspect-video w-full rounded-2xl bg-black overflow-hidden border border-slate-800 flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              {!handActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white text-center p-3 select-none">
                  <Camera className="w-8 h-8 opacity-60 mb-1 animate-pulse" />
                  <p className="text-xs font-semibold">Tunjukkan telapak tanganmu</p>
                </div>
              )}
            </div>
          </div>

          {/* Gesture Guide for 3D Control */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="font-black text-sm text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Cara Menggerakkan Objek 3D
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                  🖐️
                </span>
                <div>
                  <strong className="text-indigo-900 block">Putar 360° (Rotasi Bebas):</strong>
                  <span className="text-slate-600">
                    Gerakkan telapak tangan ke kiri/kanan atau atas/bawah di udara untuk memutar objek 360 derajat.
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-sky-50/70 border border-sky-100 rounded-xl flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-sky-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                  🔍
                </span>
                <div>
                  <strong className="text-sky-900 block">Zoom In / Zoom Out:</strong>
                  <span className="text-slate-600">
                    Majukan tangan mendekati webcam untuk memperbesar (Zoom In), atau mundurkan untuk memperkecil (Zoom Out).
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                  📦
                </span>
                <div>
                  <strong className="text-emerald-900 block">Spesifikasi Objek Matematika:</strong>
                  <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                    {activeModel?.specs &&
                      Object.entries(activeModel.specs).map(([k, v]) => (
                        <div key={k} className="bg-white p-1.5 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">
                            {k.replace(/_/g, ' ')}
                          </span>
                          <span className="font-extrabold text-slate-800">{String(v)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
