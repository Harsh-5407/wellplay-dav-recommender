from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def run_all_tests():
    print("🚀 Running WellPlay DAV End-to-End Verification Suite...\n")

    # 1. Health & Dataset Load Check
    res = client.get("/")
    assert res.status_code == 200, f"Health check failed: {res.status_code}"
    health = res.json()
    assert health["games_loaded"] == 250, f"Expected 250 games, got {health['games_loaded']}"
    assert health["users_loaded"] == 500, f"Expected 500 users, got {health['users_loaded']}"
    print("✅ [1/7] Health & Dataset Load Check passed (250 games, 500 users)")

    # 2. Catalog & Platform Metadata Check (/api/games)
    res = client.get("/api/games")
    assert res.status_code == 200
    games = res.json()["games"]
    platforms = {g["platform"] for g in games}
    assert "Mobile" in platforms and "PC" in platforms, f"Missing platforms in catalog: {platforms}"
    print(f"✅ [2/7] Catalog Endpoint passed ({len(games)} unique base titles across {platforms})")

    # 3. Mobile-Only Platform Filter Check
    mobile_payload = {
        "age": 24,
        "gender": "Female",
        "employment_status": "Student",
        "eye_strain_sensitivity": 5.0,
        "primary_mental_state": "Relaxed",
        "daily_free_time_mins": 60,
        "preferred_platform": "Mobile",
        "recommendation_mode": "Balanced",
    }
    res = client.post("/api/recommend", json=mobile_payload)
    assert res.status_code == 200
    mobile_recs = res.json()["recommendations"]
    assert len(mobile_recs) > 0, "No mobile recommendations returned"
    for g in mobile_recs:
        assert g["platform"] in ("Mobile", "PC & Mobile"), f"Non-mobile game leaked: {g['title']} ({g['platform']})"
    print(f"✅ [3/7] Mobile Platform Filter passed (Top pick: {mobile_recs[0]['title']} [{mobile_recs[0]['platform']}])")

    # 4. Recommendation Modes (Relaxation vs High Energy) Check
    base_user = {
        "age": 22,
        "gender": "Male",
        "employment_status": "Student",
        "eye_strain_sensitivity": 3.0,
        "primary_mental_state": "Relaxed",
        "daily_free_time_mins": 150,
        "preferred_platform": "PC",
        "recommendation_mode": "Relaxation",
    }
    relax_top = client.post("/api/recommend", json=base_user).json()["recommendations"][0]["title"]
    base_user["recommendation_mode"] = "High Energy"
    energy_top = client.post("/api/recommend", json=base_user).json()["recommendations"][0]["title"]
    assert relax_top != energy_top, f"Modes produced identical #1 pick: {relax_top}"
    print(f"✅ [4/7] What-If Recommendation Modes passed (Relaxation: '{relax_top}' vs High Energy: '{energy_top}')")

    # 5. Explainable Penalty Breakdown & Age Guardrail Check
    teen_payload = {
        "age": 13,
        "gender": "Male",
        "employment_status": "Student",
        "eye_strain_sensitivity": 8.5,
        "primary_mental_state": "High Stress",
        "daily_free_time_mins": 45,
        "preferred_platform": "Any",
        "recommendation_mode": "Balanced",
    }
    teen_recs = client.post("/api/recommend", json=teen_payload).json()["recommendations"]
    for g in teen_recs:
        assert g["min_age"] <= 13, f"Age guardrail violated: {g['title']} (min_age={g['min_age']})"
        assert "match_breakdown" in g and "visual_strain_score" in g["match_breakdown"]
    print(f"✅ [5/7] Age Guardrails & Explainability Breakdown passed (Top 13yo pick: {teen_recs[0]['title']})")

    # 6. EDA Summary Endpoint Check (/api/eda-summary)
    res = client.get("/api/eda-summary")
    assert res.status_code == 200
    eda = res.json()
    assert len(eda["correlation_matrix"]["z"]) == 9
    assert len(eda["employment_stats"]) >= 4
    print("✅ [6/7] EDA Summary & Correlation Matrix passed")

    # 7. Advanced Statistical & ML Analytics Check (/api/advanced-analytics)
    res = client.get("/api/advanced-analytics")
    assert res.status_code == 200
    adv = res.json()
    assert len(adv["pca"]["cluster_summaries"]) == 4
    assert adv["data_audit"]["games_missing_values"] == 0
    assert adv["data_audit"]["scale_validated"] is True
    assert adv["hypothesis_tests"]["anova"]["p_value"] < 0.05
    print(
        f"✅ [7/7] PCA/K-Means & SciPy Hypothesis Tests passed "
        f"(ANOVA F={adv['hypothesis_tests']['anova']['f_statistic']}, η²={adv['hypothesis_tests']['anova']['eta_squared']})"
    )

    print("\n🎉 ALL 7 VERIFICATION TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    run_all_tests()