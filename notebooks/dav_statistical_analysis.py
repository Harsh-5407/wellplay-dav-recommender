import pandas as pd
from scipy import stats

# Load datasets
games = pd.read_csv("../data/games_catalog.csv")
users = pd.read_csv("../data/users_wellness.csv")

FEATURE_COLS = [
    "visual_strain_score",
    "cognitive_load_score",
    "session_commitment_score",
    "social_pressure_score",
    "emotional_heaviness_score",
    "reflex_intensity_score",
    "grind_complexity_score",
]

print("=" * 65)
print("1. DESCRIPTIVE STATISTICS: 7 ENGINEERED GAME WELL-BEING INDICES")
print("=" * 65)
print(games[FEATURE_COLS].describe().round(2).to_string())

print("\n" + "=" * 65)
print("2. DEMOGRAPHIC SUMMARY BY EMPLOYMENT STATUS")
print("=" * 65)
emp_summary = users.groupby("employment_status").agg(
    count=("user_id", "count"),
    mean_age=("age", "mean"),
    mean_eye_strain=("eye_strain_sensitivity", "mean"),
    std_eye_strain=("eye_strain_sensitivity", "std"),
    mean_free_time_mins=("daily_free_time_mins", "mean"),
).round(2)
print(emp_summary.to_string())

print("\n" + "=" * 65)
print("3. STATISTICAL HYPOTHESIS TESTS (FOR DAV REPORT & VIVA)")
print("=" * 65)

# Test A: Pearson Correlation between User Age and Eye Strain Sensitivity
r_age_eye, p_age_eye = stats.pearsonr(users["age"], users["eye_strain_sensitivity"])
print(f"Test A (Pearson r — Age vs. Eye Strain): r = {r_age_eye:.3f}, p = {p_age_eye:.4e}")
print("  -> Conclusion:", "Statistically significant positive correlation." if p_age_eye < 0.05 else "No significant correlation.")

# Test B: One-Way ANOVA — Does Daily Free Time differ significantly across Employment Status?
groups = [grp["daily_free_time_mins"].values for _, grp in users.groupby("employment_status")]
f_stat, p_anova = stats.f_oneway(*groups)
print(f"\nTest B (One-Way ANOVA — Free Time across Employment Groups): F = {f_stat:.2f}, p = {p_anova:.4e}")
print("  -> Conclusion:", "Significant difference across employment cohorts (justifies employment-aware session caps)." if p_anova < 0.05 else "No significant difference.")

# Test C: Pearson Correlation between Visual Strain & Reflex Intensity in Games
r_vis_ref, p_vis_ref = stats.pearsonr(games["visual_strain_score"], games["reflex_intensity_score"])
print(f"\nTest C (Pearson r — Visual Strain vs. Reflex/APM): r = {r_vis_ref:.3f}, p = {p_vis_ref:.4e}")