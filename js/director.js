/**
 * ORBITAL CLEANUP: MISSION ZERO - MISSION INTENSITY & PACING DIRECTOR
 * 
 * Phase 5 AI Flight Director:
 * 1. Computes dynamic tension score (0-100) based on hull, fuel, battery,
 *    hazard proximity, Kessler risk, and mission stage.
 * 2. Drives 4 distinct mission stages: CALM, COMPLICATION, CRISIS, and CLIMAX.
 * 3. Enforces the 15-second first threat rule and orchestrates meaningful
 *    tactical/narrative events approximately every 5-8 seconds.
 * 4. Manages Kessler cascade failure countdown and risk influence.
 * 5. Handles capture combos, near-miss bonuses, and perfect docking bonuses.
 * 6. Renders the interactive F3 tactical telemetry debug overlay.
 */

class MissionDirector {
    constructor(scene) {
        this.scene = scene;
        this.tension = 15;
        this.smoothedTension = 15;
        this.currentStage = 'CALM';
        this.stageStartTime = 0;

        // Pacing & event timing
        this.eventTimer = 0;
        this.nextEventInterval = 6.0; // 5 - 8 seconds
        this.firstThreatSpawned = false;
        this.firstThreatTargetTime = 12.0; // Guaranteed within 15 seconds

        // Cascade failure state
        this.cascadeActive = false;
        this.cascadeCountdown = 5.0; // Default standard grace period

        // Combos & Skill Bonuses
        this.comboCount = 0;
        this.comboTimer = 0;
        this.nearMissCheckedHazards = new WeakSet();

        // Debug overlay (F3)
        this.debugVisible = false;
        this.debugContainer = null;

        // Difficulty configuration
        this.difficultyKey = (scene.missionConfig && scene.missionConfig.difficulty) || 
                             (window.OrbitalStorage ? window.OrbitalStorage.load().selectedDifficulty : 'standard') || 
                             'standard';
        this.difficulty = (window.GAME_DATA && window.GAME_DATA.DIFFICULTIES && window.GAME_DATA.DIFFICULTIES[this.difficultyKey]) || {
            id: 'standard',
            name: 'STANDARD',
            fuelBurnMultiplier: 1.0,
            damageMultiplier: 1.0,
            hazardSpeedMultiplier: 1.0,
            timeLimitMultiplier: 1.0,
            scoreMultiplier: 1.0,
            kesslerGracePeriod: 5.0
        };

        this.cascadeCountdown = this.difficulty.kesslerGracePeriod || 5.0;

        // Setup Telemetry key listeners (F3, T, and Backquote/Tilde)
        if (scene.input && scene.input.keyboard) {
            this.keyF3 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F3);
            this.keyT = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
            this.keyTilde = scene.input.keyboard.addKey(192);
        }
    }

    /**
     * Main Director update tick
     */
    update(dt) {
        if (!this.scene || this.scene.isMissionOver) return;

        const elapsedTime = this.scene.elapsedTime || 0;
        const totalTime = this.scene.missionConfig ? this.scene.missionConfig.timeLimit : 180;
        const targetQuota = this.scene.missionConfig ? this.scene.missionConfig.targetQuota : 10;
        const quotaProgress = (this.scene.debrisDeliveredCount || 0) / Math.max(1, targetQuota);
        const timeProgress = elapsedTime / Math.max(1, totalTime);

        // 1. Calculate Mission Stage (CALM, COMPLICATION, CRISIS, CLIMAX)
        this.updateMissionStage(quotaProgress, timeProgress);

        // 2. Compute Dynamic Tension Score (0 - 100)
        this.computeTensionScore(dt);

        // 3. Pacing & Event Scheduler (Every 5-8s & First threat <= 15s)
        this.updatePacing(dt, elapsedTime);

        // 4. Cascade Failure Countdown & Kessler Influence
        this.updateKesslerCascade(dt);

        // 5. Combo Decay Timer
        if (this.comboCount > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.comboCount = 0;
            }
        }

        // 6. Near-Miss Hazard Detection
        this.checkNearMisses();

        // 7. Check Telemetry Keys (F3, T, or `)
        const pressF3 = this.keyF3 && Phaser.Input.Keyboard.JustDown(this.keyF3);
        const pressT = this.keyT && Phaser.Input.Keyboard.JustDown(this.keyT);
        const pressTilde = this.keyTilde && Phaser.Input.Keyboard.JustDown(this.keyTilde);
        if (pressF3 || pressT || pressTilde) {
            if (!this._lastF3ToggleTime || (Date.now() - this._lastF3ToggleTime > 250)) {
                this.toggleDebugOverlay();
            }
        }

        // 8. Render Debug Overlay if active
        if (this.debugVisible) {
            this.renderDebugOverlay();
        }
    }

    /**
     * Determines the dramatic mission stage
     */
    updateMissionStage(quotaProgress, timeProgress) {
        const overallProgress = Math.max(quotaProgress, timeProgress * 0.9);
        let newStage = 'CALM';

        if (overallProgress >= 0.85 || (this.scene.targetQuota - this.scene.debrisDeliveredCount <= 2)) {
            newStage = 'CLIMAX';
        } else if (overallProgress >= 0.55) {
            newStage = 'CRISIS';
        } else if (overallProgress >= 0.25) {
            newStage = 'COMPLICATION';
        } else {
            newStage = 'CALM';
        }

        if (newStage !== this.currentStage) {
            const prevStage = this.currentStage;
            this.currentStage = newStage;
            this.stageStartTime = this.scene.elapsedTime;
            this.onStageTransition(prevStage, newStage);
        }
    }

    /**
     * Triggered on dramatic stage change
     */
    onStageTransition(fromStage, toStage) {
        this.scene.logFlightEvent('STAGE CHANGE', `Mission phase elevated to ${toStage}.`, 'warn');
        this.scene.activeEventAlert = `[MISSION PHASE: ${toStage}]`;
        this.scene.eventAlertTimer = 4.0;

        if (window.soundSystem?.playStageTransition) {
            window.soundSystem.playStageTransition(toStage);
        } else if (window.soundSystem?.playAlert) {
            window.soundSystem.playAlert();
        }

        // Adjust director pacing interval per stage
        if (toStage === 'CLIMAX') {
            this.nextEventInterval = Phaser.Math.FloatBetween(4.5, 6.5);
        } else if (toStage === 'CRISIS') {
            this.nextEventInterval = Phaser.Math.FloatBetween(5.0, 7.0);
        } else if (toStage === 'COMPLICATION') {
            this.nextEventInterval = Phaser.Math.FloatBetween(5.5, 7.5);
        } else {
            this.nextEventInterval = Phaser.Math.FloatBetween(6.0, 8.0);
        }
    }

    /**
     * Computes the mathematical tension score (0 - 100)
     */
    computeTensionScore(dt) {
        const scene = this.scene;
        if (!scene.player) return;

        // A. Hull Deficit: 0 to 28 pts
        const maxHull = scene.maxHull || 100;
        const hullRatio = Math.max(0, Math.min(1, (scene.hull || 0) / maxHull));
        const hullTension = (1 - hullRatio) * 28;

        // B. Propellant Margin: 0 to 22 pts
        const maxFuel = scene.maxFuel || 100;
        const fuelRatio = Math.max(0, Math.min(1, (scene.fuel || 0) / maxFuel));
        const fuelTension = (1 - fuelRatio) * 22;

        // C. Battery Capacity: 0 to 14 pts
        const maxBat = scene.maxBattery || 100;
        const batRatio = Math.max(0, Math.min(1, (scene.battery || 0) / maxBat));
        const batTension = (1 - batRatio) * 14;

        // D. Kessler Risk: 0 to 24 pts
        const kRisk = Math.max(0, Math.min(100, scene.kesslerRisk || 0));
        const kesslerTension = (kRisk / 100) * 24;

        // E. Stage Weight: 0 to 20 pts
        let stageWeight = 0;
        if (this.currentStage === 'COMPLICATION') stageWeight = 6;
        else if (this.currentStage === 'CRISIS') stageWeight = 14;
        else if (this.currentStage === 'CLIMAX') stageWeight = 20;

        // F. Proximity Threat Bonus: 0 or 12 pts
        const proximityTension = scene.warningActive ? 12 : 0;

        // G. Time Limit Pressure: up to 12 pts when under 35s
        let timeTension = 0;
        if (scene.missionTime < 35) {
            timeTension = (1 - Math.max(0, scene.missionTime) / 35) * 12;
        }

        const rawTension = Phaser.Math.Clamp(
            hullTension + fuelTension + batTension + kesslerTension + stageWeight + proximityTension + timeTension,
            0,
            100
        );

        // Smooth tension with interpolation
        this.smoothedTension = Phaser.Math.Linear(this.smoothedTension, rawTension, dt * 2.2);
        this.tension = Math.round(this.smoothedTension);
    }

    /**
     * Manages event pacing: ensures first threat <= 15s, and events every 5-8s
     */
    updatePacing(dt, elapsedTime) {
        const scene = this.scene;

        // 1. Enforce first meaningful threat within 15 seconds
        if (!this.firstThreatSpawned && elapsedTime >= this.firstThreatTargetTime) {
            this.firstThreatSpawned = true;
            this.firstThreatTime = Math.round(elapsedTime);
            this.spawnFirstMeaningfulThreat();
            this.eventTimer = 0;
            this.nextEventInterval = Phaser.Math.FloatBetween(5.5, 7.5);
        }

        // 2. Regular Event Pacing (5 - 8 seconds)
        this.eventTimer += dt;
        if (this.eventTimer >= this.nextEventInterval) {
            this.eventTimer = 0;
            this.triggerPacedEvent();

            // Calibrate next interval based on tension:
            // If tension is extremely high (> 80), grant brief breathing room (+1.5s)
            // If tension is low (< 35) in Crisis/Climax, speed up slightly
            let baseMin = 5.0;
            let baseMax = 8.0;
            if (this.tension > 80) {
                baseMin = 6.5;
                baseMax = 8.5;
            } else if (this.tension < 35 && (this.currentStage === 'CRISIS' || this.currentStage === 'CLIMAX')) {
                baseMin = 4.8;
                baseMax = 6.5;
            }
            this.nextEventInterval = Phaser.Math.FloatBetween(baseMin, baseMax);
        }
    }

    /**
     * Spawns the guaranteed first threat within 15s
     */
    spawnFirstMeaningfulThreat() {
        const scene = this.scene;
        if (!scene || !scene.hazardGroup) return;

        const allowedHazards = scene.missionConfig.hazardTypes || ['hidden_debris'];
        const hazardKey = allowedHazards[0] || 'hidden_debris';

        scene.logFlightEvent('FIRST CONTACT', `Initial orbital hazard detected on radar at T+${this.firstThreatTime}s.`, 'warn');
        scene.spawnSpecificHazard(hazardKey);
    }

    /**
     * Triggers a meaningful tactical or narrative event approximately every 5-8s
     */
    triggerPacedEvent() {
        const scene = this.scene;
        if (!scene || scene.isMissionOver) return;

        // 1. Check if an un-triggered scripted event from MISSIONS_DATA is due
        let triggeredScripted = false;
        if (scene.missionConfig && scene.missionConfig.scriptedEvents) {
            for (let i = 0; i < scene.missionConfig.scriptedEvents.length; i++) {
                const evt = scene.missionConfig.scriptedEvents[i];
                if (!scene.triggeredScriptedEvents.has(i) && Math.abs(scene.elapsedTime - evt.time) < 6.0) {
                    scene.triggeredScriptedEvents.add(i);
                    scene.triggerScriptedEvent(evt);
                    triggeredScripted = true;
                    break;
                }
            }
        }
        if (triggeredScripted) return;

        // 2. Otherwise generate a dynamic context-sensitive tactical event
        const activeHazards = scene.hazardGroup ? scene.hazardGroup.countActive(true) : 0;
        const maxHazards = scene.missionConfig.maxHazards || 3;
        const roll = Math.random();

        if (this.currentStage === 'CALM') {
            // Calm: Debris clusters, orbital drift advisories
            if (roll < 0.60) {
                scene.spawnDebrisCluster(2, scene.player.x, scene.player.y);
                scene.logFlightEvent('TACTICAL', 'Localized debris cluster identified on flight path.', 'info');
            } else {
                scene.logFlightEvent('TELEMETRY', 'Attitude and propulsion nominal. Continue sector survey.', 'info');
            }
        } else if (this.currentStage === 'COMPLICATION') {
            // Complication: Occasional hazards, debris clusters, minor solar/drag disturbances
            if (roll < 0.45 && activeHazards < maxHazards) {
                scene.spawnHazardItem();
                scene.logFlightEvent('HAZARD INBOUND', 'Rogue orbital element crossing trajectory.', 'warn');
            } else if (roll < 0.80) {
                scene.spawnDebrisCluster(3, scene.player.x, scene.player.y);
                scene.logFlightEvent('SWEEP TARGETS', 'Fresh structural fragments detected nearby.', 'info');
            } else {
                scene.logFlightEvent('ORBIT DYNAMICS', 'Doppler velocity shift detected in crossing plane.', 'info');
            }
        } else if (this.currentStage === 'CRISIS') {
            // Crisis: Denser hazard passes, drag surges, solar pulses
            if (roll < 0.55 && activeHazards < maxHazards) {
                scene.spawnHazardItem();
                scene.logFlightEvent('WARNING', 'Multiple crossing tracks detected on long-range radar.', 'warn');
            } else if (roll < 0.80) {
                scene.spawnDebrisCluster(2, scene.player.x, scene.player.y);
                scene.kesslerRisk = Math.min(100, scene.kesslerRisk + 2);
                scene.logFlightEvent('KESSLER ELEVATION', 'Spatial debris density rising in corridor (+2% Risk).', 'warn');
            } else {
                scene.logFlightEvent('TELEMETRY CRITICAL', 'Elevated orbital collision probability. Maintain evasion readiness.', 'warn');
            }
        } else {
            // Climax: Rapid hazard passes, emergency countdowns, priority clusters
            if (roll < 0.60 && activeHazards < maxHazards) {
                scene.spawnHazardItem();
                scene.logFlightEvent('CLIMAX ALERT', 'High-speed hazard crossing perimeter! Evade or [Q] Nudge.', 'warn');
            } else {
                scene.spawnDebrisCluster(3, scene.player.x, scene.player.y);
                scene.logFlightEvent('FINAL HARVEST', 'Priority debris cluster ready for immediate recovery.', 'info');
            }
        }
    }

    /**
     * Kessler Risk cascade countdown & failure mechanics
     */
    updateKesslerCascade(dt) {
        const scene = this.scene;
        if (!scene || scene.isMissionOver) return;

        // If Kessler risk hits 100%, initiate critical countdown
        if (scene.kesslerRisk >= 100) {
            if (!this.cascadeActive) {
                this.cascadeActive = true;
                this.cascadeCountdown = this.difficulty.kesslerGracePeriod || 5.0;
                scene.logFlightEvent('CASCADE FAILURE', `CRITICAL KESSLER CASCADE IMMINENT in T-${Math.round(this.cascadeCountdown)}s!`, 'danger');
                if (window.soundSystem?.playWarning) {
                    window.soundSystem.playWarning(true);
                }
            }

            this.cascadeCountdown -= dt;
            scene.activeEventAlert = `[CASCADE WARNING] RUNAWAY CHAIN REACTION: T-${Math.max(0, this.cascadeCountdown).toFixed(1)}s! DELIVER DEBRIS OR [Q] NUDGE!`;
            scene.eventAlertTimer = 1.0;

            if (this.cascadeCountdown <= 0) {
                scene.handleMissionEnd(false, 'CASCADE CHAIN REACTION - SECTOR CLOSED BY RUNAWAY KESSLER SYNDROME');
            }
        } else {
            if (this.cascadeActive) {
                this.cascadeActive = false;
                this.cascadeCountdown = this.difficulty.kesslerGracePeriod || 5.0;
                scene.logFlightEvent('CASCADE ABORTED', 'Kessler risk reduced below critical threshold. Cascade averted.', 'success');
            }
        }
    }

    /**
     * Capture Combo System: Rewards quick consecutive collections within 6s
     */
    registerCapture() {
        this.comboCount++;
        this.comboTimer = 6.0;

        let bonus = 0;
        if (this.comboCount >= 2) {
            bonus = 50 * this.comboCount;
            this.scene.score += bonus;
            const text = `COMBO x${this.comboCount}! +${bonus}`;
            this.scene.showFloatingText(this.scene.player.x, this.scene.player.y - 35, text, '#38bdf8');
            if (window.soundSystem?.playComboBonus) {
                window.soundSystem.playComboBonus(this.comboCount);
            }
        }
    }

    /**
     * Near-Miss Detection: Evading within 55px without collision
     */
    checkNearMisses() {
        const scene = this.scene;
        if (!scene.player || !scene.hazardGroup) return;

        const playerX = scene.player.x;
        const playerY = scene.player.y;

        scene.hazardGroup.getChildren().forEach(h => {
            if (!h || !h.active || this.nearMissCheckedHazards.has(h)) return;

            const dist = Phaser.Math.Distance.Between(playerX, playerY, h.x, h.y);
            // Near-miss zone: between 28px (collision radius) and 58px
            if (dist > 28 && dist <= 58) {
                this.nearMissCheckedHazards.add(h);
                scene.score += 50;
                scene.kesslerRisk = Math.max(0, scene.kesslerRisk - 1);
                scene.showFloatingText(playerX, playerY - 30, '+50 NEAR MISS!', '#10b981');
                scene.logFlightEvent('NEAR MISS', 'Close-proximity hazard evaded safely (+50 pts).', 'info');

                if (window.soundSystem?.playNearMiss) {
                    window.soundSystem.playNearMiss();
                }
            }
        });
    }

    /**
     * Evaluates Perfect Docking: Speed < 45 px/s and zero recent collision
     */
    evaluateDockingBonus(playerVelocity) {
        const speed = Math.hypot(playerVelocity.x, playerVelocity.y);
        if (speed < 45) {
            this.scene.score += 150;
            this.scene.showFloatingText(this.scene.station.x, this.scene.station.y - 50, '+150 PERFECT DOCKING!', '#10b981');
            this.scene.logFlightEvent('DOCKING', 'Perfect soft docking approach executed (+150 pts).', 'success');
            return true;
        }
        return false;
    }

    /**
     * Toggles F3 tactical debug overlay
     */
    toggleDebugOverlay() {
        this._lastF3ToggleTime = Date.now();
        this.debugVisible = !this.debugVisible;
        const el = document.getElementById('hud-f3-debug');
        if (el) {
            el.classList.toggle('hidden', !this.debugVisible);
            if (this.debugVisible) {
                this.renderDebugOverlay();
            }
        }
    }

    /**
     * Renders F3 Debug Overlay Telemetry
     */
    renderDebugOverlay() {
        const el = document.getElementById('hud-f3-debug');
        if (!el) return;

        const scene = this.scene;
        const activeHazards = scene.hazardGroup ? scene.hazardGroup.countActive(true) : 0;
        const activeDebris = scene.debrisGroup ? scene.debrisGroup.countActive(true) : 0;
        const timeToNextEvent = Math.max(0, this.nextEventInterval - this.eventTimer).toFixed(1);
        const fps = Math.round(scene.game.loop.actualFps || 60);

        let tensionClass = 'tension-low';
        if (this.tension > 80) tensionClass = 'tension-crit';
        else if (this.tension >= 50) tensionClass = 'tension-elevated';

        el.innerHTML = `
            <div class="f3-title" style="display: flex; justify-content: space-between; align-items: center;">
                <span>FLIGHT DIRECTOR TELEMETRY</span>
                <button type="button" class="btn-close-telemetry" style="background: none; border: 1px solid var(--border-bright); color: var(--accent-cyan); font-size: 0.65rem; padding: 1px 6px; cursor: pointer;" onclick="window.toggleTelemetryOverlay();">✕ CLOSE</button>
            </div>
            <div class="f3-row"><span>DIFFICULTY:</span> <strong style="color: var(--accent-cyan);">${this.difficulty.name}</strong></div>
            <div class="f3-row"><span>MISSION STAGE:</span> <strong style="color: #f59e0b;">${this.currentStage}</strong></div>
            <div class="f3-row"><span>TENSION SCORE:</span> <strong class="${tensionClass}">${this.tension}% (${this.getTensionLabel()})</strong></div>
            <div class="f3-bar-bg"><div class="f3-bar-fill ${tensionClass}" style="width: ${this.tension}%;"></div></div>
            <div class="f3-row"><span>KESSLER RISK:</span> <strong>${scene.kesslerRisk || 0}%</strong></div>
            <div class="f3-row"><span>NEXT EVENT IN:</span> <strong>${timeToNextEvent}s</strong> (Interval: ${this.nextEventInterval.toFixed(1)}s)</div>
            <div class="f3-row"><span>FIRST THREAT:</span> <strong>${this.firstThreatSpawned ? `T+${this.firstThreatTime}s (PASSED)` : `SCHEDULED T+12s`}</strong></div>
            <div class="f3-row"><span>COMBO:</span> <strong>${this.comboCount > 0 ? `x${this.comboCount} (${this.comboTimer.toFixed(1)}s)` : 'INACTIVE'}</strong></div>
            <div class="f3-row"><span>OBJECTS:</span> <strong>${activeDebris} Debris | ${activeHazards} Hazards</strong></div>
            <div class="f3-row"><span>RENDER LOOP:</span> <strong>${fps} FPS</strong></div>
        `;
    }

    getTensionLabel() {
        if (this.tension < 35) return 'CALM';
        if (this.tension < 60) return 'MODERATE';
        if (this.tension < 80) return 'ELEVATED';
        return 'CRITICAL';
    }
}

if (typeof window !== 'undefined') {
    window.MissionDirector = MissionDirector;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MissionDirector };
}
