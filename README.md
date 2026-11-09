# WellPlay DAV: Multi-Dimensional Constraint-Aware Game Recommendation & Analytics Platform

A full-stack **Data Analysis & Visualization (DAV)** application that matches users with well-being-aligned video games based on demographic constraints (**age, gender, employment status**), physiological **eye-strain sensitivity**, and psychological states (**stress, overthinking, low mood**).

## Problem Statement
Conventional game recommendation engines optimize for popularity and engagement while disregarding physiological fatigue, demographic time budgets, and psychological well-being. This framework engineers **seven quantitative well-being indices** from raw game metadata and applies an asymmetric constraint-aware scoring algorithm alongside interactive exploratory analytics.

## Key Analytical Features
- **7-Factor Feature Engineering (`1–10` Scale):** Visual Strain, Cognitive Load, Session Commitment, Social Interaction Pressure, Emotional Heaviness, Motor/Reflex Intensity, and Progress/Grind Complexity.
- **Explainable Recommendation Engine:** Computes a 7-axis user comfort ceiling, applies hard safety guardrails, ranks games using asymmetric weighted distance penalties, and recommends safe daily session caps with eye-break intervals.
- **Interactive Visual Dashboard (React + Plotly.js):**
  - **Personal Recommender:** Hero top pick, top 6 ranked recommendations, live comfort threshold bars, and a 7-axis overlapping radar chart.
  - **Exploratory Data Analysis (EDA):** Multi-factor correlation heatmap, visual-vs-cognitive bubble scatter plot, and employment-cohort demographic distributions.
- **Statistical Hypothesis Testing (`notebooks/dav_statistical_analysis.py`):** Descriptive statistics, Pearson correlation tests, and One-Way ANOVA across demographic cohorts.

## Tech Stack
- **Backend & Analytics:** Python, FastAPI, Pandas, NumPy, SciPy, Scikit-Learn
- **Frontend & Visualization:** React (Vite), Plotly.js, Lucide Icons

## Quick Start
1. **Start Backend:**
   ```bash
   cd backend
   venv\Scripts\activate
   fastapi dev main.py
