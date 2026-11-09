import { useEffect, useState } from "react";
import { Activity, BarChart3, Brain, Eye, Gamepad2, ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import PlotlyChart from "./PlotlyChart";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const AXIS_LABELS = [
  "Visual Strain",
  "Cognitive Load",
  "Session Length",
  "Social Pressure",
  "Emotional Heaviness",
  "Reflex / APM",
  "Grind Complexity",
];

const FEATURE_KEYS = [
  "visual_strain_score",
  "cognitive_load_score",
  "session_commitment_score",
  "social_pressure_score",
  "emotional_heaviness_score",
  "reflex_intensity_score",
  "grind_complexity_score",
];

export default function App() {
  const [activeTab, setActiveTab] = useState("recommender");
  const [edaData, setEdaData] = useState(null);
  const [recData, setRecData] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState({
    age: 21,
    gender: "Male",
    employment_status: "Student",
    eye_strain_sensitivity: 7.5,
    primary_mental_state: "Overthinking",
    daily_free_time_mins: 60,
  });

  // Fetch EDA summary on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/eda-summary`)
      .then((res) => res.json())
      .then((data) => setEdaData(data))
      .catch((err) => console.error("EDA fetch failed:", err));
  }, []);

  // Fetch recommendations whenever profile is submitted
  const fetchRecommendations = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    })
      .then((res) => res.json())
      .then((data) => {
        setRecData(data);
        if (data.recommendations?.length > 0) {
          setSelectedGame(data.recommendations[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Recommend fetch failed:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  // Build Radar Chart Data for Selected Game vs User Comfort Ceiling
  const buildRadarData = () => {
    if (!recData || !selectedGame) return [];
    const userVals = FEATURE_KEYS.map((k) => recData.user_target_profile[k]);
    const gameVals = FEATURE_KEYS.map((k) => selectedGame.scores[k]);

    return [
      {
        type: "scatterpolar",
        r: [...userVals, userVals[0]],
        theta: [...AXIS_LABELS, AXIS_LABELS[0]],
        fill: "toself",
        name: "Your Comfort Ceiling",
        fillcolor: "rgba(56, 189, 248, 0.18)",
        line: { color: "#38bdf8", width: 2, dash: "dash" },
      },
      {
        type: "scatterpolar",
        r: [...gameVals, gameVals[0]],
        theta: [...AXIS_LABELS, AXIS_LABELS[0]],
        fill: "toself",
        name: selectedGame.title,
        fillcolor: "rgba(52, 211, 153, 0.28)",
        line: { color: "#34d399", width: 2.5 },
      },
    ];
  };

  const safeDailyMins =
    recData?.safe_daily_mins ??
    Math.min(
      profile.daily_free_time_mins,
      Math.max(25, Math.round(130 - profile.eye_strain_sensitivity * 9))
    );
  const breakIntervalMins =
    recData?.break_interval_mins ?? (profile.eye_strain_sensitivity >= 7 ? 20 : 40);

  return (
    <div style={styles.page}>
      {/* Top Navbar */}
      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={styles.logoBadge}>
            <Gamepad2 size={22} color="#38bdf8" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
              WellPlay DAV Analytics
            </h1>
            <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
              Constraint-Aware Multi-Factor Game Recommendation & Exploratory Dashboard
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={styles.tabGroup}>
          <button
            onClick={() => setActiveTab("recommender")}
            style={activeTab === "recommender" ? styles.tabActive : styles.tab}
          >
            <Sparkles size={15} /> Personal Recommender
          </button>
          <button
            onClick={() => setActiveTab("eda")}
            style={activeTab === "eda" ? styles.tabActive : styles.tab}
          >
            <BarChart3 size={15} /> Dataset EDA & Insights
          </button>
        </div>
      </header>

      {/* TAB 1: PERSONAL RECOMMENDER */}
      {activeTab === "recommender" && (
        <main style={styles.mainGrid}>
          {/* Left Column: Sticky Controls + Live Computed Comfort Thresholds */}
          <div style={styles.leftStickyCol}>
            <aside style={styles.card}>
              <h2 style={styles.cardTitle}>
                <UserCheck size={17} color="#38bdf8" /> User Wellness & Demographic Profile
              </h2>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Age: <strong>{profile.age} yrs</strong>
                </label>
                <input
                  type="range"
                  min="12"
                  max="65"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                  style={styles.slider}
                />
              </div>

              <div style={styles.row2}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Gender</label>
                  <select
                    value={profile.gender}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                    style={styles.select}
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Non-Binary</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Employment Status</label>
                  <select
                    value={profile.employment_status}
                    onChange={(e) => setProfile({ ...profile, employment_status: e.target.value })}
                    style={styles.select}
                  >
                    <option>Student</option>
                    <option>Full-Time Employed</option>
                    <option>Freelancer</option>
                    <option>Unemployed</option>
                    <option>Retired</option>
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Eye size={14} style={{ verticalAlign: "middle", marginRight: 5 }} />
                  Eye Strain Sensitivity: <strong>{profile.eye_strain_sensitivity} / 10</strong>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={profile.eye_strain_sensitivity}
                  onChange={(e) =>
                    setProfile({ ...profile, eye_strain_sensitivity: Number(e.target.value) })
                  }
                  style={styles.slider}
                />
                <div style={styles.hintRow}>
                  <span>1 (No Strain)</span>
                  <span>10 (Severe Fatigue)</span>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Brain size={14} style={{ verticalAlign: "middle", marginRight: 5 }} />
                  Current Psychological / Mental State
                </label>
                <select
                  value={profile.primary_mental_state}
                  onChange={(e) =>
                    setProfile({ ...profile, primary_mental_state: e.target.value })
                  }
                  style={styles.select}
                >
                  <option value="Overthinking">Overthinking / Racing Thoughts</option>
                  <option value="High Stress">High Stress / Burnout</option>
                  <option value="Low Mood">Low Mood / Depressive Symptoms</option>
                  <option value="Relaxed">Relaxed / Balanced</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Daily Free Gaming Window: <strong>{profile.daily_free_time_mins} mins</strong>
                </label>
                <input
                  type="range"
                  min="20"
                  max="240"
                  step="10"
                  value={profile.daily_free_time_mins}
                  onChange={(e) =>
                    setProfile({ ...profile, daily_free_time_mins: Number(e.target.value) })
                  }
                  style={styles.slider}
                />
              </div>

              <button onClick={fetchRecommendations} style={styles.primaryBtn}>
                {loading ? "Analyzing Constraints..." : "Run Multi-Factor Recommendation"}
              </button>
            </aside>

            {/* Live Tolerance Summary Card (Fills Left Space & Adds DAV Clarity) */}
            {recData?.user_target_profile && (
              <div style={styles.card}>
                <h3
                  style={{
                    margin: "0 0 12px",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#38bdf8",
                    letterSpacing: "0.02em",
                  }}
                >
                  Computed Max Comfort Thresholds
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "9px",
                    fontSize: "12px",
                  }}
                >
                  {FEATURE_KEYS.map((key, idx) => {
                    const val = recData.user_target_profile[key];
                    return (
                      <div key={key}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            color: "#cbd5e1",
                            marginBottom: "4px",
                          }}
                        >
                          <span>{AXIS_LABELS[idx]}</span>
                          <strong>{val} / 10</strong>
                        </div>
                        <div
                          style={{
                            height: "5px",
                            background: "#0f172a",
                            borderRadius: "999px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${val * 10}%`,
                              height: "100%",
                              background: val <= 4 ? "#34d399" : "#38bdf8",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: HERO TOP PICK + TOP 6 RECOMMENDATIONS SHELF + RADAR DEEP-DIVE */}
          <section style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* 1. HERO SPOTLIGHT: #1 RECOMMENDED GAME */}
            {recData?.recommendations?.length > 0 && (
              <div style={styles.heroSpotlight}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div>
                    <span style={styles.heroEyebrow}>
                      ★ #1 TOP WELLNESS RECOMMENDATION FOR YOU
                    </span>
                    <h2 style={styles.heroTitle}>{recData.recommendations[0].title}</h2>
                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#cbd5e1" }}>
                      {recData.recommendations[0].tags.split(",").join("  •  ")}
                    </p>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={styles.heroMatchBadge}>
                      {recData.recommendations[0].match_score}% Match
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#34d399",
                        marginTop: "6px",
                        fontWeight: 600,
                      }}
                    >
                      Play up to {safeDailyMins} mins/day • Break every {breakIntervalMins}m
                    </div>
                  </div>
                </div>

                {/* Quick Highlight Pills */}
                <div style={styles.heroPillRow}>
                  <span style={styles.heroStatPill}>
                    👁️ Eye Strain:{" "}
                    <strong>{recData.recommendations[0].scores.visual_strain_score}/10</strong>
                  </span>
                  <span style={styles.heroStatPill}>
                    🧠 Cognitive Load:{" "}
                    <strong>{recData.recommendations[0].scores.cognitive_load_score}/10</strong>
                  </span>
                  <span style={styles.heroStatPill}>
                    ⭐ Steam Rating:{" "}
                    <strong>{recData.recommendations[0].positive_rating_pct}% Positive</strong>
                  </span>
                  <span style={styles.heroStatPill}>
                    ⏱️ Total Length:{" "}
                    <strong>{recData.recommendations[0].avg_playtime_hrs} hrs</strong>
                  </span>
                </div>
              </div>
            )}

            {/* 2. ALL 6 RECOMMENDED GAMES SHELF (2x3 Grid) */}
            <div style={styles.card}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "14px",
                }}
              >
                <h2 style={styles.cardTitle}>
                  <Gamepad2 size={18} color="#38bdf8" /> Top 6 Recommended Games (Click Any to
                  Inspect Radar)
                </h2>
              </div>

              <div style={styles.gamesGrid}>
                {recData?.recommendations?.map((game, index) => {
                  const isSelected = selectedGame?.game_id === game.game_id;
                  return (
                    <div
                      key={game.game_id}
                      onClick={() => setSelectedGame(game)}
                      style={{
                        ...styles.gameCard,
                        borderColor: isSelected ? "#34d399" : "#334155",
                        background: isSelected
                          ? "linear-gradient(145deg, rgba(16,185,129,0.16), rgba(56,189,248,0.08))"
                          : "#0f172a",
                        boxShadow: isSelected ? "0 0 0 1px #34d399" : "none",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "6px",
                        }}
                      >
                        <span style={index === 0 ? styles.rankBadgeTop : styles.rankBadge}>
                          #{index + 1} PICK
                        </span>
                        <span style={styles.scoreTag}>{game.match_score}% Match</span>
                      </div>

                      <h3
                        style={{
                          margin: "4px 0",
                          fontSize: "16px",
                          fontWeight: 700,
                          color: "#ffffff",
                        }}
                      >
                        {game.title}
                      </h3>

                      <p style={{ margin: "0 0 12px", fontSize: "11px", color: "#94a3b8" }}>
                        {game.tags.split(",").slice(0, 3).join(" • ")}
                      </p>

                      <div style={styles.miniMetrics}>
                        <span>
                          Eye:{" "}
                          <strong style={{ color: "#38bdf8" }}>
                            {game.scores.visual_strain_score}
                          </strong>
                        </span>
                        <span>
                          Mental:{" "}
                          <strong style={{ color: "#34d399" }}>
                            {game.scores.cognitive_load_score}
                          </strong>
                        </span>
                        <span>{game.avg_playtime_hrs}h</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. DEEP-DIVE RADAR EXPLAINABILITY FOR SELECTED GAME */}
            {selectedGame && recData && (
              <div style={styles.card}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <div>
                    <h2 style={styles.cardTitle}>
                      <ShieldCheck size={18} color="#34d399" /> Analytical Breakdown: Why "
                      {selectedGame.title}" Was Recommended
                    </h2>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                      7-axis constraint comparison between your comfort ceiling (blue dashed) and
                      game intensity (green).
                    </p>
                  </div>
                  <span style={styles.matchPill}>{selectedGame.match_score}% Wellness Match</span>
                </div>

                <div style={styles.radarSplit}>
                  <PlotlyChart
                    data={buildRadarData()}
                    style={{ width: "100%", height: "340px" }}
                    layout={{
                      margin: { t: 35, r: 75, b: 35, l: 75 },
                      polar: {
                        bgcolor: "rgba(15,23,42,0.5)",
                        radialaxis: {
                          visible: true,
                          range: [0, 10],
                          gridcolor: "#334155",
                          tickfont: { size: 9 },
                        },
                        angularaxis: { gridcolor: "#334155", tickfont: { size: 10 } },
                      },
                      legend: { orientation: "h", y: -0.15 },
                    }}
                  />

                  <div style={styles.explainBox}>
                    <h4 style={{ margin: "0 0 10px", fontSize: "14px", color: "#38bdf8" }}>
                      Key Wellness Match Factors
                    </h4>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: "18px",
                        fontSize: "13px",
                        lineHeight: 1.7,
                        color: "#e2e8f0",
                      }}
                    >
                      {selectedGame.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                    <div
                      style={{
                        marginTop: "14px",
                        paddingTop: "12px",
                        borderTop: "1px solid #334155",
                        fontSize: "12px",
                        color: "#94a3b8",
                      }}
                    >
                      <div>
                        <strong>Recommended Daily Cap:</strong> {safeDailyMins} mins/day
                      </div>
                      <div>
                        <strong>Total Campaign Length:</strong> {selectedGame.avg_playtime_hrs} hrs
                      </div>
                      <div>
                        <strong>All Tags:</strong> {selectedGame.tags}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </main>
      )}

      {/* TAB 2: EXPLORATORY DATA ANALYSIS (EDA) */}
      {activeTab === "eda" && edaData && (
        <main style={{ maxWidth: "1320px", margin: "24px auto", padding: "0 20px" }}>
          {/* KPI Strip */}
          <div style={styles.kpiGrid}>
            <div style={styles.kpiCard}>
              <span style={styles.kpiLabel}>Engineered Game Catalog</span>
              <strong style={styles.kpiVal}>{edaData.kpis.total_games} Titles</strong>
            </div>
            <div style={styles.kpiCard}>
              <span style={styles.kpiLabel}>Synthetic User Cohort</span>
              <strong style={styles.kpiVal}>{edaData.kpis.total_users} Profiles</strong>
            </div>
            <div style={styles.kpiCard}>
              <span style={styles.kpiLabel}>Mean User Eye Strain</span>
              <strong style={styles.kpiVal}>{edaData.kpis.avg_user_eye_strain} / 10</strong>
            </div>
            <div style={styles.kpiCard}>
              <span style={styles.kpiLabel}>Stress / Overthinking Cohort</span>
              <strong style={styles.kpiVal}>{edaData.kpis.high_stress_user_pct}%</strong>
            </div>
          </div>

          {/* Charts Grid */}
          <div style={styles.edaGrid}>
            {/* Chart 1: 7-Factor Correlation Heatmap */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                <Activity size={16} color="#38bdf8" /> Multi-Factor Feature Correlation Heatmap
              </h3>
              <PlotlyChart
                style={{ width: "100%", height: "380px" }}
                data={[
                  {
                    z: edaData.correlation_matrix.z,
                    x: edaData.correlation_matrix.labels,
                    y: edaData.correlation_matrix.labels,
                    type: "heatmap",
                    colorscale: "Tealrose",
                    zmin: -1,
                    zmax: 1,
                  },
                ]}
                layout={{ margin: { t: 20, r: 20, b: 110, l: 145 } }}
              />
            </div>

            {/* Chart 2: Visual Strain vs Cognitive Load Scatter */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                Visual Strain vs. Cognitive Load (Bubble = Emotional Heaviness)
              </h3>
              <PlotlyChart
                style={{ width: "100%", height: "380px" }}
                data={[
                  {
                    x: edaData.scatter_games.map((g) => g.visual_strain_score),
                    y: edaData.scatter_games.map((g) => g.cognitive_load_score),
                    text: edaData.scatter_games.map(
                      (g) =>
                        `${g.title}<br>Emotional Heaviness: ${g.emotional_heaviness_score}`
                    ),
                    mode: "markers",
                    type: "scatter",
                    marker: {
                      size: edaData.scatter_games.map((g) => g.emotional_heaviness_score * 2.4 + 6),
                      color: edaData.scatter_games.map((g) => g.positive_rating_pct),
                      colorscale: "Viridis",
                      showscale: true,
                      colorbar: { title: "Rating %" },
                    },
                  },
                ]}
                layout={{
                  xaxis: { title: "Visual Strain Score (1-10)", gridcolor: "#334155" },
                  yaxis: { title: "Cognitive Load Score (1-10)", gridcolor: "#334155" },
                }}
              />
            </div>

            {/* Chart 3: Employment Status vs Eye Strain & Free Time */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                Demographic Analysis: Eye Strain & Daily Free Time by Employment
              </h3>
              <PlotlyChart
                style={{ width: "100%", height: "360px" }}
                data={[
                  {
                    x: edaData.employment_stats.map((e) => e.employment_status),
                    y: edaData.employment_stats.map((e) => e.avg_eye_strain),
                    name: "Avg Eye Strain (1-10)",
                    type: "bar",
                    marker: { color: "#38bdf8" },
                  },
                  {
                    x: edaData.employment_stats.map((e) => e.employment_status),
                    y: edaData.employment_stats.map((e) => +(e.avg_free_time / 10).toFixed(2)),
                    name: "Daily Free Time (x10 mins)",
                    type: "bar",
                    marker: { color: "#34d399" },
                  },
                ]}
                layout={{ barmode: "group", yaxis: { gridcolor: "#334155" } }}
              />
            </div>

            {/* Chart 4: Mental State Distribution Across Employment Groups */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                Psychological State Distribution Across Employment Cohorts
              </h3>
              <PlotlyChart
                style={{ width: "100%", height: "360px" }}
                data={["Overthinking", "High Stress", "Low Mood", "Relaxed"].map((state, idx) => ({
                  x: edaData.mental_state_distribution.map((row) => row.employment_status),
                  y: edaData.mental_state_distribution.map((row) => row[state] || 0),
                  name: state,
                  type: "bar",
                  marker: { color: ["#f59e0b", "#ef4444", "#8b5cf6", "#10b981"][idx] },
                }))}
                layout={{
                  barmode: "stack",
                  yaxis: { title: "User Count", gridcolor: "#334155" },
                }}
              />
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#0f172a", color: "#f8fafc", paddingBottom: "40px" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    padding: "16px 28px",
    background: "#1e293b",
    borderBottom: "1px solid #334155",
  },
  logoBadge: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "rgba(56, 189, 248, 0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  tabGroup: { display: "flex", gap: "8px" },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 14px",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "transparent",
    color: "#cbd5e1",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
  },
  tabActive: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 14px",
    borderRadius: "8px",
    border: "1px solid #38bdf8",
    background: "rgba(56, 189, 248, 0.15)",
    color: "#38bdf8",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  },
  mainGrid: {
    maxWidth: "1320px",
    margin: "24px auto",
    padding: "0 20px",
    display: "grid",
    gridTemplateColumns: "340px 1fr",
    gap: "20px",
    alignItems: "start",
  },
  leftStickyCol: {
    position: "sticky",
    top: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  card: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "12px",
    padding: "20px",
  },
  cardTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  formGroup: { marginTop: "14px" },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  label: { display: "block", fontSize: "12px", color: "#cbd5e1", marginBottom: "6px" },
  select: {
    width: "100%",
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1px solid #475569",
    background: "#0f172a",
    color: "#f8fafc",
    fontSize: "13px",
  },
  slider: { width: "100%", accentColor: "#38bdf8", cursor: "pointer" },
  hintRow: { display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#64748b" },
  primaryBtn: {
    width: "100%",
    marginTop: "18px",
    padding: "11px",
    borderRadius: "8px",
    border: "none",
    background: "#38bdf8",
    color: "#0f172a",
    fontWeight: 700,
    fontSize: "13px",
    cursor: "pointer",
  },
  heroSpotlight: {
    background: "linear-gradient(135deg, #0f2942 0%, #133b3a 100%)",
    border: "1.5px solid #34d399",
    borderRadius: "14px",
    padding: "22px 24px",
    boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.15)",
  },
  heroEyebrow: {
    display: "inline-block",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "#34d399",
    marginBottom: "6px",
  },
  heroTitle: {
    margin: 0,
    fontSize: "26px",
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: "-0.02em",
  },
  heroMatchBadge: {
    display: "inline-block",
    padding: "6px 14px",
    borderRadius: "999px",
    background: "#34d399",
    color: "#0f172a",
    fontWeight: 800,
    fontSize: "15px",
  },
  heroPillRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "16px",
    paddingTop: "14px",
    borderTop: "1px solid rgba(255, 255, 255, 0.12)",
  },
  heroStatPill: {
    background: "rgba(15, 23, 42, 0.65)",
    border: "1px solid rgba(148, 163, 184, 0.25)",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    color: "#e2e8f0",
  },
  rankBadgeTop: {
    background: "#34d399",
    color: "#0f172a",
    fontSize: "10px",
    fontWeight: 800,
    padding: "2px 8px",
    borderRadius: "5px",
  },
  rankBadge: {
    background: "#334155",
    color: "#e2e8f0",
    fontSize: "10px",
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: "5px",
  },
  matchPill: {
    padding: "5px 12px",
    borderRadius: "999px",
    background: "rgba(52, 211, 153, 0.15)",
    color: "#34d399",
    fontWeight: 700,
    fontSize: "13px",
  },
  radarSplit: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr",
    gap: "16px",
    alignItems: "center",
    marginTop: "10px",
  },
  explainBox: {
    background: "#0f172a",
    padding: "16px",
    borderRadius: "10px",
    border: "1px solid #334155",
  },
  gamesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
  },
  gameCard: {
    padding: "14px",
    borderRadius: "10px",
    border: "1.5px solid #1e293b",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  scoreTag: {
    background: "rgba(56, 189, 248, 0.15)",
    color: "#38bdf8",
    padding: "2px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 700,
  },
  miniMetrics: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "11px",
    color: "#cbd5e1",
    borderTop: "1px solid #334155",
    paddingTop: "8px",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "14px",
    marginBottom: "20px",
  },
  kpiCard: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "10px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  kpiLabel: { fontSize: "12px", color: "#94a3b8" },
  kpiVal: { fontSize: "22px", color: "#38bdf8" },
  edaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(520px, 1fr))",
    gap: "18px",
  },
};