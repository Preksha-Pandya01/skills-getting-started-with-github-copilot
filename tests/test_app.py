from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # expect some known activities
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    email = "test_student@example.com"

    # Ensure not already present
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # Signup
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert resp.json()["message"] == f"Signed up {email} for {activity}"
    assert email in activities[activity]["participants"]

    # Unregister
    resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp.status_code == 200
    assert resp.json()["message"] == f"Unregistered {email} from {activity}"
    assert email not in activities[activity]["participants"]


def test_signup_duplicate():
    activity = "Programming Class"
    email = "dup_student@example.com"

    # Ensure clean state
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # First signup
    resp1 = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp1.status_code == 200

    # Duplicate signup should fail
    resp2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp2.status_code == 400
    assert "already signed up" in resp2.json()["detail"].lower()

    # Cleanup
    activities[activity]["participants"].remove(email)


def test_unregister_nonexistent_participant():
    activity = "Gym Class"
    email = "noone@example.com"

    # Ensure not present
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp.status_code == 404
    assert "participant not found" in resp.json()["detail"].lower()
*** End Patch