# Changelog & Upgrade Progress Tracking

## [Phase 0 — Stabilize and Fix Existing Bugs] - 2026-11-15
### Status: Completed & Verified

### Bugs Identified & Resolved
1. **Leaderboard Save Bug (Bug Group 1):**
   - *Issue:* `OrbitalStorage.addHighScore()` previously saved updated records, but was immediately overwritten by a trailing `OrbitalStorage.save(save)` holding stale leaderboard data.
   - *Fix:* Unified the mission completion state into a single consistent save operation. Recorded both cleared and failed runs with status. Trimmed sector names to eliminate leading spaces and long strings. Renamed UI header from `Global Vanguard Leaderboard` to `Local Top Runs`. Tagged default pre-seeded entries with `Archive Record`.

2. **Magnetic Tractor Collection (Bug Group 2):**
   - *Issue:* Hardcoded distance check (`dist < 32`) prevented debris from being collected because ship collision radius (~22px) plus debris radius (~16px) exceeded 32px, trapping debris against the hull.
   - *Fix:* Calculated collection threshold dynamically using `playerRadius (22px) + debrisRadius + 12px`. Allowed tractor-pulled debris to enter the intake area without triggering premature collision bounces or collision damage while actively being pulled. Capped pull velocity to 340 px/s to prevent erratic teleportation. Added visual intake indicator ring on ship intake.

3. **Debris Contact Damage (Bug Group 3):**
   - *Issue:* Collisions previously dealt damage on every physics frame while touching, rapidly draining spacecraft health during continuous contact.
   - *Fix:* Implemented relative collision velocity calculation `Math.hypot(relVelX, relVelY)`. Set a 60 px/s threshold so low-speed contacts and resting against debris deal zero damage. Added a 300ms damage cooldown per debris-ship pair. High-speed impacts scale damage proportionally with severity.

4. **Misleading Gameplay Labels & Values (Bug Group 4):**
   - *Payload Handling:* Added `handlingMod: 0.85` to `armored` preset and hooked into `this.turnRate`, making the `-15% Handling` label functional.
   - *Solar Recharge:* Added `solarMod: 1.25` to `high_energy` preset and hooked into `this.batteryRechargeRate`, making the `+25% Solar` label functional.
   - *Hull Upgrade:* Fixed damage reduction calculation from `0.08` to `0.15` per tier (`Math.max(0.25, 1 - hullLvl * 0.15)`) to match the `-15% Impact Damage per tier` specification.
   - *Sensor Upgrade:* Replaced hardcoded 380px warning radius with hazard-specific `warningRadius` scaled by `this.radarMultiplier`.
   - *Nuclear Derelict:* Applied frame-delta battery drain (`h.hazardMeta.batteryDrain * dt`) ensuring accurate per-second drain rate.
   - *De-orbit Mass:* Replaced hardcoded `65kg` multiplier with actual item mass from `GAME_DATA.DEBRIS_TYPES` tracked during recycling.
   - *Port Documentation:* Corrected `README.md` to consistently reference port `8080`.

5. **Physics Body Creation/Destruction Safety (Bug Group 5):**
   - *Issue:* Calling `.destroy()` directly inside Arcade Physics collision and overlap callbacks risked tree corruption.
   - *Fix:* Introduced safe queues (`pendingCollections`, `pendingHazardDestructions`) that disable physics bodies immediately and process removals during the safe update phase (`processPendingPhysicsActions`).

### Testing Performed
- **Node Test Harness:** Validated save loading, migration defaults, payload modifiers, and leaderboard updates.
- **Save Compatibility:** Verified old saves and fresh saves load safely without data loss.
- **Physics & Gameplay Verification:** Confirmed tractor beam collection, non-lethal low-speed nudges, high-speed impact damage, and error-free console execution.
