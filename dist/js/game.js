/**
 * ORBITAL CLEANUP: MISSION ZERO
 * Core Phaser.js Game Scene & Physics Architecture
 */

class OrbitalGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'OrbitalGameScene' });
    }

    init(data) {
        this.missionConfig = data.level || GAME_DATA.LEVELS[0];

        // Phase 2 Point Design Components
        this.pointDesign = {
            client: data.client || (typeof PARTS_DATA !== 'undefined' ? PARTS_DATA.clients.esa : null),
            launchVehicle: data.launchVehicle || (typeof PARTS_DATA !== 'undefined' ? PARTS_DATA.launchVehicles.falcon9 : null),
            bus: data.bus || (typeof PARTS_DATA !== 'undefined' ? PARTS_DATA.buses[data.shipId || 'collector'] : null),
            propulsion: data.propulsion || (typeof PARTS_DATA !== 'undefined' ? PARTS_DATA.propulsionTanks.hypergolic : null),
            power: data.power || (typeof PARTS_DATA !== 'undefined' ? PARTS_DATA.powerSystems.deployable_wings : null),
            equipment: data.equipment || GAME_DATA.EQUIPMENT[data.equipmentId || 'arm'],
            groundComms: data.groundComms || (typeof PARTS_DATA !== 'undefined' ? PARTS_DATA.groundComms.regional_passes : null),
            budgets: data.budgets || null,
            designCode: data.designCode || ''
        };

        const busId = this.pointDesign.bus ? this.pointDesign.bus.id : (data.shipId || 'scout');
        this.shipConfig = GAME_DATA.SHIPS[busId] || GAME_DATA.SHIPS['scout'];
        this.equipmentConfig = this.pointDesign.equipment || GAME_DATA.EQUIPMENT[data.equipmentId || 'arm'];
        this.payloadConfig = GAME_DATA.PAYLOAD_TUNINGS[data.payloadId || 'balanced'] || { speedMod: 1, fuelMod: 1, batteryMod: 1, hullMod: 1, handlingMod: 1, solarMod: 1 };
        
        // Persistent Upgrades
        const save = OrbitalStorage.load();
        this.upgrades = save.upgrades || {};

        // Calculate final stats with upgrades & Point Design physics modifiers
        const engineLvl = this.upgrades.engine || 0;
        const hullLvl = this.upgrades.hull || 0;
        const batteryLvl = this.upgrades.battery || 0;
        const cargoLvl = this.upgrades.cargo || 0;
        const sensorLvl = this.upgrades.sensor || 0;

        // Spacecraft physics affected by Point Design Wet Mass
        const totalWetMassKg = this.pointDesign.budgets ? this.pointDesign.budgets.totalWetMassKg : 650;
        const massRatio = Math.max(0.65, Math.min(2.2, totalWetMassKg / 650));

        const baseBusSpeed = this.pointDesign.bus?.baseSpeed || this.shipConfig.speed || 300;
        const baseTurnRate = this.pointDesign.bus?.turnRate || this.shipConfig.turnRate || 180;
        const maxBaseHull = this.pointDesign.bus?.maxHull || this.shipConfig.maxHull || 120;

        this.maxSpeed = ((baseBusSpeed * (1 + engineLvl * 0.08)) / Math.pow(massRatio, 0.22)) * (this.payloadConfig.speedMod || 1.0);
        this.acceleration = ((baseBusSpeed * 0.58 * (1 + engineLvl * 0.06)) / Math.sqrt(massRatio)) * (this.payloadConfig.speedMod || 1.0);
        this.turnRate = ((baseTurnRate * (1 + engineLvl * 0.03)) / massRatio) * (this.payloadConfig.handlingMod || 1.0);

        // Propulsion subsystem: fuel pool & burn rate
        this.maxFuel = (this.pointDesign.propulsion?.fuelCapacityL || this.shipConfig.maxFuel) * (this.payloadConfig.fuelMod || 1.0);
        const baseBurnRate = this.pointDesign.propulsion?.fuelBurnRate || this.shipConfig.fuelBurnRate;
        this.fuelBurnRate = baseBurnRate * (1 - engineLvl * 0.12);
        this.fuel = this.maxFuel;

        // Power subsystem: battery capacity & solar recharge
        const baseBatteryPool = this.pointDesign.power?.batteryPool || this.shipConfig.maxBattery;
        const baseRecharge = this.pointDesign.power?.rechargeRate || this.shipConfig.batteryRechargeRate;
        this.maxBattery = (baseBatteryPool * (1 + batteryLvl * 0.2)) * (this.payloadConfig.batteryMod || 1.0);
        this.batteryRechargeRate = (baseRecharge * (1 + batteryLvl * 0.25)) * (this.payloadConfig.solarMod || 1.0);
        this.battery = this.maxBattery;

        // Hull armor & damage reduction
        this.maxHull = (maxBaseHull * (1 + hullLvl * 0.2)) * (this.payloadConfig.hullMod || 1.0);
        this.hull = this.maxHull;
        this.damageReduction = Math.max(0.25, 1 - (hullLvl * 0.15));

        // Cargo capacity
        const baseCargo = this.pointDesign.bus?.cargoCapacity || this.shipConfig.cargoCapacity;
        this.cargoCapacity = baseCargo + cargoLvl;
        this.cargo = []; // Array of collected debris items

        // Communications & Ground Relay affects early warning radar
        const commsBonus = this.pointDesign.groundComms?.radarRangeBonus || 1.0;
        this.radarMultiplier = (1 + (sensorLvl * 0.15)) * commsBonus;

        // Phase 8c Technology Tree Stat Modifiers
        if (typeof CampaignManager !== 'undefined' && typeof CampaignManager.getTechStatModifiers === 'function') {
            const techMods = CampaignManager.getTechStatModifiers(save);
            this.maxBattery += techMods.batteryMaxBonus;
            this.battery = this.maxBattery;
            this.batteryRechargeRate *= techMods.solarRechargeMod;
            this.maxHull += techMods.hullMaxBonus;
            this.hull = this.maxHull;
            this.damageReduction *= (1 - techMods.collisionDamageDamping);
            this.radarMultiplier *= techMods.radarRangeMod;
            this.turnRate *= techMods.handlingMod;
            this.fuelBurnRate *= (1 - techMods.fuelBurnReduction);
            if (techMods.extraNetCapacity > 0 && this.equipmentConfig && this.equipmentConfig.maxCapacity) {
                this.equipmentConfig.maxCapacity += techMods.extraNetCapacity;
            }
            this.techStatModifiers = techMods;
        }

        // Client Constraints & Objectives
        this.clientConfig = this.pointDesign.client || (typeof PARTS_DATA !== 'undefined' ? PARTS_DATA.clients.esa : { id: 'esa', name: 'ESA Clean Space', payoutMultiplier: 1.25, maxCollisionsAllowed: 1 });
        this.maxCollisionsAllowed = this.clientConfig.maxCollisionsAllowed || 3;
        this.clientPayoutMultiplier = this.clientConfig.payoutMultiplier || 1.0;
        this.clientBonusCondition = this.clientConfig.bonusCondition || 'Zero collisions and safe return';

        // Phase 5 AI Flight Director & Mission Difficulty Balancing
        this.selectedDifficulty = (this.missionConfig && this.missionConfig.difficulty) ||
                                  (typeof OrbitalStorage !== 'undefined' ? OrbitalStorage.load().selectedDifficulty : 'standard') ||
                                  'standard';
        const diffConfig = (typeof GAME_DATA !== 'undefined' && GAME_DATA.DIFFICULTIES && GAME_DATA.DIFFICULTIES[this.selectedDifficulty]) || {
            fuelBurnMultiplier: 1.0,
            damageMultiplier: 1.0,
            hazardSpeedMultiplier: 1.0,
            timeLimitMultiplier: 1.0,
            scoreMultiplier: 1.0
        };
        this.difficultyConfig = diffConfig;
        this.fuelBurnRate *= diffConfig.fuelBurnMultiplier;
        this.damageMultiplier = diffConfig.damageMultiplier;
        this.hazardSpeedMultiplier = diffConfig.hazardSpeedMultiplier;
        this.scoreMultiplier = diffConfig.scoreMultiplier;

        // Phase 8c: Cascade Survival Mode Configuration
        this.isSurvivalMode = Boolean(this.missionConfig?.isSurvival || this.isSurvival);
        if (this.isSurvivalMode) {
            this.survivalTimeElapsed = 0;
            this.survivalWave = 1;
            this.debrisTargetQuota = 999;
            this.missionTime = 0;
        }

        // Mission Run State
        this.score = 0;
        this.creditsEarned = 0;
        this.debrisDeliveredCount = 0;
        this.debrisTargetQuota = this.isSurvivalMode ? 999 : this.missionConfig.targetQuota;
        this.deliveriesCompleted = 0;
        this.collisionsCount = 0;
        this.totalFuelBurned = 0;
        this.missionMassDeorbitedKg = 0;
        this.missionTime = this.isSurvivalMode ? 0 : Math.round(this.missionConfig.timeLimit * diffConfig.timeLimitMultiplier);
        this.timeLimitTotal = this.isSurvivalMode ? 9999 : this.missionTime;
        this.elapsedTime = 0;
        this.isMissionOver = false;
        this.isDocked = false;
        this.dockTimer = 0;
        this.lastEquipmentFireTime = 0;
        this.activeGrapple = null;
        this.activeNets = [];
        this.warningActive = false;

        // Telemetry milestones
        this.flightEvents = [];
        this.firstCaptureTime = null;
        this.firstDockTime = null;
        this.loggedLowFuel = false;
        this.loggedLowBat = false;

        // Queues for physics-safe creation / destruction
        this.pendingCollections = [];
        this.pendingHazardDestructions = [];
        this.pendingFragmentations = [];

        // Phase 4 Orbital Mechanics & Salvage Depth
        this.kesslerRisk = 12;
        this.materialsSession = { metal: 0, cells: 0, chips: 0 };
        this.nudgesCount = 0;
        this.laserNudgeEffect = null;

        // Phase 3 Data-Driven Scripted Events & Sector Atmospheric Drag
        this.triggeredScriptedEvents = new Set();
        this.activeAtmosphericDrag = 1.0;
        this.activeEventAlert = null;
        this.eventAlertTimer = 0;

        // Phase 8a Persistent Campaign State & Active Contracts
        const saveState = OrbitalStorage.load();
        this.activeContract = saveState.activeContract || null;
        this.contractObjective = this.activeContract ? this.activeContract.objective : 'quota';
        this.contractModifiers = this.activeContract ? (this.activeContract.modifiers || []) : [];
        this.passivatedStagesCount = 0;
        this.priorityCoreDelivered = false;

        if (this.activeContract) {
            this.debrisTargetQuota = this.activeContract.targetQuota;
            this.missionTime = this.activeContract.timeLimit;
            this.timeLimitTotal = this.missionTime;
            this.contractPayout = this.activeContract.scrapPayout;
        }

        const sectorKey = 'sector_0' + this.missionConfig.id;
        this.carryoverDebrisCount = (saveState.carryoverDebris && saveState.carryoverDebris[sectorKey]) || 0;

        // Apply contract modifiers to spacecraft systems
        if (this.contractModifiers.includes('low_budget')) {
            this.fuel = this.maxFuel * 0.65;
            this.battery = this.maxBattery * 0.65;
        }
        if (this.contractModifiers.includes('blackout')) {
            this.radarMultiplier = (this.radarMultiplier || 1.0) * 0.70;
        }
        if (this.contractModifiers.includes('dead_stick')) {
            this.fuelDrainMultiplier = 1.35;
        }
        if (this.contractModifiers.includes('storm_season')) {
            this.spaceWeatherInterval = 22000;
        }
    }

    logFlightEvent(tag, message, status = 'info') {
        const timeSec = Math.round(this.elapsedTime);
        if (!this.flightEvents) this.flightEvents = [];
        this.flightEvents.push({ time: timeSec, tag, message, status });
        if (this.flightEvents.length > 50) this.flightEvents.shift();
    }

    preload() {
        // Procedurally generate all canvas textures if not already cached
        TextureGenerator.generateAll(this);
    }

    create() {
        const worldWidth = this.missionConfig.worldSize.width;
        const worldHeight = this.missionConfig.worldSize.height;

        // Configure Arcade Physics World
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
        this.physics.world.setBoundsCollision(true, true, true, true);

        // 1. Starfields & Animated Earth
        this.createSpaceEnvironment(worldWidth, worldHeight);

        // 2. Orbital Recycling Station (The Aegis Depot)
        this.createSpaceStation(worldWidth * 0.5, worldHeight * 0.5);

        // 3. Player Spacecraft
        this.createPlayer(worldWidth * 0.5, worldHeight * 0.5 + 240);

        // 4. Object Groups
        this.debrisGroup = this.physics.add.group();
        this.hazardGroup = this.physics.add.group();
        this.netGroup = this.physics.add.group();

        // 5. Spawn Initial Mission Debris & Hazards
        this.spawnInitialDebris();

        // Timers for continual debris respawn and kinetic hazards
        this.debrisSpawnTimer = this.time.addEvent({
            delay: this.missionConfig.respawnRate,
            callback: this.spawnDebrisItem,
            callbackScope: this,
            loop: true
        });

        this.hazardSpawnTimer = this.time.addEvent({
            delay: this.missionConfig.hazardRate,
            callback: this.spawnHazardItem,
            callbackScope: this,
            loop: true
        });

        // 6. Camera Setup
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.0);

        // 7. Input Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.keyH = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H);

        // Phase 5 AI Flight Director
        this.director = new MissionDirector(this);

        // Phase 8a Contract Objective Spawns & Modifiers
        if (this.contractModifiers && this.contractModifiers.includes('dead_stick') && this.player) {
            this.player.setAngularDrag(110);
        }
        if (this.contractObjective === 'recover') {
            this.spawnPriorityCore();
        }
        if (this.contractObjective === 'protect') {
            this.spawnProtectedSatellites();
        }
        if (this.contractObjective === 'passivate') {
            this.spawnSpecificHazard('venting_rocket');
        }
        if (this.contractModifiers && this.contractModifiers.includes('storm_season')) {
            this.time.delayedCall(4000, () => this.triggerSpaceWeatherEvent());
        }

        // 8. Collisions and Overlaps
        this.physics.add.collider(this.player, this.debrisGroup, this.handleShipDebrisBump, null, this);
        this.physics.add.collider(this.debrisGroup, this.debrisGroup, this.handleDebrisDebrisCollision, null, this);
        this.physics.add.overlap(this.player, this.hazardGroup, this.handleShipHazardCollision, null, this);
        this.physics.add.collider(this.debrisGroup, this.hazardGroup, this.handleHazardDebrisCollision, null, this);

        // 9. Particle Managers
        this.createParticleSystems();

        // 10. Direct Graphics Overlay for Tether, Tractor Beam, & Indicators
        this.fxGraphics = this.add.graphics().setDepth(20);
        this.hudGraphics = this.add.graphics().setDepth(100).setScrollFactor(0);

        // Phase 6 Visual FX Timers & States
        this.launchBurnTimer = 2.4;
        this.launchAnnounced = false;
        this.shieldTimer = 0;

        // Phase 7 Orbital Lanes & Space Weather States
        this.laneDriftSpeed = 35;
        this.currentLane = 2;
        this.activeSpaceWeather = null;
        this.spaceWeatherTimer = 0;
        this.spaceWeatherCooldown = (typeof Phaser !== 'undefined' && Phaser.Math && Phaser.Math.Between) ? Phaser.Math.Between(15, 28) : 20;
        this.spaceWeatherShieldDamping = 1.0;
        this.effectiveSolarMod = 1.0;
        this.effectiveRadarMultiplier = this.radarMultiplier || 1.0;

        // Storm Season Contract Modifier & Space Weather Hazard Dynamics
        this.isStormSeason = (this.contractModifiers && this.contractModifiers.includes('storm_season'));
        this.stormPulseTimer = this.isStormSeason ? 8.0 : 12.0;
        this.stormWindAngle = Math.PI * 0.18; // Directional solar wind vector
        this.stormAvionicsJitterTimer = 0;

        if (typeof GAME_DATA !== 'undefined' && GAME_DATA.features && GAME_DATA.features.spaceWeather) {
            if (this.isStormSeason) {
                this.time.delayedCall(1500, () => {
                    this.triggerSpaceWeatherEvent();
                });
            } else if (this.missionConfig.id === 'low_altitude_breakup' || this.missionConfig.id === 'cascade_finale') {
                this.time.delayedCall(3500, () => {
                    this.triggerSpaceWeatherEvent();
                });
            }
        }

        // Initial Mission Flight Telemetry Log
        this.logFlightEvent('INSERTION', `Orbital injection complete. Sector ${this.missionConfig.name.split(':')[0]} nominal.`, 'success');

        // Notify UI that mission has officially launched
        if (window.onGameSceneReady) {
            window.onGameSceneReady(this);
        }
    }

    createSpaceEnvironment(w, h) {
        // Sector-specific visual palette
        const palette = this.missionConfig.palette || {};
        const bgColor = palette.spaceBg || '#050814';
        this.cameras.main.setBackgroundColor(bgColor);

        // Distant Parallax Pixel Starfield & Orbital Altitude Grid
        const starGraphics = this.add.graphics().setDepth(-10);
        const starColors = palette.starColors || [0xffffff, 0x38bdf8, 0xa855f7, 0xfde047];

        // 1. Pixel Orbital Altitude Track Bands
        const gridColorNum = Phaser.Display.Color.HexStringToColor(palette.accentColor || '#38bdf8').color;
        starGraphics.lineStyle(1, gridColorNum, 0.12);
        for (let y = 300; y < h; y += 550) {
            // Dashed pixel orbital inclination lines
            for (let x = 0; x < w; x += 32) {
                starGraphics.lineBetween(x, y, x + 16, y);
            }
        }

        // Phase 7 Orbital Lane Boundaries (Behind GAME_DATA.features.orbitalLanes flag)
        if (typeof GAME_DATA !== 'undefined' && GAME_DATA.features && GAME_DATA.features.orbitalLanes) {
            // Lane 3 / Lane 2 Boundary (High Apogee vs Co-Orbital Harbor)
            starGraphics.lineStyle(1.5, 0xa855f7, 0.35);
            for (let x = 0; x < w; x += 40) {
                starGraphics.lineBetween(x, 1100, x + 24, 1100);
            }
            // Lane 2 / Lane 1 Boundary (Co-Orbital Harbor vs Low Perigee)
            starGraphics.lineStyle(1.5, 0x10b981, 0.35);
            for (let x = 0; x < w; x += 40) {
                starGraphics.lineBetween(x, 2100, x + 24, 2100);
            }
        }

        // 2. Pixel Stars: 4 distinct retro types (dots, squares, diamonds, cross sparkles)
        for (let i = 0; i < 750; i++) {
            const x = Math.floor(Phaser.Math.Between(0, w));
            const y = Math.floor(Phaser.Math.Between(0, h));
            const color = Phaser.Utils.Array.GetRandom(starColors);
            const roll = Math.random();

            if (roll < 0.60) {
                // Type 1: Single micro-pixel (1x1)
                starGraphics.fillStyle(color, 0.45);
                starGraphics.fillRect(x, y, 1, 1);
            } else if (roll < 0.85) {
                // Type 2: Standard pixel star (2x2)
                starGraphics.fillStyle(color, 0.75);
                starGraphics.fillRect(x, y, 2, 2);
            } else if (roll < 0.96) {
                // Type 3: Diamond pixel star (3x3 plus core)
                starGraphics.fillStyle(color, 0.90);
                starGraphics.fillRect(x, y - 1, 1, 3);
                starGraphics.fillRect(x - 1, y, 3, 1);
                starGraphics.fillStyle(0xffffff, 1.0);
                starGraphics.fillRect(x, y, 1, 1);
            } else {
                // Type 4: Bright 4-point cross sparkle star (5x5)
                starGraphics.fillStyle(color, 0.95);
                starGraphics.fillRect(x, y - 2, 1, 5);
                starGraphics.fillRect(x - 2, y, 5, 1);
                starGraphics.fillStyle(0xffffff, 1.0);
                starGraphics.fillRect(x - 1, y - 1, 3, 3);
            }
        }

        // Animated Rotating Earth (Parallax background, scaled by orbital altitude)
        const earthScale = palette.earthScale || 1.0;
        const earthAlpha = palette.earthAlpha !== undefined ? palette.earthAlpha : 0.92;
        this.earth = this.add.sprite(w * 0.45, h * 0.48, 'earth_bg')
            .setDepth(-5)
            .setScrollFactor(0.2) // Parallax depth
            .setScale(earthScale)
            .setAlpha(earthAlpha);

        // Slow orbital rotation of Earth
        this.tweens.add({
            targets: this.earth,
            angle: 360,
            duration: 360000,
            repeat: -1
        });
    }

    /**
     * Scripted Event Handler: Spawns a localized debris cluster near the player
     */
    spawnDebrisCluster(count, originX, originY) {
        const allowedTypes = this.missionConfig.debrisTypes || ['fragment'];
        for (let i = 0; i < count; i++) {
            const debrisKey = Phaser.Utils.Array.GetRandom(allowedTypes);
            const debrisMeta = GAME_DATA.DEBRIS_TYPES[debrisKey];
            if (!debrisMeta) continue;

            const angle = Math.random() * Math.PI * 2;
            const dist = Phaser.Math.Between(260, 520);
            const x = Phaser.Math.Clamp(originX + Math.cos(angle) * dist, 120, this.missionConfig.worldSize.width - 120);
            const y = Phaser.Math.Clamp(originY + Math.sin(angle) * dist, 120, this.missionConfig.worldSize.height - 120);

            const debris = this.debrisGroup.create(x, y, debrisMeta.spriteKey);
            debris.setDepth(5);
            debris.debrisType = debrisMeta; // Compatible with all capture equipment
            debris.debrisMeta = debrisMeta;
            debris.setBounce(0.85);
            debris.setDamping(true);
            debris.setDrag(0.992);
            debris.setVelocity(Phaser.Math.Between(-120, 120), Phaser.Math.Between(-120, 120));
            debris.setAngularVelocity(Phaser.Math.Between(-60, 60));
            const r = debrisMeta.size ? (debrisMeta.size / 2) : 16;
            debris.body.setCircle(r);
        }
    }

    /**
     * Scripted Event Handler: Spawns a targeted hazardous obstacle
     */
    spawnSpecificHazard(hazardKey) {
        const hazardMeta = GAME_DATA.HAZARD_TYPES[hazardKey] || GAME_DATA.HAZARD_TYPES.meteoroid;
        const w = this.missionConfig.worldSize.width;
        const h = this.missionConfig.worldSize.height;

        let x, y;
        const edge = Phaser.Math.Between(0, 3);
        if (edge === 0) { x = Phaser.Math.Between(100, w - 100); y = 80; }
        else if (edge === 1) { x = w - 80; y = Phaser.Math.Between(100, h - 100); }
        else if (edge === 2) { x = Phaser.Math.Between(100, w - 100); y = h - 80; }
        else { x = 80; y = Phaser.Math.Between(100, h - 100); }

        const hazard = this.hazardGroup.create(x, y, hazardMeta.spriteKey);
        hazard.setDepth(6);
        hazard.hazardMeta = hazardMeta;
        hazard.hazardKey = hazardKey;

        const targetX = this.player.x + Phaser.Math.Between(-250, 250);
        const targetY = this.player.y + Phaser.Math.Between(-250, 250);
        const trajectory = Phaser.Math.Angle.Between(x, y, targetX, targetY);
        const speed = (hazardMeta.speed || 180) * 1.1;

        hazard.setVelocity(Math.cos(trajectory) * speed, Math.sin(trajectory) * speed);
        hazard.setAngularVelocity(Phaser.Math.Between(-80, 80));
        hazard.body.setCircle(20, hazard.width / 2 - 20, hazard.height / 2 - 20);

        this.time.delayedCall(22000, () => {
            if (hazard && typeof hazard.destroy === 'function') {
                hazard.destroy();
            }
        });
    }

    /**
     * Triggers a scripted narrative or tactical event from mission configuration
     */
    triggerScriptedEvent(evt) {
        if (this.director) {
            this.director.eventTimer = 0;
            this.director.nextEventInterval = Phaser.Math.FloatBetween(5.5, 7.5);
        }
        const isInfo = evt.effect === 'telemetry';
        this.logFlightEvent(evt.tag, evt.message, isInfo ? 'info' : 'warn');
        this.activeEventAlert = `[${evt.tag}] ${evt.message}`;
        this.eventAlertTimer = 5.0; // Banner visible for 5s

        if (window.soundSystem?.playAlert) {
            window.soundSystem.playAlert();
        }

        if (evt.effect === 'spawn_wave') {
            this.spawnDebrisCluster(evt.count || 3, this.player.x, this.player.y);
        } else if (evt.effect === 'spawn_hazard') {
            this.spawnSpecificHazard(evt.hazardType || 'meteoroid');
        } else if (evt.effect === 'drag_surge') {
            this.activeAtmosphericDrag = 0.70;
            this.time.delayedCall(20000, () => {
                this.activeAtmosphericDrag = 1.0;
                this.logFlightEvent('DRAG RECOVERY', 'Atmospheric density restored to baseline.', 'info');
            });
        }
    }

    createSpaceStation(x, y) {
        // Station perimeter boundary ring
        this.stationPerimeter = this.add.sprite(x, y, 'station_perimeter')
            .setDepth(1)
            .setScale(1.1);

        this.tweens.add({
            targets: this.stationPerimeter,
            alpha: { from: 0.4, to: 0.8 },
            duration: 2200,
            yoyo: true,
            repeat: -1
        });

        // Aegis Orbital Depot main structure
        this.station = this.physics.add.sprite(x, y, 'space_station')
            .setDepth(2)
            .setImmovable(true);
        this.station.body.setCircle(45, 115, 115);

        // Rotating ring animation
        this.tweens.add({
            targets: this.station,
            angle: 360,
            duration: 45000,
            repeat: -1
        });

        this.stationDockingRadius = 185;
    }

    createPlayer(x, y) {
        this.player = this.physics.add.sprite(x, y, this.shipConfig.spriteKey)
            .setDepth(10)
            .setDrag(120)
            .setAngularDrag(220)
            .setMaxVelocity(this.maxSpeed);

        this.player.body.setCollideWorldBounds(true);
        this.player.body.setCircle(22, this.player.width / 2 - 22, this.player.height / 2 - 22);

        // Ship forward orientation starts facing UP (-PI/2)
        this.player.setRotation(-Math.PI / 2);
    }

    createParticleSystems() {
        // Thruster exhaust particles
        this.thrusterParticles = this.add.particles(0, 0, 'particle_thruster', {
            speed: { min: 40, max: 120 },
            scale: { start: 0.6, end: 0.05 },
            alpha: { start: 0.85, end: 0 },
            lifespan: 250,
            blendMode: 'ADD',
            emitting: false
        }).setDepth(9);

        // Spark particles for collision & collection
        this.sparkParticles = this.add.particles(0, 0, 'particle_spark', {
            speed: { min: 80, max: 260 },
            scale: { start: 0.8, end: 0.1 },
            alpha: { start: 1, end: 0 },
            lifespan: 400,
            blendMode: 'ADD',
            emitting: false
        }).setDepth(15);

        // Station recycling beam particles
        this.recycleParticles = this.add.particles(0, 0, 'particle_recycle', {
            speed: { min: 60, max: 180 },
            scale: { start: 0.7, end: 0.1 },
            alpha: { start: 0.9, end: 0 },
            lifespan: 500,
            blendMode: 'ADD',
            emitting: false
        }).setDepth(15);

        // Pixel smoke puffs for heavy collisions & venting
        this.smokeParticles = this.add.particles(0, 0, 'particle_smoke', {
            speed: { min: 25, max: 85 },
            scale: { start: 0.8, end: 1.5 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 650,
            blendMode: 'NORMAL',
            emitting: false
        }).setDepth(14);

        // Pixel expanding shockwaves
        this.shockwaveParticles = this.add.particles(0, 0, 'particle_shockwave', {
            speed: { min: 20, max: 60 },
            scale: { start: 0.5, end: 2.2 },
            alpha: { start: 0.9, end: 0 },
            lifespan: 400,
            blendMode: 'ADD',
            emitting: false
        }).setDepth(16);
    }

    spawnInitialDebris() {
        let count = this.missionConfig.initialDebrisCount;
        if (this.contractModifiers && this.contractModifiers.includes('dense_cloud')) {
            count = Math.round(count * 1.5);
        }
        count += (this.carryoverDebrisCount || 0);
        for (let i = 0; i < count; i++) {
            this.spawnDebrisItem();
        }
    }

    spawnSurvivalWaveBonus() {
        if (!this.player || !this.debrisGroup) return;
        const extraCount = 3 + Math.min(6, this.survivalWave);
        for (let i = 0; i < extraCount; i++) {
            this.spawnDebrisItem();
        }
        if (typeof this.spawnHazardItem === 'function') {
            this.spawnHazardItem();
        }
        this.logFlightEvent('SURVIVAL_WAVE', `Cascade density surged to Wave ${this.survivalWave}! +${extraCount} fragments spawned.`, 'crit');
    }

    spawnPriorityCore() {
        const w = this.missionConfig.worldSize.width;
        const h = this.missionConfig.worldSize.height;
        const x = Phaser.Math.Between(w * 0.25, w * 0.75);
        const y = Phaser.Math.Between(h * 0.25, h * 0.75);
        const core = this.debrisGroup.create(x, y, 'debris_satellite');
        core.setDepth(7);
        core.isPriorityCore = true;
        core.debrisType = { id: 'priority_core', name: 'Priority Instrument Core', mass: 120, size: 28, score: 500, materials: { metal: 3, cells: 3, chips: 2 } };
        core.setTint(0xffd700);
        core.setBounce(0.85);
        core.setVelocity(Phaser.Math.Between(-30, 30), Phaser.Math.Between(-30, 30));
        core.body.setCircle(14, core.width / 2 - 14, core.height / 2 - 14);
        this.priorityCore = core;
        this.logFlightEvent('CONTRACT', 'Priority instrument core located on orbital radar.', 'info');
    }

    spawnProtectedSatellites() {
        this.protectedSatellitesGroup = this.physics.add.group();
        const w = this.missionConfig.worldSize.width;
        const h = this.missionConfig.worldSize.height;
        for (let i = 0; i < 2; i++) {
            const x = (w * 0.35) + (i * 650);
            const y = (h * 0.5) + (i === 0 ? -180 : 180);
            const sat = this.protectedSatellitesGroup.create(x, y, 'debris_satellite');
            sat.setDepth(7);
            sat.isProtectedSat = true;
            sat.satHull = 100;
            sat.setTint(0x38bdf8);
            sat.setVelocity(35, 0); // Lane 2 co-orbital speed
            sat.body.setCircle(14, sat.width / 2 - 14, sat.height / 2 - 14);
        }
        this.logFlightEvent('PROTECT', 'Active commercial satellites deployed. Maintain defensive perimeter.', 'info');
    }

    spawnDebrisItem() {
        const maxLimit = (this.contractModifiers && this.contractModifiers.includes('dense_cloud'))
            ? Math.round((this.missionConfig.initialDebrisCount + 10) * 1.5)
            : (this.missionConfig.initialDebrisCount + 10);
        if (this.debrisGroup.countActive(true) >= maxLimit) return;

        const w = this.missionConfig.worldSize.width;
        const h = this.missionConfig.worldSize.height;

        // Choose position outside station safety perimeter
        let x, y, distToStation;
        let attempts = 0;
        do {
            x = Phaser.Math.Between(150, w - 150);
            y = Phaser.Math.Between(150, h - 150);
            distToStation = Phaser.Math.Distance.Between(x, y, this.station.x, this.station.y);
            attempts++;
        } while (distToStation < 350 && attempts < 10);

        // Select debris class from allowed mission debris
        const allowedTypes = this.missionConfig.debrisTypes;
        const typeKey = Phaser.Utils.Array.GetRandom(allowedTypes);
        const debrisMeta = GAME_DATA.DEBRIS_TYPES[typeKey];

        const debris = this.debrisGroup.create(x, y, debrisMeta.spriteKey);
        debris.setDepth(5);
        debris.debrisType = debrisMeta;
        debris.setBounce(0.85);
        debris.setDrag(8);
        debris.setAngularDrag(10);

        // Orbital drift velocity and spin
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const speed = Phaser.Math.Between(15, 65);
        debris.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        debris.setAngularVelocity(Phaser.Math.Between(-45, 45));

        // Physics circle body
        const radius = Math.max(12, debrisMeta.size * 0.45);
        debris.body.setCircle(radius, debris.width / 2 - radius, debris.height / 2 - radius);
    }

    spawnHazardItem() {
        if (this.hazardGroup.countActive(true) >= this.missionConfig.maxHazards) return;

        const allowedHazards = this.missionConfig.hazardTypes;
        const hazardKey = Phaser.Utils.Array.GetRandom(allowedHazards);
        const hazardMeta = GAME_DATA.HAZARD_TYPES[hazardKey] || GAME_DATA.HAZARD_TYPES.hidden_debris;

        // Spawn on the outer perimeter traveling towards inner orbit
        const w = this.missionConfig.worldSize.width;
        const h = this.missionConfig.worldSize.height;

        // Pick an edge
        let x, y;
        const edge = Phaser.Math.Between(0, 3);
        if (edge === 0) { x = Phaser.Math.Between(100, w - 100); y = 80; }
        else if (edge === 1) { x = w - 80; y = Phaser.Math.Between(100, h - 100); }
        else if (edge === 2) { x = Phaser.Math.Between(100, w - 100); y = h - 80; }
        else { x = 80; y = Phaser.Math.Between(100, h - 100); }

        const hazard = this.hazardGroup.create(x, y, hazardMeta.spriteKey);
        hazard.setDepth(6);
        hazard.hazardMeta = hazardMeta;
        hazard.hazardKey = hazardKey;

        if (hazardMeta.id === 'hidden_debris') {
            // Natural orbital drift across sector, NOT aimed at player
            // Choose an opposing target edge to simulate orbital plane crossing
            const targetEdge = (edge + Phaser.Math.Between(1, 3)) % 4;
            let targetX, targetY;
            if (targetEdge === 0) { targetX = Phaser.Math.Between(100, w - 100); targetY = 80; }
            else if (targetEdge === 1) { targetX = w - 80; targetY = Phaser.Math.Between(100, h - 100); }
            else if (targetEdge === 2) { targetX = Phaser.Math.Between(100, w - 100); targetY = h - 80; }
            else { targetX = 80; targetY = Phaser.Math.Between(100, h - 100); }

            const trajectory = Phaser.Math.Angle.Between(x, y, targetX, targetY);
            const speed = (hazardMeta.speed || 250) * (this.hazardSpeedMultiplier || 1.0);
            hazard.setVelocity(Math.cos(trajectory) * speed, Math.sin(trajectory) * speed);
            hazard.setAngularVelocity(Phaser.Math.Between(-120, 120));
            hazard.body.setCircle(14, hazard.width / 2 - 14, hazard.height / 2 - 14);
            hazard.alpha = 0.45; // Low-observability stealth mode until within sensor range
        } else if (hazardMeta.id === 'venting_rocket') {
            // Derelict spent upper stage: slow drift with periodic high-pressure hypergolic venting
            const targetX = w * 0.5 + Phaser.Math.Between(-600, 600);
            const targetY = h * 0.5 + Phaser.Math.Between(-600, 600);
            const trajectory = Phaser.Math.Angle.Between(x, y, targetX, targetY);
            const speed = hazardMeta.speed || 65;
            hazard.setVelocity(Math.cos(trajectory) * speed, Math.sin(trajectory) * speed);
            hazard.setAngularVelocity(Phaser.Math.Between(-25, 25));
            hazard.body.setCircle(22, hazard.width / 2 - 22, hazard.height / 2 - 22);

            hazard.ventTimer = Phaser.Math.Between(2500, 4500);
            hazard.isVenting = false;
            hazard.ventDuration = 0;
        } else {
            // Default hazard (e.g. nuclear RTG)
            const targetX = w * 0.5 + Phaser.Math.Between(-400, 400);
            const targetY = h * 0.5 + Phaser.Math.Between(-400, 400);
            const trajectory = Phaser.Math.Angle.Between(x, y, targetX, targetY);
            const speed = hazardMeta.speed || 120;
            hazard.setVelocity(Math.cos(trajectory) * speed, Math.sin(trajectory) * speed);
            hazard.setAngularVelocity(Phaser.Math.Between(-50, 50));
            hazard.body.setCircle(22, hazard.width / 2 - 22, hazard.height / 2 - 22);
        }

        // Auto destroy after lifespan to avoid clutter
        this.time.delayedCall(26000, () => {
            if (hazard && typeof hazard.destroy === 'function' && hazard.active) {
                hazard.destroy();
            }
        });
    }

    update(time, delta) {
        if (this.isMissionOver) return;

        const dt = delta / 1000;
        this.elapsedTime += dt;

        // Process any queued physics actions safely at frame start
        this.processPendingPhysicsActions();

        // Clear graphics overlay
        this.fxGraphics.clear();
        this.hudGraphics.clear();

        // 1. Survival Mode timer counting UP vs Standard countdown
        if (this.isSurvivalMode) {
            this.survivalTimeElapsed += dt;
            this.missionTime = this.survivalTimeElapsed;

            // Progressive wave escalation every 25 seconds
            const currentWave = Math.floor(this.survivalTimeElapsed / 25) + 1;
            if (currentWave > this.survivalWave) {
                this.survivalWave = currentWave;
                this.scoreMultiplier = 1.0 + (this.survivalWave - 1) * 0.5;
                window.soundSystem?.playAlertBeep?.();
                if (typeof this.showFloatingText === 'function' && this.player) {
                    this.showFloatingText(this.player.x, this.player.y - 45, `⚡ WAVE ${this.survivalWave}: DENSITY ESCALATION!`, '#ef4444');
                }
                this.spawnSurvivalWaveBonus();
            }
        } else {
            this.missionTime -= dt;

            // Check Win / Loss Time limits
            if (this.missionTime <= 0) {
                if (this.contractObjective === 'survive') {
                    this.handleMissionEnd(true, 'EXTRACTION WINDOW REACHED: CASCADE CLUSTER SURVIVED');
                } else {
                    this.handleMissionEnd(false, 'TIME LIMIT EXCEEDED - ORBITAL WINDOW LOST');
                }
                return;
            }
        }

        // 1b. Protected Satellites Boundary Wrap & Loss Verification
        if (this.protectedSatellitesGroup) {
            const w = this.missionConfig.worldSize.width;
            let activeProtectedCount = 0;
            this.protectedSatellitesGroup.getChildren().forEach(sat => {
                if (!sat || !sat.active) return;
                activeProtectedCount++;
                if (sat.x > w + 50) sat.x = -50;
                if (sat.x < -50) sat.x = w + 50;
            });
            if (this.contractObjective === 'protect' && activeProtectedCount === 0) {
                this.handleMissionEnd(false, 'MISSION FAILED: PROTECTED ASSET DESTROYED BY ORBITAL IMPACT');
                return;
            }
        }

        // 2. Handle Player Spaceflight Controls
        this.handlePlayerControls(dt);

        // 3. Equipment Updates & Mechanics
        this.handleEquipment(dt, time);

        // 4. Station Docking & Recycling Mechanics
        this.handleStationDocking(dt);

        // 5. Environmental Hazards & Collision Warning Radar
        this.handleProximityRadar(dt);

        // 6. Update Venting Rocket Upper-Stage Plumes & Dynamics
        this.updateVentingRockets(dt);

        // 7. Phase 7 Orbital Lanes (Differential Altitude Movement)
        this.updateOrbitalLanes(dt);

        // 8. Phase 7 Space Weather Simulation (NASA/CCMC DONKI)
        this.updateSpaceWeather(dt);

        // 9. Check Q-Key Laser Nudge Deflection Input
        if (Phaser.Input.Keyboard.JustDown(this.keyQ)) {
            this.executeLaserNudge();
        }

        // Render Active Laser Nudge Beam FX (Pixel-art Stepped Beam & Target Reticle)
        if (this.laserNudgeEffect) {
            this.laserNudgeEffect.life -= dt;
            if (this.laserNudgeEffect.life <= 0) {
                this.laserNudgeEffect = null;
            } else {
                const eff = this.laserNudgeEffect;
                const alpha = Math.max(0, eff.life / 0.18);
                this.fxGraphics.lineStyle(3, 0x00f3ff, alpha);
                this.fxGraphics.lineBetween(eff.startX, eff.startY, eff.targetX, eff.targetY);
                this.fxGraphics.lineStyle(2, 0xffffff, alpha);
                const rSize = 20;
                this.fxGraphics.strokeRect(Math.floor(eff.targetX - rSize / 2), Math.floor(eff.targetY - rSize / 2), rSize, rSize);
                this.fxGraphics.fillStyle(0x00f3ff, alpha * 0.5);
                this.fxGraphics.fillRect(Math.floor(eff.targetX - 2), Math.floor(eff.targetY - 2), 4, 4);
            }
        }

        // Render Deflector Shield Flash FX (Pixel Octagon Deflector Ring)
        if (this.shieldTimer > 0) {
            this.shieldTimer -= dt;
            const shieldAlpha = Math.max(0, this.shieldTimer / 0.35);
            const radius = 32;
            const px = Math.floor(this.player.x);
            const py = Math.floor(this.player.y);
            const d = 14;

            this.fxGraphics.lineStyle(2, 0x38bdf8, shieldAlpha * 0.9);
            this.fxGraphics.beginPath();
            this.fxGraphics.moveTo(px - d, py - radius);
            this.fxGraphics.lineTo(px + d, py - radius);
            this.fxGraphics.lineTo(px + radius, py - d);
            this.fxGraphics.lineTo(px + radius, py + d);
            this.fxGraphics.lineTo(px + d, py + radius);
            this.fxGraphics.lineTo(px - d, py + radius);
            this.fxGraphics.lineTo(px - radius, py + d);
            this.fxGraphics.lineTo(px - radius, py - d);
            this.fxGraphics.closePath();
            this.fxGraphics.strokePath();

            this.fxGraphics.fillStyle(0x00f3ff, shieldAlpha * 0.18);
            this.fxGraphics.fillPath();
        }

        // Mission Launch & Orbital Insertion Sequence FX
        if (this.launchBurnTimer > 0) {
            this.launchBurnTimer -= dt;
            if (this.thrusterParticles && this.player) {
                const angle = this.player.rotation + Math.PI;
                const ex = this.player.x + Math.cos(angle) * 22;
                const ey = this.player.y + Math.sin(angle) * 22;
                this.thrusterParticles.emitParticleAt(ex, ey, 3);
            }
            if (!this.launchAnnounced && this.launchBurnTimer < 2.0) {
                this.launchAnnounced = true;
                this.cameras.main.shake(350, 0.003);
            }
        }

        // Atmospheric Drag & Solar Storm Ionization Streaks
        const hasStorm = Boolean(this.activeSpaceWeather || this.isStormSeason);
        if (this.activeAtmosphericDrag < 1.0 || hasStorm || (this.director && this.director.stage === 'Climax' && this.kesslerRisk > 70)) {
            const cam = this.cameras.main;
            const streakCount = hasStorm ? 16 : 10;
            const color = hasStorm ? 0x00f3ff : 0xf97316;
            const alpha = hasStorm ? 0.60 : 0.45;
            this.fxGraphics.lineStyle(1.5, color, alpha);
            for (let i = 0; i < streakCount; i++) {
                const seed = (time * 0.7 + i * 149.3) % 1000;
                const sx = cam.scrollX + ((seed * 13) % (cam.width + 200)) - 100;
                const sy = cam.scrollY + ((seed * 19) % (cam.height + 200)) - 100;
                const len = 35 + (seed % 50);
                this.fxGraphics.lineBetween(sx, sy, sx - len, sy + len * 0.35);
            }
        }

        // 8. Dynamic Kessler Risk Meter Computation
        const activeDebris = this.debrisGroup ? this.debrisGroup.countActive(true) : 0;
        const activeFrags = this.debrisGroup ? this.debrisGroup.getChildren().filter(d => d.active && d.debrisType?.id === 'fragment').length : 0;
        this.kesslerRisk = Phaser.Math.Clamp(Math.round(
            (activeDebris * 1.4) + (activeFrags * 2.0) + (this.collisionsCount * 4) - (this.debrisDeliveredCount * 3) - (this.nudgesCount * 2)
        ), 0, 100);

        // 9. Passive Solar Battery Recharge (Modified by Space Weather solar flux)
        if (this.battery < this.maxBattery) {
            const solarMod = this.effectiveSolarMod !== undefined ? this.effectiveSolarMod : 1.0;
            this.battery = Math.min(this.maxBattery, this.battery + (this.batteryRechargeRate * solarMod) * dt);
        }

        // Low Fuel & Battery Telemetry Alerts
        if (this.fuel < (this.maxFuel * 0.22) && !this.loggedLowFuel) {
            this.loggedLowFuel = true;
            this.logFlightEvent('WARNING', 'Propellant level below 22% reserve margin.', 'warn');
        }
        if (this.battery < (this.maxBattery * 0.22) && !this.loggedLowBat) {
            this.loggedLowBat = true;
            this.logFlightEvent('WARNING', 'Battery capacity below 22% reserve margin.', 'warn');
        }

        // 10. Data-Driven Scripted Events Handling
        if (this.missionConfig && this.missionConfig.scriptedEvents) {
            this.missionConfig.scriptedEvents.forEach((evt, idx) => {
                if (this.elapsedTime >= evt.time && !this.triggeredScriptedEvents.has(idx)) {
                    this.triggeredScriptedEvents.add(idx);
                    this.triggerScriptedEvent(evt);
                }
            });
        }

        // Active Event Alert Countdown
        if (this.eventAlertTimer > 0) {
            this.eventAlertTimer -= dt;
            if (this.eventAlertTimer <= 0) {
                this.activeEventAlert = null;
            }
        }

        // 11. Phase 5 AI Flight Director Update
        if (this.director) {
            this.director.update(dt);
        }

        // 12. Update Game HUD DOM
        if (window.updateGameHUD) {
            window.updateGameHUD(this);
        }
    }

    handlePlayerControls(dt) {
        let isThrusting = false;
        let isTurning = false;

        // 1. Cargo Mass Penalty (Heavier cargo hold reduces linear agility and increases propellant consumption)
        const cargoMass = (this.cargo || []).reduce((sum, item) => sum + (item.mass || 30), 0);
        const cargoMassFactor = 1 + (cargoMass / 550);
        const effectiveAcceleration = this.acceleration / cargoMassFactor;
        const effectiveBurnRate = this.fuelBurnRate * (1 + (cargoMass / 700));
        this.player.setMaxVelocity(this.maxSpeed / (1 + (cargoMass / 1200)));

        // 2. Angular Inertia with Reaction Control Thruster (RCS) Dynamics
        let targetTurnRate = 0;
        if (this.cursors.left.isDown || this.keyA.isDown) {
            targetTurnRate = -this.turnRate;
            isTurning = true;
        } else if (this.cursors.right.isDown || this.keyD.isDown) {
            targetTurnRate = this.turnRate;
            isTurning = true;
        }

        // Realistic angular damping: gradual spin decay rather than abrupt halt
        const turnDamping = targetTurnRate === 0 ? 3.5 : 8.5;
        const curAngVel = this.player.body ? this.player.body.angularVelocity : 0;
        this.player.setAngularVelocity(Phaser.Math.Linear(curAngVel, targetTurnRate, dt * turnDamping));

        // Storm Surge Avionics Disruption (Single-Event Upset / RCS thruster jitter)
        if (this.stormAvionicsJitterTimer > 0) {
            this.stormAvionicsJitterTimer -= dt;
            if (this.player && this.player.body) {
                this.player.body.angularVelocity += (Math.random() - 0.5) * 85;
                if (Math.random() < 0.25 && this.thrusterParticles) {
                    this.thrusterParticles.emitParticleAt(this.player.x, this.player.y, 1);
                }
            }
        }

        // RCS thruster pixel puffs during turning
        if (isTurning && this.thrusterParticles && Math.random() < 0.35) {
            const rot = this.player.rotation;
            const sideSign = (this.cursors.left.isDown || this.keyA.isDown) ? -1 : 1;
            const rcsX = this.player.x + Math.cos(rot + Math.PI / 2 * sideSign) * 12;
            const rcsY = this.player.y + Math.sin(rot + Math.PI / 2 * sideSign) * 12;
            this.thrusterParticles.emitParticleAt(rcsX, rcsY, 1);
        }

        // 3. Forward Propulsion (W or Up Arrow)
        if ((this.cursors.up.isDown || this.keyW.isDown) && this.fuel > 0) {
            isThrusting = true;
            const angle = this.player.rotation;
            const dragMod = this.activeAtmosphericDrag || 1.0;
            const ax = Math.cos(angle) * effectiveAcceleration * dragMod;
            const ay = Math.sin(angle) * effectiveAcceleration * dragMod;

            this.player.setAcceleration(ax, ay);

            // Fuel Burn adjusted for cargo weight
            const burn = effectiveBurnRate * dt * 4.0;
            this.fuel = Math.max(0, this.fuel - burn);
            this.totalFuelBurned += burn;

            // Emit thruster flame particles behind ship
            const exhaustX = this.player.x - Math.cos(angle) * 24;
            const exhaustY = this.player.y - Math.sin(angle) * 24;
            this.thrusterParticles.emitParticleAt(exhaustX, exhaustY);

            // Audio thruster feedback
            window.soundSystem.setThruster(true, 1.0);
        } else if ((this.cursors.down.isDown || this.keyS.isDown) && this.fuel > 0) {
            // Retro-Thrusters / Inertial Braking
            this.player.setAcceleration(0, 0);
            this.player.body.velocity.scale(0.96); // Active braking
            const burn = effectiveBurnRate * dt * 2.0;
            this.fuel = Math.max(0, this.fuel - burn);
            this.totalFuelBurned += burn;
            window.soundSystem.setThruster(true, 0.4);

            if (this.thrusterParticles && Math.random() < 0.35) {
                const angle = this.player.rotation;
                const fwdX = this.player.x + Math.cos(angle) * 14;
                const fwdY = this.player.y + Math.sin(angle) * 14;
                this.thrusterParticles.emitParticleAt(fwdX, fwdY, 1);
            }
        } else {
            this.player.setAcceleration(0, 0);
            window.soundSystem.setThruster(false);
        }

        // If fuel exhausted warning
        if (this.fuel <= 0 && this.player.body.velocity.length() < 10 && !this.isNearStation()) {
            this.handleMissionEnd(false, 'OUT OF FUEL - VEHICLE DRIFTING IN ORBIT');
        }
    }

    handleEquipment(dt, time) {
        const spaceDown = this.cursors.space.isDown || this.keySpace.isDown;
        const equipType = this.equipmentConfig.type;

        // A. Robotic Arm Grapple Mechanics
        if (equipType === 'arm') {
            if (spaceDown && time > this.lastEquipmentFireTime + this.equipmentConfig.cooldown) {
                if (this.battery >= this.equipmentConfig.batteryCost) {
                    if (this.cargo.length < this.cargoCapacity) {
                        this.fireRoboticArm();
                        this.battery -= this.equipmentConfig.batteryCost;
                        this.lastEquipmentFireTime = time;
                    } else {
                        this.showFloatingText(this.player.x, this.player.y - 30, 'CARGO HOLD FULL!', '#f59e0b');
                    }
                } else {
                    this.showFloatingText(this.player.x, this.player.y - 30, 'BATTERY DEPLETED', '#ef4444');
                }
            }
            this.updateRoboticArm(dt);
        }

        // B. Capture Net Mechanics
        else if (equipType === 'net') {
            if (spaceDown && time > this.lastEquipmentFireTime + this.equipmentConfig.cooldown) {
                if (this.battery >= this.equipmentConfig.batteryCost) {
                    if (this.cargo.length < this.cargoCapacity) {
                        this.fireCaptureNet();
                        this.battery -= this.equipmentConfig.batteryCost;
                        this.lastEquipmentFireTime = time;
                    } else {
                        this.showFloatingText(this.player.x, this.player.y - 30, 'CARGO HOLD FULL!', '#f59e0b');
                    }
                } else {
                    this.showFloatingText(this.player.x, this.player.y - 30, 'BATTERY DEPLETED', '#ef4444');
                }
            }
            this.updateCaptureNets(dt);
        }

        // C. Magnetic Tractor Beam Mechanics
        else if (equipType === 'magnet') {
            if (spaceDown && this.battery > 2) {
                if (this.cargo.length < this.cargoCapacity) {
                    this.activateTractorBeam(dt);
                } else {
                    this.showFloatingText(this.player.x, this.player.y - 30, 'CARGO HOLD FULL!', '#f59e0b');
                    window.soundSystem.setTractorBeam(false);
                }
            } else {
                window.soundSystem.setTractorBeam(false);
            }
        }
    }

    fireRoboticArm() {
        window.soundSystem.playArmGrapple();

        const angle = this.player.rotation;
        const maxRange = this.equipmentConfig.range * this.radarMultiplier;

        this.activeGrapple = {
            state: 'extending',
            startX: this.player.x,
            startY: this.player.y,
            currentX: this.player.x,
            currentY: this.player.y,
            angle: angle,
            distance: 0,
            maxDistance: maxRange,
            speed: this.equipmentConfig.speed,
            hookedDebris: null
        };
    }

    updateRoboticArm(dt) {
        if (!this.activeGrapple) return;
        const g = this.activeGrapple;

        if (g.state === 'extending') {
            g.distance += g.speed * dt;
            g.currentX = this.player.x + Math.cos(g.angle) * g.distance;
            g.currentY = this.player.y + Math.sin(g.angle) * g.distance;

            // Check if claw tip hits any debris
            const hit = this.debrisGroup.getChildren().find(d => {
                return Phaser.Math.Distance.Between(g.currentX, g.currentY, d.x, d.y) < d.debrisType.size * 0.9;
            });

            if (hit) {
                g.state = 'retracting';
                g.hookedDebris = hit;
                hit.body.enable = false; // Disable normal physics while attached
                this.sparkParticles.emitParticleAt(hit.x, hit.y, 8);
                window.soundSystem.playCollect(2);
            } else if (g.distance >= g.maxDistance) {
                g.state = 'retracting';
            }
        } else if (g.state === 'retracting') {
            g.distance -= g.speed * dt * 1.3;
            g.currentX = this.player.x + Math.cos(g.angle) * g.distance;
            g.currentY = this.player.y + Math.sin(g.angle) * g.distance;

            if (g.hookedDebris) {
                g.hookedDebris.setPosition(g.currentX, g.currentY);
                // Tow Drag: Newton's 3rd law pulls player craft toward heavy tethered debris
                const towMass = g.hookedDebris.debrisType?.mass || 50;
                const towForce = (towMass / 100) * 110 * dt;
                const towAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, g.currentX, g.currentY);
                this.player.body.velocity.x += Math.cos(towAngle) * towForce;
                this.player.body.velocity.y += Math.sin(towAngle) * towForce;
            }

            if (g.distance <= 15) {
                // Fully reeled into cargo hold!
                if (g.hookedDebris) {
                    this.collectDebrisIntoCargo(g.hookedDebris);
                }
                this.activeGrapple = null;
                return;
            }
        }

        // Draw Pixel Grapple Tether Cable & Claw Head
        this.fxGraphics.lineStyle(2, 0x00f3ff, 0.9);
        this.fxGraphics.lineBetween(this.player.x, this.player.y, g.currentX, g.currentY);

        // Stepped Pixel Claw Head
        const cx = Math.floor(g.currentX);
        const cy = Math.floor(g.currentY);
        this.fxGraphics.fillStyle(0x38bdf8, 1);
        this.fxGraphics.fillRect(cx - 3, cy - 3, 6, 6);
        this.fxGraphics.fillStyle(0xffffff, 1);
        this.fxGraphics.fillRect(cx - 1, cy - 1, 2, 2);
    }

    fireCaptureNet() {
        window.soundSystem.playNetLaunch();

        const angle = this.player.rotation;
        const net = this.netGroup.create(this.player.x, this.player.y, 'equip_net');
        net.setDepth(12);
        net.setScale(0.2);
        net.alpha = 0.9;

        const speed = this.equipmentConfig.speed;
        net.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

        this.activeNets.push({
            sprite: net,
            scale: 0.2,
            maxScale: 1.0,
            radius: this.equipmentConfig.radius,
            createdTime: this.time.now,
            life: 1400
        });
    }

    queueDebrisCollection(debris) {
        if (!debris || !debris.active || debris.isPendingCollection) return;
        debris.isPendingCollection = true;
        if (debris.body) debris.body.enable = false;
        debris.setVisible(false);
        this.pendingCollections.push(debris);
    }

    processPendingPhysicsActions() {
        // 1. Process queued debris collections safely outside collision iteration
        while (this.pendingCollections && this.pendingCollections.length > 0) {
            const debris = this.pendingCollections.pop();
            if (!debris) continue;
            const meta = debris.debrisType;
            if (this.cargo.length < this.cargoCapacity) {
                this.cargo.push(meta);
                if (this.director) {
                    this.director.registerCapture();
                }
                this.missionMassDeorbitedKg = (this.missionMassDeorbitedKg || 0) + (meta.mass || 50);
                this.firstCaptureTime = this.firstCaptureTime || Math.max(1, Math.round(this.elapsedTime));
                this.logFlightEvent('CAPTURE', `Secured ${meta.name} (${meta.mass || 50} kg). Cargo hold: ${this.cargo.length}/${this.cargoCapacity}.`, 'info');
                window.soundSystem.playCollect(1);
                this.sparkParticles.emitParticleAt(this.player.x, this.player.y, 12);
                this.showFloatingText(this.player.x, this.player.y - 25, `+${meta.name}`, '#38bdf8');
            }
            if (debris.active) {
                debris.destroy();
            }
        }

        // 2. Process queued hazard destructions safely outside collision iteration
        while (this.pendingHazardDestructions && this.pendingHazardDestructions.length > 0) {
            const hazard = this.pendingHazardDestructions.pop();
            if (hazard && typeof hazard.destroy === 'function') {
                hazard.destroy();
            }
        }

        // 3. Process queued collision fragmentations safely outside collision callbacks
        while (this.pendingFragmentations && this.pendingFragmentations.length > 0) {
            const frag = this.pendingFragmentations.pop();
            if (!frag) continue;
            this.createCollisionFragments(frag.x, frag.y, frag.count, frag.vx, frag.vy, frag.parentMass);
        }
    }

    createCollisionFragments(x, y, count, baseVx = 0, baseVy = 0, parentMass = 40) {
        if (!this.debrisGroup) return;
        const currentActive = this.debrisGroup.countActive(true);
        const MAX_DEBRIS = 46;
        const spawnCount = Math.min(count, Math.max(0, MAX_DEBRIS - currentActive));
        if (spawnCount <= 0) return;

        const fragMeta = GAME_DATA.DEBRIS_TYPES.fragment;
        const fragmentMass = Math.max(6, Math.round(parentMass / (spawnCount * 1.5)));

        for (let i = 0; i < spawnCount; i++) {
            const spreadAngle = (i / spawnCount) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.35, 0.35);
            const speed = Phaser.Math.Between(75, 210);
            const fragX = x + Math.cos(spreadAngle) * 16;
            const fragY = y + Math.sin(spreadAngle) * 16;

            const frag = this.debrisGroup.create(fragX, fragY, 'debris_fragment');
            frag.setDepth(5);
            frag.debrisType = Object.assign({}, fragMeta, { mass: fragmentMass });
            frag.setScale(Phaser.Math.FloatBetween(0.65, 0.95));
            frag.setVelocity(baseVx * 0.25 + Math.cos(spreadAngle) * speed, baseVy * 0.25 + Math.sin(spreadAngle) * speed);
            frag.setAngularVelocity(Phaser.Math.Between(-140, 140));
            frag.setDrag(10);
            frag.setAngularDrag(10);
            frag.body.setCircle(10, frag.width / 2 - 10, frag.height / 2 - 10);
        }

        if (this.sparkParticles && typeof this.sparkParticles.emitParticleAt === 'function') {
            this.sparkParticles.emitParticleAt(x, y, 16);
        }
        if (this.smokeParticles && typeof this.smokeParticles.emitParticleAt === 'function') {
            this.smokeParticles.emitParticleAt(x, y, 8);
        }
        if (this.shockwaveParticles && typeof this.shockwaveParticles.emitParticleAt === 'function') {
            this.shockwaveParticles.emitParticleAt(x, y, 1);
        }

        this.kesslerRisk = Math.min(100, this.kesslerRisk + spawnCount * 1.8);
        this.logFlightEvent('FRAGMENTATION', `Impact shattered target into ${spawnCount} kinetic fragments (+${Math.round(spawnCount * 1.8)}% Kessler Risk).`, 'crit');
    }

    updateCaptureNets(dt) {
        for (let i = this.activeNets.length - 1; i >= 0; i--) {
            const item = this.activeNets[i];
            const net = item.sprite;

            if (!net || !net.active) {
                this.activeNets.splice(i, 1);
                continue;
            }

            // Expand Net Mesh
            if (item.scale < item.maxScale) {
                item.scale += dt * 1.2;
                net.setScale(item.scale);
            }

            // Check debris enclosed within net mesh
            const netRadius = (net.width * 0.45) * net.scaleX;
            const captured = this.debrisGroup.getChildren().filter(d => {
                return d.active && !d.isPendingCollection && Phaser.Math.Distance.Between(net.x, net.y, d.x, d.y) < netRadius;
            });

            captured.forEach(d => {
                if (this.cargo.length < this.cargoCapacity) {
                    this.sparkParticles.emitParticleAt(d.x, d.y, 10);
                    this.queueDebrisCollection(d);
                }
            });

            // Lifetime expiry
            if (this.time.now - item.createdTime > item.life) {
                net.destroy();
                this.activeNets.splice(i, 1);
            }
        }
    }

    activateTractorBeam(dt) {
        window.soundSystem.setTractorBeam(true);

        const drain = this.equipmentConfig.batteryCostPerSec * dt;
        this.battery = Math.max(0, this.battery - drain);

        const angle = this.player.rotation;
        const range = this.equipmentConfig.range * this.radarMultiplier;
        const halfCone = Phaser.Math.DegToRad(this.equipmentConfig.coneAngle * 0.5);

        // Pixel-art Tractor Beam: Stepped scanline chords & boundary vectors
        const leftAngle = angle - halfCone;
        const rightAngle = angle + halfCone;
        const px = this.player.x;
        const py = this.player.y;

        // Beam boundary lines
        this.fxGraphics.lineStyle(2, 0x00f3ff, 0.7);
        this.fxGraphics.lineBetween(px, py, px + Math.cos(leftAngle) * range, py + Math.sin(leftAngle) * range);
        this.fxGraphics.lineBetween(px, py, px + Math.cos(rightAngle) * range, py + Math.sin(rightAngle) * range);

        // Stepped pixel chords across the cone at intervals
        this.fxGraphics.lineStyle(1.5, 0x38bdf8, 0.4);
        for (let r = 40; r <= range; r += 28) {
            const chordLeftX = px + Math.cos(leftAngle) * r;
            const chordLeftY = py + Math.sin(leftAngle) * r;
            const chordRightX = px + Math.cos(rightAngle) * r;
            const chordRightY = py + Math.sin(rightAngle) * r;
            this.fxGraphics.lineBetween(chordLeftX, chordLeftY, chordRightX, chordRightY);
        }

        // Stepped pixel intake reticle at ship nose
        const intakeX = px + Math.cos(angle) * 22;
        const intakeY = py + Math.sin(angle) * 22;
        this.fxGraphics.lineStyle(2, 0x00f3ff, 0.85);
        this.fxGraphics.strokeRect(Math.floor(intakeX - 10), Math.floor(intakeY - 10), 20, 20);
        this.fxGraphics.fillStyle(0x00f3ff, 0.3);
        this.fxGraphics.fillRect(Math.floor(intakeX - 4), Math.floor(intakeY - 4), 8, 8);

        // Attract debris within cone
        this.debrisGroup.getChildren().forEach(d => {
            if (!d.active || d.isPendingCollection) return;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, d.x, d.y);
            if (dist < range) {
                const angleToDebris = Phaser.Math.Angle.Between(this.player.x, this.player.y, d.x, d.y);
                const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angleToDebris - angle));

                if (angleDiff <= halfCone) {
                    // Mark as actively tractor-pulled with timestamp to avoid collision damage
                    d.isBeingPulledByTractor = true;
                    d.tractorPullTime = this.time.now;

                    // Ground electrostatic charge if active storm
                    if (Boolean(this.activeSpaceWeather || this.isStormSeason) && !d._stormGrounded) {
                        d._stormGrounded = true;
                        this.score += 25;
                        this.showFloatingText(d.x, d.y - 20, '⚡ STATIC GROUNDED (+25)', '#10b981');
                    }

                    // Draw pixel targeting reticle around pulled debris
                    this.fxGraphics.lineStyle(1.5, 0x38bdf8, 0.8);
                    this.fxGraphics.strokeRect(Math.floor(d.x - 12), Math.floor(d.y - 12), 24, 24);

                    // Pull debris towards player intake
                    const pull = this.equipmentConfig.pullForce;
                    const pullAngle = Phaser.Math.Angle.Between(d.x, d.y, this.player.x, this.player.y);
                    d.body.velocity.x += Math.cos(pullAngle) * pull * dt;
                    d.body.velocity.y += Math.sin(pullAngle) * pull * dt;

                    // Tow Drag: Newton's 3rd law reaction force pulls player craft toward heavy debris
                    const dMass = d.debrisType?.mass || 40;
                    const reactionForce = (dMass / 120) * (pull * 0.18) * dt;
                    this.player.body.velocity.x -= Math.cos(pullAngle) * reactionForce;
                    this.player.body.velocity.y -= Math.sin(pullAngle) * reactionForce;

                    // Cap maximum pull speed so debris does not teleport or behave erratically
                    const maxPullSpeed = 340;
                    const curSpeed = d.body.velocity.length();
                    if (curSpeed > maxPullSpeed) {
                        d.body.velocity.scale(maxPullSpeed / curSpeed);
                    }

                    // Accurate collection threshold: playerRadius (22) + debrisRadius + 12px margin
                    const debrisRadius = (d.body && d.body.radius) ? d.body.radius : (d.debrisType.size * 0.45);
                    const collectionDistance = 22 + debrisRadius + 12;

                    // If pulled within collection zone, queue collection
                    if (dist <= collectionDistance && this.cargo.length < this.cargoCapacity) {
                        this.queueDebrisCollection(d);
                    }
                }
            }
        });
    }

    collectDebrisIntoCargo(debris) {
        this.queueDebrisCollection(debris);
    }

    handleStationDocking(dt) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.station.x, this.station.y);
        const inDockRange = dist <= this.stationDockingRadius;

        // Player must explicitly choose [E] to Recycle or [R] to Strip for Materials
        const pressRecycle = Phaser.Input.Keyboard.JustDown(this.keyE);
        const pressStrip = Phaser.Input.Keyboard.JustDown(this.keyR);
        const pressRepair = this.keyH && Phaser.Input.Keyboard.JustDown(this.keyH);

        if (inDockRange) {
            // Refill Fuel & Battery automatically at the depot harbor
            if (this.fuel < this.maxFuel || this.battery < this.maxBattery) {
                this.fuel = this.maxFuel;
                this.battery = this.maxBattery;
                this.loggedLowFuel = false;
                this.loggedLowBat = false;
                this.showFloatingText(this.station.x, this.station.y - 25, 'PROPELLANT & BATTERY REPLENISHED', '#10b981');
                this.logFlightEvent('DEPOT SERVICE', 'Aegis Depot replenished propellant and battery to 100%.', 'success');
            }

            if (pressRepair) {
                this.executeStationRepair();
            }

            if (!this.isDocked) {
                if (pressStrip) {
                    this.processStationRecycling(true);
                } else if (pressRecycle) {
                    this.processStationRecycling(false);
                }
            }
        }
    }

    triggerRecycle() {
        if (!this.player || !this.station) return;
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.station.x, this.station.y);
        if (dist <= this.stationDockingRadius && !this.isDocked) {
            this.processStationRecycling(false);
        }
    }

    triggerStrip() {
        if (!this.player || !this.station) return;
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.station.x, this.station.y);
        if (dist <= this.stationDockingRadius && !this.isDocked) {
            this.processStationRecycling(true);
        }
    }

    triggerRepair() {
        this.executeStationRepair();
    }

    executeStationRepair() {
        if (!this.player || !this.station) return;
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.station.x, this.station.y);
        if (dist > (this.stationDockingRadius || 185)) {
            this.showFloatingText(this.player.x, this.player.y - 30, 'APPROACH AEGIS DEPOT TO REPAIR', '#f59e0b');
            return;
        }

        if (this.hull >= this.maxHull) {
            this.showFloatingText(this.player.x, this.player.y - 30, 'HULL AT 100% INTEGRITY', '#38bdf8');
            return;
        }

        let usedMetal = false;
        if (this.materialsSession && this.materialsSession.metal > 0) {
            this.materialsSession.metal--;
            usedMetal = true;
        } else {
            const save = OrbitalStorage.load();
            if (save.materials && save.materials.metal > 0) {
                save.materials.metal--;
                OrbitalStorage.save(save);
                usedMetal = true;
            }
        }

        if (usedMetal) {
            this.hull = Math.min(this.maxHull, this.hull + 35);
            this.showFloatingText(this.player.x, this.player.y - 35, '+35 HULL REPAIRED [-1 METAL]', '#10b981');
            this.logFlightEvent('FIELD REPAIR', 'Consumed 1 Metal to weld armor reinforcement (+35 HP).', 'success');
            window.soundSystem?.playRepair?.();
        } else if (this.creditsEarned >= 50) {
            this.creditsEarned -= 50;
            this.hull = Math.min(this.maxHull, this.hull + 25);
            this.showFloatingText(this.player.x, this.player.y - 35, '+25 HULL PATCHED [-50 CREDITS]', '#f59e0b');
            this.logFlightEvent('FIELD REPAIR', 'Purchased emergency station hull patch (+25 HP).', 'info');
            window.soundSystem?.playRepair?.();
        } else {
            this.showFloatingText(this.player.x, this.player.y - 35, 'REPAIR REQUIRES 1 METAL OR 50 CREDITS', '#ef4444');
        }
    }

    isNearStation() {
        return Phaser.Math.Distance.Between(this.player.x, this.player.y, this.station.x, this.station.y) < 400;
    }

    processStationRecycling(isStripping = false) {
        if (this.isDocked) return;
        this.isDocked = true;

        // Check for Perfect Docking Bonus
        if (this.director && this.player && this.player.body) {
            this.director.evaluateDockingBonus(this.player.body.velocity);
        }

        // Lock player briefly
        this.player.setVelocity(0, 0);

        let roundScore = 0;
        let roundCredits = 0;
        let itemsCount = this.cargo.length;

        // Apply equipment scrap multiplier
        const bonus = this.equipmentConfig.scrapBonus || 1.0;

        let harvestMetal = 0;
        let harvestCells = 0;
        let harvestChips = 0;

        this.cargo.forEach(item => {
            const itemBaseScore = Math.floor(item.points * bonus);
            const itemBaseCredits = Math.floor(item.scrap * bonus);

            if (isStripping) {
                // Strip: 50% score and credits, harvest raw materials (Metal, Cells, Chips)
                roundScore += Math.floor(itemBaseScore * 0.5);
                roundCredits += Math.floor(itemBaseCredits * 0.5);
                const mats = item.materials || { metal: 1, cells: 0, chips: 0 };
                harvestMetal += mats.metal || 0;
                harvestCells += mats.cells || 0;
                harvestChips += mats.chips || 0;
            } else {
                // Recycle: 100% score and credits
                roundScore += itemBaseScore;
                roundCredits += itemBaseCredits;
            }

            this.debrisDeliveredCount++;
            this.missionMassDeorbitedKg = (this.missionMassDeorbitedKg || 0) + (item.mass || 50);
        });

        // Apply difficulty score multiplier
        roundScore = Math.floor(roundScore * (this.scoreMultiplier || 1.0));

        this.score += roundScore;
        this.creditsEarned += roundCredits;

        if (itemsCount > 0) {
            this.deliveriesCompleted++;
            this.firstDockTime = this.firstDockTime || Math.max(2, Math.round(this.elapsedTime));

            if (isStripping) {
                this.materialsSession.metal += harvestMetal;
                this.materialsSession.cells += harvestCells;
                this.materialsSession.chips += harvestChips;

                // Persist materials immediately to storage
                const save = OrbitalStorage.load();
                save.materials = save.materials || { metal: 0, cells: 0, chips: 0 };
                save.materials.metal = (save.materials.metal || 0) + harvestMetal;
                save.materials.cells = (save.materials.cells || 0) + harvestCells;
                save.materials.chips = (save.materials.chips || 0) + harvestChips;
                OrbitalStorage.save(save);

                window.soundSystem?.playStripDebris?.();
                this.logFlightEvent('STRIP', `Stripped ${itemsCount} items: +${harvestMetal} Metal, +${harvestCells} Cells, +${harvestChips} Chips (50% Credits).`, 'success');
            } else {
                window.soundSystem?.playDockingRecycle?.();
                this.logFlightEvent('DEPOT_DOCK', `Recycled ${itemsCount} items in Aegis Smelter (100% Value: +${roundScore} pts, +${roundCredits} scrap).`, 'success');
            }
        } else {
            window.soundSystem?.playDockingRecycle?.();
        }

        // Refuel and recharge battery at station depot!
        this.fuel = this.maxFuel;
        this.battery = this.maxBattery;
        this.loggedLowFuel = false;
        this.loggedLowBat = false;

        // Limited material-based repair if hull damaged
        if (this.hull < this.maxHull) {
            let usedMetal = false;
            if (this.materialsSession.metal > 0) {
                this.materialsSession.metal--;
                usedMetal = true;
            } else {
                const save = OrbitalStorage.load();
                if (save.materials && save.materials.metal > 0) {
                    save.materials.metal--;
                    OrbitalStorage.save(save);
                    usedMetal = true;
                }
            }
            if (usedMetal) {
                this.hull = Math.min(this.maxHull, this.hull + 35);
                this.showFloatingText(this.player.x, this.player.y - 30, '+35 HULL REPAIRED [-1 METAL]', '#10b981');
                this.logFlightEvent('FIELD REPAIR', 'Applied 1 harvested Metal to patch hull integrity (+35 HP).', 'success');
                window.soundSystem?.playRepair?.();
            }
        }

        // Emit recycling particle fountain
        this.recycleParticles.emitParticleAt(this.station.x, this.station.y, 30);

        if (itemsCount > 0) {
            if (isStripping) {
                this.showFloatingText(this.station.x, this.station.y - 40, `+${harvestMetal}M +${harvestCells}C +${harvestChips}CP (+${roundScore} PTS)`, '#f59e0b');
            } else {
                this.showFloatingText(this.station.x, this.station.y - 40, `+${roundScore} PTS | +${roundCredits} SCRAP`, '#10b981');
            }
        } else {
            this.showFloatingText(this.station.x, this.station.y - 40, 'SYSTEMS REFUELED // DEPOT DOCKED', '#38bdf8');
        }

        if (this.cargo.some(c => c.isPriorityCore)) {
            this.priorityCoreDelivered = true;
            this.logFlightEvent('CONTRACT', 'High-value priority core delivered to Aegis Depot.', 'success');
        }

        this.cargo = []; // Empty cargo hold

        // Check if Mission Victory Quota or Objective is achieved!
        let objectiveComplete = false;
        let winMessage = 'ORBITAL ZONE SUCCESSFULLY CLEANSED';

        if (this.contractObjective === 'recover') {
            if (this.priorityCoreDelivered) {
                objectiveComplete = true;
                winMessage = 'PRIORITY INSTRUMENT CORE RECOVERED & SECURED';
            }
        } else if (this.contractObjective === 'passivate') {
            if (this.passivatedStagesCount >= this.debrisTargetQuota) {
                objectiveComplete = true;
                winMessage = 'ALL TARGETED STAGES SAFELY PASSIVATED';
            }
        } else {
            if (this.debrisDeliveredCount >= this.debrisTargetQuota) {
                objectiveComplete = true;
                winMessage = this.contractObjective === 'protect' ? 'ASSET PROTECTION SUCCESSFUL: CONSTELLATION SECURED' : 'ORBITAL ZONE SUCCESSFULLY CLEANSED';
            }
        }

        if (objectiveComplete) {
            this.time.delayedCall(1200, () => {
                this.handleMissionEnd(true, winMessage);
            });
        } else {
            this.time.delayedCall(1000, () => {
                this.isDocked = false;
            });
        }
    }

    updateVentingRockets(dt) {
        if (!this.hazardGroup) return;
        this.hazardGroup.getChildren().forEach(h => {
            if (!h || !h.active) return;
            if (h.isPassivated) {
                h.isVenting = false;
                return;
            }
            const meta = h.hazardMeta || GAME_DATA.HAZARD_TYPES[h.hazardKey];
            if (meta?.id !== 'venting_rocket') return;

            h.ventTimer = (h.ventTimer || 3000) - (dt * 1000);
            if (!h.isVenting && h.ventTimer <= 0) {
                // Trigger venting cycle
                h.isVenting = true;
                h.ventDuration = 2200; // 2.2 seconds of venting
                h.ventAngle = h.rotation + Math.PI / 2; // direction opposite to rocket nozzle
            }

            if (h.isVenting) {
                h.ventDuration -= dt * 1000;
                if (h.ventDuration <= 0) {
                    h.isVenting = false;
                    h.ventTimer = Phaser.Math.Between(4000, 6000);
                } else {
                    // 1. Reactive thrust pushing rocket body forward
                    const reactionForce = 80;
                    const forwardAngle = h.rotation - Math.PI / 2;
                    h.body.velocity.x += Math.cos(forwardAngle) * reactionForce * dt;
                    h.body.velocity.y += Math.sin(forwardAngle) * reactionForce * dt;

                    // 2. Render plume jet in fxGraphics (Stepped Pixel Plume Chords)
                    const nozzleDist = 24;
                    const ventOriginX = h.x + Math.cos(h.ventAngle) * nozzleDist;
                    const ventOriginY = h.y + Math.sin(h.ventAngle) * nozzleDist;

                    const plumeLen = 95 + Math.sin(this.elapsedTime * 20) * 15;
                    const plumeSpread = 0.48;
                    const vAngle = h.ventAngle;

                    this.fxGraphics.lineStyle(2, 0xf97316, 0.75);
                    this.fxGraphics.lineBetween(ventOriginX, ventOriginY, ventOriginX + Math.cos(vAngle - plumeSpread) * plumeLen, ventOriginY + Math.sin(vAngle - plumeSpread) * plumeLen);
                    this.fxGraphics.lineBetween(ventOriginX, ventOriginY, ventOriginX + Math.cos(vAngle + plumeSpread) * plumeLen, ventOriginY + Math.sin(vAngle + plumeSpread) * plumeLen);

                    this.fxGraphics.lineStyle(1.5, 0xfde047, 0.6);
                    for (let step = 20; step <= plumeLen; step += 18) {
                        const stepSpread = plumeSpread * (step / plumeLen);
                        const pLeftX = ventOriginX + Math.cos(vAngle - stepSpread) * step;
                        const pLeftY = ventOriginY + Math.sin(vAngle - stepSpread) * step;
                        const pRightX = ventOriginX + Math.cos(vAngle + stepSpread) * step;
                        const pRightY = ventOriginY + Math.sin(vAngle + stepSpread) * step;
                        this.fxGraphics.lineBetween(pLeftX, pLeftY, pRightX, pRightY);
                    }

                    if (this.smokeParticles && Math.random() < 0.35) {
                        const puffDist = Phaser.Math.Between(15, plumeLen);
                        this.smokeParticles.emitParticleAt(
                            ventOriginX + Math.cos(vAngle) * puffDist,
                            ventOriginY + Math.sin(vAngle) * puffDist,
                            1
                        );
                    }

                    // 3. Check if player is caught in vent plume
                    if (this.player && this.player.active) {
                        const distToVent = Phaser.Math.Distance.Between(ventOriginX, ventOriginY, this.player.x, this.player.y);
                        if (distToVent < plumeLen) {
                            const angleToPlayer = Phaser.Math.Angle.Between(ventOriginX, ventOriginY, this.player.x, this.player.y);
                            const diff = Math.abs(Phaser.Math.Angle.Wrap(angleToPlayer - h.ventAngle));
                            if (diff <= plumeSpread) {
                                // In plume: heat damage & violent gas jet knockback
                                const ventDmg = 18 * dt * (this.damageReduction || 1.0);
                                this.hull = Math.max(0, this.hull - ventDmg);
                                this.player.body.velocity.x += Math.cos(h.ventAngle) * 360 * dt;
                                this.player.body.velocity.y += Math.sin(h.ventAngle) * 360 * dt;
                                if (this.sparkParticles && typeof this.sparkParticles.emitParticleAt === 'function') {
                                    this.sparkParticles.emitParticleAt(this.player.x, this.player.y, 2);
                                }
                                if (this.hull <= 0) {
                                    this.handleMissionEnd(false, 'HULL INCINERATED BY HYPERGOLIC VENT PLUME');
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Phase 7: Three Altitude Orbital Lanes with Differential Relative Movement
     * Behind GAME_DATA.features.orbitalLanes flag
     */
    updateOrbitalLanes(dt) {
        if (typeof GAME_DATA === 'undefined' || !GAME_DATA.features || !GAME_DATA.features.orbitalLanes) {
            return;
        }

        const worldW = this.physics.world.bounds.width;
        const driftSpeed = this.laneDriftSpeed || 35;

        // Determine player's active orbital lane based on altitude
        if (this.player && this.player.active) {
            const py = this.player.y;
            this.currentLane = py >= 2100 ? 1 : (py <= 1100 ? 3 : 2);
        }

        // Keep the Aegis Depot stationary in player's co-moving reference frame!
        if (this.station && this.station.body) {
            this.station.setVelocity(0, 0);
        }

        // Differential orbital movement of Debris based on altitude lane
        if (this.debrisGroup) {
            this.debrisGroup.getChildren().forEach(d => {
                if (!d || !d.active) return;
                let laneDrift = 0;
                if (d.y >= 2100) laneDrift = driftSpeed; // Lane 1: Low Perigee -> fast eastward (+X)
                else if (d.y <= 1100) laneDrift = -driftSpeed; // Lane 3: High Apogee -> slow westward (-X)

                if (laneDrift !== 0) {
                    d.x += laneDrift * dt;
                    if (d.x < 30) d.x = worldW - 40;
                    else if (d.x > worldW - 30) d.x = 40;
                }
            });
        }

        // Differential orbital movement of Hazards based on altitude lane
        if (this.hazardGroup) {
            this.hazardGroup.getChildren().forEach(h => {
                if (!h || !h.active) return;
                let laneDrift = 0;
                if (h.y >= 2100) laneDrift = driftSpeed;
                else if (h.y <= 1100) laneDrift = -driftSpeed;

                if (laneDrift !== 0) {
                    h.x += laneDrift * dt;
                    if (h.x < 30) h.x = worldW - 40;
                    else if (h.x > worldW - 30) h.x = 40;
                }
            });
        }
    }

    /**
     * Phase 7: NASA/CCMC DONKI Space Weather Simulation
     * Behind GAME_DATA.features.spaceWeather flag
     */
    updateSpaceWeather(dt) {
        if (typeof GAME_DATA === 'undefined' || !GAME_DATA.features || !GAME_DATA.features.spaceWeather) {
            this.activeSpaceWeather = null;
            return;
        }

        if (this.activeSpaceWeather) {
            this.spaceWeatherTimer -= dt;
            const effects = this.activeSpaceWeather.effects || {};
            const damping = this.spaceWeatherShieldDamping || 1.0;

            // 1. Power Effects (Solar flux opacity and battery radiation leakage)
            if (effects.powerDrainModifier && effects.powerDrainModifier < 1.0) {
                const penalty = (1.0 - effects.powerDrainModifier) * damping;
                this.effectiveSolarMod = Math.max(0.25, 1.0 - penalty);
            } else {
                this.effectiveSolarMod = 1.0;
            }

            if (effects.batteryDrainPerSec && effects.batteryDrainPerSec > 0) {
                const drain = effects.batteryDrainPerSec * damping * dt;
                this.battery = Math.max(0, this.battery - drain);
            }

            // 2. Radar Noise Simulation (Electrostatic scanlines across HUD)
            if (effects.radarNoise && effects.radarNoise > 0) {
                const noiseLevel = effects.radarNoise * damping;
                if (this.hudGraphics && Math.random() < 0.60 && this.cameras && this.cameras.main) {
                    const cam = this.cameras.main;
                    const lineY = (typeof Phaser !== 'undefined' && Phaser.Math && Phaser.Math.Between) ? Phaser.Math.Between(0, cam.height) : Math.floor(Math.random() * cam.height);
                    this.hudGraphics.lineStyle(1, 0x00f3ff, 0.15 * noiseLevel);
                    this.hudGraphics.lineBetween(0, lineY, cam.width, lineY);
                }
            }

            // 3. Comms Disruption Simulation (Sensor warning range contraction)
            if (effects.commsDisruption && effects.commsDisruption > 0) {
                const hasRelay = this.hasTdrssRelay;
                const commsPenalty = effects.commsDisruption * (hasRelay ? 0.45 : 1.0) * damping;
                this.effectiveRadarMultiplier = (this.radarMultiplier || 1.0) * (1.0 - (commsPenalty * 0.28));
            } else {
                this.effectiveRadarMultiplier = this.radarMultiplier || 1.0;
            }

            // 4. Kinetic Solar Wind & Thermospheric Drag Hazard Force
            if (this.player && this.player.body && this.player.body.velocity) {
                const stormWindSpeed = (this.isStormSeason ? 65 : 45) * damping;
                const windAngle = this.stormWindAngle || (Math.PI * 0.18);
                this.player.body.velocity.x += Math.cos(windAngle) * stormWindSpeed * dt;
                this.player.body.velocity.y += Math.sin(windAngle) * stormWindSpeed * dt;
            }

            // Solar Wind drift applied to drifting space debris
            if (this.debrisGroup && typeof this.debrisGroup.getChildren === 'function') {
                const windAngle = this.stormWindAngle || (Math.PI * 0.18);
                const debrisList = this.debrisGroup.getChildren();
                for (let i = 0; i < debrisList.length; i++) {
                    const d = debrisList[i];
                    if (d && d.active && d.body && d.body.velocity && !d.isPendingCollection) {
                        d.body.velocity.x += Math.cos(windAngle) * 22 * dt;
                        d.body.velocity.y += Math.sin(windAngle) * 22 * dt;
                    }
                }
            }

            // 5. Periodic Geomagnetic Plasma EMP Surges (Physical Storm Hazard Pulse)
            this.stormPulseTimer = (this.stormPulseTimer !== undefined ? this.stormPulseTimer : 10) - dt;
            if (this.stormPulseTimer <= 0) {
                this.stormPulseTimer = this.isStormSeason ? 10.0 : 14.0;
                if (typeof this.triggerStormPlasmaSurge === 'function') {
                    this.triggerStormPlasmaSurge();
                }
            }

            // 6. Visual Auroral Ionization & Electrostatic Arcs
            if (this.fxGraphics && Math.random() < 0.35 && this.player) {
                const randOff = () => (Math.random() - 0.5) * 350;
                const sx = this.player.x + randOff();
                const sy = this.player.y + randOff();
                const ex = sx + (Math.random() - 0.5) * 90;
                const ey = sy + (Math.random() - 0.5) * 90;
                this.fxGraphics.lineStyle(1.5, 0x00f3ff, 0.7);
                this.fxGraphics.lineBetween(sx, sy, ex, ey);
            }

            if (this.spaceWeatherTimer <= 0) {
                this.logFlightEvent('WEATHER_CLEAR', `Space weather disturbance ${this.activeSpaceWeather.eventID} cleared. Systems recovered to nominal.`, 'info');
                this.activeSpaceWeather = null;
                this.effectiveSolarMod = 1.0;
                this.effectiveRadarMultiplier = this.radarMultiplier || 1.0;
                this.spaceWeatherCooldown = this.isStormSeason ? 3.0 : ((typeof Phaser !== 'undefined' && Phaser.Math && Phaser.Math.Between) ? Phaser.Math.Between(35, 60) : 40);

                if (this.isStormSeason) {
                    this.triggerSpaceWeatherEvent();
                }
            }
        } else {
            this.effectiveSolarMod = 1.0;
            this.effectiveRadarMultiplier = this.radarMultiplier || 1.0;

            // Periodic space weather triggering
            this.spaceWeatherCooldown -= dt;
            if (this.spaceWeatherCooldown <= 0) {
                this.triggerSpaceWeatherEvent();
            }
        }
    }

    /**
     * Trigger a NASA/CCMC DONKI space weather alert
     */
    triggerSpaceWeatherEvent(eventId = null) {
        if (typeof GAME_DATA === 'undefined' || !GAME_DATA.features || !GAME_DATA.features.spaceWeather) {
            return;
        }

        // Offline Resilience: Validate that DONKI_SNAPSHOT exists and has events
        if (typeof DONKI_SNAPSHOT === 'undefined' || !DONKI_SNAPSHOT || !Array.isArray(DONKI_SNAPSHOT.events) || DONKI_SNAPSHOT.events.length === 0) {
            return;
        }

        let event = null;
        if (eventId && typeof DONKI_SNAPSHOT.getEventById === 'function') {
            event = DONKI_SNAPSHOT.getEventById(eventId);
        }
        if (!event) {
            if (this.missionConfig.id === 'low_altitude_breakup') {
                event = DONKI_SNAPSHOT.events.find(e => e.eventType === 'GST') || DONKI_SNAPSHOT.getRandomEvent();
            } else {
                event = DONKI_SNAPSHOT.getRandomEvent();
            }
        }
        if (!event) return;

        this.activeSpaceWeather = event;
        this.spaceWeatherTimer = event.effects?.durationSec || 28;

        // Calculate Shielding Mitigation Factor
        const hullLvl = this.hullUpgradeLevel || 0;
        const isArmored = this.payloadConfig?.id === 'armored';
        const isTitan = this.spacecraftBus?.id === 'titan';
        const shieldAbsorption = Math.min(0.70, (hullLvl * 0.15) + (isArmored ? 0.20 : 0) + (isTitan ? 0.25 : 0));
        this.spaceWeatherShieldDamping = Math.max(0.30, 1.0 - shieldAbsorption);

        const dateStr = event.eventTime ? event.eventTime.slice(0, 10) : '2024-05-10';
        const shieldPct = Math.round(shieldAbsorption * 100);

        if (event.isSimulated) {
            this.logFlightEvent('WEATHER_ALERT', `[SIMULATED] ${event.eventID} (${dateStr}): ${event.severity}. Source: ${event.source}. Shielding absorbed ${shieldPct}% of flux.`, 'warn');
        } else {
            this.logFlightEvent('WEATHER_ALERT', `REAL EVENT ${event.eventID} (${dateStr}): ${event.severity}. Source: ${event.source}. Shielding absorbed ${shieldPct}% of flux.`, 'crit');
        }

        window.soundSystem?.playWarning?.(true);
    }

    executeLaserNudge() {
        if (this.battery < 12) {
            this.showFloatingText(this.player.x, this.player.y - 30, 'BATTERY LOW (12 REQUIRED)', '#ef4444');
            return;
        }

        const maxRange = 360 * (this.radarMultiplier || 1.0);
        let bestTarget = null;
        let bestScore = -1;

        // Prioritize conjunction targets or closest hazards/debris
        if (this.hazardGroup) {
            this.hazardGroup.getChildren().forEach(h => {
                if (!h || !h.active) return;
                const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, h.x, h.y);
                if (d < maxRange) {
                    const score = 1000 - d;
                    if (score > bestScore) {
                        bestScore = score;
                        bestTarget = h;
                    }
                }
            });
        }

        if (this.debrisGroup) {
            this.debrisGroup.getChildren().forEach(d => {
                if (!d || !d.active || d.isPendingCollection) return;
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, d.x, d.y);
                if (dist < maxRange) {
                    const score = 500 - dist;
                    if (score > bestScore) {
                        bestScore = score;
                        bestTarget = d;
                    }
                }
            });
        }

        if (!bestTarget) {
            this.showFloatingText(this.player.x, this.player.y - 30, 'NO TARGET IN NUDGE RANGE', '#f59e0b');
            return;
        }

        // Consume battery
        this.battery = Math.max(0, this.battery - 12);
        this.nudgesCount++;

        // Apply radial deflection impulse away from player
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, bestTarget.x, bestTarget.y);
        const impulse = 240;
        if (bestTarget.body) {
            bestTarget.body.velocity.x += Math.cos(angle) * impulse;
            bestTarget.body.velocity.y += Math.sin(angle) * impulse;
            bestTarget.body.angularVelocity += Phaser.Math.Between(-120, 120);
        }

        // Visual laser nudge effect
        this.laserNudgeEffect = {
            startX: this.player.x,
            startY: this.player.y,
            targetX: bestTarget.x,
            targetY: bestTarget.y,
            life: 0.18
        };

        if (this.sparkParticles && typeof this.sparkParticles.emitParticleAt === 'function') {
            this.sparkParticles.emitParticleAt(bestTarget.x, bestTarget.y, 14);
        }

        window.soundSystem?.playLaserNudge?.();
        this.score += 60;
        this.kesslerRisk = Math.max(0, this.kesslerRisk - 3);

        const targetName = bestTarget.hazardMeta?.name || bestTarget.debrisType?.name || 'Debris';
        this.logFlightEvent('NUDGE', `Laser impulse deflected ${targetName}. Trajectory altered (-3% Kessler Risk).`, 'info');
        this.showFloatingText(bestTarget.x, bestTarget.y - 25, '+60 NUDGE DEFLECTED', '#00f3ff');

        // Phase 8a: Passivate upper-stage venting hazards
        if (this.contractObjective === 'passivate' && (bestTarget.hazardMeta?.id === 'venting_rocket' || bestTarget.hazardKey === 'venting_rocket')) {
            if (!bestTarget.isPassivated) {
                bestTarget.isPassivated = true;
                bestTarget.setTint(0x10b981);
                this.passivatedStagesCount = (this.passivatedStagesCount || 0) + 1;
                this.showFloatingText(bestTarget.x, bestTarget.y - 35, `PASSIVATED (${this.passivatedStagesCount}/${this.debrisTargetQuota})`, '#10b981');
                this.logFlightEvent('PASSIVATE', `Pressurized upper stage neutralized (${this.passivatedStagesCount}/${this.debrisTargetQuota}).`, 'success');
                if (this.passivatedStagesCount >= this.debrisTargetQuota) {
                    this.time.delayedCall(1200, () => {
                        this.handleMissionEnd(true, 'ALL TARGETED STAGES SAFELY PASSIVATED');
                    });
                }
            }
        }
    }

    /**
     * Trigger a physical Coronal Plasma EMP Hazard Surge across the orbital sector
     */
    triggerStormPlasmaSurge() {
        if (!this.player || !this.player.active) return;

        // Check if player is safely docked or within Aegis Depot Faraday shield haven
        const distToDepot = (this.station && typeof Phaser !== 'undefined' && Phaser.Math)
            ? Phaser.Math.Distance.Between(this.player.x, this.player.y, this.station.x, this.station.y)
            : 9999;
        const depotShieldRadius = (this.stationDockingRadius || 180) + 50;
        const isSafeInDepot = distToDepot <= depotShieldRadius;

        if (this.cameras && this.cameras.main) {
            this.cameras.main.shake(320, 0.008);
        }
        window.soundSystem?.playWarning?.(true);

        if (isSafeInDepot) {
            if (typeof this.showFloatingText === 'function') {
                this.showFloatingText(this.player.x, this.player.y - 25, 'DEPOT FARADAY SHIELD: SURGE GROUNDED', '#10b981');
            }
            this.logFlightEvent('STORM_SHIELD', 'Aegis Depot magnetic perimeter absorbed coronal plasma surge. Craft unharmed.', 'success');
            return;
        }

        // Caught in open space: Electrostatic plasma shock
        const damping = this.spaceWeatherShieldDamping || 1.0;
        const baseDamage = 14;
        const actualDamage = Math.max(3, Math.round(baseDamage * damping));
        const batDrain = Math.round(18 * damping);

        this.hull = Math.max(0, this.hull - actualDamage);
        this.battery = Math.max(0, this.battery - batDrain);
        this.stormAvionicsJitterTimer = 1.6; // Momentary control instability

        if (this.particleEmitterSpark && typeof this.particleEmitterSpark.explode === 'function') {
            this.particleEmitterSpark.explode(16, this.player.x, this.player.y);
        }
        if (this.particleEmitterShockwave && typeof this.particleEmitterShockwave.explode === 'function') {
            this.particleEmitterShockwave.explode(1, this.player.x, this.player.y);
        }

        window.soundSystem?.playExplosion?.();

        if (typeof this.showFloatingText === 'function') {
            this.showFloatingText(this.player.x, this.player.y - 30, `⚡ CORONAL SURGE! -${actualDamage} HP -${batDrain} BAT`, '#ef4444');
        }
        this.logFlightEvent('STORM_HAZARD', `Coronal plasma EMP surge hit craft! Hull -${actualDamage} HP, Battery -${batDrain}, Avionics jittered.`, 'crit');

        if (this.hull <= 0 && typeof this.handleMissionEnd === 'function') {
            this.handleMissionEnd(false, 'HULL BREACH - DESTROYED BY CORONAL PLASMA STORM');
        }
    }

    handleDebrisDebrisCollision(d1, d2) {
        if (!d1 || !d2 || !d1.active || !d2.active) return;
        if (!d1.body || !d2.body) return;

        const relVx = d1.body.velocity.x - d2.body.velocity.x;
        const relVy = d1.body.velocity.y - d2.body.velocity.y;
        const relSpeed = Math.hypot(relVx, relVy);

        const now = this.time.now;
        if ((d1._lastCollide && (now - d1._lastCollide < 800)) || (d2._lastCollide && (now - d2._lastCollide < 800))) {
            return;
        }
        d1._lastCollide = now;
        d2._lastCollide = now;

        if (relSpeed > 100) {
            // High speed collision triggers fragmentation
            const centerX = (d1.x + d2.x) / 2;
            const centerY = (d1.y + d2.y) / 2;
            const fragCount = Phaser.Math.Between(3, 5);
            this.pendingFragmentations.push({
                x: centerX,
                y: centerY,
                count: fragCount,
                vx: (d1.body.velocity.x + d2.body.velocity.x) / 2,
                vy: (d1.body.velocity.y + d2.body.velocity.y) / 2,
                parentMass: (d1.debrisType?.mass || 30) + (d2.debrisType?.mass || 30)
            });
            window.soundSystem?.playCollision?.();
        }
    }

    handleHazardDebrisCollision(debris, hazard) {
        if (!debris || !hazard || !debris.active || !hazard.active) return;
        if (hazard._collidedWithDebris) return;
        hazard._collidedWithDebris = true;

        const centerX = (debris.x + hazard.x) / 2;
        const centerY = (debris.y + hazard.y) / 2;
        const fragCount = Phaser.Math.Between(3, 8);

        this.pendingFragmentations.push({
            x: centerX,
            y: centerY,
            count: fragCount,
            vx: debris.body ? debris.body.velocity.x : 0,
            vy: debris.body ? debris.body.velocity.y : 0,
            parentMass: debris.debrisType?.mass || 50
        });

        // Safely queue destruction outside collision callbacks
        debris.setActive(false);
        debris.setVisible(false);
        if (debris.body) debris.body.enable = false;
        this.pendingHazardDestructions.push(debris);

        if (hazard.hazardMeta?.id === 'hidden_debris') {
            hazard.setActive(false);
            hazard.setVisible(false);
            if (hazard.body) hazard.body.enable = false;
            this.pendingHazardDestructions.push(hazard);
        }

        if (this.sparkParticles && typeof this.sparkParticles.emitParticleAt === 'function') {
            this.sparkParticles.emitParticleAt(centerX, centerY, 20);
        }
        if (this.smokeParticles && typeof this.smokeParticles.emitParticleAt === 'function') {
            this.smokeParticles.emitParticleAt(centerX, centerY, 10);
        }
        if (this.shockwaveParticles && typeof this.shockwaveParticles.emitParticleAt === 'function') {
            this.shockwaveParticles.emitParticleAt(centerX, centerY, 1);
        }

        window.soundSystem?.playExplosion?.();
    }

    handleProximityRadar(dt) {
        let imminentDanger = false;
        let closestThreat = null;
        let minThreatDist = Infinity;
        const frameDt = (typeof dt === 'number' && dt > 0) ? dt : (1 / 60);

        if (!this.hazardGroup || !this.player) return;

        // Check all hazards for proximity & reveal hidden small debris
        const currentRadarMult = this.effectiveRadarMultiplier !== undefined ? this.effectiveRadarMultiplier : (this.radarMultiplier || 1.0);

        this.hazardGroup.getChildren().forEach(h => {
            if (!h || !h.active) return;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, h.x, h.y);
            const meta = h.hazardMeta || (h.hazardKey ? GAME_DATA.HAZARD_TYPES[h.hazardKey] : null) || GAME_DATA.HAZARD_TYPES.hidden_debris;

            // Apply space-weather electromagnetic radar noise jitter if active
            let effectiveDist = dist;
            if (this.activeSpaceWeather && this.activeSpaceWeather.effects?.radarNoise) {
                const noise = this.activeSpaceWeather.effects.radarNoise * (this.spaceWeatherShieldDamping || 1.0);
                effectiveDist += (Math.random() - 0.5) * 40 * noise;
            }

            // Hidden debris radar cross section mechanic: dimmed until within radar detection range
            if (meta?.id === 'hidden_debris') {
                const detectionDist = 280 * currentRadarMult;
                if (effectiveDist < detectionDist) {
                    h.alpha = 1.0;
                    // Stepped pixel detection brackets around detected hidden debris
                    const bx = Math.floor(h.x);
                    const by = Math.floor(h.y);
                    const bsize = 14;
                    this.fxGraphics.lineStyle(1.5, 0x94a3b8, 0.65);
                    this.fxGraphics.lineBetween(bx - bsize, by - bsize, bx - bsize + 5, by - bsize);
                    this.fxGraphics.lineBetween(bx - bsize, by - bsize, bx - bsize, by - bsize + 5);
                    this.fxGraphics.lineBetween(bx + bsize, by - bsize, bx + bsize - 5, by - bsize);
                    this.fxGraphics.lineBetween(bx + bsize, by - bsize, bx + bsize, by - bsize + 5);
                    this.fxGraphics.lineBetween(bx - bsize, by + bsize, bx - bsize + 5, by + bsize);
                    this.fxGraphics.lineBetween(bx - bsize, by + bsize, bx - bsize, by + bsize - 5);
                    this.fxGraphics.lineBetween(bx + bsize, by + bsize, bx + bsize - 5, by + bsize);
                    this.fxGraphics.lineBetween(bx + bsize, by + bsize, bx + bsize, by + bsize - 5);
                } else {
                    h.alpha = 0.35;
                }
            }

            // Dynamic warning radius based on hazard metadata and sensor upgrade
            const hazardWarningDist = (meta?.warningRadius || 320) * currentRadarMult;

            // Proximity warning trigger
            if (effectiveDist < hazardWarningDist) {
                imminentDanger = true;
                if (effectiveDist < minThreatDist) {
                    minThreatDist = effectiveDist;
                    closestThreat = h;
                }
            }

            // If hazard is a nuclear satellite, emit continuous radiation drain per second (Stepped pixel ring)
            if (meta?.id === 'nuclear' && dist < (meta.radiationRadius || 180)) {
                this.battery = Math.max(0, this.battery - (meta.batteryDrain || 15) * frameDt);
                const rad = meta.radiationRadius || 180;
                const hx = Math.floor(h.x);
                const hy = Math.floor(h.y);
                const step = rad * 0.707;
                this.fxGraphics.lineStyle(1.5, 0x84cc16, 0.45);
                this.fxGraphics.beginPath();
                this.fxGraphics.moveTo(hx - rad, hy);
                this.fxGraphics.lineTo(hx - step, hy - step);
                this.fxGraphics.lineTo(hx, hy - rad);
                this.fxGraphics.lineTo(hx + step, hy - step);
                this.fxGraphics.lineTo(hx + rad, hy);
                this.fxGraphics.lineTo(hx + step, hy + step);
                this.fxGraphics.lineTo(hx, hy + rad);
                this.fxGraphics.lineTo(hx - step, hy + step);
                this.fxGraphics.closePath();
                this.fxGraphics.strokePath();
            }
        });

        // Trigger Audio & Visual Warning Alert safely
        if (imminentDanger) {
            if (!this.warningActive) {
                this.warningActive = true;
                window.soundSystem?.playWarning?.(true);
            }
            // Dynamic directional hazard indicator arrow pointing directly towards incoming meteor/hazard
            const blink = Math.floor(this.time.now / 150) % 2 === 0;
            if (blink && closestThreat) {
                const threatAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, closestThreat.x, closestThreat.y);
                const indicatorRadius = 40;
                const ax = this.player.x + Math.cos(threatAngle) * indicatorRadius;
                const ay = this.player.y + Math.sin(threatAngle) * indicatorRadius;

                const cosA = Math.cos(threatAngle);
                const sinA = Math.sin(threatAngle);
                const tipX = ax + cosA * 16;
                const tipY = ay + sinA * 16;
                const leftX = ax + Math.cos(threatAngle + 2.45) * 12;
                const leftY = ay + Math.sin(threatAngle + 2.45) * 12;
                const rightX = ax + Math.cos(threatAngle - 2.45) * 12;
                const rightY = ay + Math.sin(threatAngle - 2.45) * 12;
                const notchX = ax + cosA * 3;
                const notchY = ay + sinA * 3;

                // Outer red tactical directional arrow
                this.fxGraphics.fillStyle(0xef4444, 0.95);
                this.fxGraphics.beginPath();
                this.fxGraphics.moveTo(tipX, tipY);
                this.fxGraphics.lineTo(leftX, leftY);
                this.fxGraphics.lineTo(notchX, notchY);
                this.fxGraphics.lineTo(rightX, rightY);
                this.fxGraphics.closePath();
                this.fxGraphics.fillPath();

                // Inner high-contrast warning accent
                this.fxGraphics.fillStyle(0xffffff, 0.95);
                this.fxGraphics.beginPath();
                this.fxGraphics.moveTo(tipX - cosA * 4, tipY - sinA * 4);
                this.fxGraphics.lineTo(ax + Math.cos(threatAngle + 2.45) * 6, ay + Math.sin(threatAngle + 2.45) * 6);
                this.fxGraphics.lineTo(notchX, notchY);
                this.fxGraphics.lineTo(ax + Math.cos(threatAngle - 2.45) * 6, ay + Math.sin(threatAngle - 2.45) * 6);
                this.fxGraphics.closePath();
                this.fxGraphics.fillPath();

                // Directional threat vector line toward the incoming hazard
                this.fxGraphics.lineStyle(1.5, 0xef4444, 0.6);
                this.fxGraphics.lineBetween(tipX, tipY, ax + cosA * 26, ay + sinA * 26);
            }
        } else {
            if (this.warningActive) {
                this.warningActive = false;
                window.soundSystem?.playWarning?.(false);
            }
        }

        // Draw offscreen directional indicator arrows towards Station and Hazards
        this.drawHUDOffscreenPointers();
    }

    drawHUDOffscreenPointers() {
        if (!this.cameras || !this.cameras.main || !this.player) return;
        const cam = this.cameras.main;
        const viewW = cam.width;
        const viewH = cam.height;
        const padding = 35;

        // Pointer helper
        const drawIndicator = (targetX, targetY, color, isStation = false) => {
            if (typeof targetX !== 'number' || typeof targetY !== 'number' || isNaN(targetX) || isNaN(targetY)) return;

            // Check if target is inside screen viewport
            const screenX = targetX - cam.scrollX;
            const screenY = targetY - cam.scrollY;
            if (screenX >= 0 && screenX <= viewW && screenY >= 0 && screenY <= viewH) {
                return; // Target already visible
            }

            // Calculate clamping to screen edges
            const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY);
            const cx = viewW / 2;
            const cy = viewH / 2;
            const edgeX = Phaser.Math.Clamp(cx + Math.cos(angle) * (viewW / 2 - padding), padding, viewW - padding);
            const edgeY = Phaser.Math.Clamp(cy + Math.sin(angle) * (viewH / 2 - padding), padding, viewH - padding);

            // Pixel Offscreen Indicator Pointer
            const ex = Math.floor(edgeX);
            const ey = Math.floor(edgeY);
            this.hudGraphics.fillStyle(color, 0.9);
            if (isStation) {
                // Pixel Diamond for Aegis Station
                this.hudGraphics.fillRect(ex - 1, ey - 4, 3, 9);
                this.hudGraphics.fillRect(ex - 4, ey - 1, 9, 3);
                this.hudGraphics.fillRect(ex - 2, ey - 2, 5, 5);
                this.hudGraphics.fillStyle(0xffffff, 1.0);
                this.hudGraphics.fillRect(ex, ey, 1, 1);
            } else {
                // Pixel Directional Warning Arrow for Hazard
                const cosA = Math.cos(angle);
                const sinA = Math.sin(angle);
                this.hudGraphics.fillStyle(0xef4444, 0.95);
                this.hudGraphics.beginPath();
                this.hudGraphics.moveTo(ex + cosA * 8, ey + sinA * 8);
                this.hudGraphics.lineTo(ex + Math.cos(angle + 2.4) * 8, ey + Math.sin(angle + 2.4) * 8);
                this.hudGraphics.lineTo(ex + cosA * 2, ey + sinA * 2);
                this.hudGraphics.lineTo(ex + Math.cos(angle - 2.4) * 8, ey + Math.sin(angle - 2.4) * 8);
                this.hudGraphics.closePath();
                this.hudGraphics.fillPath();
                // Core dot
                this.hudGraphics.fillStyle(0xffffff, 0.9);
                this.hudGraphics.fillRect(ex - 1, ey - 1, 2, 2);
            }
        };

        // Pointer to Aegis Station (Green)
        if (this.station) {
            drawIndicator(this.station.x, this.station.y, 0x10b981, true);
        }

        // Pointers to active hazards (Red)
        if (this.hazardGroup) {
            this.hazardGroup.getChildren().forEach(h => {
                if (h && h.active) {
                    drawIndicator(h.x, h.y, 0xef4444, false);
                }
            });
        }
    }

    handleShipDebrisBump(player, debris) {
        if (!debris || !debris.active) return;
        if (!player || !player.body || !debris.body) return;

        // If debris is currently being pulled by tractor beam and we have cargo space, safely collect without collision damage
        const isTractorPull = debris.isBeingPulledByTractor && (this.time.now - (debris.tractorPullTime || 0) < 350);
        if (isTractorPull) {
            if (this.cargo.length < this.cargoCapacity) {
                this.queueDebrisCollection(debris);
            }
            return;
        }

        // Calculate relative collision speed to determine impact severity
        const relVelX = player.body.velocity.x - debris.body.velocity.x;
        const relVelY = player.body.velocity.y - debris.body.velocity.y;
        const impactSpeed = Math.hypot(relVelX, relVelY);

        // Cooldown between damage events for the same debris interaction (300ms)
        const now = this.time.now;
        if (debris.lastDamageTime && (now - debris.lastDamageTime) < 300) {
            return;
        }

        // Apply momentum transfer knockback
        const bumpAngle = Phaser.Math.Angle.Between(debris.x, debris.y, player.x, player.y);
        const knockbackImpulse = Math.min(260, impactSpeed * 0.9);
        player.body.velocity.x += Math.cos(bumpAngle) * knockbackImpulse;
        player.body.velocity.y += Math.sin(bumpAngle) * knockbackImpulse;
        debris.body.velocity.x -= Math.cos(bumpAngle) * knockbackImpulse * 0.7;
        debris.body.velocity.y -= Math.sin(bumpAngle) * knockbackImpulse * 0.7;

        // Storm Electrostatic Hazard Discharge on Debris Collision
        if (Boolean(this.activeSpaceWeather || this.isStormSeason) && !isTractorPull) {
            const zapDmg = Math.max(2, Math.round(6 * (this.spaceWeatherShieldDamping || 1.0)));
            this.hull = Math.max(0, this.hull - zapDmg);
            this.battery = Math.max(0, this.battery - 10);
            if (this.sparkParticles && typeof this.sparkParticles.emitParticleAt === 'function') {
                this.sparkParticles.emitParticleAt(debris.x, debris.y, 8);
            }
            this.showFloatingText(debris.x, debris.y - 35, `⚡ STATIC DISCHARGE -${zapDmg} HP`, '#00f3ff');
            this.logFlightEvent('ELECTROSTATIC', `Charged debris static discharge (-${zapDmg} Hull, -10 Bat). Use tractor to ground.`, 'warn');
            window.soundSystem?.playWarning?.();
        }

        // Low-speed contact (< 60 px/s) -> negligible damage; continuous contact does NOT drain health
        if (impactSpeed < 60) {
            return;
        }

        debris.lastDamageTime = now;
        window.soundSystem?.playCollision?.();
        this.collisionsCount++;

        // Meaningful high-speed impact damage scaling
        const severity = (impactSpeed - 60) / 160;
        const debrisMass = debris.debrisType?.mass || 50;
        const massMultiplier = Math.max(0.6, debrisMass / 60);
        const impactDamage = Math.max(3, Math.min(42, Math.round(10 * severity * massMultiplier * (this.damageReduction || 1.0) * (this.damageMultiplier || 1.0))));
        this.hull = Math.max(0, this.hull - impactDamage);

        this.logFlightEvent('IMPACT', `Debris collision at ${Math.round(impactSpeed)} px/s (-${impactDamage} Hull).`, 'crit');
        this.cameras.main.shake(120, Math.min(0.015, 0.003 * severity));
        if (this.sparkParticles && typeof this.sparkParticles.emitParticleAt === 'function') {
            this.sparkParticles.emitParticleAt(player.x, player.y, 10);
        }
        if (this.smokeParticles && impactSpeed > 100 && typeof this.smokeParticles.emitParticleAt === 'function') {
            this.smokeParticles.emitParticleAt(player.x, player.y, 4);
        }
        this.shieldTimer = 0.35;
        this.showFloatingText(player.x, player.y - 25, `-${impactDamage} HULL`, '#f59e0b');

        // High speed impact fragmentation (amplified when Kessler risk is elevated)
        if (impactSpeed > 130 && debrisMass >= 30) {
            const count = this.kesslerRisk > 75 ? Phaser.Math.Between(4, 8) : Phaser.Math.Between(3, 6);
            this.pendingFragmentations.push({
                x: debris.x,
                y: debris.y,
                count: count,
                vx: debris.body.velocity.x,
                vy: debris.body.velocity.y,
                parentMass: debrisMass
            });
        }

        if (this.hull <= 0) {
            this.handleMissionEnd(false, 'HULL BREACH - SPACECRAFT DESTROYED');
        }
    }

    handleShipHazardCollision(player, hazard) {
        if (!hazard || !hazard.active) return;
        if (hazard._collided) return;
        hazard._collided = true;

        window.soundSystem?.playExplosion?.();
        this.collisionsCount++;

        const meta = hazard.hazardMeta || (hazard.hazardKey ? GAME_DATA.HAZARD_TYPES[hazard.hazardKey] : null) || GAME_DATA.HAZARD_TYPES.hidden_debris;
        const dmg = (meta.damage || 35) * (this.damageReduction || 1.0) * (this.damageMultiplier || 1.0);
        this.hull = Math.max(0, this.hull - dmg);

        // Apply violent collision knockback impulse
        const hazardAngle = Phaser.Math.Angle.Between(hazard.x, hazard.y, player.x, player.y);
        player.body.velocity.x += Math.cos(hazardAngle) * 320;
        player.body.velocity.y += Math.sin(hazardAngle) * 320;

        // Fragmentation on violent hazard collision (amplified when Kessler risk is elevated)
        const fragCount = this.kesslerRisk > 75 ? Phaser.Math.Between(4, 8) : Phaser.Math.Between(3, 6);
        this.pendingFragmentations.push({
            x: hazard.x,
            y: hazard.y,
            count: fragCount,
            vx: Math.cos(hazardAngle) * 120,
            vy: Math.sin(hazardAngle) * 120,
            parentMass: 40
        });

        this.logFlightEvent('HAZARD', `Orbital anomaly collision! (-${Math.round(dmg)} Hull).`, 'crit');

        this.cameras.main.shake(300, 0.02);
        if (this.sparkParticles && typeof this.sparkParticles.emitParticleAt === 'function') {
            this.sparkParticles.emitParticleAt(hazard.x, hazard.y, 25);
        }
        if (this.smokeParticles && typeof this.smokeParticles.emitParticleAt === 'function') {
            this.smokeParticles.emitParticleAt(hazard.x, hazard.y, 10);
        }
        if (this.shockwaveParticles && typeof this.shockwaveParticles.emitParticleAt === 'function') {
            this.shockwaveParticles.emitParticleAt(hazard.x, hazard.y, 2);
        }
        this.shieldTimer = 0.45;
        this.showFloatingText(player.x, player.y - 30, `-${Math.round(dmg)} HULL`, '#ef4444');

        // Physics safety: disable body and queue destruction safely outside collision callback
        if (hazard.body) hazard.body.enable = false;
        hazard.setVisible(false);
        hazard.setActive(false);
        this.pendingHazardDestructions.push(hazard);

        if (this.hull <= 0) {
            this.handleMissionEnd(false, 'CRITICAL COLLISION - SPACECRAFT DESTROYED');
        }
    }

    showFloatingText(x, y, message, color = '#ffffff') {
        const text = this.add.text(x, y, message, {
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '18px',
            fontStyle: 'bold',
            fill: color,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(30);

        this.tweens.add({
            targets: text,
            y: y - 45,
            alpha: 0,
            duration: 1200,
            ease: 'Power1',
            onComplete: () => text.destroy()
        });
    }

    handleMissionEnd(isVictory, reason) {
        if (this.isMissionOver) return;
        this.isMissionOver = true;

        window.soundSystem.setThruster(false);
        window.soundSystem.setTractorBeam(false);
        window.soundSystem.playWarning(false);

        // Phase 8c: Cascade Survival Mode Finalization
        if (this.isSurvivalMode) {
            const timeSurvivedSec = Math.floor(this.elapsedTime);
            const mins = Math.floor(timeSurvivedSec / 60);
            const secs = timeSurvivedSec % 60;
            const formattedTime = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

            let rating = 'CADET';
            if (timeSurvivedSec >= 150) rating = 'TITAN OF THE COMMONS';
            else if (timeSurvivedSec >= 90) rating = 'CASCADE ACE';
            else if (timeSurvivedSec >= 45) rating = 'ORBITAL VETERAN';

            const survivalScore = this.score + (timeSurvivedSec * 50) + (this.debrisDeliveredCount * 150);

            if (typeof CampaignManager !== 'undefined' && typeof CampaignManager.recordSurvivalRun === 'function') {
                const sSave = OrbitalStorage.load();
                CampaignManager.recordSurvivalRun(sSave, {
                    timeSurvivedSec: timeSurvivedSec,
                    formattedTime: formattedTime,
                    debrisCollected: this.debrisDeliveredCount,
                    score: survivalScore,
                    rating: rating
                });
            }

            reason = `CASCADE SURVIVED: ${formattedTime} // WAVE ${this.survivalWave} [${rating}]`;
            isVictory = true;
        }

        if (isVictory) {
            window.soundSystem.playMissionSuccess();
        } else {
            window.soundSystem.playMissionFailed();
        }

        // Telemetry conclusion event
        this.logFlightEvent(isVictory ? 'DEORBIT' : 'ABORT', reason, isVictory ? 'success' : 'crit');

        // Efficiency Bonus calculations
        const timeBonus = isVictory ? Math.max(0, Math.floor(this.missionTime * 15)) : 0;
        const healthPercent = this.hull / this.maxHull;
        const healthBonus = isVictory ? Math.floor(healthPercent * 500) : 0;
        const basePayout = isVictory ? (this.contractPayout || this.missionConfig.basePayout) : 100;

        // 1. Requirements Audit Table
        const minTargetMass = this.debrisTargetQuota * 45;
        const actualMass = Math.round(this.missionMassDeorbitedKg || (this.debrisDeliveredCount * 50));
        const finalFuelPct = Math.max(0, Math.round((this.fuel / this.maxFuel) * 100));

        const requirementsAudit = [
            {
                name: 'Orbital Debris Quota',
                target: `≥ ${this.debrisTargetQuota} Units`,
                actual: `${this.debrisDeliveredCount} Units`,
                isPass: this.debrisDeliveredCount >= this.debrisTargetQuota
            },
            {
                name: 'Minimum Cleansed Mass',
                target: `≥ ${minTargetMass} kg`,
                actual: `${actualMass} kg`,
                isPass: actualMass >= minTargetMass
            },
            {
                name: 'Client Collision Tolerance',
                target: `≤ ${this.maxCollisionsAllowed} Impacts`,
                actual: `${this.collisionsCount} Impacts`,
                isPass: this.collisionsCount <= this.maxCollisionsAllowed
            },
            {
                name: 'Propellant Reserve Margin',
                target: `≥ 25% Reserve`,
                actual: `${finalFuelPct}% (${Math.round(this.fuel)} L)`,
                isPass: finalFuelPct >= 25
            },
            {
                name: 'Allocated Time Window',
                target: `≤ ${this.missionConfig.timeLimit}s`,
                actual: `${Math.round(this.elapsedTime)}s`,
                isPass: this.elapsedTime <= this.missionConfig.timeLimit
            }
        ];

        // 2. CONOPS Planned vs Actual Timeline
        const tFirstCapture = this.firstCaptureTime ? `T+${this.firstCaptureTime}s` : 'T+--s';
        const tFirstDock = this.firstDockTime ? `T+${this.firstDockTime}s` : 'T+--s';
        const tEnd = `T+${Math.round(this.elapsedTime)}s`;

        const timelineComparison = [
            { name: 'Stage 01: Launch & Injection', status: 'COMPLETE', timestamp: 'T+00s' },
            { name: 'Stage 02: Orbital Insertion', status: 'NOMINAL', timestamp: 'T+02s' },
            { name: 'Stage 03: Proximity Capture Ops', status: this.firstCaptureTime ? 'EXECUTED' : 'INCOMPLETE', timestamp: tFirstCapture },
            { name: 'Stage 04: Depot Docking & Transfer', status: this.firstDockTime ? 'DELIVERED' : 'INCOMPLETE', timestamp: tFirstDock },
            { name: 'Stage 05: Controlled De-orbit', status: isVictory ? 'DEORBITED' : 'ABORTED', timestamp: tEnd }
        ];

        // 3. Client Contract Bonus Evaluation
        let clientBonusAchieved = false;
        let bonusCredits = 0;
        let clientVerdict = 'Standard Contract Fulfilled';

        if (isVictory) {
            if (this.clientConfig.id === 'esa') {
                if (this.collisionsCount === 0) {
                    clientBonusAchieved = true;
                    bonusCredits = 350;
                    clientVerdict = 'ESA Zero-Anomaly Bonus Awarded (+350 Scrap)';
                } else if (this.collisionsCount > this.maxCollisionsAllowed) {
                    clientVerdict = 'Contract Warning: Exceeded ESA Collision Tolerance';
                }
            } else if (this.clientConfig.id === 'nasa') {
                if (this.debrisDeliveredCount >= this.debrisTargetQuota && finalFuelPct >= 25) {
                    clientBonusAchieved = true;
                    bonusCredits = 300;
                    clientVerdict = 'NASA High-Resilience Corridor Bonus (+300 Scrap)';
                }
            } else if (this.clientConfig.id === 'commercial') {
                if (this.elapsedTime <= (this.missionConfig.timeLimit * 0.6)) {
                    clientBonusAchieved = true;
                    bonusCredits = 400;
                    clientVerdict = 'AeroSat Rapid Turnaround Bonus (+400 Scrap)';
                }
            }
        } else {
            clientVerdict = 'Contract Breached: Mission Incomplete';
        }

        const totalCreditsGained = Math.round((this.creditsEarned + basePayout) * (this.clientPayoutMultiplier || 1.0)) + bonusCredits;
        const totalMissionScore = this.score + timeBonus + healthBonus + (clientBonusAchieved ? 500 : 0);

        // 4. Actionable Redesign Recommendations
        let redesignRecommendation = '';
        if (!isVictory) {
            if (reason.includes('HULL BREACH') || reason.includes('COLLISION')) {
                redesignRecommendation = 'STRUCTURAL REINFORCEMENT NEEDED: Spacecraft succumbed to hypervelocity collision damage. RECOMMENDATION: Upgrade to Titan Hauler Bus (reinforced armor) or select TDRSS Relay for early radar collision warnings.';
            } else if (reason.includes('FUEL') || this.fuel <= 0) {
                redesignRecommendation = 'PROPULSION MARGIN DEFICIT: Propellant reserves depleted before quota was cleared. RECOMMENDATION: Switch to Xenon Hall-Effect Ion Propulsion for high specific impulse or install Auxiliary Titanium Propellant Bladders.';
            } else if (reason.includes('TIME')) {
                redesignRecommendation = 'INTERCEPTION LATENCY DEFICIT: Time window elapsed. RECOMMENDATION: Adopt Lean Architecture (Aero-Dart Scout Bus + Cold Gas) for superior agility and speed.';
            } else {
                redesignRecommendation = 'SYSTEMS ANOMALY: Mission aborted. RECOMMENDATION: Adopt the Balanced Architecture preset (Falcon 9 + Collector + Hypergolic) for optimal mission resilience.';
            }
        } else {
            if (this.collisionsCount > this.maxCollisionsAllowed) {
                redesignRecommendation = `COLLISION MITIGATION ALERT: Sustained ${this.collisionsCount} impacts, violating client limit of ${this.maxCollisionsAllowed}. RECOMMENDATION: Use Robotic Grapple Arm for standoff distance capture, or equip TDRSS Relay for earlier warning.`;
            } else if (finalFuelPct < 25) {
                redesignRecommendation = 'FUEL MARGIN TIGHT: Completed mission but returned with low propellant reserve. RECOMMENDATION: Add Auxiliary Bladders or use Xenon Ion drive on long-distance sectors.';
            } else {
                redesignRecommendation = 'FLIGHT EXCELLENCE: Spacecraft systems performed within all nominal envelopes. Architecture is flight-ready for higher-density sectors.';
            }
        }

        // Calculate Star Rating
        let stars = 1;
        if (isVictory) {
            const thresholds = this.missionConfig.starThresholds;
            if (totalMissionScore >= thresholds[2]) stars = 3;
            else if (totalMissionScore >= thresholds[1]) stars = 2;
            else stars = 1;
        } else {
            stars = 0;
        }

        // Save career progress in LocalStorage using ONE consistent save object
        const save = OrbitalStorage.load();
        save.credits += totalCreditsGained;
        save.totalDebrisRecycled += this.debrisDeliveredCount;
        save.totalMassDeorbitedKg += (this.missionMassDeorbitedKg || (this.debrisDeliveredCount * 50));

        if (isVictory) {
            save.missionsCompleted++;
            const maxLevels = (typeof MISSIONS_DATA !== 'undefined' ? MISSIONS_DATA.length : (GAME_DATA.LEVELS ? GAME_DATA.LEVELS.length : 8));
            if (this.missionConfig.id >= save.unlockedLevels && save.unlockedLevels < maxLevels) {
                save.unlockedLevels = this.missionConfig.id + 1;
            }
            if (totalMissionScore > (save.highScores[this.missionConfig.id] || 0)) {
                save.highScores[this.missionConfig.id] = totalMissionScore;
            }
            if (stars > (save.stars[this.missionConfig.id] || 0)) {
                save.stars[this.missionConfig.id] = stars;
            }
        }

        // Leaderboard recording (recording both successful and failed runs with status)
        let rawSector = this.missionConfig.name;
        if (rawSector.includes(':')) {
            rawSector = rawSector.split(':')[1].trim();
        }
        const sectorClean = rawSector
            .replace('Low Earth Orbit (LEO)', 'LEO Corridor')
            .replace('Sun-Synchronous Polar Orbit', 'Polar Orbit')
            .replace('Critical Collision Storm', 'Kessler Storm')
            .replace('Operation Cleanse - Earth Ring', 'GEO Graveyard')
            .trim();

        const activeCommander = (typeof window !== 'undefined' && window.OrbitalAuth && window.OrbitalAuth.getCurrentUser().callsign) || save.commanderName || 'Commander';
        const leaderboardEntry = {
            name: activeCommander,
            score: totalMissionScore,
            debris: this.debrisDeliveredCount,
            mission: sectorClean,
            date: new Date().toISOString().split('T')[0],
            status: isVictory ? 'CLEARED' : 'FAILED'
        };

        // Submit score via LeaderboardService (remote API + local save sync)
        if (typeof window !== 'undefined' && window.LeaderboardService) {
            window.LeaderboardService.submitScore(leaderboardEntry).catch(e => console.warn('[Game] Leaderboard submit:', e));
        } else {
            if (!Array.isArray(save.leaderboard)) save.leaderboard = [];
            save.leaderboard.push(leaderboardEntry);
            save.leaderboard.sort((a, b) => b.score - a.score);
            if (save.leaderboard.length > 50) {
                save.leaderboard = save.leaderboard.slice(0, 50);
            }
        }

        // Save ONCE with the unified save object
        this.creditsAlreadyAwarded = true;
        OrbitalStorage.save(save);

        // Show Debrief v2 Modal in DOM UI
        if (window.showMissionResultsModal) {
            window.showMissionResultsModal({
                scene: this,
                isVictory,
                reason,
                debrisCount: this.debrisDeliveredCount,
                targetQuota: this.debrisTargetQuota,
                deliveries: this.deliveriesCompleted,
                fuelConsumed: Math.round(this.totalFuelBurned),
                collisions: this.collisionsCount,
                baseScore: this.score,
                timeBonus: timeBonus,
                healthBonus: healthBonus,
                totalScore: totalMissionScore,
                creditsEarned: totalCreditsGained,
                stars: stars,
                levelId: this.missionConfig.id,
                requirementsAudit: requirementsAudit,
                timelineComparison: timelineComparison,
                flightEvents: this.flightEvents || [],
                redesignRecommendation: redesignRecommendation,
                clientVerdict: clientVerdict,
                materialsSession: this.materialsSession || { metal: 0, cells: 0, chips: 0 },
                finalKesslerRisk: this.kesslerRisk || 0,
                designCode: this.designCode || (window.uiController ? window.uiController.generateDesignCode() : '')
            });
        }
    }
}

window.OrbitalGameScene = OrbitalGameScene;
