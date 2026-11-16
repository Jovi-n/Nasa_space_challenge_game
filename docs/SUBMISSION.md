# ORBITAL CLEANUP: MISSION ZERO
## NASA Space Apps Challenge / Space Debris Mitigation & Remediation Submission Dossier

**Track:** Orbital Debris Management, Space Situational Awareness & Space Sustainability  
**Project Name:** *Orbital Cleanup: Mission Zero*  
**Architecture:** Pure Client-Side Static Web Application (Phaser 3.80.1, HTML5 Canvas, Vanilla Web Audio API, Modern JavaScript)  
**Deployment Target:** 100% Zero-Dependency Static Web Execution (Local file, Python HTTP, or GitHub Pages)  

---

## 1. Executive Summary & Challenge Alignment

Near-Earth space is rapidly approaching the **Kessler Syndrome tipping point**—a cascade collapse where the density of orbital objects in Low Earth Orbit (LEO) is sufficiently high that collisions between objects produce a cascade cloud of fragments, multiplying subsequent collisions exponentially and threatening to render critical orbital bands unusable for generations.

**Orbital Cleanup: Mission Zero** is an interactive, authentic orbital simulation and tactical arcade game engineered to educate, engage, and train players on real-world space debris remediation (Active Debris Removal - ADR), space situational awareness (SSA), space weather hazards, and the complex trade-offs of orbital logistics.

### Core NASA Challenge Pillars Addressed:
1. **Active Debris Removal (ADR) Methodologies:** Models multi-modal capture mechanisms based on active aerospace research: robotic grapple cables, expandable capture nets, and magnetic/electrodynamic tractor fields.
2. **Authentic Space Situational Awareness (SSA) & Real Conjunctions:** Features 8 historically accurate orbital sectors (from ISS at 420 km to the Geostationary Graveyard at 35,986 km), incorporating actual breakup events: *Cosmos 2251 / Iridium 33*, *Fengyun-1C*, and upper-stage passivation failures.
3. **Real-World Space Weather (NASA DONKI Integration):** Ingests and simulates real solar energetic particle (SEP) events, coronal mass ejections (CMEs), and geomagnetic storms from the NASA Space Weather Database Of Notifications, Knowledge, Information (DONKI API). Space weather actively generates physical solar wind drag, sensor telemetry noise, and EMP coronal surges.
4. **Engineering Trade-off Exploration (Mission Design Studio):** Players engineer custom mission packages balancing wet vs. dry mass, delta-V propellant budgets, solar power generation vs. radioactive interference, and structural shielding.
5. **Macro-Strategic Campaign & Policy Dilemmas:** Implements an orbital campaign map, asset registry, world clock, technology research tree, faction reputation (NASA/Agency, Commercial, Public), and four distinct story endings illustrating the socioeconomic outcomes of orbital stewardship.

---

## 2. Scientific Data Sources & Methodology

All physics parameters, debris characteristics, historical missions, and environmental dynamics are grounded in authentic aerospace documentation from the **NASA Orbital Debris Program Office (ODPO)**, **NASA DONKI**, **ESA Space Debris Office**, and the **Inter-Agency Space Debris Coordination Committee (IADC)**.

To maintain strict scientific integrity, all data within the codebase and user interface is categorized under standard notation:
* `[FACT - NASA ODPO]`: Direct historical figure, orbital altitude, inclination, or documented collision parameter.
* `[FACT - NASA DONKI]`: Real space weather solar event, coronal mass ejection speed, or geomagnetic planetary K-index.
* `[ESTIMATE]`: Necessary simulation scaling or gameplay adaptation for top-down real-time interactive gameplay.

### Reference Data Matrix

| Domain | Historical / Physical Fact | Data Source | Simulation Adaptation `[ESTIMATE]` |
| :--- | :--- | :--- | :--- |
| **ISS Orbit** | Alt: 420 km, Inc: 51.6°, 35+ avoidance maneuvers | NASA ODPO Technical Reports | Sector 01 baseline clearance corridor |
| **Upper Stage Breakups** | Delta/Zenit/Ariane hypergolic fuel tank ruptures | NASA ODPO / IADC Debris Mitigation | Volatile hydrazine tank venting hazard |
| **Cosmos-Iridium Collision** | 2009 hypervelocity collision at 789 km altitude | NASA ODPO / US Space Surveillance Net | High-inclination shrapnel belt & fragments |
| **Fengyun-1C ASAT** | 2007 kinetic impact at 865 km creating 3,500+ trackable fragments | NASA Orbital Debris Quarterly News | Hypervelocity kinetic projectile storm |
| **Envisat Derelict** | 8,211 kg dead environmental observatory at 768 km Sun-sync | ESA Space Debris Office | High-mass priority grapple ADR target |
| **Space Weather** | Coronal Mass Ejections, Solar Flares, Geomagnetic Storms | NASA DONKI API (CME/GST/FLR) | Dynamic drag surge & avionics jitter |
| **Orbital Decay** | Thermospheric density increases during solar maximum | NASA Marshall Space Flight Center | Increased aerodynamic drag during solar storms |
| **Whipple Shielding** | Multi-sheet hypervelocity bumper protection | NASA SP-8042 / Hypervelocity Shielding | Scaled impact damage reduction (15% per tier) |
| **Faraday Shielding** | Conductive enclosure grounding electrostatic charges | IEEE Electromagnetic Compatibility | Aegis Station perimeter grounds EMP waves |

---

## 3. System Architecture & Technical Highlights

*Orbital Cleanup: Mission Zero* was engineered under strict production principles to guarantee zero-installation accessibility and rock-solid stability across all platforms.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BROWSER RUNTIME (HTML5)                         │
├──────────────────┬──────────────────┬──────────────────────────────────┤
│ PHASER 3.80.1    │ WEB AUDIO API    │ PROCEDURAL GRAPHICS ENGINE       │
│ • 2D Arcade Phys │ • Procedural SYN │ • 24 Pixel-Art Textures (0 PNGs) │
│ • Multi-Lane Rel │ • Dynamic Noise  │ • Dynamic Lighting & Auroras     │
│ • Camera Shake   │ • Thruster Waves │ • Minimap & Sensor Trajectories  │
├──────────────────┴──────────────────┴──────────────────────────────────┤
│                     DATA & SIMULATION SUBSYSTEMS                       │
├──────────────────┬──────────────────┬──────────────────────────────────┤
│ FLIGHT DIRECTOR  │ SPACE WEATHER    │ CAMPAIGN & STORYLET ENGINE       │
│ • Dynamic Tension│ • DONKI Snapshot │ • 8-Sector Altitude Map          │
│ • Pacing Waves   │ • Drag Surge     │ • 6-Branch Tech Progression Tree │
│ • Safe Queues    │ • EMP Havens     │ • 4 Multi-Variable Story Endings │
├──────────────────┴──────────────────┴──────────────────────────────────┤
│                  STORAGE & PERSISTENCE (LOCALSTORAGE)                  │
│ • Non-Destructive Save v2 Schema     • Safe Timestamped Save Archiving │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Technical Achievements:
1. **Pure Client-Side Zero-Dependency Deployment:**
   - Runs out-of-the-box from any static web server or local folder. No Node.js backend, no build-step bundlers, and no runtime npm dependencies.
2. **Procedural Pixel-Art Sprite Synthesizer (`js/graphics.js`):**
   - 100% of game art—spacecraft airframes, docking hubs, space station solar arrays, cubesats, rocket boosters, hypergolic tanks, and nuclear cores—is generated procedurally in memory via HTML5 Canvas rasterization. Zero heavy PNG image downloads required.
3. **Procedural Web Audio API Sound Synthesizer (`js/audio.js`):**
   - Synthesizes all acoustic telemetry, thruster roars, graviton tractor hums, grapple mechanical winches, collision thuds, proximity warning sirens, and deep-space generative ambient soundtrack procedurally via native Web Audio oscillators, biquad filters, and gain nodes.
4. **Dynamic Flight Director AI (`js/director.js`):**
   - Continuously monitors player tension, fuel reserve levels, and debris delivered. Regulates threat intervals to adhere to a targeted 5.0–8.0s event pacing rhythm across four distinct phases: `CALM`, `COMPLICATION`, `CRISIS`, and `CLIMAX`.
5. **Memory-Safe Arcade Physics & Object Pooling:**
   - Avoids native tree corruption via safe deferred collision and destruction queues (`pendingCollections`, `pendingHazardDestructions`). Physics objects are recycled cleanly across missions without memory leakage.
6. **Non-Destructive Save Migration & Multi-Campaign Archiving (`js/data.js` & `js/campaign.js`):**
   - Automatically migrates legacy saves to Save Version 2. Starting a New Campaign automatically archives current playthroughs to timestamped local keys, preventing silent data overwrite.

---

## 4. Gameplay Experience & Game Modes

### A. Mission Design Studio & Tactical Review
Before every flight, players configure their custom orbital vehicle:
- **Airframes:** *Aero-Dart (Scout)* for high speed/low cargo, *Orbital Mule (Collector)* for balanced operations, and *Titan Hauler (Heavy Lifter)* for high-capacity salvage.
- **ADR Equipment:** *Robotic Grapple Arm* (+35% Scrap yield, low power), *Capture Net* (wide-area cluster capture), or *Magnetic Tractor Beam* (continuous metallic suction).
- **Subsystem Balancing:** Fuel tank expansions, auxiliary supercapacitors, and nanotube armor weaves.
- **Flight Review:** The system generates a pre-flight Readiness Score (0–100%) and tactical warnings based on sector hazards.

### B. Campaign Mode & Strategic Map
- **8 Distinct Altitude Sectors:** From Low Earth Orbit to GEO, each displaying real-time cleanliness percentages, persistent asset platforms, and active contract profiles.
- **World Clock & Solar Activity Cycle:** An in-game epoch calendar (`2054-04-12`) advances dynamically based on missions and storylets, navigating a 28-day solar weather rotation (`Quiet Sun`, `Elevated Activity`, and `Storm Warning: High Density`).
- **Meaningful Narrative Storylets & Asset Registry:** 12 rich dilemmas involving historical satellites (Vanguard 1, Envisat, ISS, TDRSS) presenting immediate and delayed socioeconomic consequences.
- **6-Branch Technology Tree:** Research upgrades across Capture, Sensors, Power, Shielding, Communications, and Propulsion using harvested Scrap and raw salvage commodities (Metal, Cells, Chips).
- **Four Distinct Endings:**
  1. *The Kessler Collapse* (Failure): Low Earth Orbit becomes an impassable shrapnel shroud.
  2. *Commercial Monopoly*: Space salvage privatized under corporate tollway cartels.
  3. *Military Fortress*: LEO militarized as a restricted national defense bastion.
  4. *Orbital Renaissance* (Optimal): High orbital cleanliness, broad international cooperation, and advanced sustainable space commons.

### C. Cascade Survival Mode
- An intense, endless survival challenge directly selectable from the Main Menu.
- An upward-counting mission clock tracks survival duration against escalating cascade waves arriving every 25 seconds.
- Awards tactical combat ratings (`SURVIVOR`, `VETERAN`, `CASCADE MASTER`, `ORBITAL LEGEND`) stored in persistent records.

---

## 5. Verification & Testing

Every subsystem has been verified through a dedicated automated Node.js test suite with a **100% pass rate**:
* `tests/test_phase6.js`: 100% procedural pixel-art asset generation & texture resolution.
* `tests/test_phase7.js`: Orbital altitude differential velocity, DONKI snapshot parsing, and radar noise mitigation.
* `tests/test_phase8a.js`: Contract generation, Save v2 migration, sector health deltas, and solicitation rerolls.
* `tests/test_menu_and_f3.js`: UI controller initialization, menu switching, and F3 tactical telemetry overlay.
* `tests/test_storm_hazard.js`: Kinetic solar wind drag forces, coronal plasma EMP surges, and Faraday shielding.
* `tests/test_phase8b.js`: Asset registry schema, 12 storylets, non-repetition logic, and decision history persistence.
* `tests/test_phase8c.js`: World clock, 6 tech branches, 4 campaign endings, save archiving, and Cascade Survival.
* `tests/test_complete_flow.js`: End-to-end user loop from Menu → Design → Launch → Docking → Debrief → Campaign.
* `tests/audit_phase9.js`: 93/93 comprehensive UI button event coverage, modal dismissals, and audio method integrity.

---

## 6. How to Run Locally

### Immediate Execution (Zero Build Required)
```bash
# Option 1: Python 3 Standard Server
python -m http.server 8080

# Option 2: Node.js Serve
npx serve -l 8080

# Option 3: Direct File
Open index.html in any modern Chromium, Firefox, or Safari browser.
```
Navigate to: **`http://localhost:8080`**

### Recommended Controls
* **Propulsion:** `W` (Main Ion Thrusters), `A` / `D` (RCS Yaw Rotation), `S` (Retro-Thrusters / Braking).
* **Equipment:** `SPACEBAR` (Fire Grapple, Launch Net, or Sustain Tractor Beam).
* **Docking:** `E` (Dock & Process Salvage inside Aegis Depot harbor).
* **Telemetry HUD:** `F3`, `T`, or Backtick (`` ` ``) to toggle live engineering telemetry overlay.
* **Audio Toggles:** Click `SFX` / `MUSIC` buttons on top status bar.

---

## 7. Conclusion

*Orbital Cleanup: Mission Zero* bridges the gap between serious aerospace concepts and engaging simulation gameplay. By combining authentic NASA ODPO data, dynamic space weather from NASA DONKI, genuine Active Debris Removal physics, and deep strategic campaign decisions, the project showcases the urgency of preserving Earth's orbital frontier for future generations.
