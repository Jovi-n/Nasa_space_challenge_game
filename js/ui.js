/**
 * ORBITAL CLEANUP: MISSION ZERO - UI CONTROLLER v2
 * Systems Engineering Mission Design, Live Budgets, Formal Design Review,
 * CONOPS, Trade Study, Minimap, and Debrief v2
 */

class UIController {
    constructor() {
        this.save = OrbitalStorage.load();
        this.currentGame = null;
        this.currentScene = null;

        // Current Step in Mission Design Studio (1: Need & Goals, 2: CONOPS, 3: Trade Study, 4: Point Design)
        this.currentDesignStep = 1;

        // Mission Design Selections (backed by PARTS_DATA)
        this.selectedLevelId = 1;
        this.selectedClientId = this.save.selectedClientId || 'esa';
        this.selectedLaunchVehicleId = this.save.selectedLaunchVehicleId || 'falcon9';
        this.selectedBusId = this.save.selectedShip || 'collector';
        this.selectedPropulsionId = this.save.selectedPropulsionId || 'hypergolic';
        this.selectedPowerId = this.save.selectedPowerId || 'deployable_wings';
        this.selectedEquipmentId = this.save.selectedEquipment || 'net';
        this.selectedGroundCommsId = this.save.selectedGroundCommsId || 'regional_passes';

        // Legacy compatibility
        this.selectedShipId = this.selectedBusId;
        this.selectedPayloadId = 'balanced';

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
            pauseModal: document.getElementById('modal-pause'),
            tutorialModal: document.getElementById('modal-tutorial'),
            sourcesModal: document.getElementById('modal-sources'),
            creditsModal: document.getElementById('modal-credits'),
            shareCodeModal: document.getElementById('modal-share-code')
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

        // Mission Design Wizard Elements
        this.stepButtons = document.querySelectorAll('.step-tab-btn');
        this.stepViews = document.querySelectorAll('.design-step-view');
        this.orbitCanvas = document.getElementById('orbit-canvas');
        this.launchMissionBtn = document.getElementById('btn-launch-mission');
    }

    switchScreen(targetScreenName) {
        if (window.soundSystem) {
            window.soundSystem.playUiClick();
            window.soundSystem.resume();
        }

        // Hide all screens & modals
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
        // Universal Document-Level Event Delegation for 100% Reliable Button & Interactive Handling
        document.addEventListener('click', (e) => {
            // 1. Step Tab Buttons (01 NEED, 02 CONOPS, 03 TRADE, 04 POINT DESIGN)
            const stepTab = e.target.closest('.step-tab-btn');
            if (stepTab) {
                e.preventDefault();
                const step = parseInt(stepTab.getAttribute('data-step'), 10);
                if (step) {
                    this.switchDesignStep(step);
                }
                return;
            }

            // 2. Next Step Buttons
            const nextBtn = e.target.closest('.btn-next-step');
            if (nextBtn) {
                e.preventDefault();
                const target = parseInt(nextBtn.getAttribute('data-target'), 10);
                if (target) {
                    this.switchDesignStep(target);
                }
                return;
            }

            // 3. Previous Step Buttons
            const prevBtn = e.target.closest('.btn-prev-step');
            if (prevBtn) {
                e.preventDefault();
                const target = parseInt(prevBtn.getAttribute('data-target'), 10);
                if (target) {
                    this.switchDesignStep(target);
                }
                return;
            }

            // 4. Adopt Architecture Buttons (Step 3 Trade Study)
            const adoptBtn = e.target.closest('.btn-adopt-arch');
            if (adoptBtn) {
                e.preventDefault();
                const archId = adoptBtn.getAttribute('data-arch');
                if (archId) {
                    this.adoptArchitecture(archId);
                }
                return;
            }

            // 5. Quick Launch / Direct Launch Buttons (Anywhere in Design Studio)
            const launchBtn = e.target.closest('#btn-launch-mission, .btn-quick-launch-direct');
            if (launchBtn) {
                e.preventDefault();
                const budgets = this.calculateBudgets();
                if (budgets.reviewStatus === 'FAIL') {
                    window.soundSystem?.playExplosion();
                    alert(`[FORMAL DESIGN REVIEW FAILED]\n\n${budgets.failureReason}\n\nPlease adjust your subsystems in Step 4 (e.g. increase launcher capacity, reduce dry mass, or add solar arrays) to achieve PASS status before launch.`);
                    this.switchDesignStep(4);
                    return;
                }
                this.launchConfiguredMission();
                return;
            }

            // 6. Quick Demo Button
            const quickDemoBtn = e.target.closest('#btn-quick-demo');
            if (quickDemoBtn) {
                e.preventDefault();
                this.loadQuickDemoPreset();
                return;
            }

            // 7. Design Tutorial Button
            const tutorialBtn = e.target.closest('#btn-design-tutorial');
            if (tutorialBtn) {
                e.preventDefault();
                this.screens.tutorialModal?.classList.remove('hidden');
                window.soundSystem?.playUiClick();
                return;
            }

            // 8. Design Share Button
            const shareBtn = e.target.closest('#btn-design-share');
            if (shareBtn) {
                e.preventDefault();
                this.openShareCodeModal();
                return;
            }

            // 9. Modal Close Buttons
            const closeBtn = e.target.closest('.btn-close-modal');
            if (closeBtn) {
                e.preventDefault();
                const modalId = closeBtn.getAttribute('data-modal');
                if (modalId && document.getElementById(modalId)) {
                    document.getElementById(modalId).classList.add('hidden');
                } else {
                    closeBtn.closest('.modal-layer')?.classList.add('hidden');
                }
                window.soundSystem?.playUiClick();
                return;
            }

            // 10. Main Menu / Back to Menu Buttons
            const backBtn = e.target.closest('.btn-back-to-menu');
            if (backBtn) {
                e.preventDefault();
                this.switchScreen('mainMenu');
                return;
            }
        });

        // Main Menu Direct Buttons
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
        document.getElementById('btn-menu-sources')?.addEventListener('click', () => {
            this.screens.sourcesModal?.classList.remove('hidden');
            window.soundSystem?.playUiClick();
        });
        document.getElementById('btn-menu-credits')?.addEventListener('click', () => {
            this.screens.creditsModal?.classList.remove('hidden');
            window.soundSystem?.playUiClick();
        });

        // Mission Design Header Action Buttons
        document.getElementById('btn-quick-demo')?.addEventListener('click', () => {
            this.loadQuickDemoPreset();
        });
        document.getElementById('btn-design-tutorial')?.addEventListener('click', () => {
            this.screens.tutorialModal?.classList.remove('hidden');
            window.soundSystem?.playUiClick();
        });
        document.getElementById('btn-design-share')?.addEventListener('click', () => {
            this.openShareCodeModal();
        });

        // Modal Close Buttons
        document.querySelectorAll('.btn-close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.getAttribute('data-modal');
                if (modalId && document.getElementById(modalId)) {
                    document.getElementById(modalId).classList.add('hidden');
                } else {
                    btn.closest('.modal-layer')?.classList.add('hidden');
                }
                window.soundSystem?.playUiClick();
            });
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

        // How-To-Play Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`tab-content-${targetTab}`)?.classList.add('active');
                window.soundSystem?.playUiClick();
            });
        });

        // Results Modal / Debrief Actions
        document.getElementById('btn-results-next')?.addEventListener('click', () => {
            this.screens.resultsModal.classList.add('hidden');
            if (this.selectedLevelId < 4) {
                this.selectedLevelId++;
                this.switchScreen('missionDesign');
                this.switchDesignStep(1);
            } else {
                this.switchScreen('mainMenu');
            }
        });

        document.getElementById('btn-results-redesign')?.addEventListener('click', () => {
            this.screens.resultsModal.classList.add('hidden');
            this.switchScreen('missionDesign');
            this.switchDesignStep(4);
        });

        document.getElementById('btn-results-retry')?.addEventListener('click', () => {
            this.screens.resultsModal.classList.add('hidden');
            this.launchConfiguredMission();
        });

        document.getElementById('btn-results-hangar')?.addEventListener('click', () => {
            this.screens.resultsModal.classList.add('hidden');
            this.switchScreen('hangar');
        });

        document.getElementById('btn-copy-debrief-code')?.addEventListener('click', () => {
            const code = document.getElementById('debrief-share-code')?.innerText;
            if (code) {
                navigator.clipboard?.writeText(code).then(() => {
                    const btn = document.getElementById('btn-copy-debrief-code');
                    if (btn) btn.innerText = 'COPIED!';
                    setTimeout(() => { if (btn) btn.innerText = 'COPY CODE'; }, 2000);
                });
            }
        });

        // Share Code Modal Buttons
        document.getElementById('btn-copy-current-code')?.addEventListener('click', () => {
            const code = this.generateDesignCode();
            navigator.clipboard?.writeText(code).then(() => {
                const status = document.getElementById('share-code-status');
                if (status) {
                    status.innerHTML = `<span style="color: var(--clean);">COPIED CODE TO CLIPBOARD: ${code}</span>`;
                }
            });
        });

        document.getElementById('btn-import-code')?.addEventListener('click', () => {
            const input = document.getElementById('share-code-input');
            const status = document.getElementById('share-code-status');
            if (!input || !input.value.trim()) return;
            const success = this.parseAndApplyDesignCode(input.value.trim());
            if (status) {
                if (success) {
                    status.innerHTML = `<span style="color: var(--clean);">DESIGN CODE LOADED SUCCESSFULLY!</span>`;
                    setTimeout(() => {
                        this.screens.shareCodeModal?.classList.add('hidden');
                    }, 900);
                } else {
                    status.innerHTML = `<span style="color: var(--danger);">INVALID OR CORRUPT DESIGN CODE STRING.</span>`;
                }
            }
        });

        // Pause Menu Listeners
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

    // =========================================================================
    // 4-STEP MISSION DESIGN STUDIO CONTROLLER
    // =========================================================================

    switchDesignStep(stepNumber) {
        if (stepNumber < 1 || stepNumber > 4) return;
        this.currentDesignStep = stepNumber;
        window.soundSystem?.playUiClick();

        // Refresh buttons and views dynamically
        document.querySelectorAll('.step-tab-btn').forEach(btn => {
            const s = parseInt(btn.getAttribute('data-step'), 10);
            btn.classList.toggle('active', s === stepNumber);
        });

        document.querySelectorAll('.design-step-view').forEach(view => {
            view.classList.remove('active');
        });

        const activeView = document.getElementById(`design-step-${stepNumber}`);
        if (activeView) activeView.classList.add('active');

        // Reset scroll position to top so headers and controls are always immediately accessible
        const container = document.querySelector('.design-container');
        if (container) {
            container.scrollTop = 0;
        }

        // Step-specific updates
        if (stepNumber === 1) {
            this.renderStep1NeedAndGoals();
        } else if (stepNumber === 2) {
            this.renderStep2CONOPS();
            this.drawOrbitDiagram();
        } else if (stepNumber === 3) {
            this.renderStep3TradeStudy();
        } else if (stepNumber === 4) {
            this.renderStep4PointDesign();
        }
    }

    renderMissionDesignView() {
        this.save = OrbitalStorage.load();
        this.renderStep1NeedAndGoals();
        this.renderStep2CONOPS();
        this.renderStep3TradeStudy();
        this.renderStep4PointDesign();
        this.switchDesignStep(this.currentDesignStep || 1);
    }

    /**
     * STEP 1: NEED & GOALS (Sector, Client, Contract Requirements Dossier)
     */
    renderStep1NeedAndGoals() {
        // 1. Sector Level Cards
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
                    <div class="level-badge">SECTOR 0${lvl.id}</div>
                    <div class="level-title">${lvl.name.split(':')[1] || lvl.name}</div>
                    <div class="level-sub">${lvl.subtitle}</div>
                    <div class="level-meta">
                        <span>Target Quota: ${lvl.targetQuota} Units</span>
                        <span class="stars">${starStr}</span>
                    </div>
                    ${isLocked ? '<div class="lock-overlay">[LOCKED - CLEAR PREVIOUS SECTOR]</div>' : ''}
                `;

                if (!isLocked) {
                    div.addEventListener('click', () => {
                        this.selectedLevelId = lvl.id;
                        window.soundSystem?.playUiClick();
                        this.renderStep1NeedAndGoals();
                    });
                }
                levelContainer.appendChild(div);
            });
        }

        // 2. Client / Stakeholder Cards
        const clientContainer = document.getElementById('design-client-select');
        if (clientContainer) {
            clientContainer.innerHTML = '';
            Object.values(PARTS_DATA.clients).forEach(client => {
                const isSelected = client.id === this.selectedClientId;
                const div = document.createElement('div');
                div.className = `client-card ${isSelected ? 'selected' : ''}`;
                div.innerHTML = `
                    <div class="client-header">
                        <span class="client-name">${client.name}</span>
                        <span class="trade-badge">×${client.payoutMultiplier} PAYOUT</span>
                    </div>
                    <div class="client-agency">${client.agency}</div>
                    <div class="client-desc">${client.description}</div>
                    <div class="client-meta-box">
                        <div>Max Collisions Allowed: <strong style="color: ${client.maxCollisionsAllowed <= 1 ? 'var(--danger)' : 'var(--salvage)'};">${client.maxCollisionsAllowed}</strong></div>
                        <div>Bonus Requirement: <strong style="color: var(--clean);">${client.bonusCondition}</strong></div>
                    </div>
                `;
                div.addEventListener('click', () => {
                    this.selectedClientId = client.id;
                    this.save.selectedClientId = client.id;
                    OrbitalStorage.save(this.save);
                    window.soundSystem?.playUiClick();
                    this.renderStep1NeedAndGoals();
                });
                clientContainer.appendChild(div);
            });
        }

        // 3. Spacecraft Airframe Bus Selection (Directly on Step 1)
        const busContainer = document.getElementById('design-step1-bus-select');
        if (busContainer) {
            busContainer.innerHTML = '';
            Object.values(PARTS_DATA.buses).forEach(bus => {
                const isSelected = bus.id === this.selectedBusId;
                const div = document.createElement('div');
                div.className = `subsystem-option-card ${isSelected ? 'selected' : ''}`;
                div.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span class="subsystem-opt-title">${bus.name}</span>
                        ${isSelected ? '<span class="trade-badge" style="background: var(--salvage); color: #000; font-weight: bold;">ACTIVE CRAFT</span>' : ''}
                    </div>
                    <div class="subsystem-opt-meta">
                        Speed: ${bus.baseSpeed} m/s | Hull: ${bus.maxHull} HP | Cargo: ${bus.cargoCapacity} Units | Dry Mass: ${bus.dryMassKg} kg
                    </div>
                    <div style="font-size: 0.8rem; color: var(--ink-muted); margin-top: 4px;">${bus.description}</div>
                `;
                div.addEventListener('click', () => {
                    this.selectedBusId = bus.id;
                    this.selectedShipId = bus.id;
                    this.save.selectedShip = bus.id;
                    OrbitalStorage.save(this.save);
                    window.soundSystem?.playUiClick();
                    this.renderStep1NeedAndGoals();
                    this.renderStep4PointDesign();
                });
                busContainer.appendChild(div);
            });
        }

        // 4. Capture & Retrieval Equipment Selection (Directly on Step 1)
        const equipContainer = document.getElementById('design-step1-equipment-select');
        if (equipContainer) {
            equipContainer.innerHTML = '';
            Object.values(PARTS_DATA.equipment).forEach(eq => {
                const isSelected = eq.id === this.selectedEquipmentId;
                const div = document.createElement('div');
                div.className = `subsystem-option-card ${isSelected ? 'selected' : ''}`;
                div.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span class="subsystem-opt-title">${eq.name}</span>
                        ${isSelected ? '<span class="trade-badge" style="background: var(--salvage); color: #000; font-weight: bold;">EQUIPPED</span>' : ''}
                    </div>
                    <div class="subsystem-opt-meta">
                        Range: ${eq.range}m | Scrap: +${Math.round((eq.scrapBonus - 1) * 100)}% | Type: ${eq.type.toUpperCase()} | Mass: ${eq.massKg} kg
                    </div>
                    <div style="font-size: 0.8rem; color: var(--ink-muted); margin-top: 4px;">${eq.description}</div>
                `;
                div.addEventListener('click', () => {
                    this.selectedEquipmentId = eq.id;
                    this.save.selectedEquipment = eq.id;
                    OrbitalStorage.save(this.save);
                    window.soundSystem?.playUiClick();
                    this.renderStep1NeedAndGoals();
                    this.renderStep4PointDesign();
                });
                equipContainer.appendChild(div);
            });
        }

        // 5. Contract Specification & Measurable Requirements Dossier
        const dossierBox = document.getElementById('design-requirements-dossier');
        const activeLevel = GAME_DATA.LEVELS.find(l => l.id === this.selectedLevelId) || GAME_DATA.LEVELS[0];
        const activeClient = PARTS_DATA.clients[this.selectedClientId] || PARTS_DATA.clients.esa;

        if (dossierBox && activeLevel) {
            const minMassKg = activeLevel.targetQuota * 45;
            dossierBox.innerHTML = `
                <h4>CONTRACT BRIEFING // ${activeClient.name.toUpperCase()}</h4>
                <p style="margin: 8px 0; font-family: var(--font-body); font-size: 1rem; color: var(--ink);">
                    ${activeLevel.briefing}
                </p>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-top: 12px; font-family: var(--font-mono); font-size: 0.85rem;">
                    <div>• Sector Altitude: <strong style="color: var(--accent-cyan);">${activeLevel.subtitle.match(/Alt: [^)]+/)?.[0] || 'LEO 480km'}</strong></div>
                    <div>• Mandatory Target Quota: <strong style="color: var(--clean);">${activeLevel.targetQuota} Debris Items</strong></div>
                    <div>• Minimum Mass Clearance: <strong style="color: var(--clean);">${minMassKg} kg</strong></div>
                    <div>• Max Collision Limit: <strong style="color: var(--danger);">${activeClient.maxCollisionsAllowed} Impact(s)</strong></div>
                    <div>• Minimum Propellant Reserve: <strong style="color: var(--salvage);">&gt; 25% Delta-V</strong></div>
                    <div>• Mission Time Window: <strong style="color: var(--accent-cyan);">${activeLevel.timeLimit} Seconds</strong></div>
                </div>
            `;
        }
    }

    /**
     * STEP 2: CONCEPT OF OPERATIONS (CONOPS & Orbit Trajectory)
     */
    renderStep2CONOPS() {
        const activeLevel = GAME_DATA.LEVELS.find(l => l.id === this.selectedLevelId) || GAME_DATA.LEVELS[0];
        const metaBar = document.getElementById('orbit-telemetry-meta');
        if (metaBar) {
            const altMatch = activeLevel.subtitle.match(/Alt: ([^)]+)/);
            const altitudeStr = altMatch ? altMatch[1] : '480 km';
            metaBar.innerHTML = `
                <span>ALTITUDE: <strong>${altitudeStr}</strong></span>
                <span>INCLINATION: <strong>51.6° LEO</strong></span>
                <span>PERIOD: <strong>94.2 MIN</strong></span>
                <span>ECCENTRICITY: <strong>&lt; 0.002</strong></span>
            `;
        }
    }

    drawOrbitDiagram() {
        const canvas = document.getElementById('orbit-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        // Deep Space Background with Star Blips
        ctx.fillStyle = '#03050a';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#24324a';
        for (let i = 0; i < 40; i++) {
            const sx = (i * 37) % w;
            const sy = (i * 29) % h;
            ctx.fillRect(sx, sy, 2, 2);
        }

        // Earth
        const earthX = 110;
        const earthY = h / 2;
        const earthRadius = 38;

        // Atmosphere halo
        ctx.strokeStyle = '#1e3a5f';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(earthX, earthY, earthRadius + 4, 0, Math.PI * 2);
        ctx.stroke();

        // Planet body
        ctx.fillStyle = '#0f2942';
        ctx.beginPath();
        ctx.arc(earthX, earthY, earthRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#10b981';
        ctx.fillRect(earthX - 14, earthY - 10, 16, 10);
        ctx.fillRect(earthX - 4, earthY + 6, 20, 8);

        ctx.fillStyle = '#f1f5f9';
        ctx.font = '9px "Share Tech Mono"';
        ctx.fillText('EARTH', earthX - 14, earthY + 3);

        // Elliptical Orbit Track
        ctx.save();
        ctx.translate(earthX, earthY);
        ctx.strokeStyle = '#2b3f5c';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.ellipse(0, 0, 190, 85, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Target Debris Belt Zone (Scattered amber particles along outer arc)
        ctx.fillStyle = '#f59e0b';
        const debrisPoints = [
            [260, 55], [290, 70], [315, 95], [330, 120], [320, 150], [295, 175], [265, 190]
        ];
        debrisPoints.forEach(pt => {
            ctx.fillRect(pt[0], pt[1], 4, 4);
        });

        ctx.fillStyle = '#f59e0b';
        ctx.font = '10px "Share Tech Mono"';
        ctx.fillText('[TARGET DEBRIS PLANE]', 220, 42);

        // Aegis Recycling Depot Marker (Green Station Box)
        const depotX = 220;
        const depotY = 195;
        ctx.fillStyle = '#10b981';
        ctx.fillRect(depotX - 5, depotY - 5, 10, 10);
        ctx.fillText('[AEGIS DEPOT]', depotX - 35, depotY + 18);

        // Spacecraft Position & Velocity Vector
        const shipX = 190;
        const shipY = 48;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(shipX + 6, shipY);
        ctx.lineTo(shipX - 5, shipY - 4);
        ctx.lineTo(shipX - 3, shipY);
        ctx.lineTo(shipX - 5, shipY + 4);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(shipX + 6, shipY);
        ctx.lineTo(shipX + 28, shipY - 4);
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.fillText('v = 7.6 km/s', shipX + 10, shipY - 10);

        // De-orbit Re-entry Corridor (Red curved descent arc)
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(depotX, depotY);
        ctx.quadraticCurveTo(150, 190, earthX + 30, earthY + 25);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.fillText('DEORBIT BURN →', 120, 220);
    }

    /**
     * STEP 3: TRADE STUDY (Lean vs Balanced vs Robust Architectures)
     */
    renderStep3TradeStudy() {
        const container = document.getElementById('trade-architectures-grid');
        if (!container) return;
        container.innerHTML = '';

        Object.values(PARTS_DATA.tradeArchitectures).forEach(arch => {
            const div = document.createElement('div');
            div.className = 'trade-card';
            div.innerHTML = `
                <div>
                    <span class="trade-badge">${arch.id.toUpperCase()} ARCHITECTURE</span>
                    <div class="trade-name">${arch.name}</div>
                    <div class="trade-tagline">${arch.tagline}</div>
                    <div class="trade-specs-list">
                        <div class="spec-row"><span>Mass Profile:</span> <strong>${arch.tradeSummary.massProfile}</strong></div>
                        <div class="spec-row"><span>Est. Launch Cost:</span> <strong>${arch.tradeSummary.costProfile}</strong></div>
                        <div class="spec-row"><span>Operational Risk:</span> <strong>${arch.tradeSummary.riskLevel}</strong></div>
                        <div class="spec-row" style="margin-top: 4px; border-top: 1px dotted var(--border); padding-top: 4px;">
                            <span>Best Suited For:</span> <em>${arch.tradeSummary.bestFor}</em>
                        </div>
                    </div>
                    <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--ink-muted); margin-bottom: 12px;">
                        • Launcher: ${PARTS_DATA.launchVehicles[arch.launchVehicle]?.name.split('(')[0]}<br>
                        • Bus: ${PARTS_DATA.buses[arch.bus]?.name.split('(')[0]}<br>
                        • Prop: ${PARTS_DATA.propulsionTanks[arch.propulsion]?.name.split('(')[0]}<br>
                        • EPS: ${PARTS_DATA.powerSystems[arch.power]?.name.split('(')[0]}<br>
                        • Tool: ${PARTS_DATA.equipment[arch.equipment]?.name}<br>
                        • Comms: ${PARTS_DATA.groundComms[arch.groundComms]?.name.split('(')[0]}
                    </div>
                </div>
                <button class="btn-primary btn-adopt-arch" style="width: 100%;" data-arch="${arch.id}">
                    ADOPT ${arch.id.toUpperCase()} ARCHITECTURE
                </button>
            `;

            div.querySelector('.btn-adopt-arch')?.addEventListener('click', () => {
                this.adoptArchitecture(arch.id);
            });

            container.appendChild(div);
        });
    }

    adoptArchitecture(archId) {
        const arch = PARTS_DATA.tradeArchitectures[archId];
        if (!arch) return;

        this.selectedLaunchVehicleId = arch.launchVehicle;
        this.selectedBusId = arch.bus;
        this.selectedPropulsionId = arch.propulsion;
        this.selectedPowerId = arch.power;
        this.selectedEquipmentId = arch.equipment;
        this.selectedGroundCommsId = arch.groundComms;

        // Legacy compatibility
        this.selectedShipId = arch.bus;
        this.save.selectedShip = arch.bus;
        this.save.selectedEquipment = arch.equipment;
        this.save.selectedLaunchVehicleId = arch.launchVehicle;
        this.save.selectedPropulsionId = arch.propulsion;
        this.save.selectedPowerId = arch.power;
        this.save.selectedGroundCommsId = arch.groundComms;
        OrbitalStorage.save(this.save);

        window.soundSystem?.playCollect(2);
        this.switchDesignStep(4);
    }

    /**
     * STEP 4: POINT DESIGN & LIVE BUDGETS
     */
    renderStep4PointDesign() {
        this.renderSubsystemSelector('select-launch-vehicle', PARTS_DATA.launchVehicles, this.selectedLaunchVehicleId, (id) => {
            this.selectedLaunchVehicleId = id;
            this.save.selectedLaunchVehicleId = id;
            OrbitalStorage.save(this.save);
            this.renderStep4PointDesign();
        });

        this.renderSubsystemSelector('select-spacecraft-bus', PARTS_DATA.buses, this.selectedBusId, (id) => {
            this.selectedBusId = id;
            this.selectedShipId = id;
            this.save.selectedShip = id;
            OrbitalStorage.save(this.save);
            this.renderStep4PointDesign();
            this.renderStep1NeedAndGoals();
        });

        this.renderSubsystemSelector('select-propulsion', PARTS_DATA.propulsionTanks, this.selectedPropulsionId, (id) => {
            this.selectedPropulsionId = id;
            this.save.selectedPropulsionId = id;
            OrbitalStorage.save(this.save);
            this.renderStep4PointDesign();
        });

        this.renderSubsystemSelector('select-power', PARTS_DATA.powerSystems, this.selectedPowerId, (id) => {
            this.selectedPowerId = id;
            this.save.selectedPowerId = id;
            OrbitalStorage.save(this.save);
            this.renderStep4PointDesign();
        });

        this.renderSubsystemSelector('select-equipment', PARTS_DATA.equipment, this.selectedEquipmentId, (id) => {
            this.selectedEquipmentId = id;
            this.save.selectedEquipment = id;
            OrbitalStorage.save(this.save);
            this.renderStep4PointDesign();
            this.renderStep1NeedAndGoals();
        });

        this.renderSubsystemSelector('select-ground-comms', PARTS_DATA.groundComms, this.selectedGroundCommsId, (id) => {
            this.selectedGroundCommsId = id;
            this.save.selectedGroundCommsId = id;
            OrbitalStorage.save(this.save);
            this.renderStep4PointDesign();
        });

        // Compute and render live budgets & gateway review board
        this.renderBudgetsAndReview();
    }

    renderSubsystemSelector(containerId, itemsObject, selectedId, onSelectCallback) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        Object.values(itemsObject).forEach(item => {
            const isSelected = item.id === selectedId;
            const div = document.createElement('div');
            div.className = `subsystem-option-card ${isSelected ? 'selected' : ''}`;

            let metaStr = '';
            if (item.payloadToLeoKg) {
                metaStr = `Payload: ${item.payloadToLeoKg} kg | Fairing: ${item.fairingVolumeM3} m³ | Cost: ${item.cost}`;
            } else if (item.dryMassKg && item.cargoCapacity) {
                metaStr = `Dry Mass: ${item.dryMassKg} kg | Cargo: ${item.cargoCapacity} | Hull: ${item.maxHull}`;
            } else if (item.fuelCapacityL) {
                metaStr = `Fuel: ${item.fuelCapacityL} L | Wet Mass: ${item.wetMassKg} kg | Burn: ×${item.fuelBurnRate}`;
            } else if (item.generationW) {
                metaStr = `Power: +${item.generationW} W | Battery: ${item.batteryPool} Ah | Recharge: +${item.rechargeRate}/s`;
            } else if (item.range) {
                metaStr = `Range: ${item.range}m | Scrap: +${Math.round((item.scrapBonus - 1) * 100)}% | Type: ${item.type.toUpperCase()}`;
            } else if (item.coveragePercent) {
                metaStr = `Coverage: ${item.coveragePercent}% | Latency: ${item.latencyMs}ms | Radar: ×${item.radarRangeBonus}`;
            }

            const heritageBadge = item.heritage ? `<div class="subsystem-opt-heritage">${item.heritage}</div>` : '';

            div.innerHTML = `
                <div class="subsystem-opt-title">${item.name}</div>
                ${heritageBadge}
                <div class="subsystem-opt-meta">${metaStr}</div>
            `;

            div.addEventListener('click', () => {
                window.soundSystem?.playUiClick();
                onSelectCallback(item.id);
            });

            container.appendChild(div);
        });
    }

    /**
     * Compute Live Engineering Budgets and Formal Review Board Gateway
     */
    calculateBudgets() {
        const lv = PARTS_DATA.launchVehicles[this.selectedLaunchVehicleId] || PARTS_DATA.launchVehicles.falcon9;
        const bus = PARTS_DATA.buses[this.selectedBusId] || PARTS_DATA.buses.collector;
        const prop = PARTS_DATA.propulsionTanks[this.selectedPropulsionId] || PARTS_DATA.propulsionTanks.hypergolic;
        const power = PARTS_DATA.powerSystems[this.selectedPowerId] || PARTS_DATA.powerSystems.deployable_wings;
        const eq = PARTS_DATA.equipment[this.selectedEquipmentId] || PARTS_DATA.equipment.net;
        const comms = PARTS_DATA.groundComms[this.selectedGroundCommsId] || PARTS_DATA.groundComms.regional_passes;
        const client = PARTS_DATA.clients[this.selectedClientId] || PARTS_DATA.clients.esa;

        // Mass Calculations
        const dryMassKg = bus.dryMassKg + (prop.dryMassKg || 0) + (power.massKg || 0) + (eq.massKg || 0) + (comms.massKg || 0);
        const propellantMassKg = (prop.wetMassKg || 0) - (prop.dryMassKg || 0);
        const totalWetMassKg = dryMassKg + propellantMassKg;
        const launcherCapacityKg = lv.payloadToLeoKg;
        const massMarginKg = launcherCapacityKg - totalWetMassKg;
        const massMarginPct = Math.round((massMarginKg / launcherCapacityKg) * 100);

        // Volume Calculations
        const totalVolumeM3 = (bus.volumeM3 || 0) + (power.volumeM3 || 0) + (eq.volumeM3 || 0);
        const fairingVolumeM3 = lv.fairingVolumeM3;
        const volumeMarginM3 = fairingVolumeM3 - totalVolumeM3;
        const volumeMarginPct = Math.round((volumeMarginM3 / fairingVolumeM3) * 100);

        // Power Calculations
        const continuousPowerDrawW = (bus.basePowerDrawW || 0) + (eq.powerDrawW || 0) + (comms.powerDrawW || 0) + (prop.powerDrawW || 0);
        const powerGenerationW = power.generationW;
        const powerMarginW = powerGenerationW - continuousPowerDrawW;
        const powerMarginPct = Math.round((powerMarginW / powerGenerationW) * 100);

        // Lifecycle Hardware + Launch Cost
        const totalCostScrap = lv.cost + bus.cost + prop.cost + power.cost + eq.cost + comms.cost;

        // Formal Design Review Checklist & Gateway Verdict
        const checks = [
            {
                name: 'Launcher Mass Margin',
                target: `Wet Mass ≤ ${launcherCapacityKg} kg`,
                actual: `${totalWetMassKg} kg (Margin: ${massMarginPct}%)`,
                isPass: massMarginKg >= 0,
                isWarning: massMarginKg >= 0 && massMarginPct < 15
            },
            {
                name: 'Fairing Volume Envelope',
                target: `Volume ≤ ${fairingVolumeM3} m³`,
                actual: `${totalVolumeM3.toFixed(1)} m³ (Margin: ${volumeMarginPct}%)`,
                isPass: volumeMarginM3 >= 0,
                isWarning: false
            },
            {
                name: 'Continuous Power Balance',
                target: `Generation ≥ ${continuousPowerDrawW} W`,
                actual: `+${powerGenerationW} W vs -${continuousPowerDrawW} W (${powerMarginPct}%)`,
                isPass: powerMarginW >= 0,
                isWarning: powerMarginPct < 15
            },
            {
                name: 'Client Mitigation Protocol',
                target: `Max Collisions: ≤ ${client.maxCollisionsAllowed}`,
                actual: `${client.name} Standards`,
                isPass: true,
                isWarning: client.maxCollisionsAllowed <= 1
            }
        ];

        let reviewStatus = 'PASS';
        let failureReason = '';

        if (massMarginKg < 0) {
            reviewStatus = 'FAIL';
            failureReason = `Total spacecraft wet mass (${totalWetMassKg} kg) exceeds ${lv.name} orbital capacity (${launcherCapacityKg} kg) by ${Math.abs(massMarginKg)} kg. Choose a larger launch vehicle or lighter subsystems.`;
        } else if (volumeMarginM3 < 0) {
            reviewStatus = 'FAIL';
            failureReason = `Payload volume (${totalVolumeM3.toFixed(1)} m³) exceeds fairing capacity (${fairingVolumeM3} m³).`;
        } else if (powerMarginW < 0 || massMarginPct < 15) {
            reviewStatus = 'WARNING';
        }

        return {
            lv, bus, prop, power, eq, comms, client,
            dryMassKg, propellantMassKg, totalWetMassKg, launcherCapacityKg, massMarginKg, massMarginPct,
            totalVolumeM3, fairingVolumeM3, volumeMarginM3, volumeMarginPct,
            continuousPowerDrawW, powerGenerationW, powerMarginW, powerMarginPct,
            totalCostScrap, checks, reviewStatus, failureReason
        };
    }

    renderBudgetsAndReview() {
        const budgets = this.calculateBudgets();
        const dashboard = document.getElementById('budgets-dashboard');
        const reviewBoard = document.getElementById('design-review-board');

        if (dashboard) {
            const massFillClass = budgets.massMarginKg < 0 ? 'danger' : (budgets.massMarginPct < 15 ? 'warning' : '');
            const volumeFillClass = budgets.volumeMarginM3 < 0 ? 'danger' : '';
            const powerFillClass = budgets.powerMarginW < 0 ? 'danger' : (budgets.powerMarginPct < 15 ? 'warning' : '');

            const massPctClamped = Math.max(0, Math.min(100, Math.round((budgets.totalWetMassKg / budgets.launcherCapacityKg) * 100)));
            const volPctClamped = Math.max(0, Math.min(100, Math.round((budgets.totalVolumeM3 / budgets.fairingVolumeM3) * 100)));
            const powerPctClamped = Math.max(0, Math.min(100, Math.round((budgets.continuousPowerDrawW / budgets.powerGenerationW) * 100)));

            dashboard.innerHTML = `
                <!-- Mass Budget -->
                <div class="budget-row">
                    <div class="budget-header">
                        <span>MASS BUDGET (WET / CAPACITY)</span>
                        <strong>${budgets.totalWetMassKg} kg / ${budgets.launcherCapacityKg} kg (${budgets.massMarginPct}% Margin)</strong>
                    </div>
                    <div class="budget-bar-track">
                        <div class="budget-bar-fill ${massFillClass}" style="width: ${massPctClamped}%;"></div>
                    </div>
                </div>

                <!-- Volume Budget -->
                <div class="budget-row">
                    <div class="budget-header">
                        <span>FAIRING VOLUME ENVELOPE</span>
                        <strong>${budgets.totalVolumeM3.toFixed(1)} m³ / ${budgets.fairingVolumeM3} m³ (${budgets.volumeMarginPct}% Margin)</strong>
                    </div>
                    <div class="budget-bar-track">
                        <div class="budget-bar-fill ${volumeFillClass}" style="width: ${volPctClamped}%;"></div>
                    </div>
                </div>

                <!-- Power Budget -->
                <div class="budget-row">
                    <div class="budget-header">
                        <span>POWER BUDGET (LOAD / GENERATION)</span>
                        <strong>${budgets.continuousPowerDrawW} W / +${budgets.powerGenerationW} W (${budgets.powerMarginPct}% Margin)</strong>
                    </div>
                    <div class="budget-bar-track">
                        <div class="budget-bar-fill ${powerFillClass}" style="width: ${powerPctClamped}%;"></div>
                    </div>
                </div>

                <!-- Comms & Cost Metrics -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-family: var(--font-mono); font-size: 0.85rem; margin-top: 10px; border-top: 1px solid var(--border); padding-top: 8px;">
                    <div>Comms Coverage: <strong style="color: var(--clean);">${budgets.comms.coveragePercent}% (${budgets.comms.latencyMs}ms)</strong></div>
                    <div>Radar Warning Range: <strong style="color: var(--accent-cyan);">×${budgets.comms.radarRangeBonus}</strong></div>
                    <div>Delta-V Propellant Pool: <strong style="color: var(--salvage);">${budgets.prop.fuelCapacityL} L</strong></div>
                    <div>Total Hardware Cost: <strong style="color: var(--salvage);">${budgets.totalCostScrap} Scrap</strong></div>
                </div>
            `;
        }

        if (reviewBoard) {
            let bannerClass = 'pass';
            let bannerText = 'DESIGN REVIEW: PASS [FLIGHT AUTHORIZED]';

            if (budgets.reviewStatus === 'FAIL') {
                bannerClass = 'fail';
                bannerText = 'DESIGN REVIEW: FAIL [LAUNCH BLOCKED]';
            } else if (budgets.reviewStatus === 'WARNING') {
                bannerClass = 'warning';
                bannerText = 'DESIGN REVIEW: WARNING [MARGINS TIGHT]';
            }

            let checkListHtml = '';
            budgets.checks.forEach(chk => {
                const iconClass = !chk.isPass ? 'fail' : (chk.isWarning ? 'warning' : 'pass');
                const iconSymbol = !chk.isPass ? '[X]' : (chk.isWarning ? '[!]' : '[√]');
                checkListHtml += `
                    <div class="check-item">
                        <span class="status-icon ${iconClass}">${iconSymbol}</span>
                        <span style="flex: 1;"><strong>${chk.name}:</strong> ${chk.actual}</span>
                    </div>
                `;
            });

            const failNotice = budgets.failureReason ? `
                <div style="background: #380b0f; border: 1px solid var(--danger); color: #fca5a5; font-family: var(--font-mono); font-size: 0.82rem; padding: 8px; margin-top: 8px;">
                    <strong>CRITICAL DEFICIT:</strong> ${budgets.failureReason}
                </div>
            ` : '';

            reviewBoard.innerHTML = `
                <div class="review-banner ${bannerClass}">${bannerText}</div>
                <div class="review-check-list">${checkListHtml}</div>
                ${failNotice}
            `;
        }

        // Update Launch Button appearance and state based on formal review gateway
        if (this.launchMissionBtn) {
            const isBlocked = budgets.reviewStatus === 'FAIL';
            this.launchMissionBtn.disabled = false; // Always keep clickable so user receives helpful alert explaining deficits!
            this.launchMissionBtn.style.opacity = isBlocked ? '0.75' : '1.0';
            this.launchMissionBtn.style.cursor = 'pointer';
            this.launchMissionBtn.style.background = isBlocked ? '#451a1a' : '';
            this.launchMissionBtn.style.borderColor = isBlocked ? 'var(--danger)' : '';
            this.launchMissionBtn.innerText = isBlocked ? '⚠️ [DEFICIT DETECTED - CLICK TO REVIEW]' : '🚀 LAUNCH ORBITAL INSERTION';
        }
    }

    /**
     * Design Sharing Code (Deterministic compact string)
     */
    generateDesignCode() {
        const lvlStr = this.selectedLevelId.toString().padStart(2, '0');
        return `OC2-M${lvlStr}-CLI_${this.selectedClientId}-LV_${this.selectedLaunchVehicleId}-BUS_${this.selectedBusId}-PRP_${this.selectedPropulsionId}-PWR_${this.selectedPowerId}-EQ_${this.selectedEquipmentId}-COM_${this.selectedGroundCommsId}`;
    }

    parseAndApplyDesignCode(codeStr) {
        if (!codeStr || !codeStr.startsWith('OC2-')) return false;

        try {
            const parts = codeStr.split('-');
            parts.forEach(part => {
                if (part.startsWith('M')) {
                    const num = parseInt(part.replace('M', ''), 10);
                    if (num >= 1 && num <= 4) this.selectedLevelId = num;
                } else if (part.startsWith('CLI_')) {
                    const val = part.replace('CLI_', '');
                    if (PARTS_DATA.clients[val]) this.selectedClientId = val;
                } else if (part.startsWith('LV_')) {
                    const val = part.replace('LV_', '');
                    if (PARTS_DATA.launchVehicles[val]) this.selectedLaunchVehicleId = val;
                } else if (part.startsWith('BUS_')) {
                    const val = part.replace('BUS_', '');
                    if (PARTS_DATA.buses[val]) {
                        this.selectedBusId = val;
                        this.selectedShipId = val;
                    }
                } else if (part.startsWith('PRP_')) {
                    const val = part.replace('PRP_', '');
                    if (PARTS_DATA.propulsionTanks[val]) this.selectedPropulsionId = val;
                } else if (part.startsWith('PWR_')) {
                    const val = part.replace('PWR_', '');
                    if (PARTS_DATA.powerSystems[val]) this.selectedPowerId = val;
                } else if (part.startsWith('EQ_')) {
                    const val = part.replace('EQ_', '');
                    if (PARTS_DATA.equipment[val]) this.selectedEquipmentId = val;
                } else if (part.startsWith('COM_')) {
                    const val = part.replace('COM_', '');
                    if (PARTS_DATA.groundComms[val]) this.selectedGroundCommsId = val;
                }
            });

            this.save.selectedShip = this.selectedBusId;
            this.save.selectedEquipment = this.selectedEquipmentId;
            this.save.selectedClientId = this.selectedClientId;
            this.save.selectedLaunchVehicleId = this.selectedLaunchVehicleId;
            this.save.selectedPropulsionId = this.selectedPropulsionId;
            this.save.selectedPowerId = this.selectedPowerId;
            this.save.selectedGroundCommsId = this.selectedGroundCommsId;
            OrbitalStorage.save(this.save);

            this.renderStep4PointDesign();
            return true;
        } catch (err) {
            console.error('Error parsing design code:', err);
            return false;
        }
    }

    loadQuickDemoPreset() {
        // Quick Demo loads verified balanced preset for Sector 1 and immediately launches live mission!
        this.selectedLevelId = 1;
        this.adoptArchitecture('balanced');
        window.soundSystem?.playCollect(3);
        this.launchConfiguredMission();
    }

    openShareCodeModal() {
        const modal = this.screens.shareCodeModal;
        const input = document.getElementById('share-code-input');
        const status = document.getElementById('share-code-status');
        if (!modal) return;

        if (input) input.value = this.generateDesignCode();
        if (status) status.innerHTML = '';
        modal.classList.remove('hidden');
        window.soundSystem?.playUiClick();
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
                    window.soundSystem?.playCollect(3);
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

        document.getElementById('stat-total-debris').innerText = this.save.totalDebrisRecycled.toLocaleString();
        document.getElementById('stat-total-mass').innerText = (this.save.totalMassDeorbitedKg / 1000).toFixed(1) + ' t';
        document.getElementById('stat-total-missions').innerText = this.save.missionsCompleted;
        document.getElementById('stat-total-credits').innerText = this.save.credits.toLocaleString();

        const tbody = document.getElementById('leaderboard-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        this.save.leaderboard.forEach((entry, idx) => {
            const row = document.createElement('tr');
            const isArchive = entry.date === 'Archive Record';
            const dateDisplay = isArchive ? '<span style="color: var(--accent-cyan); opacity: 0.85;">Archive Record</span>' : (entry.date || 'Archive Record');
            const statusTag = entry.status === 'FAILED' ? ' <span style="color: var(--danger); font-size: 0.75rem;">[FAILED]</span>' : '';
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
        const budgets = this.calculateBudgets();

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

        // Pass full point design parameters to scene
        this.currentGame.scene.start('OrbitalGameScene', {
            level: level,
            client: budgets.client,
            launchVehicle: budgets.lv,
            bus: budgets.bus,
            propulsion: budgets.prop,
            power: budgets.power,
            equipment: budgets.eq,
            groundComms: budgets.comms,
            budgets: budgets,
            designCode: this.generateDesignCode(),
            // Legacy fallbacks
            shipId: this.selectedBusId,
            equipmentId: this.selectedEquipmentId,
            payloadId: 'balanced'
        });

        window.soundSystem?.resume();
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

        // Radar Reticle Crosshair
        ctx.strokeStyle = '#1f293d';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
        ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
        ctx.arc(w / 2, h / 2, w * 0.35, 0, Math.PI * 2);
        ctx.stroke();

        const worldW = scene.missionConfig.worldSize.width;
        const worldH = scene.missionConfig.worldSize.height;

        const toMapX = (x) => (x / worldW) * w;
        const toMapY = (y) => (y / worldH) * h;

        // Station (Clean green square)
        ctx.fillStyle = '#10b981';
        ctx.fillRect(toMapX(scene.station.x) - 4, toMapY(scene.station.y) - 4, 8, 8);

        // Debris (Salvage amber / cyan dots)
        ctx.fillStyle = '#38bdf8';
        scene.debrisGroup.getChildren().forEach(d => {
            if (d.active && !d.isPendingCollection) {
                ctx.fillRect(toMapX(d.x) - 1.5, toMapY(d.y) - 1.5, 3, 3);
            }
        });

        // Hazards (Crisp danger red dots)
        ctx.fillStyle = '#ef4444';
        scene.hazardGroup.getChildren().forEach(haz => {
            if (haz.active) {
                ctx.fillRect(toMapX(haz.x) - 2.5, toMapY(haz.y) - 2.5, 5, 5);
            }
        });

        // Player (High-contrast white arrow)
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

    // Results Modal / Debrief v2 Hook
    window.showMissionResultsModal = (results) => {
        const modal = document.getElementById('modal-results');
        if (!modal) return;

        const headline = document.getElementById('results-headline');
        const reason = document.getElementById('results-reason');
        const starsContainer = document.getElementById('res-stars');
        const auditTbody = document.getElementById('debrief-audit-tbody');
        const timelineView = document.getElementById('debrief-timeline-view');
        const logStream = document.getElementById('debrief-flight-log');
        const recPanel = document.getElementById('debrief-recommendations-panel');
        const shareCodeText = document.getElementById('debrief-share-code');

        // Headline & Stars
        headline.innerText = results.isVictory ? 'MISSION ACCOMPLISHED // FLIGHT DEBRIEF' : 'MISSION FAILED // INCIDENT REPORT';
        headline.className = `results-title ${results.isVictory ? 'victory' : 'defeat'}`;
        reason.innerText = results.reason;

        const starCount = results.stars;
        starsContainer.innerText = '★'.repeat(starCount) + '☆'.repeat(3 - starCount);

        // 1. Requirements Audit Table
        if (auditTbody && results.requirementsAudit) {
            auditTbody.innerHTML = '';
            results.requirementsAudit.forEach(req => {
                const tr = document.createElement('tr');
                const verdictClass = req.isPass ? 'color: var(--clean);' : 'color: var(--danger);';
                const verdictText = req.isPass ? '[PASS]' : '[FAIL]';
                tr.innerHTML = `
                    <td><strong>${req.name}</strong></td>
                    <td>${req.target}</td>
                    <td>${req.actual}</td>
                    <td style="${verdictClass} font-weight: bold;">${verdictText}</td>
                `;
                auditTbody.appendChild(tr);
            });
        }

        // 2. CONOPS Timeline Comparison
        if (timelineView && results.timelineComparison) {
            timelineView.innerHTML = '';
            results.timelineComparison.forEach(stage => {
                const div = document.createElement('div');
                div.style.display = 'flex';
                div.style.justifyContent = 'space-between';
                div.style.padding = '3px 0';
                div.style.borderBottom = '1px dotted #162030';
                div.innerHTML = `
                    <span>• <strong>${stage.name}:</strong> ${stage.status}</span>
                    <span style="color: var(--accent-cyan);">${stage.timestamp}</span>
                `;
                timelineView.appendChild(div);
            });
        }

        // 3. Flight Telemetry Event Log Stream
        if (logStream && results.flightEvents) {
            logStream.innerHTML = '';
            results.flightEvents.forEach(evt => {
                const div = document.createElement('div');
                div.className = `log-entry ${evt.status || ''}`;
                div.innerHTML = `[T+${evt.time}s] [${evt.tag}] ${evt.message}`;
                logStream.appendChild(div);
            });
            logStream.scrollTop = logStream.scrollHeight;
        }

        // 4. Redesign Recommendations & Architecture Rating
        if (recPanel) {
            recPanel.innerHTML = `
                <div style="font-family: var(--font-pixel); font-size: 0.75rem; color: var(--salvage); margin-bottom: 4px;">
                    SYSTEMS REDESIGN RECOMMENDATION &amp; ANALYSIS:
                </div>
                <p style="color: var(--ink); margin: 0;">${results.redesignRecommendation}</p>
                <div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--accent-cyan); margin-top: 6px;">
                    Contract Performance: <strong>${results.clientVerdict}</strong> | Total Reward: <strong>+${results.creditsEarned} Scrap</strong>
                </div>
            `;
        }

        // 5. Design Code
        if (shareCodeText) {
            shareCodeText.innerText = results.designCode || window.uiController.generateDesignCode();
        }

        const nextBtn = document.getElementById('btn-results-next');
        if (nextBtn) {
            nextBtn.style.display = results.isVictory ? 'inline-block' : 'none';
        }

        modal.classList.remove('hidden');
    };
});
