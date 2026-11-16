# Phase 8b: Campaign Decisions, Dilemmas & Storylets Documentation

## Overview & Architecture
Phase 8b introduces a deep, branching narrative dilemma layer on top of the Phase 8a persistent campaign system. The storylet engine models the high-stakes political, ethical, and economic choices faced by an independent orbital debris remediation vanguard.

Key systems:
1. **Asset Registry**: Tracked orbital infrastructure, scientific observatories, and high-value derelicts with dynamic operational condition and status.
2. **Storylet Engine (`data/storylets.js`)**: 12 structured dilemmas (8 contract storylets + 4 follow-up storylets) featuring immediate and delayed consequences, reputation shifts, resource trade-offs, and flag-based progression.
3. **Non-Repetition & Persistence**: Resolved storylets are recorded in `save.resolvedStorylets` and logged in `save.decisionHistory`, persisting across browser sessions and game reloads.

---

## Orbital Asset Registry

The Asset Registry tracks 12 strategic objects across low Earth orbit, polar inclinations, sun-synchronous tracks, and the geostationary graveyard:

| Asset ID | Name | Sector | Type | Default Status | Faction | Value | Description |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| `aegis_depot_alpha` | **Aegis Depot Alpha** | 01 | Infrastructure | `nominal` | Agency | 5,000 | Primary forward staging harbor and automated propellant/battery replenishment depot. |
| `iss_heritage_habitat` | **ISS Heritage Module** | 01 | Heritage | `nominal` | Public | 2,400 | Retired space station habitat module preserved as a cultural monument to human spaceflight. |
| `vanguard_1_probe` | **Vanguard 1 Heritage Probe** | 01 | Heritage | `nominal` | Public | 1,200 | Oldest artificial object surviving in Earth orbit (1958). Supreme historical and educational value. |
| `starlink_cluster_74` | **Starlink Cluster 74** | 02 | Satellite | `nominal` | Commercial | 1,800 | Dense commercial broadband communications train traversing polar insertion lanes. |
| `tiangong_cargo_hulk` | **Tianzhou Cargo Hulk** | 02 | Derelict | `damaged` | Agency | 1,600 | Spent automated resupply freighter containing residual propellant and structural alloys. |
| `envisat_derelict` | **Envisat Earth Observer** | 03 | Derelict | `endangered` | Agency | 3,200 | 8.2-ton inert ESA satellite in Sun-Synchronous LEO; prime candidate for catastrophic cascade. |
| `starlink_38_debris_field` | **Decaying SmallSat Cloud-38** | 04 | Derelict | `decaying` | Commercial | 1,100 | 38 micro-satellites trapped in severe thermospheric drag after a major geomagnetic solar storm. |
| `fengyun_1c_fragment_alpha` | **Fengyun-1C Kinetic Shard** | 05 | Derelict | `hazardous` | Agency | 800 | High-density titanium projectile shard traveling on hypervelocity crossing orbit (2007 ASAT). |
| `cosmos_2251_hull_core` | **Cosmos 2251 Collision Core** | 06 | Derelict | `hazardous` | Agency | 1,400 | Reactor-bearing structural section from the historic 2009 Iridium-33 / Cosmos-2251 collision. |
| `classified_quantum_satellite`| **Project Chronos Platform** | 07 | Satellite | `endangered` | Agency | 4,500 | Black-budget cryptographic platform equipped with experimental quantum computing capacitors. |
| `tdrss_relay_omega` | **TDRSS Relay Omega** | 07 | Infrastructure | `nominal` | Agency | 2,800 | High-bandwidth geostationary tracking satellite maintaining continuous telemetry links. |
| `kessler_cascade_origin` | **Kessler Ground Zero Junction**| 08 | Infrastructure | `endangered` | Public | 6,000 | Peak spatial density intersection (850 km); epicentre of orbital cascade chain reactions. |

---

## 1. Contract Storylets (8 Storylets)

### STORYLET_01: Derelict Flight Recorder Dilemma
- **Sector**: 01 (LEO Station Corridor)
- **Asset**: `tiangong_cargo_hulk`
- **Trigger Conditions**: `reputation.agency >= 40 || reputation.commercial >= 40`, un-resolved.
- **Dossier**: While sweeping debris, sensors detect an intact cryptographic flight recorder inside a tumbling derelict. The telemetry contains proprietary commercial collision avoidance logs and classified sensor tracks.
- **Choices**:
  - **Choice A (Sell to Commercial Telecom)**:
    - *Stakes*: `+350 Scrap`, `+1 Chips`, `+12 Commercial Rep`, `-6 Agency Rep`.
    - *Flags*: Sets `campaignFlags.derelict_sold_to_commercial = true`.
    - *Delayed Consequence*: Commercial operators grant future orbital insurance discount buffers.
  - **Choice B (Release to Open Civil Registry)**:
    - *Stakes*: `+100 Scrap`, `+15 Public Rep`, `+8 Agency Rep`, `-10 Commercial Rep`.
    - *Flags*: Sets `campaignFlags.derelict_open_source = true`.
    - *Delayed Consequence*: Unlocks follow-up **STORYLET_09: Open Source Constellation Beacon**.
  - **Choice C (Strip Recorder for Raw Materials)**:
    - *Stakes*: `+3 Metal`, `+2 Chips`, `+150 Scrap`.
    - *Flags*: Sets `campaignFlags.derelict_scrapped = true`.
    - *Delayed Consequence*: Pure workshop materials gain with zero political fallout.

---

### STORYLET_02: Envisat De-Orbit Treaty Conflict
- **Sector**: 03 (Sun-Synchronous Disaster)
- **Asset**: `envisat_derelict`
- **Trigger Conditions**: `unlockedLevels >= 3 || sectorHealth.sector_03 <= 65`, un-resolved.
- **Dossier**: ESA warns that the 8.2-ton Envisat derelict has an intersecting track with an ASAT fragment swarm. If struck, Envisat will trigger an immediate Kessler cascade across Sun-Synchronous orbit.
- **Choices**:
  - **Choice A (Divert Fuel for Emergency Nudge)**:
    - *Cost / Stakes*: `-100 Scrap`, `+18 Agency Rep`, `+10 Public Rep`, `+15 Sector 03 Health`.
    - *Asset Update*: `envisat_derelict.status = 'secured'`.
    - *Flags*: Sets `campaignFlags.envisat_safeguarded = true`.
    - *Delayed Consequence*: Unlocks follow-up **STORYLET_10: ESA Deep Space Clean Grant**.
  - **Choice B (Strip ASAR Radar Array for Profit)**:
    - *Stakes*: `+500 Scrap`, `+3 Chips`, `+4 Metal`, `-20 Agency Rep`, `+10 Commercial Rep`, `+4 Sector 03 Carryover Debris`.
    - *Asset Update*: `envisat_derelict.status = 'salvaged'`.
    - *Flags*: Sets `campaignFlags.envisat_stripped = true`.
    - *Delayed Consequence*: Increased collision risk in Sector 03 and diplomatic protest from ESA.
  - **Choice C (Refuse Mission: Excessive Risk)**:
    - *Stakes*: `-8 Public Rep`, `-5 Agency Rep`.
    - *Flags*: Sets `campaignFlags.envisat_abandoned = true`.
    - *Delayed Consequence*: Envisat continues uncontrolled drift; sector health remains volatile.

---

### STORYLET_03: Starlink Constellation Squeeze
- **Sector**: 02 (Polar Orbit Insertion)
- **Asset**: `starlink_cluster_74`
- **Trigger Conditions**: `reputation.commercial >= 45`, un-resolved.
- **Dossier**: AeroSat Telecom asks your vanguard to prioritize clearing micro-debris tracks surrounding their commercial constellation train, proposing to lock out civil research launches from the lane.
- **Choices**:
  - **Choice A (Accept Exclusive Commercial Contract)**:
    - *Stakes*: `+400 Scrap`, `+16 Commercial Rep`, `-14 Public Rep`.
    - *Flags*: Sets `campaignFlags.commercial_favored = true`.
    - *Delayed Consequence*: Civil space advocates protest corporate monopolization of LEO.
  - **Choice B (Enforce Equal Public Shipping Access)**:
    - *Stakes*: `+180 Scrap`, `+14 Public Rep`, `+10 Agency Rep`, `-15 Commercial Rep`.
    - *Flags*: Sets `campaignFlags.public_corridor_protected = true`.
    - *Delayed Consequence*: Unlocks follow-up **STORYLET_11: Public Crowdfunded Clean-Up Fleet**.
  - **Choice C (Demand Emergency Surcharge)**:
    - *Requirement*: `reputation.commercial >= 60`.
    - *Stakes*: `+650 Scrap`, `-5 Commercial Rep`.
    - *Flags*: Sets `campaignFlags.commercial_extorted = true`.
    - *Delayed Consequence*: AeroSat reluctantly pays emergency tariff but monitors billing closely.

---

### STORYLET_04: Vanguard 1 Historic Heritage Protocol
- **Sector**: 01 (LEO Station Corridor)
- **Asset**: `vanguard_1_probe`
- **Trigger Conditions**: `sectorHealth.sector_01 <= 90`, un-resolved.
- **Dossier**: Vanguard 1, launched in 1958 and the oldest artifact in space, is drifting into an active debris cluster in Sector 1. A collision would pulverize 70 years of aerospace history.
- **Choices**:
  - **Choice A (Precision Graveyard Insertion)**:
    - *Cost / Stakes*: `-80 Scrap`, `-1 Metal`, `+20 Public Rep`, `+15 Agency Rep`.
    - *Asset Update*: `vanguard_1_probe.status = 'secured'`.
    - *Flags*: Sets `campaignFlags.vanguard_preserved = true`.
    - *Delayed Consequence*: Unlocks follow-up **STORYLET_12: Smithsonian Heritage Exhibition Endowment**.
  - **Choice B (Tractor and Recycle for Scrap)**:
    - *Stakes*: `+300 Scrap`, `-25 Public Rep`, `-15 Agency Rep`.
    - *Asset Update*: `vanguard_1_probe.status = 'salvaged'`.
    - *Flags*: Sets `campaignFlags.vanguard_destroyed = true`.
    - *Delayed Consequence*: Permanent public reputation penalty; aerospace historians condemn the loss.
  - **Choice C (Broadcast Civilian Amateur Tracking)**:
    - *Stakes*: `+6 Public Rep`, `-4 Agency Rep`.
    - *Flags*: Sets `campaignFlags.vanguard_ignored = true`.
    - *Delayed Consequence*: Vanguard 1 narrowly dodges fragments autonomously.

---

### STORYLET_05: Toxic Hydrazine Upper-Stage Breach
- **Sector**: 02 (Polar Orbit Insertion)
- **Asset**: `tiangong_cargo_hulk`
- **Trigger Conditions**: `unlockedLevels >= 2`, un-resolved.
- **Dossier**: A spent rocket upper-stage is venting pressurized toxic hypergolic hydrazine in Sector 2. Solar thermal heating threatens to rupture the main propellant tank into a fragmentation cloud.
- **Choices**:
  - **Choice A (Deploy Cryogenic Metal Seal)**:
    - *Cost / Stakes*: `-2 Metal`, `+150 Scrap`, `+18 Sector 02 Health`, `+12 Public Rep`, `+10 Agency Rep`.
    - *Flags*: Sets `campaignFlags.hydrazine_sealed = true`.
    - *Delayed Consequence*: Sector 02 stabilized; venting rocket hazards neutralized in sector.
  - **Choice B (Controlled Laser Detonation)**:
    - *Stakes*: `+250 Scrap`, `-15 Sector 02 Health`, `+6 Sector 02 Carryover Debris`, `-12 Agency Rep`.
    - *Flags*: Sets `campaignFlags.hydrazine_exploded = true`.
    - *Delayed Consequence*: Dense cloud conditions persist across Sector 02.
  - **Choice C (Declare Orbital Exclusion Zone)**:
    - *Stakes*: `-8 Commercial Rep`, `+4 Public Rep`.
    - *Flags*: Sets `campaignFlags.sector_quarantined = true`.
    - *Delayed Consequence*: Flight delays and commercial insurance surcharges across polar routes.

---

### STORYLET_06: Cold War RTG Nuclear Satellite Alert
- **Sector**: 06 (Iridium-Cosmos Shell)
- **Asset**: `cosmos_2251_hull_core`
- **Trigger Conditions**: `unlockedLevels >= 5 || sectorHealth.sector_06 <= 50`, un-resolved.
- **Dossier**: Radiation monitors detect gamma and neutron flux leaking from a tumbling Cold War reconnaissance satellite in Sector 6.
- **Choices**:
  - **Choice A (Fabricate Tungsten Radiation Shroud)**:
    - *Cost / Stakes*: `-2 Metal`, `+20 Agency Rep`, `+16 Public Rep`, `+20 Sector 06 Health`.
    - *Asset Update*: `cosmos_2251_hull_core.status = 'secured'`.
    - *Flags*: Sets `campaignFlags.rtg_safely_isolated = true`.
    - *Delayed Consequence*: Radioactive hazard permanently removed from Sector 06.
  - **Choice B (Harvest High-Energy Thermocouple Cells)**:
    - *Stakes*: `+4 Cells`, `+200 Scrap`, `-18 Public Rep`, `-10 Agency Rep`.
    - *Asset Update*: `cosmos_2251_hull_core.status = 'salvaged'`.
    - *Flags*: Sets `campaignFlags.rtg_harvested = true`.
    - *Delayed Consequence*: Unlocks high-capacity cells for workshop upgrades; regulators investigate.
  - **Choice C (Log Flight Record and Evade)**:
    - *Stakes*: `-8 Public Rep`.
    - *Flags*: Sets `campaignFlags.rtg_ignored = true`.
    - *Delayed Consequence*: Radiation zone remains active on navigational hazard radar.

---

### STORYLET_07: Geomagnetic Storm Starlink Evacuation
- **Sector**: 04 (Low-Altitude Breakup)
- **Asset**: `starlink_38_debris_field`
- **Trigger Conditions**: `unlockedLevels >= 4 || activeContract.modifiers.includes('storm_season')`, un-resolved.
- **Dossier**: A severe NASA DONKI G5 geomagnetic storm has heated and expanded the thermosphere. 38 micro-satellites are decelerating rapidly and will burn up within hours unless boosted.
- **Choices**:
  - **Choice A (Emergency Re-Boost Mission)**:
    - *Cost / Stakes*: `-150 Scrap`, `+25 Commercial Rep`, `+15 Public Rep`, `+22 Sector 04 Health`.
    - *Asset Update*: `starlink_38_debris_field.status = 'secured'`.
    - *Flags*: Sets `campaignFlags.starlink_storm_rescue = true`.
    - *Delayed Consequence*: Commercial clients grant priority high-payout contracts.
  - **Choice B (Scavenge Falling Satellite Hardware)**:
    - *Stakes*: `+450 Scrap`, `+3 Metal`, `+2 Chips`, `-22 Commercial Rep`.
    - *Flags*: Sets `campaignFlags.storm_scavenged = true`.
    - *Delayed Consequence*: Commercial satellite operators file insurance litigation against salvagers.
  - **Choice C (Hunker in Aegis Depot Faraday Haven)**:
    - *Stakes*: `0 Cost`, `+15 Spacecraft Hull Repair`, `-5 Commercial Rep`.
    - *Flags*: Sets `campaignFlags.storm_hunkered = true`.
    - *Delayed Consequence*: Craft avoids all space-weather hazard damage.

---

### STORYLET_08: Whistleblower Black Budget Derelict
- **Sector**: 07 (GEO Graveyard)
- **Asset**: `classified_quantum_satellite`
- **Trigger Conditions**: `unlockedLevels >= 6 || reputation.agency >= 60`, un-resolved.
- **Dossier**: An uncatalogued stealth platform in the GEO Graveyard holds hard drives revealing illegal kinetic orbital strike weapons disguised as civilian communications research.
- **Choices**:
  - **Choice A (Transmit Leak to UN Space Watch)**:
    - *Stakes*: `+100 Scrap`, `+30 Public Rep`, `-25 Agency Rep`, `-10 Commercial Rep`.
    - *Flags*: Sets `campaignFlags.black_budget_exposed = true`.
    - *Delayed Consequence*: UN-OOSA ratifies international orbital demilitarization treaty.
  - **Choice B (Return Discreetly to Defense Command)**:
    - *Stakes*: `+800 Scrap`, `+25 Agency Rep`, `-20 Public Rep`.
    - *Flags*: Sets `campaignFlags.black_budget_covered = true`.
    - *Delayed Consequence*: Classified military contractor bounties added to contract pool.
  - **Choice C (Auction Schematics to Corporate Rivals)**:
    - *Stakes*: `+1200 Scrap`, `+3 Chips`, `+18 Commercial Rep`, `-35 Agency Rep`, `-30 Public Rep`.
    - *Flags*: Sets `campaignFlags.black_budget_blackmailed = true`.
    - *Delayed Consequence*: Intelligence agencies place your vessel on strategic alert watchlists.

---

## 2. Follow-Up Storylets (4 Storylets)

### STORYLET_09: Open Source Constellation Beacon
- **Origin**: Follow-up to **STORYLET_01 Choice B** (`derelict_open_source === true`).
- **Asset**: `tdrss_relay_omega`
- **Dossier**: Global amateur astronomers have networked their ground dishes into a decentralized open-source orbital radar mesh using your released telemetry logs.
- **Choices**:
  - **Choice A (Sync Ship Sensors with Civilian Mesh)**:
    - *Stakes*: Permanently grants `+15% Sensor Radar Range`, `+12 Public Rep`.
    - *Flags*: Sets `campaignFlags.open_source_radar_active = true`.
  - **Choice B (Commercialize Real-Time Feed)**:
    - *Stakes*: `+450 Scrap`, `+15 Commercial Rep`, `-8 Public Rep`.
    - *Flags*: Sets `campaignFlags.radar_monetized = true`.

---

### STORYLET_10: ESA Deep Space Clean Grant
- **Origin**: Follow-up to **STORYLET_02 Choice A** (`envisat_safeguarded === true`).
- **Asset**: `envisat_derelict`
- **Dossier**: For saving Envisat from destruction, the European Space Agency awards your vanguard their prestigious Clean Space Excellence Grant.
- **Choices**:
  - **Choice A (Accept R&D Blueprints & Advanced Cells)**:
    - *Stakes*: `+300 Scrap`, `+3 Cells`, `+2 Chips`, `+15 Agency Rep`.
    - *Flags*: Sets `campaignFlags.esa_ion_thrusters = true`.
  - **Choice B (Establish Permanent Sun-Sync Safety Hub)**:
    - *Stakes*: `+25 Sector 03 Health`, `+20 Agency Rep`, `+15 Public Rep`.
    - *Flags*: Sets `campaignFlags.esa_monitoring_hub = true`.

---

### STORYLET_11: Public Crowdfunded Clean-Up Fleet
- **Origin**: Follow-up to **STORYLET_03 Choice B** (`public_corridor_protected === true`).
- **Asset**: `iss_heritage_habitat`
- **Dossier**: Your defense of public orbital shipping corridors captured global headlines. Over 200,000 citizens have pooled crowdfunding donations to support your fleet.
- **Choices**:
  - **Choice A (Accept Community Repair Fund)**:
    - *Stakes*: `+500 Scrap`, `+4 Metal`, `+15 Public Rep`.
    - *Flags*: Sets `campaignFlags.crowdfund_accepted = true`.
  - **Choice B (Subsidize University CubeSat De-Orbiting)**:
    - *Stakes*: `+28 Public Rep`, `+12 Agency Rep`, `+15 Sector 01 Health`, `+15 Sector 02 Health`.
    - *Flags*: Sets `campaignFlags.smallsats_cleared = true`.

---

### STORYLET_12: Smithsonian Heritage Exhibition Endowment
- **Origin**: Follow-up to **STORYLET_04 Choice A** (`vanguard_preserved === true`).
- **Asset**: `vanguard_1_probe`
- **Dossier**: In recognition of your preservation of Vanguard 1, the Smithsonian National Air and Space Museum establishes a permanent endowment honoring your spacecraft.
- **Choices**:
  - **Choice A (Accept Perpetual Exhibition Endowment)**:
    - *Stakes*: `+400 Scrap`, `+20 Public Rep`, `+15 Agency Rep`, **50% Cheaper Contract Rerolls (25 Scrap)**.
    - *Flags*: Sets `campaignFlags.smithsonian_endowed = true`.
  - **Choice B (Exchange Endowment for Surplus Aerospace Alloys)**:
    - *Stakes*: `+6 Metal`, `+3 Cells`, `+150 Scrap`, `+10 Commercial Rep`.
    - *Flags*: Sets `campaignFlags.museum_materials_granted = true`.

---

## State Persistence & Non-Repetition

- **`save.resolvedStorylets`**: An array of unique storylet IDs. Once resolved, `StoryletManager.getEligibleStorylet()` skips the storylet permanently.
- **`save.decisionHistory`**: An audit trail of past choices with timestamp, title, choice label, immediate consequences, and narrative resolution.
- **`save.assetRegistry`**: Object tracking current conditions (`nominal`, `secured`, `endangered`, `salvaged`, `decaying`, `hazardous`) for all 12 assets.
- **Backwards Compatibility**: Legacy saves are migrated seamlessly via `OrbitalStorage.migrateToV2()` with default assets and initialized storylet state.
