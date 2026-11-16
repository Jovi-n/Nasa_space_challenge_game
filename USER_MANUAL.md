# ORBITAL CLEANUP: MISSION ZERO
## Official Commander's Flight Operations Manual & Complete Player Guide

**Version:** 9.0 (NASA Hackathon Final Submission Release)  
**Classification:** Open Orbital Operations Standard (NASA ODPO / IADC Aligned)  

---

## 1. MISSION BRIEFING & BACKGROUND

Earth’s orbital environment has crossed the critical threshold known as the **Kessler Syndrome**—an exponential cascade where orbital collisions spawn high-velocity shrapnel swarms, multiplying further collisions and threatening to render near-Earth space impassable for generations.

As a designated commander under the **Aegis Orbital Defense Initiative**, your mission is to pilot an orbital sanitation craft into active debris sectors. You will collect derelict hardware, passivate volatile rocket stages, dodge hypersonic kinetic threats, weather intense solar radiation storms, manage finite propellant and electrical energy, and safely ferry salvage to the **Aegis Orbital Depot** for recycling.

---

## 2. PILOT CONTROLS & FLIGHT DYNAMICS

| Action | Primary Key | Secondary Key | Operational Details |
| :--- | :--- | :--- | :--- |
| **Main Forward Propulsion** | `W` | `▲ Up Arrow` | Fires rear ion engines. Accelerates spacecraft along its current heading. Consumes propellant. |
| **RCS Yaw Steering** | `A` / `D` | `◄` / `►` | Fires lateral reaction control system (RCS) cold-gas thrusters to rotate spacecraft heading. |
| **Retro-Thruster Braking** | `S` | `▼ Down Arrow` | Fires forward-facing counter-thrusters to shed orbital velocity and bring ship to a halt. |
| **Activate Equipment** | `SPACEBAR` | `SPACEBAR` | Fires Grapple Arm, deploys Capture Net, or sustains Magnetic Tractor Beam. |
| **Dock & Recycle Salvage** | `E` | Hold Position | Initiates docking sequence when inside Aegis Depot harbor perimeter. Fully refuels, recharges, and repairs ship. |
| **Toggle F3 Telemetry HUD** | `F3` | `T` or `` ` `` | Toggles real-time engineering telemetry overlay: vector speed, FPS, physics bodies, solar drag, and storm alerts. |
| **Mission Pause** | `P` | `ESC` | Halts flight simulation and reveals command abort/resume options. |

> [!TIP]
> **Orbital Inertia & Frictionless Flight:** Space is frictionless! Releasing the `W` key does not stop your vessel; you will continue to drift indefinitely at constant velocity. Tap `S` (retro-thrusters) or turn 180° and fire a gentle counter-burn to arrest your drift before docking or dodging hazards.

---

## 3. MISSION DESIGN MODE (PRE-FLIGHT ENGINEERING)

Before launching into orbit, commanders enter the **Mission Design Studio** to engineer their spacecraft configuration:

### A. Spacecraft Airframes
* **Aero-Dart (Scout Bus):**
  * *Top Speed:* ★★★★★ | *Agility:* ★★★★★ | *Cargo:* 3 Slots | *Armor:* 90 HP
  * *Profile:* Lightweight needle-delta interceptor. Extreme acceleration and agility. Enhanced passive solar battery recharge. Ideal for fast hazard dodging and high-speed precision runs.
* **Orbital Mule (Collector Bus):**
  * *Top Speed:* ★★★☆☆ | *Agility:* ★★★☆☆ | *Cargo:* 5 Slots | *Armor:* 140 HP
  * *Profile:* Balanced multi-purpose workhorse. Dependable fuel capacity, standard armor, and spacious 5-slot hold.
* **Titan Hauler (Heavy Lifter Bus):**
  * *Top Speed:* ★★☆☆☆ | *Agility:* ★★☆☆☆ | *Cargo:* 8 Slots | *Armor:* 240 HP
  * *Profile:* Armored catamaran platform carrying heavy structural Whipple shielding and a massive 8-slot cargo bay. Slower acceleration, but able to clear large orbital clusters in fewer runs.

### B. Retrieval Equipment
* **Robotic Grapple Arm:**
  * Fires a high-tensile mechanical clamp forward to reel in targeted debris pieces.
  * *Advantage:* Lowest battery consumption (10 power/shot) and provides an innate **+35% Scrap Bonus** on retrieved debris.
* **Wide-Angle Capture Net:**
  * Launches an expanding energy mesh (up to 120m diameter) that sweeps up all small and medium debris fragments within its area simultaneously.
  * *Advantage:* Highly effective against dense fragmentation clouds.
* **Magnetic Tractor Beam:**
  * Emits a continuous 70° forward magnetic cone that draws metallic debris directly into the intake hold.
  * *Advantage:* Hands-free continuous collection; safely grounds electrostatic charged debris. Consumes battery continuously while active.

### C. Mission Subsystem & Payload Tuning
* **Standard Mission Balance:** Factory-standard balance across all systems.
* **Extended Fuel Tank:** +40% Fuel capacity, -10% Cruising speed. Recommended for large sectors.
* **Auxiliary Supercapacitor:** +40% Battery capacity, +25% Solar recharge rate. Recommended for sustained tractor beam or net use.
* **Nanotube Reinforced Plating:** +40% Maximum Hull Integrity, -15% Handling. Essential for heavy hazard collision corridors.

---

## 4. ALL 8 ORBITAL SECTORS

Each sector represents an authentic orbital altitude regime with distinct hazards and historical mission contexts:

1. **Sector 01: LEO Station Corridor (Alt: 420 km - ISS Corridor)**
   * *Target Quota:* 8 Items | *Hazards:* Fragment clouds, cubesats, broken solar panels.
2. **Sector 02: Upper-Stage Breakup Cloud (Alt: 550 km - Polar Belt)**
   * *Target Quota:* 14 Items | *Hazards:* Volatile hypergolic hydrazine tanks and booster fragments.
3. **Sector 03: Cosmos 2251 / Iridium 33 (Alt: 790 km - Collision Junction)**
   * *Target Quota:* 16 Items | *Hazards:* Hypervelocity shrapnel ribbons from the historic 2009 collision.
4. **Sector 04: Low-Altitude Breakup (Alt: 950 km - Polar Observation)**
   * *Target Quota:* 18 Items | *Hazards:* Decaying rocket stages, explosive tanks, and rapid orbital decay.
5. **Sector 05: Constellation Corridor (Alt: 850 km - Dense Satellite Belt)**
   * *Target Quota:* 20 Items | *Hazards:* High-density cubesat clusters and kinetic debris.
6. **Sector 06: Fengyun-1C Breakup Cloud (Alt: 865 km - ASAT Shroud)**
   * *Target Quota:* 22 Items | *Hazards:* Over 3,500 tracked hyper-kinetic fragments from the 2007 ASAT test.
7. **Sector 07: GEO Graveyard (Alt: 35,986 km - Geostationary Graveyard)**
   * *Target Quota:* 24 Items | *Hazards:* Nuclear RTG cores emitting battery-draining radiation, huge comms reflectors.
8. **Sector 08: Cascade Finale (Alt: 1,200 km - Kessler Ground Zero)**
   * *Target Quota:* 25 Items | *Hazards:* Maximum-density collision storm combining all orbital threats.

---

## 5. SPACE WEATHER & DONKI STORM HAZARDS

Integrated directly with real space weather phenomena from the **NASA DONKI API**:

### Solar Wind & Atmospheric Drag Surge
* During active space weather (or `storm_season` contracts), high-speed solar wind (>600 km/s) and thermospheric expansion exert continuous physical drag on your craft (`velocity += windAngle * windSpeed * dt`). Adrift debris is accelerated simultaneously, requiring continuous attitude compensation.

### Coronal Plasma EMP Surges
* Periodic coronal shockwaves sweep across the sector with warning sirens and screen flashes.
* **Tactical Faraday Haven:** Sheltering within the Aegis Depot perimeter (`dist <= dockingRadius + 50`) completely grounds the surge with zero damage!
* **Open Space Strike:** Caught in open space, the craft suffers electrostatic damage (-14 HP, -18 Battery base) and an Avionics Single-Event Upset (SEU) causing 1.6s of thruster jitter.

### Electrostatic Charged Debris
* Debris items build electrostatic charge during storms. Direct ungrounded impact delivers a static shock (-6 HP, -10 Bat). Locking your **Magnetic Tractor Beam** safely grounds the charge into your ship's battery, awarding `+25 STATIC GROUNDED` bonus points!

---

## 6. STRATEGIC CAMPAIGN, WORLD CLOCK & ENDINGS

### Interactive Campaign Map (`🗺️ CAMPAIGN MAP`)
* Displays all 8 sectors ordered by altitude with live cleanliness scores (0–100%), asset infrastructure, and active contracts.
* **Sector Tactical Inspector:** Click any sector to view local infrastructure, environmental hazard ratings, and launch direct contract flights or tactical patrols.

### World Clock & 28-Day Solar Cycle
* Tracks campaign progression starting at `2054-04-12 (Day 1)`.
* Advances +7 days on successful contract completion, +12 days on failure, +2 days on resolving storylets, and +2 days on contract solicitations.
* Cycles through 28-day solar rotation phases: `QUIET SUN` (Days 1–18), `ELEVATED SOLAR ACTIVITY` (Days 19–24), and `STORM WARNING: HIGH DENSITY` (Days 25–28).

### 6-Branch Technology Tree (`🔬 TECH RESEARCH`)
Research permanent fleet upgrades using Scrap and raw salvage commodities (`metal`, `cells`, `chips`):
1. **Capture Mechanics:** Auto net loaders & induction coils (+net capacity, tractor intake speed).
2. **Sensors & Telemetry:** Wideband lidar & synthetic aperture radar (+radar multiplier, early hazard warnings).
3. **Power Distribution:** Graphene battery banks & GaAs solar arrays (+max battery pool, +solar recharge rate).
4. **Whipple Shielding:** Ceramic honeycomb matrices & plasma deflectors (+max hull, +impact reduction, +storm surge grounding).
5. **Communications & Logistics:** TDRSS space uplinks & autonomous brokers (+contract payouts, -reroll solicitation costs).
6. **Propulsion & RCS:** Cold-gas verniers & continuous magnetoplasmadynamic drives (+turn rate, -fuel burn rate).

### 12 Narrative Storylets & Asset Registry
* Real historical satellites (ISS, Vanguard 1, Envisat, TDRSS) trigger critical dilemmas between missions.
* Choices alter faction standing across **NASA / Agency**, **Commercial Operators**, and the **Public Science Commons**, with immediate and delayed consequences.

### Four Distinct Campaign Endings
1. **The Kessler Collapse:** Triggered if orbital cleanliness drops below 35%. LEO is rendered permanently unusable.
2. **Commercial Monopoly:** Achieved with high Commercial Rep (>= 80%) and advanced logistics. Private corporations seize monopoly control over orbital tollways.
3. **Military Fortress:** Achieved with high Agency Rep (>= 80%) and defense tech. Near-Earth space is militarized under national defense quarantine.
4. **Orbital Renaissance (Optimal):** Achieved with orbital cleanliness >= 85%, all faction reputations >= 60%, and 12+ tech tiers unlocked. A clean, thriving, cooperative space age!

---

## 7. CASCADE SURVIVAL MODE

* Accessible directly from the Main Menu (`⚡ CASCADE SURVIVAL MODE`) or Campaign Map.
* Endless high-stakes mode where mission time counts upward continuously.
* Escalating cascade waves spawn every 25 seconds, introducing dense shrapnel clouds, unguided booster hulks, and radioactive derelicts.
* Awards tactical survival combat ratings:
  * `< 60s`: `SURVIVOR`
  * `60s – 120s`: `VETERAN`
  * `120s – 180s`: `CASCADE MASTER`
  * `180s+`: `ORBITAL LEGEND`

---

## 8. AEGIS DEPOT DOCKING, RECYCLING & STRIPPING

The Aegis Orbital Depot at the center of the sector is your safe haven:
1. **Fly into the Green Docking Perimeter Ring.**
2. Bring your vessel to a stop or press `E`.
3. Choose **Recycle (100% Scrap & Score)** or **Strip (50% Scrap + Raw Metal/Cells/Chips for Tech Research)**.
4. Docking automatically refills your propellant tanks to 100%, recharges your battery pool, and restores your hull to 100% integrity!

---

## 9. SAVE PERSISTENCE & SAFE NEW CAMPAIGN

* All progress, upgrades, materials, high scores, and campaign state automatically persist in browser `localStorage`.
* **Safe New Campaign:** Clicking `➕ NEW CAMPAIGN` automatically archives your active save to a timestamped backup (`orbital_cleanup_archive_<timestamp>`) in `localStorage` before establishing a fresh campaign seed, ensuring you never accidentally lose past achievements.

---

## 10. SYSTEM REQUIREMENTS & RUNNING LOCALLY

* **Operating System:** Windows, macOS, Linux, ChromeOS.
* **Browser:** Any modern web browser with Web Audio API and HTML5 Canvas support (Google Chrome, Microsoft Edge, Mozilla Firefox, Apple Safari).
* **Local Run:**
  ```bash
  python -m http.server 8080
  ```
  Navigate to `http://localhost:8080`.
