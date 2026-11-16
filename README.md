# ORBITAL CLEANUP: MISSION ZERO
### NASA Space Apps Challenge — Orbital Debris Mitigation & Remediation

A high-fidelity top-down 2D orbital simulation and tactical arcade game built with **Phaser 3.80.1**, **HTML5 Canvas**, **CSS3**, and **Vanilla JavaScript Web Audio API**. Combines arcade spaceflight dynamics with authentic orbital debris mitigation (Active Debris Removal - ADR), space situational awareness (SSA), real NASA DONKI space weather data, and strategic campaign decision systems.

---

## 🚀 Key Highlights & Differentiators

1. **Authentic Active Debris Removal (ADR) Methodologies:**
   - **Robotic Grapple Arm:** Mechanical reel-in cable with precision target locks (+35% Scrap Bonus).
   - **Wide-Angle Capture Net:** Expandable 120m energy mesh sweeping multiple debris fragments simultaneously.
   - **Magnetic Tractor Beam:** Sustained graviton cone pulling metallic items directly into the cargo intake.
2. **Real-World Space Weather (NASA DONKI Integration):**
   - Ingests real coronal mass ejections (CMEs), solar radiation storms, and geomagnetic disturbances from the NASA DONKI API.
   - Features active solar wind drag forces, coronal plasma EMP surges, and tactical **Faraday Haven** sheltering within the Aegis Depot perimeter.
3. **Multi-Lane Orbital Dynamics Across 8 Sectors:**
   - 8 authentic altitude bands from Low Earth Orbit (ISS at 420 km) up to the Geostationary Graveyard (35,986 km).
   - Accurate differential orbital velocity modeling and historical breakup fields (*Cosmos 2251*, *Fengyun-1C*, *Envisat*).
4. **Mission Design Studio & Engineering Trade-Offs:**
   - Pre-flight engineering balances 3 distinct airframes (*Aero-Dart Scout*, *Orbital Mule Collector*, *Titan Hauler*), equipment packages, and subsystem tunings with automated pre-flight Readiness Scoring.
5. **Macro-Strategic Campaign System:**
   - **Interactive Campaign Map:** Tactical altitude grid displaying real-time cleanliness %, hazard ratings, registered assets, and active contract profiles.
   - **World Clock & 28-Day Solar Cycle:** Tracks campaign calendar progression starting at `2054-04-12 (Day 1)` through solar weather rotations (`Quiet Sun`, `Elevated Activity`, `Storm Warning`).
   - **6-Branch Technology Tree:** Research upgrades across Capture, Sensors, Power, Shielding, Communications, and Propulsion using Scrap and raw salvage materials (`metal`, `cells`, `chips`).
   - **12 Narrative Storylets & Asset Registry:** High-stakes dilemmas involving historical satellites with immediate and delayed consequences.
   - **Four Distinct Campaign Endings:** Multi-variable evaluation yields *The Kessler Collapse*, *Commercial Monopoly*, *Military Fortress*, or *Orbital Renaissance*.
6. **Cascade Survival Game Mode:**
   - High-intensity endless survival scenario with escalating 25-second cascade waves and persistent combat ratings (`SURVIVOR`, `VETERAN`, `CASCADE MASTER`, `ORBITAL LEGEND`).
7. **Procedural Web Audio API Synthesizer & Procedural Pixel-Art:**
   - Zero external audio files and zero PNG downloads. All sound effects, alarms, thrusters, and ambient space music are synthesized in real-time via Web Audio API. All 24 sprites are procedurally generated in canvas memory.

---

## 🕹️ Controls

| Key | Action |
| :--- | :--- |
| `W` or `▲ Up Arrow` | Main Forward Propulsion Thrusters |
| `A` / `D` or `◄` / `►` | RCS Reaction Control Yaw Steering |
| `S` or `▼ Down Arrow` | Retro-Thrusters (Counter-Braking) |
| `SPACEBAR` | Fire Grapple Arm / Launch Capture Net / Sustain Tractor Beam |
| `E` or Hold Position | Dock & Process Salvage at Aegis Orbital Depot |
| `F3`, `T`, or `` ` `` | Toggle Engineering Telemetry & System Monitor Overlay |
| `P` or `ESC` | Pause Flight Simulation |

---

## 💻 How to Run Locally

*Orbital Cleanup: Mission Zero* requires **zero build steps** and **zero npm dependencies**.

```bash
# Option 1: Python 3 Standard Server
python -m http.server 8080

# Option 2: Node.js Serve
npx serve -l 8080

# Option 3: Direct File Execution
Double-click index.html in Google Chrome, Microsoft Edge, Firefox, or Safari.
```
Then navigate to: **`http://localhost:8080`**

---

## 📁 Repository Structure

```
├── index.html                  # Game entry point, menus, HUD overlay & modals
├── README.md                   # Project overview & quickstart guide
├── USER_MANUAL.md              # Complete Commander's Flight Operations Manual
├── css/
│   └── style.css               # Sci-fi glassmorphism design system & styling
├── data/
│   ├── parts.js                # Airframes, equipment, and payload definitions
│   ├── missions.js             # 8 authentic orbital sectors and historical briefs
│   ├── donki-snapshot.js       # Real & simulated NASA DONKI space weather events
│   └── storylets.js            # Asset registry & 12 narrative dilemmas
├── docs/
│   ├── CHANGES.md              # Complete version history across Phases 0–9
│   ├── STORYLETS.md            # Detailed storylet decision matrices & conditions
│   └── SUBMISSION.md           # Formal NASA challenge submission dossier
├── js/
│   ├── audio.js                # Web Audio API procedural sound synthesizer
│   ├── campaign.js             # Campaign state, world clock, tech tree & endings
│   ├── data.js                 # Save v2 persistence, migrations & difficulty profiles
│   ├── director.js             # AI Flight Director dynamic tension & event pacing
│   ├── game.js                 # Phaser 3 Game Scene, physics, equipment & docking
│   ├── graphics.js             # Procedural canvas pixel-art sprite synthesizer
│   └── ui.js                   # UI controller, campaign map, modals & event binder
├── scripts/
│   ├── fetch-donki.mjs         # Live NASA DONKI API ingestion script
│   └── playtest_phase5.js      # Automated Flight Director pacing simulator
└── tests/
    ├── test_phase6.js          # Procedural texture resolution test
    ├── test_phase7.js          # Orbital lanes & DONKI weather mechanics test
    ├── test_phase8a.js         # Procedural contracts & Save v2 migration test
    ├── test_phase8b.js         # Asset registry & narrative storylets test
    ├── test_phase8c.js         # World clock, tech paths & campaign endings test
    ├── test_storm_hazard.js    # Kinetic solar wind drag & EMP surge test
    ├── test_menu_and_f3.js     # Menu navigation & F3 telemetry overlay test
    ├── test_complete_flow.js   # End-to-end full gameplay loop test
    └── audit_phase9.js         # Comprehensive 93-point UI & audio audit test
```

---

## 🔬 Scientific Data & Methodology

* Historical debris statistics and orbital parameters sourced from **NASA Orbital Debris Program Office (ODPO)** quarterly reports and safety standards (NSS 8719.14).
* Space weather events sourced from **NASA Space Weather Database Of Notifications, Knowledge, Information (DONKI API)**.
* All data points are strictly labeled:
  * `[FACT - NASA ODPO]`: Documented orbital facts, satellite masses, and collision events.
  * `[FACT - NASA DONKI]`: Real solar flares, coronal mass ejections, and geomagnetic storms.
  * `[ESTIMATE]`: Transparent simulation approximations adapted for real-time arcade gameplay.
* Full details available in [docs/SUBMISSION.md](file:///c:/Users/jovin/OneDrive/Documents/Nasa/docs/SUBMISSION.md).

---

## 📜 Documentation & Guides
* **Commander's Operations Manual:** [USER_MANUAL.md](file:///c:/Users/jovin/OneDrive/Documents/Nasa/USER_MANUAL.md)
* **NASA Submission Dossier:** [docs/SUBMISSION.md](file:///c:/Users/jovin/OneDrive/Documents/Nasa/docs/SUBMISSION.md)
* **Narrative Storylet Guide:** [docs/STORYLETS.md](file:///c:/Users/jovin/OneDrive/Documents/Nasa/docs/STORYLETS.md)
* **Development Changelog:** [docs/CHANGES.md](file:///c:/Users/jovin/OneDrive/Documents/Nasa/docs/CHANGES.md)
