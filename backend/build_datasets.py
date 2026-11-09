import os
import numpy as np
import pandas as pd

os.makedirs("../data", exist_ok=True)
np.random.seed(42)

# 1. Curated Real-World Game Seed Pool (Expandable with Kaggle Steam CSV)
SEED_GAMES = [
    # Cozy / Low Strain / Uplifting
    ("Unpacking", "Casual,Puzzle,Relaxing,Minimalist,Singleplayer,Wholesome,Short", 4.0, 96, 7),
    ("Dorfromantik", "Strategy,Puzzle,Relaxing,Minimalist,Singleplayer,Wholesome,Turn-Based", 12.0, 97, 7),
    ("A Short Hike", "Adventure,Exploration,Wholesome,Cute,Singleplayer,Comedy,Short", 2.5, 99, 7),
    ("Stardew Valley", "Farming Sim,Relaxing,Wholesome,Co-op,Singleplayer,Pixel Graphics", 65.0, 98, 10),
    ("PowerWash Simulator", "Simulation,Relaxing,Singleplayer,Co-op,Minimalist,Wholesome", 35.0, 97, 7),
    ("Townscaper", "Casual,City Builder,Relaxing,Minimalist,Singleplayer,Wholesome", 3.0, 95, 7),
    ("Abzu", "Adventure,Exploration,Atmospheric,Relaxing,Singleplayer,Short", 2.5, 93, 7),
    ("Journey", "Adventure,Atmospheric,Exploration,Singleplayer,Wholesome,Short", 2.0, 95, 7),
    ("Coffee Talk", "Visual Novel,Relaxing,Wholesome,Singleplayer,Atmospheric,Short", 4.5, 95, 10),
    ("Spiritfarer", "Management,Wholesome,Emotional,Co-op,Singleplayer,Relaxing", 28.0, 96, 10),
    ("Slime Rancher", "Adventure,Cute,Wholesome,Singleplayer,Exploration,Relaxing", 22.0, 97, 7),
    ("Untitled Goose Game", "Comedy,Puzzle,Wholesome,Co-op,Singleplayer,Short", 3.5, 95, 7),
    ("Mini Motorways", "Strategy,Puzzle,Minimalist,Singleplayer,Short", 14.0, 95, 7),
    ("Alba: A Wildlife Adventure", "Adventure,Wholesome,Cute,Exploration,Singleplayer,Short", 3.0, 97, 7),
    ("Gris", "Platformer,Atmospheric,Emotional,Minimalist,Singleplayer,Short", 4.0, 96, 10),

    # Moderate / Engaging Puzzle & Narrative (Good for Overthinking / Flow State)
    ("Portal 2", "Puzzle,Comedy,Co-op,Singleplayer,Sci-Fi,Linear", 10.0, 99, 10),
    ("The Talos Principle", "Puzzle,Philosophical,Atmospheric,Singleplayer,First-Person", 18.0, 95, 10),
    ("Baba Is You", "Puzzle,Turn-Based,Minimalist,Singleplayer,Complex", 20.0, 98, 7),
    ("Return of the Obra Dinn", "Detective,Puzzle,Mystery,Singleplayer,Minimalist", 9.0, 96, 16),
    ("Firewatch", "Adventure,Narrative,Atmospheric,Singleplayer,Short", 4.5, 89, 16),
    ("Outer Wilds", "Exploration,Mystery,Atmospheric,Space,Singleplayer", 18.0, 95, 10),
    ("It Takes Two", "Co-op,Adventure,Platformer,Comedy,Wholesome", 13.0, 96, 12),
    ("Civilization VI", "Grand Strategy,Turn-Based,Complex,Singleplayer,Multiplayer", 95.0, 86, 12),
    ("Slay the Spire", "Card Battler,Roguelike,Turn-Based,Singleplayer,Complex", 55.0, 97, 10),
    ("Into the Breach", "Strategy,Turn-Based,Minimalist,Singleplayer,Short", 16.0, 94, 10),
    ("Disco Elysium", "RPG,Narrative,Detective,Dark,Complex,Singleplayer", 32.0, 94, 18),
    ("Life is Strange", "Narrative,Emotional,Atmospheric,Singleplayer,Drama", 14.0, 96, 16),
    ("Cities: Skylines", "City Builder,Simulation,Sandbox,Singleplayer,Complex", 75.0, 93, 7),
    ("Subnautica", "Survival,Exploration,Open World,Crafting,Atmospheric,Singleplayer", 38.0, 96, 10),
    ("Dave the Diver", "Adventure,Management,Comedy,Wholesome,Singleplayer", 25.0, 97, 10),

    # High Intensity / High Reflex / Heavy Tone / Competitive
    ("Counter-Strike 2", "FPS,Competitive,PvP,Fast-Paced,Multiplayer,High-Reflex", 250.0, 87, 18),
    ("Valorant", "FPS,Competitive,PvP,Fast-Paced,Neon,Multiplayer,High-Reflex", 220.0, 85, 16),
    ("Apex Legends", "Battle Royale,FPS,Competitive,PvP,Fast-Paced,High-Reflex", 180.0, 80, 16),
    ("Dota 2", "MOBA,Competitive,PvP,Complex,Multiplayer,High-Reflex", 400.0, 82, 16),
    ("Elden Ring", "Souls-like,Dark,Open World,Complex,High-Reflex,Singleplayer", 85.0, 93, 18),
    ("Sekiro: Shadows Die Twice", "Souls-like,Fast-Paced,High-Reflex,Dark,Singleplayer", 42.0, 95, 18),
    ("DOOM Eternal", "FPS,Fast-Paced,Gore,Neon,High-Reflex,Singleplayer", 18.0, 91, 18),
    ("Hotline Miami", "Fast-Paced,Neon,Gore,High-Reflex,Dark,Singleplayer,Short", 6.0, 97, 18),
    ("Geometry Dash", "Rhythm,Fast-Paced,Neon,High-Reflex,Singleplayer", 30.0, 93, 7),
    ("Phasmophobia", "Psychological Horror,Dark,Co-op,Multiplayer,Atmospheric", 35.0, 96, 16),
    ("Outlast", "Psychological Horror,Dark,Gore,Singleplayer,Fast-Paced", 6.5, 96, 18),
    ("This War of Mine", "Survival,Dark,Tragedy,Management,Singleplayer", 18.0, 94, 18),
    ("Papers, Please", "Simulation,Dark,Tragedy,Puzzle,Singleplayer,Short", 6.0, 96, 16),
    ("Rust", "Survival,Open World,PvP,Crafting,Competitive,Multiplayer", 300.0, 87, 18),
    ("Cyberpunk 2077", "RPG,Open World,Neon,Dark,Fast-Paced,Singleplayer", 60.0, 84, 18),
    ("Hades", "Roguelike,Fast-Paced,High-Reflex,Singleplayer,Action", 35.0, 98, 12),
    ("Cuphead", "Platformer,Fast-Paced,High-Reflex,Co-op,Singleplayer", 14.0, 96, 10),
    ("Rocket League", "Sports,Competitive,PvP,Fast-Paced,Multiplayer,High-Reflex", 150.0, 88, 7),
    ("Overcooked! 2", "Co-op,Fast-Paced,Comedy,Wholesome,Multiplayer,Short", 11.0, 91, 7),
    ("Terraria", "Sandbox,Crafting,Open World,Co-op,Singleplayer,Pixel Graphics", 90.0, 97, 12),
]

# Expand catalog with realistic variations so EDA & filtering have 250 rich rows
records = []
for idx in range(250):
    base = SEED_GAMES[idx % len(SEED_GAMES)]
    suffix = "" if idx < len(SEED_GAMES) else f" (Edition {idx // len(SEED_GAMES) + 1})"
    title = base[0] + suffix
    tags = base[1]
    playtime = round(max(1.0, base[2] * np.random.uniform(0.85, 1.15)), 1)
    rating = min(99, max(70, int(base[3] + np.random.randint(-2, 3))))
    age_rating = base[4]

    tag_set = set(t.strip() for t in tags.split(","))

    # --- 7 ENGINEERED WELL-BEING INDICES (Normalized 1.0 to 10.0) ---
    # 1. Visual Strain Score
    v_score = 4.5
    v_score += 2.5 * len(tag_set & {"Neon", "Fast-Paced", "Gore", "FPS", "Battle Royale"})
    v_score -= 1.8 * len(tag_set & {"Minimalist", "Cozy", "Relaxing", "Turn-Based", "Visual Novel"})
    visual_strain = round(np.clip(v_score + np.random.uniform(-0.4, 0.4), 1.0, 10.0), 2)

    # 2. Cognitive Load Score
    c_score = 4.5
    c_score += 2.2 * len(tag_set & {"Grand Strategy", "Complex", "Souls-like", "Detective", "MOBA"})
    c_score -= 1.8 * len(tag_set & {"Casual", "Relaxing", "Wholesome", "Cute"})
    cognitive_load = round(np.clip(c_score + np.random.uniform(-0.4, 0.4), 1.0, 10.0), 2)

    # 3. Session Commitment Score (Log-scaled from avg_playtime)
    session_commitment = round(np.clip(1.5 + np.log1p(playtime) * 1.45, 1.0, 10.0), 2)

    # 4. Social Interaction Pressure Score
    if "PvP" in tag_set or "Competitive" in tag_set:
        s_score = 8.8
    elif "Co-op" in tag_set:
        s_score = 3.5
    else:
        s_score = 1.5
    social_pressure = round(np.clip(s_score + np.random.uniform(-0.3, 0.3), 1.0, 10.0), 2)

    # 5. Emotional Heaviness Score
    e_score = 4.0
    e_score += 3.0 * len(tag_set & {"Psychological Horror", "Dark", "Tragedy", "Gore"})
    e_score -= 2.2 * len(tag_set & {"Wholesome", "Comedy", "Cute", "Relaxing"})
    emotional_heaviness = round(np.clip(e_score + np.random.uniform(-0.4, 0.4), 1.0, 10.0), 2)

    # 6. Motor / Reflex Intensity Score
    r_score = 4.0
    r_score += 2.8 * len(tag_set & {"High-Reflex", "Fast-Paced", "FPS", "Rhythm", "Action"})
    r_score -= 2.2 * len(tag_set & {"Turn-Based", "Visual Novel", "Puzzle", "Management"})
    reflex_intensity = round(np.clip(r_score + np.random.uniform(-0.4, 0.4), 1.0, 10.0), 2)

    # 7. Grind & Structure Complexity Score
    g_score = 4.5
    g_score += 2.3 * len(tag_set & {"Open World", "Survival", "Crafting", "Sandbox", "RPG"})
    g_score -= 2.0 * len(tag_set & {"Short", "Linear", "Puzzle", "Stage-Based"})
    grind_complexity = round(np.clip(g_score + np.random.uniform(-0.4, 0.4), 1.0, 10.0), 2)

    records.append({
        "game_id": idx + 1,
        "title": title,
        "tags": tags,
        "avg_playtime_hrs": playtime,
        "positive_rating_pct": rating,
        "min_age": age_rating,
        "visual_strain_score": visual_strain,
        "cognitive_load_score": cognitive_load,
        "session_commitment_score": session_commitment,
        "social_pressure_score": social_pressure,
        "emotional_heaviness_score": emotional_heaviness,
        "reflex_intensity_score": reflex_intensity,
        "grind_complexity_score": grind_complexity,
    })

games_df = pd.DataFrame(records)
games_df.to_csv("../data/games_catalog.csv", index=False)

# 2. Generate 500 Synthetic User Demographic & Wellness Profiles
n_users = 500
ages = np.random.randint(14, 56, size=n_users)
genders = np.random.choice(["Male", "Female", "Non-Binary"], size=n_users, p=[0.52, 0.44, 0.04])

employment = []
for age in ages:
    if age < 22:
        employment.append(np.random.choice(["Student", "Part-Time"], p=[0.85, 0.15]))
    elif age <= 50:
        employment.append(np.random.choice(["Full-Time Employed", "Freelancer", "Student", "Unemployed"], p=[0.62, 0.18, 0.10, 0.10]))
    else:
        employment.append(np.random.choice(["Full-Time Employed", "Retired", "Freelancer"], p=[0.45, 0.40, 0.15]))

# Realistic correlations: Full-time workers & older users report slightly higher eye strain
eye_strain_level = []
mental_state = []
for age, emp in zip(ages, employment):
    base_eye = 4.5 + (0.05 * (age - 20)) + (1.2 if emp == "Full-Time Employed" else 0.4)
    eye_strain_level.append(round(np.clip(np.random.normal(base_eye, 1.8), 1.0, 10.0), 1))

    if emp == "Student":
        state = np.random.choice(["Overthinking", "High Stress", "Relaxed", "Low Mood"], p=[0.35, 0.30, 0.20, 0.15])
    elif emp == "Full-Time Employed":
        state = np.random.choice(["High Stress", "Overthinking", "Relaxed", "Low Mood"], p=[0.40, 0.25, 0.20, 0.15])
    elif emp == "Unemployed":
        state = np.random.choice(["Low Mood", "Overthinking", "High Stress", "Relaxed"], p=[0.35, 0.35, 0.20, 0.10])
    else:
        state = np.random.choice(["Relaxed", "Overthinking", "High Stress", "Low Mood"], p=[0.45, 0.25, 0.15, 0.15])
    mental_state.append(state)

users_df = pd.DataFrame({
    "user_id": range(1, n_users + 1),
    "age": ages,
    "gender": genders,
    "employment_status": employment,
    "eye_strain_sensitivity": eye_strain_level,
    "primary_mental_state": mental_state,
    "daily_free_time_mins": [
        int(np.clip(np.random.normal(45 if e == "Full-Time Employed" else 95, 25), 20, 240))
        for e in employment
    ]
})

users_df.to_csv("../data/users_wellness.csv", index=False)
print("✅ Successfully generated data/games_catalog.csv (250 rows) and data/users_wellness.csv (500 rows)!")