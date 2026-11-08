import unittest
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.database import init_db
from backend.app.seed_data import seed_database
from backend.app.routers import health, shapes, lessons, history, three_d
from backend.app.schemas import HistoryCreate
from fastapi import HTTPException

class TestBackendDirect(unittest.TestCase):
    def setUp(self):
        init_db()
        seed_database()

    def test_health(self):
        res = health.check_health()
        self.assertEqual(res.status, "ok")
        self.assertEqual(res.database, "connected")
        self.assertGreater(res.shapes_count, 0)
        self.assertGreater(res.lessons_count, 0)

    def test_shapes(self):
        all_shapes = shapes.get_shapes()
        self.assertGreaterEqual(len(all_shapes), 4)

        shapes_2d = shapes.get_shapes(dimension="2D")
        self.assertGreaterEqual(len(shapes_2d), 4)
        for s in shapes_2d:
            self.assertEqual(s.dimension, "2D")

        shapes_3d = shapes.get_shapes(dimension="3D")
        self.assertGreaterEqual(len(shapes_3d), 3)
        for s in shapes_3d:
            self.assertEqual(s.dimension, "3D")

    def test_lessons(self):
        all_lessons = lessons.get_lessons()
        self.assertGreater(len(all_lessons), 0)

        first = all_lessons[0]
        fetched = lessons.get_lesson(first.id)
        self.assertEqual(fetched.id, first.id)
        self.assertEqual(fetched.title, first.title)

        with self.assertRaises(HTTPException) as ctx:
            lessons.get_lesson("invalid-lesson-id")
        self.assertEqual(ctx.exception.status_code, 404)

    def test_history(self):
        payload = HistoryCreate(
            shape_name="Square",
            recognized_shape="Square",
            similarity_score=92.0,
            status="success",
            characteristics={"vertexCount": 4, "angles": [90, 90, 90, 90]},
            feedback="Sharp corners!",
            duration_seconds=5,
            thumbnail_data="data:image/png;base64,abc"
        )
        created = history.record_history(payload)
        self.assertEqual(created.recognized_shape, "Square")
        self.assertEqual(created.similarity_score, 92.0)
        new_id = created.id

        items = history.get_history()
        self.assertTrue(any(i.id == new_id for i in items))

        # Delete
        del_res = history.delete_history(new_id)
        self.assertEqual(del_res["id"], new_id)

        # Deleting again raises 404
        with self.assertRaises(HTTPException) as ctx:
            history.delete_history(new_id)
        self.assertEqual(ctx.exception.status_code, 404)

    def test_three_d(self):
        models = three_d.get_3d_models_catalog()
        self.assertGreaterEqual(len(models), 8)

        cube_detail = three_d.get_3d_model_detail("cube")
        self.assertEqual(cube_detail["id"], "cube")
        self.assertIn("mesh", cube_detail)

        transform_res = three_d.compute_hand_transform({
            "yaw": 45.0,
            "pitch": 30.0,
            "zoom": 1.5,
            "pan_x": 0.2,
            "pan_y": -0.1
        })
        self.assertEqual(transform_res["status"], "success")
        self.assertEqual(transform_res["transform"]["scale"], 1.5)

if __name__ == "__main__":
    unittest.main()
