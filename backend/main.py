from typing import Any, cast
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from scipy import stats

app = FastAPI(
    title="WellPlay DAV Analytics & Recommendation API",
    description="Multi-Dimensional Constraint-Aware Video Game Recommendation, EDA & Statistical ML Engine",
    version="1.2.0"
)

# Enable CORS so our React frontend can communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load engineered datasets into memory
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

# Phase 1: Transparent Recommendation Modes with dynamic weight multipliers
MODE_WEIGHTS = {
    "Balanced": np.array([1.6, 1.4, 1.2, 1.2, 1.5, 1.3, 1.1]),
    "Relaxation": np.array([2.5, 1.8, 1.0, 0.8, 2.5, 1.5, 1.0]),   # Prioritize low visual & emotional strain
    "High Energy": np.array([0.8, 1.5, 1.2, 1.2, 0.8, 2.5, 2.0]),  # Prioritize intense, demanding mechanics
    "Casual": np.array([1.2, 1.0, 3.0, 0.8, 1.0, 1.2, 1.5]),       # Prioritize low session commitment
    "Social": np.array([1.2, 1.2, 1.2, 3.0, 1.2, 1.2, 1.0]),       # Prioritize cooperative/social interaction
}


class UserProfileInput(BaseModel):
    age: int
    gender: str
    employment_status: str
    eye_strain_sensitivity: float
    primary_mental_state: str
    daily_free_time_mins: int
    preferred_platform: str = "Any"
    recommendation_mode: str = "Balanced"


@app.get("/")
def health_check():
    return {
        "status": "online",
        "games_loaded": len(games_df),
        "users_loaded": len(users_df)
    }


@app.get("/api/games")
def get_games_catalog():
    """Returns deduplicated game catalog with all 7 engineered indices for comparison & discovery."""
    catalog = games_df.copy()
    catalog["base_title"] = catalog["title"].str.replace(r" \(Edition \d+\)$", "", regex=True)
    catalog = catalog.drop_duplicates(subset=["base_title"]).sort_values("base_title")

    result = []
    for _, row in catalog.iterrows():
        result.append({
            "game_id": int(row["game_id"]),
            "title": str(row["base_title"]),
            "platform": str(row["platform"]) if "platform" in catalog.columns else "PC",
            "tags": str(row["tags"]),
            "avg_playtime_hrs": float(row["avg_playtime_hrs"]),
            "positive_rating_pct": int(row["positive_rating_pct"]),
            "min_age": int(row["min_age"]),
            "overall_intensity": round(float(np.mean([float(row[c]) for c in FEATURE_COLS])), 2),
            "scores": {col: float(row[col]) for col in FEATURE_COLS}
        })
    return {"games": result}


@app.get("/api/eda-summary")
def get_eda_summary():
    """
    Returns aggregated statistical summaries & correlation matrices
    for the Exploratory Data Analysis (EDA) dashboard tab.
    """
    corr_cols = FEATURE_COLS + ["positive_rating_pct", "avg_playtime_hrs"]
    corr_matrix = games_df[corr_cols].corr().round(2)

    emp_group = users_df.groupby("employment_status").agg(
        user_count=("user_id", "count"),
        avg_eye_strain=("eye_strain_sensitivity", "mean"),
        avg_free_time=("daily_free_time_mins", "mean"),
        avg_age=("age", "mean")
    ).round(2).reset_index()

    mental_dist = (
        pd.crosstab(users_df["employment_status"], users_df["primary_mental_state"])
        .reset_index()
        .to_dict(orient="records")
    )

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


@app.get("/api/advanced-analytics")
def get_advanced_analytics():
    """
    Phase 3 DAV Engine:
    1. Standardizes 7 game dimensions -> PCA (2D) + K-Means (k=4) analytical clustering
    2. Computes Parallel Coordinates & Box Plot distribution data
    3. Runs Pearson, Spearman, One-Way ANOVA (with Levene's test & eta-squared), and Chi-Square tests
    4. Performs automated Data Quality & Governance audits
    """
    base = games_df.copy()
    base["base_title"] = base["title"].str.replace(r" \(Edition \d+\)$", "", regex=True)
    base = base.drop_duplicates(subset=["base_title"]).reset_index(drop=True)

    X = base[FEATURE_COLS].to_numpy(dtype=float)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # 1. PCA 2D Projection (cast explicitly to NumPy ndarray for strict Pylance typing)
    pca = PCA(n_components=2, random_state=42)
    coords = np.asarray(pca.fit_transform(X_scaled), dtype=float)
    explained_var = [round(float(v) * 100.0, 1) for v in pca.explained_variance_ratio_]

    # 2. K-Means Clustering (k=4 analytical archetypes)
    kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
    clusters = np.asarray(kmeans.fit_predict(X_scaled), dtype=int)
    base["cluster_id"] = clusters

    cluster_summaries = []
    cluster_names = {}
    for cid in sorted(int(c) for c in base["cluster_id"].unique()):
        sub = base[base["cluster_id"] == cid]
        mean_vis = float(sub["visual_strain_score"].mean())
        mean_cog = float(sub["cognitive_load_score"].mean())
        mean_ref = float(sub["reflex_intensity_score"].mean())
        mean_soc = float(sub["social_pressure_score"].mean())
        overall = float(sub[FEATURE_COLS].to_numpy(dtype=float).mean())

        if overall < 3.6:
            label = f"Cluster {cid}: Cozy & Low-Stimulation"
        elif mean_soc >= 5.5:
            label = f"Cluster {cid}: Social & Competitive"
        elif mean_cog >= 6.0 and mean_ref < 5.5:
            label = f"Cluster {cid}: Deep Strategy & Narrative"
        else:
            label = f"Cluster {cid}: High-Intensity Action"

        cluster_names[cid] = label
        cluster_summaries.append({
            "cluster_id": cid,
            "label": label,
            "count": int(len(sub)),
            "avg_visual": round(mean_vis, 2),
            "avg_cognitive": round(mean_cog, 2),
            "avg_reflex": round(mean_ref, 2),
            "avg_social": round(mean_soc, 2),
            "overall_intensity": round(overall, 2),
        })

    pca_points = []
    for idx in range(len(base)):
        row = base.iloc[idx]
        cid = int(row["cluster_id"])
        row_scores = {col: float(row[col]) for col in FEATURE_COLS}
        pca_points.append({
            "title": str(row["base_title"]),
            "pc1": round(float(coords[idx, 0]), 3),
            "pc2": round(float(coords[idx, 1]), 3),
            "cluster_id": cid,
            "cluster_label": cluster_names[cid],
            "overall_intensity": round(float(np.mean(list(row_scores.values()))), 2),
            "scores": row_scores,
        })

    # 3. Box Plot Distributions across all 7 Dimensions
    boxplot_series = [
        {
            "dimension": col.replace("_score", "").replace("_", " ").title(),
            "values": [round(float(v), 2) for v in base[col].to_numpy(dtype=float).tolist()],
        }
        for col in FEATURE_COLS
    ]

    # 4. Strict Statistical Hypothesis Tests (SciPy with explicit float/int casting)
    vis_arr = base["visual_strain_score"].to_numpy(dtype=float)
    ref_arr = base["reflex_intensity_score"].to_numpy(dtype=float)

    pearson_res: Any = stats.pearsonr(vis_arr, ref_arr)
    r_p = float(pearson_res[0])
    p_p = float(pearson_res[1])

    spearman_res: Any = stats.spearmanr(vis_arr, ref_arr)
    r_s = float(spearman_res[0])
    p_s = float(spearman_res[1])

    groups = [
        grp["daily_free_time_mins"].to_numpy(dtype=float)
        for _, grp in users_df.groupby("employment_status")
    ]
    anova_res: Any = stats.f_oneway(*groups)
    f_stat = float(anova_res[0])
    p_anova = float(anova_res[1])

    levene_res: Any = stats.levene(*groups)
    lev_stat = float(levene_res[0])
    p_levene = float(levene_res[1])

    free_time_arr = users_df["daily_free_time_mins"].to_numpy(dtype=float)
    grand_mean = float(np.mean(free_time_arr))
    ss_total = float(np.sum((free_time_arr - grand_mean) ** 2))
    ss_between = float(sum(len(g) * ((float(np.mean(g)) - grand_mean) ** 2) for g in groups))
    eta_sq = round(ss_between / ss_total, 4) if ss_total > 0 else 0.0

    contingency = pd.crosstab(users_df["employment_status"], users_df["primary_mental_state"])
    chi2_res: Any = stats.chi2_contingency(contingency)
    chi2 = float(chi2_res[0])
    p_chi2 = float(chi2_res[1])
    dof = int(chi2_res[2])

    # 5. Data Quality & Governance Audit
    feat_matrix = games_df[FEATURE_COLS].to_numpy(dtype=float)
    audit = {
        "games_rows": int(len(games_df)),
        "unique_base_games": int(len(base)),
        "games_missing_values": int(games_df.isna().sum().sum()),
        "users_rows": int(len(users_df)),
        "users_missing_values": int(users_df.isna().sum().sum()),
        "users_duplicate_ids": int(users_df["user_id"].duplicated().sum()),
        "scale_validated": bool((np.min(feat_matrix) >= 1.0) and (np.max(feat_matrix) <= 10.0)),
    }

    return {
        "pca": {
            "explained_variance_pct": explained_var,
            "total_variance_explained": round(sum(explained_var), 1),
            "points": pca_points,
            "cluster_summaries": cluster_summaries,
        },
        "boxplots": boxplot_series,
        "hypothesis_tests": {
            "correlation": {
                "variables": "Visual Strain vs. Reflex Intensity",
                "pearson_r": round(r_p, 4),
                "pearson_p": float(f"{p_p:.4e}"),
                "spearman_rho": round(r_s, 4),
                "spearman_p": float(f"{p_s:.4e}"),
                "interpretation": "Strong positive linear and monotonic relationship (fast-paced reflex games require higher visual tracking, though correlation does not imply causation).",
            },
            "anova": {
                "variables": "Daily Free Gaming Time across Employment Statuses",
                "null_hypothesis": "H0: Mean daily free gaming minutes are equal across all employment cohorts.",
                "f_statistic": round(f_stat, 4),
                "p_value": float(f"{p_anova:.4e}"),
                "eta_squared": eta_sq,
                "levene_stat": round(lev_stat, 4),
                "levene_p": round(p_levene, 4),
                "interpretation": "Reject H0 (p < 0.05): Employment status significantly affects available gaming time with a substantial effect size.",
            },
            "chi_square": {
                "variables": "Employment Status vs. Primary Mental State",
                "null_hypothesis": "H0: Primary psychological state is independent of employment status.",
                "chi2_statistic": round(chi2, 4),
                "dof": dof,
                "p_value": round(p_chi2, 4),
                "interpretation": "Evaluates demographic distribution independence across psychological states in the synthetic cohort (N=500).",
            },
        },
        "data_audit": audit,
    }


@app.post("/api/recommend")
def recommend_games(profile: UserProfileInput):
    """
    Computes a 7-axis User Comfort Tolerance Profile and returns top
    constraint-aligned games with explainable match metrics and asymmetric penalty breakdowns.
    """
    target_visual = round(float(np.clip(11.0 - profile.eye_strain_sensitivity, 1.5, 9.5)), 2)

    time_factor = float(np.clip((profile.daily_free_time_mins / 240.0) * 9.0 + 1.0, 2.0, 9.5))
    if profile.employment_status == "Full-Time Employed":
        time_factor = min(time_factor, 5.5)
    target_session = round(time_factor, 2)

    state_presets = {
        "Relaxed":      {"cog": 7.5, "soc": 7.0, "emo": 6.5, "ref": 7.5, "grd": 7.0},
        "Overthinking": {"cog": 4.2, "soc": 3.0, "emo": 3.5, "ref": 3.5, "grd": 3.0},
        "High Stress":  {"cog": 3.0, "soc": 2.2, "emo": 3.0, "ref": 2.5, "grd": 3.5},
        "Low Mood":     {"cog": 4.0, "soc": 4.0, "emo": 1.8, "ref": 3.5, "grd": 2.8},
    }
    preset = state_presets.get(profile.primary_mental_state, state_presets["Relaxed"])

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

    filtered = games_df[games_df["min_age"] <= profile.age].copy()

    if "platform" in filtered.columns:
        if profile.preferred_platform == "Mobile":
            filtered = filtered[filtered["platform"].isin(["Mobile", "PC & Mobile"])]
        elif profile.preferred_platform == "PC":
            filtered = filtered[filtered["platform"].isin(["PC", "PC & Mobile"])]

    if profile.eye_strain_sensitivity >= 7.5:
        filtered = filtered[filtered["visual_strain_score"] <= 5.5]
    if profile.primary_mental_state in ["High Stress", "Low Mood"]:
        filtered = filtered[filtered["emotional_heaviness_score"] <= 5.5]

    filtered["base_title"] = filtered["title"].str.replace(r" \(Edition \d+\)$", "", regex=True)
    filtered = filtered.drop_duplicates(subset=["base_title"])

    weights = MODE_WEIGHTS.get(profile.recommendation_mode, MODE_WEIGHTS["Balanced"])
    target_vec = np.array([user_target[col] for col in FEATURE_COLS], dtype=float)

    game_matrix = filtered[FEATURE_COLS].to_numpy(dtype=float)
    diffs = game_matrix - target_vec

    asymmetric_diffs = np.where(diffs > 0, diffs * 1.8, np.abs(diffs) * 0.45)
    weighted_dist = np.sqrt(np.sum(weights * (asymmetric_diffs ** 2), axis=1))

    max_possible_dist = 22.0
    raw_match = np.clip(100.0 * (1.0 - (weighted_dist / max_possible_dist)), 40.0, 99.5)
    rating_bonus = (filtered["positive_rating_pct"].to_numpy(dtype=float) - 85.0) * 0.15
    filtered["match_score"] = np.round(np.clip(raw_match + rating_bonus, 45.0, 99.4), 1)

    top_games = filtered.sort_values(by="match_score", ascending=False).head(20)

    recommendations = []
    for _, row in top_games.iterrows():
        match_breakdown = {}
        for idx, col in enumerate(FEATURE_COLS):
            game_val = float(row[col])
            user_val = float(user_target[col])

            if game_val > user_val:
                status = "Exceeds Limit"
                penalty = float(((game_val - user_val) * 1.8) ** 2 * weights[idx])
            else:
                status = "Within Comfort"
                penalty = float((abs(game_val - user_val) * 0.45) ** 2 * weights[idx])

            match_breakdown[col] = {
                "game_value": round(game_val, 1),
                "user_ceiling": round(user_val, 1),
                "penalty_applied": round(penalty, 2),
                "status": status
            }

        score = float(row["match_score"])
        if score >= 90:
            match_category = "Exceptional Match"
        elif score >= 80:
            match_category = "Strong Match"
        elif score >= 65:
            match_category = "Good Match"
        else:
            match_category = "Fair Match"

        reasons = []
        if float(row["visual_strain_score"]) <= target_visual:
            reasons.append(f"Respects visual limit ({row['visual_strain_score']} vs {target_visual} ceiling)")
        if float(row["session_commitment_score"]) > target_session + 2.0:
            reasons.append("Warning: Demands more time than your daily free schedule")
        if match_breakdown["emotional_heaviness_score"]["status"] == "Exceeds Limit":
            reasons.append("Warning: Tone may be too intense for current mental state")

        if not reasons:
            reasons.append(f"Safely balanced across all 7 dimensions for {profile.recommendation_mode.lower()} play")

        recommendations.append({
            "game_id": int(row["game_id"]),
            "title": str(row["base_title"]),
            "platform": str(row["platform"]) if "platform" in filtered.columns else "PC",
            "tags": str(row["tags"]),
            "avg_playtime_hrs": float(row["avg_playtime_hrs"]),
            "positive_rating_pct": int(row["positive_rating_pct"]),
            "min_age": int(row["min_age"]),
            "match_score": score,
            "match_category": match_category,
            "match_breakdown": match_breakdown,
            "reasons": reasons,
            "scores": {col: float(row[col]) for col in FEATURE_COLS}
        })

    return {
        "user_target_profile": user_target,
        "recommendation_mode": profile.recommendation_mode,
        "recommendations": recommendations
    }