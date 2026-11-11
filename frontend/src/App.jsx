import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  Download,
  Eye,
  FlaskConical,
  Gamepad2,
  GitCompare,
  MonitorSmartphone,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Zap,
} from "lucide-react";
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

const CLUSTER_COLORS = ["#38bdf8", "#34d399", "#a855f7", "#f59e0b"];

const DEMO_PERSONAS = [
  {
    id: "burnout",
    label: "Burnout Student",
    profile: {
      age: 21,
      gender: "Male",
      employment_status: "Student",
      eye_strain_sensitivity: 8.0,
      primary_mental_state: "Overthinking",
      daily_free_time_mins: 60,
      preferred_platform: "Any",
      recommendation_mode: "Relaxation",
    },
  },
  {
    id: "mobile",
    label: "Cozy Mobile Break",
    profile: {
      age: 26,
      gender: "Female",
      employment_status: "Full-Time Employed",
      eye_strain_sensitivity: 6.5,
      primary_mental_state: "High Stress",
      daily_free_time_mins: 40,
      preferred_platform: "Mobile",
      recommendation_mode: "Casual",
    },
  },
  {
    id: "hardcore",
    label: "Weekend Hardcore",
    profile: {
      age: 22,
      gender: "Male",
      employment_status: "Student",
      eye_strain_sensitivity: 2.5,
      primary_mental_state: "Relaxed",
      daily_free_time_mins: 180,
      preferred_platform: "PC",
      recommendation_mode: "High Energy",
    },
  },
];

const DATA_DICTIONARY = [
  {
    field: "visual_strain_score",
    scale: "1.0 – 10.0",
    definition:
      "Measures camera motion speed, particle density, and screen-flash fatigue (includes +0.6 mobile screen modifier).",
  },
  {
    field: "cognitive_load_score",
    scale: "1.0 – 10.0",
    definition:
      "Quantifies strategic planning, multi-tasking, and working-memory overhead required during gameplay.",
  },
  {
    field: "session_commitment_score",
    scale: "1.0 – 10.0",
    definition:
      "Log-scaled (np.log1p) function of average completion hours and save-point flexibility.",
  },
  {
    field: "social_pressure_score",
    scale: "1.0 – 10.0",
    definition:
      "Captures competitive PvP stress, team dependency, and real-time communication pressure.",
  },
  {
    field: "emotional_heaviness_score",
    scale: "1.0 – 10.0",
    definition:
      "Evaluates bleak narrative themes, psychological horror, or high-tension emotional stakes.",
  },
  {
    field: "reflex_intensity_score",
    scale: "1.0 – 10.0",
    definition:
      "Measures Actions-Per-Minute (APM), twitch reaction windows, and precision timing demands.",
  },
  {
    field: "grind_complexity_score",
    scale: "1.0 – 10.0",
    definition:
      "Captures repetitive resource farming, complex skill trees, and micro-management loops.",
  },
];

const getPlatformBadgeStyle = (platform) => {
  if (platform === "Mobile") {
    return {
      background: "rgba(168, 85, 247, 0.16)",
      color: "#c084fc",
      border: "1px solid rgba(168, 85, 247, 0.4)",
    };
  }
  if (platform === "PC & Mobile") {
    return {
      background: "rgba(52, 211, 153, 0.15)",
      color: "#34d399",
      border: "1px solid rgba(52, 211, 153, 0.4)",
    };
  }
  return {
    background: "rgba(56, 189, 248, 0.15)",
    color: "#38bdf8",
    border: "1px solid rgba(56, 189, 248, 0.4)",
  };
};

export default function App() {
  const [activeTab, setActiveTab] = useState("recommender");
  const [edaData, setEdaData] = useState(null);
  const [advData, setAdvData] = useState(null);
  const [recData, setRecData] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [catalogGames, setCatalogGames] = useState([]);
  const [compareIds, setCompareIds] = useState([]);
  const [comparePlatformFilter, setComparePlatformFilter] = useState("Any");
  const [activePersona, setActivePersona] = useState("");
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState({
    age: 21,
    gender: "Male",
    employment_status: "Student",
    eye_strain_sensitivity: 7.5,
    primary_mental_state: "Overthinking",
    daily_free_time_mins: 60,
    preferred_platform: "Any",
    recommendation_mode: "Balanced",
  });

  // Fetch EDA summary, catalog games, and Phase 3 advanced analytics on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/eda-summary`)
      .then((res) => res.json())
      .then((data) => setEdaData(data))
      .catch((err) => console.error("EDA fetch failed:", err));

    fetch(`${API_BASE}/api/games`)
      .then((res) => res.json())
      .then((data) => {
        const list = data.games || [];
        setCatalogGames(list);
        if (list.length >= 2) {
          setCompareIds([list[0].game_id, list[1].game_id]);
        }
      })
      .catch((err) => console.error("Catalog fetch failed:", err));

    fetch(`${API_BASE}/api/advanced-analytics`)
      .then((res) => res.json())
      .then((data) => setAdvData(data))
      .catch((err) => console.error("Advanced analytics fetch failed:", err));
  }, []);

  // Fetch recommendations with explicit profile override support
  const fetchRecommendations = (targetProfile = profile) => {
    setLoading(true);
    fetch(`${API_BASE}/api/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(targetProfile),
    })
      .then((res) => res.json())
      .then((data) => {
        setRecData(data);
        if (data.recommendations?.length > 0) {
          setSelectedGame(data.recommendations[0]);
        } else {
          setSelectedGame(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Recommend fetch failed:", err);
        setLoading(false);
      });
  };

  // Auto-refresh on mount and whenever Platform or Algorithm Mode changes
  useEffect(() => {
  if (recData) {
    fetchRecommendations(profile);
  }
}, [profile.preferred_platform, profile.recommendation_mode]);

  const applyDemoPersona = (persona) => {
    setActivePersona(persona.id);
    setProfile(persona.profile);
    fetchRecommendations(persona.profile);
  };

  const sendToCompare = (gameId, e) => {
    e.stopPropagation();
    setComparePlatformFilter("Any");
    setCompareIds((prev) => {
      if (prev.includes(gameId)) return prev;
      if (prev.length >= 3) return [prev[1], prev[2], gameId];
      return [...prev, gameId];
    });
    setActiveTab("compare");
  };

  // Export Personalized Recommendations as CSV
  const exportRecommendationsCSV = () => {
    if (!recData?.recommendations?.length) return;
    const headers = [
      "Rank",
      "Title",
      "Platform",
      "Match Score (%)",
      "Match Category",
      "Avg Playtime (hrs)",
      ...AXIS_LABELS,
    ];
    const rows = recData.recommendations.map((g, idx) => [
      idx + 1,
      `"${g.title.replace(/"/g, '""')}"`,
      g.platform,
      g.match_score,
      `"${g.match_category}"`,
      g.avg_playtime_hrs,
      ...FEATURE_KEYS.map((k) => g.scores[k]),
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `WellPlay_Recommendations_${profile.recommendation_mode.replace(/\s+/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
        fillcolor: "rgba(56, 189, 248, 0.16)",
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

  const filteredCatalog = catalogGames.filter((g) => {
    if (comparePlatformFilter === "Any") return true;
    if (comparePlatformFilter === "Mobile")
      return g.platform === "Mobile" || g.platform === "PC & Mobile";
    return g.platform === "PC" || g.platform === "PC & Mobile";
  });

  return (
    <div style={styles.page}>
      {/* Lightweight Responsive & Micro-Interaction Styles */}
      <style>{`
        .wp-game-card {
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }
        .wp-game-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 22px -6px rgba(2, 6, 23, 0.75);
        }
        .wp-btn-hover {
          transition: filter 0.15s ease, transform 0.12s ease;
        }
        .wp-btn-hover:hover {
          filter: brightness(1.08);
          transform: translateY(-1px);
        }
        @media (max-width: 1024px) {
          .wp-main-grid {
            grid-template-columns: 1fr !important;
          }
          .wp-sticky-col {
            position: static !important;
          }
          .wp-radar-split {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 768px) {
          .wp-games-grid {
            grid-template-columns: 1fr !important;
          }
          .wp-eda-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Top Navbar */}
      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={styles.logoBadge}>
            <Gamepad2 size={22} color="#38bdf8" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 700, letterSpacing: "-0.01em" }}>
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
            onClick={() => setActiveTab("compare")}
            style={activeTab === "compare" ? styles.tabActive : styles.tab}
          >
            <GitCompare size={15} /> Compare Games
          </button>
          <button
            onClick={() => setActiveTab("eda")}
            style={activeTab === "eda" ? styles.tabActive : styles.tab}
          >
            <BarChart3 size={15} /> Dataset EDA & Insights
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            style={activeTab === "stats" ? styles.tabActive : styles.tab}
          >
            <FlaskConical size={15} /> Statistical & ML Insights
          </button>
          <button
            onClick={() => setActiveTab("about")}
            style={activeTab === "about" ? styles.tabActive : styles.tab}
          >
            <BookOpen size={15} /> Methodology & Docs
          </button>
        </div>
      </header>

      {/* TAB 1: PERSONAL RECOMMENDER */}
      {activeTab === "recommender" && (
        <main className="wp-main-grid" style={styles.mainGrid}>
          {/* Left Column: Sticky Controls + Quick Demo Personas + Live Comfort Thresholds */}
          <div className="wp-sticky-col" style={styles.leftStickyCol}>
            <aside style={styles.card}>
              <h2 style={styles.cardTitle}>
                <UserCheck size={17} color="#38bdf8" /> User Wellness & Demographic Profile
              </h2>

              {/* Quick Demo Preset Personas */}
              <div style={{ marginTop: "12px" }}>
                <span style={{ display: "block", fontSize: "11px", color: "#94a3b8", marginBottom: "6px" }}>
                  <Zap size={11} style={{ verticalAlign: "middle", marginRight: 4, color: "#f59e0b" }} />
                  Quick Demo Personas:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {DEMO_PERSONAS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => applyDemoPersona(p)}
                      style={
                        activePersona === p.id ? styles.personaChipActive : styles.personaChip
                      }
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Age: <strong>{profile.age} yrs</strong>
                </label>
                <input
                  type="range"
                  min="12"
                  max="65"
                  value={profile.age}
                  onChange={(e) => {
                    setActivePersona("");
                    setProfile({ ...profile, age: Number(e.target.value) });
                  }}
                  style={styles.slider}
                />
              </div>

              <div style={styles.row2}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Gender</label>
                  <select
                    value={profile.gender}
                    onChange={(e) => {
                      setActivePersona("");
                      setProfile({ ...profile, gender: e.target.value });
                    }}
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
                    onChange={(e) => {
                      setActivePersona("");
                      setProfile({ ...profile, employment_status: e.target.value });
                    }}
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

              {/* Platform Selector */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <MonitorSmartphone size={14} style={{ verticalAlign: "middle", marginRight: 5 }} />
                  Preferred Device / Platform
                </label>
                <select
                  value={profile.preferred_platform}
                  onChange={(e) => {
                    setActivePersona("");
                    setProfile({ ...profile, preferred_platform: e.target.value });
                  }}
                  style={styles.select}
                >
                  <option value="Any">Any Device (PC & Mobile)</option>
                  <option value="PC">PC / Desktop Only</option>
                  <option value="Mobile">Mobile (iOS / Android) Only</option>
                </select>
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
                  onChange={(e) => {
                    setActivePersona("");
                    setProfile({ ...profile, eye_strain_sensitivity: Number(e.target.value) });
                  }}
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
                  onChange={(e) => {
                    setActivePersona("");
                    setProfile({ ...profile, primary_mental_state: e.target.value });
                  }}
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
                  onChange={(e) => {
                    setActivePersona("");
                    setProfile({ ...profile, daily_free_time_mins: Number(e.target.value) });
                  }}
                  style={styles.slider}
                />
              </div>

              {/* Recommendation Modes */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Settings2 size={14} style={{ verticalAlign: "middle", marginRight: 5 }} />
                  Algorithm Mode (What-If Weighting)
                </label>
                <select
                  value={profile.recommendation_mode}
                  onChange={(e) => {
                    setActivePersona("");
                    setProfile({ ...profile, recommendation_mode: e.target.value });
                  }}
                  style={{
                    ...styles.select,
                    borderColor: "#38bdf8",
                    color: "#38bdf8",
                    fontWeight: "bold",
                  }}
                >
                  <option value="Balanced">Balanced (Default)</option>
                  <option value="Relaxation">Relaxation Mode</option>
                  <option value="High Energy">High Energy Mode</option>
                  <option value="Casual">Casual Mode</option>
                  <option value="Social">Social Mode</option>
                </select>
              </div>

              <button
                className="wp-btn-hover"
                onClick={() => fetchRecommendations(profile)}
                style={styles.primaryBtn}
              >
                {loading ? "Analyzing Constraints..." : "Run Multi-Factor Recommendation"}
              </button>
            </aside>

            {/* Live Tolerance Summary Card */}
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
                              width: `${(val / 10) * 100}%`,
                              height: "100%",
                              background: val <= 4 ? "#34d399" : "#38bdf8",
                              transition: "width 0.3s ease",
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
            {!recData && !loading && (
              <div
                style={{
                  ...styles.card,
                  textAlign: "center",
                  padding: "64px 28px",
                  border: "1.5px dashed #334155",
                }}
              >
                <Sparkles size={34} color="#38bdf8" style={{ marginBottom: "12px" }} />
                <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 700, color: "#f8fafc" }}>
                  Ready to Analyze Your Wellness Profile
                </h2>
                <p style={{ margin: "0 auto", maxWidth: "460px", fontSize: "13px", color: "#94a3b8", lineHeight: 1.6 }}>
                  Adjust your age, platform preference, eye-strain sensitivity, mental state, and daily free time on the left—or pick a <strong>Quick Demo Persona</strong>—then click <strong>Run Multi-Factor Recommendation</strong>.
                </p>
              </div>
            )}

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
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span style={styles.heroEyebrow}>
                        ★ #1 RECOMMENDED • {recData.recommendations[0].match_category.toUpperCase()}
                      </span>
                      <span
                        style={{
                          ...styles.platformPill,
                          ...getPlatformBadgeStyle(recData.recommendations[0].platform),
                        }}
                      >
                        {recData.recommendations[0].platform}
                      </span>
                    </div>
                    <h2 style={styles.heroTitle}>{recData.recommendations[0].title}</h2>
                    <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#cbd5e1" }}>
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

            {/* 2. TOP 6 RECOMMENDED GAMES SHELF + CSV EXPORT */}
            <div style={styles.card}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                  marginBottom: "14px",
                }}
              >
                <h2 style={styles.cardTitle}>
                  <Gamepad2 size={18} color="#38bdf8" /> Top Recommended Games (Click to Inspect)
                </h2>
                {recData?.recommendations?.length > 0 && (
                  <button
                    className="wp-btn-hover"
                    onClick={exportRecommendationsCSV}
                    style={styles.exportBtn}
                  >
                    <Download size={14} /> Export CSV Report
                  </button>
                )}
              </div>

              <div className="wp-games-grid" style={styles.gamesGrid}>
                {recData?.recommendations?.slice(0, 6).map((game, index) => {
                  const isSelected = selectedGame?.game_id === game.game_id;
                  return (
                    <div
                      key={game.game_id}
                      className="wp-game-card"
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
                          marginBottom: "8px",
                        }}
                      >
                        <span style={index === 0 ? styles.rankBadgeTop : styles.rankBadge}>
                          #{index + 1} PICK
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{
                              ...styles.platformPill,
                              ...getPlatformBadgeStyle(game.platform),
                            }}
                          >
                            {game.platform}
                          </span>
                          <span style={styles.scoreTag}>{game.match_score}%</span>
                        </div>
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

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "10px",
                        }}
                      >
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                          {game.match_category}
                        </span>
                        <button
                          onClick={(e) => sendToCompare(game.game_id, e)}
                          style={styles.miniCompareBtn}
                          title="Add to Compare Games tab"
                        >
                          + Compare
                        </button>
                      </div>

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

            {/* 3. DEEP-DIVE RADAR & VISUAL PENALTY BREAKDOWN */}
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
                      <ShieldCheck size={18} color="#34d399" /> Explainable Penalty Breakdown: "
                      {selectedGame.title}"
                    </h2>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                      Visual comparison of game demand vs. your comfort ceiling (Model score
                      reflects constraint alignment, not objective game quality).
                    </p>
                  </div>
                  <span style={styles.matchPill}>{selectedGame.match_category}</span>
                </div>

                <div className="wp-radar-split" style={styles.radarSplit}>
                  <PlotlyChart
                    data={buildRadarData()}
                    style={{ width: "100%", height: "355px" }}
                    layout={{
                      margin: { t: 35, r: 85, b: 35, l: 95 },
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
                    <h4 style={{ margin: "0 0 12px", fontSize: "14px", color: "#38bdf8" }}>
                      Dimension-by-Dimension Comfort Gauge
                    </h4>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        fontSize: "12px",
                      }}
                    >
                      {FEATURE_KEYS.map((key, idx) => {
                        const breakdown = selectedGame.match_breakdown[key];
                        const isExceeding = breakdown.status === "Exceeds Limit";
                        return (
                          <div key={key}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "3px",
                              }}
                            >
                              <span style={{ color: "#cbd5e1" }}>{AXIS_LABELS[idx]}</span>
                              <span
                                style={{
                                  color: isExceeding ? "#f87171" : "#34d399",
                                  fontWeight: 600,
                                  fontSize: "11px",
                                }}
                              >
                                {breakdown.game_value} / {breakdown.user_ceiling} ceiling{" "}
                                {isExceeding ? "(Penalty)" : "✓"}
                              </span>
                            </div>
                            {/* Visual Bar with Ceiling Marker */}
                            <div
                              style={{
                                position: "relative",
                                height: "6px",
                                background: "#1e293b",
                                borderRadius: "999px",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${(breakdown.game_value / 10) * 100}%`,
                                  height: "100%",
                                  background: isExceeding ? "#ef4444" : "#34d399",
                                  borderRadius: "999px",
                                }}
                              />
                              <div
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  bottom: 0,
                                  left: `${(breakdown.user_ceiling / 10) * 100}%`,
                                  width: "2px",
                                  background: "#38bdf8",
                                }}
                                title={`Comfort Ceiling: ${breakdown.user_ceiling}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div
                      style={{
                        marginTop: "14px",
                        paddingTop: "12px",
                        borderTop: "1px solid #334155",
                        fontSize: "12px",
                        color: "#94a3b8",
                      }}
                    >
                      <h4 style={{ margin: "0 0 6px", fontSize: "13px", color: "#e2e8f0" }}>
                        Plain-Language Insight:
                      </h4>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: "16px",
                          color: "#cbd5e1",
                          lineHeight: 1.6,
                        }}
                      >
                        {selectedGame.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </main>
      )}

      {/* TAB 2: SIDE-BY-SIDE 7-DIMENSIONAL GAME COMPARISON */}
      {activeTab === "compare" && (
        <main
          style={{
            maxWidth: "1320px",
            margin: "24px auto",
            padding: "0 20px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div style={styles.card}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div>
                <h2 style={styles.cardTitle}>
                  <GitCompare size={18} color="#38bdf8" /> Side-by-Side 7-Dimensional Game Comparison
                  (Select 2–3 Games)
                </h2>
                <p style={{ margin: "6px 0 14px", fontSize: "12px", color: "#94a3b8" }}>
                  Compare structural cognitive, visual, and emotional load across titles on a
                  unified 1–10 scale.
                </p>
              </div>

              {/* Platform Filter Pills for Dropdown Lists */}
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>Filter Catalog:</span>
                {["Any", "PC", "Mobile"].map((plat) => (
                  <button
                    key={plat}
                    onClick={() => setComparePlatformFilter(plat)}
                    style={
                      comparePlatformFilter === plat
                        ? styles.personaChipActive
                        : styles.personaChip
                    }
                  >
                    {plat}
                  </button>
                ))}
              </div>
            </div>

            {/* 3 Game Selectors */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "12px",
              }}
            >
              {[0, 1, 2].map((slotIdx) => (
                <div key={slotIdx}>
                  <label style={styles.label}>
                    Game Slot {slotIdx + 1} {slotIdx === 2 ? "(Optional)" : ""}
                  </label>
                  <select
                    value={compareIds[slotIdx] || ""}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      const next = [...compareIds];
                      if (val === null) {
                        next.splice(slotIdx, 1);
                      } else {
                        next[slotIdx] = val;
                      }
                      setCompareIds(next.filter(Boolean));
                    }}
                    style={styles.select}
                  >
                    {slotIdx === 2 && <option value="">-- None --</option>}
                    {filteredCatalog.map((g) => (
                      <option key={g.game_id} value={g.game_id}>
                        {g.title} ({g.platform})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Shared Radar + Side-by-Side Difference Matrix */}
          {compareIds.length >= 2 &&
            (() => {
              const compared = compareIds
                .map((id) => catalogGames.find((g) => g.game_id === id))
                .filter(Boolean);
              const palette = [
                { line: "#38bdf8", fill: "rgba(56, 189, 248, 0.20)" },
                { line: "#34d399", fill: "rgba(52, 211, 153, 0.20)" },
                { line: "#a855f7", fill: "rgba(168, 85, 247, 0.20)" },
              ];

              const radarTraces = compared.map((g, idx) => {
                const vals = FEATURE_KEYS.map((k) => g.scores[k]);
                return {
                  type: "scatterpolar",
                  r: [...vals, vals[0]],
                  theta: [...AXIS_LABELS, AXIS_LABELS[0]],
                  fill: "toself",
                  name: g.title,
                  fillcolor: palette[idx % 3].fill,
                  line: { color: palette[idx % 3].line, width: 2.5 },
                };
              });

              return (
                <div className="wp-radar-split" style={styles.radarSplit}>
                  <div style={styles.card}>
                    <h3 style={{ ...styles.cardTitle, marginBottom: "10px" }}>
                      7-Axis Intensity Overlay
                    </h3>
                    <PlotlyChart
                      data={radarTraces}
                      style={{ width: "100%", height: "380px" }}
                      layout={{
                        margin: { t: 35, r: 85, b: 40, l: 95 },
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
                  </div>

                  <div style={styles.card}>
                    <h3 style={{ ...styles.cardTitle, marginBottom: "12px" }}>
                      Dimension & Metadata Matrix
                    </h3>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                        <thead>
                          <tr
                            style={{
                              borderBottom: "1px solid #334155",
                              color: "#94a3b8",
                              textAlign: "left",
                            }}
                          >
                            <th style={{ padding: "8px" }}>Metric</th>
                            {compared.map((g, i) => (
                              <th
                                key={g.game_id}
                                style={{ padding: "8px", color: palette[i % 3].line }}
                              >
                                {g.title}
                              </th>
                            ))}
                            <th style={{ padding: "8px" }}>Spread</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderBottom: "1px solid #1e293b" }}>
                            <td style={{ padding: "8px", color: "#cbd5e1" }}>Platform</td>
                            {compared.map((g) => (
                              <td key={g.game_id} style={{ padding: "8px" }}>
                                <span
                                  style={{
                                    ...styles.platformPill,
                                    ...getPlatformBadgeStyle(g.platform),
                                  }}
                                >
                                  {g.platform}
                                </span>
                              </td>
                            ))}
                            <td style={{ padding: "8px", color: "#64748b" }}>—</td>
                          </tr>
                          <tr style={{ borderBottom: "1px solid #1e293b" }}>
                            <td style={{ padding: "8px", color: "#cbd5e1" }}>Avg Playtime</td>
                            {compared.map((g) => (
                              <td key={g.game_id} style={{ padding: "8px" }}>
                                {g.avg_playtime_hrs}h
                              </td>
                            ))}
                            <td style={{ padding: "8px", color: "#38bdf8" }}>
                              {(
                                Math.max(...compared.map((g) => g.avg_playtime_hrs)) -
                                Math.min(...compared.map((g) => g.avg_playtime_hrs))
                              ).toFixed(1)}
                              h
                            </td>
                          </tr>
                          <tr style={{ borderBottom: "1px solid #1e293b" }}>
                            <td style={{ padding: "8px", color: "#cbd5e1" }}>Overall Intensity</td>
                            {compared.map((g) => (
                              <td key={g.game_id} style={{ padding: "8px", fontWeight: 700 }}>
                                {g.overall_intensity} / 10
                              </td>
                            ))}
                            <td style={{ padding: "8px", color: "#34d399" }}>
                              {(
                                Math.max(...compared.map((g) => g.overall_intensity)) -
                                Math.min(...compared.map((g) => g.overall_intensity))
                              ).toFixed(2)}
                            </td>
                          </tr>
                          {FEATURE_KEYS.map((key, idx) => {
                            const vals = compared.map((g) => g.scores[key]);
                            const diff = (Math.max(...vals) - Math.min(...vals)).toFixed(1);
                            return (
                              <tr
                                key={key}
                                style={{ borderBottom: "1px solid rgba(51,65,85,0.5)" }}
                              >
                                <td style={{ padding: "8px", color: "#cbd5e1" }}>
                                  {AXIS_LABELS[idx]}
                                </td>
                                {compared.map((g) => (
                                  <td key={g.game_id} style={{ padding: "8px", fontWeight: 600 }}>
                                    {g.scores[key]}
                                  </td>
                                ))}
                                <td
                                  style={{
                                    padding: "8px",
                                    color: Number(diff) >= 4 ? "#f59e0b" : "#94a3b8",
                                  }}
                                >
                                  Δ {diff}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
        </main>
      )}

      {/* TAB 3: EXPLORATORY DATA ANALYSIS (EDA) */}
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
          <div className="wp-eda-grid" style={styles.edaGrid}>
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
                layout={{
                  margin: { t: 20, r: 20, b: 110, l: 145 },
                }}
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
                style={{ width: "100%", height: "370px" }}
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
                layout={{
                  barmode: "group",
                  margin: { t: 25, r: 20, b: 85, l: 45 },
                  xaxis: { automargin: true },
                  yaxis: { gridcolor: "#334155" },
                }}
              />
            </div>

            {/* Chart 4: Mental State Distribution Across Employment Groups */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                Psychological State Distribution Across Employment Cohorts
              </h3>
              <PlotlyChart
                style={{ width: "100%", height: "370px" }}
                data={["Overthinking", "High Stress", "Low Mood", "Relaxed"].map((state, idx) => ({
                  x: edaData.mental_state_distribution.map((row) => row.employment_status),
                  y: edaData.mental_state_distribution.map((row) => row[state] || 0),
                  name: state,
                  type: "bar",
                  marker: { color: ["#f59e0b", "#ef4444", "#8b5cf6", "#10b981"][idx] },
                }))}
                layout={{
                  barmode: "stack",
                  margin: { t: 25, r: 20, b: 85, l: 55 },
                  xaxis: { automargin: true },
                  yaxis: { title: "User Count", gridcolor: "#334155" },
                }}
              />
            </div>
          </div>
        </main>
      )}

      {/* TAB 4: STATISTICAL & UNSUPERVISED ML INSIGHTS */}
      {activeTab === "stats" && advData && (
        <main
          style={{
            maxWidth: "1320px",
            margin: "24px auto",
            padding: "0 20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* 1. Data Quality & Governance Audit Strip */}
          <div style={styles.card}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <h2 style={styles.cardTitle}>
                  <CheckCircle2 size={18} color="#34d399" /> Automated Dataset Quality & Governance
                  Audit
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                  Programmatic verification of missing values, duplicate records, and 1–10 scale
                  boundaries.
                </p>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                <span style={styles.auditBadge}>
                  Base Titles: <strong>{advData.data_audit.unique_base_games}</strong> (250 catalog
                  rows)
                </span>
                <span style={styles.auditBadge}>
                  Missing Cells: <strong>{advData.data_audit.games_missing_values}</strong>
                </span>
                <span style={styles.auditBadge}>
                  Duplicate User IDs: <strong>{advData.data_audit.users_duplicate_ids}</strong>
                </span>
                <span style={styles.auditBadge}>
                  1–10 Scale Validated:{" "}
                  <strong style={{ color: "#34d399" }}>
                    {advData.data_audit.scale_validated ? "PASS" : "FAIL"}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* 2. Strict Statistical Hypothesis Testing Cards */}
          <div style={styles.hypoGrid}>
            <div style={styles.card}>
              <span style={styles.testTag}>BIVARIATE CORRELATION</span>
              <h3 style={{ margin: "8px 0 4px", fontSize: "15px", color: "#f8fafc" }}>
                {advData.hypothesis_tests.correlation.variables}
              </h3>
              <div style={styles.statRow}>
                <span>
                  Pearson linear <em>r</em>:{" "}
                  <strong style={{ color: "#38bdf8" }}>
                    {advData.hypothesis_tests.correlation.pearson_r}
                  </strong>{" "}
                  (p = {advData.hypothesis_tests.correlation.pearson_p})
                </span>
                <span>
                  Spearman rank <em>ρ</em>:{" "}
                  <strong style={{ color: "#34d399" }}>
                    {advData.hypothesis_tests.correlation.spearman_rho}
                  </strong>{" "}
                  (p = {advData.hypothesis_tests.correlation.spearman_p})
                </span>
              </div>
              <p style={styles.testNote}>{advData.hypothesis_tests.correlation.interpretation}</p>
            </div>

            <div style={styles.card}>
              <span style={styles.testTag}>ONE-WAY ANOVA + EFFECT SIZE</span>
              <h3 style={{ margin: "8px 0 4px", fontSize: "15px", color: "#f8fafc" }}>
                {advData.hypothesis_tests.anova.variables}
              </h3>
              <p style={{ margin: "0 0 8px", fontSize: "11px", color: "#94a3b8" }}>
                {advData.hypothesis_tests.anova.null_hypothesis}
              </p>
              <div style={styles.statRow}>
                <span>
                  F-Stat:{" "}
                  <strong style={{ color: "#38bdf8" }}>
                    {advData.hypothesis_tests.anova.f_statistic}
                  </strong>{" "}
                  (p = {advData.hypothesis_tests.anova.p_value})
                </span>
                <span>
                  Effect Size η²:{" "}
                  <strong style={{ color: "#34d399" }}>
                    {advData.hypothesis_tests.anova.eta_squared}
                  </strong>{" "}
                  | Levene p = {advData.hypothesis_tests.anova.levene_p}
                </span>
              </div>
              <p style={styles.testNote}>{advData.hypothesis_tests.anova.interpretation}</p>
            </div>

            <div style={styles.card}>
              <span style={styles.testTag}>CHI-SQUARE INDEPENDENCE</span>
              <h3 style={{ margin: "8px 0 4px", fontSize: "15px", color: "#f8fafc" }}>
                {advData.hypothesis_tests.chi_square.variables}
              </h3>
              <p style={{ margin: "0 0 8px", fontSize: "11px", color: "#94a3b8" }}>
                {advData.hypothesis_tests.chi_square.null_hypothesis}
              </p>
              <div style={styles.statRow}>
                <span>
                  χ² Statistic:{" "}
                  <strong style={{ color: "#38bdf8" }}>
                    {advData.hypothesis_tests.chi_square.chi2_statistic}
                  </strong>{" "}
                  (dof = {advData.hypothesis_tests.chi_square.dof})
                </span>
                <span>
                  p-value:{" "}
                  <strong style={{ color: "#a855f7" }}>
                    {advData.hypothesis_tests.chi_square.p_value}
                  </strong>
                </span>
              </div>
              <p style={styles.testNote}>{advData.hypothesis_tests.chi_square.interpretation}</p>
            </div>
          </div>

          {/* 3. PCA + K-Means Clustering Scatter & Box Plots */}
          <div className="wp-eda-grid" style={styles.edaGrid}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                PCA 2D Projection & K-Means Archetype Clusters (k = 4)
              </h3>
              <p style={{ margin: "4px 0 10px", fontSize: "12px", color: "#94a3b8" }}>
                Standardized 7D game profiles reduced to 2 principal components (
                {advData.pca.total_variance_explained}% variance retained).
              </p>
              <PlotlyChart
                style={{ width: "100%", height: "380px" }}
                data={advData.pca.cluster_summaries.map((cl, idx) => {
                  const pts = advData.pca.points.filter((p) => p.cluster_id === cl.cluster_id);
                  return {
                    x: pts.map((p) => p.pc1),
                    y: pts.map((p) => p.pc2),
                    text: pts.map(
                      (p) => `${p.title}<br>${cl.label}<br>Overall Intensity: ${p.overall_intensity}`
                    ),
                    mode: "markers",
                    type: "scatter",
                    name: cl.label,
                    marker: {
                      size: 11,
                      color: CLUSTER_COLORS[idx % CLUSTER_COLORS.length],
                      line: { width: 1, color: "#0f172a" },
                    },
                  };
                })}
                layout={{
                  margin: { t: 20, r: 20, b: 60, l: 55 },
                  xaxis: {
                    title: `PC1 (${advData.pca.explained_variance_pct[0]}% Variance)`,
                    gridcolor: "#334155",
                  },
                  yaxis: {
                    title: `PC2 (${advData.pca.explained_variance_pct[1]}% Variance)`,
                    gridcolor: "#334155",
                  },
                  legend: { orientation: "h", y: -0.22 },
                }}
              />
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                7-Dimensional Score Distributions & Outlier Box Plots
              </h3>
              <p style={{ margin: "4px 0 10px", fontSize: "12px", color: "#94a3b8" }}>
                Inspecting median, interquartile range (IQR), and extreme high-strain outliers
                across every engineered index.
              </p>
              <PlotlyChart
                style={{ width: "100%", height: "380px" }}
                data={advData.boxplots.map((b, idx) => ({
                  y: b.values,
                  name: b.dimension,
                  type: "box",
                  boxpoints: "outliers",
                  marker: {
                    color: [
                      "#38bdf8",
                      "#34d399",
                      "#a855f7",
                      "#f59e0b",
                      "#ec4899",
                      "#ef4444",
                      "#6366f1",
                    ][idx % 7],
                  },
                }))}
                layout={{
                  margin: { t: 20, r: 20, b: 85, l: 45 },
                  showlegend: false,
                  xaxis: { automargin: true },
                  yaxis: { title: "Score (1–10 Scale)", range: [0, 10.5], gridcolor: "#334155" },
                }}
              />
            </div>
          </div>

          {/* 4. Parallel Coordinates Plot */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              Multivariate Parallel Coordinates Plot (All 7 Well-Being Dimensions)
            </h3>
            <p style={{ margin: "4px 0 10px", fontSize: "12px", color: "#94a3b8" }}>
              Drag vertically along any axis to filter game trajectories across all seven dimensions
              simultaneously. Colored by Overall Intensity.
            </p>
            <PlotlyChart
              style={{ width: "100%", height: "390px" }}
              data={[
                {
                  type: "parcoords",
                  line: {
                    color: advData.pca.points.map((p) => p.overall_intensity),
                    colorscale: "Portland",
                    showscale: true,
                    cmin: 2,
                    cmax: 8.5,
                    colorbar: { title: "Intensity" },
                  },
                  dimensions: FEATURE_KEYS.map((key, idx) => ({
                    range: [1, 10],
                    label: AXIS_LABELS[idx],
                    values: advData.pca.points.map((p) => p.scores[key]),
                  })),
                },
              ]}
              layout={{
                margin: { t: 45, r: 50, b: 25, l: 50 },
              }}
            />
          </div>
        </main>
      )}

      {/* TAB 5: METHODOLOGY, DATA DICTIONARY & GOVERNANCE */}
      {activeTab === "about" && (
        <main
          style={{
            maxWidth: "1320px",
            margin: "24px auto",
            padding: "0 20px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>
              <BookOpen size={18} color="#38bdf8" /> WellPlay DAV: Mathematical Methodology & Data
              Governance
            </h2>
            <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#cbd5e1", lineHeight: 1.65 }}>
              <strong>WellPlay DAV</strong> is a 5th-semester B.Tech Data Analysis & Visualization
              platform combining deterministic feature engineering, statistical hypothesis testing,
              unsupervised clustering, and an{" "}
              <strong>Asymmetric Weighted Distance Recommendation Engine</strong>.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "14px",
                marginTop: "16px",
              }}
            >
              <div style={styles.explainBox}>
                <h4 style={{ margin: "0 0 8px", fontSize: "14px", color: "#38bdf8" }}>
                  1. Asymmetric Weighted Scoring Formula
                </h4>
                <p style={{ margin: 0, fontSize: "12px", color: "#cbd5e1", lineHeight: 1.6 }}>
                  Unlike standard symmetric Euclidean distance—which penalizes a gentle game just as
                  heavily as an overwhelming game—WellPlay applies an{" "}
                  <strong>asymmetric multiplier (1.8×)</strong> whenever a game's demand exceeds the
                  user's physiological or psychological ceiling, versus a mild{" "}
                  <strong>0.45× distance factor</strong> when the game is gentler than the ceiling.
                </p>
              </div>

              <div style={styles.explainBox}>
                <h4 style={{ margin: "0 0 8px", fontSize: "14px", color: "#34d399" }}>
                  2. Hybrid Dataset Provenance & Limitations
                </h4>
                <p style={{ margin: 0, fontSize: "12px", color: "#cbd5e1", lineHeight: 1.6 }}>
                  <strong>Games Catalog (N = 250):</strong> Engineered from 65 curated real-world
                  Steam & HowLongToBeat benchmarks across PC and Mobile titles.
                  <br />
                  <strong>User Wellness Cohort (N = 500):</strong> Statistically modeled synthetic
                  profiles created to evaluate constraint-aware recommendations without exposing
                  real medical records. Statistical findings demonstrate correlations within the
                  engineered dataset and do not constitute clinical advice.
                </p>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={{ ...styles.cardTitle, marginBottom: "12px" }}>
              7-Axis Engineered Feature Data Dictionary
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid #334155",
                      color: "#94a3b8",
                      textAlign: "left",
                    }}
                  >
                    <th style={{ padding: "10px" }}>Feature Column</th>
                    <th style={{ padding: "10px" }}>Scale</th>
                    <th style={{ padding: "10px" }}>Engineering Definition</th>
                  </tr>
                </thead>
                <tbody>
                  {DATA_DICTIONARY.map((item) => (
                    <tr key={item.field} style={{ borderBottom: "1px solid rgba(51,65,85,0.5)" }}>
                      <td style={{ padding: "10px", fontFamily: "monospace", color: "#38bdf8" }}>
                        {item.field}
                      </td>
                      <td style={{ padding: "10px", color: "#34d399", fontWeight: 600 }}>
                        {item.scale}
                      </td>
                      <td style={{ padding: "10px", color: "#cbd5e1" }}>{item.definition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
  tabGroup: { display: "flex", gap: "8px", flexWrap: "wrap" },
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
  personaChip: {
    padding: "4px 9px",
    borderRadius: "999px",
    border: "1px solid #334155",
    background: "#0f172a",
    color: "#cbd5e1",
    fontSize: "11px",
    cursor: "pointer",
  },
  personaChipActive: {
    padding: "4px 9px",
    borderRadius: "999px",
    border: "1px solid #38bdf8",
    background: "rgba(56, 189, 248, 0.18)",
    color: "#38bdf8",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
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
  exportBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    borderRadius: "8px",
    border: "1px solid #34d399",
    background: "rgba(52, 211, 153, 0.12)",
    color: "#34d399",
    fontSize: "12px",
    fontWeight: 600,
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
  platformPill: {
    fontSize: "10px",
    fontWeight: 700,
    padding: "2px 7px",
    borderRadius: "5px",
    letterSpacing: "0.02em",
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
    gridTemplateColumns: "1.15fr 1fr",
    gap: "16px",
    alignItems: "start",
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
  },
  miniCompareBtn: {
    background: "rgba(56, 189, 248, 0.12)",
    border: "1px solid rgba(56, 189, 248, 0.35)",
    color: "#38bdf8",
    borderRadius: "5px",
    padding: "2px 7px",
    fontSize: "10px",
    fontWeight: 600,
    cursor: "pointer",
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
  hypoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: "16px",
  },
  testTag: {
    display: "inline-block",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.06em",
    color: "#38bdf8",
    background: "rgba(56, 189, 248, 0.12)",
    padding: "3px 8px",
    borderRadius: "5px",
  },
  statRow: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontSize: "12px",
    color: "#e2e8f0",
    background: "#0f172a",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #334155",
    margin: "8px 0",
  },
  testNote: {
    margin: 0,
    fontSize: "12px",
    color: "#94a3b8",
    lineHeight: 1.5,
  },
  auditBadge: {
    background: "#0f172a",
    border: "1px solid #334155",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    color: "#cbd5e1",
  },
};