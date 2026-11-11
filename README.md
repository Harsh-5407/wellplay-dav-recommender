# WellPlay DAV: Multi-Dimensional Constraint-Aware Game Recommendation & Analytics Platform

A full-stack **Data Analysis & Visualization (DAV)** application that matches users with well-being-aligned video games based on demographic constraints (**age, gender, employment status**), device platforms (**PC, Mobile, Cross-Platform**), physiological **eye-strain sensitivity**, and psychological states (**stress, overthinking, low mood, relaxed**).

---

## Problem Statement
Conventional game recommendation engines optimize for popularity and engagement while disregarding physiological fatigue, demographic time budgets, and psychological well-being. This framework engineers **seven quantitative well-being indices** from raw game metadata and applies an asymmetric constraint-aware scoring algorithm alongside interactive exploratory and statistical ML analytics.

---

## Key Analytical & Engineering Features

- **Hybrid Dataset & 7-Factor Feature Engineering (`1–10` Scale):**
  - **Games Catalog ($N = 250$ rows / $65$ distinct PC, Mobile & Cross-Platform titles):** Engineered from real-world Steam & HowLongToBeat benchmarks into 7 normalized indices: *Visual Strain* (including a `+0.6` small-screen optical density modifier for mobile-only titles), *Cognitive Load*, *Session Commitment* ($\ln(1 + \text{hours})$ scaled), *Social Interaction Pressure*, *Emotional Heaviness*, *Motor/Reflex Intensity*, and *Progress/Grind Complexity*.
  - **Synthetic Wellness Cohort ($N = 500$ profiles):** Models age, employment status, eye-strain sensitivity, psychological state, and daily free time without exposing personal health records.

- **Explainable Asymmetric Recommendation Engine (`backend/main.py`):**
  - Computes a 7-axis user comfort ceiling, applies hard safety guardrails (age, platform, and high-strain caps), and ranks games using **asymmetric weighted distance penalties** ($1.8\times$ penalty when exceeding a comfort ceiling vs. $0.45\times$ gentle factor below ceiling):
    $$D_w(g, u) = \sqrt{\sum_{i=1}^{7} w_i \cdot \delta_i^2}, \quad \delta_i = \begin{cases} 1.8 (g_i - u_i) & \text{if } g_i > u_i \\ 0.45 |g_i - u_i| & \text{if } g_i \le u_i \end{cases}$$
  - Supports **5 dynamic What-If Recommendation Modes** (*Balanced*, *Relaxation*, *High Energy*, *Casual*, *Social*), **Platform Filtering** (*Any*, *PC*, *Mobile*), safe daily session caps with eye-break intervals, and one-click **CSV report export**.

- **Interactive 5-Tab Visual Dashboard (React + Plotly.js):**
  - **Personal Recommender:** Quick demo personas, hero top pick, top 6 ranked recommendations, live comfort threshold bars, 7-axis overlapping radar chart, and dimension-by-dimension comfort gauges.
  - **Compare Games:** Side-by-side 7-axis radar overlay and spread analysis matrix for 2–3 games with platform catalog filtering.
  - **Dataset EDA & Insights:** Multi-factor correlation heatmap, visual-vs-cognitive bubble scatter plot, and employment-cohort demographic distributions.
  - **Statistical & ML Insights:** `StandardScaler` + **2D PCA** ($64.4\%$ variance explained), **K-Means Archetype Clustering ($k=4$)**, 7-axis Parallel Coordinates plot, outlier Box Plots, automated Data Quality Audits, and live SciPy hypothesis testing.
  - **Methodology & Docs:** Mathematical formulation, dataset provenance, and complete 7-axis data dictionary.

- **Empirical Statistical Findings (`GET /api/advanced-analytics` & `notebooks/dav_statistical_analysis.py`):**
  - **Visual Strain vs. Reflex Intensity:** Pearson $r = 0.8487$ ($p = 7.02 \times 10^{-15}$), Spearman $\rho = 0.7061$ ($p = 1.01 \times 10^{-8}$).
  - **Daily Free Time across Employment Statuses (One-Way ANOVA):** $F = 150.70$ ($p = 5.91 \times 10^{-97}$), Effect Size $\eta^2 = 0.604$, Levene's homogeneity $p = 0.1529$.
  - **Employment Status vs. Primary Mental State (Chi-Square):** $\chi^2 = 44.64$ ($\text{dof} = 15$, $p = 0.0001$).

---

## Tech Stack
- **Backend & Analytics:** Python, FastAPI, Pandas, NumPy, SciPy, Scikit-Learn
- **Frontend & Visualization:** React (Vite), Plotly.js, Lucide Icons
- **Deployment:** Render (Static Site + Python Web Service)

---

## Quick Start

1. **Generate Datasets & Start Backend:**
   ```bash
   cd backend
   venv\Scripts\activate
   pip install -r requirements.txt
   python build_datasets.py
   uvicorn main:app --reload

   cd frontend
npm install
npm run dev

