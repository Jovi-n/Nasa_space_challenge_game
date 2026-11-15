/**
 * ORBITAL CLEANUP: MISSION ZERO
 * UI Controller, Mission Design Studio, Hangar Shop, Minimap, and HUD Binder
 */

class UIController {
    constructor() {
        this.save = OrbitalStorage.load();
        this.currentGame = null;
        this.currentScene = null;
        
        // Mission Design Selections
        this.selectedLevelId = 1;
        this.selectedShipId = this.save.selectedShip || 'scout';
        this.selectedEquipmentId = this.save.selectedEquipment || 'arm';
        this.selectedPayloadId = this.save.selectedPayload || 'balanced';

        this.initDOMElements();
        this.attachEventListeners();
        this.renderHangarShop();
        this.renderMissionDesignView();
        this.renderLeaderboard();
        this.initMinimap();
    }

    initDOMElements() {
        // Screens
        this.screens = {
            mainMenu: document.getElementById('screen-main-menu'),
            missionDesign: document.getElementById('screen-mission-design'),
            hangar: document.getElementById('screen-hangar'),
            howToPlay: document.getElementById('screen-how-to-play'),
            leaderboard: document.getElementById('screen-leaderboard'),
            gameHud: document.getElementById('hud-overlay'),
            resultsModal: document.getElementById('modal-results'),
            pauseModal: document.getElementById('modal-pause')
        };

        // HUD Elements
        this.hud = {
            fuelBar: document.getElementById('hud-fuel-fill'),
            fuelText: document.getElementById('hud-fuel-text'),
            batteryBar: document.getElementById('hud-battery-fill'),
            batteryText: document.getElementById('hud-battery-text'),
            hullBar: document.getElementById('hud-hull-fill'),
            hullText: document.getElementById('hud-hull-text'),
            cargoSlots: document.getElementById('hud-cargo-slots'),
            cargoCount: document.getElementById('hud-cargo-count'),
            scoreText: document.getElementById('hud-score-val'),
            timerText: document.getElementById('hud-timer-val'),
            quotaText: document.getElementById('hud-quota-val'),
            missionName: document.getElementById('hud-mission-name'),
            warningBanner: document.getElementById('hud-warning-banner'),
            dockingPrompt: document.getElementById('hud-docking-prompt'),
            minimapCanvas: document.getElementById('hud-minimap-canvas')
        };
    }

    switchScreen(targetScreenName) {
        window.soundSystem.playUiClick();
        window.soundSystem.resume();

        // Hide all screens
        Object.values(this.screens).forEach(scr => {
            if (scr && scr.classList) {
                scr.classList.add('hidden');
            }
        });

        // Show target screen
        if (this.screens[targetScreenName]) {
            this.screens[targetScreenName].classList.remove('hidden');
        }

        // Contextual updates
        if (targetScreenName === 'hangar') {
            this.renderHangarShop();
        } else if (targetScreenName === 'missionDesign') {
            this.renderMissionDesignView();
        } else if (targetScreenName === 'leaderboard') {
            this.renderLeaderboard();
        }
    }

    attachEventListeners() {
        // Main Menu Buttons
        document.getElementById('btn-menu-start')?.addEventListener('click', () => {
            this.switchScreen('missionDesign');
        });
        document.getElementById('btn-menu-hangar')?.addEventListener('click', () => {
            this.switchScreen('hangar');
        });
        document.getElementById('btn-menu-help')?.addEventListener('click', () => {
            this.switchScreen('howToPlay');
        });
        document.getElementById('btn-menu-leaderboard')?.addEventListener('click', () => {
            this.switchScreen('leaderboard');
        });

        // Navigation Back Buttons
        document.querySelectorAll('.btn-back-to-menu').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchScreen('mainMenu');
            });
        });

        // Sound Toggle Buttons
        const sfxBtn = document.getElementById('btn-toggle-sfx');
        if (sfxBtn) {
            sfxBtn.addEventListener('click', () => {
                const state = window.soundSystem.toggleSFX();
                sfxBtn.innerText = state ? 'SFX: ON' : 'SFX: OFF';
                sfxBtn.classList.toggle('active', state);
            });
        }

        const musicBtn = document.getElementById('btn-toggle-music');
        if (musicBtn) {
            musicBtn.addEventListener('click', () => {
                const state = window.soundSystem.toggleMusic();
                musicBtn.innerText = state ? 'MUSIC: ON' : 'MUSIC: OFF';
                musicBtn.classList.toggle('active', state);
            });
        }

        // Mission Design Launch Button
        document.getElementById('btn-launch-mission')?.addEventListener('click', () => {
            this.launchConfiguredMission();
        });

        // How-To-Play Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetTab = btn.getAttribute('data-tab');
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`tab-content-${targetTab}`)?.classList.add('active');
                window.soundSystem.playUiClick();
            });
        });

        // Results Modal Buttons
        document.getElementById('btn-results-next')?.addEventListener('click', () => {
            this.screens.resultsModal.classList.add('hidden');
            if (this.selectedLevelId < 4) {
                this.selectedLevelId++;
                this.switchScreen('missionDesign');
            } else {
                this.switchScreen('mainMenu');
            }
        });

        document.getElementById('btn-results-retry')?.addEventListener('click', () => {
            this.screens.resultsModal.classList.add('hidden');
            this.launchConfiguredMission();
        });

        document.getElementById('btn-results-hangar')?.addEventListener('click', () => {
            this.screens.resultsModal.classList.add('hidden');
            this.switchScreen('hangar');
        });

        // Pause Menu
        window.addEventListener('keydown', (e) => {
            if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
                if (this.currentScene && !this.currentScene.isMissionOver && !this.screens.gameHud.classList.contains('hidden')) {
                    this.togglePause();
                }
            }
        });

        document.getElementById('btn-pause-resume')?.addEventListener('click', () => {
            if (this.currentScene) {
                this.togglePause();
            } else {
                this.screens.pauseModal.classList.add('hidden');
            }
        });

        document.getElementById('btn-pause-restart')?.addEventListener('click', () => {
            this.screens.pauseModal.classList.add('hidden');
            if (this.currentScene) {
                this.currentScene.scene.resume('OrbitalGameScene');
            }
            this.launchConfiguredMission();
        });

        document.getElementById('btn-pause-abort')?.addEventListener('click', () => {
            this.screens.pauseModal.classList.add('hidden');
            if (this.currentScene) {
                this.currentScene.scene.resume('OrbitalGameScene');
            }
            if (this.currentGame) {
                this.currentGame.destroy(true);
                this.currentGame = null;
                this.currentScene = null;
            }
            this.switchScreen('mainMenu');
        });
    }

    togglePause() {
        if (!this.currentScene) return;
        const isPaused = this.currentScene.scene.isPaused('OrbitalGameScene');
        if (isPaused) {
            this.currentScene.scene.resume('OrbitalGameScene');
            this.screens.pauseModal.classList.add('hidden');
        } else {
            this.currentScene.scene.pause('OrbitalGameScene');
            this.screens.pauseModal.classList.remove('hidden');
        }
    }

    /**
     * Render Mission Design View: Ship, Equipment, Payload, and Mission Selection
     */
    renderMissionDesignView() {
        this.save = OrbitalStorage.load();

        // 1. Mission Levels selector
        const levelContainer = document.getElementById('design-level-select');
        if (levelContainer) {
            levelContainer.innerHTML = '';
            GAME_DATA.LEVELS.forEach(lvl => {
                const isLocked = lvl.id > this.save.unlockedLevels;
                const isSelected = lvl.id === this.selectedLevelId;
                const stars = this.save.stars[lvl.id] || 0;
                const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);

                const div = document.createElement('div');
                div.className = `level-card ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''}`;
                div.innerHTML = `
                    <div class="level-badge">LVL 0${lvl.id}</div>
                    <div class="level-title">${lvl.name.split(':')[1] || lvl.name}</div>
                    <div class="level-sub">${lvl.subtitle}</div>
                    <div class="level-meta">
                        <span>Target Quota: ${lvl.targetQuota} Debris</span>
                        <span class="stars">${starStr}</span>
                    </div>
                    ${isLocked ? '<div class="lock-overlay">🔒 LOCKED (Complete previous mission)</div>' : ''}
                `;

                if (!isLocked) {
                    div.addEventListener('click', () => {
                        this.selectedLevelId = lvl.id;
                        window.soundSystem.playUiClick();
                        this.renderMissionDesignView();
                    });
                }
                levelContainer.appendChild(div);
            });
        }

        // Active Mission Briefing text
        const activeLevel = GAME_DATA.LEVELS.find(l => l.id === this.selectedLevelId);
        const briefingBox = document.getElementById('design-mission-briefing');
        if (briefingBox && activeLevel) {
            briefingBox.innerHTML = `
                <h4>ORBITAL RECONNAISSANCE DOSSIER</h4>
                <p>${activeLevel.briefing}</p>
                <div class="dossier-chips">
                    <span class="chip">Sector Alt: ${activeLevel.subtitle.match(/Alt: [^)]+/)?.[0] || 'Orbit'}</span>
                    <span class="chip">Quota: ${activeLevel.targetQuota} Units</span>
                    <span class="chip">Base Reward: ${activeLevel.basePayout} Scrap</span>
                </div>
            `;
        }

        // 2. Spacecraft Selection
        const shipContainer = document.getElementById('design-ship-select');
        if (shipContainer) {
            shipContainer.innerHTML = '';
            Object.values(GAME_DATA.SHIPS).forEach(ship => {
                const isSelected = ship.id === this.selectedShipId;
                const div = document.createElement('div');
                div.className = `option-card ${isSelected ? 'selected' : ''}`;
                div.innerHTML = `
                    <div class="option-header">
                        <span class="option-name">${ship.name}</span>
                        <span class="option-tag">${ship.cargoCapacity} Slots</span>
                    </div>
                    <p class="option-desc">${ship.tagline}</p>
                    <div class="stats-grid">
                        <div>Speed: <span class="stat-stars">${ship.statsText.speed}</span></div>
                        <div>Handling: <span class="stat-stars">${ship.statsText.handling}</span></div>
                        <div>Cargo: <span class="stat-stars">${ship.statsText.cargo}</span></div>
                        <div>Armor: <span class="stat-stars">${ship.statsText.armor}</span></div>
                    </div>
                `;
                div.addEventListener('click', () => {
                    this.selectedShipId = ship.id;
                    this.save.selectedShip = ship.id;
                    OrbitalStorage.save(this.save);
                    window.soundSystem.playUiClick();
                    this.renderMissionDesignView();
                });
                shipContainer.appendChild(div);
            });
        }

        // 3. Equipment Selection
        const equipContainer = document.getElementById('design-equipment-select');
        if (equipContainer) {
            equipContainer.innerHTML = '';
            Object.values(GAME_DATA.EQUIPMENT).forEach(eq => {
                const isSelected = eq.id === this.selectedEquipmentId;
                const div = document.createElement('div');
                div.className = `option-card ${isSelected ? 'selected' : ''}`;
                div.innerHTML = `
                    <div class="option-header">
                        <span class="option-name">${eq.name}</span>
                        <span class="option-tag">${eq.type.toUpperCase()}</span>
                    </div>
                    <p class="option-desc">${eq.tagline}</p>
                    <div class="stats-grid">
                        <div>Range: <span class="stat-val">${eq.range}m</span></div>
                        <div>Battery Drain: <span class="stat-val">${eq.batteryCost || eq.batteryCostPerSec + '/s'}</span></div>
                        <div>Scrap Yield: <span class="stat-val">+${Math.round((eq.scrapBonus - 1) * 100)}%</span></div>
                    </div>
                `;
                div.addEventListener('click', () => {
                    this.selectedEquipmentId = eq.id;
                    this.save.selectedEquipment = eq.id;
                    OrbitalStorage.save(this.save);
                    window.soundSystem.playUiClick();
                    this.renderMissionDesignView();
                });
                equipContainer.appendChild(div);
            });
        }

        // 4. Payload Balancing Selection
        const payloadContainer = document.getElementById('design-payload-select');
        if (payloadContainer) {
            payloadContainer.innerHTML = '';
            Object.values(GAME_DATA.PAYLOAD_TUNINGS).forEach(pl => {
                const isSelected = pl.id === this.selectedPayloadId;
                const div = document.createElement('div');
                div.className = `option-card ${isSelected ? 'selected' : ''}`;
                div.innerHTML = `
                    <div class="option-header">
                        <span class="option-name">${pl.name}</span>
                    </div>
                    <p class="option-desc">${pl.desc}</p>
                `;
                div.addEventListener('click', () => {
                    this.selectedPayloadId = pl.id;
                    this.save.selectedPayload = pl.id;
                    OrbitalStorage.save(this.save);
                    window.soundSystem.playUiClick();
                    this.renderMissionDesignView();
                });
                payloadContainer.appendChild(div);
            });
        }
    }

    /**
     * Render Persistent Hangar Shop
     */
    renderHangarShop() {
        this.save = OrbitalStorage.load();
        const creditsElem = document.getElementById('hangar-credits-val');
        if (creditsElem) {
            creditsElem.innerText = this.save.credits.toLocaleString();
        }

        const shopContainer = document.getElementById('hangar-upgrades-list');
        if (!shopContainer) return;
        shopContainer.innerHTML = '';

        Object.values(GAME_DATA.UPGRADES).forEach(upg => {
            const currentLevel = this.save.upgrades[upg.id] || 0;
            const isMax = currentLevel >= upg.maxLevel;
            const cost = isMax ? null : upg.costPerLevel[currentLevel];
            const canAfford = !isMax && this.save.credits >= cost;

            const div = document.createElement('div');
            div.className = 'upgrade-row';
            div.innerHTML = `
                <div class="upgrade-info">
                    <div class="upgrade-title">${upg.name} <span class="upgrade-lvl">TIER ${currentLevel}/${upg.maxLevel}</span></div>
                    <div class="upgrade-desc">${upg.description}</div>
                    <div class="upgrade-effect">Bonus: ${upg.effectDesc}</div>
                </div>
                <div class="upgrade-action">
                    ${isMax ? '<button class="btn-upgrade maxed" disabled>MAX TIER</button>' : 
                        `<button class="btn-upgrade ${canAfford ? 'affordable' : 'unaffordable'}" ${!canAfford ? 'disabled' : ''}>
                            UPGRADE (${cost} SCRAP)
                         </button>`
                    }
                </div>
            `;

            const btn = div.querySelector('.btn-upgrade');
            if (btn && canAfford) {
                btn.addEventListener('click', () => {
                    this.save.credits -= cost;
                    this.save.upgrades[upg.id] = currentLevel + 1;
                    OrbitalStorage.save(this.save);
                    window.soundSystem.playCollect(3);
                    this.renderHangarShop();
                });
            }

            shopContainer.appendChild(div);
        });
    }

    /**
     * Render Leaderboard & Career Stats
     */
    renderLeaderboard() {
        this.save = OrbitalStorage.load();

        // Career stats
        document.getElementById('stat-total-debris').innerText = this.save.totalDebrisRecycled.toLocaleString();
        document.getElementById('stat-total-mass').innerText = (this.save.totalMassDeorbitedKg / 1000).toFixed(1) + ' t';
        document.getElementById('stat-total-missions').innerText = this.save.missionsCompleted;
        document.getElementById('stat-total-credits').innerText = this.save.credits.toLocaleString();

        // Table
        const tbody = document.getElementById('leaderboard-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        this.save.leaderboard.forEach((entry, idx) => {
            const row = document.createElement('tr');
            const isArchive = entry.date === 'Archive Record';
            const dateDisplay = isArchive ? '<span style="color: var(--neon-cyan); opacity: 0.85;">Archive Record</span>' : (entry.date || 'Archive Record');
            const statusTag = entry.status === 'FAILED' ? ' <span style="color: var(--neon-red); font-size: 0.75rem;">[FAILED]</span>' : '';
            row.innerHTML = `
                <td>#0${idx + 1}</td>
                <td><strong>${entry.name || 'Commander'}</strong></td>
                <td>${(entry.mission || 'LEO Corridor').trim()}${statusTag}</td>
                <td>${entry.debris || 0}</td>
                <td class="score-cell">${entry.score.toLocaleString()} PTS</td>
                <td>${dateDisplay}</td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * Launch the Phaser Game with selected configuration
     */
    launchConfiguredMission() {
        const level = GAME_DATA.LEVELS.find(l => l.id === this.selectedLevelId) || GAME_DATA.LEVELS[0];

        // Hide menus, show HUD
        this.switchScreen('gameHud');

        // Destroy prior Phaser instance if active
        if (this.currentGame) {
            this.currentGame.destroy(true);
            this.currentGame = null;
        }

        const config = {
            type: Phaser.AUTO,
            parent: 'game-container',
            width: window.innerWidth,
            height: window.innerHeight,
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: 0 },
                    debug: false
                }
            },
            scene: [OrbitalGameScene]
        };

        this.currentGame = new Phaser.Game(config);

        // Pass scene data on startup
        this.currentGame.scene.start('OrbitalGameScene', {
            level: level,
            shipId: this.selectedShipId,
            equipmentId: this.selectedEquipmentId,
            payloadId: this.selectedPayloadId
        });

        window.soundSystem.resume();
    }

    /**
     * Initialize Minimap Radar
     */
    initMinimap() {
        this.minimapCtx = this.hud.minimapCanvas?.getContext('2d');
    }

    updateMinimap(scene) {
        if (!this.minimapCtx) return;
        const ctx = this.minimapCtx;
        const w = this.hud.minimapCanvas.width;
        const h = this.hud.minimapCanvas.height;

        ctx.clearRect(0, 0, w, h);

        const worldW = scene.missionConfig.worldSize.width;
        const worldH = scene.missionConfig.worldSize.height;

        const toMapX = (x) => (x / worldW) * w;
        const toMapY = (y) => (y / worldH) * h;

        // Station (Green square)
        ctx.fillStyle = '#10b981';
        ctx.fillRect(toMapX(scene.station.x) - 4, toMapY(scene.station.y) - 4, 8, 8);

        // Debris (Cyan/Yellow dots)
        ctx.fillStyle = '#38bdf8';
        scene.debrisGroup.getChildren().forEach(d => {
            if (d.active) {
                ctx.fillRect(toMapX(d.x) - 1.5, toMapY(d.y) - 1.5, 3, 3);
            }
        });

        // Hazards (Pulsing Red dots)
        ctx.fillStyle = '#ef4444';
        scene.hazardGroup.getChildren().forEach(haz => {
            if (haz.active) {
                ctx.fillRect(toMapX(haz.x) - 2.5, toMapY(haz.y) - 2.5, 5, 5);
            }
        });

        // Player (Bright Cyan triangle)
        ctx.save();
        ctx.translate(toMapX(scene.player.x), toMapY(scene.player.y));
        ctx.rotate(scene.player.rotation);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(-4, -4);
        ctx.lineTo(-2, 0);
        ctx.lineTo(-4, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

// Global UI Hook
window.addEventListener('DOMContentLoaded', () => {
    window.uiController = new UIController();

    // Scene ready callback
    window.onGameSceneReady = (scene) => {
        window.uiController.currentScene = scene;
    };

    // Live HUD update loop
    window.updateGameHUD = (scene) => {
        const hud = window.uiController.hud;

        // Fuel
        const fuelPct = Math.max(0, (scene.fuel / scene.maxFuel) * 100);
        hud.fuelBar.style.width = `${fuelPct}%`;
        hud.fuelText.innerText = `${Math.round(fuelPct)}%`;
        hud.fuelBar.classList.toggle('low', fuelPct < 25);

        // Battery
        const batPct = Math.max(0, (scene.battery / scene.maxBattery) * 100);
        hud.batteryBar.style.width = `${batPct}%`;
        hud.batteryText.innerText = `${Math.round(batPct)}%`;

        // Hull
        const hullPct = Math.max(0, (scene.hull / scene.maxHull) * 100);
        hud.hullBar.style.width = `${hullPct}%`;
        hud.hullText.innerText = `${Math.round(hullPct)}%`;
        hud.hullBar.classList.toggle('critical', hullPct < 30);

        // Cargo
        hud.cargoCount.innerText = `${scene.cargo.length}/${scene.cargoCapacity}`;
        let slotHtml = '';
        for (let i = 0; i < scene.cargoCapacity; i++) {
            const isFilled = i < scene.cargo.length;
            slotHtml += `<span class="cargo-slot ${isFilled ? 'filled' : ''}"></span>`;
        }
        hud.cargoSlots.innerHTML = slotHtml;

        // Score & Quota
        hud.scoreText.innerText = scene.score.toLocaleString();
        hud.quotaText.innerText = `${scene.debrisDeliveredCount} / ${scene.debrisTargetQuota}`;
        hud.missionName.innerText = scene.missionConfig.name;

        // Timer
        const mins = Math.floor(Math.max(0, scene.missionTime) / 60);
        const secs = Math.floor(Math.max(0, scene.missionTime) % 60);
        hud.timerText.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        // Warnings & Prompts
        hud.warningBanner.classList.toggle('active', scene.warningActive);

        const distToStation = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, scene.station.x, scene.station.y);
        const inDockRange = distToStation <= scene.stationDockingRadius;
        hud.dockingPrompt.classList.toggle('active', inDockRange && !scene.isDocked);

        // Minimap
        window.uiController.updateMinimap(scene);
    };

    // Results Modal Debriefing Hook
    window.showMissionResultsModal = (results) => {
        const modal = document.getElementById('modal-results');
        if (!modal) return;

        const headline = document.getElementById('results-headline');
        const reason = document.getElementById('results-reason');
        const debris = document.getElementById('res-debris');
        const deliveries = document.getElementById('res-deliveries');
        const fuel = document.getElementById('res-fuel');
        const collisions = document.getElementById('res-collisions');
        const totalScore = document.getElementById('res-score');
        const credits = document.getElementById('res-credits');
        const starsContainer = document.getElementById('res-stars');

        headline.innerText = results.isVictory ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED';
        headline.className = `results-title ${results.isVictory ? 'victory' : 'defeat'}`;
        reason.innerText = results.reason;

        debris.innerText = `${results.debrisCount} / ${results.targetQuota}`;
        deliveries.innerText = results.deliveries;
        fuel.innerText = `${results.fuelConsumed} L`;
        collisions.innerText = results.collisions;
        totalScore.innerText = results.totalScore.toLocaleString();
        credits.innerText = `+${results.creditsEarned} Scrap`;

        const starCount = results.stars;
        starsContainer.innerText = '★'.repeat(starCount) + '☆'.repeat(3 - starCount);

        const nextBtn = document.getElementById('btn-results-next');
        if (nextBtn) {
            nextBtn.style.display = results.isVictory ? 'inline-block' : 'none';
        }

        modal.classList.remove('hidden');
    };
});

