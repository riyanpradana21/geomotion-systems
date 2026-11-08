import unittest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import init_db
from backend.app.seed_data import seed_database

class TestGeometryAPI(unittest.TestCase):
    def setUp(self):
        init_db()
        seed_database()

    def test_health(self):
        with TestClient(app) as client:
            res = client.get("/api/health")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertEqual(data["status"], "ok")
            self.assertEqual(data["database"], "connected")
            self.assertGreater(data["shapes_count"], 0)
            self.assertGreater(data["lessons_count"], 0)

    def test_get_shapes(self):
        with TestClient(app) as client:
            res = client.get("/api/shapes")
            self.assertEqual(res.status_code, 200)
            shapes = res.json()
            self.assertGreaterEqual(len(shapes), 4)

            # Filter by 2D
            res_2d = client.get("/api/shapes?dimension=2D")
            self.assertEqual(res_2d.status_code, 200)
            for s in res_2d.json():
                self.assertEqual(s["dimension"], "2D")

    def test_get_lessons(self):
        with TestClient(app) as client:
            res = client.get("/api/lessons")
            self.assertEqual(res.status_code, 200)
            lessons = res.json()
            self.assertGreater(len(lessons), 0)

            first_id = lessons[0]["id"]
            res_one = client.get(f"/api/lessons/{first_id}")
            self.assertEqual(res_one.status_code, 200)
            self.assertEqual(res_one.json()["id"], first_id)

    def test_lesson_not_found(self):
        with TestClient(app) as client:
            res = client.get("/api/lessons/nonexistent-id")
            self.assertEqual(res.status_code, 404)

    def test_history_crud(self):
        with TestClient(app) as client:
            payload = {
                "shape_name": "Square",
                "recognized_shape": "Square",
                "similarity_score": 94.5,
                "status": "success",
                "characteristics": {
                    "vertexCount": 4,
                    "aspectRatio": 1.02,
                    "circularity": 0.78
                },
                "feedback": "Perfect 90-degree corners!",
                "duration_seconds": 6,
                "thumbnail_data": "data:image/png;base64,sample"
            }
            create_res = client.post("/api/history", json=payload)
            self.assertEqual(create_res.status_code, 201)
            created = create_res.json()
            new_id = created["id"]
            self.assertEqual(created["recognized_shape"], "Square")
            self.assertEqual(created["similarity_score"], 94.5)

            # Read history list
            get_res = client.get("/api/history")
            self.assertEqual(get_res.status_code, 200)
            items = get_res.json()
            self.assertTrue(any(i["id"] == new_id for i in items))

            # Delete
            del_res = client.delete(f"/api/history/{new_id}")
            self.assertEqual(del_res.status_code, 200)

            # Confirm deleted
            del_res_again = client.delete(f"/api/history/{new_id}")
            self.assertEqual(del_res_again.status_code, 404)

    def test_validation_errors(self):
        with TestClient(app) as client:
            # Invalid similarity score (> 100)
            invalid_payload = {
                "shape_name": "Circle",
                "recognized_shape": "Circle",
                "similarity_score": 150.0,
                "status": "success",
                "characteristics": {}
            }
            res = client.post("/api/history", json=invalid_payload)
            self.assertEqual(res.status_code, 422)

if __name__ == "__main__":
    unittest.main()
