from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd
import numpy as np

app = FastAPI(
    title="WellPlay DAV Analytics & Recommendation API",
    description="Multi-Dimensional Constraint-Aware Video Game Recommendation & EDA Engine",
    version="1.0.0"
)

# Enable CORS so our React frontend (localhost:5173) can talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load engineered datasets into memory (fast & zero DB overhead)
games_df = pd.read_csv("../data/games_catalog.csv")
users_df = pd.read_csv("../data/users_wellness.csv")

FEATURE_COLS = [
    "visual_strain_score",
    "cognitive_load_score",
    "session_commitment_score",
    "social_pressure_score",
    "emotional_heaviness_score",
    "reflex_intensity_score",
    "grind_complexity_score",
]

class UserProfileInput(BaseModel):
    age: int = Field(22, ge=10, le=90)
    gender: str = Field("Male")
    employment_status: str = Field("Student")  # Student, Full-Time Employed, Freelancer, Unemployed, Retired
    eye_strain_sensitivity: float = Field(7.0, ge=1.0, le=10.0)
    primary_mental_state: str = Field("Overthinking")  # Relaxed, Overthinking, High Stress, Low Mood
    daily_free_time_mins: int = Field(60, ge=15, le=300)


@app.get("/")
def health_check():
    return {
        "status": "online",
        "games_loaded": len(games_df),
        "users_loaded": len(users_df)
    }


@app.get("/api/eda-summary")
def get_eda_summary():
    """
    Returns aggregated statistical summaries & correlation matrices
    for the Exploratory Data Analysis (EDA) dashboard tab.
    """
    # 1. Correlation Matrix across the 7 engineered indices + rating
    corr_cols = FEATURE_COLS + ["positive_rating_pct", "avg_playtime_hrs"]
    corr_matrix = games_df[corr_cols].corr().round(2)

    # 2. Demographic & Wellness Breakdown by Employment Status
    emp_group = users_df.groupby("employment_status").agg(
        user_count=("user_id", "count"),
        avg_eye_strain=("eye_strain_sensitivity", "mean"),
        avg_free_time=("daily_free_time_mins", "mean"),
        avg_age=("age", "mean")
    ).round(2).reset_index()

    # 3. Mental State Distribution across Employment Statuses (Stacked Bar Data)
    mental_dist = (
        pd.crosstab(users_df["employment_status"], users_df["primary_mental_state"])
        .reset_index()
        .to_dict(orient="records")
    )

    # 4. Scatter Plot Sample (Deduplicated base games for clean plotting)
    base_games = games_df.drop_duplicates(subset=["tags", "min_age"]).head(50)
    scatter_data = base_games[[
        "title", "visual_strain_score", "cognitive_load_score",
        "emotional_heaviness_score", "positive_rating_pct", "avg_playtime_hrs"
    ]].to_dict(orient="records")

    return {
        "kpis": {
            "total_games": int(len(games_df)),
            "total_users": int(len(users_df)),
            "avg_catalog_visual_strain": round(float(games_df["visual_strain_score"].mean()), 2),
            "avg_user_eye_strain": round(float(users_df["eye_strain_sensitivity"].mean()), 2),
            "high_stress_user_pct": round(
                float((users_df["primary_mental_state"].isin(["High Stress", "Overthinking"])).mean() * 100), 1
            ),
        },
        "correlation_matrix": {
            "labels": [c.replace("_score", "").replace("_", " ").title() for c in corr_cols],
            "z": corr_matrix.values.tolist()
        },
        "employment_stats": emp_group.to_dict(orient="records"),
        "mental_state_distribution": mental_dist,
        "scatter_games": scatter_data
    }


@app.post("/api/recommend")
def recommend_games(profile: UserProfileInput):
    """
    Computes a 7-axis User Comfort Tolerance Profile and returns the top 6
    constraint-aligned games with explainable match metrics.
    """
    # Step 1: Derive User's Ideal Max Tolerance Vector (1 to 10 scale; lower = gentler)
    # Visual tolerance inversely scales with eye_strain_sensitivity
    target_visual = round(np.clip(11.0 - profile.eye_strain_sensitivity, 1.5, 9.5), 2)

    # Session commitment scales with daily free time & employment status
    time_factor = np.clip((profile.daily_free_time_mins / 240.0) * 9.0 + 1.0, 2.0, 9.5)
    if profile.employment_status == "Full-Time Employed":
        time_factor = min(time_factor, 5.5)
    target_session = round(float(time_factor), 2)

    # Psychological & Motor adjustments based on primary_mental_state
    state_presets = {
        "Relaxed":      {"cog": 7.5, "soc": 7.0, "emo": 6.5, "ref": 7.5, "grd": 7.0},
        "Overthinking": {"cog": 4.2, "soc": 3.0, "emo": 3.5, "ref": 3.5, "grd": 3.0},
        "High Stress":  {"cog": 3.0, "soc": 2.2, "emo": 3.0, "ref": 2.5, "grd": 3.5},
        "Low Mood":     {"cog": 4.0, "soc": 4.0, "emo": 1.8, "ref": 3.5, "grd": 2.8},
    }
    preset = state_presets.get(profile.primary_mental_state, state_presets["Relaxed"])

    # Age & Eye-strain fine-tuning on reflex intensity
    age_reflex_cap = 9.0 if profile.age < 30 else (6.5 if profile.age < 45 else 4.5)
    target_reflex = round(min(preset["ref"], age_reflex_cap, target_visual + 1.0), 2)

    user_target = {
        "visual_strain_score": target_visual,
        "cognitive_load_score": preset["cog"],
        "session_commitment_score": target_session,
        "social_pressure_score": preset["soc"],
        "emotional_heaviness_score": preset["emo"],
        "reflex_intensity_score": target_reflex,
        "grind_complexity_score": preset["grd"],
    }

    # Step 2: Hard Constraint Filtering (Age rating + Severe Strain Guardrails)
    filtered = games_df[games_df["min_age"] <= profile.age].copy()
    if profile.eye_strain_sensitivity >= 7.5:
        filtered = filtered[filtered["visual_strain_score"] <= 5.5]
    if profile.primary_mental_state in ["High Stress", "Low Mood"]:
        filtered = filtered[filtered["emotional_heaviness_score"] <= 5.5]

    # Deduplicate edition variants so user gets 6 genuinely distinct titles
    filtered["base_title"] = filtered["title"].str.replace(r" \(Edition \d+\)$", "", regex=True)
    filtered = filtered.drop_duplicates(subset=["base_title"])

    # Step 3: Asymmetric Penalty & Weighted Similarity Scoring
    # Exceeding a user's strain tolerance is penalized 1.8x harder than being gentler than the ceiling
    weights = np.array([1.6, 1.4, 1.2, 1.2, 1.5, 1.3, 1.1])  # Emphasize visual & emotional safety
    target_vec = np.array([user_target[col] for col in FEATURE_COLS])

    game_matrix = filtered[FEATURE_COLS].values
    diffs = game_matrix - target_vec
    # Penalize exceeding tolerance heavily; slight reward/neutrality if gentler
    asymmetric_diffs = np.where(diffs > 0, diffs * 1.8, np.abs(diffs) * 0.45)
    weighted_dist = np.sqrt(np.sum(weights * (asymmetric_diffs ** 2), axis=1))

    # Convert distance to a 0-100 Wellness Match Score + small boost for high Steam rating
    max_possible_dist = 22.0
    raw_match = np.clip(100.0 * (1.0 - (weighted_dist / max_possible_dist)), 40.0, 99.5)
    rating_bonus = (filtered["positive_rating_pct"].values - 85.0) * 0.15
    filtered["match_score"] = np.round(np.clip(raw_match + rating_bonus, 45.0, 99.4), 1)

    top_games = filtered.sort_values(by="match_score", ascending=False).head(6)

    recommendations = []
    for _, row in top_games.iterrows():
        reasons = []
        if row["visual_strain_score"] <= 4.0:
            reasons.append("Low visual clutter & gentle pacing protects against eye fatigue")
        if row["emotional_heaviness_score"] <= 3.0:
            reasons.append("Uplifting, non-bleak tone supports positive mood")
        if row["social_pressure_score"] <= 3.5:
            reasons.append("Zero competitive PvP toxicity; play at your own pace")
        if row["grind_complexity_score"] <= 3.8:
            reasons.append("Clear, structured goals help quiet overthinking")
        if row["session_commitment_score"] <= 5.0:
            reasons.append(f"Fits busy {profile.employment_status.lower()} schedules (~{row['avg_playtime_hrs']}h avg)")
        if not reasons:
            reasons.append("Balanced intensity aligned with your overall comfort profile")

        recommendations.append({
            "game_id": int(row["game_id"]),
            "title": row["base_title"],
            "tags": row["tags"],
            "avg_playtime_hrs": float(row["avg_playtime_hrs"]),
            "positive_rating_pct": int(row["positive_rating_pct"]),
            "min_age": int(row["min_age"]),
            "match_score": float(row["match_score"]),
            "reasons": reasons[:3],
            "scores": {col: float(row[col]) for col in FEATURE_COLS}
        })

    return {
        "user_target_profile": user_target,
        "recommendations": recommendations
    }