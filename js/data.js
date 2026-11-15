/**
 * ORBITAL CLEANUP: MISSION ZERO
 * Game Data, Ships, Equipment, Levels, and LocalStorage State Management
 */

const GAME_DATA = {
    // Spacecraft specifications
    SHIPS: {
        scout: {
            id: 'scout',
            name: 'Aero-Dart (Scout)',
            tagline: 'High-speed agile interceptor for rapid precision retrieval',
            speed: 360,
            acceleration: 480,
            turnRate: 240,
            maxFuel: 100,
            fuelBurnRate: 1.1,
            maxBattery: 100,
            batteryRechargeRate: 3.5,
            maxHull: 90,
            cargoCapacity: 3,
            color: 0x00f3ff,
            spriteKey: 'ship_scout',
            cost: 0,
            unlocked: true,
            statsText: {
                speed: '★★★★★',
                handling: '★★★★★',
                cargo: '★★☆☆☆',
                armor: '★★☆☆☆'
            }
        },
        collector: {
            id: 'collector',
            name: 'Orbital Mule (Collector)',
            tagline: 'Multi-purpose orbital sanitation workhorse with balanced payload',
            speed: 300,
            acceleration: 380,
            turnRate: 180,
            maxFuel: 150,
            fuelBurnRate: 1.3,
            maxBattery: 130,
            batteryRechargeRate: 2.5,
            maxHull: 140,
            cargoCapacity: 5,
            color: 0x38bdf8,
            spriteKey: 'ship_collector',
            cost: 0,
            unlocked: true,
            statsText: {
                speed: '★★★☆☆',
                handling: '★★★☆☆',
                cargo: '★★★★☆',
                armor: '★★★☆☆'
            }
        },
        lifter: {
            id: 'lifter',
            name: 'Titan Hauler (Heavy Lifter)',
            tagline: 'Armored industrial tow platform engineered for massive derelicts',
            speed: 230,
            acceleration: 260,
            turnRate: 120,
            maxFuel: 220,
            fuelBurnRate: 1.6,
            maxBattery: 180,
            batteryRechargeRate: 2.0,
            maxHull: 240,
            cargoCapacity: 8,
            color: 0xf59e0b,
            spriteKey: 'ship_lifter',
            cost: 0,
            unlocked: true,
            statsText: {
                speed: '★★☆☆☆',
                handling: '★★☆☆☆',
                cargo: '★★★★★',
                armor: '★★★★★'
            }
        }
    },

    // Collection equipment
    EQUIPMENT: {
        arm: {
            id: 'arm',
            name: 'Robotic Grapple Arm',
            tagline: 'Precision mechanical grappling cable. Single-target with scrap bonus.',
            type: 'arm',
            batteryCost: 10,
            range: 260,
            speed: 600,
            cooldown: 500, // ms
            scrapBonus: 1.35,
            description: 'Fires a high-tensile clamp directly forward to reel in designated targets. Excellent fuel efficiency and high scrap integrity.'
        },
        net: {
            id: 'net',
            name: 'Wide-Angle Capture Net',
            tagline: 'Expanding electromagnetic web. Catches multiple small/medium debris.',
            type: 'net',
            batteryCost: 24,
            range: 220,
            speed: 420,
            radius: 120,
            cooldown: 1100, // ms
            scrapBonus: 1.0,
            description: 'Deploys an expanding energy net that captures all floating debris within its blast radius simultaneously.'
        },
        magnet: {
            id: 'magnet',
            name: 'Magnetic Tractor Beam',
            tagline: 'Continuous magnetic cone. Pulls all nearby metallic debris toward hold.',
            type: 'magnet',
            batteryCostPerSec: 18,
            range: 280,
            pullForce: 450,
            coneAngle: 70, // degrees
            scrapBonus: 1.1,
            description: 'Emits a sustained graviton/magnetic field cone that continuously attracts and pulls orbital debris into your intake.'
        }
    },

    // Payload configuration presets
    PAYLOAD_TUNINGS: {
        balanced: {
            id: 'balanced',
            name: 'Standard Mission Balance',
            desc: 'Factory-standard configuration with balanced fuel, battery, and armor.',
            fuelMod: 1.0,
            batteryMod: 1.0,
            hullMod: 1.0,
            speedMod: 1.0,
            handlingMod: 1.0,
            solarMod: 1.0
        },
        extended_range: {
            id: 'extended_range',
            name: 'Extended Fuel Tank (+40% Fuel, -10% Speed)',
            desc: 'Reinforced auxiliary tanks for deep-orbit sweeping at the cost of slight inertia.',
            fuelMod: 1.4,
            batteryMod: 0.9,
            hullMod: 1.0,
            speedMod: 0.9,
            handlingMod: 1.0,
            solarMod: 1.0
        },
        high_energy: {
            id: 'high_energy',
            name: 'Auxiliary Supercapacitor (+40% Battery, +25% Solar)',
            desc: 'Enhanced battery cells ideal for heavy tractor beam and energy net operations.',
            fuelMod: 0.9,
            batteryMod: 1.4,
            hullMod: 1.0,
            speedMod: 1.0,
            handlingMod: 1.0,
            solarMod: 1.25
        },
        armored: {
            id: 'armored',
            name: 'Nanotube Reinforced Plating (+40% Hull, -15% Handling)',
            desc: 'High-density micro-meteorite shielding for high-density collision zones.',
            fuelMod: 1.0,
            batteryMod: 0.9,
            hullMod: 1.4,
            speedMod: 0.85,
            handlingMod: 0.85,
            solarMod: 1.0
        }
    },

    // Debris classifications with salvage materials yields (Metal, Cells, Chips)
    DEBRIS_TYPES: {
        fragment: {
            id: 'fragment',
            name: 'Structural Bolt & Shards',
            mass: 15,
            points: 120,
            scrap: 15,
            size: 16,
            spriteKey: 'debris_fragment',
            glowColor: 0x94a3b8,
            materials: { metal: 2, cells: 0, chips: 0 },
            description: 'Small metal fragments from shattered booster hulls. High scrap metal density.'
        },
        solar: {
            id: 'solar',
            name: 'Broken Solar Array',
            mass: 45,
            points: 250,
            scrap: 35,
            size: 26,
            spriteKey: 'debris_solar',
            glowColor: 0x38bdf8,
            materials: { metal: 1, cells: 3, chips: 0 },
            description: 'Photovoltaic cells rich in rare earth metals, silicon wafers, and power cells.'
        },
        cubesat: {
            id: 'cubesat',
            name: 'Defunct Research Cubesat',
            mass: 75,
            points: 420,
            scrap: 60,
            size: 28,
            spriteKey: 'debris_cubesat',
            glowColor: 0xa855f7,
            materials: { metal: 1, cells: 1, chips: 2 },
            description: 'Miniaturized satellite chassis containing sensitive avionics and microchips.'
        },
        booster: {
            id: 'booster',
            name: 'Spent Rocket Upper Stage',
            mass: 220,
            points: 750,
            scrap: 110,
            size: 42,
            spriteKey: 'debris_booster',
            glowColor: 0xf97316,
            materials: { metal: 5, cells: 0, chips: 1 },
            description: 'Massive titanium propulsion tank left in drifting orbit. Rich in structural metal alloy.'
        },
        satellite: {
            id: 'satellite',
            name: 'Derelict Comms Satellite',
            mass: 380,
            points: 1200,
            scrap: 180,
            size: 46,
            spriteKey: 'debris_satellite',
            glowColor: 0x22c55e,
            materials: { metal: 4, cells: 2, chips: 3 },
            description: 'Decommissioned telecommunications orbiter with high-gain antennas and guidance chips.'
        },
        core: {
            id: 'core',
            name: 'Prototype Fusion Module',
            mass: 160,
            points: 2000,
            scrap: 300,
            size: 32,
            spriteKey: 'debris_core',
            glowColor: 0xe11d48,
            materials: { metal: 3, cells: 4, chips: 5 },
            description: 'Experimental classified core with intact cryogenic capacitors and quantum chips.'
        }
    },

    // Hazard types (Phase 4: hidden small debris and venting rocket upper-stage bodies)
    HAZARD_TYPES: {
        hidden_debris: {
            id: 'hidden_debris',
            name: 'Hidden Micro-Debris',
            damage: 32,
            speed: 250,
            spriteKey: 'hazard_hidden_debris',
            glowColor: 0x94a3b8,
            warningRadius: 220,
            radarCrossSection: 0.25,
            desc: 'Low-observability composite shard traveling along orbital inclination crossing vectors.'
        },
        venting_rocket: {
            id: 'venting_rocket',
            name: 'Venting Rocket Upper-Stage',
            damage: 50,
            speed: 65,
            spriteKey: 'hazard_venting_rocket',
            glowColor: 0xf97316,
            warningRadius: 320,
            desc: 'Derelict pressurized booster stage periodically releasing high-velocity toxic plumes.'
        },
        nuclear: {
            id: 'nuclear',
            name: 'Defunct RTG Nuclear Satellite',
            damage: 20,
            radiationRadius: 180,
            batteryDrain: 15,
            spriteKey: 'hazard_nuclear',
            glowColor: 0x84cc16,
            warningRadius: 320,
            desc: 'Derelict Cold War probe emitting an active electromagnetic radiation sphere.'
        },
        // Backward-compatibility aliases for legacy levels or saves
        meteoroid: {
            id: 'hidden_debris',
            name: 'Hidden Micro-Debris',
            damage: 32,
            speed: 250,
            spriteKey: 'hazard_hidden_debris',
            glowColor: 0x94a3b8,
            warningRadius: 220,
            radarCrossSection: 0.25,
            desc: 'Low-observability composite shard traveling along orbital inclination crossing vectors.'
        },
        hypergolic: {
            id: 'venting_rocket',
            name: 'Venting Rocket Upper-Stage',
            damage: 50,
            speed: 65,
            spriteKey: 'hazard_venting_rocket',
            glowColor: 0xf97316,
            warningRadius: 320,
            desc: 'Derelict pressurized booster stage periodically releasing high-velocity toxic plumes.'
        }
    },

    // Mission Levels - Defined dynamically from data/missions.js
    LEVELS: (typeof MISSIONS_DATA !== 'undefined' && Array.isArray(MISSIONS_DATA) && MISSIONS_DATA.length > 0)
        ? MISSIONS_DATA
        : [
        {
            id: 1,
            name: 'Sector 01: LEO Station Corridor',
            subtitle: 'ISS Protection Corridor (Alt: 420 km)',
            altitudeKm: 420,
            inclination: '51.6° LEO',
            orbitalPeriodMin: 92.8,
            objective: 'TUTORIAL / CORRIDOR CLEARANCE: Collect 8 loose debris items to secure the ISS arrival corridor.',
            historicalReference: '[FACT - NASA ODPO] The International Space Station (ISS) orbits at an average altitude of ~420 km with a 51.6° orbital inclination. Between 1999 and 2024, the ISS conducted over 35 Debris Avoidance Maneuvers (DAMs). [ESTIMATE] This mission models local intercept and retrieval of discarded cubesats and solar array fragments.',
            briefing: 'A recent second-stage separation has created a debris trail crossing the international space station traffic lane. Clear the zone before scheduled crew dragon arrival.',
            targetQuota: 8,
            debrisTypes: ['fragment', 'solar', 'cubesat'],
            initialDebrisCount: 16,
            respawnRate: 4000,
            hazardRate: 16000,
            hazardTypes: ['hidden_debris'],
            maxHazards: 2,
            timeLimit: 150,
            worldSize: { width: 3200, height: 3200 },
            basePayout: 500,
            starThresholds: [800, 1800, 3000]
        }
    ],

    // Upgrades Available in Hangar
    UPGRADES: {
        engine: {
            id: 'engine',
            name: 'Ion-Thruster Efficiency',
            description: 'Reduces fuel burn rate by 12% and boosts top cruising speed by 8% per level.',
            maxLevel: 5,
            costPerLevel: [200, 450, 800, 1400, 2200],
            effectDesc: '-12% Fuel Burn, +8% Top Speed'
        },
        hull: {
            id: 'hull',
            name: 'Nanotube Armor Weave',
            description: 'Increases spacecraft maximum hull integrity by 20% and reduces impact collision damage by 15% per tier.',
            maxLevel: 5,
            costPerLevel: [250, 500, 900, 1500, 2400],
            effectDesc: '+20% Hull Integrity, -15% Impact Damage per tier'
        },
        battery: {
            id: 'battery',
            name: 'Photovoltaic Fusion Cell',
            description: 'Expands battery capacity by 20% and increases solar recharge velocity.',
            maxLevel: 5,
            costPerLevel: [200, 400, 750, 1300, 2000],
            effectDesc: '+20% Battery Pool, +25% Recharge Speed'
        },
        cargo: {
            id: 'cargo',
            name: 'Cargo Bay Compression Field',
            description: 'Adds +1 debris storage slot to any ship payload capacity per tier.',
            maxLevel: 4,
            costPerLevel: [350, 750, 1500, 2800],
            effectDesc: '+1 Debris Cargo Slot per rank'
        },
        sensor: {
            id: 'sensor',
            name: 'Deep-Space Telemetry Radar',
            description: 'Extends proximity warning radar range and enhances magnetic collection suction radius.',
            maxLevel: 5,
            costPerLevel: [180, 380, 700, 1200, 1900],
            effectDesc: '+15% Radar Detection Range & Magnet Suction'
        }
    }
};

/**
 * Storage Manager for Persistent Progress
 */
class OrbitalStorage {
    static STORAGE_KEY = 'orbital_cleanup_mission_zero_save';

    static getDefaultSave() {
        return {
            credits: 200,
            materials: {
                metal: 0,
                cells: 0,
                chips: 0
            },
            totalDebrisRecycled: 0,
            totalMassDeorbitedKg: 0,
            missionsCompleted: 0,
            highScores: { 1: 0, 2: 0, 3: 0, 4: 0 },
            stars: { 1: 0, 2: 0, 3: 0, 4: 0 },
            unlockedLevels: 1,
            upgrades: {
                engine: 0,
                hull: 0,
                battery: 0,
                cargo: 0,
                sensor: 0
            },
            selectedShip: 'scout',
            selectedEquipment: 'arm',
            selectedPayload: 'balanced',
            soundSettings: {
                sfx: true,
                music: true
            },
            commanderName: 'Commander',
            leaderboard: [
                { name: 'Cmdr. Shepard', score: 18450, debris: 74, mission: 'GEO Graveyard', date: 'Archive Record' },
                { name: 'Dr. Ryan Stone', score: 14200, debris: 58, mission: 'Kessler Storm', date: 'Archive Record' },
                { name: 'Capt. Cooper', score: 11900, debris: 46, mission: 'Polar Orbit', date: 'Archive Record' },
                { name: 'Aegis Vanguard', score: 8500, debris: 35, mission: 'LEO Corridor', date: 'Archive Record' }
            ]
        };
    }

    static load() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            const defaultSave = this.getDefaultSave();
            if (!raw) return defaultSave;
            const data = JSON.parse(raw);
            const merged = Object.assign({}, defaultSave, data);
            if (!merged.materials || typeof merged.materials !== 'object') {
                merged.materials = { metal: 0, cells: 0, chips: 0 };
            } else {
                merged.materials = Object.assign({ metal: 0, cells: 0, chips: 0 }, merged.materials);
            }
            if (!merged.commanderName) merged.commanderName = 'Commander';
            if (!Array.isArray(merged.leaderboard) || merged.leaderboard.length === 0) {
                merged.leaderboard = defaultSave.leaderboard;
            }
            return merged;
        } catch (e) {
            console.error('Failed to load save state:', e);
            return this.getDefaultSave();
        }
    }

    static save(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save state:', e);
        }
    }

    static addHighScore(entry) {
        const data = this.load();
        if (!data.leaderboard) data.leaderboard = [];
        data.leaderboard.push(entry);
        data.leaderboard.sort((a, b) => b.score - a.score);
        if (data.leaderboard.length > 8) {
            data.leaderboard = data.leaderboard.slice(0, 8);
        }
        this.save(data);
        return data;
    }
}

// Global State
window.GAME_DATA = GAME_DATA;
window.OrbitalStorage = OrbitalStorage;

