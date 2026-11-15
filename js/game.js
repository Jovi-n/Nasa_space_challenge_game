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

        // Client Constraints & Objectives
        this.clientConfig = this.pointDesign.client || (typeof PARTS_DATA !== 'undefined' ? PARTS_DATA.clients.esa : { id: 'esa', name: 'ESA Clean Space', payoutMultiplier: 1.25, maxCollisionsAllowed: 1 });
        this.maxCollisionsAllowed = this.clientConfig.maxCollisionsAllowed || 3;
        this.clientPayoutMultiplier = this.clientConfig.payoutMultiplier || 1.0;
        this.clientBonusCondition = this.clientConfig.bonusCondition || 'Zero collisions and safe return';

        // Mission Run State
        this.score = 0;
        this.creditsEarned = 0;
        this.debrisDeliveredCount = 0;
        this.debrisTargetQuota = this.missionConfig.targetQuota;
        this.deliveriesCompleted = 0;
        this.collisionsCount = 0;
        this.totalFuelBurned = 0;
        this.missionMassDeorbitedKg = 0;
        this.missionTime = this.missionConfig.timeLimit;
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

        // Phase 3 Data-Driven Scripted Events & Sector Atmospheric Drag
        this.triggeredScriptedEvents = new Set();
        this.activeAtmosphericDrag = 1.0;
        this.activeEventAlert = null;
        this.eventAlertTimer = 0;
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

        // 8. Collisions and Overlaps
        this.physics.add.collider(this.player, this.debrisGroup, this.handleShipDebrisBump, null, this);
        this.physics.add.collider(this.debrisGroup, this.debrisGroup);
        this.physics.add.overlap(this.player, this.hazardGroup, this.handleShipHazardCollision, null, this);

        // 9. Particle Managers
        this.createParticleSystems();

        // 10. Direct Graphics Overlay for Tether, Tractor Beam, & Indicators
        this.fxGraphics = this.add.graphics().setDepth(20);
        this.hudGraphics = this.add.graphics().setDepth(100).setScrollFactor(0);

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

        // Distant Parallax Stars (Generated once on graphics layer with sector colors)
        const starGraphics = this.add.graphics().setDepth(-10);
        const starColors = palette.starColors || [0xffffff, 0x38bdf8, 0xa855f7, 0xfde047];
        for (let i = 0; i < 600; i++) {
            const x = Phaser.Math.Between(0, w);
            const y = Phaser.Math.Between(0, h);
            const r = Phaser.Math.FloatBetween(0.5, 2.0);
            const alpha = Phaser.Math.FloatBetween(0.3, 0.95);
            const color = Phaser.Utils.Array.GetRandom(starColors);

            starGraphics.fillStyle(color, alpha);
            starGraphics.fillCircle(x, y, r);
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

        const targetX = this.player.x + Phaser.Math.Between(-250, 250);
        const targetY = this.player.y + Phaser.Math.Between(-250, 250);
        const trajectory = Phaser.Math.Angle.Between(x, y, targetX, targetY);
        const speed = (hazardMeta.speed || 180) * 1.1;

        hazard.setVelocity(Math.cos(trajectory) * speed, Math.sin(trajectory) * speed);
        hazard.setAngularVelocity(Phaser.Math.Between(-80, 80));
        hazard.body.setCircle(20, hazard.width / 2 - 20, hazard.height / 2 - 20);

        this.time.delayedCall(22000, () => {
            if (hazard && hazard.active) {
                hazard.destroy();
            }
        });
    }

    /**
     * Triggers a scripted narrative or tactical event from mission configuration
     */
    triggerScriptedEvent(evt) {
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
    }

    spawnInitialDebris() {
        const count = this.missionConfig.initialDebrisCount;
        for (let i = 0; i < count; i++) {
            this.spawnDebrisItem();
        }
    }

    spawnDebrisItem() {
        if (this.debrisGroup.countActive(true) >= this.missionConfig.initialDebrisCount + 10) return;

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
        const hazardMeta = GAME_DATA.HAZARD_TYPES[hazardKey];

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

        // Trajectory aimed towards player's general sector with jitter
        const targetX = this.player.x + Phaser.Math.Between(-300, 300);
        const targetY = this.player.y + Phaser.Math.Between(-300, 300);
        const trajectory = Phaser.Math.Angle.Between(x, y, targetX, targetY);
        const speed = hazardMeta.speed || 180;

        hazard.setVelocity(Math.cos(trajectory) * speed, Math.sin(trajectory) * speed);
        hazard.setAngularVelocity(Phaser.Math.Between(-80, 80));
        hazard.body.setCircle(20, hazard.width / 2 - 20, hazard.height / 2 - 20);

        // Auto destroy after lifespan to avoid clutter
        this.time.delayedCall(22000, () => {
            if (hazard && hazard.active) {
                hazard.destroy();
            }
        });
    }

    update(time, delta) {
        if (this.isMissionOver) return;

        const dt = delta / 1000;
        this.elapsedTime += dt;
        this.missionTime -= dt;

        // Process any queued physics actions safely at frame start
        this.processPendingPhysicsActions();

        // Clear graphics overlay
        this.fxGraphics.clear();
        this.hudGraphics.clear();

        // 1. Check Win / Loss Time limits
        if (this.missionTime <= 0) {
            this.handleMissionEnd(false, 'TIME LIMIT EXCEEDED - ORBITAL WINDOW LOST');
            return;
        }

        // 2. Handle Player Spaceflight Controls
        this.handlePlayerControls(dt);

        // 3. Equipment Updates & Mechanics
        this.handleEquipment(dt, time);

        // 4. Station Docking & Recycling Mechanics
        this.handleStationDocking(dt);

        // 5. Environmental Hazards & Collision Warning Radar
        this.handleProximityRadar(dt);

        // 6. Passive Solar Battery Recharge
        if (this.battery < this.maxBattery) {
            this.battery = Math.min(this.maxBattery, this.battery + this.batteryRechargeRate * dt);
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

        // 7. Data-Driven Scripted Events Handling
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

        // 8. Update Game HUD DOM
        if (window.updateGameHUD) {
            window.updateGameHUD(this);
        }
    }

    handlePlayerControls(dt) {
        let isThrusting = false;
        let isTurning = false;

        // Angular Rotation (A/D or Left/Right)
        if (this.cursors.left.isDown || this.keyA.isDown) {
            this.player.setAngularVelocity(-this.turnRate);
            isTurning = true;
        } else if (this.cursors.right.isDown || this.keyD.isDown) {
            this.player.setAngularVelocity(this.turnRate);
            isTurning = true;
        } else {
            this.player.setAngularVelocity(0);
        }

        // Forward Propulsion (W or Up Arrow)
        if ((this.cursors.up.isDown || this.keyW.isDown) && this.fuel > 0) {
            isThrusting = true;
            const angle = this.player.rotation;
            const dragMod = this.activeAtmosphericDrag || 1.0;
            const ax = Math.cos(angle) * this.acceleration * dragMod;
            const ay = Math.sin(angle) * this.acceleration * dragMod;

            this.player.setAcceleration(ax, ay);

            // Fuel Burn
            const burn = this.fuelBurnRate * dt * 4.0;
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
            const burn = this.fuelBurnRate * dt * 2.0;
            this.fuel = Math.max(0, this.fuel - burn);
            this.totalFuelBurned += burn;
            window.soundSystem.setThruster(true, 0.4);
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

        // Draw Grapple Tether Cable & Claw
        this.fxGraphics.lineStyle(2.5, 0x00f3ff, 0.9);
        this.fxGraphics.beginPath();
        this.fxGraphics.moveTo(this.player.x, this.player.y);
        this.fxGraphics.lineTo(g.currentX, g.currentY);
        this.fxGraphics.strokePath();

        // Claw Head
        this.fxGraphics.fillStyle(0x38bdf8, 1);
        this.fxGraphics.fillCircle(g.currentX, g.currentY, 5);
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
            if (hazard && hazard.active) {
                hazard.destroy();
            }
        }
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

        // Draw animated luminous magnetic cone
        this.fxGraphics.fillStyle(0x00f3ff, 0.12);
        this.fxGraphics.lineStyle(1.5, 0x38bdf8, 0.45);
        this.fxGraphics.beginPath();
        this.fxGraphics.moveTo(this.player.x, this.player.y);
        this.fxGraphics.arc(this.player.x, this.player.y, range, angle - halfCone, angle + halfCone);
        this.fxGraphics.closePath();
        this.fxGraphics.fillPath();
        this.fxGraphics.strokePath();

        // Visible intake/collection indicator at ship intake
        this.fxGraphics.lineStyle(2, 0x00f3ff, 0.65);
        this.fxGraphics.strokeCircle(this.player.x, this.player.y, 28);

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

                    // Pull debris towards player intake
                    const pull = this.equipmentConfig.pullForce;
                    const pullAngle = Phaser.Math.Angle.Between(d.x, d.y, this.player.x, this.player.y);
                    d.body.velocity.x += Math.cos(pullAngle) * pull * dt;
                    d.body.velocity.y += Math.sin(pullAngle) * pull * dt;

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

        // Show docking prompt or auto dock when stationary inside zone
        const pressDock = Phaser.Input.Keyboard.JustDown(this.keyE);
        const isStationary = this.player.body.velocity.length() < 35;

        if (inDockRange && (pressDock || (isStationary && this.cargo.length > 0))) {
            this.processStationRecycling();
        }
    }

    isNearStation() {
        return Phaser.Math.Distance.Between(this.player.x, this.player.y, this.station.x, this.station.y) < 400;
    }

    processStationRecycling() {
        if (this.isDocked) return;
        this.isDocked = true;

        // Play docking and recycling sequence
        window.soundSystem.playDockingRecycle();

        // Lock player briefly
        this.player.setVelocity(0, 0);

        let roundScore = 0;
        let roundCredits = 0;
        let itemsCount = this.cargo.length;

        // Apply equipment scrap multiplier
        const bonus = this.equipmentConfig.scrapBonus || 1.0;

        this.cargo.forEach(item => {
            roundScore += Math.floor(item.points * bonus);
            roundCredits += Math.floor(item.scrap * bonus);
            this.debrisDeliveredCount++;
            this.missionMassDeorbitedKg = (this.missionMassDeorbitedKg || 0) + (item.mass || 50);
        });

        this.score += roundScore;
        this.creditsEarned += roundCredits;
        if (itemsCount > 0) {
            this.deliveriesCompleted++;
            this.firstDockTime = this.firstDockTime || Math.max(2, Math.round(this.elapsedTime));
            this.logFlightEvent('DEPOT_DOCK', `Soft docked with Aegis Depot. Offloaded ${itemsCount} items (${this.debrisDeliveredCount}/${this.debrisTargetQuota} quota).`, 'success');
        }

        // Refuel, Recharge battery, Repair hull at the station depot!
        this.fuel = this.maxFuel;
        this.battery = this.maxBattery;
        this.hull = this.maxHull;
        this.loggedLowFuel = false;
        this.loggedLowBat = false;

        // Emit recycling particle fountain
        this.recycleParticles.emitParticleAt(this.station.x, this.station.y, 30);

        if (itemsCount > 0) {
            this.showFloatingText(this.station.x, this.station.y - 40, `+${roundScore} PTS | +${roundCredits} SCRAP`, '#10b981');
        } else {
            this.showFloatingText(this.station.x, this.station.y - 40, 'SYSTEMS FULLY REPAIRED & REFUELED', '#38bdf8');
        }

        this.cargo = []; // Empty cargo hold

        // Check if Mission Victory Quota is achieved!
        if (this.debrisDeliveredCount >= this.debrisTargetQuota) {
            this.time.delayedCall(1200, () => {
                this.handleMissionEnd(true, 'ORBITAL ZONE SUCCESSFULLY CLEANSED');
            });
        } else {
            this.time.delayedCall(1000, () => {
                this.isDocked = false;
            });
        }
    }

    handleProximityRadar(dt) {
        let imminentDanger = false;
        const frameDt = (typeof dt === 'number' && dt > 0) ? dt : (1 / 60);

        // Check all hazards for proximity
        this.hazardGroup.getChildren().forEach(h => {
            if (!h.active) return;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, h.x, h.y);

            // Dynamic warning radius based on hazard metadata and sensor upgrade
            const hazardWarningDist = (h.hazardMeta.warningRadius || 320) * this.radarMultiplier;

            // Proximity warning trigger
            if (dist < hazardWarningDist) {
                imminentDanger = true;
            }

            // If hazard is a nuclear satellite, emit continuous radiation drain per second
            if (h.hazardMeta.id === 'nuclear' && dist < h.hazardMeta.radiationRadius) {
                this.battery = Math.max(0, this.battery - h.hazardMeta.batteryDrain * frameDt);
                this.fxGraphics.lineStyle(1.5, 0x84cc16, 0.4);
                this.fxGraphics.strokeCircle(h.x, h.y, h.hazardMeta.radiationRadius);
            }
        });

        // Trigger Audio & Visual Warning Alert
        if (imminentDanger) {
            if (!this.warningActive) {
                this.warningActive = true;
                window.soundSystem.playWarning(true);
            }
        } else {
            if (this.warningActive) {
                this.warningActive = false;
                window.soundSystem.playWarning(false);
            }
        }

        // Draw offscreen directional indicator arrows towards Station and Hazards
        this.drawHUDOffscreenPointers();
    }

    drawHUDOffscreenPointers() {
        const cam = this.cameras.main;
        const viewW = cam.width;
        const viewH = cam.height;
        const padding = 35;

        // Pointer helper
        const drawIndicator = (targetX, targetY, color, isStation = false) => {
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

            this.hudGraphics.fillStyle(color, 0.85);
            this.hudGraphics.beginPath();
            const arrowSize = isStation ? 12 : 8;
            this.hudGraphics.fillCircle(edgeX, edgeY, arrowSize);
        };

        // Pointer to Aegis Station (Green)
        drawIndicator(this.station.x, this.station.y, 0x10b981, true);

        // Pointers to active hazards (Red)
        this.hazardGroup.getChildren().forEach(h => {
            if (h.active) {
                drawIndicator(h.x, h.y, 0xef4444, false);
            }
        });
    }

    handleShipDebrisBump(player, debris) {
        if (!debris || !debris.active) return;

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

        // Low-speed contact (< 60 px/s) -> negligible damage; continuous contact does NOT drain health
        if (impactSpeed < 60) {
            return;
        }

        debris.lastDamageTime = now;
        window.soundSystem.playCollision();
        this.collisionsCount++;

        // Meaningful high-speed impact damage scaling
        const severity = (impactSpeed - 60) / 160;
        const impactDamage = Math.max(3, Math.min(32, Math.round(10 * severity * this.damageReduction)));
        this.hull = Math.max(0, this.hull - impactDamage);

        this.logFlightEvent('IMPACT', `Debris collision at ${Math.round(impactSpeed)} px/s (-${impactDamage} Hull).`, 'crit');
        this.cameras.main.shake(120, Math.min(0.015, 0.003 * severity));
        this.sparkParticles.emitParticleAt(player.x, player.y, 8);
        this.showFloatingText(player.x, player.y - 25, `-${impactDamage} HULL`, '#f59e0b');

        if (this.hull <= 0) {
            this.handleMissionEnd(false, 'HULL BREACH - SPACECRAFT DESTROYED');
        }
    }

    handleShipHazardCollision(player, hazard) {
        if (!hazard || !hazard.active) return;

        window.soundSystem.playExplosion();
        this.collisionsCount++;

        const dmg = (hazard.hazardMeta.damage || 35) * this.damageReduction;
        this.hull = Math.max(0, this.hull - dmg);

        this.logFlightEvent('HAZARD', `Orbital anomaly collision! (-${Math.round(dmg)} Hull).`, 'crit');

        this.cameras.main.shake(300, 0.02);
        this.sparkParticles.emitParticleAt(hazard.x, hazard.y, 25);
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
        const basePayout = isVictory ? this.missionConfig.basePayout : 100;

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

        const leaderboardEntry = {
            name: save.commanderName || 'Commander',
            score: totalMissionScore,
            debris: this.debrisDeliveredCount,
            mission: sectorClean,
            date: new Date().toISOString().split('T')[0],
            status: isVictory ? 'CLEARED' : 'FAILED'
        };

        if (!Array.isArray(save.leaderboard)) save.leaderboard = [];
        save.leaderboard.push(leaderboardEntry);
        save.leaderboard.sort((a, b) => b.score - a.score);
        if (save.leaderboard.length > 8) {
            save.leaderboard = save.leaderboard.slice(0, 8);
        }

        // Save ONCE with the unified save object
        OrbitalStorage.save(save);

        // Show Debrief v2 Modal in DOM UI
        if (window.showMissionResultsModal) {
            window.showMissionResultsModal({
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
                designCode: this.designCode || (window.uiController ? window.uiController.generateDesignCode() : '')
            });
        }
    }
}

window.OrbitalGameScene = OrbitalGameScene;
