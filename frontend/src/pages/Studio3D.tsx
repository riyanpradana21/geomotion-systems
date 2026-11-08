import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Model3DCatalogItem } from '../types';
import { fetch3DModels, sendHandTransform } from '../services/api';
import { getHandLandmarker, classifyHandGesture, drawHandSkeleton } from '../services/handTracker';
import { sounds } from '../services/sound';
import {
  Box,
  Rotate3d,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Camera,
  Layers,
  Sparkles,
  CheckCircle2,
  Sliders,
  Eye,
  Globe,
  Scissors,
  Hand,
  Flame,
  X,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

// ================= PROCEDURAL TEXTURE GENERATORS (100% OFFLINE, ZERO API KEY) =================

/**
 * Creates an authentic, detailed Earth surface canvas texture.
 * Features realistic oceans, continental landmasses, green forests, deserts, and polar ice caps.
 */
function createRealisticEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // 1. Deep Ocean Base with Radial Depth
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
  oceanGrad.addColorStop(0, '#0a2342');
  oceanGrad.addColorStop(0.2, '#0f3c68');
  oceanGrad.addColorStop(0.5, '#12487d');
  oceanGrad.addColorStop(0.8, '#0f3c68');
  oceanGrad.addColorStop(1, '#0a2342');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, 1024, 512);

  // 2. Latitude & Longitude Subtle Grid
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
  ctx.lineWidth = 1;
  for (let y = 64; y < 512; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }
  for (let x = 64; x < 1024; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }

  // 3. Draw Continents with Coastal Shelf Glow
  const drawContinent = (pts: [number, number][], fillColor: string, shelfColor: string = '#0284c7') => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.closePath();
    ctx.shadowColor = shelfColor;
    ctx.shadowBlur = 10;
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.restore();
  };

  // Eurasia & Asia
  drawContinent(
    [[510, 110], [560, 95], [640, 90], [750, 100], [840, 130], [820, 200], [770, 230], [710, 250], [670, 260], [620, 230], [550, 210], [500, 180], [490, 140]],
    '#2e7d32'
  );
  // African Continent & Sahara
  drawContinent(
    [[490, 190], [570, 190], [590, 240], [560, 320], [520, 370], [490, 330], [460, 260], [470, 210]],
    '#d4a373'
  );
  // North America
  drawContinent(
    [[150, 90], [240, 80], [300, 110], [280, 180], [240, 240], [190, 240], [160, 180], [130, 130]],
    '#388e3c'
  );
  // South America
  drawContinent(
    [[250, 260], [310, 280], [330, 340], [290, 420], [260, 440], [240, 360], [230, 300]],
    '#1b5e20'
  );
  // Australia
  drawContinent(
    [[780, 320], [860, 320], [880, 370], [840, 410], [780, 390], [760, 350]],
    '#e0a96d'
  );
  // Indonesia & Southeast Asia
  drawContinent([[680, 280], [720, 285], [740, 300], [690, 300]], '#4caf50');
  drawContinent([[730, 275], [760, 280], [755, 290]], '#4caf50');

  // Polar Ice Caps
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 1024, 45);
  ctx.fillRect(0, 465, 1024, 47);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Creates atmospheric cloud puffs texture.
 */
function createCloudTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 1024, 512);
  const cloudCenters = [
    [200, 140, 90], [280, 160, 70], [540, 130, 110], [620, 150, 80],
    [780, 210, 100], [220, 320, 80], [340, 360, 70], [560, 340, 90],
    [820, 360, 85], [450, 80, 120], [700, 90, 110], [150, 410, 90]
  ];

  for (const [cx, cy, r] of cloudCenters) {
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

export const Studio3D: React.FC = () => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const handCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [models, setModels] = useState<Model3DCatalogItem[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('cube');
  const [loading, setLoading] = useState<boolean>(true);

  // View States
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [isXRay, setIsXRay] = useState<boolean>(false);
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [isEarthCoreOpen, setIsEarthCoreOpen] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);

  // In-Viewport Shape Chooser Modal
  const [showShapePicker, setShowShapePicker] = useState<boolean>(false);

  // Gesture & Anti-Tremor Air Cursor State
  const [handActive, setHandActive] = useState<boolean>(false);
  const [airCursor, setAirCursor] = useState<{ x: number; y: number; visible: boolean; isPinching: boolean }>({
    x: 0,
    y: 0,
    visible: false,
    isPinching: false,
  });

  // Hover target & Dwell state
  const [hoveredButtonKey, setHoveredButtonKey] = useState<string | null>(null);
  const [dwellProgress, setDwellProgress] = useState<number>(0);
  const dwellStartTimeRef = useRef<number | null>(null);
  const lastClickedTimeRef = useRef<number>(0);

  // Python view specs
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
  const cloudMeshRef = useRef<THREE.Mesh | null>(null);

  // Anti-Tremor Exponential Filter & Deadband state
  const filteredPalmRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const prevPalmRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });

  // Physics Damping (LERP) Targets
  const targetRotRef = useRef<{ x: number; y: number }>({ x: 0.25, y: 0.35 });
  const currentRotRef = useRef<{ x: number; y: number }>({ x: 0.25, y: 0.35 });
  const targetScaleRef = useRef<number>(1.0);
  const currentScaleRef = useRef<number>(1.0);
  const explodeAnimRef = useRef<number>(0);

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

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#070b16'); // Deep Nebula Navy
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.5);
    dirLight1.position.set(6, 10, 8);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 1.0);
    dirLight2.position.set(-6, -6, -6);
    scene.add(dirLight2);

    // Grid Floor
    const grid = new THREE.GridHelper(12, 12, 0x0ea5e9, 0x1e293b);
    grid.position.y = -2.3;
    scene.add(grid);

    // Object Group
    const group = new THREE.Group();
    scene.add(group);
    objectGroupRef.current = group;

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop with Smooth Physics LERP & Exploded Interpolation
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      if (autoRotate) {
        targetRotRef.current.y += 0.008;
      }

      // Smooth physics LERP (Anti-Stiffness)
      currentRotRef.current.x += (targetRotRef.current.x - currentRotRef.current.x) * 0.12;
      currentRotRef.current.y += (targetRotRef.current.y - currentRotRef.current.y) * 0.12;
      currentScaleRef.current += (targetScaleRef.current - currentScaleRef.current) * 0.14;

      // Animate explosion distance
      const targetExplode = isExploded ? 1.0 : 0.0;
      explodeAnimRef.current += (targetExplode - explodeAnimRef.current) * 0.12;

      if (group) {
        group.rotation.x = currentRotRef.current.x;
        group.rotation.y = currentRotRef.current.y;
        group.scale.setScalar(currentScaleRef.current);

        // Apply explosion vector to all face meshes
        group.children.forEach((child: any) => {
          if (child.userData && child.userData.explodeVec) {
            const ev = child.userData.explodeVec;
            const dist = explodeAnimRef.current * (child.userData.explodeDist || 1.4);
            child.position.set(
              child.userData.origPos.x + ev.x * dist,
              child.userData.origPos.y + ev.y * dist,
              child.userData.origPos.z + ev.z * dist
            );

            if (child.userData.explodeRot) {
              const er = child.userData.explodeRot;
              child.rotation.x = child.userData.origRot.x + er.x * explodeAnimRef.current;
              child.rotation.y = child.userData.origRot.y + er.y * explodeAnimRef.current;
              child.rotation.z = child.userData.origRot.z + er.z * explodeAnimRef.current;
            }
          }
        });
      }

      if (cloudMeshRef.current) {
        cloudMeshRef.current.rotation.y += 0.002;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
    };
  }, [autoRotate, isExploded]);

  // Reconstruct 3D Geometry
  useEffect(() => {
    const group = objectGroupRef.current;
    if (!group) return;

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
    cloudMeshRef.current = null;

    // Glowing Holographic Edges
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: isXRay ? 0x38bdf8 : 0xffffff,
      linewidth: isXRay ? 3 : 2,
    });

    const addEdges = (mesh: THREE.Mesh, geom: THREE.BufferGeometry) => {
      const edgesGeom = new THREE.EdgesGeometry(geom, 24);
      const edgeLines = new THREE.LineSegments(edgesGeom, edgeMaterial);
      mesh.add(edgeLines);
    };

    // Material with true X-Ray Holographic Glass look
    const createMaterial = (color: number) => {
      if (isXRay) {
        return new THREE.MeshPhysicalMaterial({
          color: 0x0284c7,
          emissive: 0x0369a1,
          emissiveIntensity: 0.25,
          roughness: 0.1,
          metalness: 0.1,
          transmission: 0.7,
          transparent: true,
          opacity: 0.35,
          side: THREE.DoubleSide,
        });
      }
      return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.25,
        metalness: 0.15,
        wireframe: isWireframe,
        side: THREE.DoubleSide,
      });
    };

    switch (selectedModelId) {
      case 'cube': {
        // Multi-part exploded cube (6 independent faces)
        const size = 2.4;
        const half = size / 2;
        const faceGeom = new THREE.PlaneGeometry(size, size);

        const facesData = [
          { pos: [0, 0, half], rot: [0, 0, 0], ev: [0, 0, 1], col: 0x6366f1 },
          { pos: [0, 0, -half], rot: [0, Math.PI, 0], ev: [0, 0, -1], col: 0x4f46e5 },
          { pos: [-half, 0, 0], rot: [0, -Math.PI / 2, 0], ev: [-1, 0, 0], col: 0x4338ca },
          { pos: [half, 0, 0], rot: [0, Math.PI / 2, 0], ev: [1, 0, 0], col: 0x818cf8 },
          { pos: [0, half, 0], rot: [-Math.PI / 2, 0, 0], ev: [0, 1, 0], col: 0xa5b4fc },
          { pos: [0, -half, 0], rot: [Math.PI / 2, 0, 0], ev: [0, -1, 0], col: 0x312e81 },
        ];

        facesData.forEach((f) => {
          const mesh = new THREE.Mesh(faceGeom, createMaterial(f.col));
          mesh.position.set(f.pos[0], f.pos[1], f.pos[2]);
          mesh.rotation.set(f.rot[0], f.rot[1], f.rot[2]);
          addEdges(mesh, faceGeom);
          mesh.userData = {
            origPos: mesh.position.clone(),
            origRot: mesh.rotation.clone(),
            explodeVec: new THREE.Vector3(f.ev[0], f.ev[1], f.ev[2]),
            explodeDist: 1.5,
          };
          group.add(mesh);
        });

        // Internal Space Diagonal line + Center of mass
        const innerGroup = new THREE.Group();
        const centerSphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        innerGroup.add(centerSphere);

        const diagGeom = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-half, -half, -half),
          new THREE.Vector3(half, half, half),
        ]);
        const diagLine = new THREE.Line(
          diagGeom,
          new THREE.LineDashedMaterial({ color: 0xfbbf24, dashSize: 0.15, gapSize: 0.1 })
        );
        diagLine.computeLineDistances();
        innerGroup.add(diagLine);
        group.add(innerGroup);
        break;
      }

      case 'cuboid': {
        const w = 3.2, h = 1.8, d = 2.0;
        const hw = w / 2, hh = h / 2, hd = d / 2;

        const facesData = [
          { geom: new THREE.PlaneGeometry(w, h), pos: [0, 0, hd], rot: [0, 0, 0], ev: [0, 0, 1] },
          { geom: new THREE.PlaneGeometry(w, h), pos: [0, 0, -hd], rot: [0, Math.PI, 0], ev: [0, 0, -1] },
          { geom: new THREE.PlaneGeometry(d, h), pos: [-hw, 0, 0], rot: [0, -Math.PI / 2, 0], ev: [-1, 0, 0] },
          { geom: new THREE.PlaneGeometry(d, h), pos: [hw, 0, 0], rot: [0, Math.PI / 2, 0], ev: [1, 0, 0] },
          { geom: new THREE.PlaneGeometry(w, d), pos: [0, hh, 0], rot: [-Math.PI / 2, 0, 0], ev: [0, 1, 0] },
          { geom: new THREE.PlaneGeometry(w, d), pos: [0, -hh, 0], rot: [Math.PI / 2, 0, 0], ev: [0, -1, 0] },
        ];

        facesData.forEach((f) => {
          const mesh = new THREE.Mesh(f.geom, createMaterial(0x0ea5e9));
          mesh.position.set(f.pos[0], f.pos[1], f.pos[2]);
          mesh.rotation.set(f.rot[0], f.rot[1], f.rot[2]);
          addEdges(mesh, f.geom);
          mesh.userData = {
            origPos: mesh.position.clone(),
            origRot: mesh.rotation.clone(),
            explodeVec: new THREE.Vector3(f.ev[0], f.ev[1], f.ev[2]),
            explodeDist: 1.5,
          };
          group.add(mesh);
        });
        break;
      }

      case 'pyramid': {
        // Exploded pyramid: 1 base square + 4 triangular petals
        const baseSize = 2.4;
        const height = 2.6;
        const half = baseSize / 2;

        const baseGeom = new THREE.PlaneGeometry(baseSize, baseSize);
        const baseMesh = new THREE.Mesh(baseGeom, createMaterial(0xd97706));
        baseMesh.rotation.x = Math.PI / 2;
        baseMesh.position.y = -height / 2;
        addEdges(baseMesh, baseGeom);
        baseMesh.userData = {
          origPos: baseMesh.position.clone(),
          origRot: baseMesh.rotation.clone(),
          explodeVec: new THREE.Vector3(0, -1, 0),
          explodeDist: 0.8,
        };
        group.add(baseMesh);

        const slantHeight = Math.sqrt(half * half + height * height);
        const triGeom = new THREE.BufferGeometry();
        const triVertices = new Float32Array([
          -half, 0, 0,
          half, 0, 0,
          0, slantHeight, 0,
        ]);
        triGeom.setAttribute('position', new THREE.BufferAttribute(triVertices, 3));
        triGeom.computeVertexNormals();

        const petals = [
          { pos: [0, -height / 2, half], rot: [-0.4, 0, 0], expRot: [-1.2, 0, 0] },
          { pos: [0, -height / 2, -half], rot: [0.4, Math.PI, 0], expRot: [1.2, 0, 0] },
          { pos: [-half, -height / 2, 0], rot: [0, -Math.PI / 2, -0.4], expRot: [0, 0, -1.2] },
          { pos: [half, -height / 2, 0], rot: [0, Math.PI / 2, 0.4], expRot: [0, 0, 1.2] },
        ];

        petals.forEach((p) => {
          const mesh = new THREE.Mesh(triGeom, createMaterial(0xf59e0b));
          mesh.position.set(p.pos[0], p.pos[1], p.pos[2]);
          mesh.rotation.set(p.rot[0], p.rot[1], p.rot[2]);
          addEdges(mesh, triGeom);
          mesh.userData = {
            origPos: mesh.position.clone(),
            origRot: mesh.rotation.clone(),
            explodeRot: new THREE.Vector3(p.expRot[0], p.expRot[1], p.expRot[2]),
            explodeVec: new THREE.Vector3(0, 0, 0),
          };
          group.add(mesh);
        });

        // Interior Central Height Axis Pole (t)
        const poleGeom = new THREE.CylinderGeometry(0.04, 0.04, height, 12);
        const pole = new THREE.Mesh(poleGeom, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        group.add(pole);

        const apexDot = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0xef4444 })
        );
        apexDot.position.y = height / 2;
        group.add(apexDot);
        break;
      }

      case 'cylinder': {
        const radius = 1.3;
        const height = 2.6;

        // Top lid
        const capGeom = new THREE.CircleGeometry(radius, 32);
        const topCap = new THREE.Mesh(capGeom, createMaterial(0xa855f7));
        topCap.rotation.x = -Math.PI / 2;
        topCap.position.y = height / 2;
        addEdges(topCap, capGeom);
        topCap.userData = {
          origPos: topCap.position.clone(),
          origRot: topCap.rotation.clone(),
          explodeVec: new THREE.Vector3(0, 1, 0),
          explodeDist: 1.5,
        };
        group.add(topCap);

        // Bottom lid
        const bottomCap = new THREE.Mesh(capGeom, createMaterial(0x7c3aed));
        bottomCap.rotation.x = Math.PI / 2;
        bottomCap.position.y = -height / 2;
        addEdges(bottomCap, capGeom);
        bottomCap.userData = {
          origPos: bottomCap.position.clone(),
          origRot: bottomCap.rotation.clone(),
          explodeVec: new THREE.Vector3(0, -1, 0),
          explodeDist: 1.5,
        };
        group.add(bottomCap);

        // Curved mantle
        const mantleGeom = new THREE.CylinderGeometry(radius, radius, height, 32, 1, true);
        const mantle = new THREE.Mesh(mantleGeom, createMaterial(0x8b5cf6));
        addEdges(mantle, mantleGeom);
        group.add(mantle);

        // Height axis & radius line inside
        const axis = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, height, 12),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        group.add(axis);
        break;
      }

      case 'cone': {
        const radius = 1.4;
        const height = 2.8;

        const baseGeom = new THREE.CircleGeometry(radius, 32);
        const baseMesh = new THREE.Mesh(baseGeom, createMaterial(0xdb2777));
        baseMesh.rotation.x = Math.PI / 2;
        baseMesh.position.y = -height / 2;
        addEdges(baseMesh, baseGeom);
        baseMesh.userData = {
          origPos: baseMesh.position.clone(),
          origRot: baseMesh.rotation.clone(),
          explodeVec: new THREE.Vector3(0, -1, 0),
          explodeDist: 1.4,
        };
        group.add(baseMesh);

        const coneGeom = new THREE.ConeGeometry(radius, height, 32, 1, true);
        const coneMesh = new THREE.Mesh(coneGeom, createMaterial(0xec4899));
        addEdges(coneMesh, coneGeom);
        coneMesh.userData = {
          origPos: coneMesh.position.clone(),
          origRot: coneMesh.rotation.clone(),
          explodeVec: new THREE.Vector3(0, 1, 0),
          explodeDist: 1.0,
        };
        group.add(coneMesh);

        // Height axis inside
        const heightPole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, height, 12),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        group.add(heightPole);
        break;
      }

      case 'triangular_prism': {
        const geom = new THREE.CylinderGeometry(1.5, 1.5, 2.6, 3);
        const mesh = new THREE.Mesh(geom, createMaterial(0x10b981));
        addEdges(mesh, geom);
        group.add(mesh);
        break;
      }

      case 'sphere': {
        const geom = new THREE.SphereGeometry(1.6, 32, 32);
        const mesh = new THREE.Mesh(geom, createMaterial(0x14b8a6));
        addEdges(mesh, geom);
        group.add(mesh);
        break;
      }

      case 'earth': {
        // REALISTIC PLANET EARTH WITH 4-LAYER CORE DISSECTION
        const earthGroup = new THREE.Group();
        const radius = 1.7;

        if (isEarthCoreOpen) {
          // BEDAH LAPISAN BUMI (90° Cutaway)
          const thetaStart = 0;
          const thetaLength = Math.PI * 1.5;

          // 1. Kerak Bumi (Crust)
          const crustGeom = new THREE.SphereGeometry(radius, 32, 32, thetaStart, thetaLength);
          const earthTexture = createRealisticEarthTexture();
          const crustMat = new THREE.MeshStandardMaterial({
            map: earthTexture,
            roughness: 0.7,
            metalness: 0.1,
            side: THREE.DoubleSide,
          });
          earthGroup.add(new THREE.Mesh(crustGeom, crustMat));

          // 2. Mantel Bumi (Mantle - Magma Oranye)
          const mantleGeom = new THREE.SphereGeometry(radius * 0.82, 32, 32, thetaStart, thetaLength);
          const mantleMat = new THREE.MeshStandardMaterial({
            color: 0xea580c,
            emissive: 0xc2410c,
            emissiveIntensity: 0.4,
            roughness: 0.5,
            side: THREE.DoubleSide,
          });
          earthGroup.add(new THREE.Mesh(mantleGeom, mantleMat));

          // 3. Inti Luar (Outer Core - Besi Cair Panas)
          const outerCoreGeom = new THREE.SphereGeometry(radius * 0.55, 28, 28, thetaStart, thetaLength);
          const outerCoreMat = new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            emissive: 0xd97706,
            emissiveIntensity: 0.6,
            roughness: 0.3,
            side: THREE.DoubleSide,
          });
          earthGroup.add(new THREE.Mesh(outerCoreGeom, outerCoreMat));

          // 4. Inti Dalam (Inner Core - Bola Padat ~5400°C)
          const innerCoreGeom = new THREE.SphereGeometry(radius * 0.32, 24, 24);
          const innerCoreMat = new THREE.MeshStandardMaterial({
            color: 0xfef08a,
            emissive: 0xfacc15,
            emissiveIntensity: 0.9,
            roughness: 0.2,
          });
          earthGroup.add(new THREE.Mesh(innerCoreGeom, innerCoreMat));

          // Cutaway Magma Cross-Section Cap
          const cutCap = new THREE.Mesh(
            new THREE.PlaneGeometry(radius, radius),
            new THREE.MeshBasicMaterial({ color: 0x9a3412, side: THREE.DoubleSide })
          );
          cutCap.position.set(radius / 2, 0, 0);
          earthGroup.add(cutCap);
        } else {
          // Full Realistic Earth Globe
          const earthTexture = createRealisticEarthTexture();
          const earthGeom = new THREE.SphereGeometry(radius, 36, 36);
          const earthMat = new THREE.MeshStandardMaterial({
            map: earthTexture,
            roughness: 0.65,
            metalness: 0.08,
            wireframe: isWireframe,
          });
          earthGroup.add(new THREE.Mesh(earthGeom, earthMat));

          // Rotating Clouds Sphere
          const cloudTexture = createCloudTexture();
          const cloudGeom = new THREE.SphereGeometry(radius + 0.035, 32, 32);
          const cloudMat = new THREE.MeshStandardMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
          });
          const cloudMesh = new THREE.Mesh(cloudGeom, cloudMat);
          earthGroup.add(cloudMesh);
          cloudMeshRef.current = cloudMesh;

          // Atmospheric Fresnel Rim Glow
          const glowGeom = new THREE.SphereGeometry(radius + 0.08, 32, 32);
          const glowMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.18,
            side: THREE.BackSide,
          });
          earthGroup.add(new THREE.Mesh(glowGeom, glowMat));
        }

        group.add(earthGroup);
        break;
      }

      case 'rocket': {
        const rocketGroup = new THREE.Group();
        const bodyGeom = new THREE.CylinderGeometry(0.7, 0.7, 2.2, 20);
        rocketGroup.add(new THREE.Mesh(bodyGeom, createMaterial(0xf8fafc)));
        const coneGeom = new THREE.ConeGeometry(0.7, 1.2, 20);
        const nose = new THREE.Mesh(coneGeom, createMaterial(0xef4444));
        nose.position.y = 1.7;
        rocketGroup.add(nose);
        const finGeom = new THREE.BoxGeometry(0.1, 0.7, 0.7);
        const fin1 = new THREE.Mesh(finGeom, createMaterial(0xef4444));
        fin1.position.set(0.7, -0.8, 0);
        rocketGroup.add(fin1);
        const fin2 = fin1.clone();
        fin2.position.set(-0.7, -0.8, 0);
        rocketGroup.add(fin2);
        group.add(rocketGroup);
        break;
      }

      case 'house': {
        const houseGroup = new THREE.Group();
        const wallGeom = new THREE.BoxGeometry(2.4, 1.8, 2.2);
        houseGroup.add(new THREE.Mesh(wallGeom, createMaterial(0xf1f5f9)));
        const roofGeom = new THREE.CylinderGeometry(1.6, 1.6, 2.4, 3);
        const roof = new THREE.Mesh(roofGeom, createMaterial(0xf97316));
        roof.rotation.z = Math.PI / 2;
        roof.rotation.y = Math.PI / 6;
        roof.position.y = 1.6;
        houseGroup.add(roof);
        group.add(houseGroup);
        break;
      }

      case 'satellite': {
        const satGroup = new THREE.Group();
        const coreGeom = new THREE.BoxGeometry(1.2, 1.2, 1.2);
        satGroup.add(new THREE.Mesh(coreGeom, createMaterial(0xe2e8f0)));
        const panelGeom = new THREE.BoxGeometry(2.0, 0.05, 0.9);
        const panelLeft = new THREE.Mesh(panelGeom, createMaterial(0x1d4ed8));
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
        group.add(new THREE.Mesh(geom, createMaterial(0x6366f1)));
      }
    }
  }, [selectedModelId, isWireframe, isXRay, isEarthCoreOpen]);

  // Anti-Tremor Hand Tracking Loop with Dead-Band & Boundary Clamping
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

        let lastTime = -1;

        const loop = () => {
          if (!active) return;
          const video = videoRef.current;
          const handCanvas = handCanvasRef.current;

          if (video && video.readyState >= 2) {
            if (video.currentTime !== lastTime) {
              lastTime = video.currentTime;
              const res = landmarker.detectForVideo(video, performance.now());

              // Draw skeleton overlay
              if (handCanvas) {
                const ctx = handCanvas.getContext('2d');
                if (ctx) {
                  if (handCanvas.width !== video.videoWidth || handCanvas.height !== video.videoHeight) {
                    handCanvas.width = video.videoWidth;
                    handCanvas.height = video.videoHeight;
                  }
                  ctx.clearRect(0, 0, handCanvas.width, handCanvas.height);

                  if (res.landmarks && res.landmarks.length > 0) {
                    const lms = res.landmarks[0];
                    drawHandSkeleton(ctx, lms, handCanvas.width, handCanvas.height, true, false);
                  }
                }
              }

              if (res.landmarks && res.landmarks.length > 0) {
                setHandActive(true);
                const lms = res.landmarks[0];
                const detected = classifyHandGesture(lms, 640, 480, true);

                const rawIndexX = 1 - lms[8].x;
                const rawIndexY = lms[8].y;

                // Map index fingertip directly onto 3D Viewport container
                if (viewportRef.current) {
                  const rect = viewportRef.current.getBoundingClientRect();
                  // Clamp to comfortable tracking zone (0.15 - 0.85) to prevent border vibration
                  const normX = Math.max(0, Math.min(1, (rawIndexX - 0.12) / 0.76));
                  const normY = Math.max(0, Math.min(1, (rawIndexY - 0.12) / 0.76));

                  const canvasX = rect.left + normX * rect.width;
                  const canvasY = rect.top + normY * rect.height;

                  setAirCursor({
                    x: canvasX,
                    y: canvasY,
                    visible: true,
                    isPinching: detected.gesture === 'pinch',
                  });
                }

                // ================= ANTI-TREMOR ENGINE (DEAD-BAND & EXPONENTIAL FILTER) =================
                // 1. Boundary Guard: If hand approaches edge of camera, ignore delta to prevent border jitter!
                const palmX = detected.palmCenter ? detected.palmCenter.x : 0.5;
                const palmY = detected.palmCenter ? detected.palmCenter.y : 0.5;

                const isNearBoundary = palmX < 0.1 || palmX > 0.9 || palmY < 0.1 || palmY > 0.88;

                if (!isNearBoundary) {
                  // 2. Heavy Exponential Smoothing (alpha = 0.10) to completely cancel hand tremor
                  const alpha = 0.1;
                  filteredPalmRef.current.x += alpha * (palmX - filteredPalmRef.current.x);
                  filteredPalmRef.current.y += alpha * (palmY - filteredPalmRef.current.y);

                  // 3. Dead-Band Gate: Shifts smaller than 0.012 are treated as resting tremor and ignored!
                  const rawDiffX = filteredPalmRef.current.x - prevPalmRef.current.x;
                  const rawDiffY = filteredPalmRef.current.y - prevPalmRef.current.y;
                  const moveDist = Math.hypot(rawDiffX, rawDiffY);

                  if (moveDist > 0.012) {
                    // Deliberate movement!
                    targetRotRef.current.y += rawDiffX * 2.8;
                    // Clamp pitch between -1.2 rad (-70 deg) and +1.2 rad (+70 deg) to prevent flipping
                    targetRotRef.current.x = Math.max(
                      -1.2,
                      Math.min(1.2, targetRotRef.current.x + rawDiffY * 2.8)
                    );

                    prevPalmRef.current.x = filteredPalmRef.current.x;
                    prevPalmRef.current.y = filteredPalmRef.current.y;
                  }
                }

                // Zoom with low-pass filter
                const rawScale = detected.handScale || 0.2;
                const targetZoom = Math.max(0.5, Math.min(3.0, rawScale * 5.0));
                targetScaleRef.current += 0.08 * (targetZoom - targetScaleRef.current);

                // Update metrics UI
                const currentYaw = (targetRotRef.current.y * 180) / Math.PI;
                const currentPitch = (targetRotRef.current.x * 180) / Math.PI;

                sendHandTransform({
                  yaw: currentYaw,
                  pitch: currentPitch,
                  zoom: targetScaleRef.current,
                  pan_x: 0,
                  pan_y: 0,
                }).then((r) => {
                  if (r?.transform?.view_angles) {
                    setPythonSpecs({
                      azimuth: r.transform.view_angles.azimuth,
                      elevation: r.transform.view_angles.elevation,
                      scale: r.transform.scale,
                    });
                  }
                });
              } else {
                setHandActive(false);
                setAirCursor((p) => ({ ...p, visible: false }));
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

  // Action Dispatcher for Buttons (Triggered by Hand Dwell, Hand Pinch, or Mouse Click!)
  const handleActionClick = useCallback(
    (actionKey: string) => {
      const now = Date.now();
      if (now - lastClickedTimeRef.current < 600) return; // Debounce
      lastClickedTimeRef.current = now;

      sounds.playPinchStart();

      if (actionKey === 'shape_picker') {
        setShowShapePicker((prev) => !prev);
      } else if (actionKey === 'explode') {
        setIsExploded((prev) => !prev);
        sounds.playMagicSparkle();
      } else if (actionKey === 'xray') {
        setIsXRay((prev) => !prev);
        sounds.playMagicSparkle();
      } else if (actionKey === 'earth_core') {
        setIsEarthCoreOpen((prev) => !prev);
        sounds.playMagicSparkle();
      } else if (actionKey === 'reset') {
        targetRotRef.current = { x: 0.25, y: 0.35 };
        targetScaleRef.current = 1.0;
        setIsExploded(false);
        setIsEarthCoreOpen(false);
        setIsXRay(false);
      } else if (actionKey.startsWith('select_model:')) {
        const id = actionKey.replace('select_model:', '');
        setSelectedModelId(id);
        setShowShapePicker(false);
        sounds.playMagicSparkle();
      }
    },
    []
  );

  // In-Air Hand Cursor Raycasting / Dwell & Pinch Click Detection
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (airCursor.visible && hoveredButtonKey) {
      // Instant pinch click!
      if (airCursor.isPinching) {
        handleActionClick(hoveredButtonKey);
        setDwellProgress(0);
        dwellStartTimeRef.current = null;
        return;
      }

      // Dwell hover click (0.8s)
      if (!dwellStartTimeRef.current) {
        dwellStartTimeRef.current = Date.now();
      }

      const checkDwell = () => {
        if (!dwellStartTimeRef.current) return;
        const elapsed = Date.now() - dwellStartTimeRef.current;
        const progress = Math.min(1.0, elapsed / 800); // 800ms dwell
        setDwellProgress(progress);

        if (progress >= 1.0) {
          handleActionClick(hoveredButtonKey);
          dwellStartTimeRef.current = null;
          setDwellProgress(0);
        } else {
          timer = setTimeout(checkDwell, 40);
        }
      };
      checkDwell();
    } else {
      dwellStartTimeRef.current = null;
      setDwellProgress(0);
    }

    return () => clearTimeout(timer);
  }, [airCursor.visible, airCursor.isPinching, hoveredButtonKey, handleActionClick]);

  // Mouse drag fallback
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - prevMouseRef.current.x;
    const dy = e.clientY - prevMouseRef.current.y;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };

    targetRotRef.current.y += dx * 0.01;
    targetRotRef.current.x = Math.max(-1.2, Math.min(1.2, targetRotRef.current.x + dy * 0.01));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    targetScaleRef.current = Math.max(0.5, Math.min(3.2, targetScaleRef.current * factor));
  };

  const activeModel = models.find((m) => m.id === selectedModelId);

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto select-none relative">
      {/* ================= IN-VIEWPORT AIR HAND CURSOR ================= */}
      {airCursor.visible && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
          style={{ left: `${airCursor.x}px`, top: `${airCursor.y}px` }}
        >
          <div className="relative flex items-center justify-center">
            {/* Dwell Progress Ring */}
            <svg className="w-14 h-14 -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="22"
                className="stroke-slate-800/80"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="28"
                cy="28"
                r="22"
                className="stroke-emerald-400 transition-all"
                strokeWidth="4"
                strokeDasharray={138}
                strokeDashoffset={138 - 138 * dwellProgress}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <div
              className={`absolute w-4 h-4 rounded-full shadow-lg ${
                airCursor.isPinching ? 'bg-amber-400 scale-125' : 'bg-emerald-400'
              }`}
            />
            <div className="absolute -top-7 text-[10px] font-extrabold uppercase bg-slate-900/90 text-white px-2 py-0.5 rounded-full border border-slate-700 shadow-md">
              {airCursor.isPinching ? '👌 Klik!' : hoveredButtonKey ? 'Tahan 0.8s' : 'Kursor Tangan'}
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Sistem Anti-Getar & Kontrol Tangan Penuh (100% Offline)
            </span>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> No API Key
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            Studio 3D Hologram & Bedah Ruang Interaktif
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl font-medium">
            Gerakkan tangan di udara untuk memutar objek 3D 360°, sentuh tombol langsung di layar dengan ujung jari, atau bedah bangun ruang menjadi jaring-jaring 3D!
          </p>
        </div>
      </div>

      {/* Main 3D Stage Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[580px]">
        {/* Left Column: 3D Stage + FLOATING AIR TOUCH HUD */}
        <div
          ref={viewportRef}
          className="lg:col-span-8 flex flex-col bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative"
        >
          {/* ================= FLOATING IN-VIEWPORT ACTION BAR (BISA DIKLIK PAKAI TANGAN!) ================= */}
          <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2.5">
            {/* 1. Pilih Bentuk 3D Button */}
            <button
              type="button"
              onMouseEnter={() => setHoveredButtonKey('shape_picker')}
              onMouseLeave={() => setHoveredButtonKey(null)}
              onClick={() => handleActionClick('shape_picker')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-black shadow-lg transition-all transform active:scale-95 ${
                showShapePicker || hoveredButtonKey === 'shape_picker'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white ring-2 ring-indigo-400 scale-105'
                  : 'bg-slate-900/90 backdrop-blur-md border border-slate-700 text-slate-200 hover:text-white hover:border-indigo-400'
              }`}
            >
              <Box className="w-4 h-4 text-indigo-400" />
              <span>{activeModel?.name || 'Pilih Bentuk'}</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-70" />
            </button>

            {/* Quick Action Buttons (Air-Clickable) */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Earth Core Dissection (Special for Earth) */}
              {selectedModelId === 'earth' && (
                <button
                  type="button"
                  onMouseEnter={() => setHoveredButtonKey('earth_core')}
                  onMouseLeave={() => setHoveredButtonKey(null)}
                  onClick={() => handleActionClick('earth_core')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-black shadow-lg transition-all transform active:scale-95 ${
                    isEarthCoreOpen || hoveredButtonKey === 'earth_core'
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white ring-2 ring-amber-400 scale-105'
                      : 'bg-slate-900/90 backdrop-blur-md border border-slate-700 text-amber-300 hover:text-white'
                  }`}
                  title="Sentuh untuk membelah 4 lapisan inti bumi"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>{isEarthCoreOpen ? 'Tutup Isi Bumi' : '🌍 Bedah Lapisan Bumi'}</span>
                </button>
              )}

              {/* Exploded View (Pisahkan Bagian) */}
              {['cube', 'cuboid', 'pyramid', 'cylinder', 'cone'].includes(selectedModelId) && (
                <button
                  type="button"
                  onMouseEnter={() => setHoveredButtonKey('explode')}
                  onMouseLeave={() => setHoveredButtonKey(null)}
                  onClick={() => handleActionClick('explode')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-black shadow-lg transition-all transform active:scale-95 ${
                    isExploded || hoveredButtonKey === 'explode'
                      ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white ring-2 ring-pink-400 scale-105'
                      : 'bg-slate-900/90 backdrop-blur-md border border-slate-700 text-rose-300 hover:text-white'
                  }`}
                  title="Sentuh untuk memisahkan setiap sisi bangun ruang"
                >
                  <Scissors className="w-3.5 h-3.5 text-pink-300" />
                  <span>{isExploded ? 'Satukan Kembali' : '💥 Pisah-Pisah Bagian'}</span>
                </button>
              )}

              {/* Tembus Pandang (X-Ray Holographic) */}
              <button
                type="button"
                onMouseEnter={() => setHoveredButtonKey('xray')}
                onMouseLeave={() => setHoveredButtonKey(null)}
                onClick={() => handleActionClick('xray')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-black shadow-lg transition-all transform active:scale-95 ${
                  isXRay || hoveredButtonKey === 'xray'
                    ? 'bg-sky-600 text-white ring-2 ring-sky-300 scale-105'
                    : 'bg-slate-900/90 backdrop-blur-md border border-slate-700 text-sky-300 hover:text-white'
                }`}
                title="Tampilkan kerangka transparan holografik"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isXRay ? 'Solid Normal' : 'Tembus Pandang'}</span>
              </button>

              {/* Reset Button */}
              <button
                type="button"
                onMouseEnter={() => setHoveredButtonKey('reset')}
                onMouseLeave={() => setHoveredButtonKey(null)}
                onClick={() => handleActionClick('reset')}
                className={`p-2 rounded-2xl shadow-lg transition-all transform active:scale-95 ${
                  hoveredButtonKey === 'reset'
                    ? 'bg-indigo-600 text-white scale-105'
                    : 'bg-slate-900/90 backdrop-blur-md border border-slate-700 text-slate-300 hover:text-white'
                }`}
                title="Kembalikan posisi normal"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ================= IN-VIEWPORT SHAPE PICKER MODAL (CENTRAL TOUCH DOCK) ================= */}
          {showShapePicker && (
            <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fadeIn">
              <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Hand className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-black text-sm text-white">
                      Pilih Bentuk 3D (Arahkan Jari / Klik)
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowShapePicker(false)}
                    className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                  {models.map((m) => {
                    const isSelected = selectedModelId === m.id;
                    const actionKey = `select_model:${m.id}`;
                    const isHovered = hoveredButtonKey === actionKey;

                    return (
                      <button
                        key={m.id}
                        type="button"
                        onMouseEnter={() => setHoveredButtonKey(actionKey)}
                        onMouseLeave={() => setHoveredButtonKey(null)}
                        onClick={() => handleActionClick(actionKey)}
                        className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between min-h-[78px] ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-600/30 text-white ring-2 ring-indigo-400'
                            : isHovered
                            ? 'border-emerald-500 bg-emerald-600/20 text-white scale-102'
                            : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {isHovered && dwellProgress > 0 && (
                          <div
                            className="absolute bottom-0 left-0 h-1 bg-emerald-400 transition-all"
                            style={{ width: `${dwellProgress * 100}%` }}
                          />
                        )}
                        <span className="text-[10px] uppercase font-black text-indigo-400">
                          {m.category.split(' ')[0]}
                        </span>
                        <span className="text-xs font-bold text-white line-clamp-1">{m.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3D WebGL Canvas */}
          <div
            ref={mountRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            className="flex-1 w-full h-full min-h-[460px] cursor-grab active:cursor-grabbing select-none"
          />

          {/* Bottom Floating Status Pill */}
          <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
            <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-2xl flex items-center gap-4 text-xs font-mono text-slate-300 shadow-lg">
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

            <div className="text-[11px] bg-slate-950/85 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl text-slate-400">
              {handActive ? '✨ Gerakan Tangan Terhubung (Bebas Getar)' : 'Tunjukkan tangan ke webcam'}
            </div>
          </div>
        </div>

        {/* Right Column: Hand Tracker Preview with Skeleton Bones & Educational Formulas */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Hand Tracker Mini Cam with FULL SKELETON OVERLAY */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    handActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className="font-extrabold text-xs text-white">
                  {handActive ? 'Sensor Tangan Aktif (Bebas Getar)' : 'Arahkan Tangan ke Kamera'}
                </span>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                Live AI 21-Joints
              </span>
            </div>

            {/* Video Preview with Skeleton Bones Overlay Canvas */}
            <div className="relative aspect-video w-full rounded-2xl bg-black overflow-hidden border border-slate-800 flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <canvas
                ref={handCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
              {!handActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white text-center p-3 select-none">
                  <Camera className="w-8 h-8 opacity-60 mb-1 animate-pulse" />
                  <p className="text-xs font-semibold">Tunjukkan telapak tanganmu</p>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Educational Inspection Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-black text-sm text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Informasi & Rumus Matematika
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                {activeModel?.difficulty}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {activeModel?.description}
            </p>

            {/* Specs & Formulas Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {activeModel?.specs &&
                Object.entries(activeModel.specs).map(([k, v]) => (
                  <div
                    key={k}
                    className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col justify-between"
                  >
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wide">
                      {k.replace(/_/g, ' ')}
                    </span>
                    <span className="font-extrabold text-slate-800 mt-1 break-words">
                      {String(v)}
                    </span>
                  </div>
                ))}
            </div>

            {/* Educational Interactive Hint */}
            <div className="p-3 bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-100/80 rounded-2xl flex items-start gap-2.5 text-xs text-indigo-900">
              <span className="text-base shrink-0">💡</span>
              <p className="text-[11px] leading-tight">
                {selectedModelId === 'earth'
                  ? 'Sentuh tombol "🌍 Bedah Lapisan Bumi" di pojok atas canvas untuk melihat 4 lapisan mantel & inti bumi bersuhu hingga 5.400°C!'
                  : 'Sentuh tombol "💥 Pisah-Pisah Bagian" di atas untuk melihat proses pembongkaran bangun ruang menjadi jaring-jaring 3D!'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
