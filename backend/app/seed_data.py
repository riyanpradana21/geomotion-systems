import json
from .database import get_db

SHAPES = [
    {
        "id": "circle",
        "name": "Circle",
        "dimension": "2D",
        "description": "A perfectly round shape where every point on the boundary is the exact same distance from the center point!",
        "properties": {
            "vertices": 0,
            "edges": 1,
            "curved": True,
            "symmetry_lines": "Infinite",
            "formula_perimeter": "2 * π * r",
            "formula_area": "π * r²"
        },
        "tips": [
            "Keep your finger moving steadily in a smooth loop",
            "Try to connect back right where you started",
            "Keep the width and height roughly equal"
        ],
        "difficulty": "Easy",
        "icon_name": "Circle"
    },
    {
        "id": "square",
        "name": "Square",
        "dimension": "2D",
        "description": "A four-sided polygon where all 4 sides are exactly equal in length and all 4 corners are perfect 90° right angles!",
        "properties": {
            "vertices": 4,
            "edges": 4,
            "curved": False,
            "internal_angles": "90° each",
            "total_angle_sum": "360°",
            "aspect_ratio": "1.0",
            "formula_perimeter": "4 * side",
            "formula_area": "side²"
        },
        "tips": [
            "Draw 4 straight lines with sharp corners",
            "Make all four sides roughly the same length",
            "Pause slightly at each corner to make crisp 90-degree turns"
        ],
        "difficulty": "Easy",
        "icon_name": "Square"
    },
    {
        "id": "triangle",
        "name": "Triangle",
        "dimension": "2D",
        "description": "A 3-sided polygon with 3 straight sides and 3 angles. The sum of all 3 inside angles always equals exactly 180°!",
        "properties": {
            "vertices": 3,
            "edges": 3,
            "curved": False,
            "internal_angles": "Sum = 180°",
            "types": "Equilateral, Isosceles, Scalene, Right-angled",
            "formula_perimeter": "side1 + side2 + side3",
            "formula_area": "½ * base * height"
        },
        "tips": [
            "Start from the top, draw down-right, straight left, and back to the top",
            "Ensure the 3 vertices are sharp and closed",
            "You can draw equilateral, right, or isosceles triangles"
        ],
        "difficulty": "Easy",
        "icon_name": "Triangle"
    },
    {
        "id": "rectangle",
        "name": "Rectangle",
        "dimension": "2D",
        "description": "A 4-sided polygon with 4 right angles (90°). Opposite sides are equal in length and parallel to each other!",
        "properties": {
            "vertices": 4,
            "edges": 4,
            "curved": False,
            "internal_angles": "90° each",
            "total_angle_sum": "360°",
            "aspect_ratio": "Length ≠ Width (Ratio > 1.2 or < 0.8)",
            "formula_perimeter": "2 * (length + width)",
            "formula_area": "length * width"
        },
        "tips": [
            "Make one pair of opposite sides noticeably longer than the other pair",
            "Keep the four corners at right angles (90°)",
            "Keep the top and bottom lines parallel"
        ],
        "difficulty": "Easy",
        "icon_name": "RectangleHorizontal"
    },
    {
        "id": "cube",
        "name": "Cube",
        "dimension": "3D",
        "description": "A three-dimensional solid object bounded by six square faces, with three meeting at each vertex!",
        "properties": {
            "vertices": 8,
            "edges": 12,
            "faces": 6,
            "face_shape": "Square",
            "formula_volume": "side³",
            "formula_surface_area": "6 * side²"
        },
        "tips": [
            "Draw a front square first, then an offset back square, and connect the corresponding 4 corners with diagonal edges",
            "Keep parallel edges aligned for isometric projection"
        ],
        "difficulty": "Medium",
        "icon_name": "Box"
    },
    {
        "id": "cuboid",
        "name": "Cuboid",
        "dimension": "3D",
        "description": "A 3D box shape with 6 rectangular faces. All angles are right angles and opposite faces are equal!",
        "properties": {
            "vertices": 8,
            "edges": 12,
            "faces": 6,
            "face_shape": "Rectangle",
            "formula_volume": "length * width * height",
            "formula_surface_area": "2*(lw + lh + wh)"
        },
        "tips": [
            "Draw a long rectangle, then a second overlapping rectangle, and link the 4 matching corners"
        ],
        "difficulty": "Medium",
        "icon_name": "Boxes"
    },
    {
        "id": "pyramid",
        "name": "Pyramid",
        "dimension": "3D",
        "description": "A 3D polyhedron formed by connecting a polygonal base and an apex point. Each base edge forms a triangular face with the apex!",
        "properties": {
            "vertices": 5,
            "edges": 8,
            "faces": 5,
            "base_shape": "Square or Rectangle",
            "formula_volume": "⅓ * base_area * height"
        },
        "tips": [
            "Draw a parallelogram for the ground base, a point high in the center, and 4 edges going down to the corners"
        ],
        "difficulty": "Hard",
        "icon_name": "Pyramid"
    },
    {
        "id": "triangular_prism",
        "name": "Triangular Prism",
        "dimension": "3D",
        "description": "A three-sided prism made of two parallel triangular bases and three rectangular lateral faces joining them!",
        "properties": {
            "vertices": 6,
            "edges": 9,
            "faces": 5,
            "base_shape": "Triangle",
            "formula_volume": "triangle_area * length"
        },
        "tips": [
            "Draw a front triangle, an offset back triangle, and connect the 3 corresponding vertices"
        ],
        "difficulty": "Hard",
        "icon_name": "Tent"
    }
]

LESSONS = [
    {
        "id": "lesson-circle",
        "shape_id": "circle",
        "title": "Mastering the Perfect Circle",
        "dimension": "2D",
        "difficulty": "Beginner",
        "estimated_minutes": 3,
        "instructions": "Use your index finger and thumb pinch to draw a smooth, round circle in the air.",
        "steps": [
            "Pinch your index and thumb together to start drawing.",
            "Draw a steady, curved loop starting from 12 o'clock clockwise.",
            "Bring your pen tip right back to the starting point to complete the loop.",
            "Release pinch to finish your stroke!"
        ],
        "fun_fact": "A circle is the shape that contains the largest possible area for a given perimeter!",
        "criteria": [
            "High circularity score (> 75%)",
            "Roughly equal width and height (aspect ratio near 1.0)",
            "Closed loop with minimal corner vertices"
        ]
    },
    {
        "id": "lesson-square",
        "shape_id": "square",
        "title": "Crafting the Equal Square",
        "dimension": "2D",
        "difficulty": "Beginner",
        "estimated_minutes": 4,
        "instructions": "Draw 4 equal straight lines with 4 sharp 90-degree right angles.",
        "steps": [
            "Pinch to begin at the top-left corner.",
            "Draw straight across to the right, pause slightly at the corner.",
            "Draw straight down, pause at the bottom-right corner.",
            "Draw straight left to the bottom-left corner.",
            "Draw straight up back to the starting corner and release pinch."
        ],
        "fun_fact": "Every square is a rectangle, but not every rectangle is a square!",
        "criteria": [
            "4 distinct corners/vertices",
            "Internal angles close to 90 degrees",
            "Aspect ratio close to 1.0 (equal width and height)"
        ]
    },
    {
        "id": "lesson-triangle",
        "shape_id": "triangle",
        "title": "Building Strong Triangles",
        "dimension": "2D",
        "difficulty": "Beginner",
        "estimated_minutes": 3,
        "instructions": "Draw a 3-sided polygon with 3 sharp vertices.",
        "steps": [
            "Pinch at the top apex.",
            "Draw diagonal line down to the bottom-right corner.",
            "Draw flat horizontal line across to the bottom-left corner.",
            "Draw diagonal line back up to the apex and release."
        ],
        "fun_fact": "Triangles are the strongest shape in architecture! Bridges and towers rely on triangles to bear heavy loads without bending.",
        "criteria": [
            "Exactly 3 clear corners",
            "Three straight edge segments",
            "Sum of internal angles approximately 180°"
        ]
    },
    {
        "id": "lesson-rectangle",
        "shape_id": "rectangle",
        "title": "Drawing Wide Rectangles",
        "dimension": "2D",
        "difficulty": "Beginner",
        "estimated_minutes": 4,
        "instructions": "Draw a quadrilateral with 4 right angles where the width is significantly different from the height.",
        "steps": [
            "Pinch to start at top-left.",
            "Draw a long horizontal line across to the right.",
            "Draw a shorter vertical line downwards.",
            "Draw a matching long horizontal line back left.",
            "Draw a short vertical line up to close the box and release."
        ],
        "fun_fact": "Your computer screen, notebook, doors, and books are almost all rectangles!",
        "criteria": [
            "4 sharp corners with ~90° angles",
            "Opposite sides are parallel and equal",
            "Aspect ratio differs from 1.0 (distinctly elongated)"
        ]
    },
    {
        "id": "lesson-cube",
        "shape_id": "cube",
        "title": "3D Wireframe: The Isometric Cube",
        "dimension": "3D",
        "difficulty": "Intermediate",
        "estimated_minutes": 5,
        "instructions": "Create a 3D illusion by drawing two overlapping squares and connecting their corresponding corners.",
        "steps": [
            "Draw a clean front square.",
            "Inside or offset to the top-right, draw a second matching square.",
            "Connect the top-left to top-left, top-right to top-right, bottom-left to bottom-left, and bottom-right to bottom-right.",
            "Step back and admire your 3D wireframe cube!"
        ],
        "fun_fact": "A cube has 6 faces, 8 vertices, and 12 edges. Mathematicians call regular polyhedra like cubes Platonic solids!",
        "criteria": [
            "8 primary junction vertices",
            "12 interconnected wireframe edges",
            "Parallel pairs of lines showing depth"
        ]
    }
]

def seed_database():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check if already seeded
        cursor.execute("SELECT COUNT(*) FROM shapes")
        count = cursor.fetchone()[0]
        if count == 0:
            for s in SHAPES:
                cursor.execute("""
                    INSERT INTO shapes (id, name, dimension, description, properties, tips, difficulty, icon_name)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    s["id"],
                    s["name"],
                    s["dimension"],
                    s["description"],
                    json.dumps(s["properties"]),
                    json.dumps(s["tips"]),
                    s["difficulty"],
                    s["icon_name"]
                ))
            
            for l in LESSONS:
                cursor.execute("""
                    INSERT INTO lessons (id, shape_id, title, dimension, difficulty, estimated_minutes, instructions, steps, fun_fact, criteria)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    l["id"],
                    l["shape_id"],
                    l["title"],
                    l["dimension"],
                    l["difficulty"],
                    l["estimated_minutes"],
                    l["instructions"],
                    json.dumps(l["steps"]),
                    l["fun_fact"],
                    json.dumps(l["criteria"])
                ))
