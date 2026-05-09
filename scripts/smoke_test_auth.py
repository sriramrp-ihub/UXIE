from __future__ import annotations

import json
import sys
from dataclasses import dataclass
from urllib import error, request


BASE_URL = "http://127.0.0.1:8000/api/v1"


@dataclass(frozen=True)
class Scenario:
    label: str
    email: str
    password: str
    expected_role: str
    endpoints: tuple[str, ...]


SCENARIOS = (
    Scenario(
        label="learner",
        email="student@example.com",
        password="Password123!",
        expected_role="student",
        endpoints=(
            "/users/me",
            "/courses",
            "/my-courses",
            "/analytics/dashboard/me",
        ),
    ),
    Scenario(
        label="admin",
        email="admin@example.com",
        password="Password123!",
        expected_role="admin",
        endpoints=(
            "/users/me",
            "/users",
            "/courses",
            "/analytics/dashboard/global",
            "/analytics/active-users",
        ),
    ),
)


def api_request(path: str, method: str = "GET", payload: dict | None = None, token: str | None = None) -> tuple[int, dict]:
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = request.Request(f"{BASE_URL}{path}", data=body, headers=headers, method=method)
    try:
        with request.urlopen(req, timeout=15) as response:
            raw = response.read().decode("utf-8")
            return response.status, json.loads(raw)
    except error.HTTPError as exc:
        raw = exc.read().decode("utf-8")
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            parsed = {"success": False, "data": None, "error": raw}
        return exc.code, parsed


def login(email: str, password: str) -> str:
    status_code, payload = api_request(
        "/auth/login",
        method="POST",
        payload={"email": email, "password": password},
    )
    if status_code != 200 or not payload.get("success"):
        raise RuntimeError(f"login failed for {email}: {payload}")

    token = (payload.get("data") or {}).get("access_token")
    if not token:
        raise RuntimeError(f"login response missing access_token for {email}: {payload}")
    return token


def assert_role(token: str, expected_role: str) -> None:
    status_code, payload = api_request("/users/me", token=token)
    if status_code != 200 or not payload.get("success"):
        raise RuntimeError(f"/users/me failed: {payload}")
    actual_role = (payload.get("data") or {}).get("role")
    if actual_role != expected_role:
        raise RuntimeError(f"expected role {expected_role}, got {actual_role}")


def run() -> int:
    failures: list[str] = []

    for scenario in SCENARIOS:
        try:
            token = login(scenario.email, scenario.password)
            assert_role(token, scenario.expected_role)
            print(f"[PASS] {scenario.label}: login and role check")

            for path in scenario.endpoints:
                status_code, payload = api_request(path, token=token)
                if status_code != 200 or not payload.get("success"):
                    raise RuntimeError(f"{path} returned {status_code}: {payload}")
                print(f"[PASS] {scenario.label}: GET {path}")
        except Exception as exc:  # noqa: BLE001
            failures.append(f"{scenario.label}: {exc}")
            print(f"[FAIL] {scenario.label}: {exc}")

    if failures:
        print("\nSmoke test failures:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("\nAll auth smoke tests passed.")
    return 0


if __name__ == "__main__":
    sys.exit(run())
