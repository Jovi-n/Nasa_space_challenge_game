# ORBITAL CLEANUP: MISSION ZERO

A 2D top-down space arcade game built with **Phaser.js**, **HTML5 Canvas**, **CSS3**, and **JavaScript**, combining dynamic arcade spaceflight with real-world orbital debris management concepts and **Mission Design Mode**.

---

## 🚀 Game Overview
Earth's orbit has reached critical debris density (the **Kessler Syndrome** tipping point). As commander of an orbital sanitation spacecraft, your objective is to navigate Earth's orbital lanes, collect discarded satellites, broken solar panels, and spent rocket stages, avoid hyper-velocity kinetic hazards, manage critical fuel and battery reserves, and return collected scrap to the **Aegis Orbital Depot** for recycling.

---

## 🎮 Key Features

### 1. Mission Design Mode (Key Differentiator)
Before launching any mission, plan and customize your mission loadout:
- **Target Orbit Sector:** 
  - *Mission 01: Low Earth Orbit (LEO)* - ISS Protection Corridor (Alt: 420 km)
  - *Mission 02: Sun-Synchronous Polar Orbit* - Earth Observation Graveyard (Alt: 780 km)
  - *Mission 03: Kessler Cascade Zone* - Critical Collision Storm (Alt: 1,200 km)
  - *Mission 04: Geostationary Graveyard* - Operation Cleanse Earth Ring (Alt: 35,786 km)
- **Spacecraft Airframe Selection:**
  - **Aero-Dart (Scout):** Extreme speed and RCS handling, quick solar battery recharge, compact 3-slot cargo bay.
  - **Orbital Mule (Collector):** Balanced speed, durable hull, standard 5-slot cargo bay.
  - **Titan Hauler (Heavy Lifter):** Heavy reinforced hull armor, large 8-slot cargo hold, slower acceleration.
- **Retrieval Equipment:**
  - **Robotic Grapple Arm:** Precision mechanical cable that latches onto targets and reels them into the cargo hold. Lowest battery consumption with a **+35% Scrap Bonus**.
  - **Wide-Angle Capture Net:** Launches an expanding energy mesh that captures multiple small/medium debris pieces within its blast radius simultaneously.
  - **Magnetic Tractor Beam:** Emits a sustained magnetic cone that continuously pulls metallic debris towards the ship intake.
- **Mission Payload Balancing:**
  - *Standard Mission Balance*
  - *Extended Fuel Tank (+40% Fuel, -10% Speed)*
  - *Auxiliary Supercapacitor (+40% Battery, +25% Solar Recharge)*
  - *Nanotube Reinforced Plating (+40% Hull, -15% Handling)*

---

### 2. Spaceflight & Arcade Gameplay
- **Inertial Flight Dynamics:** Authentic top-down space navigation with forward thrust, RCS yaw rotation, and retro-braking.
- **Realistic Debris & Hazards:**
  - *Debris:* Structural Bolts & Shards, Broken Solar Arrays, Research Cubesats, Spent Rocket Boosters, Derelict Comms Satellites, and Prototype Fusion Cores.
  - *Hazards:* High-velocity kinetic micrometeoroids, volatile hypergolic hydrazine tanks, and RTG nuclear satellites with battery-draining radiation fields.
- **Proximity Collision Warning:** Dynamic visual HUD alarm banner and acoustic proximity radar warning against approaching kinetic threats.
- **Aegis Orbital Depot Docking:** Dock inside the station perimeter to offload cargo, convert debris into Scrap Credits & Score, replenish Fuel & Battery reserves, and repair Hull integrity.

---

### 3. Resource Management
- **Fuel:** Consumed by main and retro-thrusters.
- **Battery:** Consumed by equipment (grapple, capture net, continuous tractor beam); recharges via solar panels in orbit.
- **Hull Health:** Decreased by collisions and explosive debris; hull breach alarm sounds when integrity drops below critical levels.
- **Cargo Capacity:** Visual hold display showing filled slots.

---

### 4. Persistent Hangar & Upgrades
Earn **Scrap Credits** from successful deliveries to purchase permanent upgrades saved in **LocalStorage**:
- **Ion-Thruster Efficiency:** Decreases fuel burn rate and boosts cruising velocity.
- **Nanotube Armor Weave:** Increases maximum hull integrity and reduces collision impact damage.
- **Photovoltaic Fusion Cell:** Expands battery pool and accelerates solar recharge rate.
- **Cargo Bay Compression Field:** Adds additional debris storage slots to any ship.
- **Deep-Space Telemetry Radar:** Extends proximity detection range and increases magnetic collection radius.

---

### 5. Web Audio API Procedural Synthesizer
Zero external audio files required. All sound effects and the ambient synth soundtrack are synthesized in real-time:
- Pitch-modulated ion thruster roars
- Pulsating tractor beam graviton hum
- Mechanical grapple clamp and cable sounds
- Pentatonic melodic debris collection chimes
- Station docking and recycling processing audio
- Proximity warning alarms and collision thuds
- Atmospheric deep-space ambient music drone

---

## 🕹️ Controls

| Key | Action |
| --- | --- |
| `W` or `▲ Up Arrow` | Main Forward Propulsion Thruster |
| `A` / `D` or `◄` / `►` | RCS Yaw Steering (Rotate Spacecraft) |
| `S` or `▼ Down Arrow` | Retro-Thrusters (Active Braking) |
| `SPACEBAR` | Activate Collection Equipment (Grapple / Net / Tractor Beam) |
| `E` or Hold Position | Dock & Recycle at Aegis Orbital Depot |
| `P` or `ESC` | Pause Mission Menu |

---

## 📁 File Structure

```
├── index.html          # Game entry point, menus, HUD overlay & debriefing modals
├── css/
│   └── style.css       # Sci-fi glassmorphism cyberpunk styling & animations
├── js/
│   ├── audio.js        # Web Audio API sound & ambient music synthesizer
│   ├── data.js         # Ships, equipment, missions, upgrades & LocalStorage
│   ├── graphics.js     # High-resolution procedural canvas sprite generator
│   ├── game.js         # Phaser 3 Game Scene, physics, equipment & docking
│   └── ui.js           # UI controller, Mission Design Mode, Hangar & HUD binder
└── README.md           # Game documentation & flight manual
```

---

## 💻 How to Run Locally

Simply double-click or open `index.html` in any modern web browser (Google Chrome, Microsoft Edge, Firefox, Safari).

Alternatively, run a simple local web server:
```bash
# Python 3
python -m http.server 8080

# Node.js
npx serve
```
Then navigate to `http://localhost:8080`.

