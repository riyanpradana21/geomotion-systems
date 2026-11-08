from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
import math

router = APIRouter(prefix="/api/3d", tags=["3D Models & Gestures"])

# ================= 3D PROCEDURAL GEOMETRY GENERATOR =================
# Generates rich 3D mesh vertices, faces, edges, and specs without any external paid API or key!

def generate_cube(size=2.0):
    s = size / 2.0
    vertices = [
        [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
        [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s]
    ]
    faces = [
        [0, 1, 2], [0, 2, 3], # Back
        [4, 6, 5], [4, 7, 6], # Front
        [0, 4, 7], [0, 7, 3], # Left
        [1, 5, 6], [1, 6, 2], # Right
        [3, 2, 6], [3, 6, 7], # Top
        [0, 5, 1], [0, 4, 5]  # Bottom
    ]
    edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
    ]
    return {"vertices": vertices, "faces": faces, "edges": edges}

def generate_sphere(radius=1.5, segments=16, rings=12):
    vertices = []
    edges = []
    for r in range(rings + 1):
        theta = (r * math.pi) / rings
        sin_t = math.sin(theta)
        cos_t = math.cos(theta)
        for s in range(segments):
            phi = (s * 2 * math.pi) / segments
            x = radius * sin_t * math.cos(phi)
            y = radius * cos_t
            z = radius * sin_t * math.sin(phi)
            vertices.append([round(x, 3), round(y, 3), round(z, 3)])
    return {"vertices": vertices, "faces": [], "edges": []}

MODELS_CATALOG = [
    {
        "id": "cube",
        "name": "Kubus 3D (Cube)",
        "category": "Bangun Ruang",
        "description": "Polihedron beraturan dengan 8 titik sudut, 12 rusuk sama panjang, dan 6 sisi bujur sangkar.",
        "difficulty": "Mudah",
        "color": "#6366f1",
        "specs": {"vertices": 8, "edges": 12, "faces": 6, "volume_formula": "sisi³"}
    },
    {
        "id": "cuboid",
        "name": "Balok 3D (Cuboid)",
        "category": "Bangun Ruang",
        "description": "Bangun ruang tiga dimensi yang dibentuk oleh tiga pasang persegi panjang dengan ukuran berbeda.",
        "difficulty": "Mudah",
        "color": "#0ea5e9",
        "specs": {"vertices": 8, "edges": 12, "faces": 6, "volume_formula": "p × l × t"}
    },
    {
        "id": "pyramid",
        "name": "Limas Segiempat (Pyramid)",
        "category": "Bangun Ruang",
        "description": "Limas dengan alas berbentuk segiempat dan 4 bidang sisi tegak berbentuk segitiga yang bertemu di satu titik puncak.",
        "difficulty": "Menengah",
        "color": "#f59e0b",
        "specs": {"vertices": 5, "edges": 8, "faces": 5, "volume_formula": "⅓ × Luas Alas × t"}
    },
    {
        "id": "triangular_prism",
        "name": "Prisma Segitiga (Prism)",
        "category": "Bangun Ruang",
        "description": "Polihedron dengan 2 bidang alas segitiga kongruen yang sejajar dan 3 bidang tegak segiempat.",
        "difficulty": "Menengah",
        "color": "#10b981",
        "specs": {"vertices": 6, "edges": 9, "faces": 5, "volume_formula": "Luas Alas × t"}
    },
    {
        "id": "cylinder",
        "name": "Tabung Silinder (Cylinder)",
        "category": "Bangun Ruang",
        "description": "Bangun ruang lengkung yang dibatasi oleh dua lingkaran sejajar dan bidang selimut lengkung.",
        "difficulty": "Menengah",
        "color": "#8b5cf6",
        "specs": {"vertices": 0, "edges": 2, "faces": 3, "volume_formula": "π × r² × t"}
    },
    {
        "id": "cone",
        "name": "Kerucut 3D (Cone)",
        "category": "Bangun Ruang",
        "description": "Bangun ruang lengkung dengan satu alas lingkaran dan satu titik puncak runcing di atas.",
        "difficulty": "Menengah",
        "color": "#ec4899",
        "specs": {"vertices": 1, "edges": 1, "faces": 2, "volume_formula": "⅓ × π × r² × t"}
    },
    {
        "id": "sphere",
        "name": "Bola Geometri (Sphere)",
        "category": "Bangun Ruang",
        "description": "Bangun ruang beraturan sempurna di mana setiap titik pada permukaan berjarak sama dari titik pusat.",
        "difficulty": "Mudah",
        "color": "#14b8a6",
        "specs": {"vertices": 0, "edges": 0, "faces": 1, "volume_formula": "⁴⁄₃ × π × r³"}
    },
    {
        "id": "earth",
        "name": "Bumi & Bola Dunia (Globe)",
        "category": "Objek Edukasi Sains",
        "description": "Visualisasi 3D planet Bumi dengan garis khatulistiwa, kutub utara-selatan, dan rotasi 360°.",
        "difficulty": "Eksplorasi",
        "color": "#0284c7",
        "specs": {"type": "Sains & Astronomi", "rotasi": "Rotasi 360°", "diameter": "12.742 km"}
    },
    {
        "id": "rocket",
        "name": "Roket Luar Angkasa (Rocket)",
        "category": "Objek Edukasi Sains",
        "description": "Kombinasi bangun ruang nyata: badan silinder + moncong kerucut + sayap segitiga pendorong.",
        "difficulty": "Kreatif",
        "color": "#ef4444",
        "specs": {"komposisi": "Silinder + Kerucut + Prisma", "fungsi": "Peluncur Luar Angkasa"}
    },
    {
        "id": "house",
        "name": "Rumah Arsitektur 3D (House)",
        "category": "Kreasi Bangunan",
        "description": "Kombinasi kubus (dinding) dan prisma segitiga (atap) membentuk arsitektur rumah modern.",
        "difficulty": "Kreatif",
        "color": "#f97316",
        "specs": {"komposisi": "Kubus + Prisma Segitiga", "arsitektur": "Rumah 3 Dimensi"}
    },
    {
        "id": "satellite",
        "name": "Satelit Surya (Satellite)",
        "category": "Objek Edukasi Sains",
        "description": "Satelit orbit dengan badan kubus heksagonal dan dua panel surya persegi panjang membentang.",
        "difficulty": "Kreatif",
        "color": "#64748b",
        "specs": {"sumber_daya": "Panel Surya", "orbit": "Low Earth Orbit"}
    }
]

@router.get("/models")
def get_3d_models_catalog(category: Optional[str] = None):
    """
    Returns curated 3D models catalog with zero API key, no login, and unlimited access.
    """
    if category:
        return [m for m in MODELS_CATALOG if m["category"] == category]
    return MODELS_CATALOG

@router.get("/models/{model_id}")
def get_3d_model_detail(model_id: str):
    """
    Returns procedural 3D model metadata and geometric specs.
    """
    match = next((m for m in MODELS_CATALOG if m["id"] == model_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="3D model not found")
    
    # Return detail with mesh specs
    result = dict(match)
    if model_id == "cube":
        result["mesh"] = generate_cube(2.0)
    return result

@router.post("/transform")
def compute_hand_transform(payload: Dict[str, Any]):
    """
    Python endpoint that computes 3D transform matrices (pitch, yaw, zoom, pan)
    from hand gesture inputs.
    """
    yaw = float(payload.get("yaw", 0.0))
    pitch = float(payload.get("pitch", 0.0))
    roll = float(payload.get("roll", 0.0))
    zoom = max(0.2, min(5.0, float(payload.get("zoom", 1.0))))
    pan_x = float(payload.get("pan_x", 0.0))
    pan_y = float(payload.get("pan_y", 0.0))

    # Calculate 3D rotation angles in radians
    rad_yaw = math.radians(yaw)
    rad_pitch = math.radians(pitch)

    return {
        "status": "success",
        "transform": {
            "rotation": {"yaw": yaw, "pitch": pitch, "roll": roll},
            "rotation_rad": {"yaw": round(rad_yaw, 4), "pitch": round(rad_pitch, 4)},
            "scale": round(zoom, 3),
            "translation": {"x": round(pan_x, 3), "y": round(pan_y, 3), "z": 0.0},
            "view_angles": {
                "azimuth": round((yaw % 360), 1),
                "elevation": round((pitch % 360), 1)
            }
        }
    }
